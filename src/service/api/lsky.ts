import type { ProgramDetail } from '@/types'
import type { AxiosInstance } from 'axios'
import { AxiosHeaders } from 'axios'
import { createUploadService } from './axios'

interface LskyUploadData {
  file: File
  permission: number
  strategy_id: number
  album_id?: number
  expired_at?: string
}

export function createLskyService(config: ProgramDetail['lsky']) {
  return createUploadService({
    baseURL: config.api,
    interceptors: {
      beforeRequest: (cfg) => {
        const headers = new AxiosHeaders(cfg.headers)
        headers.set('Authorization', `Bearer ${config.token}`)
        headers.set('Accept', 'application/json')

        return {
          ...cfg,
          headers,
        }
      },
    },
  })
}

export function lskyUploader(service: AxiosInstance) {
  return {
    getStrategies: () => {
      return service.get('/api/v1/strategies')
    },

    uploadImage: (config: LskyUploadData) => {
      return service.post('/api/v1/upload', config, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },
  }
}
