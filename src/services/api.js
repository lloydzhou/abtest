/**
 * API 服务层
 * 所有后端接口调用集中在此
 */
import request, { serialize } from '../utils/request';

const q = (params) => serialize(params);

/* ==================== 流量层 ==================== */

export function getLayers() {
  return request('/ab/layers');
}

export function addLayer(layer) {
  return request(`/ab/layer/add?${q({ layer })}`, { method: 'POST' });
}

export function editLayerWeight(layer, var_name, weight) {
  return request(`/ab/layer/weight?${q({ layer, var: var_name, weight })}`, {
    method: 'POST',
  });
}

/* ==================== 实验 ==================== */

export function getTests() {
  return request('/ab/tests');
}

export function addTest(params) {
  const { layer, layer_weight, var_name, var_type: type, test_name, default_value, condition } = params;
  return request(
    `/ab/test/add?${q({ layer, layer_weight, var: var_name, test_name, type, default: default_value, condition })}`,
    { method: 'POST' },
  );
}

export function testAction(var_name, action) {
  return request(`/ab/test/action?${q({ var: var_name, action })}`, { method: 'POST' });
}

/* ==================== 版本 ==================== */

export function getVersions() {
  return request('/ab/versions');
}

export function editTestWeight(var_name, val, weight, name) {
  return request(`/ab/test/weight?${q({ var: var_name, val, weight, name: name || val })}`, {
    method: 'POST',
  });
}

/* ==================== 指标 ==================== */

export function getTargets() {
  return request('/ab/targets');
}

export function addTarget(var_name, target) {
  return request(`/ab/target/add?${q({ var: var_name, target })}`, { method: 'POST' });
}

/* ==================== 分析数据 ==================== */

export function getTestRate(var_name) {
  return request(`/ab/test/rate?${q({ var: var_name })}`);
}

export function getTestTraffic(var_name) {
  return request(`/ab/test/traffic?${q({ var: var_name })}`);
}

/* ==================== 用户属性（保留接口，UI 暂不暴露） ==================== */

export function getUserAttributes() {
  return request('/ab/attrs');
}
