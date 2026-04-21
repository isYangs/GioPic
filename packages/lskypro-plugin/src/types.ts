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
    /** 图片ID */
    id: number
    /** 图片名称 */
    name: string
    /** 图片文件名 */
    filename: string
    /** 图片路径 */
    pathname: string
    /** 图片MIME类型 */
    mimetype: string
    /** 图片扩展名 */
    extension: string
    /** 图片MD5 */
    md5: string
    /** 图片SHA1 */
    sha1: string
    /** 图片宽度 */
    width: number
    /** 图片高度 */
    height: number
    /** 上传IP地址 */
    ip_address: string
    /** 图片公共URL */
    public_url: string
  }
}

export interface LskyUploader {
  upload: (params: LskyUploadParams) => Promise<UploaderResponse | UploaderResponse[]>
}

export type CreateLskyUploader = () => LskyUploader
