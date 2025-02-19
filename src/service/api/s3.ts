import type { ProgramDetail } from '@/types/common'
import { type ObjectCannedACL, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

interface S3UploadData {
  file: File
  permission?: number
}

interface UploadResult {
  key: string
  name: string
  size: number
  mimetype: string
  url: string
  origin_name: string
}

function wrapUrl(url: string, https?: boolean) {
  if (!url)
    return ''
  if (!/^https?:/.test(url))
    url = `${https ? 'https' : 'http'}://${url}`
  return ensureEndWith(url, '/')
}

function ensureEndWith(str: string, end: string) {
  return str.endsWith(end) ? str : `${str}${end}`
}

function insertSubdomain(url: string, subdomain: string) {
  const host = new URL(url).host
  return url.replace(host, `${subdomain}.${host}`)
}

export function createS3Service(config: ProgramDetail['s3']) {
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: wrapUrl(config.endpoint) || undefined,
    forcePathStyle: config.forcePathStyle,
  })
}

export function s3Uploader(client: S3Client, config: ProgramDetail['s3']) {
  const validateConfig = () => {
    const { accessKeyId, secretAccessKey, bucketName } = config
    if (!accessKeyId || !secretAccessKey || !bucketName)
      throw new Error('存储配置不完整,请检查 AccessKey/SecretKey/Bucket 配置')
  }

  const getFileUrl = (key: string) => {
    const realEndpoint = config.endpoint
      ? wrapUrl(config.endpoint)
      : `https://s3.${config.region}.amazonaws.com/`

    return config.customDomain
      ? `${wrapUrl(config.customDomain)}${key}`
      : `${insertSubdomain(realEndpoint, config.bucketName)}${key}`
  }

  return {
    uploadImage: async ({ file, permission = 1 }: S3UploadData): Promise<UploadResult> => {
      validateConfig()

      const path = config.pathPrefix
        ? ensureEndWith(config.pathPrefix, '/') + file.name
        : file.name

      const upload = new Upload({
        client,
        params: {
          Bucket: config.bucketName,
          Key: path,
          Body: file,
          ContentType: file.type,
          ACL: config.acl as ObjectCannedACL || (permission ? 'public-read' : 'private') as ObjectCannedACL,
        },
      })

      const resp = await upload.done()
      const { Key: key } = resp
      const url = getFileUrl(key!)

      return {
        key: key!,
        name: file.name,
        size: file.size,
        mimetype: file.type,
        url,
        origin_name: file.name,
      }
    },
  }
}

export type S3Service = ReturnType<typeof s3Uploader>
