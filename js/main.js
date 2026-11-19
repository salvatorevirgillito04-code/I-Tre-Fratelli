/* I Tre Fratelli — interazioni */
(() => {
  'use strict';
  document.documentElement.classList.add('js-ready');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- Svelamento di foto e manifesto (sicuro: mai foto nascoste) ---------- */
  const root = document.documentElement;
  const pending = $$('[data-reveal]');
  const plateEl = $('.plate');
  const markIn = el => {
    el.classList.add('is-in');
    if (el.classList.contains('reveal') && !reduce) setTimeout(() => steam && steam.start(), 2400);
  };
  const showIn = () => {
    const h = window.innerHeight || 800;
    for (let i = pending.length - 1; i >= 0; i--) {
      const r = pending[i].getBoundingClientRect();
      if (r.top < h * 1.05 && r.bottom > -h * 0.2) { markIn(pending[i]); pending.splice(i, 1); }
    }
  };
  if (reduce) pending.forEach(markIn);
  else {
    root.classList.add('reveal-on');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => entries.forEach(en => {
        if (en.isIntersecting) { const k = pending.indexOf(en.target); if (k > -1) { markIn(en.target); pending.splice(k, 1); } io.unobserve(en.target); }
      }), { rootMargin: '0px 0px 10% 0px', threshold: 0 });
      pending.forEach(el => io.observe(el));
    }
    showIn();
    window.addEventListener('scroll', showIn, { passive: true });
    window.addEventListener('resize', showIn);
    window.addEventListener('load', showIn);
  }

  /* ---------- Precarica le foto in sottofondo appena la pagina e' pronta ---------- */
  const warm = () => $$('img[loading="lazy"]').forEach(img => { img.loading = 'eager'; });
  if (document.readyState === 'complete') setTimeout(warm, 300);
  else window.addEventListener('load', () => setTimeout(warm, 300), { once: true });

  /* ---------- Sipario d'apertura e entrata hero ---------- */
  $$('.hero [data-rise]').forEach((el, i) => el.style.setProperty('--i', i));
  const intro = $('.intro');
  const introOn = intro && !reduce && getComputedStyle(intro).display !== 'none';
  const startHero = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-loaded')));
  };
  const dropIntro = () => { if (intro && intro.parentNode) intro.parentNode.removeChild(intro); };
  if (introOn) {
    document.body.classList.add('menu-open');
    let lifted = false;
    const lift = () => {
      if (lifted) return; lifted = true;
      intro.classList.add('is-out');
      document.body.classList.remove('menu-open');
      setTimeout(startHero, 350);
      setTimeout(dropIntro, 1200);
    };
    const t0 = performance.now();
    const go = () => setTimeout(lift, Math.max(0, 1100 - (performance.now() - t0)));
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
    setTimeout(lift, 4000);
  } else {
    dropIntro();
    startHero();
  }

  /* ---------- Nav, menù mobile, barra azioni ---------- */
  const nav = $('#nav');
  const toggle = $('.nav__toggle');
  const mobileMenu = $('#menu-mobile');
  const actionbar = $('.actionbar');
  const hero = $('.hero');
  const setMenu = open => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr').textContent = open ? 'Chiudi il menù' : 'Apri il menù';
    mobileMenu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    nav.classList.toggle('is-solid', open || window.scrollY > 40);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', mobileMenu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileMenu.hidden) { setMenu(false); toggle.focus(); } });

  /* ---------- Piatto che ruota con lo scroll ---------- */
  const plateBox = $('.plate');
  const prog = $$('[data-progress]');
  const revealSec = $('.reveal'), carni = $('#carni');
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    $$('[data-tilt]').forEach(sc => {
      const host = sc.closest('section');
      host.addEventListener('pointermove', e => {
        const r = sc.getBoundingClientRect();
        sc.style.setProperty('--mx', clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1).toFixed(3));
        sc.style.setProperty('--my', clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1).toFixed(3));
      });
      host.addEventListener('pointerleave', () => { sc.style.setProperty('--mx', 0); sc.style.setProperty('--my', 0); });
    });
  }

  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    if (mobileMenu.hidden) nav.classList.toggle('is-solid', y > 40);
    actionbar.classList.toggle('is-on', y > hero.offsetHeight * 0.6);
    const vh = window.innerHeight;
    if (!reduce) {
      if (plateBox && revealSec) {
        const rr = revealSec.getBoundingClientRect();
        const pr = clamp((vh - rr.top) / (vh + rr.height));
        const lift = Math.sin(pr * Math.PI);
        plateBox.style.setProperty('--plate-rot', ((pr - .5) * 40).toFixed(2) + 'deg');
        plateBox.style.setProperty('--lift', (Math.pow(lift, 3) * 46).toFixed(1) + 'px');
        plateBox.style.setProperty('--lift-n', Math.pow(lift, 3).toFixed(3));
      }
      if (revealSec && carni) revealSec.style.setProperty('--cover', clamp(1 - carni.getBoundingClientRect().top / vh).toFixed(3));
      prog.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        el.style.setProperty('--p', clamp((vh - r.top) / (vh + r.height)).toFixed(3));
      });
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });




  /* ---------- Vapore realistico sopra il piatto ---------- */
  const steam = (() => {
    const c = $('.steam'); if (!c || reduce) return null;
    const ctx = c.getContext('2d'); let w = 0, h = 0, dpr = 1, parts = [], on = false, visible = false, running = false;
    const size = () => { const r = c.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2); w = r.width; h = r.height; c.width = w * dpr; c.height = h * dpr; };
    size(); window.addEventListener('resize', size);
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && on) loop(); }).observe(c);
    const spawn = () => ({ x: w * (.36 + Math.random() * .28), y: h * (.98 + Math.random() * .04), vx: (Math.random() - .5) * .15, vy: -(.35 + Math.random() * .45), r: 14 + Math.random() * 18, a: 0, life: 0, max: 220 + Math.random() * 160, ph: Math.random() * 6.28 });
    const loop = () => {
      if (running) return; running = true;
      const step = () => {
        if (!visible) { running = false; return; }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
        if (parts.length < 26 && Math.random() < .22) parts.push(spawn());
        for (let i = parts.length - 1; i >= 0; i--) {
          const q = parts[i]; q.life++; q.ph += .02;
          q.x += q.vx + Math.sin(q.ph + q.life * .015) * .35; q.y += q.vy; q.r += .16;
          const t = q.life / q.max; if (t >= 1) { parts.splice(i, 1); continue; }
          const al = Math.sin(Math.PI * t) * .085;
          const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r);
          g.addColorStop(0, `rgba(255,250,240,${al})`); g.addColorStop(1, 'rgba(255,250,240,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283); ctx.fill();
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    return { start() { on = true; if (visible) loop(); } };
  })();

  /* ---------- Orari e stato aperto/chiuso (ora italiana) ---------- */
  const SLOTS = [[12 * 60, 14 * 60 + 30], [19 * 60, 22 * 60]];
  const slotsFor = d => (d === 1 ? [] : SLOTS); // 0 = domenica, 1 = lunedì (chiuso)
  const DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const hhmm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  function romeNow() {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const g = t => +parts.find(p => p.type === t).value;
    const y = g('year'), mo = g('month'), d = g('day');
    const h = g('hour') % 24, mi = g('minute');
    const day = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
    return { y, mo, d, day, min: h * 60 + mi };
  }
  function status() {
    const n = romeNow();
    for (const [a, b] of slotsFor(n.day)) {
      if (n.min >= a && n.min < b) {
        const left = b - n.min;
        if (left <= 30) return { cls: 'is-soon', short: `Chiude tra ${left} min`, long: `Aperto, chiude tra ${left} minuti` };
        return { cls: 'is-open', short: 'Aperto ora', long: `Aperto ora, fino alle ${hhmm(b)}` };
      }
    }
    const later = slotsFor(n.day).find(([a]) => a > n.min);
    if (later) {
      const wait = later[0] - n.min;
      if (wait <= 60) return { cls: 'is-soon', short: `Apre tra ${wait} min`, long: `Chiuso, apre tra ${wait} minuti` };
      return { cls: 'is-closed', short: `Chiuso · apre alle ${hhmm(later[0])}`, long: `Chiuso ora, riapre oggi alle ${hhmm(later[0])}` };
    }
    for (let k = 1; k <= 7; k++) {
      const d = (n.day + k) % 7, s = slotsFor(d);
      if (s.length) {
        const when = k === 1 ? 'domani' : DAYS[d];
        return { cls: 'is-closed', short: 'Chiuso ora', long: `Chiuso ora, riapre ${when} alle ${hhmm(s[0][0])}` };
      }
    }
  }
  function paintStatus() {
    const s = status(), n = romeNow();
    $$('[data-status], [data-status-big]').forEach(el => {
      el.classList.remove('is-open', 'is-closed', 'is-soon'); el.classList.add(s.cls);
      $('[data-status-text]', el).textContent = el.hasAttribute('data-status-big') ? s.long : s.short;
    });
    $$('.hours__table tr').forEach(tr => tr.classList.toggle('is-today', +tr.dataset.day === n.day));
  }
  paintStatus(); setInterval(paintStatus, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) paintStatus(); });
  $$('[data-year]').forEach(el => { el.textContent = romeNow().y; });

})();
