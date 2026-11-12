const {
  app,
  BrowserWindow,
  protocol,
  net,
  Menu,
  dialog,
  shell,
  ipcMain,
  powerMonitor,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { createLicenceService } = require("./licence-core.cjs");
const { assertProviderDirectory, readProviderRegistry } = require("./provider-registry.cjs");
const { pathToFileURL } = require("node:url");
app.setName("Retail ERP");
// This stable origin keeps localStorage consistent across app updates and installs.
protocol.registerSchemesAsPrivileged([
  {
    scheme: "retail",
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);
if (!app.isPackaged && process.env.ERP_TEST_PROFILE)
  app.setPath("userData", process.env.ERP_TEST_PROFILE);
let mainWindow;
let downloadsConfigured = false;
let licence;
const origin = "retail://app";
const isAppURL = (url) => {
  try {
    const u = new URL(url);
    return u.protocol === "retail:" && u.host === "app";
  } catch {
    return false;
  }
};
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
  app.whenReady().then(() => {
    const root = path.join(app.getAppPath(), "dist");
    const testing = !app.isPackaged && !!process.env.ERP_TEST_PROFILE;
    const publicKey = fs.readFileSync(
      testing && process.env.ERP_TEST_PUBLIC_KEY
        ? process.env.ERP_TEST_PUBLIC_KEY
        : path.join(__dirname, "licence-public.pem"),
      "utf8",
    );
    licence = createLicenceService({
      directory: app.getPath("userData"),
      publicKey,
      ...(testing && process.env.ERP_TEST_NOW_FILE
        ? {
            now: () =>
              Number(fs.readFileSync(process.env.ERP_TEST_NOW_FILE, "utf8")),
          }
        : {}),
    });
    const trusted = (event) =>
      mainWindow &&
      event.sender.id === mainWindow.webContents.id &&
      event.senderFrame?.routingId === event.sender.mainFrame.routingId &&
      isAppURL(event.senderFrame.url);
    const providerConfig = path.join(app.getPath("userData"), "provider-register.json");
    let providerDirectory = process.env.RETAIL_ERP_VENDOR_DIR ||
      (!app.isPackaged && !testing ? path.join(app.getAppPath(), ".vendor") : null);
    if (!providerDirectory) {
      try {
        const config = JSON.parse(fs.readFileSync(providerConfig, "utf8"));
        if (typeof config.directory === "string") providerDirectory = config.directory;
      } catch {}
    }
    ipcMain.handle("retail:provider-access", (event) => {
      if (!trusted(event)) throw Error("Invalid provider request.");
      licence.assertActive();
      try {
        assertProviderDirectory(providerDirectory, publicKey);
        return { available: true };
      } catch {
        return { available: false };
      }
    });
    ipcMain.handle("retail:provider-licences", (event) => {
      if (!trusted(event)) throw Error("Invalid provider request.");
      licence.assertActive();
      // Authorize every read in the main process; shop operator roles do not
      // grant access to the provider's register or signing key.
      assertProviderDirectory(providerDirectory, publicKey);
      const localState = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), "licence-state.json"), "utf8"));
      return readProviderRegistry({
        directory: providerDirectory, publicKey,
        localKeys: localState.keys, machine: licence.machineId,
      });
    });
    ipcMain.handle("retail:licence-status", (event) => {
      if (!trusted(event)) throw Error("Invalid licence request.");
      return licence.status();
    });
    ipcMain.handle("retail:licence-activate", (event, key) => {
      if (!trusted(event)) throw Error("Invalid licence request.");
      const status = licence.activate(key);
      if (
        status.state === "active" &&
        new URL(mainWindow.webContents.getURL()).pathname === "/licence.html"
      )
        setImmediate(() => mainWindow?.loadURL(origin + "/"));
      return status;
    });
    ipcMain.on("retail:licence-assert", (event) => {
      try {
        if (!trusted(event)) throw Error("Invalid licence request.");
        licence.assertActive();
        event.returnValue = { ok: true };
      } catch (e) {
        event.returnValue = { ok: false, message: e.message };
      }
    });
    ipcMain.handle("retail:licence-backup", async (event) => {
      if (!trusted(event)) throw Error("Invalid backup request.");
      const data = await mainWindow.webContents.executeJavaScript(
        "localStorage.getItem('retailer-erp:v1')",
      );
      if (!data)
        return {
          saved: false,
          message: "There is no workspace data on this computer yet.",
        };
      const result = await dialog.showSaveDialog(mainWindow, {
        title: "Save Retail ERP Data Backup",
        defaultPath: path.join(
          app.getPath("downloads"),
          "retail-erp-backup.json",
        ),
        filters: [{ name: "JSON backup", extensions: ["json"] }],
      });
      if (result.canceled) return { saved: false };
      fs.writeFileSync(result.filePath, data, { mode: 0o600 });
      return { saved: true };
    });
    const enforce = () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      const active = licence.status().state === "active";
      const locked =
        new URL(mainWindow.webContents.getURL() || origin).pathname ===
        "/licence.html";
      if (!active && !locked) {
        mainWindow.webContents.stop();
        mainWindow.loadURL(origin + "/licence.html");
      } else if (active && locked) mainWindow.loadURL(origin + "/");
    };
    const monitor = setInterval(enforce, 1000);
    monitor.unref();
    powerMonitor.on("resume", enforce);

    protocol.handle("retail", (request) => {
      if (!isAppURL(request.url))
        return new Response("Forbidden", { status: 403 });
      let requested;
      try {
        requested = decodeURIComponent(new URL(request.url).pathname);
      } catch {
        return new Response("Bad request", { status: 400 });
      }
      const lockFiles = {
        "/licence.html": "licence.html",
        "/licence-screen.js": "licence-screen.js",
      };
      if (lockFiles[requested])
        return net.fetch(
          pathToFileURL(path.join(__dirname, lockFiles[requested])).href,
        );
      if (licence.status().state !== "active")
        return Response.redirect(origin + "/licence.html");
      const file = path.resolve(
        root,
        "." + (requested === "/" ? "/index.html" : requested),
      );
      const relative = path.relative(root, file);
      if (relative.startsWith("..") || path.isAbsolute(relative))
        return new Response("Forbidden", { status: 403 });
      return net.fetch(pathToFileURL(file).href);
    });
    const createWindow = () => {
      mainWindow = new BrowserWindow({
        width: 1440,
        height: 960,
        minWidth: 850,
        minHeight: 650,
        title: "Retail ERP",
        backgroundColor: "#f0fdf7",
        show: false,
        webPreferences: {
          preload: path.join(__dirname, "preload.cjs"),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webSecurity: true,
        },
      });
      mainWindow.on("focus", enforce);
      mainWindow.once("ready-to-show", () => {
        mainWindow.maximize();
        mainWindow.show();
      });
      mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
      mainWindow.webContents.on("will-navigate", (event, url) => {
        if (!isAppURL(url)) event.preventDefault();
      });
      mainWindow.webContents.session.setPermissionRequestHandler(
        (_contents, _permission, callback) => callback(false),
      );
      if (!downloadsConfigured) {
        mainWindow.webContents.session.on("will-download", (_event, item) => {
          item.setSaveDialogOptions({
            title: "Save ERP export",
            defaultPath: path.join(
              app.getPath("downloads"),
              path.basename(item.getFilename()),
            ),
          });
        });
        downloadsConfigured = true;
      }
      mainWindow.on("close", () =>
        mainWindow.webContents.session.flushStorageData(),
      );
      mainWindow.on("closed", () => {
        mainWindow = null;
      });
      mainWindow
        .loadURL(
          origin +
            (licence.status().state === "active" ? "/" : "/licence.html"),
        )
        .catch((error) =>
          dialog.showErrorBox("Retail ERP could not start", error.message),
        );
    };
    const template = [
      ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
      {
        label: "File",
        submenu: [
          {
            label: "Dashboard",
            accelerator: "CmdOrCtrl+Home",
            click: () =>
              mainWindow?.webContents.executeJavaScript(
                "location.hash='/dashboard'",
              ),
          },
          { type: "separator" },
          {
            label: "Backup & Restore",
            click: () =>
              mainWindow?.webContents.executeJavaScript(
                "location.hash='/backup'",
              ),
          },
          {
            label: "Show Local Data Folder",
            click: () => shell.openPath(app.getPath("userData")),
          },
          {
            label: "Connect Superadmin Register…",
            click: async () => {
              try {
                licence.assertActive();
                const result = await dialog.showOpenDialog(mainWindow, {
                  title: "Select your private .vendor provider folder",
                  message: "Choose the provider folder containing licences.json and the matching private-key.pem. Keep this folder on your own computer.",
                  properties: ["openDirectory", "showHiddenFiles"],
                });
                if (result.canceled) return;
                const directory = result.filePaths[0];
                assertProviderDirectory(directory, publicKey);
                readProviderRegistry({ directory, publicKey });
                fs.writeFileSync(providerConfig, JSON.stringify({ directory }), { mode: 0o600 });
                providerDirectory = directory;
                await mainWindow.webContents.executeJavaScript("location.hash='/licence'; location.reload()");
              } catch (error) {
                dialog.showErrorBox("Superadmin register", error.message);
              }
            },
          },
          { type: "separator" },
          { role: process.platform === "darwin" ? "close" : "quit" },
        ],
      },
      { role: "editMenu" },
      {
        label: "View",
        submenu: [
          { role: "reload" },
          ...(!app.isPackaged ? [{ role: "toggleDevTools" }] : []),
          { type: "separator" },
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { role: "togglefullscreen" },
        ],
      },
      { role: "windowMenu" },
      {
        label: "Help",
        submenu: [
          {
            label: "About Retail ERP",
            click: () =>
              dialog.showMessageBox(mainWindow, {
                title: "Retail ERP",
                message: "Retail ERP " + app.getVersion(),
                detail:
                  "Offline retail billing, inventory and accounting. Your records are saved on this computer. Use Backup & Restore to export regular backups.",
              }),
          },
        ],
      },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
