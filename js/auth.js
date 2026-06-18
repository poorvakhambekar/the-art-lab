/* ── Auth System ─────────────────────────────────────────────────────── */
const Auth = (() => {
  const USERS_KEY = 'artlab_users';
  const SESSION_KEY = 'artlab_session';

  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  }
  function saveUsers(u) {
    localStorage.setItem(USERS_KEY, JSON.stringify(u));
  }
  function getSession() {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
  }
  function setSession(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function signup({ firstName, lastName, email, password, role }) {
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      return { error: 'An account with this email already exists.' };
    }
    const user = {
      id: Date.now().toString(),
      firstName, lastName, email, password,
      role: role || 'student',
      joinedDate: new Date().toISOString(),
      likedPieces: [],
      enrolledCourses: ['watercolor-101', 'sketching-basics'],
      uploadedPieces: 0,
      sessionsAttended: 0,
      level: 'Beginner',
      notifications: [
        { id: 1, text: 'Welcome to The Art Lab! 🎨', time: 'Just now', unread: true, icon: '🎉' },
        { id: 2, text: 'Explore your first course — Watercolor 101', time: '1 min ago', unread: true, icon: '📚' }
      ]
    };
    users.push(user);
    saveUsers(users);
    setSession(user);
    return { user };
  }

  function login({ email, password }) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { error: 'Invalid email or password.' };
    setSession(user);
    return { user };
  }

  function logout() {
    clearSession();
    window.location.href = 'index.html';
  }

  function currentUser() {
    return getSession();
  }

  function requireLogin(redirectUrl) {
    const user = currentUser();
    if (!user) {
      window.location.href = redirectUrl || 'index.html?login=1';
      return null;
    }
    return user;
  }

  function updateUser(updates) {
    const session = getSession();
    if (!session) return;
    const users = getUsers();
    const idx = users.findIndex(u => u.id === session.id);
    if (idx === -1) return;
    Object.assign(users[idx], updates);
    saveUsers(users);
    setSession(users[idx]);
    return users[idx];
  }

  function addNotification(notif) {
    const session = getSession();
    if (!session) return;
    const users = getUsers();
    const idx = users.findIndex(u => u.id === session.id);
    if (idx === -1) return;
    users[idx].notifications = users[idx].notifications || [];
    users[idx].notifications.unshift({ id: Date.now(), unread: true, ...notif });
    saveUsers(users);
    setSession(users[idx]);
  }

  function likeToggle(pieceId) {
    const user = currentUser();
    if (!user) return false;
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    users[idx].likedPieces = users[idx].likedPieces || [];
    const likedIdx = users[idx].likedPieces.indexOf(pieceId);
    if (likedIdx === -1) {
      users[idx].likedPieces.push(pieceId);
      saveUsers(users); setSession(users[idx]);
      return true;
    } else {
      users[idx].likedPieces.splice(likedIdx, 1);
      saveUsers(users); setSession(users[idx]);
      return false;
    }
  }

  function isLiked(pieceId) {
    const user = currentUser();
    if (!user) return false;
    return (user.likedPieces || []).includes(pieceId);
  }

  return { signup, login, logout, currentUser, requireLogin, updateUser, addNotification, likeToggle, isLiked };
})();

/* ── UI Helpers ──────────────────────────────────────────────────────── */
function initAuthUI() {
  const user = Auth.currentUser();
  const authArea = document.getElementById('authArea');
  if (!authArea) return;

  if (user) {
    const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
    const unreadCount = (user.notifications || []).filter(n => n.unread).length;
    authArea.innerHTML = `
      <div style="position:relative;">
        <button class="palette-btn" id="notifBtn" title="Notifications" style="position:relative;">
          🔔
          ${unreadCount > 0 ? `<span class="notif-badge">${unreadCount}</span>` : ''}
        </button>
        <div class="notif-panel" id="notifPanel">
          <div class="notif-header">Notifications</div>
          <div class="notif-list" id="notifList"></div>
        </div>
      </div>
      <div style="position:relative;">
        <button class="user-btn" id="userBtn" title="${user.firstName}">${initials}</button>
        <div class="user-popup" id="userPopup">
          <div class="user-popup-header">
            <div class="user-popup-name">${user.firstName} ${user.lastName}</div>
            <div class="user-popup-email">${user.email}</div>
          </div>
          <a href="dashboard.html" class="user-popup-link">🎨 My Dashboard</a>
          <a href="gallery.html" class="user-popup-link">🖼️ My Gallery</a>
          <a href="#" class="user-popup-link" onclick="Auth.logout()">🚪 Sign Out</a>
        </div>
      </div>
    `;
    // Populate notifications
    const notifList = document.getElementById('notifList');
    (user.notifications || []).forEach(n => {
      notifList.innerHTML += `
        <div class="notif-item ${n.unread ? 'unread' : ''}">
          <div class="notif-icon">${n.icon || '🔔'}</div>
          <div>
            <div class="notif-text">${n.text}</div>
            <div class="notif-time">${n.time}</div>
          </div>
        </div>`;
    });
    // Toggle popups
    document.getElementById('userBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('userPopup').classList.toggle('open');
      document.getElementById('notifPanel')?.classList.remove('open');
      document.getElementById('palettePopup')?.classList.remove('open');
    });
    document.getElementById('notifBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('notifPanel').classList.toggle('open');
      document.getElementById('userPopup')?.classList.remove('open');
    });
  } else {
    authArea.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="openAuthModal('login')">Sign In</button>
      <button class="btn btn-primary btn-sm" onclick="openAuthModal('signup')">Join Free</button>
    `;
  }
}

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
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  const result = Auth.login({ email, password });
  if (result.error) { errEl.textContent = result.error; errEl.style.display = 'block'; return; }
  errEl.style.display = 'none';
  window.location.reload();
}

function handleSignup(e) {
  e.preventDefault();
  const firstName = document.getElementById('signupFirst').value;
  const lastName = document.getElementById('signupLast').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const errEl = document.getElementById('signupError');
  const result = Auth.signup({ firstName, lastName, email, password, role: selectedRole });
  if (result.error) { errEl.textContent = result.error; errEl.style.display = 'block'; return; }
  errEl.style.display = 'none';
  closeAuthModal();
  window.location.reload();
}

// Close popups on outside click
document.addEventListener('click', () => {
  document.getElementById('userPopup')?.classList.remove('open');
  document.getElementById('notifPanel')?.classList.remove('open');
  document.getElementById('palettePopup')?.classList.remove('open');
});

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('authModal');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAuthModal();
    });
  }
  // Check if URL has ?login=1 to auto-open modal
  if (new URLSearchParams(window.location.search).get('login') === '1') {
    setTimeout(() => openAuthModal('login'), 300);
  }
});
