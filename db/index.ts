import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const sqlite = openDatabaseSync('job_tracker.db');

export const db = drizzle(sqlite, { schema });

// Create categories table
sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#2563eb'
  );
`);

// Migrate applications table if it still has the old 'category' TEXT column
const cols: { name: string }[] = sqlite.getAllSync(`PRAGMA table_info(applications)`);
const hasOldColumn = cols.some((c) => c.name === 'category');

if (hasOldColumn) {
  // Drop old table — dev migration, no production data to preserve
  sqlite.execSync(`DROP TABLE IF EXISTS applications;`);
}

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Applied',
    date_applied TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    notes TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
`);

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS targets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    period      TEXT NOT NULL CHECK(period IN ('weekly', 'monthly')),
    count       INTEGER NOT NULL CHECK(count > 0),
    category_id INTEGER REFERENCES categories(id)
  );
`);

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt          TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );
`);

// Partial unique indexes — SQLite treats NULL as non-equal in standard UNIQUE,
// so two separate partial indexes are required to enforce one global target per period.
sqlite.execSync(`
  CREATE UNIQUE INDEX IF NOT EXISTS targets_global_uniq
    ON targets(period) WHERE category_id IS NULL;
`);
sqlite.execSync(`
  CREATE UNIQUE INDEX IF NOT EXISTS targets_category_uniq
    ON targets(period, category_id) WHERE category_id IS NOT NULL;
`);

