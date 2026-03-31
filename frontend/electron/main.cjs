const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

const DEFAULT_ZOOM_FACTOR = 0.9;
const ZOOM_STEP_PERCENT = 5;

let mainWindow;

const toPercent = (factor) => Math.round(factor * 100);
const toFactor = (percent) => Number(percent) / 100;
const isValidFactor = (value) => Number.isFinite(value) && value > 0;

const sendZoomChanged = (webContents) => {
  if (!webContents || webContents.isDestroyed()) return;
  webContents.send("zoom:changed", webContents.getZoomFactor());
};

const setZoomFactor = (webContents, factor) => {
  if (!webContents || webContents.isDestroyed()) return DEFAULT_ZOOM_FACTOR;
  const nextFactor = isValidFactor(factor) ? factor : DEFAULT_ZOOM_FACTOR;
  webContents.setZoomFactor(nextFactor);
  sendZoomChanged(webContents);
  return nextFactor;
};

const changeZoomByPercent = (webContents, deltaPercent) => {
  if (!webContents || webContents.isDestroyed()) return DEFAULT_ZOOM_FACTOR;
  const currentPercent = toPercent(webContents.getZoomFactor());
  const nextPercent = currentPercent + Number(deltaPercent);
  const nextFactor = toFactor(nextPercent);
  if (!isValidFactor(nextFactor)) {
    return webContents.getZoomFactor();
  }
  return setZoomFactor(webContents, nextFactor);
};

const registerZoomShortcuts = (window) => {
  window.webContents.on("before-input-event", (event, input) => {
    if (!input.control && !input.meta) return;

    const isZoomIn =
      input.code === "Equal" ||
      input.code === "NumpadAdd" ||
      input.key === "+";
    const isZoomOut =
      input.code === "Minus" ||
      input.code === "NumpadSubtract" ||
      input.key === "-" ||
      input.key === "_";
    const isResetZoom =
      input.code === "Digit0" ||
      input.code === "Numpad0" ||
      input.key === "0";

    if (!isZoomIn && !isZoomOut && !isResetZoom) return;

    event.preventDefault();

    if (isZoomIn) {
      changeZoomByPercent(window.webContents, ZOOM_STEP_PERCENT);
      return;
    }

    if (isZoomOut) {
      changeZoomByPercent(window.webContents, -ZOOM_STEP_PERCENT);
      return;
    }

    setZoomFactor(window.webContents, DEFAULT_ZOOM_FACTOR);
  });
};

const createMainWindow = () => {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, "..", "assets", "logo.png"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  registerZoomShortcuts(window);
  window.webContents.once("did-finish-load", () => {
    setZoomFactor(window.webContents, DEFAULT_ZOOM_FACTOR);
  });

  window.loadFile(path.join(__dirname, "../dist/index.html"));
  return window;
};

ipcMain.on("reload-app", () => {
  if (mainWindow) {
    mainWindow.reload();
  }
});

ipcMain.handle("zoom:get", (event) => event.sender.getZoomFactor());

ipcMain.handle("zoom:set-percent", (event, percent) => {
  const nextFactor = toFactor(Number(percent));
  if (!isValidFactor(nextFactor)) {
    return event.sender.getZoomFactor();
  }
  return setZoomFactor(event.sender, nextFactor);
});

ipcMain.handle("zoom:change-percent", (event, deltaPercent) =>
  changeZoomByPercent(event.sender, Number(deltaPercent))
);

ipcMain.handle("zoom:reset", (event) =>
  setZoomFactor(event.sender, DEFAULT_ZOOM_FACTOR)
);

app.whenReady().then(() => {
  mainWindow = createMainWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMainWindow();
  }
});
