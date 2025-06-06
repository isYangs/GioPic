import type { UploaderResponse } from '@giopic/core'
import type {
  S3Uploader,
  S3UploadParams,
} from './types'
import { Buffer } from 'node:buffer'
import { Readable } from 'node:stream'
import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

function wrapUrl(url: string, https?: boolean): string {
  if (!url)
    return ''
  if (!/^https?:/.test(url))
    url = `${https ? 'https' : 'http'}://${url}`
  return ensureEndWith(url, '/')
}

function ensureEndWith(str: string, end: string): string {
  return str.endsWith(end) ? str : `${str}${end}`
}

function insertSubdomain(url: string, subdomain: string): string {
  const host = new URL(url).host
  return url.replace(host, `${subdomain}.${host}`)
}

async function upload(params: S3UploadParams): Promise<UploaderResponse> {
  const {
    fileName,
    fileBuffer,
    mimetype,
    size,
    permission,
    region,
    accessKeyId,
    secretAccessKey,
    bucketName,
    pathPrefix,
    endpoint,
    forcePathStyle,
    customDomain,
    acl,
  } = params

  if (!accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('存储配置不完整，请检查 AccessKey/SecretKey/Bucket 配置')
  }

  const buffer = Buffer.from(fileBuffer)
  const fileStream = Readable.from(buffer)
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
  const s3ObjectKey = pathPrefix ? ensureEndWith(pathPrefix, '/') + fileName : fileName

  const client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    endpoint: endpoint ? wrapUrl(endpoint) : undefined,
    forcePathStyle,
  })

  const aclValue = acl || (permission ? 'public-read' : 'private')

  if (acl) {
    params.disablePermissionSelect = true
  }

  const uploadTask = new Upload({
    client,
    params: {
      Bucket: bucketName,
      Key: s3ObjectKey,
      Body: fileStream,
      ContentType: mimetype,
      ACL: aclValue as any,
    },
  })

  await uploadTask.done()

  const realEndpoint = endpoint
    ? wrapUrl(endpoint)
    : `https://s3.${region}.amazonaws.com/`

  const url = customDomain
    ? `${wrapUrl(customDomain)}${s3ObjectKey}`
    : `${insertSubdomain(realEndpoint, bucketName)}${s3ObjectKey}`

  return {
    key: uniqueId,
    name: fileName,
    size,
    mimetype,
    url,
    origin_name: fileName,
  }
}

export function createUploader(): S3Uploader {
  return {
    upload: params => upload(params),
  }
}
