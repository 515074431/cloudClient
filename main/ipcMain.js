const { ipcMain } = require('electron');
const storage = require('./storage');
const filePath = require('path');
const webDav = require('licheng-webdav');
const  request = require("request");
const util = require('util')
let checkingFiles = require('./checkingFiles')

let checkings = {}//检查对象

let dataPath = filePath.join(__dirname, 'data');
storage.setDataPath(dataPath);

let createWebDavClient= async function(userInfo) {

  return await webDav.createClient(userInfo.remoteUrl, {
    token: {
      token_type: 'Bearer',
      access_token: userInfo.token,
    },
  });
}

let refreshToken =  async function(){
  console.log('aaaaaaaaa')
  let userInfo = await storage.get('userInfo', { dataPath: dataPath });
  let post = util.promisify(request.post)

  let result = await post(userInfo.baseurl,{json:true,body:{username:userInfo.username,password:userInfo.password}})

  //console.log('重新获得的登录信息',Object.keys(result.body.data))
  if(result.body.status){
    userInfo.token = result.body.data.token
    await storage.set('userInfo', userInfo, { dataPath: dataPath });
  }
  return result.body
}


module.exports = () => {
  //登录成功
  let login = async (event, {username,password,baseurl}) => {
    console.log(username,password,baseurl) // prints "ping"
    //console.log(args);

    let post = util.promisify(request.post)

    let result = await post(baseurl+'/api/v1/login',{json:true,body:{account:username,password}})

    if(result.body.status) {

      let url = new URL(baseurl);
      let userInfo = await storage.get('userInfo', { dataPath: dataPath });
      if (Object.keys(userInfo).length == 0) {//还没有登录，是空的
        userInfo = {
          username, password, baseurl,
          token:result.body.data.token,
          remoteUrl: url.origin,
          remotePath: '/api/v1/dav/data/'+ username + '/',
          sync: []
        };
      } else {
        userInfo = {
          ...userInfo,
          token:result.body.data.token,
          username, password, baseurl,
          remoteUrl: url.origin
        };
      }

      await storage.set('userInfo', userInfo, { dataPath: dataPath });
    }
    event.returnValue = result.body;
    event.reply('userInfoWrited',  result.body);
  };
  //查找远程文件
  let propfind_child = async (event, url) => {
    console.log('URL:',url)
    let userInfo = await storage.get('userInfo', { dataPath: dataPath });
    if(Object.keys(userInfo).length == 0 ){//没有登录信息
      event.returnValue = {message:'没有登录信息'}
      return
    }
    let reqestPath = url == '/'? userInfo.remotePath : url
    let webDavClient = await createWebDavClient(userInfo);
    let result
    try {
      console.log(userInfo)
      if (url == '/') {
        result = await webDavClient.getDirectoryContents(userInfo.remotePath, { deep: 0, filterSelf: false });
        //  let root = result.shift()
        // root.children = result
        // result =  [root]
      } else {
        result = await webDavClient.getDirectoryContents(url, { deep: 1 });
      }
    }catch (e) {
      if(e.response.status == 401){
        let login = await refreshToken()

        if(login.status){//登录成功
          userInfo = await storage.get('userInfo', { dataPath: dataPath });
          webDavClient = await createWebDavClient(userInfo);
          if (url == '/') {
            result = await webDavClient.getDirectoryContents(userInfo.remotePath, { deep: 0, filterSelf: false });
            //  let root = result.shift()
            // root.children = result
            // result =  [root]
          } else {
            result = await webDavClient.getDirectoryContents(url, { deep: 1 });
          }
        }else{//登录失败
          result = '密码错误，登录失败'
        }
      }
      console.log(Object.keys(e))
    }

    event.returnValue = result
  }
  //添加同步目录到本地数据中
  let storage_add_check_path = async (event, {localPath,remotePath}) => {
    console.log({localPath,remotePath})
    let userInfo = await storage.get('userInfo', { dataPath: dataPath });
     userInfo = {
      ...userInfo,
       sync:[
         ...userInfo.sync,
         {remotePath,localPath,check:false}
       ]
    };
    await storage.set('userInfo', userInfo, { dataPath: dataPath });
    checkings[remotePath] = new checkingFiles()
    event.returnValue = userInfo.sync
  }
  //删除同步目录到本地数据中
  let storage_remove_check_path = async (event, {localPath,remotePath}) => {
    console.log('storage_remove_check_path',{localPath,remotePath})
    //先停止运行，再删除对应对象
    checkings[remotePath].unwatch()
    delete checkings[remotePath]

    let userInfo = await storage.get('userInfo', { dataPath: dataPath });
    let sync = userInfo.sync.filter((item)=>{
      return item.localPath != localPath && item.remotePath != remotePath
    })
     userInfo = {
      ...userInfo,
       sync
    };
    await storage.set('userInfo', userInfo, { dataPath: dataPath });
    event.returnValue = userInfo.sync
  }
  //更新同步目录到本地数据中
  let storage_update_check_path = async (event, {localPath,remotePath,check}) => {
    console.log({localPath,remotePath})
    let userInfo = await storage.get('userInfo', { dataPath: dataPath });
    let sync = userInfo.sync.map((item)=>{
      if(item.remotePath == remotePath && item.localPath == localPath){
       item.check = check
      }
      return item
    })
     userInfo = {
      ...userInfo,
       sync
    };
    await storage.set('userInfo', userInfo, { dataPath: dataPath });
    if (check == true){//启动监控同步
      checkings[remotePath].init(remotePath,localPath)
    }else{//停止监控同步
      checkings[remotePath].unwatch()
    }
    event.returnValue = userInfo.sync
  }
  //获取本地数据中的同步文件夹信息
  let storage_fetch_check_path = async (event,args)=>{
    let userInfo = await storage.get('userInfo', { dataPath: dataPath });
    if(Object.keys(userInfo).length == 0 || !userInfo.hasOwnProperty('sync')){
      event.returnValue = {message:'没有登录,需要重新登录'}
      return
    }
    for (let sync of userInfo.sync){
      if(!checkings.hasOwnProperty(sync.remotePath)) {
        checkings[sync.remotePath] = new checkingFiles()
        if (sync.check) {//默认已经开启
          checkings[sync.remotePath].init(sync.remotePath,sync.localPath)
        }
      }
    }
    event.returnValue =  userInfo.sync
  }



    ipcMain.on('login', login);
    ipcMain.on('propfind_child', propfind_child);
    ipcMain.on('storage_add_check_path', storage_add_check_path);
    ipcMain.on('storage_fetch_check_path', storage_fetch_check_path);
    ipcMain.on('storage_remove_check_path', storage_remove_check_path);
    ipcMain.on('storage_update_check_path', storage_update_check_path);

};
