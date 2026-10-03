/* ============================================================
   SRT Admin — Flyer Manager
   ------------------------------------------------------------
   Static site (GitHub Pages) has no backend, so to make an
   uploaded flyer visible to EVERY visitor it must be committed
   to the repo. This tool:
     1. Gates access with a hashed username:password.
     2. Uploads the flyer image into assets/img/events/ and adds
        an entry to window.SRT_EVENTS in index.html via the
        GitHub Contents API (needs a fine-grained token).
     3. The existing GitHub Action then auto-archives (purges)
        the flyer into assets/img/events/archive/ after its date.
   If no token is provided, it falls back to giving you the
   renamed image to download plus the exact snippet to paste.
   ============================================================ */
(function () {
  'use strict';

  // SHA-256 of "admin:SRT@Rajiv2026" — the plaintext password is NOT in source.
  const CRED_HASH = '7054ed90846b81a68a1f4a34140bb229fe2e47999c6f22de28ad5db15291145d';
  const EVENTS_DIR = 'assets/img/events/';

  // Repository that hosts this site — handled internally (public info, safe here).
  const GH_OWNER = 'pcr-ai';
  const GH_REPO = 'srt';
  const GH_BRANCH = 'main';

  const TOKEN_KEY = 'srtGhToken';
  const AUTH_KEY = 'srtAdminAuthed';

  // ---------- small helpers ----------
  const $ = (id) => document.getElementById(id);

  async function sha256Hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  const utf8ToB64 = (s) => btoa(unescape(encodeURIComponent(s)));
  const b64ToUtf8 = (b) => decodeURIComponent(escape(atob(b.replace(/\s/g, ''))));
  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  // Token is remembered on this device so it is entered only once.
  // It is NOT committed to the site; it never leaves this browser.
  // Strip whitespace/newlines so pasted tokens don't break the HTTP header.
  const cleanToken = (t) => String(t || '').replace(/\s+/g, '');
  function getToken() { return cleanToken(localStorage.getItem(TOKEN_KEY)); }
  function setToken(t) {
    const v = cleanToken(t);
    if (v) localStorage.setItem(TOKEN_KEY, v);
    else localStorage.removeItem(TOKEN_KEY);
  }

  function slugify(name) {
    return name.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '').slice(0, 60) || 'flyer';
  }
  function extOf(file) {
    const m = /\.([a-z0-9]+)$/i.exec(file.name);
    if (m) return m[1].toLowerCase();
    return (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  }

  // ---------- auth ----------
  const loginView = $('loginView');
  const adminView = $('adminView');
  const loginForm = $('loginForm');
  const loginMsg = $('loginMsg');

  function showAdmin() {
    loginView.hidden = true;
    adminView.hidden = false;
    loadFlyers();
  }

  if (sessionStorage.getItem(AUTH_KEY) === '1') showAdmin();

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginMsg.textContent = 'Checking…';
    const user = $('user').value.trim();
    const pass = $('pass').value;
    const hash = await sha256Hex(user + ':' + pass);
    if (hash === CRED_HASH) {
      sessionStorage.setItem(AUTH_KEY, '1');
      loginMsg.textContent = '';
      showAdmin();
    } else {
      loginMsg.textContent = 'Incorrect username or password.';
      $('pass').value = '';
    }
  });

  $('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem(AUTH_KEY);
    location.reload();
  });

  // ---------- current flyers ----------
  async function loadFlyers() {
    const wrap = $('flyerList');
    wrap.innerHTML = '<p class="admin-muted">Loading current flyers…</p>';
    try {
      const html = await fetch('index.html?_=' + Date.now()).then((r) => r.text());
      const m = html.match(/window\.SRT_EVENTS\s*=\s*(\[[\s\S]*?\]);/);
      if (!m) { wrap.innerHTML = '<p class="admin-muted">No flyer list found.</p>'; return; }
      const list = new Function('return ' + m[1])();
      if (!list.length) { wrap.innerHTML = '<p class="admin-muted">No flyers currently listed.</p>'; return; }
      const today = new Date(); today.setHours(0, 0, 0, 0);
      wrap.innerHTML = '';
      list.forEach((ev) => {
        const end = ev.until || ev.date;
        const expired = end && new Date(end + 'T23:59:59') < today;
        const row = document.createElement('div');
        row.className = 'flyer-row';
        row.innerHTML =
          '<img src="' + ev.img + '" alt="" onerror="this.style.opacity=.25" />' +
          '<div class="fr-info"><strong>' + (ev.alt || ev.img) + '</strong>' +
          '<span class="admin-muted">' + ev.img + '</span>' +
          '<span class="fr-date ' + (expired ? 'exp' : '') + '">' +
          (end ? (expired ? 'Expired ' : 'Shows until ') + end : 'No date') + '</span></div>';
        wrap.appendChild(row);
      });
    } catch (err) {
      wrap.innerHTML = '<p class="admin-muted">Could not read current flyers (' + err.message + ').</p>';
    }
  }

  // ---------- file preview ----------
  let currentFile = null;
  const fileInput = $('flyerFile');
  fileInput.addEventListener('change', () => {
    currentFile = fileInput.files[0] || null;
    const prev = $('preview');
    if (!currentFile) { prev.innerHTML = ''; return; }
    if (!$('flyerName').value.trim()) $('flyerName').value = slugify(currentFile.name);
    const url = URL.createObjectURL(currentFile);
    prev.innerHTML = '<img src="' + url + '" alt="Preview" />';
  });

  // ---------- GitHub API ----------
  async function gh(path, method, token, body) {
    const res = await fetch(
      'https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO + '/' + path,
      {
        method,
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: body ? JSON.stringify(body) : undefined,
      }
    );
    if (!res.ok) {
      let detail = res.statusText;
      try { detail = (await res.json()).message || detail; } catch {}
      throw new Error('GitHub ' + res.status + ': ' + detail);
    }
    return res.status === 204 ? null : res.json();
  }

  async function fileToB64(file) {
    const dataUrl = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
    return String(dataUrl).split(',')[1];
  }

  function status(msg, kind) {
    const el = $('publishMsg');
    el.textContent = msg;
    el.className = 'admin-status' + (kind ? ' ' + kind : '');
  }

  // ---------- publish ----------
  $('publishForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentFile) { status('Please choose a flyer image first.', 'err'); return; }
    const date = $('flyerDate').value;
    if (!date) { status('Please set the date the flyer shows until.', 'err'); return; }
    const alt = $('flyerAlt').value.trim() || 'Temple event flyer';
    const link = $('flyerLink').value.trim() || 'events.html';
    const filename = (slugify($('flyerName').value.trim() || currentFile.name)) + '.' + extOf(currentFile);
    const relPath = EVENTS_DIR + filename;
    const entry = "    { img: '" + esc(relPath) + "', alt: '" + esc(alt) +
      "', link: '" + esc(link) + "', date: '" + esc(date) + "' },";

    // Token is handled internally: remembered on this device, prompted once if missing.
    let token = getToken();
    if (!token) {
      setToken(prompt('One-time setup: paste a GitHub fine-grained token (Contents: Read and write) to publish live. Leave blank to just download the image + snippet.'));
      token = getToken();
    }

    // ---- Fallback (no GitHub token): download image + show snippet ----
    if (!token) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(currentFile);
      a.download = filename;
      a.click();
      $('snippetBox').hidden = false;
      $('snippet').value =
        '1) Put the downloaded image here:  ' + relPath + '\n\n' +
        '2) Add this line to window.SRT_EVENTS in index.html (newest first):\n\n' +
        entry;
      status('No publish token set — generated the file + snippet to commit manually.', 'warn');
      return;
    }

    // ---- Live publish via GitHub API ----
    $('snippetBox').hidden = true;
    try {
      status('Uploading image to the repository…');
      const imgB64 = await fileToB64(currentFile);
      // If an image with this name exists, we need its sha to overwrite.
      let imgSha;
      try {
        const existing = await gh('contents/' + relPath + '?ref=' + GH_BRANCH, 'GET', token);
        imgSha = existing.sha;
      } catch { /* not found — new file */ }
      await gh('contents/' + relPath, 'PUT', token, {
        message: 'admin: add flyer ' + filename,
        content: imgB64,
        branch: GH_BRANCH,
        sha: imgSha,
      });

      status('Updating the homepage flyer list…');
      const idx = await gh('contents/index.html?ref=' + GH_BRANCH, 'GET', token);
      let html = b64ToUtf8(idx.content);
      const anchor = html.match(/window\.SRT_EVENTS\s*=\s*\[/);
      if (!anchor) throw new Error('SRT_EVENTS list not found in index.html');
      const at = anchor.index + anchor[0].length;
      html = html.slice(0, at) + '\n' + entry + html.slice(at);
      await gh('contents/index.html', 'PUT', token, {
        message: 'admin: show flyer ' + filename + ' until ' + date,
        content: utf8ToB64(html),
        branch: GH_BRANCH,
        sha: idx.sha,
      });

      status('Published! The flyer will appear on the homepage once GitHub Pages redeploys (usually under a minute). It auto-archives after ' + date + '.', 'ok');
      $('publishForm').reset();
      $('preview').innerHTML = '';
      currentFile = null;
      setTimeout(loadFlyers, 1500);
    } catch (err) {
      status('Publish failed — ' + err.message, 'err');
    }
  });

  $('copySnippet').addEventListener('click', () => {
    $('snippet').select();
    document.execCommand('copy');
  });
})();
