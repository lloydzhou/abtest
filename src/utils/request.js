import fetch from 'dva/fetch';
import { message } from 'antd';
import { isArray } from 'lodash'


function parseJSON(response) {
  const cT = response.headers.get('Content-Type')
  if (cT.indexOf('excel') > -1 || cT.indexOf('officedocument.spreadsheetml.sheet') > -1) {
    response.blob && response.blob().then(blob => {
      let date = new Date()
      let time = `${date.getFullYear()}-${(date.getMonth() * 1 + 1)}-${date.getDate()}`;
      let filename = `激活码_${time}.xlsx`
      if (window.navigator.msSaveOrOpenBlob) {
        navigator.msSaveBlob(blob, filename);  //兼容ie10
      } else {
        var a = document.createElement('a');
        document.body.appendChild(a) //兼容火狐，将a标签添加到body当中
        var url = window.URL.createObjectURL(blob);   // 获取 blob 本地文件连接 (blob 为纯二进制对象，不能够直接保存到磁盘上)
        a.href = url;
        a.download = filename;
        a.target = '_blank'  // a标签增加target属性
        a.click();
        a.remove()  //移除a标签
        window.URL.revokeObjectURL(url);
      }
    })
    return {
      code: 0,
      msg: '下载成功'
    }
  } else {
    return response.json();
  }
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

export const host = process.env.NODE_ENV === 'production' ? window.location.origin : 'https://ab.quzhaopinapp.com';


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

