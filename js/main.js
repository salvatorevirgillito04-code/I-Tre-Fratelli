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
    if (el.classList.contains('reveal') && plateEl && !reduce) setTimeout(() => plateEl.classList.add('is-spinning'), 2300);
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
  const plateImg = $('.plate__img');
  const slices = $('.slices');

  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    if (mobileMenu.hidden) nav.classList.toggle('is-solid', y > 40);
    actionbar.classList.toggle('is-on', y > hero.offsetHeight * 0.6);
    if (!reduce) {
      plateImg.style.setProperty('--plate-rot', (y * 0.06).toFixed(2) + 'deg');
      if (slices) {
        const r = slices.getBoundingClientRect(), vh = window.innerHeight;
        const p = clamp((vh * 0.9 - r.top) / (vh * 0.9));
        slices.style.setProperty('--p', p.toFixed(3));
      }
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });


  /* ---------- Foglie d'oro (canvas) ---------- */
  class GoldLeaf {
    constructor(canvas, mode) {
      this.c = canvas; this.ctx = canvas.getContext('2d'); this.mode = mode;
      this.f = []; this.visible = false; this.burstDone = false;
      this.resize(); window.addEventListener('resize', () => this.resize());
      new IntersectionObserver(([en]) => {
        this.visible = en.isIntersecting;
        if (this.visible) {
          if (this.mode === 'burst' && !this.burstDone) { this.burstDone = true; setTimeout(() => this.burst(), 450); }
          this.loop();
        }
      }, { threshold: 0.25 }).observe(canvas);
    }
    resize() {
      const r = this.c.getBoundingClientRect(); this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = r.width; this.h = r.height; this.c.width = this.w * this.dpr; this.c.height = this.h * this.dpr;
      this.max = Math.round(Math.min(this.w, 1440) / 1440 * (this.mode === 'burst' ? 16 : 22)) + 6;
    }
    make(x, y, vx, vy) {
      const n = 5 + Math.floor(Math.random() * 3), pts = [];
      for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + Math.random() * .5; const rr = .55 + Math.random() * .45; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
      return { x, y, vx, vy, s: 5 + Math.random() * 11, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .06, ph: Math.random() * 6.28, vp: .03 + Math.random() * .05, sw: Math.random() * 6.28, pts };
    }
    burst() {
      const cx = this.w / 2, cy = this.h * 0.42;
      for (let k = 0; k < 46; k++) {
        const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.5, v = 3 + Math.random() * 7;
        this.f.push(this.make(cx + (Math.random() - .5) * 60, cy + (Math.random() - .5) * 60, Math.cos(a) * v, Math.sin(a) * v));
      }
    }
    loop() {
      if (this.running) return; this.running = true;
      const step = () => {
        if (!this.visible) { this.running = false; return; }
        const { ctx } = this;
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.clearRect(0, 0, this.w, this.h);
        if (this.f.length < this.max && Math.random() < .08) this.f.push(this.make(Math.random() * this.w, -20, (Math.random() - .5) * .3, .3 + Math.random() * .4));
        for (let i = this.f.length - 1; i >= 0; i--) {
          const q = this.f[i];
          q.vx *= .975; q.vy = q.vy * .975 + .025; if (q.vy > 1.1) q.vy = 1.1;
          q.sw += .02; q.x += q.vx + Math.sin(q.sw) * .45; q.y += q.vy; q.rot += q.vr; q.ph += q.vp;
          if (q.y > this.h + 30 || q.x < -40 || q.x > this.w + 40) { this.f.splice(i, 1); continue; }
          const flip = Math.cos(q.ph);
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.scale(1, Math.max(.12, Math.abs(flip)));
          const g = ctx.createLinearGradient(-q.s, -q.s, q.s, q.s);
          const lit = flip > 0;
          g.addColorStop(0, lit ? '#fff3c4' : '#d9b45f'); g.addColorStop(.5, lit ? '#e2bd63' : '#a77d32'); g.addColorStop(1, lit ? '#a57a2c' : '#6e4f1c');
          ctx.fillStyle = g; ctx.globalAlpha = .92;
          ctx.beginPath(); q.pts.forEach(([px, py], k) => (k ? ctx.lineTo(px * q.s, py * q.s) : ctx.moveTo(px * q.s, py * q.s))); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }
  if (!reduce) $$('[data-leaf]').forEach(c => new GoldLeaf(c, c.dataset.leaf));

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
