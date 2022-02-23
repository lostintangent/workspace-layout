import { GalleryConfiguration } from "./types";
import * as vscode from "vscode";

async function openFile(
  file: string,
  viewColumn: vscode.ViewColumn,
  preserveFocus: boolean = true
) {
  const fileUri = vscode.Uri.joinPath(
    vscode.workspace.workspaceFolders![0].uri,
    file
  );

  return await vscode.window.showTextDocument(fileUri, {
    preview: false,
    preserveFocus,
    viewColumn,
  });
}

export async function createFiles(config: GalleryConfiguration) {
  if (!config.files) {
    return;
  }

  await vscode.commands.executeCommand("workbench.action.closeAllEditors");

  let viewColumn = 1;
  let activeEditor;

  for (let i = 0; i < config.files.length; i++) {
    const fileGroup = config.files[i];

    if (Array.isArray(fileGroup)) {
      fileGroup.reverse();

      let file = fileGroup.pop();
      const editor = await openFile(file, viewColumn, false);

      if (!activeEditor) {
        activeEditor = editor;
      }

      for (file of fileGroup) {
        await openFile(file, viewColumn);
      }

      viewColumn++;
    } else {
      const editor = await openFile(fileGroup, viewColumn);

      if (!activeEditor) {
        activeEditor = editor;
      }
    }
  }

  if (activeEditor) {
    activeEditor.show();
  }
}
