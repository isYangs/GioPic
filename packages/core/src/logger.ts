/**
 * 日志级别
 */
export enum LogLevel {
  /** 调试信息 */
  Debug = 0,
  /** 一般信息 */
  Info = 1,
  /** 警告信息 */
  Warn = 2,
  /** 错误信息 */
  Error = 3,
  /** 关闭日志 */
  Silent = 4,
}

/**
 * 日志选项
 */
export interface LoggerOptions {
  /** 日志名称 */
  name?: string
  /** 日志级别 */
  level?: LogLevel
  /** 是否启用时间戳 */
  timestamp?: boolean
  /** 自定义格式化函数 */
  formatter?: (level: string, message: string, timestamp: string, name: string) => string
}

/**
 * 日志接口
 */
export interface Logger {
  /** 输出调试信息 */
  debug: (...args: any[]) => void
  /** 输出一般信息 */
  info: (...args: any[]) => void
  /** 输出警告信息 */
  warn: (...args: any[]) => void
  /** 输出错误信息 */
  error: (...args: any[]) => void
  /** 设置日志级别 */
  setLevel: (level: LogLevel) => void
}

/**
 * 默认日志选项
 */
const defaultOptions: LoggerOptions = {
  name: 'giopic',
  level: LogLevel.Info,
  timestamp: true,
}

/**
 * 全局日志级别
 */
let globalLogLevel = LogLevel.Info

/**
 * 设置全局日志级别
 * @param level 日志级别
 */
export function setGlobalLogLevel(level: LogLevel) {
  globalLogLevel = level
}

/**
 * 创建日志器
 * @param optionsOrName 日志选项或日志名称
 * @returns 日志器实例
 */
export function createLogger(optionsOrName: LoggerOptions | string): Logger {
  const hasCustomLevel = typeof optionsOrName !== 'string' && optionsOrName.level !== undefined
  const options = typeof optionsOrName === 'string'
    ? { ...defaultOptions, name: optionsOrName }
    : { ...defaultOptions, ...optionsOrName }
  let currentLevel = hasCustomLevel ? (options.level ?? LogLevel.Info) : globalLogLevel

  // 创建格式化函数
  const format = options.formatter || ((level, message, timestamp, name) => {
    return options.timestamp
      ? `[${timestamp}] [${name}] ${level}: ${message}`
      : `[${name}] ${level}: ${message}`
  })

  /**
   * 获取当前时间戳
   * @returns 格式化的时间戳
   */
  const getTimestamp = () => {
    const now = new Date()
    return now.toISOString()
  }

  /**
   * 打印日志
   * @param level 日志级别
   * @param levelName 日志级别名称
   * @param args 日志参数
   */
  const log = (level: LogLevel, levelName: string, ...args: any[]) => {
    if (level < currentLevel) {
      return
    }

    const message = args.map((arg) => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2)
        }
        catch {
          return String(arg)
        }
      }
      return String(arg)
    }).join(' ')

    const formattedMessage = format(
      levelName,
      message,
      getTimestamp(),
      options.name || 'giopic',
    )

    switch (level) {
      case LogLevel.Debug:
        console.log(formattedMessage)
        break
      case LogLevel.Info:
        console.log(formattedMessage)
        break
      case LogLevel.Warn:
        console.warn(formattedMessage)
        break
      case LogLevel.Error:
        console.error(formattedMessage)
        break
    }
  }

  // 返回日志器实例
  return {
    debug: (...args) => log(LogLevel.Debug, 'DEBUG', ...args),
    info: (...args) => log(LogLevel.Info, 'INFO', ...args),
    warn: (...args) => log(LogLevel.Warn, 'WARN', ...args),
    error: (...args) => log(LogLevel.Error, 'ERROR', ...args),
    setLevel: (level) => {
      currentLevel = level
    },
  }
}
