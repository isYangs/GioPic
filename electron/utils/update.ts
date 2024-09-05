import { resolve } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { app, dialog, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import logger from './logger'

if (is.dev) {
  Object.defineProperty(app, 'isPackaged', {
    get() {
      return true
    },
  })
  autoUpdater.updateConfigPath = resolve(__dirname, '../../dev-app-update.yml')
}

// 关闭自动下载
autoUpdater.autoDownload = false
// 关闭自动安装
autoUpdater.autoInstallOnAppQuit = false

export default () => {
  ipcMain.on('check-for-update', async () => {
    logger.info('[update] Checking for updates...')
    console.log('check-for-update')
    try {
      await autoUpdater.checkForUpdates()
    }
    catch (e: any) {
      logger.error(`[update] Error checking for updates: ${e}`)
    }
  })

  autoUpdater.on('error', (e) => {
    logger.error(`[update] AutoUpdater error: ${e}`)
  })

  // 检测是否需要更新
  autoUpdater.on('checking-for-update', () => {
    logger.info('[update] Checking for updates...')
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
        title: '应用有新的更新',
        detail: releaseContent,
        message: '发现新版本，是否现在更新？',
        buttons: ['否', '是'],
      })
      .then(({ response }) => {
        if (response === 1) {
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
