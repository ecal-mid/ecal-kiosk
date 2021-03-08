const defWin = {
  width: 800,
  height: 600,
  kiosk: false,
  closable: true,
  showInTaskbar: false,
  alwaysOnTop: true,
  show: true,
  focusable: true,
  webPreferences: {},
};

const defConfig = {
  preventDisplaySleep: false,
  shortcuts: {
    quit: "Control+Q",
    openSettings: "Control+C",
    // Documentation on key combinations - https://electron.atom.io/docs/api/accelerator/
  },
  permissions: [
    "audioCapture",
    "fullscreen",
    "pointerLock",
    "midiSysex",
    "midi",
    "notifications",
    "geolocation",
    "mediaKeysystem",
  ],
};

exports.buildConfig = {
  ...defConfig,
  win: {
    ...defWin,
    kiosk: true,
    show: false,
    closable: true,
  },

  url: "",
};

exports.devConfig = {
  ...defConfig,
  win: {
    ...defWin,
    kiosk: false,
    show: true,
    closable: true,
  },

  url: "https://google.ch",
};
