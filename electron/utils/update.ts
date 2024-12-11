import type { BrowserWindow } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { is } from '@electron-toolkit/utils'
import { app, ipcMain } from 'electron'
import pkg from 'electron-updater'
import logger from './logger'
import { getStore, setStore } from './store'

const { autoUpdater } = pkg

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * 启动时检测更新的标志。
 * 如果为 true，则不在主弹出检测更新 toast，并且需要考虑忽略版本。
 */
let silentUpdateCheck = true

/**
 * 是否在此次启动时直接升级
 */
const updateOnThisStart = getStore('updateAtNext')

export async function checkForUpdates() {
  logger.info('[update] Checking for updates...')
  try {
    await autoUpdater.checkForUpdates()
  }
  catch (e) {
    logger.error(`[update] Error checking for updates: ${e}`)
  }
}

export default function initUpdater(win: BrowserWindow) {
  if (is.dev) {
    Object.defineProperty(app, 'isPackaged', {
      get() {
        return true
      },
    })
    autoUpdater.updateConfigPath = path.resolve(__dirname, '../../dev-app-update.yml')
  }

  // 关闭自动下载
  autoUpdater.autoDownload = false
  // 关闭自动安装
  autoUpdater.autoInstallOnAppQuit = false

  ipcMain.on('check-for-update', checkForUpdates)

  // 启动时检测更新
  win.once('ready-to-show', async () => {
    if (getStore('autoUpdate') || updateOnThisStart) {
      await autoUpdater.checkForUpdates()

      silentUpdateCheck = false
      logger.info('[update] Startup update check completed.')
    }
  })

  autoUpdater.on('error', (e) => {
    logger.error(`[update] AutoUpdater error: ${e}`)
  })

  // 检测是否需要更新
  autoUpdater.on('checking-for-update', () => {
    logger.info('[update] Checking for updates...')
    if (!silentUpdateCheck) {
      win.webContents.send('update', 'show-toast', '正在检查更新')
    }
    else {
      logger.info('[update] Silent update, skipping checking toast.')
    }
  })

  // 检测到可以更新时
  autoUpdater.on('update-available', (releaseInfo) => {
    logger.info(`[update] Update available: ${releaseInfo.version}`)

    if (updateOnThisStart) {
      logger.info('[update] Auto updating at next startup.')
      setStore('updateAtNext', false)
      autoUpdater.downloadUpdate()
      return
    }

    if (silentUpdateCheck && releaseInfo.version === getStore('ignoreVersion')) {
      logger.info(`[update] Auto updating, ignore version ${releaseInfo.version}`)
      return
    }

    const releaseNotes = releaseInfo.releaseNotes
    let releaseContent = ''
    if (releaseNotes) {
      if (typeof releaseNotes === 'string') {
        releaseContent = releaseNotes
      }
      else if (Array.isArray(releaseNotes)) {
        releaseNotes.forEach((releaseNote) => {
          releaseContent += `${releaseNote}\n`
        })
      }
    }
    else {
      releaseContent = '暂无更新说明'
    }

    win.webContents.send('update-show-release', releaseInfo.version, releaseContent)
    ipcMain.on('download-update', (_e) => {
      // win.webContents.send('update', 'show-update-progress')
      logger.info('[update] User accepted the update. Downloading...')
      // 下载更新
      autoUpdater.downloadUpdate()
    })
  })

  // 检测到不需要更新时
  autoUpdater.on('update-not-available', () => {
    logger.info('[update] No updates available.')
  })

  // 更新下载进度
  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.trunc(progress.percent)
    logger.info(`[update] Download progress: ${percent}%`)
    // win.webContents.send('update', 'update-update-progress', percent)
  })

  // 当需要更新的内容下载完成后
  autoUpdater.on('update-downloaded', () => {
    // 手动更新下载进度
    win.webContents.send('update', 'update-update-progress', 100)
    logger.info('[update] Update downloaded, wating for quitting and installing...')
    win.webContents.send('update-show-update-restart', updateOnThisStart)
    // 退出并安装应用
    ipcMain.on('restart-and-install', (_e) => {
      setImmediate(() => autoUpdater.quitAndInstall(true, true))
    })
  })
}
