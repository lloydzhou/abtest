import request from '../utils/request';

export function getLayers() {
  return request('/ab/layers');
}

export function addLayer(layer) {
  return request(`/ab/layer/add?layer=${layer}`, {
    method: 'POST'
  });
}

export function getLayerWeight(layer) {
  return request(`/ab/layer/weight?layer=${layer}`);
}

export function editLayerWeight(layer, var_name, weight) {
  return request(`/ab/layer/weight?layer=${layer}&var=${var_name}&weight=${weight}`, {
    method: 'POST'
  });
}

export function getTests() {
  return request('/ab/tests');
}

export function addTest(layer, layer_weight, var_name, test_name, type, default_value) {
  return request(`/ab/test/add?layer=${layer}&layer_weight=${layer_weight}&var=${var_name}&test_name=${test_name}&type=${type}&default=${default_value}`, {
    method: 'POST'
  });
}

export function getTestWeight(var_name) {
  return request(`/ab/test/weight?var=${var_name}`);
}

export function editTestWeight(var_name, val, weight) {
  return request(`/ab/test/weight?var=${var_name}&val=${val}&weight=${weight}`, {
    method: 'POST'
  });
}

export function testAction(var_name, action) {
  return request(`/ab/test/action?var=${var_name}&action=${action}`, {
    method: 'POST'
  });
}

export function getTargets() {
  return request('/ab/targets');
}

export function addTarget(var_name, target) {
  return request(`/ab/target/add?var=${var_name}&target=${target}`, {
    method: 'POST'
  });
}

