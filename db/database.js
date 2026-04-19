// db/database.js
// In-memory SQLite database using sql.js (pure JavaScript — no native compilation needed).
// Data is persisted to disk as a binary file so comments survive server restarts.
//
// No sanitization happens here — raw values are inserted as-is (VULNERABLE by design).

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'xss_demo.db.bin');

let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  // Load persisted DB if it exists, otherwise create fresh
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      body        TEXT NOT NULL,
      created_at  TEXT DEFAULT (datetime('now'))
    )
  `);

  persist();
  return db;
}

// Write DB to disk so comments survive restarts
function persist() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

module.exports = { getDb, persist };
