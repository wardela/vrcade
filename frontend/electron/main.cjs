const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs/promises");
const net = require("net");
const os = require("os");
const path = require("path");

if (require("electron-squirrel-startup")) {
  app.quit();
}

const DEFAULT_ZOOM_FACTOR = 0.9;
const ZOOM_STEP_PERCENT = 5;
const PRINT_WINDOW_READY_TIMEOUT_MS = 30000;
const PRINT_TEMP_DIR_PREFIX = "fawtartak-print-";
const CASH_DRAWER_DEFAULT_PORT = 9100;
const CASH_DRAWER_DEFAULT_TIMEOUT_MS = 3000;
const CASH_DRAWER_DEFAULT_PULSE_HEX = "1B700019FA";

let mainWindow;

const toPercent = (factor) => Math.round(factor * 100);
const toFactor = (percent) => Number(percent) / 100;
const isValidFactor = (value) => Number.isFinite(value) && value > 0;
const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const normalizeHexBytes = (value) =>
  String(value || "")
    .replace(/0x/gi, "")
    .replace(/[^a-fA-F0-9]/g, "")
    .toUpperCase();

const getCashDrawerPulseBuffer = () => {
  const normalizedHex = normalizeHexBytes(
    process.env.POS_CASH_DRAWER_PULSE_HEX || CASH_DRAWER_DEFAULT_PULSE_HEX,
  );

  if (!normalizedHex || normalizedHex.length % 2 !== 0) {
    return Buffer.from(CASH_DRAWER_DEFAULT_PULSE_HEX, "hex");
  }

  try {
    return Buffer.from(normalizedHex, "hex");
  } catch (_error) {
    return Buffer.from(CASH_DRAWER_DEFAULT_PULSE_HEX, "hex");
  }
};

const getCashDrawerConfig = () => {
  const host = String(process.env.POS_CASH_DRAWER_HOST || "").trim();
  const rawPort = Number(process.env.POS_CASH_DRAWER_PORT || CASH_DRAWER_DEFAULT_PORT);
  const timeoutMs = Number(
    process.env.POS_CASH_DRAWER_TIMEOUT_MS || CASH_DRAWER_DEFAULT_TIMEOUT_MS,
  );

  return {
    supported: isNonEmptyString(host) && Number.isInteger(rawPort) && rawPort > 0,
    mode: "network-escpos",
    host,
    port: Number.isInteger(rawPort) && rawPort > 0 ? rawPort : CASH_DRAWER_DEFAULT_PORT,
    timeoutMs:
      Number.isFinite(timeoutMs) && timeoutMs > 0
        ? timeoutMs
        : CASH_DRAWER_DEFAULT_TIMEOUT_MS,
    pulseBuffer: getCashDrawerPulseBuffer(),
  };
};

const getAppRoot = () => app.getAppPath();
const getAppIconPath = () => path.join(__dirname, "..", "assets", "fawtartak.ico");
const getDistIndexPath = () => path.join(getAppRoot(), "dist", "index.html");

const getRendererEntry = () => {
  const devServerUrl =
    process.env.ELECTRON_RENDERER_URL || process.env.VITE_DEV_SERVER_URL;

  if (isNonEmptyString(devServerUrl)) {
    return { type: "url", value: devServerUrl.trim() };
  }

  return {
    type: "file",
    value: getDistIndexPath(),
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

const createPreviewPrintWindow = (parentWindow) =>
  new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#ffffff",
    parent: parentWindow || undefined,
    modal: false,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
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

const writePrintDocumentToTempFile = async (html) => {
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), PRINT_TEMP_DIR_PREFIX),
  );
  const filePath = path.join(tempDir, "document.html");
  await fs.writeFile(filePath, html, "utf8");

  return {
    tempDir,
    filePath,
  };
};

const removeTempDirectory = async (tempDir) => {
  if (!tempDir) return;

  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.warn("Failed to remove temporary print directory", error);
  }
};

const destroyWindowSafely = (window) => {
  if (window && !window.isDestroyed()) {
    window.destroy();
  }
};

const getReceiptCapabilities = () => {
  const cashDrawerConfig = getCashDrawerConfig();

  return {
    directPrintSupported: true,
    cashDrawer: {
      supported: cashDrawerConfig.supported,
      mode: cashDrawerConfig.supported ? cashDrawerConfig.mode : null,
    },
  };
};

const openCashDrawerDirectly = async () => {
  const cashDrawerConfig = getCashDrawerConfig();

  if (!cashDrawerConfig.supported) {
    return {
      success: false,
      supported: false,
      error:
        "Independent cash drawer opening is not configured on this desktop app.",
    };
  }

  return new Promise((resolve) => {
    let settled = false;
    const socket = new net.Socket();

    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(cashDrawerConfig.timeoutMs);

    socket.once("connect", () => {
      socket.write(cashDrawerConfig.pulseBuffer, (error) => {
        if (error) {
          finish({
            success: false,
            supported: true,
            error: error.message || "Failed to send the cash drawer pulse.",
          });
          return;
        }

        socket.end();
        finish({
          success: true,
          supported: true,
          mode: cashDrawerConfig.mode,
        });
      });
    });

    socket.once("timeout", () => {
      finish({
        success: false,
        supported: true,
        error: "Timed out while opening the cash drawer.",
      });
    });

    socket.once("error", (error) => {
      finish({
        success: false,
        supported: true,
        error: error?.message || "Failed to open the cash drawer.",
      });
    });

    socket.connect(cashDrawerConfig.port, cashDrawerConfig.host);
  });
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

const openDocumentPrintPreview = async ({
  sender,
  html,
  jobTitle,
}) => {
  if (!isNonEmptyString(html)) {
    return {
      success: false,
      error: "Printable document HTML is missing.",
    };
  }

  const parentWindow = sender ? BrowserWindow.fromWebContents(sender) : null;
  const printWindow = createPreviewPrintWindow(parentWindow);
  let timeoutId;
  let tempDir;

  try {
    const tempFile = await writePrintDocumentToTempFile(html);
    tempDir = tempFile.tempDir;

    await Promise.race([
      (async () => {
        await printWindow.loadFile(tempFile.filePath);
        await waitForReceiptContent(printWindow.webContents);
      })(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("Timed out while preparing the document for printing."));
        }, PRINT_WINDOW_READY_TIMEOUT_MS);
      }),
    ]);

    const printResult = await new Promise((resolve) => {
      printWindow.webContents.print(
        {
          silent: false,
          printBackground: true,
        },
        (success, failureReason) => {
          resolve({
            success,
            failureReason: failureReason || "",
          });
        },
      );
    });

    return {
      success: Boolean(printResult.success),
      failureReason: printResult.failureReason,
      jobTitle: isNonEmptyString(jobTitle) ? jobTitle.trim() : "Document",
    };
  } catch (error) {
    console.error("Document print preview failed", error);
    return {
      success: false,
      error: error?.message || "Failed to prepare the document for printing.",
    };
  } finally {
    clearTimeout(timeoutId);
    destroyWindowSafely(printWindow);
    await removeTempDirectory(tempDir);
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

ipcMain.handle("receipt:get-capabilities", async () => getReceiptCapabilities());

ipcMain.handle("receipt:print", async (_event, payload = {}) =>
  printReceiptSilently(payload)
);

ipcMain.handle("receipt:open-drawer", async () => openCashDrawerDirectly());

ipcMain.handle("document-print:preview", async (event, payload = {}) =>
  openDocumentPrintPreview({
    sender: event.sender,
    ...payload,
  })
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
