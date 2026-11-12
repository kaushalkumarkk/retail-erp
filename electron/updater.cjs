const { app, dialog } = require("electron");

// Update checks are the only network call the app makes, and only in packaged builds.
// Failures (offline, no release yet) are ignored for the silent startup check.
function createUpdater(getWindow) {
  if (!app.isPackaged) {
    return { check: () => dialog.showMessageBox(getWindow() || undefined, {
      title: "Retail ERP",
      message: "Updates are only available in the installed app.",
    }) };
  }
  const { autoUpdater } = require("electron-updater");
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  let manual = false;
  let busy = false;
  const win = () => getWindow() || undefined;

  autoUpdater.on("update-available", async (info) => {
    const { response } = await dialog.showMessageBox(win(), {
      type: "info",
      title: "Update available",
      message: "Retail ERP " + info.version + " is available.",
      detail: "Your data, password and licence will not be changed. Download now?",
      buttons: ["Download", "Later"],
      defaultId: 0,
      cancelId: 1,
    });
    if (response === 0) autoUpdater.downloadUpdate().catch(report);
    else busy = false;
  });
  autoUpdater.on("update-not-available", () => {
    busy = false;
    if (manual)
      dialog.showMessageBox(win(), {
        title: "Retail ERP",
        message: "You are on the latest version (" + app.getVersion() + ").",
      });
  });
  autoUpdater.on("update-downloaded", async (info) => {
    busy = false;
    const { response } = await dialog.showMessageBox(win(), {
      type: "info",
      title: "Update ready",
      message: "Retail ERP " + info.version + " is downloaded.",
      detail: "Restart now to install it. Your records are kept.",
      buttons: ["Restart and install", "Install when I close the app"],
      defaultId: 0,
      cancelId: 1,
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });
  autoUpdater.on("error", (error) => report(error));

  function report(error) {
    busy = false;
    if (manual)
      dialog.showMessageBox(win(), {
        type: "warning",
        title: "Update check failed",
        message: "Could not check for updates.",
        detail: "Check your internet connection and try again.\n" + (error && error.message ? error.message : ""),
      });
  }

  function check(isManual) {
    if (busy) return;
    busy = true;
    manual = !!isManual;
    autoUpdater.checkForUpdates().catch(report);
  }
  return { check };
}

module.exports = { createUpdater };
