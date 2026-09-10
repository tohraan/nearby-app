/**
 * db.js — SQLite database setup and schema
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let dbPath = join(__dirname, 'nearby.sqlite');
if (process.env.VERCEL) {
  dbPath = '/tmp/nearby.sqlite';
}

let db;
try {
  db = new Database(dbPath);
} catch (err) {
  console.warn('Fallback opening SQLite at /tmp/nearby.sqlite due to:', err.message);
  db = new Database('/tmp/nearby.sqlite');
}

// Enable WAL mode for better concurrent reads
try {
  db.pragma('journal_mode = WAL');
} catch (e) {
  // Ignored in serverless environments
}

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS places (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    sub_category TEXT,
    lat REAL,
    lng REAL,
    rating REAL,
    review_count INTEGER,
    address TEXT,
    price_info TEXT,
    photos TEXT,
    opening_hours TEXT,
    city TEXT,
    tags TEXT,
    last_refreshed_at DATETIME DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS saves (
    device_id TEXT NOT NULL,
    place_id TEXT NOT NULL,
    saved_at DATETIME DEFAULT (datetime('now')),
    PRIMARY KEY (device_id, place_id)
  );

  CREATE TABLE IF NOT EXISTS activity_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    place_id TEXT NOT NULL,
    lat REAL,
    lng REAL,
    created_at DATETIME DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_events(created_at);

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    place_id TEXT,
    creator_device_id TEXT NOT NULL,
    description TEXT DEFAULT '',
    starts_at DATETIME,
    category TEXT DEFAULT 'outdoor',
    activity_type TEXT DEFAULT '',
    lat REAL,
    lng REAL,
    max_people INTEGER DEFAULT 0,
    cost REAL DEFAULT 0,
    image TEXT DEFAULT '',
    created_at DATETIME DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS group_members (
    group_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    display_name TEXT DEFAULT 'Anonymous',
    joined_at DATETIME DEFAULT (datetime('now')),
    PRIMARY KEY (group_id, device_id),
    FOREIGN KEY (group_id) REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS group_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS user_profiles (
    device_id TEXT PRIMARY KEY,
    display_name TEXT DEFAULT '',
    interests TEXT DEFAULT '[]',
    area TEXT DEFAULT ''
  );
`);

export default db;
