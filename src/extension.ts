import Markdoc from "@markdoc/markdoc";
import { TextDecoder } from "util";
import * as vscode from "vscode";
import { EXTENSION_NAME } from "./constants";
import { prepareLayout } from "./layout";

const readmePaths = [
  "README.md",
  ".github/README.md"
];

export async function activate(context: vscode.ExtensionContext) {
  if (!vscode.workspace.workspaceFolders) {
    return;
  }

  vscode.window.registerWebviewViewProvider("workspace-layout.readme", {
    resolveWebviewView: async (webView) => {
      const workspaceFolder = vscode.workspace.workspaceFolders![0];
      webView.webview.options = {
        enableCommandUris: true,
        enableScripts: true,
        localResourceRoots: [workspaceFolder.uri]
      };

      let readmeUri: vscode.Uri | undefined;
      for (let readmePath of readmePaths) {
        const uri = vscode.Uri.joinPath(workspaceFolder.uri, readmePath);
        try {
          await vscode.workspace.fs.stat(uri);
          readmeUri = uri;
          break;
        } catch { }
      }
      if (!readmeUri) {
        throw new Error("README not found");
      }

      const bytes = await vscode.workspace.fs.readFile(readmeUri);
      const markdown = new TextDecoder().decode(bytes);

      const ast = Markdoc.parse(markdown);
      const content = Markdoc.transform(ast, /* config */);
      const html = Markdoc.renderers.html(content);

      webView.webview.html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <base href="${webView.webview.asWebviewUri(readmeUri)}">
          </head>
          <body>${html}</body>
        </html>`;
    }
  });

  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${EXTENSION_NAME}.openFolder`,
      function (fileUri) {
        vscode.commands.executeCommand("vscode.openFolder", fileUri, false);
      }
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
