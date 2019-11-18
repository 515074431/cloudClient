const { ipcMain } = require('electron');
const storage = require('./storage');
const filePath = require('path');
const webDav = require('licheng-webdav');
const  request = require("request");
const util = require('util')
let checkingFiles = require('./checkingFiles')



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

  // let result =  await post({
  //   //url: 'http://localhost:8080/api/v1/account',//userInfo.remoteUrl + '/api/v1/account',
  //   method: 'POST',
  //   //hostname:'localhost:8080',
  //   protocol:'http:',
  //   host: 'localhost',
  //   port:8080,
  //   path: '/api/v1/account',
  //   data: {username:userInfo.username,password:userInfo.password},
  // });
  let result = await post('http://localhost:8080/api/v1/account',{json:true,body:{username:userInfo.username,password:userInfo.password}})

  //console.log('重新获得的登录信息',Object.keys(result.body.data))
  if(result.body.status){
    userInfo.token = result.body.data.token
    await storage.set('userInfo', userInfo, { dataPath: dataPath });
  }
  return result.body
}


module.exports = () => {
  //登录成功
  let login_sucess = async (event, args) => {
    //console.log(username,password,baseurl,token) // prints "ping"
    console.log(args);
    let url = new URL(args.baseurl);
    let userInfo = await storage.get('userInfo', { dataPath: dataPath });
    if(Object.keys(userInfo).length == 0){//还没有登录，是空的
      userInfo = {
        ...args,
        remoteUrl: url.origin,
        remotePath: '/api/v1/webdav2/',
        sync:[]
      };
    }else {
      userInfo = {
        ...userInfo,
        ...args,
        remoteUrl: url.origin
      };
    }

    await storage.set('userInfo', userInfo, { dataPath: dataPath });
    event.returnValue = '操作成功';
    event.reply('userInfoWrited', userInfo);
  };
  //查找远程文件
  let propfind_child = async (event, url) => {
    console.log('URL:',url)
    let userInfo = await storage.get('userInfo', { dataPath: dataPath });
    let reqestPath = url == '/'? userInfo.remotePath : url
    let webDavClient = await createWebDavClient(userInfo);
    let result
    try {
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
    event.returnValue = userInfo.sync
  }
  //删除同步目录到本地数据中
  let storage_remove_check_path = async (event, {localPath,remotePath}) => {
    console.log('storage_remove_check_path',{localPath,remotePath})
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
    if (check == true){
      checkingFiles.init(remotePath,localPath)
    }
    event.returnValue = userInfo.sync
  }
  //获取本地数据中的同步文件夹信息
  let storage_fetch_check_path = async (event,args)=>{
    let userInfo = await storage.get('userInfo', { dataPath: dataPath });
    event.returnValue =  userInfo.sync
  }



    ipcMain.on('login_sucess', login_sucess);
    ipcMain.on('propfind_child', propfind_child);
    ipcMain.on('storage_add_check_path', storage_add_check_path);
    ipcMain.on('storage_fetch_check_path', storage_fetch_check_path);
    ipcMain.on('storage_remove_check_path', storage_remove_check_path);
    ipcMain.on('storage_update_check_path', storage_update_check_path);

};
