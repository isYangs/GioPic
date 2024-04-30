import type { AxiosRequestConfig } from 'axios'
import { request } from '~/utils'

interface UploadData {
  file: File
  permission: number
  strategy_id: number
  album_id?: number
  expired_at?: string
}

function createRequest(url: string, token?: string, customHeaders?: Record<string, string>) {
  return (path: string, method: 'get' | 'post' = 'get', data?: any) => {
    const config: AxiosRequestConfig = {
      url: url + path,
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...customHeaders,
      },
      data,
    }

    return request(config)
  }
}

const requestData = {
  /**
   * 兰空社区版获取策略
   *
   * @param url - 图床API地址，例如传入appStore中的apiUrl。
   * @param token - 用于身份验证的 token，例如传入appStore中的token。
   * @returns 返回一个 Promise，当策略获取成功时，Promise 将被解析。
   */
  getLskyStrategies: (url: string, token: string) => {
    const req = createRequest(url, token)
    return req('/api/v1/strategies', 'get')
  },
  /**
   * 兰空企业版获取策略
   *
   * @param url - 图床API地址，例如传入appStore中的apiUrl。
   * @param token - 用于身份验证的 token，例如传入appStore中的token。
   * @returns 返回一个 Promise，当策略获取成功时，Promise 将被解析。
   */
  getLskyProStrategies: (url: string, token: string) => {
    const req = createRequest(url, token)
    return req('/api/v1/strategies', 'get')
  },

  /**
   * 兰空企业版上传图片
   *
   * @param url - 图床API地址，例如传入appStore中的apiUrl。
   * @param token - 用于身份验证的 token，例如传入appStore中的token。
   * @param data - 接收一个对象，对象中传入上传的图片，权限，策略id，相册id，过期时间。
   * @returns 返回一个Promise对象，表示异步上传操作
   */
  uploadLskyProImage: (url: string, token: string, data: UploadData) => {
    const req = createRequest(url, token, {
      'Content-Type': 'multipart/form-data',
    })
    return req('/api/v1/upload', 'post', data)
  },
}

export default requestData
