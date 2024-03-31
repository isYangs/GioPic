type Tables = 'db_info'

const tables = new Map<Tables, string>()

tables.set('db_info', `
  CREATE TABLE "db_info" (
    "id" INTEGER NOT NULL UNIQUE,
    "field_name" TEXT,
    "field_value" TEXT,
    PRIMARY KEY("id" AUTOINCREMENT)
  );
`)

export default tables

export const DB_VERSION = '1'
