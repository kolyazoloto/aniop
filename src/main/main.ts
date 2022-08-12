import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";

// import download from "download";

import fs from "fs";
import request from "request";
import progress from "request-progress";
// import DownloadManager from "electron-download-manager";

// DownloadManager.register({
//   downloadFolder: "C:/Users/Nikolay/Desktop/testest",
// });

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  if (process.env.NODE_ENV === "development") {
    const rendererPort = process.argv[2];
    mainWindow.loadURL(`http://localhost:${rendererPort}`);
  } else {
    mainWindow.loadFile(join(app.getAppPath(), "renderer", "index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("message", (event, message) => {
  console.log(message);
});

ipcMain.handle("download", async (event, info) => {
  progress(request(info.url), {
    // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms
    // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
    // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
  })
    .on("progress", function (state) {
      console.log("progress", state);
    })
    .on("error", function (err) {
      console.log("ERROR download");
      return "ERROR download";
    })
    .on("end", function () {
      console.log("download ended");
      return "download ended";
    })
    .pipe(fs.createWriteStream(info.properties.filename));
});
