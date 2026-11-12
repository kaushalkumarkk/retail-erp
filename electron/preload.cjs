const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "retailDesktop",
  Object.freeze({
    providerAccess: () => ipcRenderer.invoke("retail:provider-access"),
    providerLicences: () => ipcRenderer.invoke("retail:provider-licences"),
    licenceStatus: () => ipcRenderer.invoke("retail:licence-status"),
    activateLicence: (key) =>
      ipcRenderer.invoke("retail:licence-activate", key),
    exportLockedBackup: () => ipcRenderer.invoke("retail:licence-backup"),
    assertLicensed: () => {
      const response = ipcRenderer.sendSync("retail:licence-assert");
      if (!response?.ok)
        throw Error(response?.message || "A valid annual licence is required.");
      return true;
    },
  }),
);
