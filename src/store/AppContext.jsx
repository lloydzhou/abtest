/**
 * 全局数据 Store —— 基于 React Context + Hooks
 * 彻底替代旧的 dva 风格 store.js + models/common.js
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import * as api from '../services/api';
import {
  parseTests,
  parseVersions,
  parseTargets,
  parseAttributes,
  computeLayerWeight,
  computeTestWeight,
} from '../utils/parse';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [tests, setTests] = useState([]);
  const [versions, setVersions] = useState([]);
  const [targets, setTargets] = useState([]);
  const [layers, setLayers] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ==================== 批量加载 ==================== */

  const refreshAll = useCallback(async () => {
    setLoading(true);
    const [testsRes, layersRes, targetsRes, versionsRes, attrsRes] = await Promise.all([
      api.getTests(),
      api.getLayers(),
      api.getTargets(),
      api.getVersions(),
      api.getUserAttributes(),
    ]);

    if (testsRes.data) setTests(parseTests(testsRes.data.tests));
    if (layersRes.data) setLayers(layersRes.data.layers || []);
    if (targetsRes.data) setTargets(parseTargets(targetsRes.data.targets));
    if (versionsRes.data) setVersions(parseVersions(versionsRes.data.versions));
    if (attrsRes.data) setAttributes(parseAttributes(attrsRes.data.attributes));
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  /* ==================== 派生数据 ==================== */

  const layerWeight = useMemo(() => computeLayerWeight(tests), [tests]);
  const testWeight = useMemo(() => computeTestWeight(versions), [versions]);

  /* ==================== 流量层操作 ==================== */

  const addLayerAction = useCallback(
    async (layer) => {
      const { err } = await api.addLayer(layer);
      if (!err) await refreshAll();
      return !err;
    },
    [refreshAll],
  );

  const editLayerWeightAction = useCallback(
    async (layer, var_name, weight) => {
      const { err } = await api.editLayerWeight(layer, var_name, weight);
      if (!err) await refreshAll();
      return !err;
    },
    [refreshAll],
  );

  /* ==================== 实验操作 ==================== */

  const addTestAction = useCallback(
    async (params) => {
      const { err } = await api.addTest(params);
      if (!err) await refreshAll();
      return !err;
    },
    [refreshAll],
  );

  const testActionAction = useCallback(
    async (var_name, action) => {
      const { err } = await api.testAction(var_name, action);
      if (!err) await refreshAll();
      return !err;
    },
    [refreshAll],
  );

  /* ==================== 版本操作 ==================== */

  const editVersionWeightAction = useCallback(
    async (var_name, val, weight, name) => {
      const { err } = await api.editTestWeight(var_name, val, weight, name);
      if (!err) await refreshAll();
      return !err;
    },
    [refreshAll],
  );

  /* ==================== 指标操作 ==================== */

  const addTargetAction = useCallback(
    async (var_name, target) => {
      const { err } = await api.addTarget(var_name, target);
      if (!err) await refreshAll();
      return !err;
    },
    [refreshAll],
  );

  /* ==================== 分析数据（按需加载） ==================== */

  const loadRate = useCallback(async (var_name) => {
    const { err, data } = await api.getTestRate(var_name);
    if (err) return { error: err.message };
    return {
      targets: Array.isArray(data.targets) ? data.targets : [],
      versions: Array.isArray(data.versions) ? data.versions : [],
    };
  }, []);

  const loadTraffic = useCallback(async (var_name) => {
    const { err, data } = await api.getTestTraffic(var_name);
    if (err) return { error: err.message };
    return {
      values: Array.isArray(data.values) ? data.values : [],
      targets: Array.isArray(data.targets) ? data.targets : [],
      traffic: Array.isArray(data.traffic) ? data.traffic : [],
    };
  }, []);

  const value = useMemo(
    () => ({
      // 数据
      tests,
      versions,
      targets,
      layers,
      attributes,
      layerWeight,
      testWeight,
      loading,
      // 流量层
      addLayer: addLayerAction,
      editLayerWeight: editLayerWeightAction,
      // 实验
      addTest: addTestAction,
      testAction: testActionAction,
      // 版本
      editVersionWeight: editVersionWeightAction,
      // 指标
      addTarget: addTargetAction,
      // 分析
      loadRate,
      loadTraffic,
      // 刷新
      refreshAll,
    }),
    [
      tests, versions, targets, layers, attributes,
      layerWeight, testWeight, loading,
      addLayerAction, editLayerWeightAction,
      addTestAction, testActionAction,
      editVersionWeightAction, addTargetAction,
      loadRate, loadTraffic, refreshAll,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * 在任何组件中获取全局数据和方法
 * @example
 * const { tests, addTest } = useApp();
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}
