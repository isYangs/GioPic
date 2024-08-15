/**
 * By default, it writes logs to the following locations:
 * on Linux: ~/.config/{app name}/logs/main.log
 * on macOS: ~/Library/Logs/{app name}/main.log
 * on Windows: %USERPROFILE%\AppData\Roaming\{app name}\logs\main.log
 * @see https://www.npmjs.com/package/electron-log
 */
import * as path from 'node:path'
import { app, ipcMain } from 'electron'
import logger from 'electron-log'

const LOG_PATH = path.join(app.getPath('userData'), 'logs/main.log')

// 配置日志
logger.transports.file.level = 'silly' // 日志级别
logger.transports.file.maxSize = 10 * 1024 * 1024 // 文件最大不超过 10M
logger.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}' // 输出格式
logger.transports.file.resolvePathFn = () => LOG_PATH // 日志文件路径

logger.info(`[logger] log module initialized; path: ${LOG_PATH}`)

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
