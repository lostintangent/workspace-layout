import { parse } from "jsonc-parser";
import { TextDecoder } from "util";
import * as vscode from "vscode";
import { EXTENSION_NAME, IS_CODESPACE } from "./constants";
import { createFiles } from "./files";
import { createTerminals } from "./terminals";
import * as child_process from "child_process";

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
    } catch { }
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
    const devcontainer = parse(fileContents);
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

    const isCodespaceActivation = memento && IS_CODESPACE;
    const workspaceConfig = devcontainer.workspace;

    setTimeout(async () => {
      if (workspaceConfig.files) {
        createFiles(workspaceConfig.files);
      }

      if (workspaceConfig.view) {
        try {
          let view = workspaceConfig.view
          if (view === "readme") {
            view = "workspace-layout.readme";
          }

          if (view === "workspace-layout.readme") {
            await vscode.commands.executeCommand("setContext", "workspace-layout:showReadme", true)
          }

          vscode.commands.executeCommand(`${view}.focus`);
        } catch {
          console.error("The configured view wasn't found: ", workspaceConfig.view)
        }
      }

      if (workspaceConfig.terminals) {
        if (!vscode.workspace.isTrusted) {
          // Wait for the user to grant trust to the workspace,
          // before attempting to launch any configured terminals.
          const trustHandler = vscode.workspace.onDidGrantWorkspaceTrust(() => {
            createTerminals(workspaceConfig.terminals);
            trustHandler.dispose();
          });

          return;
        }

        if (isCodespaceActivation) {
          child_process.execSync("touch $HOME/.config/vscode-dev-containers/first-run-notice-already-displayed");
        }

        createTerminals(workspaceConfig.terminals);
      }
    }, isCodespaceActivation ? 5000 : 0);
  } catch {
    console.error("Workspace layout configuration appears to be invalid JSON.");
  }
}
