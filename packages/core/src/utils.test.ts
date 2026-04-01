import {
  deepMerge,
  extractErrorMessage,
  safeJsonParse,
  safeJsonStringify,
  sleep,
} from '@pkg-core/utils'
import { describe, expect, it } from 'vitest'

describe('utils', () => {
  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"name":"test"}', {})
      expect(result).toEqual({ name: 'test' })
    })

    it('should return default value for invalid JSON', () => {
      const defaultValue = { default: true }
      const result = safeJsonParse('invalid json', defaultValue)
      expect(result).toBe(defaultValue)
    })

    it('should parse array JSON', () => {
      const result = safeJsonParse('[1,2,3]', [])
      expect(result).toEqual([1, 2, 3])
    })

    it('should return default value for empty string', () => {
      const result = safeJsonParse('', null)
      expect(result).toBe(null)
    })
  })

  describe('safeJsonStringify', () => {
    it('should stringify valid object', () => {
      const result = safeJsonStringify({ name: 'test' })
      expect(result).toBe('{"name":"test"}')
    })

    it('should stringify array', () => {
      const result = safeJsonStringify([1, 2, 3])
      expect(result).toBe('[1,2,3]')
    })

    it('should return default value for circular reference', () => {
      const obj: any = { name: 'test' }
      obj.self = obj
      const result = safeJsonStringify(obj, '{}')
      expect(result).toBe('{}')
    })

    it('should handle null and undefined', () => {
      expect(safeJsonStringify(null)).toBe('null')
      expect(safeJsonStringify(undefined)).toBe('{}')
    })
  })

  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now()
      await sleep(100)
      const end = Date.now()
      expect(end - start).toBeGreaterThanOrEqual(95) // 允许5ms误差
    })

    it('should resolve promise', async () => {
      const result = await sleep(10)
      expect(result).toBeUndefined()
    })
  })

  describe('deepMerge', () => {
    it('should merge two objects', () => {
      const target = { a: 1, b: 2 }
      const source = { b: 3, c: 4 }
      const result = deepMerge(target, source)
      expect(result).toEqual({ a: 1, b: 3, c: 4 })
    })

    it('should merge nested objects', () => {
      const target = { a: { x: 1, y: 2 }, b: 2 }
      const source = { a: { y: 3, z: 4 }, c: 5 }
      const result = deepMerge(target, source)
      expect(result).toEqual({
        a: { x: 1, y: 3, z: 4 },
        b: 2,
        c: 5,
      })
    })

    it('should not merge arrays', () => {
      const target = { arr: [1, 2] }
      const source = { arr: [3, 4] }
      const result = deepMerge(target, source)
      expect(result).toEqual({ arr: [3, 4] })
    })

    it('should handle null source', () => {
      const target = { a: 1 }
      const result = deepMerge(target, null as any)
      expect(result).toEqual({ a: 1 })
    })

    it('should not mutate target object', () => {
      const target = { a: 1, b: { x: 1 } }
      const source = { b: { y: 2 }, c: 3 }
      const result = deepMerge(target, source)
      expect(target).toEqual({ a: 1, b: { x: 1 } })
      expect(result).not.toBe(target)
    })
  })

  describe('extractErrorMessage', () => {
    it('should extract message from Error object', () => {
      const error = new Error('Test error')
      expect(extractErrorMessage(error)).toBe('Test error')
    })

    it('should return string error directly', () => {
      expect(extractErrorMessage('String error')).toBe('String error')
    })

    it('should convert number to string', () => {
      expect(extractErrorMessage(404)).toBe('404')
    })

    it('should handle null', () => {
      expect(extractErrorMessage(null)).toBe('null')
    })

    it('should handle undefined', () => {
      expect(extractErrorMessage(undefined)).toBe('undefined')
    })

    it('should handle object', () => {
      const obj = { message: 'test' }
      const result = extractErrorMessage(obj)
      expect(result).toContain('object')
    })

    it('should handle TypeError', () => {
      const error = new TypeError('Type error message')
      expect(extractErrorMessage(error)).toBe('Type error message')
    })
  })
})
