// public/js/fixed.js
// ─────────────────────────────────────────────────────────────
// FIXED VERSION — Safe comment rendering
// Changes from vulnerable.js:
//   1. comment.body rendered with textContent (not innerHTML)
//   2. comment.name also set with textContent
//   3. Server sends Content-Security-Policy header for this route
// ─────────────────────────────────────────────────────────────

const API = '/api/comments';

async function loadComments() {
  const list = document.getElementById('comments-list');
  list.innerHTML = '<p class="status-msg">Loading comments...</p>';

  try {
    const res = await fetch(API);
    const comments = await res.json();

    if (comments.length === 0) {
      list.innerHTML = '<div class="empty-state">No comments yet. Be the first!</div>';
      return;
    }

    list.innerHTML = '';
    comments.forEach(comment => {
      const card = document.createElement('div');
      card.className = 'comment-card';

      const header = document.createElement('div');
      header.className = 'comment-header';

      // FIXED: Avatar initials set with textContent
      const avatar = document.createElement('div');
      avatar.className = 'comment-avatar';
      avatar.textContent = comment.name.slice(0, 2).toUpperCase();

      // FIXED: Name set with textContent — any HTML tags display as plain text
      const nameEl = document.createElement('span');
      nameEl.className = 'comment-name';
      nameEl.textContent = comment.name;

      const date = new Date(comment.created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
      const dateEl = document.createElement('span');
      dateEl.className = 'comment-date';
      dateEl.textContent = date;

      header.appendChild(avatar);
      header.appendChild(nameEl);
      header.appendChild(dateEl);

      // FIXED: Body rendered with textContent — script tags become visible text, not executable code
      const bodyEl = document.createElement('div');
      bodyEl.className = 'comment-body';
      bodyEl.textContent = comment.body;
      // ↑ FIXED: Even "<script>alert(1)</script>" displays as harmless text

      card.appendChild(header);
      card.appendChild(bodyEl);
      list.appendChild(card);
    });

  } catch (err) {
    const list = document.getElementById('comments-list');
    list.innerHTML = `<p class="status-msg">Error loading comments: ${err.message}</p>`;
  }
}

async function submitComment(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const body = document.getElementById('body').value;

  if (!name || !body.trim()) return;

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = 'Posting...';

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, body })
      // Note: we don't need to sanitize here because output encoding (textContent)
      // is the correct fix. Sanitizing input is defense-in-depth, not the primary fix.
    });

    if (!res.ok) throw new Error('Server error');

    document.getElementById('name').value = '';
    document.getElementById('body').value = '';
    loadComments();

  } catch (err) {
    alert('Failed to post comment: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Post Comment';
  }
}

async function resetComments() {
  if (!confirm('Delete all comments? This resets the demo.')) return;
  await fetch(API, { method: 'DELETE' });
  loadComments();
}

document.getElementById('comment-form').addEventListener('submit', submitComment);
document.getElementById('reset-btn').addEventListener('click', resetComments);

loadComments();
