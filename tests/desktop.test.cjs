const {test}=require('node:test');
const assert=require('node:assert/strict');
const { _electron:electron }=require('playwright');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
test('desktop starts without a server, saves data, and preserves it after relaunch',async()=>{
 const profile=await fs.mkdtemp(path.join(os.tmpdir(),'retail-desktop-test-'));
 let app;
 const launch=()=>electron.launch({args:[path.resolve('.')],env:{...process.env,ELECTRON_RUN_AS_NODE:undefined,ERP_TEST_PROFILE:profile}});
 try{
  app=await launch();let page=await app.firstWindow();await page.getByRole('heading',{name:'RAHUL JEE TRADING COMPANY'}).waitFor();assert.equal(new URL(page.url()).protocol,'retail:');
  await page.getByRole('button',{name:'Add Item (F5)',exact:true}).click();
  await page.getByRole('dialog').getByLabel('Product Name').fill('Desktop Stock');
  await page.getByRole('dialog').getByLabel('Opening Stock').fill('12');
  await page.getByRole('dialog').getByRole('button',{name:'Save Product'}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('retailer-erp:v1')).items.length===1);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('retailer-erp:v1')).items[0].stock),12);
  assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences().nodeIntegration),false);
  await app.close();app=null;
  app=await launch();page=await app.firstWindow();await page.getByRole('heading',{name:'RAHUL JEE TRADING COMPANY'}).waitFor();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('retailer-erp:v1')).items[0].name),'Desktop Stock');
  await page.screenshot({path:'/tmp/retail-desktop.png'});
 }finally{if(app)await app.close();await fs.rm(profile,{recursive:true,force:true})}
});
