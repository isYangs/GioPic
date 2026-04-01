import { Upload } from '@aws-sdk/lib-storage'
import { createUploader } from '@pkg-s3/uploader'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { S3ClientMock, UploadMock } = vi.hoisted(() => ({
  S3ClientMock: vi.fn(function (this: any) {
    this.send = vi.fn()
  }),
  UploadMock: vi.fn(function (this: any, options: any) {
    this.params = options.params
    this.done = vi.fn().mockResolvedValue({
      Bucket: 'test-bucket',
      Key: 'test.jpg',
      Location: 'https://test-bucket.s3.amazonaws.com/test.jpg',
    })
  }),
}))

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: S3ClientMock,
}))

vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: UploadMock,
}))

describe('s3-plugin uploader', () => {
  const mockFileBuffer = Array.from({ length: 1024 }, () => 0)
  const mockBase64Data = 'data:image/jpeg;base64,ZmFrZQ=='

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createUploader', () => {
    it('should create uploader with upload method', () => {
      const uploader = createUploader()
      expect(uploader).toBeDefined()
      expect(uploader.upload).toBeInstanceOf(Function)
    })
  })

  describe('upload', () => {
    it('should upload file successfully', async () => {
      const uploader = createUploader()
      const result = await uploader.upload({
        fileName: 'test.jpg',
        fileBuffer: mockFileBuffer,
        base64Data: mockBase64Data,
        mimetype: 'image/jpeg',
        size: 1024,
        region: 'us-east-1',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        bucketName: 'test-bucket',
      })

      expect(result).toBeDefined()
      expect(result.url).toBeDefined()
      expect(result.name).toBe('test.jpg')
      expect(result.size).toBe(1024)
      expect(result.mimetype).toBe('image/jpeg')
    })

    it('should throw error when required config is missing', async () => {
      const uploader = createUploader()

      await expect(
        uploader.upload({
          fileName: 'test.jpg',
          fileBuffer: mockFileBuffer,
          base64Data: mockBase64Data,
          mimetype: 'image/jpeg',
          size: 1024,
          region: 'us-east-1',
          accessKeyId: '',
          secretAccessKey: '',
          bucketName: '',
        }),
      ).rejects.toThrow('存储配置不完整')
    })

    it('should use path prefix when provided', async () => {
      const uploader = createUploader()
      await uploader.upload({
        fileName: 'test.jpg',
        fileBuffer: mockFileBuffer,
        base64Data: mockBase64Data,
        mimetype: 'image/jpeg',
        size: 1024,
        region: 'us-east-1',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        bucketName: 'test-bucket',
        pathPrefix: 'images',
      })

      expect(Upload).toHaveBeenCalled()
      const uploadParams = vi.mocked(Upload).mock.calls[0][0].params
      expect(uploadParams.Key).toContain('images/')
    })

    it('should use custom domain when provided', async () => {
      const uploader = createUploader()
      const result = await uploader.upload({
        fileName: 'test.jpg',
        fileBuffer: mockFileBuffer,
        base64Data: mockBase64Data,
        mimetype: 'image/jpeg',
        size: 1024,
        region: 'us-east-1',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        bucketName: 'test-bucket',
        customDomain: 'cdn.example.com',
      })

      expect(result.url).toContain('cdn.example.com')
    })

    it('should use custom endpoint when provided', async () => {
      const uploader = createUploader()
      await uploader.upload({
        fileName: 'test.jpg',
        fileBuffer: mockFileBuffer,
        base64Data: mockBase64Data,
        mimetype: 'image/jpeg',
        size: 1024,
        region: 'us-east-1',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        bucketName: 'test-bucket',
        endpoint: 's3.custom.com',
      })

      expect(Upload).toHaveBeenCalled()
    })

    it('should use acl when provided', async () => {
      const uploader = createUploader()
      await uploader.upload({
        fileName: 'test.jpg',
        fileBuffer: mockFileBuffer,
        base64Data: mockBase64Data,
        mimetype: 'image/jpeg',
        size: 1024,
        region: 'us-east-1',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        bucketName: 'test-bucket',
        acl: 'public-read',
      })

      const uploadParams = vi.mocked(Upload).mock.calls[0][0].params
      expect(uploadParams.ACL).toBe('public-read')
    })

    it('should use permission to set acl when acl not provided', async () => {
      const uploader = createUploader()
      await uploader.upload({
        fileName: 'test.jpg',
        fileBuffer: mockFileBuffer,
        base64Data: mockBase64Data,
        mimetype: 'image/jpeg',
        size: 1024,
        region: 'us-east-1',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        bucketName: 'test-bucket',
        permission: 1,
      })

      const uploadParams = vi.mocked(Upload).mock.calls[0][0].params
      expect(uploadParams.ACL).toBe('public-read')
    })

    it('should default to private acl when neither acl nor permission provided', async () => {
      const uploader = createUploader()
      await uploader.upload({
        fileName: 'test.jpg',
        fileBuffer: mockFileBuffer,
        base64Data: mockBase64Data,
        mimetype: 'image/jpeg',
        size: 1024,
        region: 'us-east-1',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        bucketName: 'test-bucket',
      })

      const uploadParams = vi.mocked(Upload).mock.calls[0][0].params
      expect(uploadParams.ACL).toBe('private')
    })

    it('should set disablePermissionSelect when acl is provided', async () => {
      const uploader = createUploader()
      const params: any = {
        fileName: 'test.jpg',
        fileBuffer: mockFileBuffer,
        base64Data: mockBase64Data,
        mimetype: 'image/jpeg',
        size: 1024,
        region: 'us-east-1',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        bucketName: 'test-bucket',
        acl: 'public-read',
      }

      await uploader.upload(params)

      expect(params.disablePermissionSelect).toBe(true)
    })

    it('should use forcePathStyle when provided', async () => {
      const uploader = createUploader()
      await uploader.upload({
        fileName: 'test.jpg',
        fileBuffer: mockFileBuffer,
        base64Data: mockBase64Data,
        mimetype: 'image/jpeg',
        size: 1024,
        region: 'us-east-1',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        bucketName: 'test-bucket',
        forcePathStyle: true,
      })

      expect(Upload).toHaveBeenCalled()
    })
  })
})
