export function useFileExtractor() {
  // 递归获取文件夹中的所有文件
  async function extractFilesFromEntry(entry: FileSystemEntry): Promise<File[]> {
    if (entry.isFile) {
      return [await new Promise<File>((resolve, reject) => {
        (entry as FileSystemFileEntry).file(resolve, reject)
      })]
    }

    if (entry.isDirectory) {
      const dirReader = (entry as FileSystemDirectoryEntry).createReader()

      // 递归读取目录中的所有文件
      const readAllEntries = async (): Promise<FileSystemEntry[]> => {
        const allEntries: FileSystemEntry[] = []

        const readBatch = (): Promise<FileSystemEntry[]> => {
          return new Promise((resolve, reject) => {
            dirReader.readEntries(resolve, reject)
          })
        }

        let entries = await readBatch()
        while (entries.length > 0) {
          allEntries.push(...entries)
          entries = await readBatch()
        }

        return allEntries
      }

      const entries = await readAllEntries()
      const fileArrays = await Promise.all(entries.map(extractFilesFromEntry))
      return fileArrays.flat()
    }

    return []
  }

  // 从拖拽事件中提取文件
  async function extractFilesFromDragEvent(e: DragEvent): Promise<File[]> {
    const items = e.dataTransfer?.items
    if (items && items.length > 0) {
      const allFiles: File[] = []

      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry()
          if (entry) {
            const files = await extractFilesFromEntry(entry)
            allFiles.push(...files)
          }
          else {
            const file = item.getAsFile()
            if (file) {
              allFiles.push(file)
            }
          }
        }
      }

      if (allFiles.length > 0) {
        return allFiles
      }
    }

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      return Array.from(files)
    }

    return []
  }

  return {
    extractFilesFromEntry,
    extractFilesFromDragEvent,
  }
}
