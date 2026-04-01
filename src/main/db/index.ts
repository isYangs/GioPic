import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { platform } from '@electron-toolkit/utils'
import { app } from 'electron'
import logger from '../utils/logger'
import { backupDatabase, runMigrations } from './migrations'
import tables from './tables'

let db: DatabaseSync

const DB_PATH = platform.isMacOS
  ? path.join(app.getPath('userData'), 'GPData.db')
  : path.join(path.dirname(app.getPath('exe')), 'GPData.db')

const initTables = (db: DatabaseSync) => db.exec(`${Array.from(tables.values()).join('\n')}`)

export function init(): boolean | null {
  const databasePath = DB_PATH
  const dbFileExists = fs.existsSync(databasePath)

  if (dbFileExists) {
    backupDatabase(databasePath)
  }

  db = new DatabaseSync(databasePath)

  if (!dbFileExists) {
    logger.warn('[db] Database file does not exist, creating a new one.')
    initTables(db)
  }
  else {
    const appVersion = app.getVersion()
    try {
      runMigrations(db, appVersion)
    }
    catch (e) {
      logger.error('[db] Migration failed:', e)
    }
  }

  db.exec('PRAGMA optimize;')

  process.on('exit', () => {
    db.close()
  })

  logger.info(`[db] Database initialized; path: ${DB_PATH}`)
  return dbFileExists
}

export const getDB = (): DatabaseSync => db
