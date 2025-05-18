import type { LskyUploadParams, LskyUploadResponse, UploaderResponse } from '@/types'
import fs from 'node:fs'
import logger from '@/main/utils/logger'
import FormData from 'form-data'
import { httpRequest } from '../../HTTPService'

export async function upload(options: LskyUploadParams): Promise<UploaderResponse> {
  const { api, token, path, ...data } = options
  const formData = new FormData()

  const fileStream = fs.createReadStream(path)
  formData.append('file', fileStream)
  if (data.strategy_id !== undefined)
    formData.append('strategy_id', data.strategy_id.toString())
  if (data.album_id !== undefined)
    formData.append('album_id', data.album_id.toString())
  if (data.permission !== undefined)
    formData.append('permission', data.permission.toString())
  if (data.expired_at)
    formData.append('expired_at', data.expired_at)
  const { data: response } = await httpRequest<LskyUploadResponse>({
    url: `${api}/api/v1/upload`,
    method: 'POST',
    headers: {
      ...formData.getHeaders(),
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    data: formData,
  })

  if (!response) {
    logger.error('[upload] Upload failed: No response data received')
    throw new Error('Upload failed: No response data received')
  }

  return {
    key: response.key,
    name: response.name,
    size: response.size,
    mimetype: response.mimetype,
    url: response.links.url,
    origin_name: response.origin_name,
  }
}
