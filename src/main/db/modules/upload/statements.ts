import type { Statement } from 'better-sqlite3'
import { getDB } from '../../index'

/**
 * 创建上传数据的查询语句
 * @returns 查询语句
 */
export function createQueryStatement(): Statement<[]> {
  const db = getDB()
  return db.prepare<[]>(`SELECT * FROM "main"."upload_data" ORDER BY "time" DESC`)
}

/**
 * 创建分页查询语句
 * @returns 分页查询语句
 */
export function createPaginatedQueryStatement(): Statement<[number, number]> {
  const db = getDB()
  return db.prepare<[number, number]>(`
    SELECT * FROM "main"."upload_data" 
    ORDER BY "time" DESC 
    LIMIT ? OFFSET ?
  `)
}

/**
 * 创建计数查询语句
 * @returns 计数查询语句
 */
export function createCountStatement(): Statement<[]> {
  const db = getDB()
  return db.prepare<[]>(`SELECT COUNT(*) as count FROM "main"."upload_data"`)
}

/**
 * 创建上传数据的插入语句
 * @returns 插入语句
 */
export function createInsertStatement(): Statement<[GP.DB.UploadData]> {
  const db = getDB()
  return db.prepare<[GP.DB.UploadData]>(`
    INSERT INTO "main"."upload_data" ("key", "name" ,"time", "size", "mimetype", "url", "origin_name", "program_id", "program_type")
    VALUES (@key, @name, @time, @size, @mimetype, @url, @origin_name, @program_id, @program_type)
  `)
}

/**
 * 创建上传数据的删除语句
 * @returns 删除语句
 */
export function createDeleteStatement(): Statement<[string]> {
  const db = getDB()
  return db.prepare<[string]>(`
    DELETE FROM "main"."upload_data"
    WHERE "key" = ?
  `)
}

/**
 * 创建查询特定key的语句
 * @returns 查询语句
 */
export function createQueryByKeyStatement(): Statement<[string]> {
  const db = getDB()
  return db.prepare<[string]>(`
    SELECT COUNT(*) as count FROM "main"."upload_data"
    WHERE "key" = ?
  `)
}
