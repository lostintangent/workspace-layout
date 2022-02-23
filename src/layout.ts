import { TextDecoder } from "util";
import * as vscode from "vscode";
import { EXTENSION_NAME, IS_CODESPACE } from "./constants";
import { createFiles } from "./files";
import { createTerminals } from "./terminals";

const HAS_LAYOUT_CONTEXT_KEY = `${EXTENSION_NAME}:hasLayout`;
const HAS_RUN_CONTEXT_KEY = `${EXTENSION_NAME}:hasRun`;

const devcontainerPaths = [
  ".devcontainer.json",
  ".devcontainer/devcontainer.json",
];

export async function prepareLayout(memento: vscode.Memento) {
  const workspaceFolder = vscode.workspace.workspaceFolders![0];

  let devcontainerUri: vscode.Uri | undefined;
  for (let devcontainerPath of devcontainerPaths) {
    const uri = vscode.Uri.joinPath(workspaceFolder.uri, devcontainerPath);

    try {
      await vscode.workspace.fs.stat(uri);
      devcontainerUri = uri;
      break;
    } catch {}
  }

  if (!devcontainerUri) {
    return;
  }

  const fileBytes = await vscode.workspace.fs.readFile(devcontainerUri);
  const fileContents = new TextDecoder().decode(fileBytes);

  if (!fileContents) {
    return;
  }

  try {
    const devcontainer = JSON.parse(fileContents);
    if (!devcontainer.workspace) {
      return;
    }

    if (memento) {
      await vscode.commands.executeCommand(
        "setContext",
        HAS_LAYOUT_CONTEXT_KEY,
        true
      );

      const hasRun = memento.get(HAS_RUN_CONTEXT_KEY, false);
      if (hasRun) {
        return;
      }

      await memento.update(HAS_RUN_CONTEXT_KEY, true);
    }

    const isActivation = memento;

    // We want to reset the layout in two cases:
    // 1) This is an explicit reset request (as opposed to an activation)
    // 2) This is an activiation, but not within a IS_CODESPACE. In the case
    //    of Codespaces, we don't want to remove the setup terminal or README
    //    that is automatically launched on behalf of the user.
    const resetLayout = !isActivation || !IS_CODESPACE;

    // Since Codespaces launches a default terminal, we want to
    // delay the layout on activations, in order to prevent clashes.
    const delay = isActivation && IS_CODESPACE ? 2000 : 0;

    setTimeout(() => {
      createFiles(devcontainer.workspace, resetLayout);
      createTerminals(devcontainer.workspace, resetLayout);
    }, delay);
  } catch {
    console.error("Workspace layout configuration appears to be invalid JSON.");
  }
}
