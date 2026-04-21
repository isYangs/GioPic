import fs from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { app } from 'electron'
import logger from '../utils/logger'
import { getDatabasePath } from '../utils/runtime-paths'
import { backupDatabase, runMigrations } from './migrations'
import tables from './tables'

let db: DatabaseSync

const initTables = (db: DatabaseSync) => db.exec(`${Array.from(tables.values()).join('\n')}`)

export function init(): boolean | null {
  const databasePath = getDatabasePath()
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

  logger.info(`[db] Database initialized; path: ${databasePath}`)
  return dbFileExists
}

export const getDB = (): DatabaseSync => db
