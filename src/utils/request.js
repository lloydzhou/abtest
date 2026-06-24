/**
 * HTTP 请求工具（精简版，移除了环境切换逻辑）
 */

function parseJSON(response) {
  return response.json();
}

function checkStatus(response) {
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
