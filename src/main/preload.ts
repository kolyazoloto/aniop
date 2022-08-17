import { contextBridge, ipcRenderer } from "electron";
import { readdir } from "node:fs/promises";

// contextBridge.exposeInMainWorld("electron", {
//   ipcRenderer: ipcRenderer,
// });
// White-listed channels.
contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: ipcRenderer,
});
contextBridge.exposeInMainWorld("fs", {
  readdir: async (path) => {
    let files = await readdir(path);
    return files;
  },
});
contextBridge.exposeInMainWorld("api", {
  receive: (channel, func) => {
    // console.log("preload-receive called. args: ");
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },

  electronIpcRemoveAllListeners: (channel: string) => {
    // console.log("Remove all listeners from channel : " + channel);
    ipcRenderer.removeAllListeners(channel);
  },
});
