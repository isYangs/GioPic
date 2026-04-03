import fs from 'node:fs'
import path from 'node:path'
import { platform } from '@electron-toolkit/utils'
import { app } from 'electron'

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }

  return dirPath
}

export function isE2EEnabled() {
  return process.env.GIOPIC_E2E === '1'
}

export function getUserDataPath() {
  const customPath = process.env.GIOPIC_E2E_USER_DATA
  if (customPath) {
    return ensureDir(customPath)
  }

  return app.getPath('userData')
}

export function configureRuntimePaths() {
  if (!isE2EEnabled()) {
    return
  }

  const userDataPath = getUserDataPath()
  app.setPath('userData', userDataPath)

  const sessionDataPath = process.env.GIOPIC_E2E_SESSION_DATA
    ? ensureDir(process.env.GIOPIC_E2E_SESSION_DATA)
    : ensureDir(path.join(userDataPath, 'session'))

  app.setPath('sessionData', sessionDataPath)
}

export function getDatabasePath() {
  if (process.env.GIOPIC_E2E_DB_PATH) {
    return process.env.GIOPIC_E2E_DB_PATH
  }

  if (isE2EEnabled()) {
    return path.join(getUserDataPath(), 'GPData.db')
  }

  return platform.isMacOS
    ? path.join(getUserDataPath(), 'GPData.db')
    : path.join(path.dirname(app.getPath('exe')), 'GPData.db')
}

export function getPluginsPath() {
  return path.join(getUserDataPath(), 'plugins')
}

export function getPluginTemplatesPath() {
  return path.join(getUserDataPath(), 'plugin-templates')
}

export function getBackupsPath() {
  return path.join(getUserDataPath(), 'backups')
}

export function getStorePath() {
  return getUserDataPath()
}
