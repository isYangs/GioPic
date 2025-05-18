import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import logger from '../utils/logger'

const instance: AxiosInstance = axios.create({
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

instance.interceptors.request.use(
  (config) => {
    logger.info(`[request] Request initiated - Method: ${config.method}, URL: ${config.url}`)
    return config
  },
  (error) => {
    const { config, response, message } = error
    logger.error(`[request] Failed - Method: ${config?.method}, URL: ${config?.url}, Status: ${response?.status}, Error: ${message}`)
  },
)

instance.interceptors.response.use(
  (response) => {
    logger.info(`[response] Response sent - Method: ${response.config.method}, URL: ${response.config.url}, Status: ${response.status} (${response.statusText})`)
    return response.data
  },
  (error) => {
    if (error.response) {
      const { config, response, message } = error
      logger.error(`[request] Failed - Method: ${config?.method}, URL: ${config?.url}, Status: ${response?.status}, Error: ${message}`)
    }
    else {
      logger.error(`[request] Failed - Error: ${error.message}`)
    }
  },
)

export function httpRequest<T>(config: AxiosRequestConfig): Promise<{
  success: boolean
  data?: T
  message?: string
  status?: number
}> {
  return instance(config)
}

export default instance
