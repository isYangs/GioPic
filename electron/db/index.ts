import * as fs from 'node:fs'
import * as path from 'node:path'
import Database from 'better-sqlite3'
import { app } from 'electron'
import tables from './tables'

const root = path.join(__dirname, '..')
let db: Database.Database

// 定义数据库文件路径，针对macOS系统进行适配
const DB_PATH = process.platform === 'darwin'
  ? path.join(app.getPath('userData'), '/GPData.db') // 对于macOS，将数据库存放在用户数据目录下
  : path.join(path.dirname(app.getPath('exe')), '/GPData.db') // 对于其他平台，将数据库存放在应用程序目录下

const initTables = (db: Database.Database) => db.exec(`${Array.from(tables.values()).join('\n')}`)

// 打开、初始化数据库
export function init(): boolean | null {
  const databasePath = DB_PATH
  const nativeBinding = path.join(root, import.meta.env.VITE_BETTER_SQLITE3_BINDING)
  let dbFileExists = true

  try {
    db = new Database(databasePath, {
      fileMustExist: true,
      nativeBinding,
    })
  }
  catch (error) {
    db = new Database(databasePath, {
      nativeBinding,
    })
    initTables(db)
    dbFileExists = false
  }

  if (fs.existsSync(DB_PATH))
    db.exec('PRAGMA optimize;')

  process.on('exit', () => db.close())
  console.log('数据库初始化成功')
  return dbFileExists
}

// 获取数据库实例
export const getDB = (): Database.Database => db
