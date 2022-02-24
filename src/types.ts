import * as vscode from "vscode";

export type GalleryTerminal = vscode.TerminalOptions & {
  name?: string;
  command?: string;
  color?: string;
  icon?: string;
  message?: string;
  active?: boolean;
};

export type GalleryTerminalGroup =
  | string
  | GalleryTerminal
  | (GalleryTerminal | string)[];

export interface GalleryConfiguration {
  view?: string;
  files?: string[];
  terminals?: GalleryTerminalGroup[];
}
