import fetch from 'dva/fetch';
import { message } from 'antd';
import { isArray } from 'lodash'


function parseJSON(response) {
  return response.json();
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error = new Error(response.status);
  error.response = response;
  throw error;
}

//export const host = 'https://admin.renrenshangpin.cn';

// export const host = process.env.NODE_ENV === 'production' ? window.location.origin : 'https://ab.quzhaopinapp.com';
export const host = '';
let env = localStorage.getItem('env') || 'dev'
export const setEnv = (new_env) => {
  env = new_env
  localStorage.setItem('env', env)
}
export const getEnv = () => {
  return env
}

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default function request(url, options={}) {
  const newOptions = { ...(options || {}), mode: 'cors', credentials: options.credentials || 'include' }
  if (typeof newOptions.body === "object") {
    newOptions.body = JSON.stringify(newOptions.body)
  }
  newOptions.headers = {...(newOptions.headers || {}), 'X-Env': getEnv()}

  return fetch(/^http/.test(url) ? url : `${host}${url}`, newOptions )
    .then(checkStatus)
    .then(parseJSON)
    .then(data => {
      if (data.code !== 0) {
        const error = new Error(data.msg);
        error.data = data;
        throw error;
      }
      return data
    })
    .then(data => ({ data }))
    .catch(err => {
      if (!parseInt(err.message, 10) && (options.showError || !options.notShowError)) {
        message.error(err.message)
      }
      return { err }
    });
}

export function serialize(data) {
  let dataList = []
  Object.keys(data).map((key) => { // eslint-disable-line
    if (isArray(data[key])) {
      data[key].map((item) => { // eslint-disable-line
        dataList.push(key + '=' + encodeURIComponent(item))
      })
    } else {
      dataList.push(key + '=' + encodeURIComponent(data[key]))
    }
  })
  return dataList.join('&');
}

