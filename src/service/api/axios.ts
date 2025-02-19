import type {
  AxiosInstance,
  AxiosProgressEvent,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import axios from 'axios'
import { BrowserWindow } from 'electron'
import logger from '../utils/logger'
import { errorHandler } from './error'

interface InterceptorHooks {
  beforeRequest?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig
  afterResponse?: <T>(response: AxiosResponse<T>) => any
  onError?: (error: any) => Promise<never>
  onUploadProgress?: (progress: AxiosProgressEvent) => void
}

interface CreateServiceOptions {
  baseURL?: string
  timeout?: number
  interceptors?: InterceptorHooks
}

interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

function createHttpService(options: CreateServiceOptions): AxiosInstance {
  const {
    baseURL,
    timeout = 120_000,
    interceptors = {},
  } = options

  // 创建 axios 实例
  const service = axios.create({
    baseURL,
    timeout,
    headers: { 'Content-Type': 'application/json' },
    onUploadProgress: interceptors.onUploadProgress,
  })

  // 请求拦截器
  service.interceptors.request.use(
    (config) => {
      logger.info('[request]', { url: config.url, method: config.method, data: config.data })
      return interceptors.beforeRequest?.(config) || config
    },
    (error) => {
      logger.error('[request error]', error)
      return Promise.reject(error)
    },
  )

  // 响应拦截器
  service.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      logger.info('[response]', { url: response.config.url, status: response.status })

      const processed = interceptors.afterResponse?.(response) || response
      const responseData = processed.data

      if (!responseData) {
        throw new Error('响应数据为空')
      }

      if (responseData.code !== 200) {
        throw new Error(responseData.message || '请求失败', {
          cause: { code: responseData.code },
        })
      }

      return responseData.data
    },
    (error) => {
      logger.error('[response error]', error)
      return interceptors.onError?.(error) || Promise.reject(errorHandler(error))
    },
  )

  return service
}

// 创建默认 HTTP 实例
export const http = createHttpService({})

// 创建上传服务
export function createUploadService(options: CreateServiceOptions) {
  const mainWindow = BrowserWindow.getAllWindows()[0]
  if (!mainWindow) {
    throw new Error('No window available for upload service')
  }

  const handleUploadProgress = (progress: AxiosProgressEvent) => {
    try {
      options.interceptors?.onUploadProgress?.(progress)
      const { loaded, total } = progress
      mainWindow.webContents.send('upload-progress', {
        percent: Math.round((loaded / (total || loaded)) * 100),
        loaded,
        total,
      })
    }
    catch (error) {
      logger.error('[upload progress error]', error)
    }
  }

  return createHttpService({
    ...options,
    interceptors: {
      ...options.interceptors,
      onUploadProgress: handleUploadProgress,
    },
  })
}
