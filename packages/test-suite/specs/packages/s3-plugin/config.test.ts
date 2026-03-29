import { s3SettingSchema } from '@pkg-s3/config'
import { describe, expect, it } from 'vitest'

describe('s3-plugin config', () => {
  describe('s3SettingSchema', () => {
    it('should have correct structure', () => {
      expect(s3SettingSchema).toBeDefined()
      expect(s3SettingSchema.items).toBeInstanceOf(Array)
      expect(s3SettingSchema.items.length).toBeGreaterThan(0)
    })

    it('should have required fields', () => {
      const fields = s3SettingSchema.items.map(item => item.field)
      expect(fields).toContain('accessKeyId')
      expect(fields).toContain('secretAccessKey')
      expect(fields).toContain('bucketName')
      expect(fields).toContain('region')
    })

    it('should have accessKeyId field configured correctly', () => {
      const field = s3SettingSchema.items.find(item => item.field === 'accessKeyId')
      expect(field).toBeDefined()
      expect(field?.type).toBe('text')
      expect(field?.required).toBe(true)
    })

    it('should have secretAccessKey field configured correctly', () => {
      const field = s3SettingSchema.items.find(item => item.field === 'secretAccessKey')
      expect(field).toBeDefined()
      expect(field?.type).toBe('text')
      expect(field?.required).toBe(true)
    })

    it('should have bucketName field configured correctly', () => {
      const field = s3SettingSchema.items.find(item => item.field === 'bucketName')
      expect(field).toBeDefined()
      expect(field?.type).toBe('text')
      expect(field?.required).toBe(true)
    })

    it('should have region field configured correctly', () => {
      const field = s3SettingSchema.items.find(item => item.field === 'region')
      expect(field).toBeDefined()
      expect(field?.type).toBe('text')
      expect(field?.required).toBe(true)
    })

    it('should have optional fields', () => {
      const fields = s3SettingSchema.items.map(item => item.field)
      expect(fields).toContain('pathPrefix')
      expect(fields).toContain('endpoint')
      expect(fields).toContain('customDomain')
      expect(fields).toContain('forcePathStyle')
    })

    it('should have acl field with correct options', () => {
      const aclField = s3SettingSchema.items.find(item => item.field === 'acl')
      expect(aclField).toBeDefined()
      expect(aclField?.type).toBe('select')
      expect(aclField?.options).toBeDefined()
      expect(aclField?.options?.length).toBe(6)
      expect(aclField?.options).toEqual([
        { label: 'private', value: 'private' },
        { label: 'public-read', value: 'public-read' },
        { label: 'public-read-write', value: 'public-read-write' },
        { label: 'authenticated-read', value: 'authenticated-read' },
        { label: 'bucket-owner-read', value: 'bucket-owner-read' },
        { label: 'bucket-owner-full-control', value: 'bucket-owner-full-control' },
      ])
    })

    it('should have default values', () => {
      expect(s3SettingSchema.defaultValues).toBeDefined()
      expect(s3SettingSchema.defaultValues?.accessKeyId).toBe('')
      expect(s3SettingSchema.defaultValues?.secretAccessKey).toBe('')
      expect(s3SettingSchema.defaultValues?.bucketName).toBe('')
      expect(s3SettingSchema.defaultValues?.region).toBe('')
      expect(s3SettingSchema.defaultValues?.forcePathStyle).toBe(false)
    })

    it('should have shouldDisablePermissionSelect function', () => {
      expect(s3SettingSchema.shouldDisablePermissionSelect).toBeDefined()
      expect(s3SettingSchema.shouldDisablePermissionSelect).toBeInstanceOf(Function)
    })

    it('shouldDisablePermissionSelect should return true when acl is set', () => {
      const result = s3SettingSchema.shouldDisablePermissionSelect?.({ acl: 'public-read' })
      expect(result).toBe(true)
    })

    it('shouldDisablePermissionSelect should return false when acl is empty', () => {
      const result = s3SettingSchema.shouldDisablePermissionSelect?.({ acl: '' })
      expect(result).toBe(false)
    })

    it('shouldDisablePermissionSelect should return false when acl is not set', () => {
      const result = s3SettingSchema.shouldDisablePermissionSelect?.({})
      expect(result).toBe(false)
    })

    it('shouldDisablePermissionSelect should return false when acl is whitespace', () => {
      const result = s3SettingSchema.shouldDisablePermissionSelect?.({ acl: '   ' })
      expect(result).toBe(false)
    })

    it('should have forcePathStyle as switch type', () => {
      const field = s3SettingSchema.items.find(item => item.field === 'forcePathStyle')
      expect(field).toBeDefined()
      expect(field?.type).toBe('switch')
    })
  })
})
