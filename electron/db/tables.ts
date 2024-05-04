type Tables = 'upload_data'

const tables = new Map<Tables, string>()

tables.set('upload_data', `
  CREATE TABLE IF NOT EXISTS "upload_data" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" REAL NOT NULL,
    "url" TEXT NOT NULL
  );
`)

export default tables