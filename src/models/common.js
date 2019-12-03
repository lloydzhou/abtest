import {
  getLayers,
  addLayer,
  getLayerWeight,
  editLayerWeight,
  getTests,
  addTest,
  getTestWeight,
  editTestWeight,
  testAction,
  getTargets,
  addTarget,
} from '../services/common'
import { getEnv, setEnv } from '../utils/request'

export default {

  namespace: 'common',

  state: {
    env: getEnv(),
  },

  subscriptions: {
    setup({ dispatch, history }) {  // eslint-disable-line
      return history.listen(({ pathname, query }) => {
        dispatch({ type: 'getTests' })
        dispatch({ type: 'getLayers' })
        dispatch({ type: 'getTargets' })
        // if ('/' === pathname) {
        //   dispatch({ type: 'getLayerWeight', layer: 'layer1' })
        //   dispatch({ type: 'getTestWeight', var_name: 'isAB' })
        // }
      })
    },
  },

  effects: {
    *getLayers({ }, { put, call }) { // eslint-disable-line
      const { err, data } = yield call(getLayers)
      if (!err && data.code === 0) {
        yield put({ type: 'save', payload: { layers: data.layers } })
        for(const layer of data.layers) {
          yield put({ type: 'getLayerWeight', layer })
        }
      }
    },
    *addLayer({ layer }, { put, call }) { // eslint-disable-line
      const { err, data } = yield call(addLayer, layer)
      if (!err && data.code === 0) {
        yield put({ type: 'getLayers' })
        yield put({ type: 'save', payload: {showNewLayerForm: false}})
      }
    },
    *getTests({ }, { put, call }) { // eslint-disable-line
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
    *addTest({ layer, layer_weight, var_name, test_name, var_type, default_value }, { put, call }) {
      const { err, data } = yield call(addTest, layer, layer_weight, var_name, test_name, var_type, default_value)
      if (!err && data.code === 0) {
        yield put({ type: 'getTests' })
        yield put({ type: 'save', payload: {showNewTestForm: false}})
      }
    },
    *testAction({ var_name, action }, { put, call }) {
      const { err, data } = yield call(testAction, var_name, action)
      if (!err && data.code === 0) {
        yield put({ type: 'getTests' })
      }
    },
    *getTargets({ }, { put, call }) { // eslint-disable-line
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
        const weight = data.weight.length ? data.weight.chunk(2).map(item => {
          const [var_name, weight] = item
          return {
            var_name, weight: parseFloat(weight),
          }
        }) : [];
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
    *editLayerWeight({ layer, var_name, weight }, { put, call }) {
      const { err, data } = yield call(editLayerWeight, layer, var_name, weight)
      if (!err && data.code === 0) {
        yield put({ type: 'getLayerWeight', layer })
        yield put({ type: 'save', payload: {editLayer: null} })
      }
    },
    *getTestWeight({ var_name }, { put, call, select }) {
      const { err, data } = yield call(getTestWeight, var_name)
      if (!err && data.code === 0) {
        const { testWeight = {} } = yield select(s => s.common)
        const weight = data.weight.length ? data.weight.chunk(2).map(item => {
          const [value, weight] = item
          return {
            value, weight: parseFloat(weight),
          }
        }) : [];
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
    *editTestWeight({ var_name, value, weight }, { put, call }) {
      const { err, data } = yield call(editTestWeight, var_name, value, weight)
      if (!err && data.code === 0) {
        yield put({ type: 'getTestWeight', var_name })
        yield put({ type: 'save', payload: {editTest: null, newVersion: null} })
      }
    },
    *addTarget({ var_name, target }, { put, call }) {
      const { err, data } = yield call(addTarget, var_name, target)
      if (!err && data.code === 0) {
        yield put({ type: 'getTargets' })
        yield put({ type: 'save', payload: {newTargetVarName: false}})
      }
    },
    *changeEnv({ env }, { put, select }) {
      const { env: oldEnv } = yield select(s => s.common)
      if (oldEnv !== env) {
        setEnv(env)
        yield put({ type: 'save', payload: {env}})
        yield put({ type: 'getTests' })
        yield put({ type: 'getLayers' })
        yield put({ type: 'getTargets' })
      }
    },
  },

  reducers: {
    save(state, action) {
      return { ...state, ...action.payload };
    },
  },

};
