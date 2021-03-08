const {
  app,
  BrowserWindow,
  powerSaveBlocker,
  globalShortcut,
  session,
} = require("electron");
const AutoLaunch = require("auto-launch");
const { devConfig, buildConfig } = require("./config");
const { getHostname } = require("./utils/url");

let DEV = true;
const CONFIG = DEV ? devConfig : buildConfig;

function createWindow(url, config) {
  const win = new BrowserWindow(config);

  allowPermissions(config.permissions);
  blockSleep(win);

  win.setMaximizable(false);
  win.setMinimizable(false);
  win.setFullScreenable(false);
  win.setResizable(false);

  if (DEV) win.webContents.openDevTools();

  win.webContents.on("new-window", (e) => e.preventDefault());
  win.webContents.on("will-navigate", (e, newUrl) => {
    const hostname = getHostname(url);
    if (getHostname(newUrl) !== hostname) e.preventDefault();
  });

  win.loadURL(url);
}

function exitApp() {
  app.exit(0);
  globalShortcut.unregisterAll();
}

function hidePopup() {
  // hidePopup
}

function blockSleep(browserWindowInst) {
  const powerID = powerSaveBlocker.start("prevent-display-sleep");
  browserWindowInst.on("closed", () => powerSaveBlocker.stop(powerID));
  return powerID;
}

function allowPermissions(permissions) {
  session
    .fromPartition("default")
    .setPermissionRequestHandler((webContents, permission, callback) => {
      //   const permissions = ; // Full list here: https://developer.chrome.com/extensions/declare_permissions#manifest

      if (
        webContents.getURL() === "some-host" &&
        permissions.includes(permission)
      )
        return callback(true);

      callback(false); // Deny
    });
}

function setupShortcuts() {
  const { quit, openSettings } = CONFIG.shortcuts;
  globalShortcut.unregister("Command+Q");
  globalShortcut.register(quit, exitApp);
  globalShortcut.register("Esc", hidePopup);
  globalShortcut.register(openSettings, () => {
    // console.log(settingsOpen);
    // if (!settingsOpen) {
    //   POPUP_WINDOW.loadFile("index.html");
    //   POPUP_WINDOW.webContents.on("did-finish-load", () => {
    //     POPUP_WINDOW.show();
    //     POPUP_WINDOW.webContents.send("currURL", url);
    //     POPUP_WINDOW.webContents.send("password", password);
    //   });
    //   settingsOpen = true;
    // } else {
    //   hideSecondWindow();
    // }
  });
}

autoLaunch();

function autoLaunch() {
  const appAutoLauncher = new AutoLaunch({
    name: "ECAL Kiosk",
    path: "/Applications/ecal-kiosk.app",
  });
  appAutoLauncher.enable();

  appAutoLauncher
    .isEnabled()
    .then((isEnabled) => {
      if (isEnabled) return;
      appAutoLauncher.enable();
    })
    .catch(console.error);
}

app.whenReady().then(() => {
  setupShortcuts();
  createWindow(CONFIG.url, CONFIG.win);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") exitApp();
});

app.on("activate", () => {
  if (!BrowserWindow.getAllWindows().length)
    createWindow(CONFIG.url, CONFIG.win);
});

app.on(
  "certificate-error",
  (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
  }
);
