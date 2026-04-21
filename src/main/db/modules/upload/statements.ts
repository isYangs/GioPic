import type { StatementSync } from 'node:sqlite'
import { getDB } from '../../index'

export function createQueryStatement(): StatementSync {
  const db = getDB()
  return db.prepare(`SELECT * FROM "main"."upload_data" ORDER BY "time" DESC`)
}

export function createPaginatedQueryStatement(): StatementSync {
  const db = getDB()
  return db.prepare(`
    SELECT * FROM "main"."upload_data" 
    ORDER BY "time" DESC 
    LIMIT ? OFFSET ?
  `)
}

export function createCountStatement(): StatementSync {
  const db = getDB()
  return db.prepare(`SELECT COUNT(*) as count FROM "main"."upload_data"`)
}

export function createInsertStatement(): StatementSync {
  const db = getDB()
  return db.prepare(`
    INSERT INTO "main"."upload_data" ("key", "name" ,"time", "size", "mimetype", "url", "origin_name", "program_id", "program_type")
    VALUES (@key, @name, @time, @size, @mimetype, @url, @origin_name, @program_id, @program_type)
  `)
}

export function createDeleteStatement(): StatementSync {
  const db = getDB()
  return db.prepare(`
    DELETE FROM "main"."upload_data"
    WHERE "key" = ?
  `)
}

export function createQueryByKeyStatement(): StatementSync {
  const db = getDB()
  return db.prepare(`
    SELECT COUNT(*) as count FROM "main"."upload_data"
    WHERE "key" = ?
  `)
}
