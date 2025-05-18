import type { S3UploadParams, UploaderResponse } from '@/types'
import { createReadStream, statSync } from 'node:fs'
import { basename } from 'node:path'
import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import mime from 'mime'

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

export async function upload(params: S3UploadParams): Promise<UploaderResponse> {
  const {
    path,
    region,
    accessKeyId,
    secretAccessKey,
    bucketName,
    pathPrefix,
    endpoint,
    forcePathStyle,
    customDomain,
    permission,
  } = params

  if (!accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('存储配置不完整，请检查 AccessKey/SecretKey/Bucket 配置')
  }

  const fileName = basename(path)
  const fileStream = createReadStream(path)
  const fileSize = statSync(path).size
  const mimeType = mime.getType(path) || 'application/octet-stream'
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
  const s3ObjectKey = pathPrefix ? ensureEndWith(pathPrefix, '/') + fileName : fileName

  const client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    endpoint: wrapUrl(endpoint) || undefined,
    forcePathStyle,
  })

  const aclValue = params.acl || (permission ? 'public-read' : 'private')

  const upload = new Upload({
    client,
    params: {
      Bucket: bucketName,
      Key: s3ObjectKey,
      Body: fileStream,
      ContentType: mimeType,
      ACL: aclValue as any,
    },
  })

  await upload.done()

  const realEndpoint = endpoint
    ? wrapUrl(endpoint)
    : `https://s3.${region}.amazonaws.com/`

  const url = customDomain
    ? `${wrapUrl(customDomain)}${s3ObjectKey}`
    : `${insertSubdomain(realEndpoint, bucketName)}${s3ObjectKey}`

  return {
    key: uniqueId,
    name: fileName,
    size: fileSize,
    mimetype: mimeType,
    url,
    origin_name: fileName,
  }
}
