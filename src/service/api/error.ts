import type { AxiosError } from 'axios'
import logger from '../utils/logger'

export interface BusinessError {
  code: number
  message: string
  isNetworkError: boolean
  details?: Record<string, any>
}

export function errorHandler(error: AxiosError): BusinessError {
  // 网络错误处理
  if (!error.response) {
    return {
      code: 503,
      message: '网络连接异常，请检查网络设置',
      isNetworkError: true,
      details: { originalError: error.message },
    }
  }

  const { status, data } = error.response
  const errorResponse = data as Record<string, any>

  // 业务错误处理
  const businessError: BusinessError = {
    code: errorResponse?.code || status,
    message: errorResponse?.message || `服务器错误 [${status}]`,
    isNetworkError: false,
    details: {
      status,
      originalError: errorResponse,
    },
  }

  logger.error('[request]', {
    errorCode: businessError.code,
    errorMessage: businessError.message,
    details: businessError.details,
  })

  return businessError
}
