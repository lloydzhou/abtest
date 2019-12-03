import {
  login,
  getLayers,
  addLayer,
  getLayerWeight,
  editLayerWeight,
  getTests,
  addTest,
  getTestWeight,
  editTestWeight,
  getTargets,
  addTarget,
} from '../services/common'
import { message }  from 'antd'

export default {

  namespace: 'common',

  state: {},

  subscriptions: {
    setup({ dispatch, history }) {  // eslint-disable-line
      return history.listen(({ pathname, query }) => {
        dispatch({ type: 'getTests' })
        dispatch({ type: 'getLayers' })
        dispatch({ type: 'getTargets' })
        if ('/' === pathname) {
          dispatch({ type: 'getLayerWeight', layer: 'layer1' })
          dispatch({ type: 'getTestWeight', var_name: 'isAB' })
        }
      })
    },
  },

  effects: {
    *getLayers({ }, { put, call }) {
      const { err, data } = yield call(getLayers)
      if (!err && data.code === 0) {
        yield put({ type: 'save', payload: { layers: data.layers } })
        for(const layer of data.layers) {
          yield put({ type: 'getLayerWeight', layer })
        }
      }
    },
    *getTests({ }, { put, call }) {
      const { err, data } = yield call(getTests)
      if (!err && data.code === 0) {
        const tests = data.tests.chunk(6).map(item => {
          const [var_name, name, layer, var_type, status, default_value] = item
          return {
            var_name, name, layer, var_type, status, default_value
          }
        })
        yield put({ type: 'save', payload: { tests } })
        for(const test of tests) {
          yield put({ type: 'getTestWeight', var_name: test.var_name })
        }
      }
    },
    *getTargets({ }, { put, call }) {
      const { err, data } = yield call(getTargets)
      if (!err && data.code === 0) {
        yield put({ type: 'save', payload: { targets: data.targets.chunk(2).map(item => {
          const [target_name, var_name] = item
          return {
            target_name, var_name
          }
        }) } })
      }
    },
    *getLayerWeight({ layer }, { put, call, select }) {
      const { err, data } = yield call(getLayerWeight, layer)
      if (!err && data.code === 0) {
        const { layerWeight = {} } = yield select(s => s.common)
        const weight = data.weight.chunk(2).map(item => {
          const [var_name, weight] = item
          return {
            var_name, weight: parseFloat(weight),
          }
        })
        yield put({
          type: 'save',
          payload: {
            layerWeight: {
              ...layerWeight,
              [layer]: {
                weight: weight,
                total: weight.reduce((s, i) => i.weight + s, 0)
              }
            }
          }
        })
      }
    },
    *getTestWeight({ var_name }, { put, call, select }) {
      const { err, data } = yield call(getTestWeight, var_name)
      if (!err && data.code === 0) {
        const { testWeight = {} } = yield select(s => s.common)
        const weight = data.weight.chunk(2).map(item => {
          const [value, weight] = item
          return {
            value, weight: parseFloat(weight),
          }
        })
        yield put({
          type: 'save',
          payload: {
            testWeight: {
              ...testWeight,
              [var_name]: {
                weight: weight,
                total: weight.reduce((s, i) => i.weight + s, 0)
              }
            }
          }
        })
      }
    },
  },

  reducers: {
    save(state, action) {
      return { ...state, ...action.payload };
    },
  },

};
