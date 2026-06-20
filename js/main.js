/* ── Custom Cursor ─────────────────────────────────────────────────────── */
const cursor = document.getElementById('cursor');
const trail  = document.getElementById('cursor-trail');
let mx = 0, my = 0, tx = 0, ty = 0;

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
  });
  document.querySelectorAll('.palette-option').forEach(o => {
    o.addEventListener('click', () => {
      applyPalette(o.dataset.palette === 'warm' ? '' : o.dataset.palette);
      popup.classList.remove('open');
    });
  });
}

document.addEventListener('mousedown', () => cursor?.classList.add('pressed'));
document.addEventListener('mouseup',   () => cursor?.classList.remove('pressed'));

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
      btn.querySelector('.heart').textContent = '♥';
    }
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const user = Auth.currentUser();
      if (!user) { openAuthModal('login'); return; }
      const liked = Auth.likeToggle(pieceId);
      btn.classList.toggle('liked', liked);
      const heart = btn.querySelector('.heart');
      const count = btn.querySelector('.like-count');
      heart.textContent = liked ? '♥' : '♡';
      if (count) count.textContent = parseInt(count.textContent) + (liked ? 1 : -1);
    });
  });
}

/* ── Doodle Click Easter Egg ─────────────────────────────────────────── */
function initDoodles() {
  document.querySelectorAll('.doodle[data-msg]').forEach(d => {
    d.addEventListener('click', () => showToast(d.dataset.msg));
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
});

/* ── Paint Canvas ────────────────────────────────────────────────────── */
function initPaintCanvas() {
  const canvas = document.getElementById('paintCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['#D4899A','#FF4D6D','#27AE60','#3A6B8B','#E8B870','#8B5E52','#A8CDE8'];
  let colorIdx = 0, painting = false;
  const strokes = [];
  let cur = null;
  const LIFE = 3500;

  const skip = 'button,a,input,select,textarea,.modal-overlay,.avatar-modal-overlay,nav,.user-popup,.notif-panel,.palette-popup';

  document.addEventListener('mousedown', e => {
    if (e.target.closest(skip)) return;
    painting = true;
    colorIdx = (colorIdx + 1) % COLORS.length;
    cur = { color: COLORS[colorIdx], pts: [{x:e.clientX,y:e.clientY}], born: Date.now() };
    strokes.push(cur);
  });
  document.addEventListener('mousemove', e => {
    if (!painting || !cur) return;
    cur.pts.push({x:e.clientX, y:e.clientY});
  });
  const stop = () => { painting = false; cur = null; };
  document.addEventListener('mouseup', stop);
  document.addEventListener('mouseleave', stop);

  (function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = Date.now();
    for (let i = strokes.length - 1; i >= 0; i--) {
      const s = strokes[i];
      const age = now - s.born;
      if (age > LIFE) { strokes.splice(i, 1); continue; }
      if (s.pts.length < 2) continue;
      ctx.globalAlpha = Math.max(0, 1 - age / LIFE) * 0.72;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s.pts[0].x, s.pts[0].y);
      for (let j = 1; j < s.pts.length - 1; j++) {
        const mx = (s.pts[j].x + s.pts[j+1].x) / 2;
        const my = (s.pts[j].y + s.pts[j+1].y) / 2;
        ctx.quadraticCurveTo(s.pts[j].x, s.pts[j].y, mx, my);
      }
      ctx.lineTo(s.pts[s.pts.length-1].x, s.pts[s.pts.length-1].y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(render);
  })();
}

/* ── Hero Community Avatars ──────────────────────────────────────────── */
function initHeroAvatars() {
  const wrap = document.getElementById('heroAvatars');
  if (!wrap) return;
  const users = JSON.parse(localStorage.getItem('artlab_users') || '[]');
  const withAv = users.filter(u => u.avatar);

  const placeholders = [
    `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="33" r="20" stroke="var(--primary-d)" stroke-width="2"/><path d="M12 26 Q14 14 30 12 Q46 14 48 26" stroke="var(--primary-d)" stroke-width="1.8" fill="none"/><circle cx="23" cy="30" r="3" stroke="var(--primary-d)" stroke-width="1.5" fill="none"/><circle cx="37" cy="30" r="3" stroke="var(--primary-d)" stroke-width="1.5" fill="none"/><path d="M25 41 Q30 46 35 41" stroke="var(--primary-d)" stroke-width="2" fill="none" stroke-linecap="round"/><line x1="23" y1="14" x2="22" y2="8" stroke="var(--primary-d)" stroke-width="1.5"/><line x1="28" y1="12" x2="28" y2="6" stroke="var(--primary-d)" stroke-width="1.5"/><line x1="33" y1="12" x2="34" y2="6" stroke="var(--primary-d)" stroke-width="1.5"/></svg>`,
    `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="34" r="20" stroke="#8B5E52" stroke-width="2"/><path d="M12 28 Q10 14 22 10 Q30 6 38 10 Q50 14 48 28" stroke="#8B5E52" stroke-width="2" fill="none"/><path d="M12 28 Q10 40 14 48" stroke="#8B5E52" stroke-width="1.8" fill="none"/><path d="M48 28 Q50 40 46 48" stroke="#8B5E52" stroke-width="1.8" fill="none"/><circle cx="24" cy="32" r="3" stroke="#8B5E52" stroke-width="1.5" fill="none"/><circle cx="36" cy="32" r="3" stroke="#8B5E52" stroke-width="1.5" fill="none"/><path d="M26 43 Q30 48 34 43" stroke="#8B5E52" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="35" r="20" stroke="#FF4D6D" stroke-width="2"/><circle cx="12" cy="22" r="6" stroke="#FF4D6D" stroke-width="1.8" fill="none"/><circle cx="48" cy="22" r="6" stroke="#FF4D6D" stroke-width="1.8" fill="none"/><path d="M16 24 Q22 14 30 13 Q38 14 44 24" stroke="#FF4D6D" stroke-width="2" fill="none"/><circle cx="24" cy="33" r="3" stroke="#FF4D6D" stroke-width="1.5" fill="none"/><circle cx="36" cy="33" r="3" stroke="#FF4D6D" stroke-width="1.5" fill="none"/><path d="M25 44 Q30 49 35 44" stroke="#FF4D6D" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="36" r="20" stroke="#27AE60" stroke-width="2"/><line x1="22" y1="16" x2="20" y2="8" stroke="#27AE60" stroke-width="2"/><line x1="27" y1="14" x2="27" y2="6" stroke="#27AE60" stroke-width="2"/><line x1="33" y1="14" x2="34" y2="6" stroke="#27AE60" stroke-width="2"/><line x1="38" y1="16" x2="40" y2="8" stroke="#27AE60" stroke-width="2"/><path d="M12 28 Q14 18 30 16 Q46 18 48 28" stroke="#27AE60" stroke-width="2" fill="none"/><circle cx="24" cy="34" r="3" stroke="#27AE60" stroke-width="1.5" fill="none"/><circle cx="36" cy="34" r="3" stroke="#27AE60" stroke-width="1.5" fill="none"/><path d="M25 45 Q30 50 35 45" stroke="#27AE60" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="36" r="20" stroke="#3A6B8B" stroke-width="2"/><rect x="14" y="17" width="32" height="5" rx="2.5" stroke="#3A6B8B" stroke-width="1.8" fill="none"/><path d="M16 17 Q22 10 38 10 Q44 10 44 17" stroke="#3A6B8B" stroke-width="1.8" fill="none"/><circle cx="24" cy="34" r="3" stroke="#3A6B8B" stroke-width="1.5" fill="none"/><circle cx="36" cy="34" r="3" stroke="#3A6B8B" stroke-width="1.5" fill="none"/><path d="M25 45 Q30 50 35 45" stroke="#3A6B8B" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="33" r="20" stroke="#D4899A" stroke-width="2"/><path d="M12 26 Q14 8 30 8 Q46 8 48 26 Q48 48 42 54 Q18 54 12 48 Q10 44 12 26" stroke="#D4899A" stroke-width="2" fill="none"/><circle cx="24" cy="31" r="3" stroke="#D4899A" stroke-width="1.5" fill="none"/><circle cx="36" cy="31" r="3" stroke="#D4899A" stroke-width="1.5" fill="none"/><path d="M26 42 Q30 47 34 42" stroke="#D4899A" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="36" r="20" stroke="#E8A030" stroke-width="2"/><circle cx="30" cy="18" r="14" stroke="#E8A030" stroke-width="2" fill="var(--bg)"/><circle cx="24" cy="34" r="3" stroke="#E8A030" stroke-width="1.5" fill="none"/><circle cx="36" cy="34" r="3" stroke="#E8A030" stroke-width="1.5" fill="none"/><path d="M25 45 Q30 50 35 45" stroke="#E8A030" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    `<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="34" r="18" stroke="#8B5E52" stroke-width="2"/><path d="M14 30 Q12 14 22 9 Q30 4 38 9 Q48 14 46 30" stroke="#8B5E52" stroke-width="2" fill="none"/><line x1="28" y1="6" x2="30" y2="2" stroke="#8B5E52" stroke-width="1.8"/><line x1="32" y1="5" x2="35" y2="2" stroke="#8B5E52" stroke-width="1.8"/><circle cx="24" cy="32" r="3" stroke="#8B5E52" stroke-width="1.5" fill="none"/><circle cx="36" cy="32" r="3" stroke="#8B5E52" stroke-width="1.5" fill="none"/><path d="M25 43 Q30 48 35 43" stroke="#8B5E52" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
  ];

  const positions = [
    {l:'4%',  t:'18%', d:'11s', del:'0s',   r:'-4deg'},
    {l:'88%', t:'14%', d:'9s',  del:'0.7s',  r:'5deg'},
    {l:'6%',  t:'62%', d:'13s', del:'1.3s',  r:'-5deg'},
    {l:'84%', t:'68%', d:'10s', del:'0.4s',  r:'3deg'},
    {l:'17%', t:'10%', d:'8s',  del:'1s',    r:'6deg'},
    {l:'77%', t:'20%', d:'14s', del:'2s',    r:'-3deg'},
    {l:'3%',  t:'40%', d:'11s', del:'0.6s',  r:'4deg'},
    {l:'92%', t:'44%', d:'9s',  del:'1.8s',  r:'-6deg'},
    {l:'21%', t:'77%', d:'12s', del:'0.2s',  r:'2deg'},
    {l:'71%', t:'79%', d:'8s',  del:'1.2s',  r:'-2deg'},
    {l:'44%', t:'86%', d:'10s', del:'0.8s',  r:'4deg'},
    {l:'50%', t:'6%',  d:'9s',  del:'1.5s',  r:'-3deg'},
  ];

  positions.forEach((pos, i) => {
    const el = document.createElement('div');
    el.className = 'hero-av';
    el.style.cssText = `left:${pos.l};top:${pos.t};--dur:${pos.d};--del:${pos.del};--r:${pos.r}`;
    if (i < withAv.length) {
      el.innerHTML = `<img src="${withAv[i].avatar}" alt="${withAv[i].firstName}" title="${withAv[i].firstName}">`;
    } else {
      el.innerHTML = placeholders[(i - withAv.length) % placeholders.length];
    }
    wrap.appendChild(el);
  });
}

/* ── Brushstroke Animation ───────────────────────────────────────────── */
function initBrushstroke() {
  const scene = document.getElementById('lcmScene');
  if (!scene) return;
  const obs = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    scene.classList.add('painted');
    scene.querySelectorAll('.lcm-item').forEach(w => w.classList.add('visible'));
    obs.disconnect();
  }, { threshold: 0.25 });
  obs.observe(scene);
}

/* ── Init ────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initScroll();
  initPalette();
  animateProgressBars();
  initDoodles();
  initLikes();
  initPaintCanvas();
  initHeroAvatars();
  initBrushstroke();
});
