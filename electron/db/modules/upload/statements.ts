import { getDB } from '../../index'

/**
 * 创建上传数据的插入语句
 * @returns 插入语句
 */
export function createInsertStatement() {
  const db = getDB()
  return db.prepare<[GP.DB.UplaodData]>(`
    INSERT INTO "main"."upload_data" ("key", "time", "size", "mimetype", "url")
    VALUES (@key, @time, @size, @mimetype, @url)
  `)
}
