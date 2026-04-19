// public/js/vulnerable.js
// ─────────────────────────────────────────────────────────────
// VULNERABLE VERSION — DO NOT USE IN PRODUCTION
// This file intentionally renders comments using innerHTML,
// which executes any HTML or JavaScript stored in the database.
// ─────────────────────────────────────────────────────────────

const API = "/api/comments";

async function loadComments() {
  const list = document.getElementById("comments-list");
  list.innerHTML = '<p class="status-msg">Loading comments...</p>';

  try {
    const res = await fetch(API);
    const comments = await res.json();

    if (comments.length === 0) {
      list.innerHTML =
        '<div class="empty-state">No comments yet. Be the first!</div>';
      return;
    }

    list.innerHTML = "";
    comments.forEach((comment) => {
      const card = document.createElement("div");
      card.className = "comment-card";

      const initials = comment.name.slice(0, 2).toUpperCase();
      const date = new Date(comment.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      // VULNERABLE: innerHTML is used to render the comment body.
      // If comment.body contains event handlers or other HTML attributes,
      // the browser will parse and execute them.
      const headerDiv = document.createElement("div");
      headerDiv.className = "comment-header";
      headerDiv.innerHTML = `
        <div class="comment-avatar">${initials}</div>
        <span class="comment-name">${comment.name}</span>
        <span class="comment-date">${date}</span>
      `;
      card.appendChild(headerDiv);

      const bodyDiv = document.createElement("div");
      bodyDiv.className = "comment-body";
      // VULNERABLE: innerHTML is used here — event handlers will execute
      bodyDiv.innerHTML = comment.body;
      // ↑ VULNERABLE: comment.body injected raw — any onclick, onerror, or other events will trigger
      card.appendChild(bodyDiv);

      list.appendChild(card);
    });
  } catch (err) {
    list.innerHTML = `<p class="status-msg">Error loading comments: ${err.message}</p>`;
  }
}

async function submitComment(e) {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const body = document.getElementById("body").value;
  // VULNERABLE: body is sent with no client-side escaping or validation

  if (!name || !body.trim()) return;

  const btn = document.getElementById("submit-btn");
  btn.disabled = true;
  btn.textContent = "Posting...";

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, body }),
      // VULNERABLE: raw body string sent directly to server
    });

    if (!res.ok) throw new Error("Server error");

    document.getElementById("name").value = "";
    document.getElementById("body").value = "";
    loadComments();
  } catch (err) {
    alert("Failed to post comment: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Post Comment";
  }
}

async function resetComments() {
  if (!confirm("Delete all comments? This resets the demo.")) return;
  await fetch(API, { method: "DELETE" });
  loadComments();
}

document
  .getElementById("comment-form")
  .addEventListener("submit", submitComment);
document.getElementById("reset-btn").addEventListener("click", resetComments);

loadComments();
