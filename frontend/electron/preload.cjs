const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
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
