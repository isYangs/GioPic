import * as Lsky from './lsky'
import * as S3 from './s3'

export const uploaders = {
  lsky: Lsky,
  s3: S3,
}

export type SupportedUploader = keyof typeof uploaders
