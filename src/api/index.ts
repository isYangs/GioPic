import { AxiosRequestConfig } from 'axios'
import request from '~/utils/request'

interface UploadData {
  file: File
  permission: number
  strategy_id: number
  album_id?: number
  expired_at?: string
}

const createRequest = (url: string, token?: string, customHeaders?: Record<string, string>) => {
  return (path: string, method: 'get' | 'post' = 'get', data?: any) => {
    const config: AxiosRequestConfig = {
      url: url + path,
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...customHeaders,
      },
      data,
    }

    return request(config)
  }
}

const requestData = {
  /**
   * 从指定的 URL 获取 API 地址的标题。
   *
   * @param {string} url - API 地址的 URL。
   * @returns {Promise} 返回一个 Promise，当 API 地址的标题获取成功时，Promise 将被解析。
   */
  getApiUrlTitle: (url: string) => {
    const req = createRequest(url)
    return req('', 'get')
  },

  /**
   * 从指定的 URL 获取用户的个人信息。
   *
   * @param {string} url - 图床API地址，例如传入appStore中的apiUrl。
   * @param {string} token - 用于身份验证的 token，例如传入appStore中的token。
   * @returns {Promise} 返回一个 Promise，当用户信息获取成功时，Promise 将被解析。
   */
  getUserProfile: (url: string, token: string) => {
    const req = createRequest(url, token)
    return req('/api/v1/profile', 'get')
  },

  /**
   * 从指定的 URL 获取策略。
   *
   * @param {string} url - 图床API地址，例如传入appStore中的apiUrl。
   * @param {string} token - 用于身份验证的 token，例如传入appStore中的token。
   * @returns {Promise} 返回一个 Promise，当策略获取成功时，Promise 将被解析。
   */
  getStrategies: (url: string, token: string) => {
    const req = createRequest(url, token)
    return req('/api/v1/strategies', 'get')
  },

  /**
   * 上传图片
   *
   * @param {string} url - 图床API地址，例如传入appStore中的apiUrl。
   * @param {string} token - 用于身份验证的 token，例如传入appStore中的token。
   * @param {UploadData} data - 接收一个对象，对象中传入上传的图片，权限，策略id，相册id，过期时间。
   * @returns {Promise} 返回一个Promise对象，表示异步上传操作
   */
  uploadImage: (url: string, token: string, data: UploadData) => {
    const req = createRequest(url, token, {
      'Content-Type': 'multipart/form-data',
    })
    return req('/api/v1/upload', 'post', data)
  },
}

export default requestData
