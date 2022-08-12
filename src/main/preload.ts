import { contextBridge, ipcRenderer } from "electron";

import fs from "fs";
import request from "request";
import progress from "request-progress";

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: ipcRenderer,
  fs: fs,
  request: request,
  progress: progress,
});
