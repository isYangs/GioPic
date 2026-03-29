import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteUploadData,
  getUploadDataCount,
  insertUploadData,
  queryUploadData,
  queryUploadDataPaginated,
} from '@/main/db/modules/upload/index'

const mockAll = vi.fn(() => [])
const mockGet = vi.fn(() => ({ count: 0 }))
const mockRun = vi.fn()

vi.mock('@/main/db/modules/upload/statements', () => ({
  createQueryStatement: vi.fn(() => ({ all: mockAll })),
  createPaginatedQueryStatement: vi.fn(() => ({ all: mockAll })),
  createCountStatement: vi.fn(() => ({ get: mockGet })),
  createInsertStatement: vi.fn(() => ({ run: mockRun })),
  createDeleteStatement: vi.fn(() => ({ run: mockRun })),
  createQueryByKeyStatement: vi.fn(() => ({ get: mockGet })),
}))

describe('db/modules/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAll.mockReturnValue([])
    mockGet.mockReturnValue({ count: 0 })
    mockRun.mockClear()
  })

  describe('queryUploadData', () => {
    it('should return all records', () => {
      const mockData = [
        { key: '1', name: 'test1' },
        { key: '2', name: 'test2' },
      ]
      mockAll.mockReturnValue(mockData)

      const result = queryUploadData()

      expect(mockAll).toHaveBeenCalled()
      expect(result).toEqual(mockData)
    })

    it('should return empty array when no records exist', () => {
      mockAll.mockReturnValue([])

      const result = queryUploadData()

      expect(result).toEqual([])
    })
  })

  describe('queryUploadDataPaginated', () => {
    it('should use offset=0 for page=1', () => {
      mockAll.mockReturnValue([])

      queryUploadDataPaginated(1, 20)

      expect(mockAll).toHaveBeenCalledWith(20, 0)
    })

    it('should use offset=10 for page=2 with pageSize=10', () => {
      mockAll.mockReturnValue([])

      queryUploadDataPaginated(2, 10)

      expect(mockAll).toHaveBeenCalledWith(10, 10)
    })

    it('should use default pageSize of 20', () => {
      mockAll.mockReturnValue([])

      queryUploadDataPaginated(1)

      expect(mockAll).toHaveBeenCalledWith(20, 0)
    })

    it('should calculate correct offset for page=3, pageSize=15', () => {
      mockAll.mockReturnValue([])

      queryUploadDataPaginated(3, 15)

      expect(mockAll).toHaveBeenCalledWith(15, 30)
    })
  })

  describe('getUploadDataCount', () => {
    it('should return count from database', () => {
      mockGet.mockReturnValue({ count: 42 })

      const result = getUploadDataCount()

      expect(result).toBe(42)
      expect(mockGet).toHaveBeenCalled()
    })

    it('should return 0 when database is empty', () => {
      mockGet.mockReturnValue({ count: 0 })

      const result = getUploadDataCount()

      expect(result).toBe(0)
    })
  })

  describe('insertUploadData', () => {
    it('should return true for new data when count=0', () => {
      mockGet.mockReturnValue({ count: 0 })
      mockRun.mockClear()

      const result = insertUploadData({
        key: 'new-key',
        name: 'test',
        time: '2024-01-01',
        mimetype: 'image/png',
        size: 1024,
        url: 'http://example.com/image.png',
        origin_name: 'image.png',
        program_id: 1,
        program_type: 'test',
      })

      expect(result).toBe(true)
      expect(mockRun).toHaveBeenCalled()
    })

    it('should return false for existing data when count>0', () => {
      mockGet.mockReturnValue({ count: 1 })
      mockRun.mockClear()

      const result = insertUploadData({
        key: 'existing-key',
        name: 'test',
        time: '2024-01-01',
        mimetype: 'image/png',
        size: 1024,
        url: 'http://example.com/image.png',
        origin_name: 'image.png',
        program_id: 1,
        program_type: 'test',
      })

      expect(result).toBe(false)
      expect(mockRun).not.toHaveBeenCalled()
    })

    it('should pass data object to insert statement run method', () => {
      mockGet.mockReturnValue({ count: 0 })
      const testData = {
        key: 'test-key',
        name: 'test-name',
        time: '2024-01-01',
        mimetype: 'image/jpeg',
        size: 2048,
        url: 'http://example.com/test.jpg',
        origin_name: 'test.jpg',
        program_id: 2,
        program_type: 'custom',
      }

      insertUploadData(testData)

      expect(mockRun).toHaveBeenCalledWith(testData)
    })
  })

  describe('deleteUploadData', () => {
    it('should call delete statement with key', () => {
      deleteUploadData('test-key')

      expect(mockRun).toHaveBeenCalledWith('test-key')
    })

    it('should work with various key formats', () => {
      const testKeys = ['key-1', 'uuid-1234-5678', 'simple']

      for (const key of testKeys) {
        mockRun.mockClear()
        deleteUploadData(key)
        expect(mockRun).toHaveBeenCalledWith(key)
      }
    })
  })
})
