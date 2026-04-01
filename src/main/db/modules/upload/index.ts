import type { SQLInputValue, SQLOutputValue } from 'node:sqlite'
import { createCountStatement, createDeleteStatement, createInsertStatement, createPaginatedQueryStatement, createQueryByKeyStatement, createQueryStatement } from './statements'

function toUploadData(row: Record<string, SQLOutputValue>): GP.DB.UploadData {
  return row as unknown as GP.DB.UploadData
}

/**
 * 查询上传数据
 */
export function queryUploadData() {
  const queryStatement = createQueryStatement()
  return queryStatement.all().map(toUploadData)
}

/**
 * 分页查询上传数据
 * @param page 页码（从1开始）
 * @param pageSize 每页数量
 */
export function queryUploadDataPaginated(page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize
  const queryStatement = createPaginatedQueryStatement()
  return queryStatement.all(pageSize, offset).map(toUploadData)
}

/**
 * 获取上传数据总数
 */
export function getUploadDataCount(): number {
  const countStatement = createCountStatement()
  const result = countStatement.get() as { count: number }
  return result.count
}

/**
 * 插入上传数据
 * @param data 上传数据对象
 * @returns 成功返回true，数据已存在返回false
 */
export function insertUploadData(data: GP.DB.UploadData): boolean {
  const queryByKeyStatement = createQueryByKeyStatement()
  const result = queryByKeyStatement.get(data.key) as { count: number }

  if (result.count > 0) {
    return false
  }

  const insertStatement = createInsertStatement()
  insertStatement.run({
    key: data.key,
    name: data.name,
    time: data.time,
    size: data.size,
    mimetype: data.mimetype,
    url: data.url,
    origin_name: data.origin_name,
    program_id: data.program_id ?? null,
    program_type: data.program_type ?? null,
  } satisfies Record<string, SQLInputValue>)
  return true
}

/**
 * 删除指定的上传数据
 * @param key 上传数据的key
 */
export function deleteUploadData(key: string) {
  const deleteStatement = createDeleteStatement()
  deleteStatement.run(key)
}
