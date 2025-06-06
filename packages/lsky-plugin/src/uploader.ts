import type { UploaderResponse } from '@giopic/core'
import type {
  LskyUploader,
  LskyUploadParams,
  LskyUploadResponse,
} from './types'
import { Buffer } from 'node:buffer'
import { Readable } from 'node:stream'
import {
  createFormData,
  createLogger,
  request,
} from '@giopic/core'

const logger = createLogger('lsky-plugin')

async function uploadToSingleStrategy(options: LskyUploadParams, strategyId?: string | number): Promise<UploaderResponse> {
  const {
    api,
    token,
    fileName,
    fileBuffer,
    mimetype,
    size,
    permission,
    useDefaultPermission,
    defaultPermission,
  } = options

  const formData = createFormData()

  const buffer = Buffer.from(fileBuffer)
  const fileStream = Readable.from(buffer)

  Object.assign(fileStream, {
    path: fileName,
    name: fileName,
  })

  formData.append('file', fileStream, {
    filename: fileName,
    contentType: mimetype,
    knownLength: size,
  })

  if (strategyId !== undefined) {
    formData.append('strategy_id', strategyId.toString())
  }

  if (useDefaultPermission) {
    formData.append('permission', (defaultPermission ?? 1).toString())
    options.disablePermissionSelect = true
  }
  else if (permission !== undefined) {
    formData.append('permission', permission.toString())
  }

  logger.info(`发送上传请求: ${api}/api/v1/upload${strategyId ? ` (策略ID: ${strategyId})` : ''}`)

  const { data: res } = await request<LskyUploadResponse>({
    url: `${api}/api/v1/upload`,
    method: 'POST',
    headers: {
      ...formData.getHeaders(),
      Authorization: `Bearer ${token}`,
    },
    data: formData,
    verbose: true,
    logOptions: { name: 'lsky-upload' },
  })

  logger.info(`API响应数据结构: ${JSON.stringify(res.data || {}, null, 2)}`)

  if (!res.status) {
    const errorMessage = res.message || '上传失败'
    logger.error(`上传失败: ${errorMessage}`)
    throw new Error(errorMessage)
  }

  if (!res.data) {
    throw new Error('上传失败: 服务器未返回数据')
  }

  logger.info(`文件上传成功: ${res.data.name}${strategyId ? ` (策略ID: ${strategyId})` : ''}`)

  if (!res.data.links?.url) {
    logger.error('响应数据中缺少图片URL信息')
    throw new Error('上传失败: 响应数据中缺少图片URL信息')
  }

  return {
    key: res.data.key,
    name: res.data.name,
    size: res.data.size,
    mimetype: res.data.mimetype,
    url: res.data.links.url,
    origin_name: res.data.origin_name,
  }
}

async function upload(options: LskyUploadParams): Promise<UploaderResponse | UploaderResponse[]> {
  logger.info(`上传参数: ${JSON.stringify({ ...options, fileBuffer: '[Buffer]', base64Data: '[Base64]' }, null, 2)}`)

  let { strategies } = options

  if (typeof strategies === 'string' && strategies.includes(',')) {
    strategies = strategies.split(',').map(s => s.trim()).filter(Boolean)
    logger.info(`解析策略字符串为数组: ${JSON.stringify(strategies)}`)
  }

  if (!strategies || typeof strategies === 'string' || typeof strategies === 'number') {
    return await uploadToSingleStrategy(options, strategies)
  }

  if (Array.isArray(strategies)) {
    logger.info(`开始批量上传到 ${strategies.length} 个存储策略`)

    const results: UploaderResponse[] = []
    const errors: string[] = []

    for (const strategyId of strategies) {
      try {
        const result = await uploadToSingleStrategy(options, strategyId)
        results.push(result)
        logger.info(`策略 ${strategyId} 上传成功`)
      }
      catch (error) {
        const errorMsg = `策略 ${strategyId} 上传失败: ${error instanceof Error ? error.message : String(error)}`
        logger.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    if (results.length === 0) {
      throw new Error(`所有存储策略上传失败: ${errors.join('; ')}`)
    }

    if (errors.length > 0) {
      logger.warn(`部分存储策略上传失败: ${errors.join('; ')}`)
    }

    logger.info(`批量上传完成，成功: ${results.length}/${strategies.length}`)

    return results.length === 1 ? results[0] : results
  }

  return await uploadToSingleStrategy(options, strategies)
}

export function createUploader(): LskyUploader {
  return {
    upload: params => upload(params),
  }
}
