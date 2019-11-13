import { addCheck, queryCheck, removeCheck, updateCheck } from './service';

const Model = {
  namespace: 'listTableList',
  state: {
    data:  []
  },
  effects: {
    *fetch({ payload }, { call, put }) {
      const response = yield call(queryCheck, payload);
      console.log(response)
      yield put({
        type: 'save',
        payload: response,
      });
    },

    *add({ payload }, { call, put }) {
      const response = yield call(addCheck, payload);
      yield put({
        type: 'save',
        payload: response,
      });
    },

    *remove({ payload }, { call, put }) {
      const response = yield call(removeCheck, payload);
      yield put({
        type: 'save',
        payload: response,
      });
    },

    *update({ payload }, { call, put }) {
      const response = yield call(updateCheck, payload);
      yield put({
        type: 'save',
        payload: response,
      });
    },
  },
  reducers: {
    save(state, action) {
      return { ...state, data: action.payload };
    }
  },
};
export default Model;
