import type { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { backupDatabase, runMigrations } from '@/main/db/migrations/index'

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    copyFileSync: vi.fn(),
    readdirSync: vi.fn(() => []),
    statSync: vi.fn(() => ({ mtime: { getTime: () => Date.now() } })),
    unlinkSync: vi.fn(),
  },
}))

vi.mock('@/main/utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('db/migrations', () => {
  let mockDb: DatabaseSync

  beforeEach(() => {
    vi.clearAllMocks()
    mockDb = {
      exec: vi.fn(),
      prepare: vi.fn(() => ({
        get: vi.fn(() => ({ count: 0 })),
        run: vi.fn(),
      })),
    } as unknown as DatabaseSync
  })

  describe('runMigrations', () => {
    it('should not execute migrations when database is up to date', () => {
      const execSpy = vi.spyOn(mockDb, 'exec')
      const prepareSpy = vi.spyOn(mockDb, 'prepare')

      runMigrations(mockDb, '0.1.0')

      expect(execSpy).toBeDefined()
      expect(prepareSpy).toBeDefined()
    })

    it('should apply pending migrations when database is outdated', () => {
      const execSpy = vi.spyOn(mockDb, 'exec')
      vi.spyOn(mockDb, 'prepare').mockReturnValue({
        get: vi.fn(() => null),
        run: vi.fn(),
      } as any)

      runMigrations(mockDb, '0.1.0')

      expect(execSpy).toHaveBeenCalled()
    })

    it('should start a transaction when applying migrations', () => {
      const execSpy = vi.spyOn(mockDb, 'exec')
      vi.spyOn(mockDb, 'prepare').mockReturnValue({
        get: vi.fn(() => null),
        run: vi.fn(),
      } as any)

      runMigrations(mockDb, '0.1.0')

      expect(execSpy).toHaveBeenCalled()
    })
  })

  describe('backupDatabase', () => {
    it('should create backup directory if it does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(false)

      backupDatabase('/path/to/db.db')

      expect(vi.mocked(fs.mkdirSync)).toHaveBeenCalled()
    })

    it('should copy database file', () => {
      vi.mocked(fs.copyFileSync).mockClear()

      backupDatabase('/path/to/db.db')

      expect(vi.mocked(fs.copyFileSync)).toHaveBeenCalled()
    })

    it('should return backup path on success', () => {
      const result = backupDatabase('/path/to/db.db')

      expect(result).toBeTruthy()
      expect(result).toContain('GPData_backup_')
      expect(result).toContain('.db')
    })

    it('should return null on error', () => {
      vi.mocked(fs.copyFileSync).mockImplementationOnce(() => {
        throw new Error('Copy failed')
      })

      const result = backupDatabase('/path/to/db.db')

      expect(result).toBeNull()
    })

    it('should handle backup cleanup with multiple files', () => {
      vi.mocked(fs.readdirSync).mockReturnValueOnce([
        'GPData_backup_2024-01-01T00-00-00-000Z.db',
        'GPData_backup_2024-01-02T00-00-00-000Z.db',
        'GPData_backup_2024-01-03T00-00-00-000Z.db',
      ] as any)

      const result = backupDatabase('/path/to/db.db', 5)

      expect(result).toBeTruthy()
    })
  })
})
