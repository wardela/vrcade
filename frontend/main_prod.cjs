const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
let mainWindow;
app.on('ready', () => {
 
 mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, "preload.cjs"),
    contextIsolation: true,
    sandbox: false,
    nodeIntegration: false,
    webSecurity: false,
    allowRunningInsecureContent: true
  }
});

// ADD THIS  
win.maximize(); 

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
 ;

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
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });
    const frontendPath = `file://${path.join(__dirname, '../dist/index.html')}`;
    mainWindow.loadURL(frontendPath);
  }
});
