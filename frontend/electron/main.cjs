const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

const DEFAULT_ZOOM_FACTOR = 0.9;
const ZOOM_STEP_PERCENT = 5;
const PRINT_WINDOW_READY_TIMEOUT_MS = 30000;

let mainWindow;

const toPercent = (factor) => Math.round(factor * 100);
const toFactor = (percent) => Number(percent) / 100;
const isValidFactor = (value) => Number.isFinite(value) && value > 0;
const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const getAppIconPath = () => path.join(__dirname, "..", "assets", "fawtartak.ico");

const getRendererEntry = () => {
  const devServerUrl =
    process.env.ELECTRON_RENDERER_URL || process.env.VITE_DEV_SERVER_URL;

  if (isNonEmptyString(devServerUrl)) {
    return { type: "url", value: devServerUrl.trim() };
  }

  return {
    type: "file",
    value: path.join(__dirname, "..", "dist", "index.html"),
  };
};

const loadRenderer = async (window) => {
  const entry = getRendererEntry();

  if (entry.type === "url") {
    await window.loadURL(entry.value);
    return;
  }

  await window.loadFile(entry.value);
};

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
    icon: getAppIconPath(),
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

  loadRenderer(window).catch((error) => {
    console.error("Failed to load renderer", error);
  });
  return window;
};

const createHiddenPrintWindow = () =>
  new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#ffffff",
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

const normalizePrinter = (printer) => ({
  name: printer.name,
  displayName: printer.displayName || printer.name,
  description: printer.description || "",
  isDefault: Boolean(printer.isDefault),
  status: typeof printer.status === "number" ? printer.status : null,
});

const waitForReceiptContent = async (webContents) => {
  await webContents.executeJavaScript(
    `new Promise((resolve) => {
      const finish = () => {
        const settle = () => requestAnimationFrame(() => setTimeout(resolve, 150));
        if (document.fonts?.ready) {
          document.fonts.ready.then(settle).catch(settle);
          return;
        }
        settle();
      };

      const images = Array.from(document.images || []);
      if (images.length === 0) {
        finish();
        return;
      }

      const pendingImages = images.filter((image) => !image.complete);
      if (pendingImages.length === 0) {
        finish();
        return;
      }

      let remaining = pendingImages.length;
      const done = () => {
        remaining -= 1;
        if (remaining <= 0) {
          finish();
        }
      };

      pendingImages.forEach((image) => {
        image.addEventListener("load", done, { once: true });
        image.addEventListener("error", done, { once: true });
      });

      setTimeout(finish, 10000);
    })`,
    true,
  );
};

const destroyWindowSafely = (window) => {
  if (window && !window.isDestroyed()) {
    window.destroy();
  }
};

const printReceiptSilently = async ({
  html,
  printerName,
  jobTitle,
}) => {
  if (!isNonEmptyString(html)) {
    return {
      success: false,
      error: "Receipt HTML is missing.",
    };
  }

  const printWindow = createHiddenPrintWindow();
  let timeoutId;

  try {
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    await Promise.race([
      (async () => {
        await printWindow.loadURL(dataUrl);
        await waitForReceiptContent(printWindow.webContents);
      })(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("Timed out while preparing the receipt for printing."));
        }, PRINT_WINDOW_READY_TIMEOUT_MS);
      }),
    ]);

    const printers = (await printWindow.webContents.getPrintersAsync()).map(
      normalizePrinter,
    );

    if (printers.length === 0) {
      return {
        success: false,
        error: "No printers are available on this machine.",
      };
    }

    const requestedPrinter = isNonEmptyString(printerName)
      ? printers.find((printer) => printer.name === printerName.trim())
      : null;
    const defaultPrinter = printers.find((printer) => printer.isDefault) || null;
    const targetPrinter = requestedPrinter || defaultPrinter || null;

    if (isNonEmptyString(printerName) && !requestedPrinter) {
      return {
        success: false,
        error: `Printer "${printerName.trim()}" is not available.`,
        availablePrinters: printers,
      };
    }

    const deviceName = targetPrinter?.name;

    const printResult = await new Promise((resolve) => {
      printWindow.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName,
          margins: {
            marginType: "none",
          },
        },
        (success, failureReason) => {
          resolve({
            success,
            failureReason: failureReason || "",
          });
        },
      );
    });

    if (!printResult.success) {
      return {
        success: false,
        error: printResult.failureReason || "The printer rejected the job.",
      };
    }

    return {
      success: true,
      printerName: deviceName || defaultPrinter?.name || null,
      requestedPrinterName: isNonEmptyString(printerName)
        ? printerName.trim()
        : null,
      usedDefaultPrinter: !requestedPrinter,
      jobTitle: isNonEmptyString(jobTitle) ? jobTitle.trim() : "POS Receipt",
    };
  } catch (error) {
    console.error("Silent receipt printing failed", error);
    return {
      success: false,
      error: error?.message || "Failed to prepare the receipt for printing.",
    };
  } finally {
    clearTimeout(timeoutId);
    destroyWindowSafely(printWindow);
  }
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

ipcMain.handle("receipt:get-printers", async (event) => {
  const printers = await event.sender.getPrintersAsync();
  return printers.map(normalizePrinter);
});

ipcMain.handle("receipt:print", async (_event, payload = {}) =>
  printReceiptSilently(payload)
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
