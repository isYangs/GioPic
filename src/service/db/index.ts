import type { Database as BetterSqliteDatabase } from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { platform } from '@electron-toolkit/utils'
import Database from 'better-sqlite3'
import { app } from 'electron'
import logger from '../utils/logger'
import tables from './tables'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const root = path.join(__dirname, '../..')
let db: BetterSqliteDatabase

// 定义数据库文件路径，针对macOS系统进行适配
const DB_PATH = platform.isMacOS
  ? path.join(app.getPath('userData'), '/GPData.db')
  : path.join(path.dirname(app.getPath('exe')), '/GPData.db')

const initTables = (db: BetterSqliteDatabase) => db.exec(`${Array.from(tables.values()).join('\n')}`)

// 打开、初始化数据库
export function init(): boolean | null {
  logger.info('[db] Initializing database...')
  const databasePath = DB_PATH
  const nativeBinding = path.join(root, import.meta.env.VITE_BETTER_SQLITE3_BINDING)
  let dbFileExists = true

  try {
    db = new Database(databasePath, {
      fileMustExist: true,
      nativeBinding,
    })
    logger.info('[db] Database file exists.')
  }
  catch {
    logger.warn('[db] Database file does not exist, creating a new one.')
    db = new Database(databasePath, {
      nativeBinding,
    })
    initTables(db)
    dbFileExists = false
  }

  if (fs.existsSync(DB_PATH)) {
    logger.info('[db] Optimizing database...')
    db.exec('PRAGMA optimize;')
  }

  process.on('exit', () => {
    db.close()
    logger.info('[db] Database connection closed.')
  })

  logger.info(`[db] Database initialized; path: ${DB_PATH}`)
  return dbFileExists
}

// 获取数据库实例
export const getDB = (): BetterSqliteDatabase => db
