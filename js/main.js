/* ── Custom Cursor System ─────────────────────────────────────────────── */
const CURSOR_KEY = 'artlab_cursor';
const CURSORS = {
  paintbrush: { label: 'Paintbrush', icon: '🖌️', color: 'var(--accent)',   trail: 'var(--primary)'   },
  pencil:     { label: 'Pencil',     icon: '✏️', color: '#7A5A3A',         trail: '#D4B896'           },
  pen:        { label: 'Ink Pen',    icon: '🖊️', color: '#3A3A5A',         trail: '#9494C8'           },
  crayon:     { label: 'Crayon',     icon: '🖍️', color: '#C06030',         trail: '#F0A878'           },
  wand:       { label: 'Magic Wand', icon: '🪄', color: '#8A4A9A',         trail: '#D4A0E8'           },
  scissors:   { label: 'Scissors',   icon: '✂️', color: 'var(--mid)',       trail: 'var(--primary)'   },
};

let currentCursorType = localStorage.getItem(CURSOR_KEY) || 'paintbrush';
const cursor  = document.getElementById('cursor');
const trail   = document.getElementById('cursor-trail');
let mx = 0, my = 0, tx = 0, ty = 0;

function setCursorType(type) {
  currentCursorType = type;
  localStorage.setItem(CURSOR_KEY, type);
  applyCursor();
  document.querySelectorAll('.cursor-option').forEach(o =>
    o.classList.toggle('active', o.dataset.cursor === type)
  );
  showToast(`Cursor: ${CURSORS[type].label}`, CURSORS[type].icon);
  document.getElementById('cursorPickerPopup')?.classList.remove('open');
}

function applyCursor() {
  if (!cursor) return;
  const c = CURSORS[currentCursorType] || CURSORS.paintbrush;
  cursor.style.borderColor = c.color;
  if (trail) trail.style.background = c.trail;
}

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  if (cursor) { cursor.style.left = mx + 'px'; cursor.style.top = my + 'px'; }
});

function animateTrail() {
  tx += (mx - tx) * 0.15;
  ty += (my - ty) * 0.15;
  if (trail) { trail.style.left = tx + 'px'; trail.style.top = ty + 'px'; }
  requestAnimationFrame(animateTrail);
}
animateTrail();

/* ── Palette Switcher ────────────────────────────────────────────────── */
const PALETTE_KEY = 'artlab_palette';

function applyPalette(name) {
  document.documentElement.setAttribute('data-palette', name || '');
  localStorage.setItem(PALETTE_KEY, name);
  document.querySelectorAll('.palette-option').forEach(o => {
    o.classList.toggle('active', o.dataset.palette === (name || 'warm'));
  });
}

function initPalette() {
  const saved = localStorage.getItem(PALETTE_KEY);
  if (saved && saved !== 'warm') applyPalette(saved);
  else applyPalette('');

  const btn   = document.getElementById('paletteBtn');
  const popup = document.getElementById('palettePopup');
  btn?.addEventListener('click', (e) => {
    e.stopPropagation();
    popup.classList.toggle('open');
    document.getElementById('userPopup')?.classList.remove('open');
    document.getElementById('notifPanel')?.classList.remove('open');
    document.getElementById('cursorPickerPopup')?.classList.remove('open');
  });
  document.querySelectorAll('.palette-option').forEach(o => {
    o.addEventListener('click', () => {
      applyPalette(o.dataset.palette === 'warm' ? '' : o.dataset.palette);
      popup.classList.remove('open');
    });
  });
}

function initCursorPicker() {
  applyCursor();
  document.addEventListener('mousedown', () => cursor?.classList.add('pressed'));
  document.addEventListener('mouseup',   () => cursor?.classList.remove('pressed'));

  const btn   = document.getElementById('cursorPickerBtn');
  const popup = document.getElementById('cursorPickerPopup');
  if (!btn || !popup) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    popup.classList.toggle('open');
    document.getElementById('palettePopup')?.classList.remove('open');
    document.getElementById('userPopup')?.classList.remove('open');
    document.getElementById('notifPanel')?.classList.remove('open');
  });
  document.querySelectorAll('.cursor-option').forEach(o =>
    o.classList.toggle('active', o.dataset.cursor === currentCursorType)
  );
}

/* ── Scroll Effects ──────────────────────────────────────────────────── */
function initScroll() {
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 20);
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ── Progress Bars ───────────────────────────────────────────────────── */
function animateProgressBars() {
  const bars = document.querySelectorAll('.progress-fill[data-width]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.width = e.target.dataset.width + '%';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  bars.forEach(b => { b.style.width = '0%'; obs.observe(b); });
}

/* ── Tabs ────────────────────────────────────────────────────────────── */
function initTabs(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === target));
      container.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === target));
    });
  });
}

/* ── Filter Buttons ──────────────────────────────────────────────────── */
function initFilters(filterSel, itemSel, attr) {
  document.querySelectorAll(filterSel).forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(filterSel).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.dataset.filter;
      document.querySelectorAll(itemSel).forEach(item => {
        const match = val === 'all' || item.dataset[attr] === val;
        item.style.display = match ? '' : 'none';
      });
    });
  });
}

/* ── Like Buttons ────────────────────────────────────────────────────── */
function initLikes() {
  document.querySelectorAll('.gallery-like-btn').forEach(btn => {
    const pieceId = btn.dataset.piece;
    if (Auth.isLiked(pieceId)) {
      btn.classList.add('liked');
      btn.querySelector('.heart').textContent = '❤️';
    }
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const user = Auth.currentUser();
      if (!user) { openAuthModal('login'); return; }
      const liked = Auth.likeToggle(pieceId);
      btn.classList.toggle('liked', liked);
      const heart = btn.querySelector('.heart');
      const count = btn.querySelector('.like-count');
      heart.textContent = liked ? '❤️' : '🤍';
      if (count) count.textContent = parseInt(count.textContent) + (liked ? 1 : -1);
    });
  });
}

/* ── Doodle Click Easter Egg ─────────────────────────────────────────── */
function initDoodles() {
  document.querySelectorAll('.doodle[data-msg]').forEach(d => {
    d.addEventListener('click', () => showToast(d.dataset.msg, '🎨'));
  });
}

/* ── Toast ───────────────────────────────────────────────────────────── */
function showToast(msg, icon = '✅') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed; bottom:2rem; left:50%; transform:translateX(-50%);
    background:var(--dark); color:var(--white);
    padding:0.9rem 1.75rem; border-radius:50px;
    font-size:0.95rem; font-weight:600;
    box-shadow:0 8px 32px rgba(44,26,26,0.25);
    z-index:99999; display:flex; align-items:center; gap:0.5rem;
    animation:fadeUp 0.3s ease; white-space:nowrap;
  `;
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = '0.3s'; setTimeout(() => toast.remove(), 300); }, 2500);
}

/* ── Paint Splatter on Click ─────────────────────────────────────────── */
document.addEventListener('click', (e) => {
  if (e.target.closest('button, a, input, select, textarea, .modal, nav, .cursor-picker-popup')) return;
  const splat = document.createElement('div');
  splat.style.cssText = `
    position:fixed; left:${e.clientX}px; top:${e.clientY}px;
    width:10px; height:10px; border-radius:50%;
    background:var(--primary); pointer-events:none; z-index:99998;
    transform:translate(-50%,-50%) scale(0);
    animation:splatAnim 0.5s ease forwards;
  `;
  document.body.appendChild(splat);
  setTimeout(() => splat.remove(), 500);
});

const splatStyle = document.createElement('style');
splatStyle.textContent = `
  @keyframes splatAnim {
    0%   { transform:translate(-50%,-50%) scale(0); opacity:1; }
    50%  { transform:translate(-50%,-50%) scale(2.5); opacity:0.8; }
    100% { transform:translate(-50%,-50%) scale(3.5); opacity:0; }
  }
`;
document.head.appendChild(splatStyle);

/* ── Close all popups on outside click ──────────────────────────────── */
document.addEventListener('click', () => {
  document.getElementById('userPopup')?.classList.remove('open');
  document.getElementById('notifPanel')?.classList.remove('open');
  document.getElementById('palettePopup')?.classList.remove('open');
  document.getElementById('cursorPickerPopup')?.classList.remove('open');
});

/* ── Init ────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initScroll();
  initPalette();
  initCursorPicker();
  animateProgressBars();
  initDoodles();
  initLikes();
});
