const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  documentPrint: {
    preview: (payload) => ipcRenderer.invoke("document-print:preview", payload),
  },
  receipt: {
    getCapabilities: () => ipcRenderer.invoke("receipt:get-capabilities"),
    getPrinters: () => ipcRenderer.invoke("receipt:get-printers"),
    openDrawer: () => ipcRenderer.invoke("receipt:open-drawer"),
    openCashDrawerOnly: (payload) =>
      ipcRenderer.invoke("receipt:open-cash-drawer-only", payload),
    print: (payload) => ipcRenderer.invoke("receipt:print", payload),
  },
  zoom: {
    get: () => ipcRenderer.invoke("zoom:get"),
    setPercent: (percent) => ipcRenderer.invoke("zoom:set-percent", percent),
    changePercent: (deltaPercent) =>
      ipcRenderer.invoke("zoom:change-percent", deltaPercent),
    reset: () => ipcRenderer.invoke("zoom:reset"),
    onChanged: (callback) => {
      const handler = (_, factor) => callback(factor);
      ipcRenderer.on("zoom:changed", handler);
      return () => ipcRenderer.removeListener("zoom:changed", handler);
    },
  },
});
