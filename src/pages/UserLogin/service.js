import request from 'umi-request';
//import request from '../../utils/request'
//在渲染器进程 (网页) 中。
const ipcRenderer = window.require('electron').ipcRenderer;

export async function fakeAccountLogin(params) {
  //params.baseurl
  console.log('-------',params)
  return ipcRenderer.sendSync('login', params)
  return request('/api/login/account', {
    method: 'POST',
    data: params,
  });
}
export async function getFakeCaptcha(mobile) {
  return request(`/api/login/captcha?mobile=${mobile}`);
}
