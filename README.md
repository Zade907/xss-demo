# XSS Demo — Stored Cross-Site Scripting Vulnerability

> **Educational use only.** This application is intentionally vulnerable. Never deploy it to a public server.

A minimal blog-style web app demonstrating a full Stored XSS attack lifecycle — from injection to execution — with a side-by-side patched version showing the correct fix.

---

## Local Setup (Clone and Run)

### Prerequisites

- Node.js 16 or newer
- npm (comes with Node.js)

### Clone and start

```bash
# 1. Clone the repository
git clone <YOUR_GITHUB_REPO_URL>

# 2. Move into the project folder
cd xss-demo

# 3. Install dependencies
npm install

# 4. Start the server
npm start

# 5. Open these URLs in your browser
# Vulnerable version: http://localhost:3000
# Fixed version:      http://localhost:3000/fixed
```

If the server starts correctly, you will see a terminal banner that includes both URLs.

---

## How to Run the Demo

### Step 1 — Inject the payload

1. Go to `http://localhost:3000`
2. Enter any name in the comment form
3. Paste this into the comment body:
   ```
   <img src=x onerror="alert('XSS Attack — your data is exposed!')">
   ```
4. Click **Post Comment**

### Step 2 — Trigger the attack

5. Reload the page
6. The browser executes the injected script → alert box appears
7. This would execute for **every user** who visits the page

### Step 3 — See the fix

8. Go to `http://localhost:3000/fixed`
9. The same stored comment appears as **plain text** — the script does not execute
10. Check DevTools → Network → Response Headers → `Content-Security-Policy` is present

### Reset for re-demo

```bash
curl -X DELETE http://localhost:3000/api/comments
```

PowerShell alternative:

```powershell
Invoke-RestMethod -Method DELETE http://localhost:3000/api/comments
```

Or click the **↺ Reset all comments** button on either page.

---

## Project Structure

```
xss-demo/
├── AGENTS.md              ← AI agent reference (read first)
├── README.md              ← This file
├── package.json
├── server.js              ← Express server
├── db/
│   └── database.js        ← SQLite setup
├── routes/
│   └── comments.js        ← API endpoints
├── public/
│   ├── index.html         ← Vulnerable blog page
│   ├── fixed.html         ← Patched blog page
│   ├── css/style.css      ← Shared styles
│   └── js/
│       ├── vulnerable.js  ← Uses innerHTML (UNSAFE)
│       └── fixed.js       ← Uses textContent (SAFE)
└── docs/
    └── report-template.md ← Student report template
```

---

## The Vulnerability — One Line

```javascript
// vulnerable.js — the root cause
div.innerHTML = comment.body; // ← executes any HTML/JS in the string

// fixed.js — the fix
div.textContent = comment.body; // ← treats content as plain text
```

---

## API

| Method   | Endpoint        | Description                     |
| -------- | --------------- | ------------------------------- |
| `GET`    | `/api/comments` | Get all comments                |
| `POST`   | `/api/comments` | Add a comment (no sanitization) |
| `DELETE` | `/api/comments` | Delete all comments             |

---

## Tech Stack

- **Node.js** + **Express** — server
- **sql.js** — SQLite database engine (pure JavaScript)
- **Vanilla HTML/CSS/JS** — frontend (no framework)

---

## Troubleshooting

### Port 3000 already in use

Stop any running Node process and start again:

```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
npm start
```

### Comments do not execute with script tags

In modern browsers, scripts inserted via dynamic HTML often do not execute. Use this payload on the vulnerable page:

```html
<img src="x" onerror="alert('XSS Attack')" />
```

### Dependency install fails

Confirm versions:

```bash
node -v
npm -v
```

Then run:

```bash
npm install
```

---

## Learning Outcomes

- Understand what Stored XSS is and how it differs from Reflected XSS
- See exactly why `innerHTML` is dangerous for user content
- Understand why `textContent` is the correct fix
- Learn how `Content-Security-Policy` adds a second layer of defence
- Reference: [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

---

_For AI agents working on this project: read `AGENTS.md` before editing any file._
