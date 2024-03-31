import * as fs from 'node:fs'
import * as path from 'node:path'
import Database from 'better-sqlite3'
import { app } from 'electron'
import tables, { DB_VERSION } from './tables'

const root = path.join(__dirname, '..')
let db: Database.Database

// 定义数据库文件路径，针对macOS系统进行适配
let DB_PATH: string
if (process.platform === 'darwin') {
  // 对于macOS，将数据库存放在用户数据目录下
  DB_PATH = path.join(app.getPath('userData'), '/GPData.db')
}
else {
  // 对于其他平台，将数据库存放在应用程序目录下
  DB_PATH = path.join(path.dirname(app.getPath('exe')), '/GPData.db')
}

function ensureDatabaseFileExists() {
  const directory = path.dirname(DB_PATH)
  // 如果目录不存在，则创建目录
  if (!fs.existsSync(directory))
    fs.mkdirSync(directory, { recursive: true })

  // 如果文件不存在，则创建空数据库文件
  if (!fs.existsSync(DB_PATH))
    fs.closeSync(fs.openSync(DB_PATH, 'w'))
}

function initTables(db: Database.Database) {
  db.exec(`
    ${Array.from(tables.values()).join('\n')}
    INSERT INTO "main"."db_info" ("field_name", "field_value") VALUES ('version', '${DB_VERSION}');
  `)
}

// 打开、初始化数据库
export function init(): boolean | null {
  const databasePath = DB_PATH
  const nativeBinding = path.join(root, import.meta.env.VITE_BETTER_SQLITE3_BINDING)

  ensureDatabaseFileExists()

  try {
    db = new Database(databasePath, {
      fileMustExist: true,
      nativeBinding,
    })
  }
  catch (error) {
    console.error(error)
    // 尝试重新打开，此时文件应该已经创建好或者本来就存在
    db = new Database(databasePath, {
      nativeBinding,
    })
    initTables(db)
    return false
  }

  if (fs.existsSync(DB_PATH))
    db.exec('PRAGMA optimize;')

  process.on('exit', () => db.close())
  console.log('数据库初始化成功')
  return true
}

// 获取数据库实例
export const getDB = (): Database.Database => db
