import { createDeleteStatement, createInsertStatement, createQueryByKeyStatement, createQueryStatement } from './statements'

/**
 * 查询上传数据
 */
export function queryUploadData() {
  const queryStatement = createQueryStatement()
  return queryStatement.all() as GP.DB.UploadData[]
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
  insertStatement.run(data)
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
