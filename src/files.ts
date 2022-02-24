import { GalleryConfiguration } from "./types";
import * as vscode from "vscode";

async function openFile(
  file: string,
  viewColumn: vscode.ViewColumn,
  preserveFocus: boolean = true
) {
  const [path, range] = file.split(":");
  const fileUri = vscode.Uri.joinPath(
    vscode.workspace.workspaceFolders![0].uri,
    path
  );

  let selection: vscode.Range | undefined;
  if (range) {
    const [startLine, endLine = startLine] = range.split("-");
    selection = new vscode.Range(Number(startLine) - 1, 0, Number(endLine) - 1, 1000);
  }

  return await vscode.window.showTextDocument(fileUri, {
    preview: false,
    preserveFocus,
    viewColumn,
    selection
  });
}

export async function createFiles(files: string[]) {
  await vscode.commands.executeCommand("workbench.action.closeAllEditors");

  let viewColumn = 1;
  let activeEditor;

  for (let i = 0; i < files.length; i++) {
    const fileGroup = files[i];

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
