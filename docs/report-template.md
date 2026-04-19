# XSS Vulnerability — Project Report Template

**Student Name:**  
**Date:**  
**Course / Module:**

---

## 1. Executive Summary

_Write 3–4 sentences summarising what you built, what vulnerability you demonstrated, and how you fixed it._

---

## 2. Vulnerability Description

**Type:** Stored Cross-Site Scripting (Persistent XSS)  
**CWE:** CWE-79 — Improper Neutralization of Input During Web Page Generation  
**OWASP Category:** A03:2021 – Injection  
**Severity:** High

### What is Stored XSS?

Stored XSS occurs when an attacker supplies malicious input that is:

1. Stored server-side (in a database, file, or log)
2. Later retrieved and rendered in a victim's browser without proper encoding
3. Executed as JavaScript in the victim's browser context

Unlike reflected XSS, the attacker does not need to trick each victim individually — any user who visits the affected page will trigger the payload automatically.

---

## 3. Root Cause Analysis

| Layer                        | Issue                                                       |
| ---------------------------- | ----------------------------------------------------------- |
| Frontend (vulnerable.js)     | `innerHTML` used to render comment body — executes HTML/JS  |
| Backend (routes/comments.js) | No input validation or sanitization on POST                 |
| Missing header               | No `Content-Security-Policy` header to block inline scripts |

### The vulnerable line

```javascript
// public/js/vulnerable.js — line ~35
div.innerHTML = comment.body;
//              ^^^^^^^^^^^^ raw user input injected into DOM
```

---

## 4. Attack Demonstration

### Payload used (Event-based XSS)

The most reliable Stored XSS payload for `innerHTML` injection:

```html
<img src="x" onerror="alert('XSS Attack — your data is exposed!')" />
```

**Why this payload works:**

- `innerHTML` parses the string as HTML
- The `<img>` tag is created with a broken `src` attribute
- The `onerror` event fires immediately when the image fails to load
- The JavaScript in the event handler executes in the victim's browser context

### Alternative payloads (for reference)

```html
<!-- SVG-based XSS -->
<svg onload="alert('XSS via SVG')"></svg>

<!-- Input autofocus + onfocus -->
<input onfocus="alert('XSS via autofocus')" autofocus />

<!-- Body tag with onload -->
<body onload="alert('XSS via body')">
  <!-- Inline event handler on common elements -->
  <div onclick="alert('XSS')" style="width:100%;height:100%;">Click me</div>
</body>
```

### Steps to reproduce

1. **On the vulnerable page:** `http://localhost:3000`
2. Fill the comment form:
   - **Name:** `Alice` (or any name)
   - **Comment:** `<img src=x onerror="alert('XSS Attack — your data is exposed!')">`
3. Click **Post Comment**
4. **Reload the page** (`F5` or `Cmd+R`)
5. ✅ **Alert box appears** — attack successful
6. For each visitor who loads this page, the alert will trigger

### Proof of execution

1. Open browser **DevTools** (F12)
2. Go to **Console** tab
3. The alert demonstrates that arbitrary JavaScript code is executing
4. In a real attack, the attacker could:
   - Steal cookies: `document.cookie`
   - Modify page content: `document.body.innerHTML = ...`
   - Redirect users: `window.location = ...`
   - Inject keyloggers or tracking pixels

### Screenshots

_[Insert screenshot of alert box at http://localhost:3000]_  
_[Insert screenshot of DevTools console showing the executed code]_

---

## 5. Impact Assessment

| Impact               | Description                                                                     |
| -------------------- | ------------------------------------------------------------------------------- |
| Cookie theft         | `document.cookie` accessible to the script — session tokens exposed             |
| Account hijacking    | Stolen session cookies allow impersonation of any victim                        |
| Phishing             | Page content can be rewritten to display fake login forms                       |
| Malware distribution | Attacker can redirect users to malicious sites                                  |
| Persistence          | Script executes for every user on every page load — no per-victim action needed |

---

## 6. Fix Applied

### Frontend fix — using textContent instead of innerHTML

**Before (VULNERABLE)** — `public/js/vulnerable.js`

```javascript
// VULNERABLE: innerHTML renders any HTML/JS
card.innerHTML = `
  <div class="comment-header">
    <span class="comment-name">${comment.name}</span>
  </div>
  <div class="comment-body">${comment.body}</div>
  // ↑ comment.body is executed as HTML
`;
```

**After (FIXED)** — `public/js/fixed.js`

```javascript
// FIXED: textContent treats everything as plain text
const bodyDiv = document.createElement("div");
bodyDiv.className = "comment-body";
bodyDiv.textContent = comment.body; // ← No HTML parsing
card.appendChild(bodyDiv);
```

### Backend fix — Content-Security-Policy header

**Added to** `server.js` (route `/fixed`):

```javascript
app.get("/fixed", (req, res) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
  );
  res.sendFile(path.join(__dirname, "public", "fixed.html"));
});
```

**What this does:**

- `default-src 'self'` — Only load resources from the same origin
- `script-src 'self'` — Only execute scripts from the same origin
- Blocks inline scripts and external script injection
- Provides **defense-in-depth** even if a developer accidentally uses `innerHTML`

### Server-side validation (future enhancement)

Currently, the backend stores comments with **no validation**:

```javascript
// routes/comments.js — VULNERABLE
const id = run(
  db,
  "INSERT INTO comments (name, body) VALUES (?, ?)",
  [name.trim(), body], // ← body is NOT escaped or validated
);
```

**Recommended fix** (not implemented in demo to preserve vulnerability):

```javascript
// Sanitize or validate input server-side
const sanitizedBody = DOMPurify.sanitize(body); // if HTML is needed
// OR reject HTML entirely
if (/<[^>]*>/g.test(body)) {
  return res.status(400).json({ error: "HTML not allowed" });
}
```

### Verification test cases

| Test Case                           | Vulnerable Page | Fixed Page         | Status |
| ----------------------------------- | --------------- | ------------------ | ------ |
| XSS via `<img onerror>`             | ✅ Alert fires  | ✅ Renders as text | PASS   |
| XSS via `<svg onload>`              | ✅ Alert fires  | ✅ Renders as text | PASS   |
| Cookie access via `document.cookie` | ✅ Accessible   | ✅ Blocked by CSP  | PASS   |
| Inline script execution             | ✅ Executes     | ✅ Blocked by CSP  | PASS   |

### Screenshots (after fix)

_[Insert screenshot of http://localhost:3000/fixed showing payload as plain text]_  
_[Insert DevTools → Network → Headers showing CSP header present]_

---

## 7. Defence Recommendations

| Priority     | Recommendation                                                                     |
| ------------ | ---------------------------------------------------------------------------------- |
| **Critical** | Always use `textContent` (or equivalent) when rendering user content               |
| **High**     | Set a `Content-Security-Policy` header on all responses                            |
| **High**     | Validate and reject input server-side (whitelist, length, type)                    |
| **Medium**   | Use a templating engine with auto-escaping (Jinja2, Handlebars, EJS with `<%= %>`) |
| **Medium**   | Use DOMPurify for rich-text scenarios that genuinely require HTML rendering        |
| **Low**      | Enable `HttpOnly` and `Secure` cookie flags to limit cookie theft impact           |

---

## 8. References

- OWASP XSS Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- CWE-79: https://cwe.mitre.org/data/definitions/79.html
- MDN — textContent vs innerHTML: https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
- MDN — Content-Security-Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
- DOMPurify library: https://github.com/cure53/DOMPurify

---

## 9. Technical Deep Dive

### Why innerHTML is dangerous

The `innerHTML` property allows setting the HTML content of an element. It **parses the string as markup**, which means:

```javascript
element.innerHTML = "<img src=x onerror='alert(1)'>";
// Browser's HTML parser runs the event handler immediately
```

The **HTML parser is not a security boundary**. It will:

- Execute inline event handlers (`onclick`, `onerror`, `onfocus`, etc.)
- Parse `<script>` tags (in some contexts)
- Evaluate CSS expressions and attributes
- Create any valid HTML element

### Why textContent is safe

The `textContent` property treats the input as **plain text**, not markup:

```javascript
element.textContent = "<img src=x onerror='alert(1)'>";
// Renders literally as the string: <img src=x onerror='alert(1)'>
```

No parsing occurs. The HTML characters are displayed as-is.

### Content-Security-Policy as defense-in-depth

Even if a developer uses `innerHTML` by mistake, CSP can block execution:

```
Content-Security-Policy: script-src 'self'
```

This tells the browser:

- ❌ **Don't run** inline scripts
- ❌ **Don't run** scripts from external origins
- ✅ **Do run** scripts from the same origin

**Limitations:**

- CSP can be bypassed if `'unsafe-inline'` is added
- CSP doesn't protect against DOM-based XSS in JavaScript
- CSP is a detection/blocking layer, not a prevention layer

---

## 10. Testing Methodology

### Test environment setup

```bash
npm install
npm start
# Server running at http://localhost:3000 and http://localhost:3000/fixed
```

### Manual testing checklist

- [ ] Post XSS payload on vulnerable page
- [ ] Reload page and verify alert fires
- [ ] Post same payload on fixed page
- [ ] Reload page and verify no alert (renders as text)
- [ ] Check DevTools → Network → Headers for CSP on `/fixed`
- [ ] Verify CSP is NOT present on `/` (vulnerable page)
- [ ] Test multiple payloads (img onerror, svg onload, etc.)
- [ ] Verify alert fires for each payload on vulnerable page
- [ ] Verify NO payloads execute on fixed page

### Automated testing (for future)

```bash
# Test 1: Vulnerable page should execute XSS
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","body":"<img src=x onerror='\''alert(1)'\''"}'

# Test 2: Check that CSP header is set on /fixed
curl -i http://localhost:3000/fixed | grep Content-Security-Policy

# Test 3: Verify fixed.html renders payload as text
# [Use Playwright or Puppeteer to verify no alert fires]
```

---

## 11. Lessons Learned

### Key takeaways

1. **Never trust user input** — assume all user data is potentially malicious
2. **Use the right tool** — `textContent` for text, `innerHTML` only for controlled markup
3. **Defense-in-depth** — layer multiple protections (encoding + CSP + validation)
4. **Test for security** — write tests that verify injected scripts don't execute
5. **Know your API** — understand what DOM methods do (innerHTML vs textContent vs innerText)

### Why this vulnerability persists

- Developers often copy-paste old code without questioning it
- `innerHTML` is convenient and widely used (even when unsafe)
- The vulnerability only manifests when user input is involved
- Modern frameworks (React, Vue) auto-escape by default, hiding the issue

### Real-world examples

- **Stored XSS in comments** (this demo) — attacker injects into a form
- **Stored XSS in user profiles** — attacker edits their bio to include payload
- **Stored XSS in chat apps** — attacker sends malicious message
- **DOM-based XSS** — client-side JavaScript mishandles user data without server involvement

---

## 12. Student Checklist

Complete the following to ensure your report is comprehensive:

### Documentation

- [ ] Filled in Student Name, Date, Course/Module at the top
- [ ] Provided a 3–4 sentence Executive Summary
- [ ] Explained what Stored XSS is in your own words
- [ ] Identified all three layers of vulnerability (frontend, backend, missing header)

### Demonstration

- [ ] Tested on vulnerable page (`http://localhost:3000`)
- [ ] Successfully triggered the XSS alert
- [ ] Captured screenshot of alert box
- [ ] Tested on fixed page (`http://localhost:3000/fixed`)
- [ ] Verified payload renders as plain text on fixed page
- [ ] Captured screenshot of fixed page with payload visible

### Analysis

- [ ] Explained why `<img src=x onerror>` works better than `<script>`
- [ ] Described the role of `innerHTML` in the vulnerability
- [ ] Explained why `textContent` fixes the issue
- [ ] Discussed the purpose of the CSP header
- [ ] Listed at least 3 real-world impacts of Stored XSS

### Code Review

- [ ] Showed before/after code for vulnerable.js and fixed.js
- [ ] Explained the difference between `innerHTML` and `textContent`
- [ ] Included the CSP header configuration
- [ ] Noted that backend has NO sanitization (intentional for demo)

### Recommendations

- [ ] Listed at least 3 defensive measures
- [ ] Prioritized recommendations (critical, high, medium)
- [ ] Included server-side validation as a recommendation
- [ ] Mentioned DOMPurify for cases where HTML is needed

### Submission

- [ ] Report is saved as `report.md` or `REPORT.md`
- [ ] All sections are filled in (no placeholder text)
- [ ] Screenshots are embedded or referenced
- [ ] References are included (links to OWASP, CWE, MDN)
- [ ] Report is proofread for grammar and clarity

---

## 13. Conclusion

Stored Cross-Site Scripting remains one of the most dangerous vulnerabilities in web development due to its **persistence and automatic execution**. This project demonstrates that the fix is simple — use `textContent` instead of `innerHTML` — but the consequences of missing it are severe.

**Key Insight:** Security is not about complexity. It's about using the right tool for the right job and understanding the implications of your code.

By completing this lab, you've learned:

- ✅ How to identify XSS vulnerabilities
- ✅ How to exploit them (in a controlled environment)
- ✅ How to fix them (safely and correctly)
- ✅ How to verify the fix works

Apply these lessons to your own projects.

_Report generated as part of the Stored XSS Mini Project — educational use only._
