import { parse } from "jsonc-parser";
import { TextDecoder } from "util";
import * as vscode from "vscode";
import { EXTENSION_NAME, IS_CODESPACE } from "./constants";
import { createFiles } from "./files";
import { createTerminals } from "./terminals";
import * as child_process from "child_process";

const HAS_LAYOUT_CONTEXT_KEY = `${EXTENSION_NAME}:hasLayout`;
const HAS_README_CONTEXT_KEY = `${EXTENSION_NAME}:hasReadme`;

const settingsPaths = [
  ".vscode/settings.json",
  ".devcontainer.json",
  ".devcontainer/devcontainer.json",
];

export async function prepareLayout(memento: vscode.Memento) {
  let settings = await getSettings();
  if (!settings) {
    return;
  }

  if (memento) {
    await vscode.commands.executeCommand(
      "setContext",
      HAS_LAYOUT_CONTEXT_KEY,
      true
    );
  }

  const isCodespaceActivation = memento && IS_CODESPACE;

  // Defaults
  if (settings === true) {
    settings = {
      "view": "readme",
      "files": [],
      "terminals": [""]
    };
  }
  else {
    if (!("view" in settings)) {
      settings.view = "readme";
    }
    if (!("files" in settings)) {
      settings.files = [];
    }
    if (!("terminals" in settings)) {
      settings.terminals = [""];
    }
    if (!("browser" in settings)) {
      settings.browser = null;
    }
  }

  setTimeout(async () => {
    if (settings.view) {
      try {
        let view = settings.view;
        if (view === "readme") {
          view = "workspace-layout.readme";
          await vscode.commands.executeCommand(
            "setContext",
            HAS_README_CONTEXT_KEY,
            true
          );
        }
        if (view) {
          vscode.commands.executeCommand(`${view}.focus`);
        }
      } catch {
        console.error("The configured view wasn't found: ", settings.view);
      }
    }

    if (settings.terminals) {
      if (!vscode.workspace.isTrusted) {
        // Wait for the user to grant trust to the workspace,
        // before attempting to launch any configured terminals.
        const trustHandler = vscode.workspace.onDidGrantWorkspaceTrust(() => {
          createTerminals(settings.terminals);
          trustHandler.dispose();
        });
        return;
      }
      if (isCodespaceActivation) {
        child_process.execSync("touch $HOME/.config/vscode-dev-containers/first-run-notice-already-displayed");
      }
      createTerminals(settings.terminals);

      if (settings.files) {
        await createFiles(settings.files);
      }

      if (settings.browser) {
        await vscode.commands.executeCommand("simpleBrowser.api.open",
          vscode.Uri.parse(settings.browser), { viewColumn: vscode.ViewColumn.Beside });
      }

      // Activate first editor in each group, from right to left
      for (let i = vscode.window.tabGroups.all.length - 1; i >= 0; i--) {
        const tabGroup = vscode.window.tabGroups.all[i];
        if (tabGroup.tabs.length > 0) {
          const input = tabGroup.tabs[0].input as vscode.TabInputText;
          vscode.window.showTextDocument(input.uri, { viewColumn: i + 1 });
        }
      }
    }
  }, isCodespaceActivation ? 5000 : 0);
}

async function getSettings() {
  const workspaceFolder = vscode.workspace.workspaceFolders![0];
  for (let settingsPath of settingsPaths) {
    const uri = vscode.Uri.joinPath(workspaceFolder.uri, settingsPath);
    let fileContents;
    try {
      const fileBytes = await vscode.workspace.fs.readFile(uri);
      fileContents = new TextDecoder().decode(fileBytes);
    }
    catch {
      continue;
    }
    let settings;
    try {
      settings = parse(fileContents);
    }
    catch {
      console.error("Invalid JSON in " + settingsPath);
      continue;
    }
    if ("workspace" in settings) {
      const workspace = settings.workspace;
      if (workspace === true || typeof workspace === "object") {
        return workspace;
      }
      console.error("Invalid value for workspace in " + settingsPath);
    }
  }
  return null;
}