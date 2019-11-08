const electronStorage = require('electron-json-storage');

function has(key,options) {
  return new Promise(function(resolve, reject) {
    electronStorage.has(key, options, function(error, hasKey) {
      console.log('读取信息开始');
      if (error) {
        console.log('读取信息失败：', error);
        reject(error)
      } else {
        //console.log(data);
        resolve(hasKey);
      }
    });
  });
}

function get(key,options) {
  return new Promise(function(resolve, reject) {
    electronStorage.get(key, options, function(error, data) {
      //console.log('读取信息开始');
      if (error) {
        //console.log('读取信息失败：', error);
        reject(error)
      } else {
        //console.log('具体读取到的信息  ',data);
        //console.log('读取信息成功',key);
        resolve(data);
      }
    });
  });
}
function getMany(keys,options) {
  return new Promise(function(resolve, reject) {
    electronStorage.getMany(keys, options, function(error, data) {
      //console.log('读取 信息开始');
      if (error) {
        //console.log('读取 信息失败：', error);
        reject(error)
      } else {
        //console.log(data);
        resolve(data);
      }
    });
  });
}
function getAll(options) {
  return new Promise(function(resolve, reject) {
    electronStorage.getAll( options, function(error, data) {
      //console.log('读取All 信息开始');
      if (error) {
        //console.log('读取All 信息失败：', error);
        reject(error)
      } else {
        //console.log(data);
        resolve(data);
      }
    });
  });
}
function keys(options) {
  return new Promise(function(resolve, reject) {
    electronStorage.keys( options, function(error, keys) {
      //console.log('读取keys开始');
      if (error) {
        //console.log('读取keys失败：', error);
        reject(error)
      } else {
        //console.log(data);
        resolve(keys);
      }
    });
  });
}
function clear(options) {
  return new Promise(function(resolve, reject) {
    electronStorage.clear( options, function(error, keys) {
      //console.log('清除信息开始');
      if (error) {
        //console.log('清除信息失败：', error);
        reject(error)
      } else {
        //console.log(data);
        resolve(keys);
      }
    });
  });
}
function set(key,value,options) {
  return new Promise(function(resolve, reject) {
    electronStorage.set(key, value, options,function(error) {
      if (error) {
        //console.log('设置信息失败：', error);
        reject(error)
      } else {
        //console.log(data);
        resolve('设置信息成功');
      }
    });
  });
}

function remove(key,options) {
  return new Promise(function(resolve, reject) {
    electronStorage.remove(key,  options,function(error) {
      if (error) {
        //console.log('删除信息失败：', error);
        reject(error)
      } else {
        //console.log(data);
        resolve('删除信息成功');
      }
    });
  });
}

module.exports = {
  get,
  set,
  setDataPath:electronStorage.setDataPath,
  getDefaultDataPath:electronStorage.getDefaultDataPath,
  getDataPath:electronStorage.getDataPath,
  getMany,
  getAll,
  has,
  keys,
  remove,
  clear
}
