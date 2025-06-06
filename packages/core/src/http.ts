import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { LoggerOptions } from './logger'
import axios from 'axios'
import FormData from 'form-data'
import { createLogger } from './logger'

export interface RequestOptions {
  /** 请求URL */
  url: string
  /** 请求方法 */
  method: string
  /** 请求头 */
  headers?: Record<string, string>
  /** 请求体 */
  data?: any
  /** 日志选项 */
  logOptions?: LoggerOptions
  /** 是否返回原始响应体文本，默认为false（解析为JSON） */
  rawResponse?: boolean
  /** 是否启用详细日志，默认为false */
  verbose?: boolean
  /** 超时时间（毫秒），默认为10000 */
  timeout?: number
  /** 其他 axios 配置选项 */
  axiosOptions?: Partial<AxiosRequestConfig>
}

export interface RequestResult<T = any> {
  /** 响应数据 */
  data: T
  /** 响应状态码 */
  status: number
  /** 原始响应文本 */
  rawText?: string
  /** 响应头 */
  headers?: Record<string, string>
}

const logger = createLogger('http')

const axiosInstance: AxiosInstance = axios.create({
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    const { config, message } = error
    logger.error(`[request] Failed - Method: ${config?.method}, URL: ${config?.url}, Error: ${message}`)
    return Promise.reject(error)
  },
)

axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      const { config, response, message } = error
      logger.error(`[response] Failed - Method: ${config?.method}, URL: ${config?.url}, Status: ${response?.status}, Error: ${message}`)
    }
    else {
      logger.error(`[response] Failed - Error: ${error instanceof Error ? error.message : String(error)}`)
    }
    return Promise.reject(error)
  },
)

export async function request<T = any>(options: RequestOptions): Promise<RequestResult<T>> {
  const { url, method, headers = {}, data, verbose = false, timeout = 10000 } = options
  const customLogger = options.logOptions ? createLogger(options.logOptions.name || 'http-custom') : logger

  try {
    if (verbose) {
      customLogger.info(`${method} ${url}`)
      if (headers && Object.keys(headers).length > 0) {
        customLogger.info(`Headers: ${JSON.stringify(headers)}`)
      }
    }

    const config: AxiosRequestConfig = {
      url,
      method,
      headers,
      timeout,
      ...options.axiosOptions,
    }

    if (data) {
      if (data instanceof FormData) {
        config.data = data
        config.headers = {
          ...config.headers,
          ...data.getHeaders(),
        }

        if (verbose) {
          customLogger.info('Sending form data')
        }
      }
      else {
        config.data = data

        if (verbose) {
          customLogger.info(`Request data: ${JSON.stringify(data)}`)
        }
      }
    }

    const response: AxiosResponse = await axiosInstance(config)

    const responseData = response.data
    const rawText = typeof responseData === 'string' ? responseData : JSON.stringify(responseData)

    if (verbose) {
      customLogger.info(`Response status: ${response.status}`)
      customLogger.info(`Response text: ${rawText}`)
    }

    if (options.rawResponse && typeof responseData === 'string') {
      return {
        data: responseData as unknown as T,
        status: response.status,
        rawText: responseData,
        headers: response.headers as Record<string, string>,
      }
    }

    return {
      data: responseData,
      status: response.status,
      rawText,
      headers: response.headers as Record<string, string>,
    }
  }
  catch (error) {
    customLogger.error('Request failed:', error instanceof Error ? error.message : String(error))
    throw error
  }
}

export function createFormData(): FormData {
  return new FormData()
}
