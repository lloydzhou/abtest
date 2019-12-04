import {
  getLayers,
  addLayer,
  editLayerWeight,
  getTests,
  addTest,
  editTestWeight,
  getVersions,
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
        dispatch({ type: 'init' })
      })
    },
  },

  effects: {
    *getLayers({ }, { put, call }) { // eslint-disable-line
      const { err, data } = yield call(getLayers)
      if (!err && data.code === 0) {
        const layers = data.layers.length ? data.layers : []
        yield put({ type: 'save', payload: { layers } })
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
        const tests = data.tests.length ? data.tests.chunk(9).map(item => {
          const [var_name, name, layer, var_type, status, default_value, created, modified, weight] = item
          return {
            var_name, name, layer, var_type, status, default_value, created, modified, weight: parseFloat(weight)
          }
        }) : [];
        const layerWeight = {}
        for (const test of tests) {
          const {var_name, name, layer, weight} = test
          if (!layerWeight[layer]) {
            layerWeight[layer] = {weight: [], total: 0}
          }
          layerWeight[layer].weight.push({var_name, name, weight})
          layerWeight[layer].total += weight
        }
        yield put({ type: 'save', payload: { tests, layerWeight } })
      }
    },
    *addTest({ layer, layer_weight, var_name, test_name, var_type, default_value }, { put, call }) {
      const { err, data } = yield call(addTest, layer, layer_weight, var_name, test_name, var_type, default_value)
      if (!err && data.code === 0) {
        yield put({ type: 'getTests' })
        yield put({ type: 'getVersions' })
        yield put({ type: 'save', payload: {showNewTestForm: false}})
      }
    },
    *testAction({ var_name, action }, { put, call }) {
      const { err, data } = yield call(testAction, var_name, action)
      if (!err && data.code === 0) {
        yield put({ type: 'getTests' })
      }
    },
    *getVersions({ }, { put, call }) { // eslint-disable-line
      const { err, data } = yield call(getVersions)
      if (!err && data.code === 0) {
        const versions = data.versions.length ? data.versions.chunk(11).map(item => {
          const [version, var_name, name, value, weight, pv, uv, count, rate, created, modified] = item
          return {
            version, var_name, name, value, weight: parseFloat(weight), pv, uv, count, rate, created, modified,
          }
        }) : []
        const testWeight = {}
        for (const version of versions) {
          const {var_name, value, name, weight} = version
          if (!testWeight[var_name]) {
            testWeight[var_name] = {weight: [], total: 0}
          }
          testWeight[var_name].weight.push({value, name, weight})
          testWeight[var_name].total += weight
        }
        yield put({ type: 'save', payload: { versions, testWeight }})
      }
    },
    *getTargets({ }, { put, call }) { // eslint-disable-line
      const { err, data } = yield call(getTargets)
      if (!err && data.code === 0) {
        const targets = data.targets.length ? data.targets : []
        yield put({
          type: 'save',
          payload: {
            targets: targets.chunk(4).map(item => {
              const [target_name, var_name, count, rate] = item
              return {
                target_name, var_name,
                count, rate,
              }
            })
          }
        })
      }
    },
    *editLayerWeight({ layer, var_name, weight }, { put, call }) {
      const { err, data } = yield call(editLayerWeight, layer, var_name, weight)
      if (!err && data.code === 0) {
        // yield put({ type: 'getLayerWeight', layer })
        yield put({ type: 'getTests' })
        yield put({ type: 'save', payload: {editLayer: null} })
      }
    },
    *editTestWeight({ var_name, value, name='', weight }, { put, call }) {
      const { err, data } = yield call(editTestWeight, var_name, value, weight, name)
      if (!err && data.code === 0) {
        // yield put({ type: 'getTestWeight', var_name })
        yield put({ type: 'getVersions' })
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
        yield put({ type: 'save', payload: {env, ready: false}})
        yield put({ type: 'init' })
      }
    },
    *init({ }, {put, call, select}) { // eslint-disable-line
      const { ready=false } = yield select(s => s.common)
      if (!ready) {
        yield put({ type: 'getTests' })
        yield put({ type: 'getLayers' })
        yield put({ type: 'getTargets' })
        yield put({ type: 'getVersions' })
        yield put({ type: 'save', payload: {ready: true}})
      }
    }
  },

  reducers: {
    save(state, action) {
      return { ...state, ...action.payload };
    },
  },

};
