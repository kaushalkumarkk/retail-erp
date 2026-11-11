const { app, BrowserWindow, protocol, net, Menu, dialog, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
app.setName('Retail ERP');
// This stable origin keeps localStorage consistent across app updates and installs.
protocol.registerSchemesAsPrivileged([{scheme:'retail',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
if(!app.isPackaged && process.env.ERP_TEST_PROFILE) app.setPath('userData',process.env.ERP_TEST_PROFILE);
let mainWindow;
let downloadsConfigured=false;
const origin='retail://app';
const isAppURL=url=>{try{const u=new URL(url);return u.protocol==='retail:'&&u.host==='app'}catch{return false}};
if(!app.requestSingleInstanceLock()) app.quit();
else {
app.on('second-instance',()=>{if(mainWindow){if(mainWindow.isMinimized())mainWindow.restore();mainWindow.show();mainWindow.focus()}});
app.whenReady().then(()=>{
 const root=path.join(app.getAppPath(),'dist');
 protocol.handle('retail',request=>{
  if(!isAppURL(request.url))return new Response('Forbidden',{status:403});
  let requested;try{requested=decodeURIComponent(new URL(request.url).pathname)}catch{return new Response('Bad request',{status:400})}
  const file=path.resolve(root,'.'+(requested==='/'?'/index.html':requested));
  const relative=path.relative(root,file);
  if(relative.startsWith('..')||path.isAbsolute(relative))return new Response('Forbidden',{status:403});
  return net.fetch(pathToFileURL(file).href);
 });
 const createWindow=()=>{
 mainWindow=new BrowserWindow({width:1440,height:960,minWidth:850,minHeight:650,title:'Retail ERP',backgroundColor:'#030817',show:false,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
 mainWindow.once('ready-to-show',()=>mainWindow.show());
 mainWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 mainWindow.webContents.on('will-navigate',(event,url)=>{if(!isAppURL(url))event.preventDefault()});
 mainWindow.webContents.session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
 if(!downloadsConfigured){
  mainWindow.webContents.session.on('will-download',(_event,item)=>{
   item.setSaveDialogOptions({title:'Save ERP export',defaultPath:path.join(app.getPath('downloads'),path.basename(item.getFilename()))});
  });
  downloadsConfigured=true;
 }
 mainWindow.on('close',()=>mainWindow.webContents.session.flushStorageData());
 mainWindow.on('closed',()=>{mainWindow=null});
 mainWindow.loadURL(origin+'/').catch(error=>dialog.showErrorBox('Retail ERP could not start',error.message));
 };
 const template=[...(process.platform==='darwin'?[{role:'appMenu'}]:[]),{label:'File',submenu:[{label:'Dashboard',accelerator:'CmdOrCtrl+Home',click:()=>mainWindow?.loadURL(origin+'/#/dashboard')},{type:'separator'},{label:'Backup & Restore',click:()=>mainWindow?.loadURL(origin+'/#/backup')},{label:'Show Local Data Folder',click:()=>shell.openPath(app.getPath('userData'))},{type:'separator'},{role:process.platform==='darwin'?'close':'quit'}]},{role:'editMenu'},{label:'View',submenu:[{role:'reload'},...(!app.isPackaged?[{role:'toggleDevTools'}]:[]),{type:'separator'},{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'}]},{role:'windowMenu'},{label:'Help',submenu:[{label:'About Retail ERP',click:()=>dialog.showMessageBox(mainWindow,{title:'Retail ERP',message:'Retail ERP '+app.getVersion(),detail:'Offline retail billing, inventory and accounting. Your records are saved on this computer. Use Backup & Restore to export regular backups.'})}]}];
 Menu.setApplicationMenu(Menu.buildFromTemplate(template));
 createWindow();
 app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
}
