import axios from 'axios'

function tip(content: string) {
  window.$notification.error({
    title: '请求错误',
    duration: 3 * 1000,
    content,
  })
}

/**
 * 请求失败后的错误统一处理
 * @param {number} status 请求状态码
 * @param {DataView} other 其他信息
 */

function errorHandler(status: number, other: DataView) {
  switch (status) {
    case 401:
      tip('未填写token或token无效')
      break
    case 403:
      tip('管理员关闭了接口功能或没有该接口权限')
      break
    case 429:
      tip('超出请求配额，请求受限')
      break
    case 500:
      tip('服务端出现异常')
      break
    case 404:
      tip('请求的资源不存在')
      break
    default:
      tip(other.toString())
  }
}

const service = axios.create({
  timeout: 10000 * 12,
  headers: {
    Accept: 'application/json',
  },
})

// Request interceptors
service.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    Promise.reject(error)
  },
)

// Response interceptors
service.interceptors.response.use(
  (response) => {
    if (response.status === 200)
      return Promise.resolve(response)

    return Promise.reject(response)
  },
  (error) => {
    if (error.response) {
      errorHandler(error.response.status, error.response.data)
      return Promise.reject(error.response)
    }
    else {
      tip('请求超时，请检查网络连接')
    }
  },
)

export default service
