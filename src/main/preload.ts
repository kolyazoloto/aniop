import { contextBridge, ipcRenderer } from "electron";

// contextBridge.exposeInMainWorld("electron", {
//   ipcRenderer: ipcRenderer,
// });
// White-listed channels.
contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: ipcRenderer,
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
