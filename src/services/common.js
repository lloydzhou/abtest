import request from '../utils/request';

export function getLayers() {
  return request('/ab/layers');
}

export function addLayer(layer) {
  return request(`/ab/layer/add?layer=${layer}`, {
    method: 'POST'
  });
}

export function editLayer(layer, var_name, weight) {
  return request(`/ab/layer/edit?layer=${layer}&var=${var_name}&weight=${weight}`, {
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

export function editTest(var_name, val, weight) {
  return request(`/ab/test/edit?var=${var_name}&val=${val}&weight=${weight}`, {
    method: 'POST'
  });
}

export function addTarget(var_name, target) {
  return request(`/ab/target/add?var=${var_name}&target=${target}`, {
    method: 'POST'
  });
}

