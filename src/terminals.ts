import * as vscode from "vscode";
import { GalleryConfiguration, GalleryTerminal, GalleryTerminalGroup } from "./types";

const COLOR_PREFIX = "terminal.ansi";

function prepareTerminal(config: GalleryTerminal) {
  if (config.color && !config.color.startsWith(COLOR_PREFIX)) {
    const color = config.color.charAt(0).toUpperCase() + config.color.slice(1);
    const themeColor = `${COLOR_PREFIX}${color}`;

    // @ts-ignore
    config.color = new vscode.ThemeColor(themeColor);
  }

  if (config.icon) {
    config.iconPath = new vscode.ThemeIcon(config.icon);
  }
}

function initializeTerminal(
  terminal: vscode.Terminal,
  config: GalleryTerminal
) {
  if (config.command) {
    terminal.sendText(config.command);
  }
}

async function createTerminal(config: GalleryTerminal) {
  prepareTerminal(config);

  const terminal = vscode.window.createTerminal(config);
  initializeTerminal(terminal, config);

  return terminal;
}

export async function createTerminals(terminals: GalleryTerminalGroup[]) {
    for (const terminal of vscode.window.terminals) {
      terminal.dispose();
    }

  let activeTerminal: vscode.Terminal | undefined;
  for (let terminalGroup of terminals) {
    if (Array.isArray(terminalGroup)) {
      terminalGroup.reverse();

      let terminal = terminalGroup.pop()!;
      if (typeof terminal === "string") {
        terminal = { command: terminal };
      }

      let parentTerminal = await createTerminal(terminal);
      if (!activeTerminal || terminal.active) {
        activeTerminal = parentTerminal;
      }

      let splitTerminal: GalleryTerminal | string | undefined;
      while ((splitTerminal = terminalGroup.pop())) {
        if (typeof splitTerminal === "string") {
          splitTerminal = {
            command: splitTerminal,
            location: { parentTerminal },
          };
        } else {
          splitTerminal.location = {
            parentTerminal,
          };
        }
        parentTerminal = await createTerminal(splitTerminal);
        if (splitTerminal.active) {
          activeTerminal = parentTerminal;
        }
      }
    } else if (typeof terminalGroup === "string") {
      const terminal = await createTerminal({ command: terminalGroup });
      if (!activeTerminal) {
        activeTerminal = terminal;
      }
    } else {
      const terminal = await createTerminal(terminalGroup);
      if (!activeTerminal || terminalGroup.active) {
        activeTerminal = terminal;
      }
    }
  }

  if (activeTerminal) {
    activeTerminal.show();
  }
}
