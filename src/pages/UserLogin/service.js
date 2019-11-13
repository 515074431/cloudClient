import request from 'umi-request';
//import request from '../../utils/request'

export async function fakeAccountLogin(params) {
  //params.baseurl
  console.log('-------',params)
  return request('/api/login/account', {
    method: 'POST',
    data: params,
  });
}
export async function getFakeCaptcha(mobile) {
  return request(`/api/login/captcha?mobile=${mobile}`);
}
