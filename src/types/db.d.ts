declare namespace GP {
  namespace DB {
    interface UploadData {
      key: string
      name: string
      time: string
      size: number
      mimetype: string
      url: string
      origin_name: string
      program_id?: number
      program_type?: string
    }
  }
}
