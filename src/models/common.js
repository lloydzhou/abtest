import {
  login,
  getLayers,
  getTests,
  addLayer,
  editLayer,
  addTest,
  editTest,
  addTarget,
} from '../services/common'
import { message }  from 'antd'

export default {

  namespace: 'common',

  state: {},

  subscriptions: {
    setup({ dispatch, history }) {  // eslint-disable-line
      return history.listen(({ pathname, query }) => {
        if ('/' === pathname) {
          dispatch({ type: 'getTests' })
          dispatch({ type: 'getLayers' })
        }
      })
    },
  },

  effects: {
    *getLayers({ }, { put, call }) {
      const { err, data } = yield call(getLayers)
      if (!err && data.code === 0) {
        yield put({ type: 'save', payload: { layers: data.layers } })
      }
    },
    *getTests({ }, { put, call }) {
      const { err, data } = yield call(getTests)
      if (!err && data.code === 0) {
        yield put({ type: 'save', payload: { tests: data.tests.chunk(6).map(item => {
          const [var_name, name, layer, var_type, status, default_value] = item
          return {
            var_name, name, layer, var_type, status, default_value
          }
        }) } })
      }
    },
  },

  reducers: {
    save(state, action) {
      return { ...state, ...action.payload };
    },
  },

};
