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
  },

  reducers: {
    save(state, action) {
      return { ...state, ...action.payload };
    },
  },

};
