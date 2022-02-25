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
      webView.webview.options = {
        enableCommandUris: true,
        enableScripts: true,
        localResourceRoots: [vscode.workspace.workspaceFolders![0].uri]
      };

      const readmeUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, "README.md");
      const bytes = await vscode.workspace.fs.readFile(readmeUri);
      const contents = new TextDecoder().decode(bytes);

      const md = require("markdown-it")();
      const html = md.render(contents);

      webView.webview.html = `<html>
<head>
      <base href="${webView.webview.asWebviewUri(readmeUri)}" />
</head>
<body>
${html}
</body>
</html>`
    }});

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
