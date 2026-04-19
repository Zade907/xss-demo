// routes/comments.js
// Handles all comment API endpoints.
//
// VULNERABLE: No input sanitization is performed on POST.
// The raw user-supplied string is inserted directly into the database.
// This is intentional for the XSS demo.

const express = require('express');
const router = express.Router();
const { getDb, persist } = require('../db/database');

// Helper: run a query and return all rows as plain objects
function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  const results = [];
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper: run a write statement, return last inserted rowid
function run(db, sql, params = []) {
  db.run(sql, params);
  const [{ id }] = queryAll(db, 'SELECT last_insert_rowid() as id');
  return id;
}

// GET /api/comments — return all comments (newest first)
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const comments = queryAll(
      db,
      'SELECT id, name, body, created_at FROM comments ORDER BY id DESC'
    );
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/comments — store a new comment
// VULNERABLE: body is stored raw — no escaping, no sanitization, no validation beyond presence check
router.post('/', async (req, res) => {
  try {
    const { name, body } = req.body;

    if (!name || !body) {
      return res.status(400).json({ error: 'name and body are required' });
    }

    const db = await getDb();

    // VULNERABLE: raw INSERT — script tags will be stored as-is
    const id = run(
      db,
      'INSERT INTO comments (name, body) VALUES (?, ?)',
      [name.trim(), body]  // body is NOT escaped
    );

    persist();

    const [newComment] = queryAll(db, 'SELECT * FROM comments WHERE id = ?', [id]);
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/comments — reset all comments (useful for demo resets)
router.delete('/', async (req, res) => {
  try {
    const db = await getDb();
    db.run('DELETE FROM comments');
    persist();
    res.json({ deleted: true, message: 'All comments cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
