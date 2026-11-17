/* I Tre Fratelli — interazioni */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---------- Entrata hero ---------- */
  $$('.hero [data-rise]').forEach((el, i) => el.style.setProperty('--i', i));
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-loaded')));

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
    document.body.style.overflow = open ? 'hidden' : '';
    nav.classList.toggle('is-solid', open || window.scrollY > 40);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', mobileMenu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileMenu.hidden) { setMenu(false); toggle.focus(); } });

  /* ---------- Piatto che ruota con lo scroll ---------- */
  const plate = $('.plate');
  const plateImg = $('.plate__img');
  if (!reduce) setTimeout(() => plate.classList.add('is-spinning'), 2300);

  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    if (mobileMenu.hidden) nav.classList.toggle('is-solid', y > 40);
    actionbar.classList.toggle('is-on', y > hero.offsetHeight * 0.6);
    if (!reduce) plateImg.style.setProperty('--plate-rot', (y * 0.08).toFixed(2) + 'deg');
    updateSfoglia();
    ticking = false;
  };
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

  /* ---------- La sfoglia (canvas guidato dallo scroll) ---------- */
  const sfSec = $('#pasta');
  const cv = $('#sfoglia-canvas');
  const sctx = cv.getContext('2d');
  const steps = $$('.steps li');
  let sf = { target: 0, cur: 0, w: 0, h: 0, dpr: 1, visible: false, running: false, t: 0 };

  // Particelle di farina e texture pre-generate
  const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(1988);
  const flour = Array.from({ length: 700 }, () => {
    const a = rnd() * Math.PI * 2, r = Math.pow(rnd(), .6);
    return { a, r, s: .6 + rnd() * 1.8, o: .35 + rnd() * .6, j: rnd() };
  });
  const dust = Array.from({ length: 140 }, () => ({ x: rnd(), y: rnd(), s: .5 + rnd() * 1.4, o: .2 + rnd() * .5 }));
  const grain = Array.from({ length: 34 }, () => ({ y: rnd(), a: rnd() * 6, w: .5 + rnd() * 1.5, o: .04 + rnd() * .08 }));
  const tex = document.createElement('canvas'); tex.width = tex.height = 160;
  (() => { const t = tex.getContext('2d'); t.fillStyle = '#f2cf72'; t.fillRect(0, 0, 160, 160);
    for (let i = 0; i < 1600; i++) { t.fillStyle = rnd() > .5 ? 'rgba(255,240,190,.35)' : 'rgba(190,140,40,.16)'; t.fillRect(rnd() * 160, rnd() * 160, 1 + rnd() * 1.5, 1 + rnd() * 1.5); } })();
  let doughPattern = null;

  function sizeSfoglia() {
    const r = cv.getBoundingClientRect();
    sf.dpr = Math.min(window.devicePixelRatio || 1, 2);
    sf.w = r.width; sf.h = r.height;
    cv.width = r.width * sf.dpr; cv.height = r.height * sf.dpr;
    doughPattern = sctx.createPattern(tex, 'repeat');
    drawSfoglia();
  }
  function updateSfoglia() {
    const r = sfSec.getBoundingClientRect();
    const total = sfSec.offsetHeight - window.innerHeight;
    sf.target = reduce ? 1 : clamp(-r.top / (total || 1));
  }
  function roundRect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function drawSfoglia() {
    const c = sctx, W = sf.w, H = sf.h, p = sf.cur;
    if (!W) return;
    c.setTransform(sf.dpr, 0, 0, sf.dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, M = Math.min(W, H);

    // Tagliere
    const bw = W * .96, bh = H * .9, bx = cx - bw / 2, by = cy - bh / 2;
    roundRect(c, bx, by, bw, bh, 6);
    const bg = c.createLinearGradient(bx, by, bx + bw, by + bh);
    bg.addColorStop(0, '#4a3322'); bg.addColorStop(1, '#3a281a');
    c.fillStyle = bg; c.fill();
    c.save(); c.clip();
    grain.forEach(g => { c.strokeStyle = `rgba(255,220,170,${g.o})`; c.lineWidth = g.w; c.beginPath();
      for (let x = 0; x <= bw; x += 20) { const yy = by + g.y * bh + Math.sin(x * .01 + g.a) * 6; x ? c.lineTo(bx + x, yy) : c.moveTo(bx, yy); } c.stroke(); });
    c.restore();

    const pA = clamp(p / .26), pB = clamp((p - .26) / .32), pC = clamp((p - .58) / .16), pD = clamp((p - .74) / .26);
    const eA = ease(pA), eB = ease(pB), eD = ease(pD);
    const R = M * .34;
    const rb = R * .5 * Math.max(eA, .001);
    const SW = W * .78, SH = H * .6;

    // Farina
    if (pB < 1) {
      const fa = (1 - eA * .85) * (1 - eB);
      flour.forEach(f => {
        const rr = f.r * R * lerp(1, .55, eA) * (1 + Math.sin(f.j * 20 + sf.t * .5) * .01);
        const a = f.a + eA * 1.4 * (1 - f.r);
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * .92;
        c.fillStyle = `rgba(250,246,238,${f.o * fa})`;
        c.beginPath(); c.arc(x, y, f.s, 0, Math.PI * 2); c.fill();
      });
      // Fontana (bordo morbido)
      const fg = c.createRadialGradient(cx, cy, R * .2, cx, cy, R * 1.05);
      fg.addColorStop(0, `rgba(248,244,236,${.0})`);
      fg.addColorStop(.35, `rgba(248,244,236,${.75 * fa})`);
      fg.addColorStop(.75, `rgba(240,236,226,${.45 * fa})`);
      fg.addColorStop(1, 'rgba(240,236,226,0)');
      c.fillStyle = fg; c.beginPath(); c.arc(cx, cy, R * 1.05 * lerp(1, .6, eA), 0, Math.PI * 2); c.fill();
    }

    // Tuorli che si mescolano
    if (pA < 1) {
      for (let i = 0; i < 3; i++) {
        const ang = i * 2.094 + eA * 5;
        const off = R * .2 * (1 - eA);
        const yr = R * .2 * (1 - eA * .9);
        const x = cx + Math.cos(ang) * off, y = cy + Math.sin(ang) * off;
        const yg = c.createRadialGradient(x - yr * .3, y - yr * .35, yr * .1, x, y, yr);
        yg.addColorStop(0, `rgba(255,214,90,${1 - eA * .7})`);
        yg.addColorStop(.6, `rgba(244,160,20,${1 - eA * .7})`);
        yg.addColorStop(1, `rgba(220,120,10,${(1 - eA) * .9})`);
        c.fillStyle = yg; c.beginPath(); c.arc(x, y, yr, 0, Math.PI * 2); c.fill();
        c.fillStyle = `rgba(255,255,255,${.55 * (1 - eA)})`;
        c.beginPath(); c.ellipse(x - yr * .35, y - yr * .4, yr * .22, yr * .12, -.6, 0, Math.PI * 2); c.fill();
      }
    }

    // Impasto: palla -> sfoglia -> strisce
    if (pA > 0) {
      const w = lerp(rb * 2, SW, eB), h = lerp(rb * 2, SH, eB);
      const x = cx - w / 2, y = cy - h / 2;
      const rad = lerp(rb, 8, eB);
      // ombra
      c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 24; c.shadowOffsetY = 10;

      if (pC < 1 || pD === 0) {
        roundRect(c, x, y, w, h, rad);
        c.fillStyle = doughPattern || '#f2cf72'; c.fill();
        c.restore();
        // volume
        const vg = c.createRadialGradient(cx - w * .2, cy - h * .25, 0, cx, cy, Math.max(w, h) * .7);
        vg.addColorStop(0, `rgba(255,248,210,${.45 - eB * .25})`);
        vg.addColorStop(1, `rgba(150,95,20,${.35 - eB * .2})`);
        roundRect(c, x, y, w, h, rad); c.fillStyle = vg; c.fill();
        // spolverata
        if (eB > .2) dust.forEach(d => { c.fillStyle = `rgba(255,252,244,${d.o * (eB - .2)})`; c.fillRect(x + d.x * w, y + d.y * h, d.s, d.s); });

        // tagli
        const N = 11, sw = SW / N;
        if (pC > 0) {
          const kx = x + pC * (SW + 20);
          c.strokeStyle = 'rgba(120,72,10,.55)'; c.lineWidth = 1.4;
          for (let i = 1; i < N; i++) { const lx = x + i * sw; if (lx < kx) { c.beginPath(); c.moveTo(lx, y + 2); c.lineTo(lx, y + h - 2); c.stroke(); } }
          // coltello
          if (pC < 1) drawKnife(c, Math.min(kx, x + SW), y, h);
        }

        // mattarello
        if (pB > 0 && pB < 1) {
          const px = cx + Math.sin(pB * Math.PI * 3.2 - Math.PI / 2) * w * .42;
          drawPin(c, px, cy, h + M * .16, pB);
        }
      } else {
        c.restore();
        // strisce di tagliatelle che si separano e ondeggiano
        const N = 11, sw = SW / N, gap = sw * .55 * eD;
        const totalW = SW + gap * (N - 1);
        const scale = Math.min(1, (W * .86) / totalW);
        const x0 = cx - (totalW * scale) / 2;
        const swS = sw * scale * (1 - eD * .15);
        for (let i = 0; i < N; i++) {
          const sx = x0 + i * (sw + gap) * scale + (sw * scale - swS) / 2;
          const amp = sw * .38 * eD;
          const phase = i * .9 + sf.t * .9;
          const lift = Math.sin(i * 1.7) * 14 * eD;
          const top = y + lift, bot = y + h + lift - Math.abs(Math.cos(i)) * 22 * eD;
          c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 14; c.shadowOffsetY = 6;
          c.beginPath();
          const seg = 24;
          for (let k = 0; k <= seg; k++) { const yy = lerp(top, bot, k / seg); const xx = sx + Math.sin(k / seg * 5 + phase) * amp; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
          for (let k = seg; k >= 0; k--) { const yy = lerp(top, bot, k / seg); const xx = sx + swS + Math.sin(k / seg * 5 + phase + .25) * amp; c.lineTo(xx, yy); }
          c.closePath(); c.fillStyle = doughPattern || '#f2cf72'; c.fill(); c.restore();
          // luce sulla curva
          const lg = c.createLinearGradient(sx - amp, 0, sx + swS + amp, 0);
          lg.addColorStop(0, 'rgba(150,95,20,.25)'); lg.addColorStop(.5, 'rgba(255,248,215,.18)'); lg.addColorStop(1, 'rgba(150,95,20,.3)');
          c.fillStyle = lg; c.fill();
        }
      }
    }
  }
  function drawPin(c, x, y, len, t) {
    const r = 15;
    c.save();
    c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 20; c.shadowOffsetX = 8;
    const g = c.createLinearGradient(x - r, 0, x + r, 0);
    g.addColorStop(0, '#8a5a32'); g.addColorStop(.35, '#d9a86c'); g.addColorStop(.55, '#c48e52'); g.addColorStop(1, '#6e4524');
    roundRect(c, x - r, y - len / 2, r * 2, len, r); c.fillStyle = g; c.fill();
    c.restore();
    // venature che scorrono (rotazione)
    c.save(); roundRect(c, x - r, y - len / 2, r * 2, len, r); c.clip();
    c.strokeStyle = 'rgba(90,55,25,.35)'; c.lineWidth = 1;
    for (let i = 0; i < 7; i++) { const yy = y - len / 2 + ((i * len / 7 + t * 900) % len); c.beginPath(); c.moveTo(x - r, yy); c.quadraticCurveTo(x, yy + 6, x + r, yy); c.stroke(); }
    c.restore();
    // manici
    [-1, 1].forEach(s => { const hy = y + s * (len / 2 + 22); const hg = c.createLinearGradient(x - 9, 0, x + 9, 0);
      hg.addColorStop(0, '#6e4524'); hg.addColorStop(.5, '#b9824a'); hg.addColorStop(1, '#5a381c');
      roundRect(c, x - 9, hy - 24, 18, 48, 9); c.fillStyle = hg; c.fill(); });
  }
  function drawKnife(c, x, y, h) {
    c.save();
    c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 16; c.shadowOffsetX = 6;
    const bg = c.createLinearGradient(x - 6, 0, x + 16, 0);
    bg.addColorStop(0, '#f4f4f2'); bg.addColorStop(.5, '#b9bcc0'); bg.addColorStop(1, '#7c8086');
    c.beginPath(); c.moveTo(x, y - 30); c.lineTo(x + 18, y - 30); c.lineTo(x + 18, y + h * .55); c.lineTo(x, y + h * .75); c.closePath();
    c.fillStyle = bg; c.fill();
    roundRect(c, x - 1, y - 30 - 90, 20, 92, 6); c.fillStyle = '#2b1d14'; c.fill();
    c.fillStyle = '#c9a76b'; [y - 100, y - 70, y - 44].forEach(yy => { c.beginPath(); c.arc(x + 9, yy, 2.4, 0, Math.PI * 2); c.fill(); });
    c.restore();
  }
  function sfLoop() {
    if (sf.running) return; sf.running = true;
    const tick = () => {
      if (!sf.visible) { sf.running = false; return; }
      sf.cur += (sf.target - sf.cur) * .1;
      if (Math.abs(sf.target - sf.cur) < .0005) sf.cur = sf.target;
      sf.t += .016;
      drawSfoglia();
      const s = sf.cur < .26 ? 0 : sf.cur < .58 ? 1 : 2;
      steps.forEach((li, i) => li.classList.toggle('is-active', i === s));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  window.addEventListener('resize', sizeSfoglia);
  sizeSfoglia(); updateSfoglia();
  if (reduce) { sf.cur = 1; drawSfoglia(); steps.forEach(li => li.classList.add('is-active')); }
  else new IntersectionObserver(([en]) => { sf.visible = en.isIntersecting; if (sf.visible) sfLoop(); }).observe(cv);

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

  /* ---------- Prenotazione via WhatsApp ---------- */
  const form = $('#book-form');
  const fDate = $('#f-date'), fTime = $('#f-time'), fName = $('#f-name'), fNotes = $('#f-notes'), fPeople = $('#f-people');
  const PHONE = '393356780073';
  const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const dayOf = v => { const [y, m, d] = v.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
  const TIMES = [720, 750, 780, 810, 840, 1140, 1170, 1200, 1230, 1260, 1290];
  function availableTimes(v) {
    if (!v || dayOf(v) === 1) return [];
    const n = romeNow();
    const today = iso(n.y, n.mo, n.d);
    if (v < today) return [];
    return TIMES.filter(t => v !== today || t > n.min + 30);
  }
  function fillTimes() {
    const v = fDate.value, list = availableTimes(v), prev = fTime.value;
    fTime.innerHTML = '';
    if (!list.length) {
      const o = new Option(v && dayOf(v) === 1 ? 'Lunedì chiuso' : 'Nessun orario', ''); fTime.add(o); fTime.disabled = true;
    } else {
      fTime.disabled = false;
      let lastGroup = null, grp;
      list.forEach(t => {
        const g = t < 900 ? 'Pranzo' : 'Cena';
        if (g !== lastGroup) { grp = document.createElement('optgroup'); grp.label = g; fTime.appendChild(grp); lastGroup = g; }
        grp.appendChild(new Option(hhmm(t), hhmm(t)));
      });
      if ([...fTime.options].some(o => o.value === prev)) fTime.value = prev;
      else if (list.includes(1200)) fTime.value = '20:00';
    }
  }
  (function initDate() {
    const n = romeNow();
    fDate.min = iso(n.y, n.mo, n.d);
    let base = new Date(Date.UTC(n.y, n.mo - 1, n.d));
    for (let k = 0; k < 8; k++) {
      const v = iso(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate());
      if (availableTimes(v).length) { fDate.value = v; break; }
      base.setUTCDate(base.getUTCDate() + 1);
    }
    fillTimes();
  })();
  fDate.addEventListener('change', () => { fillTimes(); validate(false); });
  $$('.stepper button').forEach(b => b.addEventListener('click', () => {
    const v = clamp(+fPeople.value + +b.dataset.step, 1, 30); fPeople.value = v; fPeople.textContent = v;
  }));
  function setErr(input, id, msg) {
    $('#' + id).textContent = msg || '';
    if (msg) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', id); }
    else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
    return !msg;
  }
  function validate(all = true) {
    let ok = true;
    if (all) ok = setErr(fName, 'e-name', fName.value.trim().length < 2 ? 'Scrivi il nome per la prenotazione.' : '') && ok;
    const v = fDate.value;
    let dMsg = '';
    if (!v) dMsg = 'Scegli il giorno.';
    else if (dayOf(v) === 1) dMsg = 'Il lunedì siamo chiusi: scegli un altro giorno.';
    else if (!availableTimes(v).length) dMsg = 'Per questo giorno non ci sono più orari: scegli un altro giorno.';
    ok = setErr(fDate, 'e-date', dMsg) && ok;
    if (!dMsg) ok = setErr(fTime, 'e-time', fTime.value ? '' : 'Scegli un orario.') && ok;
    else setErr(fTime, 'e-time', '');
    return ok;
  }
  fName.addEventListener('blur', () => { if (fName.value) validate(); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validate()) { const bad = $('[aria-invalid="true"]', form); if (bad) bad.focus(); return; }
    const [y, m, d] = fDate.value.split('-').map(Number);
    const dateTxt = new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Rome' });
    const people = +fPeople.value;
    const lines = [
      'Buongiorno! Vorrei prenotare un tavolo da I Tre Fratelli.',
      `Nome: ${fName.value.trim()}`,
      `Giorno: ${dateTxt}`,
      `Orario: ${fTime.value}`,
      `Persone: ${people}`
    ];
    if (fNotes.value.trim()) lines.push(`Note: ${fNotes.value.trim()}`);
    const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(lines.join('\n'))}`;
    const w = window.open(url, '_blank', 'noopener');
    if (!w) window.location.href = url;
  });
})();
