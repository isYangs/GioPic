import type { SettingSchema } from '@giopic/core'

export const s3SettingSchema: SettingSchema = {
  items: [
    {
      field: 'accessKeyId',
      label: 'accessKeyId',
      description: '服务商访问密钥 ID',
      type: 'text',
      placeholder: 'AKIAIOSFODNN7EXAMPLE',
      required: true,
    },
    {
      field: 'secretAccessKey',
      label: 'secretAccessKey',
      description: '服务商访问密钥',
      type: 'text',
      placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      required: true,
    },
    {
      field: 'bucketName',
      label: 'bucketName',
      description: '存储桶名称',
      type: 'text',
      placeholder: 'my-bucket-name',
      required: true,
    },
    {
      field: 'pathPrefix',
      label: 'pathPrefix',
      description: '文件上传路径',
      type: 'text',
      placeholder: 'images/ 或 uploads/images/',
    },
    {
      field: 'region',
      label: 'region',
      description: '服务商所提供的 S3 区域',
      type: 'text',
      placeholder: 'us-east-1',
      required: true,
    },
    {
      field: 'endpoint',
      label: 'endpoint',
      description: '服务商所提供的 S3 服务地址',
      type: 'text',
      placeholder: 's3.amazonaws.com',
    },
    {
      field: 'customDomain',
      label: 'customDomain',
      description: '自定义域名',
      type: 'text',
      placeholder: 'cdn.example.com',
    },
    {
      field: 'forcePathStyle',
      label: 'forcePathStyle',
      description: '仅支持 AWS S3',
      type: 'switch',
    },
    {
      field: 'acl',
      label: 'ACL',
      description: '访问控制列表，若此处设置后上传页面的权限选择将会被禁用',
      type: 'select',
      placeholder: '请选择访问控制级别',
      options: [
        { label: 'private', value: 'private' },
        { label: 'public-read', value: 'public-read' },
        { label: 'public-read-write', value: 'public-read-write' },
        { label: 'authenticated-read', value: 'authenticated-read' },
        { label: 'bucket-owner-read', value: 'bucket-owner-read' },
        { label: 'bucket-owner-full-control', value: 'bucket-owner-full-control' },
      ],
    },
  ],
  defaultValues: {
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: '',
    pathPrefix: '',
    region: '',
    endpoint: '',
    customDomain: '',
    forcePathStyle: false,
    acl: '',
  },
  shouldDisablePermissionSelect: (config: Record<string, any>) => {
    return Boolean(config.acl && config.acl.trim() !== '')
  },
}
