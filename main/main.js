const { Tray, app, BrowserWindow ,Menu,nativeImage } = require('electron');
const path = require('path');
const ipcMain = require('./ipcMain')
// 保持对window对象的全局引用，如果不这么做的话，当JavaScript对象被
// 垃圾回收的时候，window对象将会自动的关闭
let win;
let appIcon = null

  function createWindow() {
  // 创建浏览器窗口。
  win = new BrowserWindow({
    width: 800,
    height: 600,
    //frame: false,
    title: '励铖建筑云盘',
    autoHideMenuBar: true,
    icon:nativeImage.createFromPath(path.join(__dirname,'../src/assets/logo.png')),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // 加载index.html文件
    win.loadFile('dist/index.html');
    //win.loadURL('http://localhost:8000')

  // 打开开发者工具
  //win.webContents.openDevTools();




  // 当 window 被关闭，这个事件会被触发。
  win.on('closed', () => {
    // 取消引用 window 对象，如果你的应用支持多窗口的话，
    // 通常会把多个 window 对象存放在一个数组里面，
    // 与此同时，你应该删除相应的元素。
     //win = null;
    //win.hide()

  });
}



// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', ()=>{
  createWindow()//创建窗口
//将程序放入右下角托盘

  const iconName = process.platform === 'win32' ? 'windows-icon.png' : 'iconTemplate.png'
  const iconPath = path.join(__dirname,'../src/assets', iconName)
  appIcon = new Tray(nativeImage.createFromPath(iconPath))
  const contextMenu = Menu.buildFromTemplate([
    {
      label:'打开',
      click:async function() {
        if(win.isDestroyed()){
          createWindow()
        }else{
          win.focus()
        }
      }
    },
    {
      label: '退出',
      click: function () {
        //event.sender.send('tray-removed')
        console.log('点击了退出')
        app.quit()
      }
    }
  ])
  appIcon.setToolTip('励铖建筑云盘')
  appIcon.setContextMenu(contextMenu)


  // 在主进程中.
  ipcMain()//主辅进程会话交互中

});

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    //app.quit();
    win.hide()
  }
});

app.on('activate', async () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (win === null) {
    await createWindow();


  }
});

