import fs from 'node:fs'
import path from 'node:path'

/**
 * `DataBase` 类用于处理JSON文件的读取、写入、更新和删除操作。
 */
class DataBase {
  filePath: string

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath)
  }

  read() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8')
        return JSON.parse(data)
      }
      else {
        throw new Error('File does not exist')
      }
    }
    catch (error) {
      console.error(`Error reading file: ${error}`)
      return null
    }
  }

  write(data: any) {
    try {
      const jsonData = JSON.stringify(data)
      fs.writeFileSync(this.filePath, jsonData, 'utf-8')
    }
    catch (error) {
      console.error(`Error writing file: ${error}`)
    }
  }

  update(updateFunction: (data: any) => any) {
    try {
      const data = this.read()
      if (data) {
        const updatedData = updateFunction(data)
        this.write(updatedData)
      }
    }
    catch (error) {
      console.error(`Error updating file: ${error}`)
    }
  }

  delete() {
    try {
      if (fs.existsSync(this.filePath))
        fs.unlinkSync(this.filePath)
      else
        throw new Error('File does not exist')
    }
    catch (error) {
      console.error(`Error deleting file: ${error}`)
    }
  }
}

export default DataBase
