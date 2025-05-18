import type { LskyOptions, ProgramDetail } from '@/types'
/**
 * 上传器返回值
 */
export interface UploaderResponse {
  /** 图片唯一密钥 */
  key: string
  /** 图片名称 */
  name: string
  /** 图片大小 */
  size: number
  /** 图片类型 */
  mimetype: string
  /** 图片url */
  url: string
  /** 图片原始名 */
  origin_name: string
}

/**
 * 兰空图床v1 API上传参数
 * @see https://example.com/api/v1/upload
 */
export interface LskyUploadParams extends LskyOptions {
  path: string
  permission?: number
  strategy_id: number
  album_id?: number
  expired_at?: string
}

/**
 * 兰空图床v1 API上传返回值
 * @see https://example.com/api/v1/upload
 */
export interface LskyUploadResponse {
  /** 图片唯一密钥 */
  key: string
  /** 图片名称 */
  name: string
  /** 图片路径名 */
  pathname: string
  /** 图片原始名 */
  origin_name: string
  /** 图片大小，单位 KB */
  size: number
  /** 图片类型 */
  mimetype: string
  /** 图片拓展名 */
  extension: string
  /** 图片 md5 值 */
  md5: string
  /** 图片 sha1 值 */
  sha1: string
  /** 链接 */
  links: {
    /** 图片访问 url */
    url: string
    /** html 格式 */
    html: string
    /** bbcode 格式 */
    bbcode: string
    /** markdown 格式 */
    markdown: string
    /** 带链接的 markdown 格式 */
    markdown_with_link: string
    /** 缩略图 url */
    thumbnail_url: string
    /** 图片删除 url */
    delete_url: string
  }
}

type S3Config = ProgramDetail['s3']

/**
 * S3 上传参数
 */
export interface S3UploadParams extends S3Config {
  path: string
  permission?: number
}
