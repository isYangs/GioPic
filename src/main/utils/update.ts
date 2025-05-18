import type { BrowserWindow } from 'electron'
import https from 'node:https'
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

/**
 * 设置更新服务器
 * 根据用户选择的更新源进行配置
 */
async function setupUpdateServer() {
  const updateSource = getStore('updateSource') || 'github'

  logger.info(`[update] Setting up update server: ${updateSource}`)

  if (updateSource === 'cn') {
    // 配置国内服务器
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: 'https://update.isyangs.cn/',
      channel: 'latest',
    })
    logger.info('[update] Using China update server')
  }
  else if (updateSource === 'auto') {
    const isGithubAccessible = await checkGithubAccessibility()
    if (!isGithubAccessible) {
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: 'https://update.isyangs.cn/',
        channel: 'latest',
      })
      logger.info('[update] Auto-selected China update server')
    }
    else {
      logger.info('[update] Auto-selected GitHub update server')
    }
  }
  else {
    logger.info('[update] Using GitHub update server')
  }
}

/**
 * 检查 GitHub 是否可访问
 * 使用网络请求检测 GitHub 可访问性
 */
async function checkGithubAccessibility(): Promise<boolean> {
  try {
    return new Promise<boolean>((resolve) => {
      const request = https.get('https://api.github.com', {
        timeout: 5000,
        headers: { 'User-Agent': 'GioPic' },
      }, (response) => {
        resolve(response.statusCode !== undefined && response.statusCode >= 200 && response.statusCode < 500)
      })

      request.on('error', (error) => {
        logger.error(`[update] GitHub accessibility check error: ${error}`)
        resolve(false)
      })

      request.on('timeout', () => {
        logger.error('[update] GitHub accessibility check timeout')
        request.destroy()
        resolve(false)
      })

      request.end()
    })
  }
  catch (error) {
    logger.error(`[update] Error checking GitHub accessibility: ${error}`)
    return false
  }
}

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

  // 设置更新服务器
  setupUpdateServer().catch((e) => {
    logger.error(`[update] Error setting up update server: ${e}`)
  })

  // 关闭自动下载
  autoUpdater.autoDownload = false
  // 关闭自动安装
  autoUpdater.autoInstallOnAppQuit = false

  // 监听更新源变更事件
  ipcMain.on('change-update-source', (_e, source) => {
    setStore('updateSource', source)
    logger.info(`[update] Update source changed to: ${source}`)
    setupUpdateServer().catch((e) => {
      logger.error(`[update] Error setting up update server after source change: ${e}`)
    })
  })

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
      win.webContents.send('update-show-toast', '正在检查更新')
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
      // win.webContents.send('update-show-update-progress')
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
    // win.webContents.send('update-update-progress', percent)
  })

  // 当需要更新的内容下载完成后
  autoUpdater.on('update-downloaded', () => {
    // 手动更新下载进度
    win.webContents.send('update-update-progress', 100)
    logger.info('[update] Update downloaded, wating for quitting and installing...')
    win.webContents.send('update-show-update-restart', updateOnThisStart)
    // 退出并安装应用
    ipcMain.on('restart-and-install', (_e) => {
      setImmediate(() => autoUpdater.quitAndInstall(true, true))
    })
  })
}
