import * as vscode from "vscode";
import { EXTENSION_NAME } from "./constants";
import { prepareLayout } from "./layout";

export async function activate(context: vscode.ExtensionContext) {
  if (!vscode.workspace.workspaceFolders) {
    return;
  }

  prepareLayout(context.workspaceState);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${EXTENSION_NAME}.resetLayout`,
      prepareLayout
    )
  );
}
