/**
 * 数据解析工具
 * 把后端 sort 命令返回的扁平数组解析为结构化对象
 */
import { chunk } from './chunk';

/**
 * 解析实验列表
 * sort 返回: [var_name, name, layer, var_type, status, default_value, created, modified, weight, condition] × N
 */
export function parseTests(rawTests) {
  if (!Array.isArray(rawTests)) return [];
  return chunk(rawTests, 10).map((item) => ({
    var_name: item[0],
    name: item[1],
    layer: item[2],
    var_type: item[3],
    status: item[4],
    default_value: item[5],
    created: item[6],
    modified: item[7],
    weight: parseFloat(item[8]) || 0,
    condition: item[9] || '',
  }));
}

/**
 * 解析版本列表
 * sort 返回: [version, var_name, name, value, weight, pv, uv, created, modified] × N
 */
export function parseVersions(rawVersions) {
  if (!Array.isArray(rawVersions)) return [];
  return chunk(rawVersions, 9).map((item) => ({
    version: item[0],
    var_name: item[1],
    name: item[2],
    value: item[3],
    weight: parseFloat(item[4]) || 0,
    pv: parseFloat(item[5]) || 0,
    uv: parseFloat(item[6]) || 0,
    created: item[7],
    modified: item[8],
  }));
}

/**
 * 解析指标列表
 * sort 返回: [target_name, var_name, count, rate] × N
 */
export function parseTargets(rawTargets) {
  if (!Array.isArray(rawTargets)) return [];
  return chunk(rawTargets, 4).map((item) => ({
    target_name: item[0],
    var_name: item[1],
    count: parseFloat(item[2]) || 0,
    rate: parseFloat(item[3]) || 0,
  }));
}

/**
 * 解析用户属性列表
 * sort 返回: [attribute, name, type, created, modified] × N
 */
export function parseAttributes(rawAttrs) {
  if (!Array.isArray(rawAttrs)) return [];
  return chunk(rawAttrs, 5).map((item) => ({
    attribute: item[0],
    name: item[1],
    type: item[2],
    created: item[3],
    modified: item[4],
  }));
}

/**
 * 从 tests 计算每层的流量分配
 */
export function computeLayerWeight(tests) {
  const layerWeight = {};
  for (const test of tests) {
    const { var_name, name, layer, weight } = test;
    if (!layerWeight[layer]) {
      layerWeight[layer] = { weight: [], total: 0 };
    }
    layerWeight[layer].weight.push({ var_name, name, weight });
    layerWeight[layer].total += weight;
  }
  return layerWeight;
}

/**
 * 从 versions 计算每个实验的版本流量分配
 */
export function computeTestWeight(versions) {
  const testWeight = {};
  for (const version of versions) {
    const { var_name, value, name, weight } = version;
    if (!testWeight[var_name]) {
      testWeight[var_name] = { weight: [], total: 0 };
    }
    testWeight[var_name].weight.push({ value, name, weight });
    testWeight[var_name].total += weight;
  }
  return testWeight;
}

/**
 * 解析转化率数据（/ab/test/rate）
 *
 * targets: ['target1', 'target2', ...]
 * rawVersions: 扁平数组，每 6 + targets.length * 6 个元素为一个版本
 *   [value, var_name, weight, name, pv, uv, min, max, mean, std, ...per_target_data]
 *   per_target: [count, user, min, max, mean, std]
 */
export function parseRateData(rawVersions, targets, default_value) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const preIndex = 10; // 每个版本前 10 个字段是版本自身数据
  const stride = preIndex + safeTargets.length * 6;

  if (!Array.isArray(rawVersions)) return [];

  const rows = chunk(rawVersions, stride).map((item) => {
    const row = {
      value: item[0],
      var_name: item[1],
      version: item[3],
      weight: parseFloat(item[2]) || 0,
      pv: parseFloat(item[4]) || 0,
      uv: parseFloat(item[5]) || 0,
      min: parseFloat(item[6]) || 0,
      max: parseFloat(item[7]) || 0,
      mean: parseFloat(item[8]) || 0,
      std: parseFloat(item[9]) || 0,
      targets: {},
    };

    for (let i = 0; i < safeTargets.length; i++) {
      const base = preIndex + i * 6;
      row.targets[safeTargets[i]] = {
        count: parseFloat(item[base]) || 0,
        user: parseFloat(item[base + 1]) || 0,
        min: parseFloat(item[base + 2]) || 0,
        max: parseFloat(item[base + 3]) || 0,
        mean: parseFloat(item[base + 4]) || 0,
        std: parseFloat(item[base + 5]) || 0,
      };
    }
    return row;
  });

  // 默认版本排在最前面
  return rows.sort((a, b) => (a.value === default_value ? -1 : b.value === default_value ? 1 : 0));
}

/**
 * 解析流量数据（/ab/test/traffic）
 *
 * values: ['v1', 'v2', ...]
 * targets: ['target1', ...]
 * rawTraffic: 扁平数组，每 1 + values.length * (1 + targets.length) 个元素为一天
 *   [timestamp, pv_v1, target1_v1, target2_v1, pv_v2, target1_v2, ...]
 */
export function parseTrafficData(rawTraffic, values, targets) {
  const safeValues = Array.isArray(values) ? values : [];
  const safeTargets = Array.isArray(targets) ? targets : [];
  const stride = 1 + safeValues.length * (1 + safeTargets.length);

  if (!Array.isArray(rawTraffic)) return [];

  const rows = chunk(rawTraffic, stride).map((item) => {
    const day = item[0];
    const row = { day };
    const rest = item.slice(1);

    chunk(rest, 1 + safeTargets.length).forEach((data, vIdx) => {
      const val = safeValues[vIdx];
      row[val] = parseFloat(data[0]) || 0;
      safeTargets.forEach((t, tIdx) => {
        row[`${val}:${t}`] = parseFloat(data[tIdx + 1]) || 0;
      });
    });

    return row;
  });

  // 数据是倒序的（最新在前），图表需要正序
  return rows.reverse();
}
