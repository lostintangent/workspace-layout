import { TextDecoder } from "util";
import * as vscode from "vscode";
import { EXTENSION_NAME } from "./constants";
import { prepareLayout } from "./layout";

export async function activate(context: vscode.ExtensionContext) {
  if (!vscode.workspace.workspaceFolders) {
    return;
  }

  vscode.window.registerWebviewViewProvider("workspace-layout.readme", {
    resolveWebviewView: async (webView) => {
      const readmeUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, "README.md");
      const bytes = await vscode.workspace.fs.readFile(readmeUri);
      const contents = new TextDecoder().decode(bytes);

      const md = require("markdown-it")();
      webView.webview.html = md.render(contents)
    }
  });

  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${EXTENSION_NAME}.closeReadme`,
      () => vscode.commands.executeCommand("setContext", "workspace-layout:showReadme", false)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${EXTENSION_NAME}.resetLayout`,
      prepareLayout
    )
  );

  prepareLayout(context.workspaceState);
}
