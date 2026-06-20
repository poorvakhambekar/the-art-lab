/* ── Auth System ─────────────────────────────────────────────────────────── */
const Auth = (() => {
  const USERS_KEY   = 'artlab_users';
  const SESSION_KEY = 'artlab_session';

  const getUsers   = () => JSON.parse(localStorage.getItem(USERS_KEY)   || '[]');
  const saveUsers  = u  => localStorage.setItem(USERS_KEY, JSON.stringify(u));
  const getSession = () => JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
  const setSession = u  => sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
  const clearSession = () => sessionStorage.removeItem(SESSION_KEY);

  function signup({ firstName, lastName, email, password, role }) {
    const users = getUsers();
    if (users.find(u => u.email === email)) return { error: 'An account with this email already exists.' };
    const user = {
      id: Date.now().toString(),
      firstName, lastName, email, password,
      role: role || 'student',
      avatar: null,
      joinedDate: new Date().toISOString(),
      likedPieces: [], enrolledCourses: ['watercolor-101','sketching-basics'],
      uploadedPieces: 0, sessionsAttended: 0, level: 'Beginner',
      notifications: [
        { id: 1, text: 'Welcome to The Art Lab!', time: 'Just now', unread: true, icon: '+' },
        { id: 2, text: 'Explore your first course — Watercolor 101', time: '1 min ago', unread: true, icon: '→' }
      ]
    };
    users.push(user); saveUsers(users); setSession(user);
    return { user };
  }

  function login({ email, password }) {
    const users = getUsers();
    const user  = users.find(u => u.email === email && u.password === password);
    if (!user) return { error: 'Invalid email or password.' };
    setSession(user); return { user };
  }

  function logout() { clearSession(); window.location.href = 'index.html'; }
  function currentUser() { return getSession(); }
  function requireLogin(redirectUrl) {
    const u = currentUser();
    if (!u) { window.location.href = redirectUrl || 'index.html?login=1'; return null; }
    return u;
  }

  function updateUser(updates) {
    const session = getSession(); if (!session) return;
    const users = getUsers();
    const idx = users.findIndex(u => u.id === session.id); if (idx === -1) return;
    Object.assign(users[idx], updates); saveUsers(users); setSession(users[idx]);
    return users[idx];
  }

  function addNotification(notif) {
    const session = getSession(); if (!session) return;
    const users = getUsers();
    const idx = users.findIndex(u => u.id === session.id); if (idx === -1) return;
    users[idx].notifications = users[idx].notifications || [];
    users[idx].notifications.unshift({ id: Date.now(), unread: true, ...notif });
    saveUsers(users); setSession(users[idx]);
  }

  function likeToggle(pieceId) {
    const user = currentUser(); if (!user) return false;
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    users[idx].likedPieces = users[idx].likedPieces || [];
    const li = users[idx].likedPieces.indexOf(pieceId);
    if (li === -1) { users[idx].likedPieces.push(pieceId); }
    else           { users[idx].likedPieces.splice(li, 1); }
    saveUsers(users); setSession(users[idx]);
    return li === -1;
  }

  function isLiked(pieceId) {
    const user = currentUser(); if (!user) return false;
    return (user.likedPieces || []).includes(pieceId);
  }

  return { signup, login, logout, currentUser, requireLogin, updateUser, addNotification, likeToggle, isLiked };
})();

/* ── Auth UI ─────────────────────────────────────────────────────────────── */
function initAuthUI() {
  const user    = Auth.currentUser();
  const authArea = document.getElementById('authArea');
  if (!authArea) return;

  if (user) {
    const initials    = (user.firstName[0] + user.lastName[0]).toUpperCase();
    const unread      = (user.notifications || []).filter(n => n.unread).length;
    const avatarStyle = user.avatar
      ? `background-image:url('${user.avatar}');background-size:cover;background-position:center;color:transparent;`
      : '';

    authArea.innerHTML = `
      <div style="position:relative">
        <button class="palette-btn" id="notifBtn" title="Notifications" style="position:relative;display:flex;align-items:center;justify-content:center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          ${unread > 0 ? `<span class="notif-badge">${unread}</span>` : ''}
        </button>
        <div class="notif-panel" id="notifPanel">
          <div class="notif-header">Notifications</div>
          <div class="notif-list" id="notifList"></div>
        </div>
      </div>
      <div style="position:relative">
        <button class="user-btn" id="userBtn" title="${user.firstName}" style="${avatarStyle}">${user.avatar ? '' : initials}</button>
        <div class="user-popup" id="userPopup">
          <div class="user-popup-header">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;padding-bottom:0.75rem;border-bottom:1px solid var(--bg2)">
              <div id="popupAvatarWrap" style="width:52px;height:52px;border-radius:50%;overflow:hidden;border:2px solid var(--accent);flex-shrink:0;background:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;color:var(--accent)">
                ${user.avatar ? `<img src="${user.avatar}" style="width:100%;height:100%;object-fit:cover" alt="avatar">` : initials}
              </div>
              <div>
                <div class="user-popup-name">${user.firstName} ${user.lastName}</div>
                <div class="user-popup-email">${user.email}</div>
              </div>
            </div>
          </div>
          <a href="#" class="user-popup-link" id="customizeAvatarBtn">Customize Avatar</a>
          <a href="dashboard.html" class="user-popup-link">My Dashboard</a>
          <a href="gallery.html" class="user-popup-link">My Gallery</a>
          <a href="#" class="user-popup-link" onclick="Auth.logout()">Sign Out</a>
        </div>
      </div>
    `;

    const notifList = document.getElementById('notifList');
    (user.notifications || []).forEach(n => {
      notifList.innerHTML += `
        <div class="notif-item ${n.unread ? 'unread' : ''}">
          <div class="notif-icon"></div>
          <div><div class="notif-text">${n.text}</div><div class="notif-time">${n.time}</div></div>
        </div>`;
    });

    document.getElementById('userBtn')?.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('userPopup').classList.toggle('open');
      document.getElementById('notifPanel')?.classList.remove('open');
      document.getElementById('palettePopup')?.classList.remove('open');
    });
    document.getElementById('notifBtn')?.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('notifPanel').classList.toggle('open');
      document.getElementById('userPopup')?.classList.remove('open');
    });
    document.getElementById('customizeAvatarBtn')?.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      document.getElementById('userPopup')?.classList.remove('open');
      openAvatarModal();
    });
  } else {
    authArea.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="openAuthModal('login')">Sign In</button>
      <button class="btn btn-primary btn-sm" onclick="openAuthModal('signup')">Join Free</button>
    `;
  }
}

/* ── Avatar Drawer ───────────────────────────────────────────────────────── */
function openAvatarModal() {
  const overlay = document.getElementById('avatarModal');
  if (!overlay) return;
  overlay.classList.add('open');
  initFaceCanvas();
}
function closeAvatarModal() {
  document.getElementById('avatarModal')?.classList.remove('open');
}

function initFaceCanvas() {
  const canvas = document.getElementById('faceCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = 240; canvas.height = 240;

  // Just fill with background — the CSS wrapper provides the circle shape
  function drawGuide() {
    ctx.clearRect(0, 0, 240, 240);
    ctx.fillStyle = '#FAF6F0';
    ctx.fillRect(0, 0, 240, 240);
  }
  drawGuide();

  let drawing = false;
  let color = '#2C1A1A';
  let size  = 5;
  let mode  = 'draw';

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    if (e.touches) return { x: (e.touches[0].clientX - r.left) * (240/r.width), y: (e.touches[0].clientY - r.top) * (240/r.height) };
    return { x: (e.clientX - r.left) * (240/r.width), y: (e.clientY - r.top) * (240/r.height) };
  }

  canvas.addEventListener('mousedown', e => {
    drawing = true; ctx.beginPath();
    const p = getPos(e); ctx.moveTo(p.x, p.y);
  });
  canvas.addEventListener('mousemove', e => {
    if (!drawing) return;
    const p = getPos(e);
    if (mode === 'erase') {
      ctx.clearRect(p.x - size*2, p.y - size*2, size*4, size*4);
    } else {
      ctx.lineTo(p.x, p.y); ctx.stroke();
    }
  });
  canvas.addEventListener('mouseup',    () => { drawing = false; });
  canvas.addEventListener('mouseleave', () => { drawing = false; });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); }, { passive:false });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }, { passive:false });
  canvas.addEventListener('touchend',   () => { drawing = false; });

  function setColor(c) {
    color = c; mode = 'draw';
    ctx.strokeStyle = c; ctx.lineWidth = size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    document.querySelectorAll('.av-color').forEach(b => b.classList.toggle('active', b.dataset.color === c));
  }
  function setMode(m) {
    mode = m;
    document.querySelectorAll('.av-tool-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    if (m === 'erase') { ctx.globalCompositeOperation = 'destination-out'; }
    else { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = color; }
  }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  setColor(color);

  document.querySelectorAll('.av-color').forEach(b => b.addEventListener('click', () => setColor(b.dataset.color)));
  document.querySelectorAll('.av-tool-btn').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.mode) setMode(b.dataset.mode);
    if (b.dataset.size) { size = parseInt(b.dataset.size); ctx.lineWidth = size; }
  }));

  document.getElementById('avClear')?.addEventListener('click', () => {
    drawGuide();
    setColor(color);
  });

  document.getElementById('avSave')?.addEventListener('click', () => {
    // Crop to a circle so the saved image has no zooming issues
    const off = document.createElement('canvas');
    off.width = 240; off.height = 240;
    const octx = off.getContext('2d');
    octx.beginPath();
    octx.arc(120, 120, 120, 0, Math.PI * 2);
    octx.clip();
    octx.drawImage(canvas, 0, 0);
    const dataUrl = off.toDataURL('image/png');

    Auth.updateUser({ avatar: dataUrl });
    const userBtn = document.getElementById('userBtn');
    if (userBtn) {
      userBtn.style.backgroundImage = `url('${dataUrl}')`;
      userBtn.style.backgroundSize = 'cover';
      userBtn.style.backgroundPosition = 'center';
      userBtn.style.color = 'transparent';
      userBtn.textContent = '';
    }
    const popupWrap = document.getElementById('popupAvatarWrap');
    if (popupWrap) popupWrap.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover" alt="avatar">`;
    closeAvatarModal();
    showToast('Avatar saved!');
  });
}

/* ── Auth Modal ──────────────────────────────────────────────────────────── */
function openAuthModal(tab) {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.add('open');
  switchTab(tab || 'login');
}
function closeAuthModal() {
  document.getElementById('authModal')?.classList.remove('open');
}
function switchTab(tab) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.modal-tab-content').forEach(p => p.classList.toggle('active', p.id === tab + 'Form'));
}

let selectedRole = 'student';
function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll('.role-option').forEach(o => o.classList.toggle('selected', o.dataset.role === role));
}

function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  const result   = Auth.login({ email, password });
  if (result.error) { errEl.textContent = result.error; errEl.style.display = 'block'; return; }
  errEl.style.display = 'none';
  window.location.reload();
}

function handleSignup(e) {
  e.preventDefault();
  const firstName = document.getElementById('signupFirst').value;
  const lastName  = document.getElementById('signupLast').value;
  const email     = document.getElementById('signupEmail').value;
  const password  = document.getElementById('signupPassword').value;
  const errEl     = document.getElementById('signupError');
  const result    = Auth.signup({ firstName, lastName, email, password, role: selectedRole });
  if (result.error) { errEl.textContent = result.error; errEl.style.display = 'block'; return; }
  errEl.style.display = 'none';
  closeAuthModal();
  window.location.reload();
}

document.addEventListener('click', () => {
  document.getElementById('userPopup')?.classList.remove('open');
  document.getElementById('notifPanel')?.classList.remove('open');
  document.getElementById('palettePopup')?.classList.remove('open');
});

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('authModal');
  if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closeAuthModal(); });
  const avOverlay = document.getElementById('avatarModal');
  if (avOverlay) avOverlay.addEventListener('click', e => { if (e.target === avOverlay) closeAvatarModal(); });
  if (new URLSearchParams(window.location.search).get('login') === '1') {
    setTimeout(() => openAuthModal('login'), 300);
  }
  initAuthUI();
});
