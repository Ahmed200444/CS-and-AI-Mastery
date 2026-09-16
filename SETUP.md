# CS & AI Mastery — Windows PC installation

This build is portable and can be installed permanently on your Windows computer. ChatGPT is only used to deliver the ZIP; it is not required after installation.

## Recommended one-time installation

1. Download the **entire ZIP**.
2. Right-click it and choose **Extract All**.
3. Open the extracted folder.
4. Double-click `INSTALL_ON_MY_COMPUTER.bat`.
5. Approve the installation if Windows asks.

The installer copies the complete application to:

```text
%LOCALAPPDATA%\CS-and-AI-Mastery
```

and creates a **CS & AI Mastery** shortcut on your Windows desktop.

After that, launch the app from the desktop shortcut. You may delete the downloaded ZIP and extracted download copy; the installed Local AppData copy is independent.

## Why browser "Save page as" does not work

CS & AI Mastery is not one HTML file. It uses local course pages, JavaScript, data, workers, and a local server. Saving only the page omits required files and bypasses the HTTP/security setup used by the interactive runners.

## Node.js

The local server requires Node.js 20+. `START_CSAI.bat` detects it automatically. If Node.js is missing, the launcher can offer to install the official Node.js LTS package using Windows `winget`.

## GitHub

GitHub publishing is optional. If needed, run `CONNECT_GITHUB.bat` once. Authentication is stored by GitHub CLI in your Windows account, not embedded in the app files.

The website never silently chooses a repository. Open the **GitHub** page, connect your own account, then explicitly choose or add a repository you can write to.

## Starting manually

You can always run:

```text
START_CSAI.bat
```

The current launcher starts the server in the background, waits for `/__health`, and only then opens the browser. After it reports that the server is ready, you may close the launcher window. The server keeps running until you use `STOP_CSAI.bat`.

The app runs at:

```text
http://127.0.0.1:5711/
```

Do not double-click `index.html` directly and do not use `file://`.

## If the browser says 127.0.0.1 refused to connect

Use the desktop **CS & AI Mastery** shortcut again. If the server cannot start, the launcher stays open with the error and writes `csai-server.log` so the problem can be diagnosed.

Run `STOP_CSAI.bat` only when you intentionally want to stop the background study server.
