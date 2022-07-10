import { GalleryConfiguration } from "./types";
import * as vscode from "vscode";

async function openFile(file: string, viewColumn: vscode.ViewColumn) {
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
    preserveFocus: false,
    viewColumn,
    selection
  });
}

export async function createFiles(files: Array<any>) {
  await vscode.commands.executeCommand("workbench.action.closeAllEditors");

  const groups = toArrayOfArrays(files);
  const activeEditors = [];
  for (let i = 0; i < groups.length; i++) {
    for (let j = 0; j < groups[i].length; j++) {
      const editor = await openFile(groups[i][j], i + 1);
      if (j === 0) {
        activeEditors.push(editor);
      }
    }
  }

  // Activate first editor in each group, from right to left
  for (let i = activeEditors.length - 1; i >= 0; i--) {
    vscode.window.showTextDocument(activeEditors[i].document, i + 1);
  }
}

function toArrayOfArrays(items: Array<any>) {
  const groups = [];
  let group = [];
  for (let i = 0; i < items.length; i++) {
    if (Array.isArray(items[i])) {
      groups.push(items[i]);
    }
    else {
      group.push(items[i]);
      if (i === items.length - 1 || (i === items.length - 2 && Array.isArray(items[i + 1]))) {
        groups.push(group);
        group = [];
      }
    }
  }
  return groups;
}