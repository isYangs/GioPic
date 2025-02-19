import { createDeleteStatement, createInsertStatement, createQueryStatement } from './statements'

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
 */
export function insertUploadData(data: GP.DB.UploadData) {
  const insertStatement = createInsertStatement()
  insertStatement.run(data)
}

/**
 * 删除指定的上传数据
 * @param key 上传数据的key
 */
export function deleteUploadData(key: string) {
  const deleteStatement = createDeleteStatement()
  deleteStatement.run(key)
}
