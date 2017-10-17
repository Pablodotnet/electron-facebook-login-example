const electron = require('electron')
const ipcMain = electron.ipcMain;
var FB = require('fb');

// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Code to create fb authentication window
ipcMain.on('fb-authenticate', function (event, arg) {
  var options = {
    client_id: 'HERE_GOES_YOUR_FB_APP_ID',
    scopes: 'public_profile',
    redirect_uri: 'https://www.facebook.com/connect/login_success.html'
  };

  var authWindow = new BrowserWindow({ width: 450, height: 300, show: false, parent: mainWindow, modal: true, webPreferences: { nodeIntegration: false } });
  var facebookAuthURL = `https://www.facebook.com/v2.8/dialog/oauth?client_id=${options.client_id}&redirect_uri=${options.redirect_uri}&response_type=token,granted_scopes&scope=${options.scopes}&display=popup`;

  authWindow.loadURL(facebookAuthURL);
  authWindow.show();
  authWindow.webContents.on('did-get-redirect-request', function (event, oldUrl, newUrl) {
    var raw_code = /access_token=([^&]*)/.exec(newUrl) || null;
    var access_token = (raw_code && raw_code.length > 1) ? raw_code[1] : null;
    var error = /\?error=(.+)$/.exec(newUrl);

    if(access_token) {
      FB.setAccessToken(access_token);
      FB.api('/me', { fields: ['id', 'name', 'picture.width(800).height(800)'] }, function (res) {
        mainWindow.webContents.executeJavaScript("document.getElementById(\"fb-name\").innerHTML = \" Name: " + res.name + "\"");
        mainWindow.webContents.executeJavaScript("document.getElementById(\"fb-id\").innerHTML = \" ID: " + res.id + "\"");
        mainWindow.webContents.executeJavaScript("document.getElementById(\"fb-pp\").src = \"" + res.picture.data.url + "\"");
      });
      authWindow.close();
    }
  });
})