import type { UploaderParams, UploaderResponse } from '@giopic/core'

export interface S3UploadParams extends UploaderParams {
  /** 区域 */
  region: string
  /** 访问密钥ID */
  accessKeyId: string
  /** 访问密钥 */
  secretAccessKey: string
  /** 存储桶名称 */
  bucketName: string
  /** 路径前缀 */
  pathPrefix?: string
  /** 服务终端节点 */
  endpoint?: string
  /** 强制使用路径样式 */
  forcePathStyle?: boolean
  /** 自定义域名 */
  customDomain?: string
  /** 权限控制列表 */
  acl?: string
  /** 是否禁用权限选择 */
  disablePermissionSelect?: boolean
}

export interface S3Uploader {
  upload: (params: S3UploadParams) => Promise<UploaderResponse>
}

export type CreateS3Uploader = () => S3Uploader
