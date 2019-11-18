import { routerRedux } from 'dva/router';
import { stringify } from 'qs';
import { fakeAccountLogin, getFakeCaptcha } from './service';
import { getPageQuery, setAuthority,getAuthority } from './utils/utils';
//在渲染器进程 (网页) 中。
const ipcRenderer = window.require('electron').ipcRenderer;

const Model = {
  namespace: 'userLogin',
  state: {
    status: undefined,
  },
  effects: {
    *login({ payload }, { call, put }) {
      const response = yield call(fakeAccountLogin, payload);
      console.log('-----response----',response)
      if(response.status){//登录成功
        console.log(ipcRenderer.sendSync('login_sucess', {...payload,...response.data})) // prints "pong"

        ipcRenderer.on('userInfoWrited', (event, arg) => {
          console.log('返回的信息',arg)
        })
      }

      if (response.status) {
        yield put({
          type: 'changeLoginStatus',
          payload: response,
        }); // Login successfully

        localStorage.setItem('token', response.data.token) // 这里设置token
        //reloadAuthorized();
        const urlParams = new URL(window.location.href);
        const params = getPageQuery();
        let { redirect } = params;

        if (redirect) {
          const redirectUrlParams = new URL(redirect);

          if (redirectUrlParams.origin === urlParams.origin) {
            redirect = redirect.substr(urlParams.origin.length);

            if (redirect.match(/^\/.*#/)) {
              redirect = redirect.substr(redirect.indexOf('#') + 1);
            }
          } else {
            window.location.href = redirect;
            return;
          }
        }
        console.log(redirect)
        //yield put(routerRedux.replace(redirect || '/'));
        yield put(routerRedux.replace(redirect || '/listtablelist'));
      }
    },

    *getCaptcha({ payload }, { call }) {
      yield call(getFakeCaptcha, payload);
    },

    *logout(_, { put }) {
      yield put({
        type: 'changeLoginStatus',
        payload: {
          status: false,
          data: {
            currentAuthority: 'guest',
          }
        },
      });
      setAuthority('guest');
      localStorage.removeItem('token');// 删除token
      yield put(
        routerRedux.push({
          pathname: '/userlogin',
          search: stringify({
            type:'',
            redirect: window.location.href,
          }),
        })
      );
    },
  },
  reducers: {
    changeLoginStatus(state, { payload }) {
      setAuthority(payload.data.currentAuthority);
      return { ...state, status: payload.status }
    }
  },
};
export default Model;
