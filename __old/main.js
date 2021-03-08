const electron = require("electron");
const { app, globalShortcut, BrowserWindow } = electron;

const { ipcMain } = require("electron");
const { readFile } = require("fs");
const fs = require("fs");

let MAIN_WINDOW, POPUP_WINDOW;

//BAS KIOSK CONFIG
const config = {
  useKioskMode: true,
  showInTaskbar: false,
  window: {
    width: 1024,
    height: 768,
    isClosable: false,
    isMaximizable: false,
    isMinimizable: false,
    isResizable: false,
    showMenuBar: false,
  },
  shortcuts: {
    kill: "Control+Q",
    conf: "Control+C",
    // Documentation on key combinations - https://electron.atom.io/docs/api/accelerator/
  },
};

const defaultURLPath = app.getAppPath() + "/defaultURL.txt";

function getURL(configPath, callback) {
  readFile(configPath, "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
    typeof callback === "function" && callback(data);
  });
}

let password, hostname;

readFile(app.getAppPath() + "/password.txt", "utf-8", (err, data) => {
  if (err) {
    console.log(err);
    return;
  }
  password = data;
  console.log(password);
});

let settingsOpen = false;
function hideSecondWindow() {
  settingsOpen = false;
  POPUP_WINDOW.hide();
}
function createWindow() {
  getURL(defaultURLPath, (url) => {
    hostname = getHostname(url);
    //MAIN WINDOW
    MAIN_WINDOW = new BrowserWindow({
      width: config.window.width,
      height: config.window.height,
      closable: config.window.isClosable,
      kiosk: config.useKioskMode,
      showInTaskbar: config.showInTaskbar,
      alwaysOnTop: true,
      show: false,
      focusable: true,
    });

    MAIN_WINDOW.setMaximizable(config.window.isMaximizable);
    MAIN_WINDOW.setMinimizable(config.window.isMinimizable);
    MAIN_WINDOW.setFullScreenable(config.window.isMaximizable);
    MAIN_WINDOW.setResizable(config.window.isResizable);

    MAIN_WINDOW.loadURL(url);
    MAIN_WINDOW.on("closed", () => {
      MAIN_WINDOW = null;
    });
    MAIN_WINDOW.webContents.on("new-window", (event, newURL) => {
      event.preventDefault();
    });
    MAIN_WINDOW.once("ready-to-show", () => {
      MAIN_WINDOW.show();
    });
    MAIN_WINDOW.webContents.on("will-navigate", (e, newURL) => {
      var nextpageHostname = getHostname(newURL);
      if (nextpageHostname != hostname) {
        e.preventDefault();
      }
    });

    //SECOND WINDOW
    POPUP_WINDOW = new BrowserWindow({
      modal: true,
      show: false,
      parent: MAIN_WINDOW,
      width: 460,
      //width: 800,
      height: 360,
      backgroundColor: "#333",
      webPreferences: {
        nodeIntegration: true,
      },
    });
    POPUP_WINDOW.loadFile("index.html");
    //secondWindow.toggleDevTools();
    //SHORTCUTS
    globalShortcut.register(config.shortcuts.kill, () => {
      app.exit();
    });

    globalShortcut.register("Esc", () => {
      hideSecondWindow();
    });

    globalShortcut.register(config.shortcuts.conf, () => {
      console.log(settingsOpen);
      if (!settingsOpen) {
        POPUP_WINDOW.loadFile("index.html");
        POPUP_WINDOW.webContents.on("did-finish-load", () => {
          POPUP_WINDOW.show();

          POPUP_WINDOW.webContents.send("currURL", url);
          POPUP_WINDOW.webContents.send("password", password);
        });
        settingsOpen = true;
      } else {
        hideSecondWindow();
      }
    });

    globalShortcut.unregister("Command+Q");

    //IPC MESSAGING
    ipcMain.on("newURL", (event, message) => {
      url = message;
      hostname = getHostname(url);
      fs.writeFile(defaultURLPath, message, function (err) {
        if (err) {
          return console.log(err);
        }
      });
      MAIN_WINDOW.loadURL(message);
    });

    ipcMain.on("newPW", (event, message) => {
      password = message;
      fs.writeFile(
        app.getAppPath() + "/password.txt",
        password,
        function (err) {
          if (err) {
            return console.log(err);
          }
        }
      );
      POPUP_WINDOW.webContents.send("passwordChanged", true);
    });

    ipcMain.on("closeSettings", (event, message) => {
      console.log(message);
    });
    ipcMain.on("closeSettings", (event, message) => {
      hideSecondWindow();
    });
    ipcMain.on("quit", (event, message) => {
      app.exit();
    });
    //MOUSE MOVEMENT TRACKING

    let prevMousePosition = { x: 0, y: 0 };
    let lastMouseMove = new Date().getTime();
    let resetTime = 300000;
    function checkMousePos() {
      var currPos = electron.screen.getCursorScreenPoint();
      if (
        currPos.x != prevMousePosition.x ||
        currPos.y != prevMousePosition.y
      ) {
        lastMouseMove = new Date().getTime();
        prevMousePosition = currPos;
      }

      if (new Date().getTime() - lastMouseMove > resetTime) {
        MAIN_WINDOW.loadURL(url);
        lastMouseMove = new Date().getTime();
      }
      setTimeout(checkMousePos, 100);
    }
    checkMousePos();
  });
}

app.on("ready", function () {
  createWindow();
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (MAIN_WINDOW === null) {
    createWindow();
  }
});

function getHostname(uerl) {
  var tempURL = new URL(uerl);
  return tempURL.hostname;
}
