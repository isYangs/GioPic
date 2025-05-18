import type { Database } from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import logger from '../../utils/logger'

export interface Migration {
  /**
   * 迁移版本号，格式如 1.0.0
   */
  version: string
  /**
   * 迁移名称
   */
  name: string
  /**
   * 迁移 SQL 或函数
   */
  up: string | ((db: Database) => void)
}

// 版本比较函数
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0

    if (part1 > part2)
      return 1
    if (part1 < part2)
      return -1
  }

  return 0
}

// 确保版本表存在
function ensureVersionTable(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "db_version" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "version" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "applied_at" TEXT NOT NULL
    );
  `)
}

// 获取当前版本信息
function getCurrentVersion(db: Database): { version: string, name: string } | null {
  ensureVersionTable(db)

  const row = db.prepare('SELECT version, name FROM db_version ORDER BY id DESC LIMIT 1').get() as { version: string, name: string } | undefined
  if (!row)
    return null

  return {
    version: row.version,
    name: row.name,
  }
}

// 获取所有迁移
function getAllMigrations(): Migration[] {
  const migrations: Migration[] = [
    {
      version: '1.0.0',
      name: 'initial',
      up: '',
    },
  ]

  return migrations.sort((a, b) => compareVersions(a.version, b.version))
}

// 记录应用的迁移
function recordMigration(db: Database, migration: Migration): void {
  db.prepare(
    'INSERT INTO db_version (version, name, applied_at) VALUES (?, ?, ?)',
  ).run(migration.version, migration.name, new Date().toISOString())

  logger.info(`[db] Applied migration: ${migration.version} - ${migration.name}`)
}

/**
 * 应用单个迁移
 */
function applyMigration(db: Database, migration: Migration): void {
  db.exec('BEGIN TRANSACTION;')

  try {
    if (typeof migration.up === 'string' && migration.up.trim()) {
      db.exec(migration.up)
    }
    else if (typeof migration.up === 'function') {
      migration.up(db)
    }

    recordMigration(db, migration)
    db.exec('COMMIT;')
  }
  catch (error) {
    db.exec('ROLLBACK;')
    logger.error(`[db] Migration failed: ${migration.version} - ${migration.name}`, error)
    throw error
  }
}

/**
 * 执行所有待处理的数据库迁移
 */
export function runMigrations(db: Database, appVersion: string): void {
  logger.info('[db] Checking for database migrations...')

  const currentDbInfo = getCurrentVersion(db)
  const currentVersion = currentDbInfo?.version || '0.0.0'

  logger.info(`[db] Current database version: ${currentVersion || 'None'}`)
  logger.info(`[db] Current app version: ${appVersion}`)

  const migrations = getAllMigrations()

  const pendingMigrations = migrations.filter(migration =>
    compareVersions(migration.version, currentVersion) > 0,
  )

  if (pendingMigrations.length === 0) {
    logger.info('[db] Database is up to date')
    return
  }

  logger.info(`[db] Found ${pendingMigrations.length} pending migrations`)

  for (const migration of pendingMigrations) {
    logger.info(`[db] Applying migration: ${migration.version} - ${migration.name}`)
    applyMigration(db, migration)
  }

  logger.info('[db] Database migration completed successfully')
}

/**
 * 数据库备份功能
 */
export function backupDatabase(dbPath: string): string | null {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups')

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-')
    const backupPath = path.join(backupDir, `GPData_backup_${timestamp}.db`)

    fs.copyFileSync(dbPath, backupPath)

    logger.info(`[db] Database backup created: ${backupPath}`)
    return backupPath
  }
  catch (error) {
    logger.error('[db] Database backup failed:', error)
    return null
  }
}
