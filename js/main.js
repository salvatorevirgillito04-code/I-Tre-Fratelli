/* I Tre Fratelli — interazioni */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- Sipario d'apertura e entrata hero ---------- */
  $$('.hero [data-rise]').forEach((el, i) => el.style.setProperty('--i', i));
  const intro = $('.intro');
  const introOn = intro && !reduce && getComputedStyle(intro).display !== 'none';
  const startHero = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-loaded')));
    if (!reduce) setTimeout(() => $('.plate').classList.add('is-spinning'), 2300);
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
    const go = () => setTimeout(lift, Math.max(0, 1700 - (performance.now() - t0)));
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

  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    if (mobileMenu.hidden) nav.classList.toggle('is-solid', y > 40);
    actionbar.classList.toggle('is-on', y > hero.offsetHeight * 0.6);
    if (!reduce) plateImg.style.setProperty('--plate-rot', (y * 0.08).toFixed(2) + 'deg');
    ticking = false;
  };
  /* ---------- Svelamento di foto e manifesto ---------- */
  const reveals = $$('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) reveals.forEach(el => el.classList.add('is-in'));
  else {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    reveals.forEach(el => io.observe(el));
  }

  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- Braci (canvas) ---------- */
  class Embers {
    constructor(canvas, density) {
      this.c = canvas; this.ctx = canvas.getContext('2d');
      this.density = density; this.p = []; this.mouse = { x: -999, y: -999 };
      this.visible = false; this.resize();
      window.addEventListener('resize', () => this.resize());
      const host = canvas.parentElement;
      host.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top; });
      host.addEventListener('pointerleave', () => { this.mouse.x = this.mouse.y = -999; });
      new IntersectionObserver(([en]) => { this.visible = en.isIntersecting; if (this.visible) this.loop(); }).observe(canvas);
    }
    resize() {
      const r = this.c.getBoundingClientRect(); this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = r.width; this.h = r.height;
      this.c.width = this.w * this.dpr; this.c.height = this.h * this.dpr;
      this.max = Math.round(this.w / 1440 * this.density) + 18;
    }
    spawn(initial) {
      return {
        x: Math.random() * this.w,
        y: initial ? Math.random() * this.h : this.h + 10,
        vx: (Math.random() - .5) * .4, vy: -(.5 + Math.random() * 1.4),
        s: .6 + Math.random() * 2.2, life: 0, max: 220 + Math.random() * 320,
        hue: 18 + Math.random() * 26, f: Math.random() * 6
      };
    }
    loop() {
      if (!this.visible || this.running) return;
      this.running = true;
      const step = () => {
        if (!this.visible) { this.running = false; return; }
        const { ctx } = this;
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.clearRect(0, 0, this.w, this.h);
        ctx.globalCompositeOperation = 'lighter';
        while (this.p.length < this.max) this.p.push(this.spawn(this.p.length < this.max * .5 && !this.started));
        this.started = true;
        for (let i = this.p.length - 1; i >= 0; i--) {
          const q = this.p[i];
          q.life++; q.f += .15;
          q.vx += Math.sin(q.life * .03 + q.f) * .012;
          const dx = q.x - this.mouse.x, dy = q.y - this.mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 14000) { const d = Math.sqrt(d2) || 1; q.vx += dx / d * .35; q.vy += dy / d * .2; }
          q.vx *= .985; q.x += q.vx; q.y += q.vy;
          const t = q.life / q.max;
          const a = Math.sin(Math.PI * Math.min(t, 1)) * (.55 + .45 * Math.sin(q.f * 2));
          if (t >= 1 || q.y < -20) { this.p.splice(i, 1); continue; }
          const r = q.s * (1 - t * .5);
          const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r * 4);
          g.addColorStop(0, `hsla(${q.hue + 15},100%,75%,${a})`);
          g.addColorStop(.25, `hsla(${q.hue},100%,55%,${a * .6})`);
          g.addColorStop(1, `hsla(${q.hue},100%,45%,0)`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, r * 4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }
  if (!reduce) {
    $$('[data-embers]').forEach(c => new Embers(c, c.dataset.embers === 'hero' ? 70 : 110));
  }


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
