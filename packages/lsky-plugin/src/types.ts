import type { UploaderParams, UploaderResponse } from '@giopic/core'

export interface LskyUploadParams extends UploaderParams {
  /** API 地址 */
  api: string
  /** 访问令牌 */
  token: string
  /** 存储策略ID，支持单个或多个策略 */
  strategies?: string | number | string[] | number[]
  /** 是否使用默认权限 */
  useDefaultPermission?: boolean
  /** 默认权限值 */
  defaultPermission?: number
}

export interface LskyUploadResponse {
  /** 请求状态 */
  status: boolean
  /** 提示信息 */
  message: string
  /** 响应数据 */
  data?: {
    /** 文件唯一密钥 */
    key: string
    /** 文件名 */
    name: string
    /** 文件路径名 */
    pathname: string
    /** 文件原始名 */
    origin_name: string
    /** 文件大小 */
    size: number
    /** 文件MIME类型 */
    mimetype: string
    /** 文件扩展名 */
    extension: string
    /** MD5哈希 */
    md5: string
    /** SHA1哈希 */
    sha1: string
    /** 链接信息 */
    links: {
      /** 图片URL */
      url: string
      /** HTML标签 */
      html: string
      /** BBCode标签 */
      bbcode: string
      /** Markdown标签 */
      markdown: string
      /** 带链接的Markdown标签 */
      markdown_with_link: string
      /** 缩略图URL */
      thumbnail_url: string
      /** 删除URL */
      delete_url: string
    }
  }
}

export interface LskyUploader {
  upload: (params: LskyUploadParams) => Promise<UploaderResponse | UploaderResponse[]>
}

export type CreateLskyUploader = () => LskyUploader
