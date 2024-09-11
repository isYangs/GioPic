/**
 * By default, it writes logs to the following locations:
 * on Linux: ~/.config/{app name}/logs/{date}.log
 * on macOS: ~/Library/Logs/{app name}/{date}.log
 * on Windows: %USERPROFILE%\AppData\Roaming\{app name}\logs\{date}.log
 * @see https://www.npmjs.com/package/electron-log
 */
import path from 'node:path'
import { app, ipcMain } from 'electron'
import logger from 'electron-log'

// 获取当前日期的字符串
function getCurrentDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 配置日志
logger.transports.file.level = 'silly' // 日志级别
logger.transports.file.maxSize = 10 * 1024 * 1024 // 文件最大不超过 10M
logger.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}' // 输出格式
logger.transports.file.resolvePathFn = () => {
  const dateStr = getCurrentDateString()
  return path.join(app.getPath('userData'), `logs/${dateStr}.log`)
}

logger.info(`[logger] log module initialized; path: ${logger.transports.file.getFile().path}`)

// 处理来自渲染进程的日志请求
ipcMain.handle('logger', (_, level, message) => {
  switch (level) {
    case 'info':
      logger.info(message)
      break
    case 'warn':
      logger.warn(message)
      break
    case 'error':
      logger.error(message)
      break
    case 'debug':
      logger.debug(message)
      break
    default:
      logger.log(level, message)
      break
  }
})

export default logger
