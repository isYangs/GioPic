import { createInsertStatement } from './statements'

/**
 * 插入上传数据
 * @param data 上传数据对象
 */

export function insertUploadData(data: GP.DB.UplaodData) {
  const insertStatement = createInsertStatement()
  insertStatement.run(data)
}
