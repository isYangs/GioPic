import type { BrowserWindow } from 'electron'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { is } from '@electron-toolkit/utils'
import { ipcMain } from 'electron'
import pkg from 'electron-updater'
import logger from '../utils/logger'
import { getStore, setStore } from '../utils/store'

const { autoUpdater } = pkg

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export class AppUpdater {
  private silentUpdateCheck = true

  private win: BrowserWindow

  constructor(win: BrowserWindow) {
    this.win = win

    if (is.dev) {
      autoUpdater.updateConfigPath = path.resolve(__dirname, '../../../dev-app-update.yml')
    }

    // 设置更新服务器
    this.setupUpdateServer().catch((e) => {
      logger.error(`[update] Error setting up update server: ${e}`)
    })

    // 关闭自动下载
    autoUpdater.autoDownload = false
    // 关闭自动安装
    autoUpdater.autoInstallOnAppQuit = false

    this.setupEventListeners()
  }

  /**
   * 设置更新服务器
   * 根据用户选择的更新源进行配置
   */
  private async setupUpdateServer() {
    const updateSource = getStore('updateSource') || 'github'
    if (updateSource === 'cn') {
      // 配置国内服务器
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: 'https://update.isyangs.cn/',
        channel: 'latest',
      })
    }
    else if (updateSource === 'auto') {
      const isGithubAccessible = await this.checkGithubAccessibility()
      if (!isGithubAccessible) {
        autoUpdater.setFeedURL({
          provider: 'generic',
          url: 'https://update.isyangs.cn/',
          channel: 'latest',
        })
      }
    }
  }

  /**
   * 检查 GitHub 是否可访问
   * 使用网络请求检测 GitHub 可访问性
   */
  private async checkGithubAccessibility(): Promise<boolean> {
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

  /**
   * 检查更新
   */
  public async checkForUpdates() {
    try {
      await autoUpdater.checkForUpdates()
    }
    catch (e) {
      logger.error(`[update] Error checking for updates: ${e}`)
    }
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners() {
    ipcMain.on('change-update-source', (_e, source) => {
      setStore('updateSource', source)
      this.setupUpdateServer().catch((e) => {
        logger.error(`[update] Error setting up update server after source change: ${e}`)
      })
    })

    ipcMain.on('check-for-update', () => this.checkForUpdates())

    // 启动时检测更新
    const updateOnThisStart = getStore('updateAtNext')
    this.win.once('ready-to-show', async () => {
      if (getStore('autoUpdate') || updateOnThisStart) {
        await autoUpdater.checkForUpdates()

        this.silentUpdateCheck = false
      }
    })

    autoUpdater.on('error', (e) => {
      logger.error(`[update] AutoUpdater error: ${e}`)
    })

    // 检测是否需要更新
    autoUpdater.on('checking-for-update', () => {
      if (!this.silentUpdateCheck) {
        this.win.webContents.send('update-show-toast', '正在检查更新')
      }
    })

    // 检测到可以更新时
    autoUpdater.on('update-available', (releaseInfo) => {
      // 重要的版本信息日志保留
      logger.info(`[update] Update available: ${releaseInfo.version}`)

      if (updateOnThisStart) {
        setStore('updateAtNext', false)
        autoUpdater.downloadUpdate()
        return
      }

      if (this.silentUpdateCheck && releaseInfo.version === getStore('ignoreVersion')) {
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

      this.win.webContents.send('update-show-release', releaseInfo.version, releaseContent)
      ipcMain.on('download-update', (_e) => {
        // this.win.webContents.send('update-show-update-progress')
        // 下载更新
        autoUpdater.downloadUpdate()
      })
    })

    // 检测到不需要更新时
    autoUpdater.on('update-not-available', () => { })

    // 更新下载进度
    autoUpdater.on('download-progress', (progress) => {
      const _percent = Math.trunc(progress.percent)
      // this.win.webContents.send('update-update-progress', _percent)
    })

    // 当需要更新的内容下载完成后
    autoUpdater.on('update-downloaded', () => {
      // 手动更新下载进度
      this.win.webContents.send('update-update-progress', 100)
      logger.info('[update] Update downloaded, wating for quitting and installing...')
      this.win.webContents.send('update-show-update-restart', updateOnThisStart)
      // 退出并安装应用
      ipcMain.on('restart-and-install', (_e) => {
        setImmediate(() => autoUpdater.quitAndInstall(true, true))
      })
    })
  }
}

export default function createAppUpdater(win: BrowserWindow): AppUpdater {
  return new AppUpdater(win)
}
