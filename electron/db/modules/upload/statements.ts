import { getDB } from '../../index'

/**
 * 创建上传数据的查询语句
 * @returns 查询语句
 */
export function createQueryStatement() {
  const db = getDB()
  return db.prepare<[]>(`SELECT * FROM "main"."upload_data"`)
}

/**
 * 创建上传数据的插入语句
 * @returns 插入语句
 */
export function createInsertStatement() {
  const db = getDB()
  return db.prepare<[GP.DB.UploadData]>(`
    INSERT INTO "main"."upload_data" ("key", "name" ,"time", "size", "mimetype", "url")
    VALUES (@key, @name, @time, @size, @mimetype, @url)
  `)
}

/**
 * 创建上传数据的删除语句
 * @returns 删除语句
 */
export function createDeleteStatement() {
  const db = getDB()
  return db.prepare<[string]>(`
    DELETE FROM "main"."upload_data"
    WHERE "key" = ?
  `)
}

/**
 * 创建上传数据的清空语句
 * @returns 清空语句
 */
export function createClearStatement() {
  const db = getDB()
  return db.prepare<[]>(`
    DELETE FROM "main"."upload_data"
  `)
}
