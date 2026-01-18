const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, '..', 'assets', 'logo.png'),
    autoHideMenuBar: true, 
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      webSecurity: true
    }
  });

  // Load only ONE file - your main React app
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  // Optional: Open DevTools in development
  // mainWindow.webContents.openDevTools();

  ipcMain.on('reload-app', () => {
    console.log("Reloading the application...");
    if (mainWindow) {
      mainWindow.reload();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      icon: path.join(__dirname, '..', 'assets', 'logo.png'),
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        enableRemoteModule: false,
        webSecurity: true
      }
    });
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
});