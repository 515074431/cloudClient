const { app, BrowserWindow  } = require('electron');
const storage = require('./storage');
const filePath = require('path');
const ipcMain = require('./ipcMain')
// 保持对window对象的全局引用，如果不这么做的话，当JavaScript对象被
// 垃圾回收的时候，window对象将会自动的关闭
let win;

function createWindow() {
  // 创建浏览器窗口。
  win = new BrowserWindow({
    width: 800,
    height: 600,
    //frame: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // 加载index.html文件
  //win.loadFile('./dist/index.html');
  win.loadURL('http://localhost:8000')

  // 打开开发者工具
  win.webContents.openDevTools();


  // 在主进程中.
  ipcMain()//主辅进程会话交互中
  //const { ipcMain } = require('electron')
  // ipcMain.on('userInfoWrited', (event, arg) => {
  //   console.log(arg) // prints "ping"
  // })

  // ipcMain.on('loginSucess', async (event, args) => {
  //   //console.log(username,password,baseurl,token) // prints "ping"
  //   console.log(args)
  //   let dataPath = filePath.join(__dirname, 'data');
  //   storage.setDataPath(dataPath);
  //   let url = new URL(args.baseurl)
  //   let userInfo = {
  //     ...args,
  //     remoteUrl:url.origin
  //   }
  //   await storage.set('userInfo', userInfo, { dataPath: dataPath });
  //   event.returnValue = '操作成功'
  //   event.reply('userInfoWrited',userInfo)
  // })





  // 当 window 被关闭，这个事件会被触发。
  win.on('closed', () => {
    // 取消引用 window 对象，如果你的应用支持多窗口的话，
    // 通常会把多个 window 对象存放在一个数组里面，
    // 与此同时，你应该删除相应的元素。
    win = null;
  });
}

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', createWindow);

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (win === null) {
    createWindow();
  }
});

//下载远程文件到本地
let checkingFiles = require('./checkingFiles')

//checkingFiles.init('/api/v1/webdav2/','D:\\tmp3\\test3')
