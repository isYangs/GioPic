import type { AxiosRequestConfig } from 'axios'
import type { Program, ProgramDetail } from '~/stores'
import request from '~/utils/request'

interface UploadData {
  file: File
  permission: number
  strategy_id: number
  album_id?: number
  expired_at?: string
}

interface LskyUploadResponse {
  status: number
  data: {
    status: boolean
    message: string
    data: {
      key: string
      name: string
      size: number
      mimetype: string
      links: {
        [key: string]: string
      }
      origin_name: string
    }
  }
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
   * 兰空企业版v2获取策略
   *
   * @param url - 图床API地址，例如传入appStore中的apiUrl。
   * @param token - 用于身份验证的 token，例如传入appStore中的token。
   * @returns 返回一个 Promise，当策略获取成功时，Promise 将被解析。
   */
  getLskyProV2Strategies: (url: string, token: string) => {
    const req = createRequest(url, token)
    return req('/api/v2/strategies', 'get')
  },

  /**
   * 上传图片
   *
   * @param program - 存储程序
   * @param file - 要上传的文件
   * @param permission - 权限
   * @returns 返回一个Promise对象，表示异步上传操作
   */
  uploadImage: async (program: Program, file: File, permission: number = 1) => {
    if (program.type === 'lsky' || program.type === 'lskyPro') {
      const { api, token, activeStrategy } = program.detail as ProgramDetail['lsky']
      if (!api || !token || activeStrategy === null) {
        return Promise.reject(new Error('该存储程序未配置 ⚠️'))
      }

      const reqData: UploadData = {
        file,
        permission,
        strategy_id: activeStrategy,
      }
      const resp = await requestData._uploadLskyImage(api, token, reqData)

      const { status, data: respData } = resp

      if (status !== 200 || !respData.status) {
        return Promise.reject(new Error(`上传失败：[${status}] ${JSON.stringify(respData?.message ?? respData)} ⚠️`))
      }

      const { key, name, size, mimetype, links, origin_name } = respData.data

      return {
        key,
        name,
        size,
        mimetype,
        url: links.origin,
        origin_name,
      }
    }
    else if (program.type === 's3') {
      return Promise.reject(new Error(`未知错误：不支持${program.type}类型上传 ⚠️`))
    }
    else {
      return Promise.reject(new Error(`未知错误：不支持${program.type}类型上传 ⚠️`))
    }
  },

  _uploadLskyImage: (url: string, token: string, data: UploadData): Promise<LskyUploadResponse> => {
    const req = createRequest(url, token, {
      'Content-Type': 'multipart/form-data',
    })
    return req('/api/v1/upload', 'post', data)
  },

  _uploadLskyProImage: (url: string, token: string, data: UploadData): Promise<LskyUploadResponse> => {
    const req = createRequest(url, token, {
      'Content-Type': 'multipart/form-data',
    })
    return req('/api/v1/upload', 'post', data)
  },
}

export default requestData
