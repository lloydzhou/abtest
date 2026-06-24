/**
 * HTTP 请求工具
 * 自动携带 Basic Auth 凭证，401 时跳转登录
 */
import { getAuth, removeAuth } from './auth';

function parseJSON(response) {
  return response.json();
}

function checkStatus(response) {
  if (response.status === 401) {
    removeAuth();
    window.location.href = '/login';
    throw new Error('登录已过期，请重新登录');
  }
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const error = new Error(response.statusText || `${response.status}`);
  error.response = response;
  throw error;
}

export default function request(url, options = {}) {
  const newOptions = {
    ...(options || {}),
    credentials: options.credentials || 'include',
  };

  // 自动带上 Authorization header
  const token = getAuth();
  if (token) {
    newOptions.headers = {
      ...(newOptions.headers || {}),
      Authorization: `Basic ${token}`,
    };
  }

  if (typeof newOptions.body === 'object') {
    newOptions.body = JSON.stringify(newOptions.body);
    newOptions.headers = {
      'Content-Type': 'application/json',
      ...(newOptions.headers || {}),
    };
  }

  return fetch(url, newOptions)
    .then(checkStatus)
    .then(parseJSON)
    .then((data) => {
      if (data.code !== 0) {
        const error = new Error(data.msg);
        error.data = data;
        throw error;
      }
      return data;
    })
    .then((data) => ({ data }))
    .catch((err) => {
      return { err };
    });
}

export function serialize(data) {
  const list = [];
  Object.keys(data).forEach((key) => {
    if (Array.isArray(data[key])) {
      data[key].forEach((item) => list.push(`${key}=${encodeURIComponent(item)}`));
    } else if (data[key] !== undefined && data[key] !== null) {
      list.push(`${key}=${encodeURIComponent(data[key])}`);
    }
  });
  return list.join('&');
}
