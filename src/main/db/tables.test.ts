import { describe, expect, it } from 'vitest'
import tables from '@/main/db/tables'

describe('db/tables', () => {
  it('should be a Map instance', () => {
    expect(tables).toBeInstanceOf(Map)
  })

  it('should have upload_data entry', () => {
    expect(tables.has('upload_data')).toBe(true)
  })

  describe('upload_data table schema', () => {
    const schema = tables.get('upload_data')!

    it('should contain CREATE TABLE IF NOT EXISTS', () => {
      expect(schema).toContain('CREATE TABLE IF NOT EXISTS')
    })

    it('should contain key column as PRIMARY KEY', () => {
      expect(schema).toContain('"key"')
      expect(schema).toContain('PRIMARY KEY')
    })

    it('should contain name column', () => {
      expect(schema).toContain('"name"')
    })

    it('should contain time column', () => {
      expect(schema).toContain('"time"')
    })

    it('should contain mimetype column', () => {
      expect(schema).toContain('"mimetype"')
    })

    it('should contain size column', () => {
      expect(schema).toContain('"size"')
    })

    it('should contain url column', () => {
      expect(schema).toContain('"url"')
    })

    it('should contain origin_name column', () => {
      expect(schema).toContain('"origin_name"')
    })

    it('should contain program_id column', () => {
      expect(schema).toContain('"program_id"')
    })

    it('should contain program_type column', () => {
      expect(schema).toContain('"program_type"')
    })
  })
})
