# 🖼️ Workspace Layout

The _Workspace Layout_ extension allows a workspace to configure the set of [terminals](#terminals) and/or [files](#files) that should be automatically opened, whenever someone launches the workspace within VS Code and/or GitHub Codespaces. This allows a repo maintainer to provide a highly curated one-click/onboarding experience, using a config-as-code solution, that builds upon the existing semantics of [`devcontainer.json`](https://code.visualstudio.com/docs/remote/devcontainerjson-reference).

In fact, in order to start configuring a workspace's layout, simply create a `devcontainer.json` file, that specifies a `workspace.files` and/or `workspace.terminals` property. If you're already using GitHub Codespaces or [VS Code Remote Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers), you can add these properties to your existing `devcontainer.json` file, and add `lostintangent.workspace-layout` to the `extensions` list, in order to automatically install it, and apply the desired layout for subsequent users.

### Sample Layout Configuration

The following is an example `devcontainer.json` file, that illustrates the various configuration options that the _Workspace Layout_ extension supports. For more details about the behavior/properties, see the [terminal](#terminals) and [file](#files) reference information below:

```json
{
  "workspace": {
    "files": [
      "package.json", // Specify an array of files you'd like to auto-open
      "LICENSE",
      ["src/extension.ts", "src/types.ts"] // Group one or more files into a distinct editor group
    ],
    "terminals": [
      "echo one", // Specify just a command (no name/etc.)
      {
        "name": "Bar", // Define the appearance of a terminal instance
        "color": "blue",
        "command": "echo two",
        "active": true, // Indicate a terminal as recieving focus
        "icon": "bug"
      },
      [
        // Group one or more terminals into a split termianl group
        {
          "name": "Foo", // Terminals can be created without a default command
          "icon": "account"
        },
        "echo four"
      ]
    ]
  }
}
```

## Terminals

The `terminals` property indicates one or more integrated terminals that should be automatically opened, the first time that someone opens the associated workspace (or when they re-run the `Reset Workspace Layout` command). This property accepts an array of strings, or terminal config objects, that represent the desired behavior of the terminal.

When a terminal is specified as a string value, it's contents are interpreted as the command to run within the terminal instance (e.g. `echo foo`). However, if you'd like to customize the appearance/behavior of a terminal instance, you can configure it as a JSON object, with any of the following properties (all of which are optional):

- `command`: The default command to run within the terminal instance. If omitted, the terminal will simply be opened, and no command will be run.

- `name`: A friendly name to give to the terminal. By default, it will be named after the default shell (e.g. `bash`).

- `icon`: Specifies a custom icon for the terminal instance, using the name of a [VS Code icon](https://microsoft.github.io/vscode-codicons/dist/codicon.html) (e.g. `account`, `bug`). By default it will use the `terminal` icon.

- `color`: Specifies the color that the terminal's icon should be, using one of the following supported values: `black`, `blue`, `cyan`, `green`, `magenta`, `red`, `white`, `yellow`. By default, it will use `white`.

- `active`: Indicates that a terminal instance should recieve focus. By default, the first terminal in the list will be treated as the active instance.

- `message`: Specifies a strong to display at the top of the terminal instance.

> _Note: If you specify a terminal as either an empty string (`""`) or an empty object (`{}`), it will result in a terminal instance being created, with all default values._

### Split Terminal Groups

If you'd like to configure a group of split terminals, then simpyl group one or more terminal configurations into a nested array. And all siblings in that array will be grouped together.

For example, the following config will create three tabbed terminals:

```json
"terminals": ["echo one", "echo two", "echo three"]
```

Whereas, the following would group the first two terminals into a split-terminal layout, and then open the third one as a new terminal tab:

```json
"terminals": [["echo one", "echo two"], "echo three"]
```

## Files

The `files` property indicates one or more workspace files that should be automatically opened. This property accepts an array of strings, that represents the ordered set of relative paths to open (e.g. `src/foo.ts`).

By default, the specified files will be opened as seperate tabs within the same editor group. However, if you'd like to group together one or more files, then simply specify the groups using a nested array. For example, the following config will open three tabbed files:

```json
"files": ["src/foo.ts", "src/bar.ts", "src/baz.ts"]
```

Whereas, the following would group the first two files into an editor group, and then open the third one in a seperate editor group:

```json
"files": [["src/foo.ts", "src/bar.ts"], "src/baz.ts"]
```

## Resetting Layout

In order to respect user preference, a configured workspace is only automatically launched the first time that you open each workspace (or each time you create a Codespace for the repo). From then on, VS Code will respect the workspace layout, and therefore, if you want to close a file/terminal, and/or re-arrange things, then your preference will persist across sessions.

However, if you accidentally close a file/terminal, and you'd like to return back to the original workspace layout, you can simply run the `Reset Workspace Layout` command.
