// server.js
// Express application entry point.
// Serves both the vulnerable and fixed versions of the blog.
// NOTE: No Content-Security-Policy header is set globally — this is intentional
// for the vulnerable demo. The fixed route sets its own headers.

const express = require('express');
const path = require('path');
const commentsRouter = require('./routes/comments');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/comments', commentsRouter);

// Explicit routes for clarity
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/fixed', (req, res) => {
  // FIXED: Add Content-Security-Policy header for the safe version
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
  );
  res.sendFile(path.join(__dirname, 'public', 'fixed.html'));
});

app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║        XSS Demo Server Running               ║');
  console.log('  ╠══════════════════════════════════════════════╣');
  console.log(`  ║  Vulnerable page  →  http://localhost:${PORT}    ║`);
  console.log(`  ║  Fixed page       →  http://localhost:${PORT}/fixed ║`);
  console.log('  ║                                              ║');
  console.log('  ║  FOR EDUCATIONAL USE ONLY — DO NOT DEPLOY   ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
});
