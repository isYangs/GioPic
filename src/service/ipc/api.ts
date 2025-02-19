import type { ProgramDetail } from '@/types'
import { ipcMain } from 'electron'
import { createLskyService, lskyUploader } from '../api/lsky'
import { createS3Service, s3Uploader } from '../api/s3'
import logger from '../utils/logger'

interface LskyRequest {
  config: ProgramDetail['lsky']
  data?: any
}

interface S3Request {
  config: ProgramDetail['s3']
  data?: any
}

export function setupIpcRequest() {
  ipcMain.handle('lsky:getStrategies', async (_, { config }: LskyRequest) => {
    try {
      const service = createLskyService(config)
      const lsky = lskyUploader(service)
      const result = await lsky.getStrategies()
      return JSON.stringify(result)
    }
    catch (error) {
      logger.error('[lsky] Get strategies failed:', error)
      throw error
    }
  })

  ipcMain.handle('lsky:upload', async (_, { config, data }: LskyRequest) => {
    try {
      const service = createLskyService(config)
      const lsky = lskyUploader(service)
      const result = await lsky.uploadImage(data)
      return JSON.parse(JSON.stringify(result))
    }
    catch (error) {
      logger.error('[lsky] Upload failed:', error)
      throw error
    }
  })

  ipcMain.handle('s3:upload', async (_, { config, data }: S3Request) => {
    try {
      const client = createS3Service(config)
      const s3 = s3Uploader(client, config)
      const result = await s3.uploadImage(data)
      return JSON.parse(JSON.stringify(result))
    }
    catch (error) {
      logger.error('[s3] Upload failed:', error)
      throw error
    }
  })
}
