import request from 'umi-request';
//在渲染器进程 (网页) 中。
const ipcRenderer = window.require('electron').ipcRenderer;

export async function queryCheck(params) {
  return ipcRenderer.sendSync('storage_fetch_check_path','')
  return request('/api/Check', {
    params,
  });
}
export async function removeCheck(params) {
  return ipcRenderer.sendSync('storage_remove_check_path',params)
  return request('/api/Check', {
    method: 'POST',
    data: { ...params, method: 'delete' },
  });
}
export async function addCheck(params) {
  return ipcRenderer.sendSync('storage_add_check_path',params)
  return request('/api/Check', {
    method: 'POST',
    data: { ...params, method: 'post' },
  });
}
export async function updateCheck(params) {
  return ipcRenderer.sendSync('storage_update_check_path',params)
  return request('/api/Check', {
    method: 'POST',
    data: { ...params, method: 'update' },
  });
}
