import type { BrowserWindow } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { is } from '@electron-toolkit/utils'
import { app, dialog, ipcMain } from 'electron'
import pkg from 'electron-updater'
import logger from './logger'

const { autoUpdater } = pkg

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

  autoUpdater.on('error', (e) => {
    logger.error(`[update] AutoUpdater error: ${e}`)
  })

  // 检测是否需要更新
  autoUpdater.on('checking-for-update', () => {
    logger.info('[update] Checking for updates...')
    win.webContents.send('update', 'show-toast', '正在检查更新')
  })

  // 检测到可以更新时
  autoUpdater.on('update-available', (releaseInfo) => {
    logger.info(`[update] Update available: ${releaseInfo.version}`)
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
    // 弹框确认是否下载更新（releaseContent是更新日志）
    dialog
      .showMessageBox({
        type: 'info',
        title: '',
        detail: releaseContent,
        message: '检测到可用更新，是否下载？',
        noLink: true,
        buttons: ['确定', '取消'],
      })
      .then(({ response }) => {
        if (response === 0) {
          win.webContents.send('update', 'show-update-progress')
          logger.info('[update] User accepted the update. Downloading...')
          // 下载更新
          autoUpdater.downloadUpdate()
        }
        else {
          logger.info('[update] User declined the update.')
        }
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
    win.webContents.send('update', 'update-update-progress', percent)
  })

  // 当需要更新的内容下载完成后
  autoUpdater.on('update-downloaded', () => {
    logger.info('[update] Update downloaded.')
    dialog
      .showMessageBox({
        title: '安装更新',
        message: '更新下载完毕，应用将重启并进行安装',
      })
      .then(() => {
        logger.info('[update] Quitting and installing update...')
        // 退出并安装应用
        setImmediate(() => autoUpdater.quitAndInstall())
      })
  })
}
