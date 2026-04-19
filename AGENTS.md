# AGENTS.md — XSS Demo Project

> This file is the canonical reference for any AI agent (Claude, Copilot, GPT, etc.) working on this codebase.
> Read this before touching any file. It describes the project purpose, architecture, file map, agent rules, and task list.

---

## 1. Project Overview

**Name:** Stored XSS Vulnerability Demo  
**Purpose:** An intentionally vulnerable blog-style web application built for cybersecurity education.  
**Goal:** Demonstrate a full Stored Cross-Site Scripting (XSS) attack lifecycle — inject, persist, execute — then apply and verify the correct fix.  
**Audience:** Students, security learners, academic labs.  
**Environment:** Local only. Never deploy to a public server.

---

## 2. Architecture

```
Browser (Victim/Attacker)
        │
        ▼
Express HTTP Server  (server.js)
        │
   ┌────┴────┐
   │ Routes  │  (/routes/comments.js)
   └────┬────┘
        │
   SQLite DB   (db/database.js → db/xss_demo.db)
```

- **Frontend:** Plain HTML + CSS + Vanilla JS (no framework)
- **Backend:** Node.js with Express
- **Database:** SQLite via `sql.js` (pure JavaScript, no native compilation needed)
- **No authentication** — this is intentional to keep the demo simple

---

## 3. File Map

```
xss-demo/
├── AGENTS.md                  ← YOU ARE HERE — read before editing anything
├── README.md                  ← Human-readable setup & demo guide
├── package.json               ← Node dependencies and npm scripts
├── server.js                  ← Express app entry point
├── db/
│   └── database.js            ← sql.js (SQLite) connection + table init
├── routes/
│   └── comments.js            ← GET /api/comments, POST /api/comments
├── public/
│   ├── index.html             ← Main blog page (vulnerable version)
│   ├── fixed.html             ← Patched blog page (safe version)
│   ├── css/
│   │   └── style.css          ← Shared styles for both pages
│   └── js/
│       ├── vulnerable.js      ← Renders comments with innerHTML (UNSAFE)
│       └── fixed.js           ← Renders comments with textContent (SAFE)
└── docs/
    └── report-template.md     ← Report structure for students
```

---

## 4. Vulnerability Map

| Layer | File | Vulnerable Line | Why It's Unsafe |
|---|---|---|---|
| Frontend | `public/js/vulnerable.js` | `div.innerHTML = comment.body` | Executes raw HTML/JS from DB |
| Backend | `routes/comments.js` | No sanitization on POST | Stores raw user input into DB |
| DB | `db/database.js` | Raw INSERT | No encoding at write time |

**Fixed in:**
| Layer | File | Fix Applied |
|---|---|---|
| Frontend | `public/js/fixed.js` | `div.textContent = comment.body` |
| Backend | `routes/comments.js` | CSP header set on all responses |

---

## 5. API Reference

### `GET /api/comments`
Returns all stored comments.

**Response:**
```json
[
  { "id": 1, "name": "Alice", "body": "Great post!", "created_at": "2024-01-01T10:00:00" },
  { "id": 2, "name": "Attacker", "body": "<script>alert('XSS')</script>", "created_at": "2024-01-01T10:01:00" }
]
```

### `POST /api/comments`
Stores a new comment. **No sanitization is applied (intentional).**

**Request body:**
```json
{ "name": "string", "body": "string" }
```

**Response:**
```json
{ "id": 3, "name": "...", "body": "..." }
```

### `DELETE /api/comments`
Clears all comments (useful for demo resets).

**Response:** `{ "deleted": 5 }`

---

## 6. Agent Rules

> Follow these rules precisely. They exist to maintain the educational integrity of the project.

### DO
- Keep the **vulnerable version** (`index.html` + `vulnerable.js`) intentionally broken — do not accidentally fix it
- Keep the **fixed version** (`fixed.html` + `fixed.js`) strictly safe — `textContent` only, CSP header present
- Comment every unsafe line with `// VULNERABLE: <reason>` so students can find them
- Comment every fixed line with `// FIXED: <reason>` in the patched files
- Keep the code simple — no React, no TypeScript, no build tools — students must be able to read it
- Maintain the separation between `index.html` (vulnerable) and `fixed.html` (patched)
- Always return JSON from the API with `Content-Type: application/json`

### DO NOT
- Do not add input sanitization to `routes/comments.js` — it would break the demo
- Do not change `innerHTML` to `textContent` in `vulnerable.js` — it would break the demo
- Do not add authentication or sessions — keep it minimal
- Do not deploy to any public URL
- Do not add external CDN dependencies without noting them in this file
- Do not change the database schema without updating the File Map in this doc

---

## 7. Key Concepts (for agent context)

**Stored XSS (Persistent XSS):**
The attacker's script is saved to the server's database. Every user who loads the page fetches and renders the script, causing it to execute in their browser — without any further action from the attacker.

**Why `innerHTML` is the root cause:**
```js
// This executes any HTML/JS in the string:
element.innerHTML = "<script>alert(1)</script>"; // script runs

// This treats the string as plain text — safe:
element.textContent = "<script>alert(1)</script>"; // displays as text
```

**Content Security Policy (CSP):**
An HTTP response header that tells the browser which scripts are allowed to run. Example:
```
Content-Security-Policy: default-src 'self'; script-src 'self'
```
This blocks inline scripts injected via XSS even if `innerHTML` is misused.

**OWASP Reference:** https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

---

## 8. Running the Project

```bash
# Install dependencies
npm install

# Start the server
npm start

# Access vulnerable version
open http://localhost:3000

# Access fixed version
open http://localhost:3000/fixed.html

# Reset all comments (for demo)
curl -X DELETE http://localhost:3000/api/comments
```

---

## 9. Task List for Agents

If you are an agent assigned to extend this project, here are approved tasks:

| Task | File(s) to edit | Notes |
|---|---|---|
| Add a `/api/comments/:id` DELETE route | `routes/comments.js` | Keep it simple |
| Add a "Reset comments" button to the UI | `public/index.html`, `public/fixed.html` | Call `DELETE /api/comments` |
| Add a second XSS payload example (cookie theft) | `docs/report-template.md` | Document only, do not execute against real sites |
| Add syntax highlighting to the code snippets | `docs/report-template.md` | Markdown code fences only |
| Add a comparison view (vulnerable vs fixed side by side) | New file: `public/compare.html` | Use iframe or split layout |

---

## 10. Out of Scope

Do not implement these — they go against the project's educational simplicity:

- User authentication or sessions
- Image uploads
- Rate limiting
- External API calls
- Deployment pipelines (CI/CD, Docker)
- React/Vue/Angular frontend
- TypeScript

---

*Last updated by: Claude Sonnet 4.6*  
*Maintained for: Academic cybersecurity lab use*
