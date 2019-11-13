const webDav = require('licheng-webdav');
const filePath = require('path');
const os = require('os');
const storage = require('./storage');
const lodash = require('lodash');
const fs = require('fs');
const chokidar = require('chokidar');
const hash = require('./hash')
const checkingFiles = {
  remotePath: '/',//线上地址
  localPath: __dirname,//本地地址
  filesDataName:'',//本地文件信息存储名称加密后半部分
  userInfo: null,//用户信息
  webDavClient: null,//webdav客户端
  filesData: [],//本地的文件信息数据
  change: false,//远程和本地比较是否有变化
  watchFiles: [],//监控变动的文件信息
  watchFilesExclude: [],//监控变动的文件信息需要排除的文件
  /**
   * 创建webdav客户端
   * @param userInfo
   * @returns {Promise<Object|ClientInterface|*>}
   */
  createWebDavClient: async function(userInfo) {
    return webDav.createClient(userInfo.remoteUrl, {
      token: {
        token_type: 'Bearer',
        access_token: userInfo.token,
      },
    });
  },

  /**
   * 检查目录
   * @param checkDir 检查的目录
   * @returns {Promise<void>}
   * @constructor
   */
  remote2local: async function(checkDir) {
    console.log('----------------------检查目录开始-------------------------------');
    console.log('目录：', checkDir);
    let currentDir = await this.webDavClient.getDirectoryContents(checkDir, { deep: 0, filterSelf: false });
    currentDir = currentDir[0];
    const oldDirIndex = lodash.findIndex(this.filesData, { filename: currentDir.filename });//原文件夹索引
    if (oldDirIndex == -1) {//文件夹不存在  直接创建
      console.log('文件夹不存在  直接创建', currentDir[0].filename);
      this.change = true;//将变化状态改为true
      this.filesData.push(currentDir);//把文件信息放进数据里面
      await this.wGetRemote2local(currentDir);//下载文件或文件夹到本地
    } else {//文件夹存在  进行对比
      const oldDir = this.filesData[oldDirIndex];//原文件夹信息
      //console.log(currentDir)
      //console.log(oldDir)
      console.log('目录存在，对比etag');
      console.log('远程：', currentDir.etag);
      console.log('本地：', oldDir.etag);
      if (currentDir.etag != oldDir.etag) {//etag有变化
        this.change = true;//将变化状态改为true
        this.filesData[oldDirIndex] = currentDir; //将原来值索引对应位置的值改成新的信息  这里不需要重新创建文件

        // if (currentDir.type == 'file') {//是文件只需要重新下载
        //   await this.wGetRemote2local(currentDir);
        //   console.log('是文件只需要重新下载',currentDir.filename)
        // } else if (currentDir.type == 'directory') {//是文件夹，不用创建，需要进入下一级比较

          //console.log("子文件夹curentChilrens",curentChilrens)
          console.log('================文件夹有变化:', checkDir, '==================');
          const currentChildren = await this.webDavClient.getDirectoryContents(checkDir, { deep: 1, filterSelf: false });


          for (let currentChild of currentChildren) {//先根据远程有的文件同步到本地文件
            console.log('子目录：', currentChild.filename);
            let oldChildIndex = lodash.findIndex(this.filesData, { filename: currentChild.filename });
            if (oldChildIndex == -1) {//本地没有，没有则下载,有则要检查是否一致
              //todo
              console.log('   本地没有则下载到本地');
              this.change = true;

              if (currentChild.type == 'directory') {//新增的是文件夹，进行递归操作
                console.log('   新建的是文件夹，进行递归操作');
                ///////////////////////////这里操作新建文件夹的东西////////////////////////////////////////
                //await this.remote2local(currentChild.filename);//递归的调用
                let batchFilesData = await this.batchDownLoad(currentChild.filename);//批量下载线上新建的文件夹下的所有内容
                this.filesData.push(...batchFilesData);//把新增的批量文件信息放进数据里面
              }
              if (currentChild.type == 'file'){//新增的是文件
                this.filesData.push(currentChild);//把文件信息放进数据里面
                await this.wGetRemote2local(currentChild);//下载文件到本地
              }
            } else {//本地有对应文件或文件夹
              let oldChild = this.filesData[oldChildIndex];
              console.log('=====oldChild,currentChild====',oldChild,currentChild)
              if (currentChild.etag != oldChild.etag) {//有变化
                if (currentChild.type == 'directory') {//是文件夹，进行递归操作
                  console.log('   是文件夹，进行递归操作');
                  await this.remote2local(currentChild.filename);//递归的调用
                } else {//是文件，直接下载，覆盖
                  //todo
                  console.log('   是文件，直接下载，覆盖');
                  this.change = true;
                  this.filesData[oldChildIndex] = currentChild;//把文件信息放进数据里面
                  await this.wGetRemote2local(currentChild, true);//下载文件到本地
                }
              } else {
                console.log('   没变化');
              }
            }
          }
          //重要：检查本地有的，远程没有的文件，说明文件被远程删除了，做删除本地操作
          let oldChildren = lodash.filter(this.filesData, (o) => {
            //if(o.type == 'directory') {
              return lodash.startsWith(o.filename, checkDir) && o.filename.substring(checkDir.length+1).search(/\//) == -1;
            // }
            // if(o.type == 'file') {
            //   return lodash.startsWith(o.filename, checkDir) //&& o.filename.substring(checkDir.length).search(/\//) == -1;
            // }
          });
          let difference = lodash.differenceBy(oldChildren, currentChildren, 'filename');
          console.log('下面开始检查：',checkDir,this.filesData,oldChildren, currentChildren)
          console.log('本地有的文件，线上已经删除了', difference);
          for (let diff of difference) {//这里一点问题，就是第一次循环时就把所有文件删除了，后面只是删除数据
            this.rmFolder(this.pathRemote2local(diff.filename));
            this.filesData.splice(lodash.findIndex(this.filesData, { filename: diff.filename }), 1);//删除本地数据里面的对应信息
            this.change = true;
          }



      } else {
        console.log('==================文件夹没有变化====================');
      }
    }
    console.log('----------------------检查目录结束--------------------------');
  },
  /**
   * 递归的删除文件夹
   * @returns {Promise<void>}
   */
  rmFolder: function(path) {
    if (fs.existsSync(path)) {

      let stat = fs.statSync(path);
      if (stat.isFile()) {
        fs.unlinkSync(path);
        this.change = true;
        this.watchFilesExclude.push({ path: path, action: 'unlink' });
      }
      if (stat.isDirectory()) {
        let files = fs.readdirSync(path);
        for (let file of files) {
          let curPath = filePath.join(path, file);
          this.rmFolder(curPath);
        }
        fs.rmdirSync(path);
        this.change = true;
        this.watchFilesExclude.push({ path: path, action: 'unlinkDir' });
      }
    }
  },
  /**
   * 转换路径 将远程路径转换成本地路径
   * @param remoteUrl 线上地址
   * @returns {string}
   */
  pathRemote2local: function(remoteUrl) {//转换远程路径为本地路径
    return filePath.join(this.localPath, remoteUrl.substring(this.remotePath.length)).replace('/', '\\');
  },
  /**
   * 转换路径 将本地路径转换成远程路径
   * @param localPath  本地路径
   * @returns {string}
   */
  pathLocal2remote: function(localPath) {
    let str = filePath.join(this.remotePath, localPath.substring(this.localPath.length));
    return str.replace(/\\/g, '/');
  },

  /**
   * 下载 从远程到本地
   * @param remoteFile  远程文件信息
   * @param change   布尔 是否是更改
   * @returns {Promise<void>}
   */
  wGetRemote2local: async function(remoteFile, change = false) {
    let localPath = this.pathRemote2local(remoteFile.filename);
    let action;
    if (remoteFile.type == 'directory') {
      fs.mkdirSync(localPath, { recursive: true });
      console.log(localPath, '  文件夹创建好了');
      action = 'addDir';
    } else if (remoteFile.type == 'file') {
      await this.webDavClient.createReadStream(remoteFile.filename).pipe(fs.createWriteStream(localPath));
      console.log(localPath, '  文件创建好了');
      action = change ? 'change' : 'add';
    }
    //将从远程获得的文件变更操作放入监控文件排除队列
    this.watchFilesExclude.push({
      path: localPath,
      action: action,
    });
  },


  /**
   * 批量下载，同步线上到本地
   * @param remotePath
   * @returns {Promise<Array<Stat>>}
   */
  batchDownLoad: async function(remotePath) {
    let filesData = await this.webDavClient.getDirectoryContents(remotePath, {
      deep: 'infinity',
      filterSelf: false,
    });
    //console.log(filesData)
    for (let fileData of filesData) {
      //let filePath = pathRemote2local(fileData.filename,remoteStart,localPath)  //转换路径为本地路径
      //console.log(filePath)
      await this.wGetRemote2local(fileData);
    }
    return filesData;
  },
  /**
   * 本地到远程 同步数据
   * @returns {Promise<void>}
   */
  local2remote: async function() {
    console.log('----local2remote  start-----')
    let watchFilesLength = this.watchFiles.length
    for (let i = 0; i < watchFilesLength; i++) {
      let handle = this.watchFiles.shift();
      console.log('操作:', handle);
      //查找监控文件排除队列里面是否有当前文件
      let watchFilesExcludeIndex =  lodash.findIndex(this.watchFilesExclude,{path:handle.stats.path,action:handle.action})
      console.log('排除文件：',watchFilesExcludeIndex)
      if(watchFilesExcludeIndex != -1){//找到了，需要排除在外
        this.watchFilesExclude.splice(watchFilesExcludeIndex,1)//删除排除队列中的值
        continue
      }
      let remotePath = this.pathLocal2remote(handle.stats.path);
      console.log('----本地路径====线上路径-----', handle.stats.path, remotePath);
      //上传操作
      switch (handle.action) {
        case 'unlink'://删除文件
          //await unlink(handle.stats.path);
          await this.webDavClient.deleteFile(remotePath);
          //修改本地同步数据
          let unlinkPathIndex = lodash.findIndex(this.filesData, { filename: remotePath });
          console.log('删除文件数据信息',unlinkPathIndex,this.filesData[unlinkPathIndex])
          if(unlinkPathIndex !=-1){
            this.filesData.splice(unlinkPathIndex, 1);//删除文件数据记录
          }
          break;
        case 'unlinkDir'://删除文件夹
          //await unlinkDir(handle.stats.path);
          await this.webDavClient.deleteFile(remotePath);

          //修改本地同步数据
          console.log('删除文件夹及子文件夹数据信息',this.filesData.filter(item=>lodash.startsWith(item.filename,remotePath)))
          this.filesData = this.filesData.filter(item=>!lodash.startsWith(item.filename,remotePath))



          break;
        case 'add'://上传文件
          //await add(handle.stats.path,handle.stats);
          if (fs.existsSync(handle.stats.path)) {//当文件存在时才上传，因为有时候新建后修改了文件名还是有创建的记录，但是没有了原始文件
            await this.webDavClient.putFileContents(remotePath, handle.stats.path);
            //修改本地同步数据

            let fileData = await this.webDavClient.stat(remotePath);//远程文件数据信息
            console.log('====state====', fileData);
            //fileData = fileData[0];
            this.filesData.push(fileData);//将文件信息放进文件数据记录里
            this.change = true;//修改变更状态
          }

          break;
        case 'addDir'://上传文件夹
          //await addDir(handle.stats.path,handle.stats);
          if (fs.existsSync(handle.stats.path)) {//当文件存在时才上传，因为有时候新建后修改了文件名还是有创建的记录，但是没有了原始文件
            await this.webDavClient.createDirectory(remotePath);

            //修改本地同步数据
            let fileData = await this.webDavClient.getDirectoryContents(remotePath, { deep: 0, filterSelf: false });//远程文件数据信息
            fileData = fileData[0];
            this.filesData.push(fileData);//将文件信息放进文件数据记录里
            this.change = true;//修改变更状态

          }
          break;
        case 'change'://修改内容
          //await change(handle.stats.path,handle.stats);
          await this.webDavClient.putFileContents(remotePath, handle.stats.path);
          //修改本地同步数据
          let changePathIndex = lodash.findIndex(this.filesData, { filename: remotePath });
          console.log('288---remotePath',remotePath)
          //let changeData = await this.webDavClient.getDirectoryContents(remotePath, { deep: 0, filterSelf: false });//远程文件数据信息
          let changeData = await this.webDavClient.stat(remotePath);//远程文件数据信息
          console.log('289---changeData',changeData)
          //changeData = changeData[0];
          this.filesData.splice(changePathIndex, 1, changeData);//删除并将新的文件信息更新

          break;
        default:
          break;
      }
      //修改本地同步数据
      // switch (handle.action) {
      //   case 'unlink'://删除文件
      //   case 'unlinkDir'://删除文件夹
      //     //await unlink(handle.stats.path);
      //     //await unlinkDir(handle.stats.path);
      //     let unlinkPathIndex = lodash.findIndex(this.filesData, { filename: remotePath });
      //     console.log('删除文件数据信息',unlinkPathIndex,this.filesData[unlinkPathIndex])
      //     if(unlinkPathIndex !=-1){
      //       this.filesData.splice(unlinkPathIndex, 1);//删除文件数据记录
      //     }
      //     break;
      //   case 'add'://上传文件
      //     //await add(handle.stats.path,handle.stats);
      //     if (fs.existsSync(handle.stats.path)) {//当文件存在时才上传，因为有时候新建后修改了文件名还是有创建的记录，但是没有了原始文件
      //       let fileData = await this.webDavClient.stat(remotePath);//远程文件数据信息
      //       console.log('====state====', fileData);
      //       //fileData = fileData[0];
      //       this.filesData.push(fileData);//将文件信息放进文件数据记录里
      //       this.change = true;//修改变更状态
      //     }
      //     break;
      //   case 'addDir'://上传文件夹
      //
      //     //await addDir(handle.stats.path,handle.stats);
      //     if (fs.existsSync(handle.stats.path)) {//当文件存在时才上传，因为有时候新建后修改了文件名还是有创建的记录，但是没有了原始文件
      //       let fileData = await this.webDavClient.getDirectoryContents(remotePath, { deep: 0, filterSelf: false });//远程文件数据信息
      //       fileData = fileData[0];
      //       this.filesData.push(fileData);//将文件信息放进文件数据记录里
      //       this.change = true;//修改变更状态
      //     }
      //     break;
      //   case 'change'://修改内容
      //     //await change(handle.stats.path,handle.stats);
      //     let changePathIndex = lodash.findIndex(this.filesData, { filename: remotePath });
      //     console.log('288---remotePath',remotePath)
      //     //let changeData = await this.webDavClient.getDirectoryContents(remotePath, { deep: 0, filterSelf: false });//远程文件数据信息
      //     let changeData = await this.webDavClient.stat(remotePath);//远程文件数据信息
      //     console.log('289---changeData',changeData)
      //     //changeData = changeData[0];
      //     this.filesData.splice(changePathIndex, 1, changeData);//删除并将新的文件信息更新
      //     break;
      // }

    }
    console.log('-----local2remote stop--------')
  },
  watch: function(watchDir) {
    const watcher = chokidar.watch(watchDir);
    watcher
      .on('unlink', path => {
        console.log(`File ${path} has been removed`);
        this.watchFiles.push({ action: 'unlink', stats: { path } });
      })
      .on('unlinkDir', path => {
        console.log(`Directory  ${path} has been removed`);
        this.watchFiles.push({ action: 'unlinkDir', stats: { path } });
      })
      .on('add', (path, stats) => {
        console.log(`File ${path} has been added`);
        this.watchFiles.push({ action: 'add', stats: { path, ...stats } });
        //console.log('状态：',stats);
      })
      .on('addDir', (path, stats) => {
        console.log(`Directory ${path} has been added`);
        this.watchFiles.push({ action: 'addDir', stats: { path, ...stats } });
        //console.log('状态',stats);
      })
      .on('change', (path, stats) => {
        console.log(`File ${path} has been changed${stats}`);
        this.watchFiles.push({ action: 'change', stats: { path, ...stats } });
        //console.log('状态',stats);
      })
      .on('ready', () => {
        console.log('监听开始：Initial scan complete. Ready for changes');
        //console.log(eventAction)
        console.log('监听准备好了：Initial scan complete. Ready for changes');
        this.watchFiles = [];
        this.watchFilesExclude = [];

      });
  },
  /**
   * 从远程下载到本地
   * @param remotePath  远程路径
   * @param localPath  本地路径
   * @returns {Promise<void>}
   */
  init: async function(remotePath, localPath) {
    this.remotePath = remotePath;
    this.localPath = localPath;
    this.filesDataName = 'filesData-' + hash.md5(remotePath)
    let dataPath = filePath.join(__dirname, 'data');
    storage.setDataPath(dataPath);

    if (this.userInfo == null) {
      this.userInfo = await storage.get('userInfo', { dataPath: dataPath });
    }

    //console.log('用户信息', this.userInfo);
    //console.log(typeof userInfo);

    this.webDavClient = await this.createWebDavClient(this.userInfo);
    //第一步 获取用户之前存的文件信息
    // if 没有文件信息   初始化拉取全部，并存下来,下载全部文件
    // else 定时获得根目录的etag
    //
    // 定时操作的逻辑
    // 只获取根的信息etag与本地存的文件信息对比
    // if etag相等  进入下一次定时操作
    // else 进入比对过程
    //

    this.filesData = await storage.get(this.filesDataName, { dataPath: dataPath });//本地数据信息
    //console.log('文件信息filesData',filesData)
    if (Object.keys(this.filesData).length == 0) {
      console.log('没有filesData，第一次下载');

      this.filesData = await this.batchDownLoad(this.remotePath);
      //console.log('下载后：',filesData)
      await storage.set(this.filesDataName, this.filesData, { dataPath: dataPath });//存储数据
    }
    console.log('不是第一次下载：');
    const sleep = require('util').promisify(setTimeout);


    //开始监控启动
    this.watch(localPath);

    // console.log('^^^^^---this.watchFiles----^^^^^',this.watchFiles)
    // console.log('^^^^----this.watchFilesExclude----^^^^',this.watchFilesExclude)
    let same = true;
    do {
      console.log('^^^^^---this.watchFiles----^^^^^',this.watchFiles)
      console.log('^^^^----this.watchFilesExclude----^^^^',this.watchFilesExclude)

      try {
        await this.remote2local(remotePath);//远程文件同步到本地
        await this.local2remote();//本地的变更同步到远程文件
      } catch (e) {
        console.log('出错了：',e);
      }
      console.log('过1秒再打印');
      if (this.change) {
        this.change = false;
        this.filesData.sort((a, b) => a.filename >= b.filename ? 1 : -1);//排序
        await storage.set(this.filesDataName, this.filesData, { dataPath: dataPath });//存储数据
        console.log('远程文件有变化，存储到本地文件里完成');
      }
      await sleep(10000);
      console.log('过10秒再打印');
      //break;
    } while (same);

// let rootDir = ''

  },
};
module.exports = checkingFiles;



