import { ipcMain } from 'electron'
import { getDB } from '../db'
import { insertUploadData } from '../db/modules'
import { clearStore, deletePersistedStore, setPersistedStore } from '../stores'
import { clearMainPluginDataStore, replaceMainPluginDataStore } from '../stores/plugin-data'
import { isE2EEnabled } from '../utils/runtime-paths'

interface E2EUploadMockConfig {
  enabled: boolean
  baseUrl: string
  delayMs: number
  failCount: number
  failMessage: string
}

interface E2ESeedStatePayload {
  appStore?: Record<string, any>
  programStore?: Record<string, any>
  pluginData?: Record<string, Record<string, any>>
  uploadRecords?: GP.DB.UploadData[]
}

function defaultUploadMockConfig(): E2EUploadMockConfig {
  return {
    enabled: true,
    baseUrl: 'https://e2e.giopic.local/uploads/',
    delayMs: 0,
    failCount: 0,
    failMessage: 'Mock upload failed',
  }
}

let uploadMockConfig = defaultUploadMockConfig()

function resetUploadRecords() {
  const db = getDB()
  db.exec('DELETE FROM upload_data')
}

export function registerE2EIpc() {
  if (!isE2EEnabled()) {
    return
  }

  ipcMain.handle('e2e:reset-state', () => {
    clearStore()
    clearMainPluginDataStore()
    resetUploadRecords()
    uploadMockConfig = defaultUploadMockConfig()
    return true
  })

  ipcMain.handle('e2e:seed-state', (_event, payload: E2ESeedStatePayload = {}) => {
    const { appStore, programStore, pluginData, uploadRecords } = payload

    if (appStore) {
      setPersistedStore('__giopic_app_store__', appStore)
    }
    else {
      deletePersistedStore('__giopic_app_store__')
    }

    if (programStore) {
      setPersistedStore('__giopic_program_store__', programStore)
    }
    else {
      deletePersistedStore('__giopic_program_store__')
    }

    replaceMainPluginDataStore(pluginData || {})

    resetUploadRecords()
    for (const record of uploadRecords || []) {
      insertUploadData(record)
    }

    return true
  })

  ipcMain.handle('e2e:set-upload-mock', (_event, partialConfig: Partial<E2EUploadMockConfig> = {}) => {
    uploadMockConfig = {
      ...uploadMockConfig,
      ...partialConfig,
    }
    return uploadMockConfig
  })
}

export async function runE2EUploadMock(pluginId: string, params: Record<string, any>) {
  if (!isE2EEnabled() || !uploadMockConfig.enabled) {
    return null
  }

  if (uploadMockConfig.delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, uploadMockConfig.delayMs))
  }

  if (uploadMockConfig.failCount > 0) {
    uploadMockConfig = {
      ...uploadMockConfig,
      failCount: uploadMockConfig.failCount - 1,
    }
    throw new Error(uploadMockConfig.failMessage)
  }

  const fileName = params.fileName || 'mock-image.png'
  const key = `${pluginId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const baseUrl = uploadMockConfig.baseUrl.replace(/\/+$/, '')

  return {
    key,
    name: fileName,
    size: params.size || 0,
    mimetype: params.mimetype || 'image/png',
    url: `${baseUrl}/${encodeURIComponent(fileName)}?key=${key}`,
    origin_name: fileName,
  }
}
