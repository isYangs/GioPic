import type { AxiosRequestConfig } from 'axios'
import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { type Program, type ProgramDetail, useProgramStore } from '~/stores'
import { wrapUrl } from '~/utils/main'
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

const requestUtils = {
  /**
   * 获取存储策略列表
   * @param id 程序ID，路由中的路径，为时间戳
   * @returns Promise<boolean> 获取成功返回true，失败抛出错误
   * @throws Error 当程序未配置或获取策略失败时抛出错误
   */
  getStrategies: async (id: number) => {
    const programStore = useProgramStore()
    const program = programStore.getProgram(id)
    if (program.type === 'lsky' || program.type === 'lskyPro') {
      const detail = program.type === 'lsky' ? program.detail as ProgramDetail['lsky'] : program.detail as ProgramDetail['lskyPro']
      if (!detail.api || !detail.token) {
        return Promise.reject(new Error('该存储程序未配置'))
      }

      const resp = await requestUtils._getLskyStrategies(detail.api, detail.token)

      const { status, data: respData } = resp

      if (status !== 200 || !respData.status) {
        return Promise.reject(new Error(`获取存储策略失败：[${status}] ${JSON.stringify(respData?.message ?? respData)}`))
      }

      const strategiesData = respData.data.strategies.map((item: {
        name: string
        id: number
      }) => ({
        label: item.name,
        value: item.id,
      }))

      detail.strategies = strategiesData

      if (!detail.activeStrategy && strategiesData.length > 0)
        detail.activeStrategy = strategiesData[0].value

      return true
    }
    else {
      return Promise.reject(new Error(`未知错误：该程序${program.type}无需获取存储策略`))
    }
  },

  _getLskyStrategies: (url: string, token: string) => {
    const req = createRequest(url, token)
    return req('/api/v1/strategies', 'get')
  },

  _getLskyProV2Strategies: (url: string, token: string) => {
    const req = createRequest(url, token)
    return req('/api/v2/group', 'get')
  },

  /**
   * 上传图片
   *
   * @param program - 存储程序
   * @param file - 要上传的文件
   * @param permission - 权限
   * @returns 接口返回的数据
   */
  uploadImage: async (program: Program, file: File, permission: number = 1) => {
    if (program.type === 'lsky' || program.type === 'lskyPro') {
      const { api, token, activeStrategy } = program.detail as ProgramDetail['lsky']
      if (!api || !token || activeStrategy === null) {
        return Promise.reject(new Error('该存储程序未配置'))
      }

      const reqData: UploadData = {
        file,
        permission,
        strategy_id: activeStrategy,
      }
      const resp = await requestUtils._uploadLskyImage(api, token, reqData)

      const { status, data: respData } = resp

      if (status !== 200 || !respData.status) {
        return Promise.reject(new Error(`上传失败：[${status}] ${JSON.stringify(respData?.message ?? respData)}`))
      }

      const { key, name, size, mimetype, links, origin_name } = respData.data

      return {
        key,
        name,
        size,
        mimetype,
        url: links.url,
        origin_name,
      }
    }
    else if (program.type === 's3') {
      const { accessKeyID, secretAccessKey, bucketName, uploadPath, region, endpoint, urlPrefix, pathStyleAccess, tls, disableBucketPrefixToURL } = program.detail as ProgramDetail['s3']
      if (!accessKeyID || !secretAccessKey || !bucketName) {
        return Promise.reject(new Error('存储配置不完整,请检查 AccessKey/SecretKey/Bucket 配置'))
      }

      let realEndpoint = ''

      if (endpoint) {
        const url = wrapUrl(endpoint)
        const portStr = url.port ? `:${url.port}` : ''
        console.log(url.port)
        realEndpoint = pathStyleAccess
          ? `${url.protocol}//${url.hostname}${portStr}/${bucketName}`
          : `${url.protocol}//${bucketName}.${url.hostname}${portStr}`
        console.log(realEndpoint)
      }
      else {
        realEndpoint = `https://s3.${region}.amazonaws.com/`
      }

      const client = new S3Client({
        region,
        credentials: {
          accessKeyId: accessKeyID,
          secretAccessKey,
        },
        endpoint: realEndpoint,
        forcePathStyle: pathStyleAccess,
      })

      const key = uploadPath
        ? uploadPath.endsWith('/')
          ? uploadPath + file.name
          : `${uploadPath}/${file.name}`
        : file.name

      const upload = new Upload({
        client,
        params: {
          Bucket: bucketName,
          Key: key,
          Body: file,
          ContentType: file.type,
          ACL: permission ? 'public-read' : 'private',
        },
      })

      const resp = await upload.done()

      const { Key } = resp

      const url = urlPrefix
        ? `${wrapUrl(urlPrefix)}${Key}` // 自定义CDN域名
        : `${realEndpoint}${disableBucketPrefixToURL ? '' : `${bucketName}/`}${Key}` // 默认域名

      return {
        key: Key,
        name: file.name,
        size: file.size,
        mimetype: file.type,
        url,
        origin_name: file.name,
      }
    }
    else {
      return Promise.reject(new Error(`未知错误：不支持${program.type}类型上传`))
    }
  },

  _uploadLskyImage: (url: string, token: string, data: UploadData): Promise<LskyUploadResponse> => {
    const req = createRequest(url, token, {
      'Content-Type': 'multipart/form-data',
    })
    return req('/api/v1/upload', 'post', data)
  },

  _uploadLskyProV2Image: (url: string, token: string, data: UploadData): Promise<LskyUploadResponse> => {
    const req = createRequest(url, token, {
      'Content-Type': 'multipart/form-data',
    })
    return req('/api/v2/upload', 'post', data)
  },
}

export default requestUtils
