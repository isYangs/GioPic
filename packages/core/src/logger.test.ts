import { createLogger, LogLevel, setGlobalLogLevel } from '@pkg-core/logger'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('logger', () => {
  beforeEach(() => {
    // 重置全局日志级别
    setGlobalLogLevel(LogLevel.Info)
    // 清除 console 的 mock
    vi.clearAllMocks()
  })

  describe('createLogger', () => {
    it('should create logger with string name', () => {
      const logger = createLogger('test')
      expect(logger).toBeDefined()
      expect(logger.info).toBeInstanceOf(Function)
      expect(logger.debug).toBeInstanceOf(Function)
      expect(logger.warn).toBeInstanceOf(Function)
      expect(logger.error).toBeInstanceOf(Function)
    })

    it('should create logger with options', () => {
      const logger = createLogger({
        name: 'test',
        level: LogLevel.Debug,
        timestamp: false,
      })
      expect(logger).toBeDefined()
    })

    it('should log info messages', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const logger = createLogger('test')
      logger.info('test message')
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should log error messages', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const logger = createLogger('test')
      logger.error('error message')
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should log warning messages', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const logger = createLogger('test')
      logger.warn('warning message')
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should respect log level', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const logger = createLogger({
        name: 'test',
        level: LogLevel.Warn,
      })
      logger.debug('debug message')
      logger.info('info message')
      expect(consoleSpy).not.toHaveBeenCalled()
      logger.warn('warn message')
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should be able to change log level', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const logger = createLogger({
        name: 'test',
        level: LogLevel.Error,
      })
      logger.info('info message')
      expect(consoleSpy).not.toHaveBeenCalled()

      logger.setLevel(LogLevel.Info)
      logger.info('info message')
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should format message with timestamp', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const logger = createLogger({
        name: 'test',
        timestamp: true,
      })
      logger.info('test message')
      const call = consoleSpy.mock.calls[0][0]
      expect(call).toMatch(/\[.*\]/)
      expect(call).toContain('[test]')
      expect(call).toContain('test message')
      consoleSpy.mockRestore()
    })

    it('should format message without timestamp', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const logger = createLogger({
        name: 'test',
        timestamp: false,
      })
      logger.info('test message')
      const call = consoleSpy.mock.calls[0][0]
      expect(call).toContain('[test]')
      expect(call).toContain('test message')
      consoleSpy.mockRestore()
    })

    it('should use custom formatter', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const logger = createLogger({
        name: 'test',
        formatter: (level, message) => `${level}::${message}`,
      })
      logger.info('test message')
      const call = consoleSpy.mock.calls[0][0]
      expect(call).toContain('INFO::test message')
      consoleSpy.mockRestore()
    })

    it('should not log when level is Silent', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const logger = createLogger({
        name: 'test',
        level: LogLevel.Silent,
      })
      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('setGlobalLogLevel', () => {
    it('should set global log level', () => {
      setGlobalLogLevel(LogLevel.Error)
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const logger = createLogger('test')
      logger.info('test')
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})
