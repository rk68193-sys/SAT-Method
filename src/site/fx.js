  /* =================== Prize looks: auras, right-answer effects, reveals and moving backgrounds =================== */
  /* Every animation draws on a canvas that runs only while it is on screen (backgrounds at 30 frames a second), stops in a
     hidden tab, never runs inside a timed module, and holds one still frame on a device set to reduce motion. */
  var FX_REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var FX_TAU = Math.PI * 2;
  function fxR(a, b) { return a + Math.random() * (b - a); }
  /* the prize themes' colors, for swatches and previews (the same values as src/tools/themes.py) */
  var FX_PAL = {"prize-graphite":{"paper":"#F5F5F2","card":"#FFFFFF","ink":"#1C1C1A","line":"#E2E2DB","act":"#2E2E2B","act_ink":"#FFFFFF","ok":"#15803D","ok_soft":"#DCFCE7"},"prize-sunrise":{"paper":"#FFF6F0","card":"#FFFFFF","ink":"#2E1A10","line":"#F8DDCD","act":"#C2410C","act_ink":"#FFFFFF","ok":"#15803D","ok_soft":"#DCFCE7"},"prize-ocean":{"paper":"#F0FAFA","card":"#FFFFFF","ink":"#0B2626","line":"#D2EBEB","act":"#0F766E","act_ink":"#FFFFFF","ok":"#15803D","ok_soft":"#DCFCE7"},"prize-highlighter":{"paper":"#FFFDF2","card":"#FFFFFF","ink":"#1A1A12","line":"#F1EBC8","act":"#FACC15","act_ink":"#1A1A12","ok":"#15803D","ok_soft":"#DCFCE7"},"prize-library":{"paper":"#FBF7EF","card":"#FFFDF8","ink":"#2A1D17","line":"#E9DFCF","act":"#7A1F2B","act_ink":"#FFFFFF","ok":"#15803D","ok_soft":"#DCFCE7"},"prize-varsity":{"paper":"#F5F6FA","card":"#FFFFFF","ink":"#141A33","line":"#DFE2EC","act":"#1E2A5A","act_ink":"#FFFFFF","ok":"#15803D","ok_soft":"#DCFCE7"},"prize-chalkboard":{"paper":"#1E2B24","card":"#26352D","ink":"#F1F5EE","line":"#34473C","act":"#F1F5EE","act_ink":"#1E2B24","ok":"#4ADE80","ok_soft":"#12301F"},"prize-blueprint":{"paper":"#0E2A52","card":"#133566","ink":"#F0F6FF","line":"#23497F","act":"#F0F6FF","act_ink":"#0E2A52","ok":"#4ADE80","ok_soft":"#12301F"},"prize-lamplight":{"paper":"#0F1424","card":"#171D33","ink":"#F5F1E8","line":"#262E4A","act":"#FBBF24","act_ink":"#1A1405","ok":"#4ADE80","ok_soft":"#12301F"},"prize-arcade":{"paper":"#0D0A1A","card":"#171230","ink":"#F8F5FF","line":"#2A2150","act":"#F472B6","act_ink":"#14051A","ok":"#4ADE80","ok_soft":"#12301F"},"prize-aurora":{"paper":"#071A1F","card":"#0D252C","ink":"#EFFBF8","line":"#18363E","act":"#5EEAD4","act_ink":"#04201C","ok":"#4ADE80","ok_soft":"#12301F"},"prize-gold":{"paper":"#0A0907","card":"#15130E","ink":"#FBF6E9","line":"#2A2619","act":"#E0B54A","act_ink":"#1A1405","ok":"#4ADE80","ok_soft":"#12301F"},"prize-holo":{"paper":"#F7F6FD","card":"#FFFFFF","ink":"#16142B","line":"#E4E1F5","act":"#1E1B4B","act_ink":"#FFFFFF","ok":"#15803D","ok_soft":"#DCFCE7"},"prize-nebula":{"paper":"#0B0820","card":"#15112E","ink":"#F5F3FF","line":"#2A2352","act":"#E879F9","act_ink":"#1A0526","ok":"#4ADE80","ok_soft":"#12301F"},"prize-synthwave":{"paper":"#120A26","card":"#1C1238","ink":"#FFF5FB","line":"#33215E","act":"#F472B6","act_ink":"#1A0512","ok":"#4ADE80","ok_soft":"#12301F"},"prize-inferno":{"paper":"#120806","card":"#1E0F0A","ink":"#FFF4EC","line":"#3A1E14","act":"#F97316","act_ink":"#1C0A02","ok":"#4ADE80","ok_soft":"#12301F"},"prize-abyss":{"paper":"#030B18","card":"#08162B","ink":"#E6F6FF","line":"#12304F","act":"#2DD4BF","act_ink":"#03201C","ok":"#4ADE80","ok_soft":"#12301F"},"prize-terminal":{"paper":"#030806","card":"#07110B","ink":"#D5FFE0","line":"#123322","act":"#22C55E","act_ink":"#021208","ok":"#4ADE80","ok_soft":"#12301F"},"prize-enchanted":{"paper":"#0C0718","card":"#160E28","ink":"#F7F1FF","line":"#2B1F48","act":"#A3E635","act_ink":"#142004","ok":"#4ADE80","ok_soft":"#12301F"},"prize-haunted":{"paper":"#0D0A14","card":"#17121F","ink":"#F3EEF9","line":"#2A2238","act":"#F97316","act_ink":"#1A0B02","ok":"#4ADE80","ok_soft":"#12301F"},"prize-eldritch":{"paper":"#04100E","card":"#0A1B18","ink":"#E8FFF8","line":"#143630","act":"#C4B5FD","act_ink":"#12062B","ok":"#4ADE80","ok_soft":"#12301F"},"prize-lanterns":{"paper":"#0E0B24","card":"#181436","ink":"#FFF7EA","line":"#2C2556","act":"#FBBF24","act_ink":"#1F1403","ok":"#4ADE80","ok_soft":"#12301F"},"prize-metropolis":{"paper":"#070B18","card":"#0E1426","ink":"#F2F5FF","line":"#1C2747","act":"#FBBF24","act_ink":"#1F1403","ok":"#4ADE80","ok_soft":"#12301F"},"prize-summit":{"paper":"#120E1E","card":"#1B162C","ink":"#FFF4F1","line":"#2F2748","act":"#FDA4AF","act_ink":"#2A0A12","ok":"#4ADE80","ok_soft":"#12301F"},"prize-beacon":{"paper":"#06121F","card":"#0B1B2D","ink":"#EEF4FB","line":"#1B324B","act":"#F5B547","act_ink":"#1C1204","ok":"#4ADE80","ok_soft":"#12301F"}};
  var FX_LIVE_THEMES = { 'prize-synthwave': 1, 'prize-inferno': 1, 'prize-nebula': 1, 'prize-holo': 1, 'prize-abyss': 1, 'prize-terminal': 1, 'prize-enchanted': 1, 'prize-haunted': 1, 'prize-eldritch': 1, 'prize-lanterns': 1 };
  function fxThemeSwatch(key) { var p = FX_PAL[key]; return p ? [p.paper, p.act] : ['#FFFFFF', '#0A0A0A']; }

  /* ---------- drawing helpers ---------- */
  var FX_SPR = {};
  function fxSprite(rgb) {
    var c = FX_SPR[rgb]; if (c) { return c; }
    c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(0.18, 'rgba(' + rgb + ',.9)'); gr.addColorStop(0.45, 'rgba(' + rgb + ',.28)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); FX_SPR[rgb] = c; return c;
  }
  function fxGlow(c, rgb, x, y, r, a) { if (!(a > 0) || !(r > 0)) { return; } c.globalAlpha = Math.min(1, a); c.drawImage(fxSprite(rgb), x - r, y - r, r * 2, r * 2); c.globalAlpha = 1; }
  function fxStar4(c, x, y, r, a, col) { if (!(a > 0) || !(r > 0)) { return; } c.globalAlpha = Math.min(1, a); c.fillStyle = col; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); c.globalAlpha = 1; }
  function fxJag(x1, y1, x2, y2, rough, iters) {
    var pts = [[x1, y1], [x2, y2]];
    for (var it = 0; it < iters; it++) {
      var np = [pts[0]];
      for (var i = 0; i < pts.length - 1; i++) { var a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, off = fxR(-1, 1) * rough * len / 2; np.push([(a[0] + b[0]) / 2 - dy / len * off, (a[1] + b[1]) / 2 + dx / len * off], b); }
      pts = np; rough *= 0.62;
    }
    return pts;
  }
  function fxTrace(c, pts) { c.beginPath(); for (var i = 0; i < pts.length; i++) { if (i) { c.lineTo(pts[i][0], pts[i][1]); } else { c.moveTo(pts[i][0], pts[i][1]); } } }
  function fxBolt(c, pts, a, rgb) { c.lineJoin = 'round'; c.lineCap = 'round'; [[9, 0.16], [4, 0.45], [1.6, 1]].forEach(function (L, i) { c.lineWidth = L[0]; c.strokeStyle = i === 2 ? 'rgba(255,255,255,' + a + ')' : 'rgba(' + rgb + ',' + (L[1] * a) + ')'; fxTrace(c, pts); c.stroke(); }); }
  function fxRR(c, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function fxRing(c, x, y, rx, ry, rgb, a, w) { if (!(a > 0)) { return; } c.globalAlpha = Math.min(1, a); c.lineWidth = w; c.strokeStyle = 'rgb(' + rgb + ')'; c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, FX_TAU); c.stroke(); c.globalAlpha = 1; }
  function fxBeam(c, x, y, a, len, wid, col) { var g = c.createLinearGradient(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.arc(x, y, len, a - wid, a + wid); c.closePath(); c.fill(); }
  function fxEase(u) { return u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u); }
  function fxEnv(t, a, b, c2, d) { return t < a ? 0 : t < b ? (t - a) / (b - a) : t < c2 ? 1 : t < d ? 1 - (t - c2) / (d - c2) : 0; }
  function fxBurst(x, y, n, cols, vmin, vmax) { var P = []; for (var i = 0; i < n; i++) { var a = fxR(0, FX_TAU), v = fxR(vmin, vmax); P.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, l: 0, m: fxR(0.5, 1.2), rgb: cols[i % cols.length], z: fxR(1.8, 4) }); } return P; }
  function fxStep(c, P, dt) { for (var i = 0; i < P.length; i++) { var p = P[i]; if (p.l > p.m) { continue; } p.l += dt; var f = Math.pow(0.22, dt); p.vx *= f; p.vy *= f; p.x += p.vx * dt; p.y += p.vy * dt; fxGlow(c, p.rgb, p.x, p.y, p.z * 2.4, 1 - p.l / p.m); } }
  function fxLum(h) { h = String(h || '').trim().replace('#', ''); if (h.length !== 6) { return 1; } var c = [0, 2, 4].map(function (i) { var x = parseInt(h.slice(i, i + 2), 16) / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  /* the page's own colors, for backgrounds that sit on any theme */
  /* made-up runes, a few strokes each on a 2 x 3 grid (the Rune ring, the Spell circle, the Enchanted theme) */
  var FX_RSEG = [[0, 0, 0, 2], [1, 0, 1, 2], [0, 0, 1, 1], [1, 0, 0, 1], [0, 1, 1, 2], [1, 1, 0, 2], [0, 0, 1, 0], [0, 1, 1, 1], [0, 2, 1, 2], [0, 0, 1, 2], [1, 0, 0, 2], [0.5, 0, 0.5, 2]], FX_RUNES = [];
  (function () { for (var i = 0; i < 16; i++) { var g = [FX_RSEG[[0, 1, 11][i % 3]]], n = 2 + (i * 7) % 3; for (var j = 0; j < n; j++) { g.push(FX_RSEG[(i * 5 + j * 3 + 2) % FX_RSEG.length]); } FX_RUNES.push(g); } })();
  function fxRune(c, x, y, z, i, col) { var g = FX_RUNES[((i % 16) + 16) % 16]; c.save(); c.translate(x, y); c.lineWidth = Math.max(1, z / 5); c.lineCap = 'round'; c.strokeStyle = col; c.beginPath(); g.forEach(function (q) { c.moveTo((q[0] - 0.5) * z, (q[1] - 1) * z * 0.8); c.lineTo((q[2] - 0.5) * z, (q[3] - 1) * z * 0.8); }); c.stroke(); c.restore(); }
  /* a jellyfish: a pulsing bell over trailing tentacles (the Jellyfish aura, the Abyss theme) */
  function fxJelly(c, x, y, sz, rgb, hi, t, ph, k) {
    var pulse = Math.sin(t * 2.6 + ph), bw = sz * (1 + 0.18 * pulse), bh = sz * (0.78 - 0.12 * pulse), n, q, f;
    c.lineCap = 'round'; c.strokeStyle = 'rgb(' + rgb + ')';
    for (n = 0; n < 7; n++) { var tx = x - bw * 0.75 + n * bw * 0.25; c.globalAlpha = 0.4 * k; c.lineWidth = n % 2 ? 1 : 1.8; c.beginPath(); c.moveTo(tx, y + 1); for (q = 1; q <= 10; q++) { c.lineTo(tx + Math.sin(t * 3 + q * 0.6 + n + ph) * (1 + q * 0.5) * sz / 20, y + 1 + q * sz * (0.2 + 0.03 * pulse)); } c.stroke(); }
    fxGlow(c, rgb, x, y - bh * 0.3, bw * 2.2, 0.35 * k);
    var g = c.createRadialGradient(x, y - bh * 0.6, 1, x, y - bh * 0.2, bw); g.addColorStop(0, hi); g.addColorStop(1, 'rgba(' + rgb + ',.15)');
    c.globalAlpha = 0.6 * k; c.fillStyle = g; c.beginPath(); c.ellipse(x, y, bw, bh, 0, Math.PI, FX_TAU); c.quadraticCurveTo(x, y + bh * 0.3, x - bw, y); c.fill();
    c.globalAlpha = 0.85 * k; c.strokeStyle = hi; c.lineWidth = 1.2; c.beginPath(); for (f = 0; f <= 12; f++) { var fx = x - bw + f * bw / 6, fy = y + Math.sin(f * 1.7 + t * 5) * 1.5; if (f) { c.lineTo(fx, fy); } else { c.moveTo(fx, fy); } } c.stroke(); c.globalAlpha = 1;
  }
  /* an eye: almond lids, an iris and a slit pupil that looks toward (lx, ly); open runs 0 to 1 */
  function fxEye(c, x, y, r, open, lx, ly, col, a) {
    if (open <= 0.02 || a <= 0) { return; } var h = r * 0.55 * open;
    c.save(); c.globalAlpha = a; c.beginPath(); c.moveTo(x - r, y); c.quadraticCurveTo(x, y - h * 2, x + r, y); c.quadraticCurveTo(x, y + h * 2, x - r, y); c.closePath(); c.fillStyle = '#F8FAFC'; c.fill(); c.clip();
    c.fillStyle = col; c.beginPath(); c.arc(x + lx * r * 0.35, y + ly * r * 0.18, r * 0.45, 0, FX_TAU); c.fill();
    c.fillStyle = '#05050A'; c.beginPath(); c.ellipse(x + lx * r * 0.35, y + ly * r * 0.18, r * 0.1, r * 0.36, 0, 0, FX_TAU); c.fill(); c.restore();
  }
  function fxGhost(c, x, y, z, a, t, ph) {
    c.save(); c.globalAlpha = a; c.fillStyle = '#F1F5F9'; c.strokeStyle = 'rgba(71,85,105,.6)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(x - z, y + z); c.lineTo(x - z, y - z * 0.2); c.arc(x, y - z * 0.2, z, Math.PI, 0); c.lineTo(x + z, y + z);
    for (var i = 0; i < 4; i++) { c.quadraticCurveTo(x + z - (i + 0.5) * z / 2, y + z - z * 0.35 * (1 + 0.3 * Math.sin(t * 5 + i + ph)), x + z - (i + 1) * z / 2, y + z); }
    c.fill(); c.stroke(); c.fillStyle = '#0F172A';
    [[-0.35, -0.25, 0.14, 0.2], [0.35, -0.25, 0.14, 0.2], [0, 0.2, 0.16, 0.22]].forEach(function (e) { c.beginPath(); c.ellipse(x + e[0] * z, y + e[1] * z, z * e[2], z * e[3], 0, 0, FX_TAU); c.fill(); });
    c.restore();
  }
  function fxBat(c, x, y, z, fl, a, col) {
    c.save(); c.translate(x, y); c.globalAlpha = a; c.fillStyle = col;
    [1, -1].forEach(function (sd) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(sd * z * 0.6, -z * (0.9 * fl + 0.1), sd * z * 1.5, -z * 0.3 * fl); c.quadraticCurveTo(sd * z * 1.2, z * 0.1, sd * z, z * 0.35 * fl + z * 0.1); c.quadraticCurveTo(sd * z * 0.8, -z * 0.05, sd * z * 0.55, z * 0.3); c.quadraticCurveTo(sd * z * 0.35, 0, 0, z * 0.2); c.fill(); });
    c.beginPath(); c.ellipse(0, 0, z * 0.22, z * 0.38, 0, 0, FX_TAU); c.fill();
    c.beginPath(); c.moveTo(-z * 0.18, -z * 0.3); c.lineTo(-z * 0.12, -z * 0.6); c.lineTo(0, -z * 0.35); c.lineTo(z * 0.12, -z * 0.6); c.lineTo(z * 0.18, -z * 0.3); c.fill(); c.restore();
  }
  function fxUfo(c, x, y, z, t, a) {
    c.save(); c.translate(x, y); c.globalAlpha = a;
    c.fillStyle = '#67E8F9'; c.beginPath(); c.ellipse(0, -z * 0.2, z * 0.42, z * 0.4, 0, Math.PI, 0); c.fill();
    var g = c.createLinearGradient(0, -z * 0.3, 0, z * 0.3); g.addColorStop(0, '#E2E8F0'); g.addColorStop(1, '#64748B'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, z, z * 0.3, 0, 0, FX_TAU); c.fill();
    for (var i = 0; i < 5; i++) { c.fillStyle = (Math.floor(t * 6) + i) % 2 ? '#FDE047' : '#F472B6'; c.beginPath(); c.arc((i - 2) * z * 0.38, z * 0.08 - Math.abs(i - 2) * z * 0.035, z * 0.07, 0, FX_TAU); c.fill(); }
    c.restore();
  }
  var FX_INK = { dark: false, acc: '#6D28D9', muted: '#62626B' };
  function fxInk() { try { var cs = getComputedStyle(document.documentElement); FX_INK = { dark: fxLum(cs.getPropertyValue('--paper')) < 0.2, acc: cs.getPropertyValue('--pencil').trim() || '#6D28D9', muted: cs.getPropertyValue('--muted').trim() || '#62626B' }; } catch (e) { /* keep the last colors */ } }

  /* ---------- scenes ---------- */
  var FX_SC = [];
  function fxFit(s) { var r = s.c.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); s.w = r.width; s.h = r.height; s.c.width = Math.max(1, Math.round(r.width * d)); s.c.height = Math.max(1, Math.round(r.height * d)); s.ctx.setTransform(d, 0, 0, d, 0, 0); }
  function fxClean(c) { c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.setLineDash([]); }
  function fxStill(s) { if (!s.w || !s.h) { return; } for (var i = 0; i <= 90; i++) { s.ctx.clearRect(0, 0, s.w, s.h); fxClean(s.ctx); s.draw(1.5 + i / 60, 1 / 60); } }
  var FX_IO = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { FX_SC.forEach(function (s) { if (s.c === e.target) { s.live = e.isIntersecting; if (s.live) { fxFit(s); if (FX_REDUCE && !s.once) { fxStill(s); } } } }); });
    fxKick();
  }, { rootMargin: '60px' }) : null;
  function fxScene(canvas, make, opt) {
    opt = opt || {};
    var s = { c: canvas, ctx: canvas.getContext('2d'), w: 0, h: 0, live: false, t0: performance.now(), once: !!opt.dur, dur: opt.dur || 0, end: opt.end, fps: opt.fps || 0, last: 0 };
    if (!s.ctx) { return null; }
    fxFit(s); s.draw = make(s); FX_SC.push(s);
    if (s.once) { s.live = true; fxKick(); }
    else if (FX_IO) { FX_IO.observe(canvas); }
    else { s.live = true; if (FX_REDUCE) { fxStill(s); } else { fxKick(); } }
    return s;
  }
  var fxRaf = 0, fxPrev = 0;
  function fxLoop(now) {
    fxRaf = 0; var any = false; fxPrev = now;
    for (var i = FX_SC.length - 1; i >= 0; i--) {
      var s = FX_SC[i];
      if (!s.c.isConnected) { FX_SC.splice(i, 1); if (FX_IO) { FX_IO.unobserve(s.c); } if (s.once && s.end) { s.end(); } continue; }
      if (!s.live || s.paused || (FX_REDUCE && !s.once)) { continue; }
      any = true;
      if (s.fps && now - s.last < 1000 / s.fps - 2) { continue; }
      var dt = s.last ? Math.min(0.1, (now - s.last) / 1000) : 1 / 60, t = (now - s.t0) / 1000; s.last = now;
      s.ctx.clearRect(0, 0, s.w, s.h); fxClean(s.ctx);
      if (s.once && t >= s.dur) { FX_SC.splice(i, 1); if (s.end) { s.end(); } continue; }
      s.draw(t, dt);
    }
    if (any) { fxRaf = requestAnimationFrame(fxLoop); }
  }
  function fxKick() { if (!fxRaf) { fxRaf = requestAnimationFrame(fxLoop); } }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { FX_SC.forEach(function (s) { s.last = 0; }); fxKick(); } });
  var fxRsz = 0;
  window.addEventListener('resize', function () { clearTimeout(fxRsz); fxRsz = setTimeout(function () { FX_SC.forEach(function (s) { if (s.live && !s.once) { fxFit(s); if (FX_REDUCE) { fxStill(s); } } }); }, 150); });

  /* ---------- auras: each one its own animation, drawn on the dark plate around the streak ---------- */
  var FX_AURA = {
    glow: function (s) { return function (t) { var c = s.ctx, x = s.w / 2, y = s.h / 2, b = 0.5 + 0.5 * Math.sin(t * 2.2); c.globalCompositeOperation = 'lighter'; fxGlow(c, '139,92,246', x, y, 112 + 10 * b, 0.45 + 0.3 * b); fxGlow(c, '236,72,153', x - 34, y, 72, 0.18 + 0.14 * b); fxGlow(c, '59,130,246', x + 36, y, 72, 0.18 + 0.14 * (1 - b)); }; },
    twinkle: function (s) {
      var st = []; for (var i = 0; i < 14; i++) { var a = fxR(0, FX_TAU), r = fxR(72, 112); st.push({ x: Math.cos(a) * r * 1.25, y: Math.sin(a) * r * 0.62, p: fxR(0, FX_TAU), sp: fxR(1.4, 3), z: fxR(5, 9) }); }
      return function (t) { var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2; c.globalCompositeOperation = 'lighter'; st.forEach(function (q) { var k = Math.max(0, Math.sin(t * q.sp + q.p)); fxGlow(c, '196,181,253', x0 + q.x, y0 + q.y, q.z * 2.6, k * 0.7); fxStar4(c, x0 + q.x, y0 + q.y, q.z * (0.5 + 0.7 * k), k * k, '#FFFFFF'); }); };
    },
    orbit: function (s) {
      var P = [{ rx: 122, ry: 34, tilt: -0.22, sp: 0.9, rgb: '125,211,252', r: 6 }, { rx: 98, ry: 54, tilt: 0.35, sp: -1.25, rgb: '244,114,182', r: 5 }, { rx: 140, ry: 22, tilt: 0.08, sp: 0.6, rgb: '250,204,21', r: 7 }];
      return function (t) { var c = s.ctx; P.forEach(function (p) { c.save(); c.translate(s.w / 2, s.h / 2); c.rotate(p.tilt); c.globalAlpha = 0.22; c.strokeStyle = 'rgb(' + p.rgb + ')'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, p.rx, p.ry, 0, 0, FX_TAU); c.stroke(); c.globalAlpha = 1; c.globalCompositeOperation = 'lighter'; for (var k = 16; k >= 0; k--) { var a = t * p.sp - k * 0.045 * Math.sign(p.sp); fxGlow(c, p.rgb, Math.cos(a) * p.rx, Math.sin(a) * p.ry, p.r * (k ? 1.5 : 3.4) * (1 - k / 20), (k ? 0.4 : 1) * (1 - k / 17)); } var a0 = t * p.sp; c.fillStyle = '#fff'; c.beginPath(); c.arc(Math.cos(a0) * p.rx, Math.sin(a0) * p.ry, p.r * 0.55, 0, FX_TAU); c.fill(); c.restore(); }); };
    },
    sine: function (s) {
      function rad(th, t) { return 62 + 7 * Math.sin(6 * th + t * 3) + 3 * Math.sin(3 * th - t * 2); }
      return function (t) { var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2; c.globalCompositeOperation = 'lighter'; fxGlow(c, '45,212,191', x0, y0, 120, 0.12); [[10, 'rgba(45,212,191,.13)'], [4.5, 'rgba(45,212,191,.32)'], [1.6, 'rgba(224,255,255,1)']].forEach(function (L) { c.lineWidth = L[0]; c.strokeStyle = L[1]; c.beginPath(); for (var j = 0; j <= 180; j++) { var th = j / 180 * FX_TAU, r = rad(th, t), x = x0 + Math.cos(th) * r * 1.55, y = y0 + Math.sin(th) * r * 0.62; if (j) { c.lineTo(x, y); } else { c.moveTo(x, y); } } c.closePath(); c.stroke(); }); for (var k = 0; k < 2; k++) { var th2 = (t * 1.3 + k * Math.PI) % FX_TAU, r2 = rad(th2, t); fxGlow(c, '255,255,255', x0 + Math.cos(th2) * r2 * 1.55, y0 + Math.sin(th2) * r2 * 0.62, 11, 1); } };
    },
    'static': function (s) {
      var arcs = [], next = 0;
      return function (t) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2;
        if (t > next || t < next - 1) { next = t + fxR(0.06, 0.13); arcs = []; var n = 3 + Math.floor(fxR(0, 3)); for (var i = 0; i < n; i++) { var a = fxR(0, FX_TAU), b = a + fxR(0.4, 1.3), r1 = fxR(56, 66), r2 = fxR(72, 98); arcs.push(fxJag(x0 + Math.cos(a) * r1 * 1.5, y0 + Math.sin(a) * r1 * 0.6, x0 + Math.cos(b) * r2 * 1.5, y0 + Math.sin(b) * r2 * 0.6, 0.45, 5)); } }
        var fl = 0.6 + 0.4 * Math.random(); c.globalCompositeOperation = 'lighter'; fxGlow(c, '56,189,248', x0, y0, 120, 0.2 * fl);
        arcs.forEach(function (pts) { fxBolt(c, pts, 0.95, '125,211,252'); });
        fxRing(c, x0, y0, 93, 37, '125,211,252', 0.35 * fl, 1.5);
      };
    },
    ember: function (s) {
      var P = [];
      return function (t, dt) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2;
        for (var k = 0; k < 4; k++) { var th = fxR(0, FX_TAU); P.push({ x: x0 + Math.cos(th) * fxR(52, 68) * 1.5, y: y0 + Math.sin(th) * fxR(18, 28), vx: fxR(-8, 8), vy: fxR(-60, -26), l: 0, m: fxR(0.6, 1.25), r: fxR(4, 9) }); }
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '249,115,22', x0, y0 + 6, 125, 0.22 + 0.06 * Math.sin(t * 9));
        for (var i = P.length - 1; i >= 0; i--) { var p = P[i]; p.l += dt; if (p.l > p.m) { P.splice(i, 1); continue; } p.x += p.vx * dt + Math.sin(t * 6 + i) * 0.3; p.y += p.vy * dt; var u = p.l / p.m; fxGlow(c, u < 0.3 ? '255,240,180' : u < 0.6 ? '251,146,60' : '220,38,38', p.x, p.y, p.r * (1 - u * 0.6) * 2.2, (1 - u) * 0.9); }
        if (P.length > 240) { P.splice(0, P.length - 240); }
      };
    },
    spiral: function (s) {
      var b = 0.3063, P = []; for (var i = 0; i < 44; i++) { P.push({ u: Math.random(), arm: i % 2, sp: fxR(0.07, 0.15), z: fxR(2, 4) }); }
      function pt(th, arm, rot, x0, y0) { var r = 4 * Math.exp(b * th), a = th + rot + arm * Math.PI; return [x0 + Math.cos(a) * r * 1.4, y0 + Math.sin(a) * r * 0.62, r]; }
      return function (t, dt) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, rot = -t * 0.6; c.globalCompositeOperation = 'lighter'; fxGlow(c, '250,204,21', x0, y0, 110, 0.16);
        [0, 1].forEach(function (arm) { [[6, 'rgba(250,204,21,.12)'], [2, 'rgba(253,224,71,.5)'], [0.8, 'rgba(255,251,235,.9)']].forEach(function (L) { c.lineWidth = L[0]; c.strokeStyle = L[1]; c.beginPath(); for (var th = 0; th <= 11; th += 0.08) { var q = pt(th, arm, rot, x0, y0); if (q[2] > 108) { break; } if (th) { c.lineTo(q[0], q[1]); } else { c.moveTo(q[0], q[1]); } } c.stroke(); }); });
        P.forEach(function (p) { p.u = (p.u + p.sp * dt) % 1; var q = pt(p.u * 11, p.arm, rot, x0, y0); if (q[2] > 108) { return; } fxGlow(c, '255,236,153', q[0], q[1], p.z * 3, 0.9 * (1 - p.u * 0.5)); });
      };
    },
    equation: function (s) {
      var G = ['π', '√', '∑', '∞', 'θ', 'Δ', '∫', '≈', '≠', 'x²', '½', '∠', 'y'];
      return function (t) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2; c.globalCompositeOperation = 'lighter'; fxGlow(c, '129,140,248', x0, y0, 120, 0.2); c.textAlign = 'center'; c.textBaseline = 'middle';
        [[G.slice(0, 7), 122, 40, 0.55, '165,180,252', -1], [G.slice(6), 88, 58, -0.8, '244,114,182', 1]].forEach(function (R) {
          var n = R[0].length;
          R[0].forEach(function (g, i) { var a = t * R[3] + i / n * FX_TAU, x = x0 + Math.cos(a) * R[1], y = y0 + Math.sin(a) * R[2] * R[5] * 0.6, depth = (Math.sin(a) * R[5] + 1) / 2, size = 12 + 9 * depth; fxGlow(c, R[4], x, y, size * 1.5, 0.5 * depth + 0.15); c.globalAlpha = 0.45 + 0.55 * depth; c.fillStyle = '#FFFFFF'; c.font = '600 ' + size.toFixed(1) + 'px "IBM Plex Mono", ui-monospace, monospace'; c.fillText(g, x, y); c.globalAlpha = 1; });
        });
      };
    },
    unit: function (s) {
      return function (t) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, R = Math.min(62, s.h * 0.34), th = t * 1.2, px = x0 + Math.cos(th) * R, py = y0 - Math.sin(th) * R, x;
        c.globalCompositeOperation = 'lighter'; c.lineWidth = 1.5; c.strokeStyle = 'rgba(226,232,240,.55)'; c.beginPath(); c.arc(x0, y0, R, 0, FX_TAU); c.stroke();
        for (var k = 0; k < 12; k++) { var a = k / 12 * FX_TAU; c.beginPath(); c.moveTo(x0 + Math.cos(a) * (R - 4), y0 + Math.sin(a) * (R - 4)); c.lineTo(x0 + Math.cos(a) * (R + 4), y0 + Math.sin(a) * (R + 4)); c.stroke(); }
        var x1 = x0 + R + 16, x2 = x0 - R - 16;
        c.lineWidth = 2.2; c.strokeStyle = 'rgba(34,211,238,.95)'; c.beginPath(); for (x = x1; x < s.w; x += 3) { var y = y0 - Math.sin(th - (x - x1) / R) * R; if (x === x1) { c.moveTo(x, y); } else { c.lineTo(x, y); } } c.stroke();
        c.strokeStyle = 'rgba(244,114,182,.95)'; c.beginPath(); for (x = x2; x > 0; x -= 3) { var y2 = y0 - Math.cos(th - (x2 - x) / R) * R; if (x === x2) { c.moveTo(x, y2); } else { c.lineTo(x, y2); } } c.stroke();
        c.setLineDash([3, 4]); c.lineWidth = 1; c.strokeStyle = 'rgba(34,211,238,.6)'; c.beginPath(); c.moveTo(px, py); c.lineTo(x1, py); c.stroke(); c.setLineDash([]);
        c.lineWidth = 2.5; c.strokeStyle = 'rgba(250,204,21,.95)'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(px, py); c.stroke();
        fxGlow(c, '250,204,21', px, py, 17, 1); fxGlow(c, '34,211,238', x1, py, 13, 1); fxGlow(c, '244,114,182', x2, y0 - Math.cos(th) * R, 13, 1);
      };
    },
    prism: function (s) {
      return function (t) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2; c.globalCompositeOperation = 'lighter';
        for (var i = 0; i < 10; i++) { fxBeam(c, x0, y0, t * 0.25 + i / 10 * FX_TAU, 230, 0.06, 'hsla(' + ((i * 36 + t * 40) % 360) + ',100%,70%,.24)'); }
        for (var j = 0; j < 90; j++) { var th = j / 90 * FX_TAU, hi = Math.pow(Math.max(0, Math.cos(th - t * 2)), 8); c.globalAlpha = 0.8; c.fillStyle = 'hsl(' + ((j / 90 * 360 + t * 120) % 360) + ',100%,' + (60 + 30 * hi) + '%)'; c.beginPath(); c.arc(x0 + Math.cos(th) * 94, y0 + Math.sin(th) * 37, 2.6 + 3 * hi, 0, FX_TAU); c.fill(); }
        c.globalAlpha = 1;
      };
    },
    infinity: function (s) {
      var sparks = [];
      function L(u, a, x0, y0) { var sn = Math.sin(u), cs = Math.cos(u), d = 1 + sn * sn; return [x0 + a * cs / d, y0 + a * sn * cs / d * 1.2]; }
      return function (t, dt) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, a = Math.min(158, s.w * 0.43); c.globalCompositeOperation = 'lighter';
        fxGlow(c, '217,70,239', x0, y0, 95, 0.26 + 0.1 * Math.sin(t * 3));
        c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,255,255,.16)'; c.beginPath(); for (var u = 0; u <= FX_TAU + 0.05; u += 0.05) { var q = L(u, a, x0, y0); if (u) { c.lineTo(q[0], q[1]); } else { c.moveTo(q[0], q[1]); } } c.stroke();
        [0, Math.PI].forEach(function (off) {
          for (var k = 64; k >= 0; k--) { var q2 = L(t * 1.4 + off - k * 0.034, a, x0, y0), f = 1 - k / 64; c.globalAlpha = f * 0.9; c.fillStyle = 'hsl(' + ((t * 90 + k * 6 + off * 57) % 360) + ',100%,' + (k ? 62 : 92) + '%)'; c.beginPath(); c.arc(q2[0], q2[1], 1 + 5 * f, 0, FX_TAU); c.fill(); }
          c.globalAlpha = 1; var h = L(t * 1.4 + off, a, x0, y0); fxGlow(c, '255,255,255', h[0], h[1], 19, 1);
          if (Math.random() < 0.6) { sparks.push({ x: h[0], y: h[1], vx: fxR(-34, 34), vy: fxR(-34, 34), l: 0 }); }
        });
        for (var i = sparks.length - 1; i >= 0; i--) { var p = sparks[i]; p.l += dt; if (p.l > 0.7) { sparks.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; fxGlow(c, '250,232,255', p.x, p.y, 5, 1 - p.l / 0.7); }
        if (sparks.length > 200) { sparks.splice(0, sparks.length - 200); }
      };
    },
    horizon: function (s) {
      var D = [], S = []; for (var i = 0; i < 170; i++) { var r = fxR(64, 135); D.push({ r: r, a: fxR(0, FX_TAU), w: 2.2 * Math.pow(64 / r, 1.5), z: fxR(2, 4.5) }); }
      return function (t, dt) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2;
        if (S.length < 60) { S.push({ r: fxR(150, 260), a: fxR(0, FX_TAU) }); }
        c.globalCompositeOperation = 'lighter';
        for (var j = S.length - 1; j >= 0; j--) { var p = S[j]; p.a += dt * (40 / p.r); p.r -= dt * (20 + 2400 / p.r); if (p.r < 40) { S.splice(j, 1); continue; } fxGlow(c, '200,190,255', x0 + Math.cos(p.a) * p.r, y0 + Math.sin(p.a) * p.r * 0.5, 2.6, Math.min(1, (p.r - 40) / 60)); }
        function disk(front) { D.forEach(function (q) { var a = q.a + t * q.w, sn = Math.sin(a); if ((sn > 0) !== front) { return; } var u = (q.r - 64) / 71; fxGlow(c, u < 0.25 ? '255,247,220' : u < 0.55 ? '251,146,60' : '192,38,211', x0 + Math.cos(a) * q.r, y0 + sn * q.r * 0.26, q.z * 2.4, 0.35 + 0.6 * (0.55 + 0.45 * Math.cos(a))); }); }
        disk(false);
        c.globalCompositeOperation = 'source-over'; c.fillStyle = '#000'; c.beginPath(); c.arc(x0, y0, 46, 0, FX_TAU); c.fill();
        c.globalCompositeOperation = 'lighter';
        for (var k = 0; k < 60; k++) { var a2 = Math.PI + k / 59 * Math.PI; fxGlow(c, k % 3 ? '251,146,60' : '255,237,213', x0 + Math.cos(a2) * 62, y0 + Math.sin(a2) * 54, 5, 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(k * 0.7 - t * 6))); }
        c.lineWidth = 2; c.strokeStyle = 'rgba(255,244,214,.85)'; c.beginPath(); c.arc(x0, y0, 48, 0, FX_TAU); c.stroke(); fxGlow(c, '251,191,36', x0, y0, 72, 0.12);
        disk(true);
      };
    },
    /* ---- Myth & Magic ---- */
    runes: function (s) {
      return function (t) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, R = Math.min(118, s.w * 0.36), ry = Math.min(R * 0.6, s.h * 0.4);
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,191,36', x0, y0, R * 1.2, 0.18);
        fxRing(c, x0, y0, R * 1.2, ry * 1.12, '251,191,36', 0.4, 1.4); fxRing(c, x0, y0, R * 0.92, ry * 0.86, '251,191,36', 0.25, 1);
        for (var i = 0; i < 16; i++) {
          var a = i / 16 * FX_TAU + t * 0.25, x = x0 + Math.cos(a) * R * 1.06, y = y0 + Math.sin(a) * ry, depth = (Math.sin(a) + 1) / 2, lit = Math.pow(Math.max(0, Math.cos(a - t * 1.6)), 8);
          fxGlow(c, '251,191,36', x, y, 14 + 14 * lit, 0.25 + 0.7 * lit);
          fxRune(c, x, y, 10 + 3 * depth + 3 * lit, i, 'rgba(254,243,199,' + (0.6 + 0.25 * depth + 0.15 * lit).toFixed(2) + ')');
        }
      };
    },
    crystal: function (s) {
      var C = []; for (var i = 0; i < 13; i++) { C.push({ a: i / 13 * FX_TAU + fxR(-0.15, 0.15), len: fxR(26, 46), wid: fxR(6, 10), at: i * 0.17, hue: [190, 265, 300, 220][i % 4] }); }
      C.sort(function (p, q) { return Math.sin(p.a) - Math.sin(q.a); });
      return function (t) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, R = Math.min(70, s.w * 0.2), cyc = t % 9, sweep = (t % 4.5) / 4.5;
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '167,139,250', x0, y0, 130, 0.16);
        C.forEach(function (p) {
          /* they grow in one by one, shine, and melt away to grow again every 9 seconds */
          var grow = fxEase(Math.min(1, Math.max(0, (cyc - p.at) / 0.9))) * (cyc > 8.3 ? Math.max(0, 1 - (cyc - 8.3) / 0.7) : 1); if (grow <= 0) { return; }
          var bx = x0 + Math.cos(p.a) * R * 1.5, by = y0 + Math.sin(p.a) * R * 0.55, dx = Math.cos(p.a) * 1.5, dy = Math.sin(p.a) * 0.55 - 0.45, d = Math.hypot(dx, dy); dx /= d; dy /= d;
          var L = p.len * grow, w = p.wid * (0.6 + 0.4 * grow), nx = -dy, ny = dx, tipx = bx + dx * L, tipy = by + dy * L, lit = Math.pow(Math.max(0, Math.cos((p.a / FX_TAU - sweep) * FX_TAU)), 10);
          [[-1, 0.55], [1, 0.85]].forEach(function (f) { c.globalAlpha = (0.35 + 0.4 * lit) * f[1]; c.fillStyle = 'hsl(' + p.hue + ',90%,' + (55 + 25 * lit + (f[0] > 0 ? 10 : 0)) + '%)'; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + nx * w * f[0], by + ny * w * f[0]); c.lineTo(tipx - dx * w * 0.9 + nx * w * f[0], tipy - dy * w * 0.9 + ny * w * f[0]); c.lineTo(tipx, tipy); c.closePath(); c.fill(); });
          c.globalAlpha = 0.8; c.strokeStyle = 'hsla(' + p.hue + ',100%,88%,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(bx, by); c.lineTo(tipx, tipy); c.stroke(); c.globalAlpha = 1;
          if (grow > 0.95) { var tw = Math.max(0, Math.sin(t * 3 + p.a * 5)); fxStar4(c, tipx, tipy, 4 + 6 * tw + 6 * lit, 0.5 + 0.5 * tw, '#FFFFFF'); }
        });
      };
    },
    dragon: function (s) {
      var Fl = [], N = 40;
      return function (t, dt) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, R = Math.min(104, s.w * 0.3), ry = Math.min(R * 0.5, s.h * 0.36), p = t * 0.85, S = [], i;
        for (i = 0; i < N; i++) { var a = p - i * 0.075, d = Math.sin(a), sc = 0.8 + 0.3 * (d + 1) / 2; S.push({ i: i, x: x0 + Math.cos(a) * R * 1.35, y: y0 + d * ry + Math.sin(a * 3 + t * 2.4) * 6 * (1 - i / N), d: d, r: (2.5 + 8.5 * Math.pow(1 - i / N, 0.6)) * sc }); }
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '16,185,129', x0, y0, R * 1.5, 0.14);
        /* the body as one scaled tube, back parts first: jade, a gold belly, a light ridge, glowing scales */
        var seg = []; for (i = 0; i < N - 1; i++) { seg.push(i); }
        seg.sort(function (u, v) { return (S[u].d + S[u + 1].d) - (S[v].d + S[v + 1].d); });
        c.lineCap = 'round';
        seg.forEach(function (j) {
          var q = S[j], q2 = S[j + 1], k = 0.55 + 0.45 * (q.d + 1) / 2;
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
          c.strokeStyle = 'rgb(' + Math.round(5 + 10 * k) + ',' + Math.round(110 + 60 * k) + ',' + Math.round(90 + 40 * k) + ')'; c.lineWidth = q.r * 2; c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q2.x, q2.y); c.stroke();
          c.strokeStyle = 'rgba(252,211,77,' + (0.85 * k) + ')'; c.lineWidth = q.r * 0.7; c.beginPath(); c.moveTo(q.x, q.y + q.r * 0.55); c.lineTo(q2.x, q2.y + q2.r * 0.55); c.stroke();
          c.strokeStyle = 'rgba(167,243,208,' + (0.8 * k) + ')'; c.lineWidth = q.r * 0.45; c.beginPath(); c.moveTo(q.x, q.y - q.r * 0.5); c.lineTo(q2.x, q2.y - q2.r * 0.5); c.stroke();
          if (j % 3 === 0 && j > 2 && j < N - 5) { c.fillStyle = 'rgba(253,230,138,' + k + ')'; c.beginPath(); c.moveTo(q.x - q.r * 0.5, q.y - q.r * 0.8); c.lineTo(q.x + q.r * 0.1, q.y - q.r * 1.9); c.lineTo(q.x + q.r * 0.6, q.y - q.r * 0.8); c.fill(); }
          c.globalCompositeOperation = 'lighter'; if (j % 2 === 0) { fxGlow(c, '52,211,153', q.x, q.y, q.r * 1.6, 0.22 * k); }
        });
        /* a flame-tipped tail */
        var tl = S[N - 1], tl2 = S[N - 3], ta = Math.atan2(tl.y - tl2.y, tl.x - tl2.x);
        for (i = 0; i < 6; i++) { fxGlow(c, i < 3 ? '253,224,71' : '251,146,60', tl.x + Math.cos(ta) * i * 3 + Math.sin(t * 9 + i) * 2, tl.y + Math.sin(ta) * i * 3, 6 - i * 0.6, 0.8 - i * 0.1); }
        /* the head, facing the way it moves */
        var h = S[0], nb = S[2], dir = Math.atan2(h.y - nb.y, h.x - nb.x), hs = h.r / 9;
        c.save(); c.translate(h.x, h.y); c.rotate(dir); c.scale(hs * 1.35, hs * 1.35); c.globalCompositeOperation = 'source-over';
        c.fillStyle = '#FBBF24'; c.beginPath(); for (i = 0; i < 6; i++) { var ma = Math.PI * 0.55 + i / 5 * Math.PI * 0.9; c.moveTo(-4, 0); c.lineTo(-4 + Math.cos(ma) * (13 + 3 * Math.sin(t * 6 + i)), Math.sin(ma) * (13 + 3 * Math.sin(t * 6 + i))); c.lineTo(-4 + Math.cos(ma + 0.25) * 6, Math.sin(ma + 0.25) * 6); } c.fill();
        c.fillStyle = '#10B981'; c.beginPath(); c.moveTo(17, -2); c.quadraticCurveTo(10, -10, -6, -8); c.quadraticCurveTo(-10, 0, -6, 8); c.quadraticCurveTo(8, 9, 16, 4); c.lineTo(19, 1); c.closePath(); c.fill();
        c.fillStyle = '#FDE68A'; c.beginPath(); c.moveTo(16, 3); c.quadraticCurveTo(6, 8, -3, 6); c.lineTo(-2, 4); c.quadraticCurveTo(7, 5, 16, 2); c.fill();
        c.strokeStyle = '#FDE68A'; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-2, -7); c.quadraticCurveTo(-8, -14, -16, -15); c.moveTo(2, -7); c.quadraticCurveTo(-3, -16, -9, -19); c.stroke();
        c.lineWidth = 1; c.strokeStyle = 'rgba(253,230,138,.8)'; c.beginPath(); c.moveTo(14, -1); c.quadraticCurveTo(4, -17 - 5 * Math.sin(t * 3), -18, -11); c.moveTo(14, 3); c.quadraticCurveTo(4, 18 + 5 * Math.sin(t * 3), -18, 14); c.stroke();
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '254,240,138', 6, -3, 6, 1); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(6, -3, 1.4, 0, FX_TAU); c.fill();
        c.restore(); c.globalAlpha = 1;
        /* fire, every few seconds */
        var cs = Math.cos(dir), sn = Math.sin(dir), cyc = t % 5.5;
        if (cyc > 3.6 && cyc < 4.9) { for (var j2 = 0; j2 < 5; j2++) { var sp = fxR(-0.3, 0.3), v = fxR(80, 170); Fl.push({ x: h.x + cs * 22 * hs, y: h.y + sn * 22 * hs, vx: Math.cos(dir + sp) * v, vy: Math.sin(dir + sp) * v, l: 0, m: fxR(0.35, 0.75) }); } }
        c.globalCompositeOperation = 'lighter';
        for (i = Fl.length - 1; i >= 0; i--) { var e = Fl[i]; e.l += dt; if (e.l > e.m) { Fl.splice(i, 1); continue; } e.x += e.vx * dt; e.y += e.vy * dt - 20 * dt; var u = e.l / e.m; fxGlow(c, u < 0.3 ? '255,247,205' : u < 0.6 ? '251,146,60' : '239,68,68', e.x, e.y, 6 + 11 * u, (1 - u) * 0.95); }
        if (Fl.length > 180) { Fl.splice(0, Fl.length - 180); }
      };
    },
    /* ---- Deep Sea ---- */
    jelly: function (s) {
      var M = []; for (var i = 0; i < 30; i++) { M.push({ x: Math.random(), y: Math.random(), z: fxR(0.6, 1.6), sp: fxR(4, 10) }); }
      return function (t) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, R = Math.min(124, s.w * 0.38);
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '56,189,248', x0, y0, R * 1.3, 0.12);
        M.forEach(function (m) { fxGlow(c, '186,230,253', m.x * s.w, ((m.y * s.h - t * m.sp) % s.h + s.h) % s.h, m.z * 2.2, 0.4); });
        [[0, '244,114,182', '#FBCFE8'], [Math.PI, '103,232,249', '#CFFAFE']].forEach(function (j) {
          var a = t * 0.35 + j[0], depth = (Math.sin(a) + 1) / 2;
          fxJelly(c, x0 + Math.cos(a) * R * 1.12, y0 + Math.sin(a) * Math.min(R * 0.32, s.h * 0.22) - 6 * Math.sin(t * 2.6 + j[0]) - 14, 22 + 8 * depth, j[1], j[2], t, j[0], 0.85 + 0.15 * depth);
        });
      };
    },
    leviathan: function (s) {
      var N = 72, B = [], P = [];
      for (var i = 0; i < 40; i++) { P.push({ x: Math.random(), y: Math.random(), z: fxR(0.5, 1.5), sp: fxR(3, 9) }); }
      return function (t, dt) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, R = Math.min(110, s.w * 0.32), ry = Math.min(R * 0.55, s.h * 0.38), p = t * 0.42, S = [], j;
        /* light from far above, and specks drifting up */
        c.globalCompositeOperation = 'lighter';
        for (var b = 0; b < 4; b++) { fxBeam(c, x0 + (b - 1.5) * 70 + Math.sin(t * 0.3 + b) * 20, -20, Math.PI / 2 + 0.12 * Math.sin(t * 0.2 + b), s.h * 1.2, 0.09, 'rgba(56,189,248,.10)'); }
        P.forEach(function (q) { fxGlow(c, '165,243,252', q.x * s.w, ((q.y * s.h - t * q.sp) % s.h + s.h) % s.h, q.z * 2.2, 0.3); });
        for (j = 0; j < N; j++) { var a = p - j * 0.05, d = Math.sin(a), sc = 0.7 + 0.45 * (d + 1) / 2, f = 1 - j / N; S.push({ i: j, x: x0 + Math.cos(a) * R * 1.55, y: y0 + d * ry + Math.sin(t * 1.3 - j * 0.16) * 7 * Math.min(1, j / 8), d: d, r: (3 + 14 * Math.pow(f, 0.5)) * sc, k: 0.45 + 0.55 * (d + 1) / 2 }); }
        /* the body: a dark tube lit along its back, back parts first */
        var seg = []; for (j = 0; j < N - 1; j++) { seg.push(j); }
        seg.sort(function (u, v) { return (S[u].d + S[u + 1].d) - (S[v].d + S[v + 1].d); });
        c.lineCap = 'round';
        seg.forEach(function (n) {
          var q = S[n], q2 = S[n + 1];
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
          c.strokeStyle = 'rgb(' + Math.round(8 + 10 * q.k) + ',' + Math.round(34 + 30 * q.k) + ',' + Math.round(60 + 40 * q.k) + ')'; c.lineWidth = q.r * 2; c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q2.x, q2.y); c.stroke();
          c.strokeStyle = 'rgba(34,211,238,' + (0.55 * q.k) + ')'; c.lineWidth = Math.max(1, q.r * 0.25); c.beginPath(); c.moveTo(q.x, q.y - q.r * 0.75); c.lineTo(q2.x, q2.y - q2.r * 0.75); c.stroke();
          /* lights along its side, with a pulse running from head to tail */
          c.globalCompositeOperation = 'lighter';
          if (n % 3 === 0) { var wave = Math.pow(Math.max(0, Math.sin(n * 0.3 - t * 4)), 6); fxGlow(c, wave > 0.3 ? '240,253,250' : '45,212,191', q.x, q.y + q.r * 0.15, (2.2 + 3.5 * wave) * (q.r / 12) + 1.5, (0.6 + 0.4 * wave) * q.k); }
        });
        /* a dorsal fin and a tail fluke, glassy */
        c.globalCompositeOperation = 'lighter';
        for (j = 8; j < 30; j += 2) { var q3 = S[j], fh = q3.r * (1.1 + 0.4 * Math.sin(t * 3 - j * 0.4)); c.strokeStyle = 'rgba(103,232,249,' + (0.35 * q3.k) + ')'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(q3.x, q3.y - q3.r * 0.8); c.lineTo(q3.x - 3, q3.y - q3.r * 0.8 - fh); c.stroke(); }
        var tl = S[N - 1], tl2 = S[N - 4], ta = Math.atan2(tl.y - tl2.y, tl.x - tl2.x), fl = Math.sin(t * 2.4) * 0.35;
        c.fillStyle = 'rgba(34,211,238,' + (0.4 * tl.k) + ')'; [1, -1].forEach(function (sd) { c.beginPath(); c.moveTo(tl.x, tl.y); c.quadraticCurveTo(tl.x + Math.cos(ta + sd * (0.9 + fl)) * 20, tl.y + Math.sin(ta + sd * (0.9 + fl)) * 20, tl.x + Math.cos(ta + sd * (0.5 + fl)) * 30, tl.y + Math.sin(ta + sd * (0.5 + fl)) * 30); c.quadraticCurveTo(tl.x + Math.cos(ta) * 12, tl.y + Math.sin(ta) * 12, tl.x, tl.y); c.fill(); });
        /* the head: a long jaw, a glowing eye, a lure light swinging in front */
        var h = S[0], nb = S[3], dir = Math.atan2(h.y - nb.y, h.x - nb.x), hs = h.r / 14;
        c.save(); c.translate(h.x, h.y); c.rotate(dir); c.scale(hs, hs); c.globalCompositeOperation = 'source-over';
        c.fillStyle = '#0E2E4E'; c.beginPath(); c.moveTo(28, 2); c.quadraticCurveTo(18, -16, -6, -14); c.quadraticCurveTo(-12, 0, -6, 14); c.quadraticCurveTo(16, 14, 28, 2); c.fill();
        c.strokeStyle = 'rgba(34,211,238,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(27, 4); c.quadraticCurveTo(12, 9, -2, 7); c.stroke();
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '165,243,252', 10, -6, 9, 1); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(10, -6, 2, 0, FX_TAU); c.fill();
        var lx = 34 + 4 * Math.sin(t * 2), ly = -20 + 6 * Math.cos(t * 1.6); c.strokeStyle = 'rgba(103,232,249,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(12, -13); c.quadraticCurveTo(26, -32, lx, ly); c.stroke(); fxGlow(c, '240,253,250', lx, ly, 9 + 3 * Math.sin(t * 5), 1);
        c.restore(); c.globalAlpha = 1;
        /* its call rings out every few seconds */
        var cy = t % 6; if (cy < 1.6) { var w = cy / 1.6; fxRing(c, h.x, h.y, 10 + w * 170, 5 + w * 60, '103,232,249', (1 - w) * 0.6, 2 * (1 - w) + 0.5); }
        if (Math.random() < 0.35) { B.push({ x: h.x + fxR(-6, 6), y: h.y, vy: fxR(-40, -20), l: 0, r: fxR(1.5, 3.5) }); }
        for (j = B.length - 1; j >= 0; j--) { var e = B[j]; e.l += dt; e.y += e.vy * dt; e.x += Math.sin(t * 4 + j) * 0.3; if (e.l > 2) { B.splice(j, 1); continue; } fxRing(c, e.x, e.y, e.r, e.r, '207,250,254', 0.6 * (1 - e.l / 2), 1); }
        if (B.length > 80) { B.splice(0, B.length - 80); }
      };
    },
    /* ---- Tech Lab ---- */
    radar: function (s) {
      var Bl = []; for (var i = 0; i < 7; i++) { Bl.push({ a: fxR(0, FX_TAU), r: fxR(0.35, 1), hit: null }); }
      return function (t) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, R = Math.min(130, s.w * 0.4), sx = 1.25, sy = 0.5, sw = (t * 1.4) % FX_TAU, k;
        c.globalCompositeOperation = 'lighter';
        [1, 0.66, 0.33].forEach(function (f) { fxRing(c, x0, y0, R * f * sx, R * f * sy, '74,222,128', 0.3, 1); });
        c.globalAlpha = 0.25; c.strokeStyle = 'rgb(74,222,128)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0 - R * sx, y0); c.lineTo(x0 + R * sx, y0); c.moveTo(x0, y0 - R * sy); c.lineTo(x0, y0 + R * sy); c.stroke();
        /* the sweep: a bright line with a fading wedge behind it */
        for (k = 0; k < 24; k++) { var a = sw - k * 0.03; c.globalAlpha = 0.45 * (1 - k / 24); c.lineWidth = 2.5; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(a) * R * sx, y0 + Math.sin(a) * R * sy); c.stroke(); }
        c.globalAlpha = 1;
        Bl.forEach(function (b) {
          var d = ((sw - b.a) % FX_TAU + FX_TAU) % FX_TAU;
          if (d < 0.1 && (b.hit === null || t - b.hit > 1)) { b.hit = t; }
          if (b.hit === null) { return; }
          var age = t - b.hit; if (age > 2.4) { b.hit = null; b.a = fxR(0, FX_TAU); b.r = fxR(0.35, 1); return; }
          var bx = x0 + Math.cos(b.a) * R * b.r * sx, by = y0 + Math.sin(b.a) * R * b.r * sy;
          fxGlow(c, '134,239,172', bx, by, 9, 1 - age / 2.4); if (age < 0.6) { fxRing(c, bx, by, 6 + age * 30, 3 + age * 12, '134,239,172', 1 - age / 0.6, 1); }
        });
        fxGlow(c, '74,222,128', x0, y0, R * 0.9, 0.08);
      };
    },
    /* ---- Haunted ---- */
    ghosts: function (s) {
      return function (t) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, R = Math.min(128, s.w * 0.38), G = [];
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '167,139,250', x0, y0, R * 1.3, 0.14);
        for (var i = 0; i < 3; i++) { var a = t * 0.5 + i * FX_TAU / 3; G.push({ x: x0 + Math.cos(a) * R * 1.12, y: y0 + Math.sin(a) * Math.min(R * 0.4, s.h * 0.27) + Math.sin(t * 2 + i * 2) * 5 - 4, d: Math.sin(a), i: i }); }
        G.sort(function (p, q) { return p.d - q.d; });
        G.forEach(function (g) { var k = 0.5 + 0.5 * (g.d + 1) / 2, z = 14 + 7 * (g.d + 1) / 2; c.globalCompositeOperation = 'lighter'; fxGlow(c, '196,181,253', g.x, g.y, z * 2.6, 0.35 * k); c.globalCompositeOperation = 'source-over'; fxGhost(c, g.x, g.y, z, 0.55 + 0.4 * k, t, g.i); });
      };
    },
    eyes: function (s) {
      var E = []; for (var i = 0; i < 10; i++) { E.push({ a: i / 10 * FX_TAU + fxR(-0.2, 0.2), rr: fxR(0.88, 1.12), z: fxR(10, 17), per: fxR(4, 7), ph: fxR(0, 7), col: ['#EF4444', '#F59E0B', '#A3E635'][i % 3] }); }
      return function (t) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, R = Math.min(132, s.w * 0.4);
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '127,29,29', x0, y0, R * 1.3, 0.2);
        E.forEach(function (e, i) {
          var cyc = (t + e.ph) % e.per, open = cyc < 0.4 ? cyc / 0.4 : cyc < e.per - 1.2 ? 1 : cyc < e.per - 0.9 ? 1 - (cyc - (e.per - 1.2)) / 0.3 : 0, bl = (t * 0.9 + i * 1.37) % 3.1;
          if (bl < 0.14) { open *= 0.1; }
          var x = x0 + Math.cos(e.a) * R * 1.12 * e.rr, y = y0 + Math.sin(e.a) * Math.min(R * 0.5, s.h * 0.37) * e.rr, look = t * 0.6 + i;
          c.globalCompositeOperation = 'lighter'; fxGlow(c, '239,68,68', x, y, e.z * 2.2, 0.3 * open);
          c.globalCompositeOperation = 'source-over'; fxEye(c, x, y, e.z, open, Math.cos(look), Math.sin(look * 1.3), e.col, 1);
        });
      };
    },
    /* ---- The Unknown ---- */
    slime: function (s) {
      var D = []; for (var i = 0; i < 9; i++) { D.push({ x: (i + 0.5) / 9 + fxR(-0.03, 0.03), per: fxR(3, 6), ph: fxR(0, 6), w: fxR(7, 13) }); }
      return function (t) {
        var c = s.ctx, x; c.globalCompositeOperation = 'lighter'; fxGlow(c, '132,204,22', s.w / 2, 0, s.w * 0.6, 0.2);
        c.globalCompositeOperation = 'source-over'; c.fillStyle = '#84CC16'; c.globalAlpha = 0.9;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 12); for (x = 0; x <= s.w; x += 8) { c.lineTo(x, 12 + 5 * Math.sin(x * 0.05 + t) + 3 * Math.sin(x * 0.13 - t * 0.7)); } c.lineTo(s.w, 0); c.fill();
        D.forEach(function (d) {
          var cyc = ((t + d.ph) % d.per) / d.per, x2 = d.x * s.w, len = cyc < 0.7 ? 10 + 46 * fxEase(cyc / 0.7) : 10 + 46 * (1 - (cyc - 0.7) / 0.3);
          c.globalAlpha = 0.9; c.fillStyle = '#84CC16'; c.beginPath(); c.moveTo(x2 - d.w, 8); c.quadraticCurveTo(x2 - d.w * 0.4, len * 0.6, x2 - d.w * 0.45, len); c.arc(x2, len, d.w * 0.45, Math.PI, 0, true); c.quadraticCurveTo(x2 + d.w * 0.4, len * 0.6, x2 + d.w, 8); c.fill();
          if (cyc >= 0.7) { var f = (cyc - 0.7) / 0.3; c.globalAlpha = 0.9 * (1 - f * 0.5); c.beginPath(); c.arc(x2, 56 + f * f * (s.h - 40), d.w * 0.4, 0, FX_TAU); c.fill(); }
          c.globalAlpha = 0.7; c.fillStyle = '#ECFCCB'; c.beginPath(); c.arc(x2 - d.w * 0.15, len - 1, 1.6, 0, FX_TAU); c.fill();
        });
        c.globalAlpha = 1;
      };
    },
    portal: function (s) {
      var P = []; for (var i = 0; i < 50; i++) { P.push({ a: fxR(0, FX_TAU), r: fxR(0.3, 1.5), sp: fxR(0.5, 1.4) }); }
      return function (t, dt) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, rx = Math.min(140, s.w * 0.43), ry = Math.min(86, s.h * 0.43), k, j;
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '124,58,237', x0, y0, rx * 1.3, 0.28);
        c.globalCompositeOperation = 'source-over'; c.fillStyle = '#05010F'; c.globalAlpha = 0.85; c.beginPath(); c.ellipse(x0, y0, rx * 0.86, ry * 0.86, 0, 0, FX_TAU); c.fill(); c.globalAlpha = 1;
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        for (k = 0; k < 5; k++) { var f = 1 - k * 0.07, rot = t * (1.2 - k * 0.15) * (k % 2 ? -1 : 1); for (j = 0; j < 3; j++) { var a0 = rot + j * FX_TAU / 3; c.strokeStyle = 'hsla(' + ((260 + k * 22 + t * 20) % 360) + ',100%,' + (62 + k * 4) + '%,' + (0.85 - k * 0.12) + ')'; c.lineWidth = 5 - k * 0.7; c.beginPath(); c.ellipse(x0, y0, rx * f, ry * f, 0, a0, a0 + 1.3 + 0.3 * Math.sin(t * 2 + k)); c.stroke(); } }
        P.forEach(function (p) { p.r -= p.sp * dt * 0.35; p.a += dt * (1.5 / Math.max(0.25, p.r)); if (p.r < 0.15) { p.r = fxR(1.2, 1.6); p.a = fxR(0, FX_TAU); } fxGlow(c, p.r > 0.9 ? '103,232,249' : '240,171,252', x0 + Math.cos(p.a) * rx * p.r, y0 + Math.sin(p.a) * ry * p.r, 2 + 3 * p.r, Math.min(1, p.r)); });
      };
    },
    watcher: function (s) {
      var T = []; for (var i = 0; i < 8; i++) { T.push({ c: i % 4, ph: fxR(0, 6), len: fxR(80, 125), w: fxR(8, 12) }); }
      return function (t) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, W = s.w * 0.47, H = s.h * 0.44, cyc = t % 7, open = cyc > 6.6 ? Math.abs(cyc - 6.8) / 0.2 : 1, lx = Math.sin(t * 0.5) * 10, ly = Math.cos(t * 0.37) * 4, R = Math.min(H * 0.98, 98), pr = R * (0.56 + 0.06 * Math.sin(t * 1.3)), i;
        open = Math.max(0.06, Math.min(1, open));
        function lids() { c.beginPath(); c.moveTo(x0 - W, y0); c.quadraticCurveTo(x0, y0 - H * 2 * open, x0 + W, y0); c.quadraticCurveTo(x0, y0 + H * 2 * open, x0 - W, y0); c.closePath(); }
        /* tentacles reach in from the corners */
        c.lineCap = 'round';
        T.forEach(function (q, n) {
          var dx = q.c % 2 ? -1 : 1, dy = q.c < 2 ? 1 : -1, px = q.c % 2 ? s.w + 6 : -6, py = q.c < 2 ? -6 : s.h + 6, base = Math.atan2(dy * (n > 3 ? 0.75 : 0.25), dx);
          for (var j = 1; j <= 12; j++) {
            var f = j / 12, a = base + Math.sin(t * 1.1 + q.ph + f * 3) * 0.7 * f, x = px + Math.cos(a) * q.len / 12, y = py + Math.sin(a) * q.len / 12;
            c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.95; c.strokeStyle = '#3B0F6B'; c.lineWidth = q.w * (1 - f * 0.8) + 1; c.beginPath(); c.moveTo(px, py); c.lineTo(x, y); c.stroke();
            if (j % 2 === 0) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '232,121,249', x, y, 2 + 3 * (1 - f), 0.8); }
            px = x; py = y;
          }
        });
        c.globalAlpha = 1; c.globalCompositeOperation = 'lighter'; fxGlow(c, '190,24,93', x0, y0, W * 1.1, 0.22);
        /* a pulse rings out from the eye every few seconds */
        var pc = t % 4; if (pc < 1.4) { var pw = pc / 1.4; fxRing(c, x0, y0, W * (0.6 + pw * 0.6), H * (0.6 + pw * 0.8), '244,114,182', (1 - pw) * 0.6, 2); }
        c.save(); c.globalCompositeOperation = 'source-over'; lids();
        var g = c.createRadialGradient(x0, y0, R * 0.5, x0, y0, W); g.addColorStop(0, '#3B0A2A'); g.addColorStop(1, '#12041C'); c.fillStyle = g; c.fill(); c.clip();
        c.strokeStyle = 'rgba(244,63,94,.4)'; c.lineWidth = 1;
        for (i = 0; i < 10; i++) { var va = i / 10 * FX_TAU + 0.3; c.beginPath(); c.moveTo(x0 + Math.cos(va) * R * 1.05, y0 + Math.sin(va) * R * 1.05); c.quadraticCurveTo(x0 + Math.cos(va + 0.2) * W * 0.75, y0 + Math.sin(va + 0.2) * H * 1.2, x0 + Math.cos(va - 0.1) * W * 1.1, y0 + Math.sin(va - 0.1) * H * 1.6); c.stroke(); }
        c.globalCompositeOperation = 'lighter';
        for (i = 0; i < 96; i++) { var a2 = i / 96 * FX_TAU, sh = 0.5 + 0.5 * Math.sin(i * 1.7 + t * 2), r2 = R * (0.9 + 0.1 * Math.sin(i * 5.1)); c.strokeStyle = 'hsla(' + ((38 + 40 * Math.sin(i * 0.4 + t * 0.5) + (i % 3) * 12 + 360) % 360) + ',100%,' + (50 + 20 * sh) + '%,' + (0.5 + 0.4 * sh) + ')'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + lx + Math.cos(a2) * pr, y0 + ly + Math.sin(a2) * pr); c.lineTo(x0 + lx + Math.cos(a2) * r2, y0 + ly + Math.sin(a2) * r2); c.stroke(); }
        fxRing(c, x0 + lx, y0 + ly, R, R, '251,191,36', 0.9, 2.5); fxRing(c, x0 + lx, y0 + ly, pr, pr, '253,224,71', 0.8, 1.5);
        c.globalCompositeOperation = 'source-over'; c.fillStyle = '#020005'; c.beginPath(); c.arc(x0 + lx, y0 + ly, pr - 1, 0, FX_TAU); c.fill();
        c.restore();
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(244,114,182,.85)'; c.lineWidth = 2; lids(); c.stroke();
        fxGlow(c, '255,255,255', x0 + lx - pr * 0.5, y0 + ly - pr * 0.55, 7, 0.5 * open);
      };
    },
    /* ---- Dreamscape ---- */
    butterflies: function (s) {
      var B = []; for (var i = 0; i < 6; i++) { B.push({ ph: fxR(0, FX_TAU), sp: fxR(0.35, 0.6) * (i % 2 ? 1 : -1), rr: fxR(0.9, 1.15), hue: [285, 200, 330, 45, 160, 20][i], z: fxR(11, 16) }); }
      function fly(c, x, y, z, fl, ang, hue) {
        c.save(); c.translate(x, y); c.rotate(ang);
        [1, -1].forEach(function (sd) { c.save(); c.scale(sd * (0.25 + 0.75 * Math.abs(fl)), 1);
          c.fillStyle = 'hsla(' + hue + ',95%,65%,.92)'; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(z * 0.4, -z * 1.4, z * 1.6, -z * 1.1, z * 1.1, -z * 0.1); c.bezierCurveTo(z * 0.9, z * 0.1, z * 0.3, z * 0.1, 0, 0); c.fill();
          c.fillStyle = 'hsla(' + ((hue + 30) % 360) + ',95%,72%,.92)'; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(z * 1.1, z * 0.1, z, z * 1.1, z * 0.4, z * 0.9); c.bezierCurveTo(z * 0.1, z * 0.7, 0, z * 0.3, 0, 0); c.fill();
          c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(z * 0.9, -z * 0.6, z * 0.14, 0, FX_TAU); c.fill(); c.restore(); });
        c.strokeStyle = '#1E1B4B'; c.lineWidth = Math.max(1.5, z * 0.18); c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -z * 0.5); c.lineTo(0, z * 0.6); c.stroke(); c.restore();
      }
      return function (t) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, R = Math.min(128, s.w * 0.38);
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '236,72,153', x0, y0, R * 1.3, 0.12);
        B.forEach(function (b) {
          var a = t * b.sp + b.ph, sg = b.sp > 0 ? 1 : -1, x = x0 + Math.cos(a) * R * 1.1 * b.rr + Math.sin(t * 1.7 + b.ph) * 8, y = y0 + Math.sin(a) * Math.min(R * 0.48, s.h * 0.35) * b.rr + Math.cos(t * 2.3 + b.ph) * 7, dir = Math.atan2(Math.cos(a) * 0.45 * sg, -Math.sin(a) * sg) + Math.PI / 2;
          c.globalCompositeOperation = 'lighter'; fxGlow(c, '255,255,255', x, y, b.z * 2, 0.18); c.globalCompositeOperation = 'source-over'; fly(c, x, y, b.z, Math.sin(t * 9 + b.ph), dir, b.hue);
        });
      };
    },
    kitsune: function (s) {
      var O = []; for (var i = 0; i < 5; i++) { O.push({ ph: i * FX_TAU / 5, sp: fxR(0.5, 0.8) }); }
      return function (t) {
        var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, bx = x0, by = y0 + s.h * 0.44, L = Math.min(s.h * 0.98, 195), i, j;
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,146,60', x0, by, L, 0.24);
        /* a pillar of light behind the fox, and a slow ring of sparks */
        fxBeam(c, x0, s.h + 10, -Math.PI / 2, s.h * 1.2, 0.16, 'rgba(253,186,116,' + (0.14 + 0.05 * Math.sin(t * 2)) + ')');
        c.lineCap = 'round';
        for (i = 0; i < 9; i++) {
          var base = -Math.PI / 2 + (i - 4) * 0.3, px = bx, py = by;
          for (j = 1; j <= 14; j++) {
            var f = j / 14, a = base + Math.sin(t * 1.3 + i * 0.7 + f * 2.5) * 0.35 * f + (i - 4) * 0.05 * f, x = px + Math.cos(a) * L / 14, y = py + Math.sin(a) * L / 14;
            c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'hsl(' + (20 + f * 26) + ',96%,' + (50 + Math.pow(f, 2.2) * 44) + '%)'; c.lineWidth = 3 + 15 * Math.pow(Math.sin(Math.pow(f, 0.75) * Math.PI), 0.7); c.beginPath(); c.moveTo(px, py); c.lineTo(x, y); c.stroke(); px = x; py = y;
          }
          c.globalCompositeOperation = 'lighter'; fxGlow(c, '255,247,237', px, py, 7, 0.9); fxGlow(c, '125,211,252', px, py, 13 + 3 * Math.sin(t * 5 + i), 0.75);
        }
        /* the fox mask */
        var mx = x0, my = Math.max(22, y0 - s.h * 0.36); c.globalCompositeOperation = 'source-over';
        c.fillStyle = '#FFFBF0'; c.beginPath(); c.moveTo(mx, my + 17); c.lineTo(mx - 15, my + 2); c.lineTo(mx - 17, my - 17); c.lineTo(mx - 6, my - 8); c.lineTo(mx + 6, my - 8); c.lineTo(mx + 17, my - 17); c.lineTo(mx + 15, my + 2); c.closePath(); c.fill();
        c.fillStyle = '#DC2626'; c.beginPath(); c.moveTo(mx - 15, my - 13); c.lineTo(mx - 9, my - 8); c.lineTo(mx - 13, my - 4); c.fill(); c.beginPath(); c.moveTo(mx + 15, my - 13); c.lineTo(mx + 9, my - 8); c.lineTo(mx + 13, my - 4); c.fill();
        c.strokeStyle = '#DC2626'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(mx - 10, my + 1); c.lineTo(mx - 4, my + 3); c.moveTo(mx + 10, my + 1); c.lineTo(mx + 4, my + 3); c.moveTo(mx, my - 6); c.lineTo(mx, my - 1); c.stroke();
        c.fillStyle = '#111827'; c.beginPath(); c.arc(mx, my + 13, 1.8, 0, FX_TAU); c.fill();
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,186,116', mx, my, 30, 0.35);
        O.forEach(function (o, n) { var a3 = t * o.sp + o.ph, ox = x0 + Math.cos(a3) * Math.min(142, s.w * 0.43), oy = y0 + Math.sin(a3) * s.h * 0.3; fxGlow(c, '56,189,248', ox, oy, 12 + 3 * Math.sin(t * 6 + n), 0.8); fxGlow(c, '240,249,255', ox, oy - 2, 4, 1); });
      };
    }
  };
  /* ---------- stage auras: a whole scene above the streak, drawn in a box 330 wide and 190 tall with the ground at y = 160 ---------- */
  var FX_MONO = '"IBM Plex Mono", ui-monospace, monospace';
  var FX_STG = {
    veil: function () {
      var S = [], i; for (i = 0; i < 9; i++) { S.push({ x: -128 + i * 32 + fxR(-8, 8), len: fxR(30, 80), ph: fxR(0, 6) }); }
      return function (c, t) {
        var x, k; c.globalCompositeOperation = 'lighter';
        [['244,114,182', 26, 0], ['45,212,191', 40, 2], ['167,139,250', 54, 4]].forEach(function (A) { for (x = -160; x <= 160; x += 4) { var base = A[1] + Math.sin(x * 0.03 + t * 0.7 + A[2]) * 10 + Math.sin(x * 0.011 - t * 0.4) * 8, h = 34 + 16 * Math.sin(x * 0.05 + t * 1.1 + A[2]); c.globalAlpha = 0.5; c.drawImage(fxSprite(A[0]), x - 4, base - h * 0.5, 8, h * 1.5); } });
        c.globalAlpha = 1;
        S.forEach(function (q) { var sw = Math.sin(t * 1.1 + q.ph) * 5, y = 40 + q.len; c.strokeStyle = 'rgba(251,207,232,.5)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(q.x, 40); c.quadraticCurveTo(q.x + sw * 0.5, 40 + q.len * 0.5, q.x + sw, y); c.stroke(); fxGlow(c, '244,114,182', q.x + sw, y, 9, 0.5); fxStar4(c, q.x + sw, y, 5 + 2 * Math.sin(t * 2.4 + q.ph), 1, '#FBCFE8'); });
        for (k = 0; k < 16; k++) { var a = k / 16 * FX_TAU + t * 0.5; fxGlow(c, '251,207,232', Math.cos(a) * 118, 162 + Math.sin(a) * 20, 22, 0.16 + 0.1 * Math.sin(a)); }
        fxRing(c, 0, 162, 118, 20, '244,114,182', 0.5, 1);
        for (k = 0; k < 10; k++) { var u = (t * 0.2 + k / 10) % 1; fxGlow(c, '167,243,208', -100 + ((k * 61) % 200), 160 - u * 90, 2.5, Math.sin(u * Math.PI) * 0.8); }
      };
    },
    galaxy: function () {
      var D = [], Cn = [[[-120, 40], [-98, 26], [-80, 44], [-62, 30], [-70, 60]], [[70, 22], [92, 36], [116, 26], [124, 52], [100, 60]], [[-30, 64], [-8, 74], [14, 62], [34, 76]]], i;
      for (i = 0; i < 260; i++) { var u0 = Math.random(); D.push({ r: 8 + u0 * 128, a: (i % 2) * Math.PI + u0 * 5.2 + fxR(-0.25, 0.25), z: fxR(0.8, 2.2), h: u0 }); }
      return function (c, t) {
        var k; c.globalCompositeOperation = 'lighter'; fxGlow(c, '147,51,234', 0, 150, 160, 0.34); fxGlow(c, '216,180,254', 0, 150, 52, 0.7); fxGlow(c, '255,255,255', 0, 150, 24, 1);
        D.forEach(function (p) { var a = p.a + t * 0.35; fxGlow(c, p.h < 0.35 ? '255,255,255' : p.h < 0.7 ? '216,180,254' : '129,140,248', Math.cos(a) * p.r, 150 + Math.sin(a) * p.r * 0.3, p.z * 2.3, 0.9); });
        for (k = 0; k < 7; k++) { var u = (t * 0.25 + k / 7) % 1; fxGlow(c, '233,213,255', Math.sin(t * 1.3 + k * 2) * 14 * u, 156 - u * 90, 9 * (1 - u) + 2, (1 - u) * 0.7); }
        fxRing(c, 0, 26, 30, 8, '233,213,255', 0.9, 1.8); for (k = 0; k < 3; k++) { var ha = t * 1.4 + k * FX_TAU / 3; fxGlow(c, '255,255,255', Math.cos(ha) * 30, 26 + Math.sin(ha) * 8, 5, 1); } fxStar4(c, 0, 26, 7 + 2 * Math.sin(t * 3), 1, '#FFFFFF');
        Cn.forEach(function (S, n) { var a = Math.max(0, Math.sin(t * 0.5 + n * 2.1)); if (a <= 0) { return; } c.strokeStyle = 'rgba(216,180,254,' + a * 0.6 + ')'; c.lineWidth = 0.8; c.beginPath(); S.forEach(function (p, m) { if (m) { c.lineTo(p[0], p[1]); } else { c.moveTo(p[0], p[1]); } }); c.stroke(); S.forEach(function (p, m) { fxStar4(c, p[0], p[1], 3.5 + 1.5 * Math.sin(t * 3 + m), a, '#FDE68A'); }); });
      };
    },
    totality: function () {
      var P = [], Fl = [], i; for (i = 0; i < 30; i++) { P.push({ x: fxR(-110, 110), u: Math.random(), sp: fxR(0.15, 0.4), z: fxR(2, 4), k: i % 3 }); } for (i = 0; i < 40; i++) { Fl.push({ a: i / 40 * FX_TAU + fxR(-0.05, 0.05), l: fxR(10, 44), ph: fxR(0, 6) }); }
      return function (c, t, dt) {
        var pu = 0.5 + 0.5 * Math.sin(t * 1.4), k; c.globalCompositeOperation = 'lighter'; fxGlow(c, '234,88,12', 0, 60, 120, 0.3 + 0.1 * pu);
        for (k = 0; k < 9; k++) { fxBeam(c, 0, 60, Math.PI / 2 + (k - 4) * 0.24 + Math.sin(t * 0.4 + k) * 0.04, 150, 0.035, 'rgba(251,146,60,.14)'); }
        c.lineCap = 'round'; Fl.forEach(function (f) { var L = f.l * (0.7 + 0.5 * Math.sin(t * 1.8 + f.ph)) + 6 * pu; c.strokeStyle = 'rgba(' + (f.l > 30 ? '255,247,237' : '251,146,60') + ',.75)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(Math.cos(f.a) * 33, 60 + Math.sin(f.a) * 33); c.lineTo(Math.cos(f.a) * (36 + L), 60 + Math.sin(f.a) * (36 + L)); c.stroke(); });
        fxRing(c, 0, 60, 35, 35, '255,237,213', 1, 2.5); fxRing(c, 0, 60, 40 + pu * 14, 40 + pu * 14, '251,146,60', 0.5 * (1 - pu) + 0.15, 1.5);
        c.globalCompositeOperation = 'source-over'; c.fillStyle = '#050307'; c.beginPath(); c.arc(0, 60, 33, 0, FX_TAU); c.fill();
        c.globalCompositeOperation = 'lighter'; var ba = -0.9 + Math.sin(t * 0.3) * 0.5; fxGlow(c, '255,255,255', Math.cos(ba) * 34, 60 + Math.sin(ba) * 34, 12 + 5 * pu, 1); fxStar4(c, Math.cos(ba) * 34, 60 + Math.sin(ba) * 34, 12, 1, '#FFFFFF');
        c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(5,3,7,.85)'; c.beginPath(); c.ellipse(0, 162, 112, 19, 0, 0, FX_TAU); c.fill(); c.globalCompositeOperation = 'lighter';
        for (k = 0; k < 4; k++) { c.strokeStyle = 'rgba(251,146,60,' + (0.8 - k * 0.15) + ')'; c.lineWidth = 2.4 - k * 0.4; c.beginPath(); c.ellipse(0, 162, 112 - k * 22, 19 - k * 3.8, 0, t * (1 + k * 0.4) + k, t * (1 + k * 0.4) + k + 2.4); c.stroke(); }
        P.forEach(function (p) { p.u = (p.u + dt * p.sp) % 1; var a = Math.sin(p.u * Math.PI); if (p.k) { fxGlow(c, '251,146,60', p.x * (1 - p.u * 0.3), 162 - p.u * 110, p.z * 2, a); } else { c.globalCompositeOperation = 'source-over'; c.globalAlpha = a * 0.9; c.fillStyle = '#050307'; c.strokeStyle = 'rgba(251,146,60,.8)'; c.lineWidth = 0.8; c.fillRect(p.x, 160 - p.u * 110, p.z * 1.4, p.z * 2.4); c.strokeRect(p.x, 160 - p.u * 110, p.z * 1.4, p.z * 2.4); c.globalAlpha = 1; c.globalCompositeOperation = 'lighter'; } });
      };
    },
    crescendo: function () {
      var N = [], next = 0;
      return function (c, t, dt) {
        var beat = Math.pow(Math.max(0, Math.sin(t * 3.2)), 6), i; c.globalCompositeOperation = 'lighter'; fxGlow(c, '96,165,250', 0, 100, 150, 0.18 + 0.12 * beat); c.lineCap = 'round';
        for (i = 0; i < 44; i++) { var a = i / 44 * FX_TAU, x = Math.cos(a) * 124, y = 162 + Math.sin(a) * 22, dp0 = (Math.sin(a) + 1) / 2, h = (8 + 30 * Math.abs(Math.sin(t * 2.4 + i * 0.7) * Math.sin(t * 1.1 + i * 0.31))) * (0.6 + 0.4 * dp0) * (1 + 0.4 * beat); c.strokeStyle = 'rgba(' + (i % 2 ? '191,219,254' : '255,255,255') + ',' + (0.45 + 0.5 * dp0) + ')'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.stroke(); }
        fxRing(c, 0, 162, 124, 22, '147,197,253', 0.6, 1); fxBeam(c, 0, 162, 0, 150, 0.03, 'rgba(255,255,255,.5)'); fxBeam(c, 0, 162, Math.PI, 150, 0.03, 'rgba(255,255,255,.5)'); fxBeam(c, 0, 162, -Math.PI / 2, 60, 0.1, 'rgba(255,255,255,.4)');
        for (i = 0; i < 5; i++) { c.strokeStyle = 'rgba(191,219,254,.45)'; c.lineWidth = 1; c.beginPath(); for (var x2 = -160; x2 <= 160; x2 += 8) { var y2 = 96 + i * 6 + Math.sin(x2 * 0.025 + t * 1.2) * 12; if (x2 === -160) { c.moveTo(x2, y2); } else { c.lineTo(x2, y2); } } c.stroke(); }
        if (t > next || t < next - 3) { next = t + 0.45; N.push({ x: -165, g: ['♪', '♫', '♩', '♬'][Math.floor(Math.random() * 4)], row: Math.floor(Math.random() * 5) }); }
        c.textAlign = 'center';
        for (i = N.length - 1; i >= 0; i--) { var q = N[i]; q.x += dt * 70; if (q.x > 170) { N.splice(i, 1); continue; } var ny = 96 + q.row * 6 + Math.sin(q.x * 0.025 + t * 1.2) * 12; fxGlow(c, '191,219,254', q.x, ny - 4, 9, 0.5); c.fillStyle = '#FFFFFF'; c.font = '700 15px serif'; c.fillText(q.g, q.x, ny); }
        for (i = 0; i < 10; i++) { var ca = i / 10 * FX_TAU + t * 0.4, cx = Math.cos(ca) * 52, cy = 34 + Math.sin(ca) * 11, dp = (Math.sin(ca) + 1) / 2, hh = 14 + 6 * dp + 5 * beat; c.fillStyle = 'rgba(147,197,253,' + (0.35 + 0.5 * dp) + ')'; c.beginPath(); c.moveTo(cx, cy - hh); c.lineTo(cx + 4, cy); c.lineTo(cx, cy + hh * 0.5); c.lineTo(cx - 4, cy); c.fill(); c.strokeStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * dp) + ')'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(cx, cy - hh); c.lineTo(cx, cy + hh * 0.5); c.stroke(); }
        fxGlow(c, '255,255,255', 0, 34, 14 + 8 * beat, 1); fxStar4(c, 0, 34, 12 + 8 * beat, 1, '#FFFFFF');
        if (beat > 0.05) { fxRing(c, 0, 162, 124 + 20 * (1 - beat), 22 + 4 * (1 - beat), '255,255,255', beat * 0.6, 2); }
      };
    },
    hearthwood: function () {
      var Lf = [], Ff = [], i, CAN = [[-46, 62, 30], [-14, 44, 34], [24, 40, 34], [54, 60, 28], [-70, 84, 22], [0, 70, 30], [76, 86, 20], [-30, 86, 24], [36, 84, 24]], G = ['#166534', '#15803D', '#22C55E', '#16A34A'];
      for (i = 0; i < 14; i++) { Lf.push({ x: fxR(-110, 110), u: Math.random(), sp: fxR(0.08, 0.18), ph: fxR(0, 6) }); } for (i = 0; i < 10; i++) { Ff.push({ x: fxR(-130, 130), y: fxR(30, 150), ph: fxR(0, 6), bl: fxR(2, 5) }); }
      return function (c, t, dt) {
        var bob = Math.sin(t * 0.8) * 3, hb = 0.5 + 0.5 * Math.sin(t * 2.2), k;
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '34,197,94', 0, 100, 150, 0.16);
        c.save(); c.translate(0, bob); c.globalCompositeOperation = 'source-over';
        c.fillStyle = '#3F2A1D'; c.beginPath(); c.moveTo(-92, 150); c.quadraticCurveTo(-60, 176, -20, 180); c.lineTo(-4, 190); c.lineTo(10, 178); c.quadraticCurveTo(62, 174, 92, 150); c.closePath(); c.fill();
        c.fillStyle = '#16A34A'; c.beginPath(); c.ellipse(0, 150, 94, 9, 0, 0, FX_TAU); c.fill();
        [[-60, '#F9A8D4'], [-30, '#FDE68A'], [40, '#F9A8D4'], [66, '#FFFFFF'], [14, '#FDE68A']].forEach(function (f) { c.fillStyle = f[1]; c.beginPath(); c.arc(f[0], 148, 1.8, 0, FX_TAU); c.fill(); });
        c.strokeStyle = '#6B4226'; c.lineCap = 'round'; c.lineWidth = 15; c.beginPath(); c.moveTo(0, 150); c.lineTo(0, 112); c.stroke(); c.lineWidth = 10; c.beginPath(); c.moveTo(0, 114); c.quadraticCurveTo(-18, 96, -36, 74); c.moveTo(0, 114); c.quadraticCurveTo(18, 96, 38, 72); c.stroke();
        CAN.forEach(function (q, n) { c.fillStyle = G[n % 4]; c.globalAlpha = 0.93; c.beginPath(); c.arc(q[0] + Math.sin(t * 0.9 + n) * 2, q[1] - 18 + Math.cos(t * 0.7 + n) * 1.5, q[2] * 0.8, 0, FX_TAU); c.fill(); }); c.globalAlpha = 1;
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '134,239,172', 0, 112, 16 + 6 * hb, 0.9); fxGlow(c, '240,253,244', 0, 112, 6, 1); c.globalCompositeOperation = 'source-over';
        c.fillStyle = '#8B5E3C'; c.fillRect(42, 104, 24, 16); c.fillStyle = '#5B3A22'; c.beginPath(); c.moveTo(38, 105); c.lineTo(54, 92); c.lineTo(70, 105); c.fill(); c.fillStyle = 'rgba(253,224,71,' + (0.8 + 0.2 * Math.sin(t * 6)) + ')'; c.fillRect(50, 109, 7, 7); c.fillStyle = '#8B5E3C'; c.fillRect(36, 120, 36, 2.5);
        c.strokeStyle = 'rgba(253,230,138,.5)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-58, 98); c.quadraticCurveTo(-10, 128, 40, 106); c.stroke();
        c.globalCompositeOperation = 'lighter';
        for (k = 0; k <= 6; k++) { var u = k / 6, v = 1 - u; fxGlow(c, '253,224,71', v * v * -58 + 2 * v * u * -10 + u * u * 40, v * v * 98 + 2 * v * u * 128 + u * u * 106 + 2, 5, 0.6 + 0.4 * Math.sin(t * 3 + k * 1.3)); }
        c.restore();
        c.globalCompositeOperation = 'source-over';
        Lf.forEach(function (p, n) { p.u = (p.u + dt * p.sp) % 1; c.save(); c.translate(p.x + Math.sin(t * 1.3 + p.ph) * 12, 40 + p.u * 140); c.rotate(t * 2 + p.ph); c.globalAlpha = Math.sin(p.u * Math.PI) * 0.9; c.fillStyle = G[(n + 2) % 4]; c.beginPath(); c.ellipse(0, 0, 4, 1.8, 0, 0, FX_TAU); c.fill(); c.restore(); });
        c.globalCompositeOperation = 'lighter'; Ff.forEach(function (f) { var on = Math.max(0, Math.sin((t + f.ph) / f.bl * FX_TAU)); fxGlow(c, '190,242,100', f.x + Math.sin(t * 0.5 + f.ph) * 10, f.y + Math.cos(t * 0.4 + f.ph) * 8, 3 + 6 * on, 0.2 + 0.8 * on); });
      };
    },
    seraph: function () {
      var Sw = [], next = 1;
      /* a wing: broad feathers fanned along an arm that lifts and settles; the longest in the middle */
      function wing(c, sd, ang, len, t, k) {
        var lift = Math.sin(t * 1.2 + k) * 0.07;
        for (var f = 0; f < 8; f++) {
          var u = f / 7, a = ang + (u - 0.5) * 0.62 + lift, L = len * (0.62 + 0.38 * Math.sin(u * Math.PI)), bx = sd * (6 + u * 10), by = 92 + (u - 0.5) * 8, tx = bx + sd * Math.cos(a) * L, ty = by + Math.sin(a) * L, nx = -Math.sin(a) * 5.5, ny = Math.cos(a) * 5.5 * sd, mx = (bx + tx) / 2, my = (by + ty) / 2, g = c.createLinearGradient(bx, by, tx, ty);
          g.addColorStop(0, 'rgba(255,253,244,.98)'); g.addColorStop(0.55, 'rgba(253,230,138,.85)'); g.addColorStop(1, 'rgba(251,191,36,.35)');
          c.fillStyle = g; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(mx + nx * sd, my + ny, tx, ty); c.quadraticCurveTo(mx - nx * sd, my - ny, bx, by); c.fill();
          c.strokeStyle = 'rgba(180,120,20,.35)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke();
        }
      }
      return function (c, t, dt) {
        var i, pw = (t % 2.5) / 2.5; c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,191,36', 0, 92, 150, 0.22); fxBeam(c, 0, 165, -Math.PI / 2, 180, 0.07, 'rgba(253,230,138,.22)');
        fxRing(c, 0, 162, 40 + pw * 95, 7 + pw * 17, '253,224,71', (1 - pw) * 0.8, 2); fxRing(c, 0, 162, 120, 21, '251,191,36', 0.45, 1.2);
        for (i = 0; i < 14; i++) { var ra = i / 14 * FX_TAU + t * 0.3, dp = (Math.sin(ra) + 1) / 2; fxRune(c, Math.cos(ra) * 120, 162 + Math.sin(ra) * 21, 5 + 2 * dp, i, 'rgba(254,243,199,' + (0.4 + 0.4 * dp).toFixed(2) + ')'); }
        c.globalCompositeOperation = 'source-over';
        [[0.55, 78, 2], [-0.12, 118, 1], [-0.85, 104, 0]].forEach(function (w) { wing(c, 1, w[0], w[1], t, w[2]); wing(c, -1, w[0], w[1], t, w[2]); });
        [[-0.85, 64], [-0.12, 74], [0.55, 50], [-0.5, 96]].forEach(function (e, n) { [1, -1].forEach(function (sd) { var bl = ((t * 0.7 + n * 0.9 + (sd > 0 ? 0 : 0.4)) % 3.2) < 0.15 ? 0.1 : 1; fxEye(c, sd * Math.cos(e[0]) * e[1], 92 + Math.sin(e[0]) * e[1], 7, bl, -sd * 0.6, 0.3, '#38BDF8', 0.95); }); });
        c.globalCompositeOperation = 'lighter';
        fxRing(c, 0, 28, 30, 9, '253,224,71', 0.9, 2); fxRing(c, 0, 28, 22, 6.5, '255,251,235', 0.6, 1); for (i = 0; i < 8; i++) { var ha = i / 8 * FX_TAU + t * 0.6; fxGlow(c, '255,251,235', Math.cos(ha) * 30, 28 + Math.sin(ha) * 9, 4, 0.9); }
        fxGlow(c, '255,255,255', 0, 92, 34, 1); fxStar4(c, 0, 92, 30 + 5 * Math.sin(t * 3), 1, '#FFFFFF'); c.save(); c.translate(0, 92); c.rotate(Math.PI / 4 + t * 0.4); fxStar4(c, 0, 0, 13, 0.9, '#FDE68A'); c.restore();
        if (t > next || t < next - 3) { next = t + fxR(0.5, 1.2); Sw.push({ x: fxR(-140, 140), l: 0 }); }
        for (i = Sw.length - 1; i >= 0; i--) { var q = Sw[i]; q.l += dt; if (q.l > 0.9) { Sw.splice(i, 1); continue; } var f = q.l / 0.45, y = Math.min(160, -20 + f * 180);
          if (f < 1) { c.strokeStyle = 'rgba(255,251,235,.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(q.x, y - 26); c.lineTo(q.x, y); c.stroke(); c.lineWidth = 1; c.beginPath(); c.moveTo(q.x - 4, y - 20); c.lineTo(q.x + 4, y - 20); c.stroke(); fxGlow(c, '253,224,71', q.x, y, 6, 0.8); }
          else { var v = (q.l - 0.45) / 0.45; fxRing(c, q.x, 162, 4 + v * 22, 1 + v * 5, '253,224,71', 1 - v, 1.5); } }
      };
    },
    segfault: function () {
      var R = [], i; for (i = 0; i < 24; i++) { R.push({ x: fxR(-120, 120), u: Math.random(), sp: fxR(0.2, 0.5), w: fxR(3, 9), h: fxR(2, 5) }); }
      return function (c, t, dt) {
        var T = Math.floor(t * 12), jit = (T % 17 === 0 || T % 23 === 1) ? 1 : 0, k, wy = 74, wx = (T % 5 === 0 ? ((T * 3) % 7) - 3 : 0);
        c.save(); c.translate(jit ? ((T * 7) % 9) - 4 : 0, 0);
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '34,197,94', 0, 100, 140, 0.18);
        fxRing(c, 0, 162, 122, 21, '74,222,128', 0.8, 1.4); c.strokeStyle = 'rgba(74,222,128,.7)'; c.lineWidth = 1; for (k = 0; k < 24; k++) { var a = k / 24 * FX_TAU + t * 0.5; c.beginPath(); c.moveTo(Math.cos(a) * 110, 162 + Math.sin(a) * 19); c.lineTo(Math.cos(a) * 122, 162 + Math.sin(a) * 21); c.stroke(); }
        R.forEach(function (p) { p.u = (p.u + dt * p.sp) % 1; c.fillStyle = 'rgba(' + (p.w > 7 ? '187,247,208' : '34,197,94') + ',' + Math.sin(p.u * Math.PI) * 0.8 + ')'; c.fillRect(Math.round(p.x / 4) * 4, Math.round((160 - p.u * 140) / 4) * 4, p.w, p.h); });
        fxGlow(c, '74,222,128', wx, wy + 6, 50, 0.3); c.strokeStyle = '#4ADE80'; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath(); c.moveTo(wx, wy - 40); c.lineTo(wx + 42, wy + 30); c.lineTo(wx - 42, wy + 30); c.closePath(); c.stroke();
        c.fillStyle = '#BBF7D0'; c.fillRect(wx - 3, wy - 16, 6, 26); c.fillRect(wx - 3, wy + 15, 6, 6);
        if (jit) { c.fillStyle = 'rgba(255,0,90,.5)'; c.fillRect(wx - 50, wy - 10 + (T % 30), 100, 5); c.fillStyle = 'rgba(0,229,255,.5)'; c.fillRect(wx - 36, wy + (T % 22), 100, 4); }
        c.font = '600 9px ' + FX_MONO; c.textAlign = 'center'; c.fillStyle = 'rgba(134,239,172,.8)';
        for (k = 0; k < 12; k++) { var s0 = Math.floor(t * 3 + k * 1.37); if ((s0 * 7 + k) % 3 === 0) { continue; } c.fillText('0x' + ((s0 * 2654435 + k * 977) >>> 0).toString(16).slice(-4).toUpperCase(), -130 + ((s0 * 53 + k * 91) % 260), 16 + ((s0 * 31 + k * 47) % 130)); }
        if (T % 9 < 2) { var b0 = (T * 1.3) % FX_TAU; fxBolt(c, fxJag(Math.cos(b0) * 60, 74 + Math.sin(b0) * 44, Math.cos(b0 + 1) * 96, 74 + Math.sin(b0 + 1) * 60, 0.5, 4), 0.9, '74,222,128'); }
        c.restore();
      };
    },
    overtime: function () {
      var M = ['x²', '3x+7', '√2', 'π', 'y=mx+b', '½', 'a²+b²', '≠', '∑', '2πr'], F = [], next = 0, RN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      function clock(c, x, y, r, t, sp, a) {
        fxRing(c, x, y, r, r, '147,197,253', 0.9 * a, 1.6); fxRing(c, x, y, r * 0.86, r * 0.86, '96,165,250', 0.4 * a, 1); c.strokeStyle = 'rgba(219,234,254,' + 0.9 * a + ')'; c.lineCap = 'round';
        for (var i = 0; i < 12; i++) { var an = i / 12 * FX_TAU; c.lineWidth = i % 3 ? 1 : 2; c.beginPath(); c.moveTo(x + Math.cos(an) * r * 0.74, y + Math.sin(an) * r * 0.74); c.lineTo(x + Math.cos(an) * r * 0.86, y + Math.sin(an) * r * 0.86); c.stroke(); }
        var m = t * sp - Math.PI / 2, h = t * sp / 12 - Math.PI / 2; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(m) * r * 0.7, y + Math.sin(m) * r * 0.7); c.stroke(); c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(h) * r * 0.45, y + Math.sin(h) * r * 0.45); c.stroke(); fxGlow(c, '219,234,254', x, y, r * 0.16, a);
      }
      return function (c, t, dt) {
        var i, k; c.globalCompositeOperation = 'lighter'; fxGlow(c, '37,99,235', 0, 100, 160, 0.28); fxGlow(c, '96,165,250', 0, 165, 120, 0.2); c.textAlign = 'center';
        [[132, 22, 0.25, 12], [98, 16.5, -0.4, 12], [62, 10.5, 0.7, 8]].forEach(function (R, n) { fxRing(c, 0, 162, R[0], R[1], n ? '96,165,250' : '147,197,253', 0.7, 1.3); for (k = 0; k < R[3]; k++) { var a = k / R[3] * FX_TAU + t * R[2], x = Math.cos(a) * R[0] * 0.93, y = 162 + Math.sin(a) * R[1] * 0.93, dp = (Math.sin(a) + 1) / 2; if (!n) { c.fillStyle = 'rgba(219,234,254,' + (0.35 + 0.6 * dp) + ')'; c.font = '600 ' + (6 + 3 * dp).toFixed(1) + 'px ' + FX_MONO; c.fillText(RN[k], x, y + 3); } else { fxGlow(c, '191,219,254', x, y, 2.5 + 1.5 * dp, 0.5 + 0.5 * dp); } } });
        c.strokeStyle = 'rgba(147,197,253,.9)'; c.lineWidth = 1.5; c.beginPath(); for (k = 0; k <= 48; k++) { var ga = k / 48 * FX_TAU + t * 0.9, gr = k % 4 < 2 ? 30 : 23; if (k) { c.lineTo(Math.cos(ga) * gr, 162 + Math.sin(ga) * gr * 0.17); } else { c.moveTo(Math.cos(ga) * gr, 162 + Math.sin(ga) * gr * 0.17); } } c.stroke();
        clock(c, 0, 78, 50, t, 1.05, 1); clock(c, -112, 66, 24, t, -2.2, 0.7); clock(c, 112, 56, 20, t, 3.4, 0.7);
        for (i = 0; i < 4; i++) { for (k = 8; k >= 0; k--) { var oa = t * 0.9 + i * FX_TAU / 4 - k * 0.07; fxGlow(c, '191,219,254', Math.cos(oa) * 86, 96 + Math.sin(oa) * 30, k ? 3.5 * (1 - k / 10) : 7, k ? 0.5 * (1 - k / 9) : 1); } }
        if (t > next || t < next - 3) { next = t + 0.7; F.push({ g: M[Math.floor(Math.random() * M.length)], x: fxR(-140, 140), y: fxR(30, 140), l: 0 }); }
        for (i = F.length - 1; i >= 0; i--) { var q = F[i]; q.l += dt; if (q.l > 2.4) { F.splice(i, 1); continue; } c.globalAlpha = Math.sin(q.l / 2.4 * Math.PI) * 0.85; c.fillStyle = '#DBEAFE'; c.font = '600 10px ' + FX_MONO; c.fillText(q.g, q.x, q.y - q.l * 8); } c.globalAlpha = 1;
      };
    },
    tesseract: function () {
      var V = [], E = [], P = [], i, j; for (i = 0; i < 16; i++) { V.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]); }
      for (i = 0; i < 16; i++) { for (j = i + 1; j < 16; j++) { var d = i ^ j; if (d === 1 || d === 2 || d === 4 || d === 8) { E.push([i, j, d]); } } }
      for (i = 0; i < 40; i++) { P.push({ a: fxR(0, FX_TAU), r: fxR(0.3, 1), sp: fxR(0.2, 0.6), b: i % 2 }); }
      return function (c, t, dt) {
        var cyc = t % 5, boom = cyc < 0.6 ? 1 - cyc / 0.6 : 0, sc = 30 * (1 + 0.25 * boom), a1 = t * 0.7, a2 = t * 0.45, a3 = t * 0.3, Q = [], k;
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '168,85,247', 0, 80, 110, 0.22 + 0.3 * boom);
        fxRing(c, 0, 162, 130, 22, '34,211,238', 0.7, 1.2); fxRing(c, 0, 162, 88, 15, '232,121,249', 0.5, 1); fxRing(c, 0, 162, 46, 8, '34,211,238', 0.5, 1);
        c.lineWidth = 1; for (k = 0; k < 12; k++) { var ga = k / 12 * FX_TAU + t * 0.2; c.strokeStyle = 'hsla(' + ((k * 30 + t * 40) % 360) + ',100%,65%,.4)'; c.beginPath(); c.moveTo(0, 162); c.lineTo(Math.cos(ga) * 130, 162 + Math.sin(ga) * 22); c.stroke(); }
        fxBeam(c, -120, 165, -1.05, 150, 0.09, 'rgba(34,211,238,.16)'); fxBeam(c, 120, 165, -Math.PI + 1.05, 150, 0.09, 'rgba(232,121,249,.16)');
        V.forEach(function (v) { var x = v[0], y = v[1], z = v[2], w = v[3], n;
          n = x * Math.cos(a1) - w * Math.sin(a1); w = x * Math.sin(a1) + w * Math.cos(a1); x = n;
          n = y * Math.cos(a2) - z * Math.sin(a2); z = y * Math.sin(a2) + z * Math.cos(a2); y = n;
          n = x * Math.cos(a3) - z * Math.sin(a3); z = x * Math.sin(a3) + z * Math.cos(a3); x = n;
          var pw = 2 / (2.4 - w), pz = 4 / (4 - z * pw); Q.push([x * pw * pz * sc, 80 + y * pw * pz * sc, pw]); });
        E.forEach(function (e) { var p = Q[e[0]], q = Q[e[1]]; c.strokeStyle = 'hsla(' + ((e[2] * 40 + t * 60) % 360) + ',100%,68%,' + Math.min(0.95, 0.35 + 0.3 * (p[2] + q[2]) / 2) + ')'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); });
        Q.forEach(function (p) { fxGlow(c, '255,255,255', p[0], p[1], 2 + 2.5 * p[2], 0.9); });
        fxStar4(c, 0, 80, 7 + 16 * boom, 1, '#FFFFFF');
        P.forEach(function (p) { p.r -= dt * p.sp * 0.5; if (cyc < 0.1) { p.r = fxR(0.9, 1.3); } if (p.r < 0.05) { p.r = 1; } fxGlow(c, p.b ? '34,211,238' : '232,121,249', Math.cos(p.a + t * 0.6) * 110 * p.r, 80 + Math.sin(p.a + t * 0.6) * 66 * p.r, 2.5, Math.min(1, p.r * 2)); });
        c.font = '600 8px ' + FX_MONO; c.textAlign = 'center'; for (k = 0; k < 10; k++) { c.fillStyle = 'rgba(165,243,252,' + (0.25 + 0.5 * Math.abs(Math.sin(t * 2 + k * 1.7))) + ')'; c.fillText(((Math.floor(t * 4) + k * 7) % 3) ? '1' : '0', -135 + k * 30, 14 + ((k * 37 + t * 14) % 120)); }
      };
    },
    equilibrium: function () {
      return function (c, t) {
        var ph = Math.floor(t / 6) % 2, fl = (t % 6) < 0.35 ? 1 - (t % 6) / 0.35 : 0, A = ph ? '12,12,16' : '255,255,255', B = ph ? '255,255,255' : '12,12,16', i;
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '255,255,255', 0, 95, 140, 0.1 + 0.25 * fl); c.globalCompositeOperation = 'source-over';
        c.fillStyle = 'rgba(' + A + ',.3)'; c.beginPath(); c.ellipse(-34, 162, 96, 20, 0, 0, FX_TAU); c.fill(); c.fillStyle = 'rgba(' + B + ',.5)'; c.beginPath(); c.ellipse(34, 162, 96, 20, 0, 0, FX_TAU); c.fill();
        fxRing(c, -34, 162, 96, 20, '255,255,255', 0.6, 1.2); fxRing(c, 34, 162, 96, 20, '255,255,255', 0.6, 1.2);
        for (i = 0; i < 22; i++) { var h = 6 + 16 * Math.abs(Math.sin(t * 3 + i * 0.9) * Math.cos(t * 1.3 + i * 0.4)), x = -130 + i * 12; c.fillStyle = (i + ph) % 2 ? '#FFFFFF' : '#0C0C10'; c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 0.8; c.fillRect(x, 186 - h, 7, h); c.strokeRect(x, 186 - h, 7, h); }
        c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 44); c.lineTo(0, 150); c.stroke();
        [0, Math.PI].map(function (o, n) { var a = t * 1.1 + o; return { x: Math.cos(a) * 78, y: 96 + Math.sin(a) * 22, d: Math.sin(a), w: n === ph }; }).sort(function (p, q) { return p.d - q.d; }).forEach(function (q) {
          var r = 17 + 4 * q.d; c.globalCompositeOperation = 'lighter'; fxGlow(c, '255,255,255', q.x, q.y, r * 2.2, 0.35); c.globalCompositeOperation = 'source-over'; c.fillStyle = q.w ? '#FAFAFA' : '#08080C'; c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.6; c.beginPath(); c.arc(q.x, q.y, r, 0, FX_TAU); c.fill(); c.stroke(); fxStar4(c, q.x, q.y, r * 0.7, 1, q.w ? '#08080C' : '#FAFAFA'); fxRing(c, q.x, q.y, r * 1.5, r * 0.45, '255,255,255', 0.7, 1); });
        c.textAlign = 'center'; c.textBaseline = 'middle';
        ['+', '−', '=', '∅'].forEach(function (g, n) { var a = n / 4 * FX_TAU + t * 0.5, x = Math.cos(a) * 46, y = 30 + Math.sin(a) * 10, w = n % 2 === ph; c.fillStyle = w ? '#FAFAFA' : '#08080C'; c.strokeStyle = '#FFFFFF'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 8, 0, FX_TAU); c.fill(); c.stroke(); c.fillStyle = w ? '#08080C' : '#FAFAFA'; c.font = '700 10px ' + FX_MONO; c.fillText(g, x, y + 0.5); });
        c.textBaseline = 'alphabetic';
        if (fl > 0) { c.globalCompositeOperation = 'lighter'; fxRing(c, 0, 95, 30 + (1 - fl) * 140, 12 + (1 - fl) * 70, '255,255,255', fl, 3); }
      };
    },
    monolith: function () {
      var Sh = [], W = ['focus.', 'again.', 'one more.', 'breathe.', 'almost.', 'keep going.'], ST = [[-112, 24, 62], [-60, 30, 92], [0, 42, 128], [60, 30, 86], [112, 24, 58]], i;
      for (i = 0; i < 24; i++) { Sh.push({ x: fxR(-125, 125), u: Math.random(), sp: fxR(0.12, 0.3), z: fxR(2.5, 5.5), r: fxR(0, 6) }); }
      return function (c, t, dt) {
        var inv = (t % 9) > 8.2, fg = inv ? '10,10,14' : '255,255,255', dk = inv ? '#F4F4F5' : '#0A0A10', gap = 4 + 2 * Math.sin(t * 1.4);
        c.globalCompositeOperation = 'source-over';
        if (inv) { c.fillStyle = 'rgba(244,244,245,.95)'; c.fillRect(-170, -8, 340, 204); }
        else { c.globalCompositeOperation = 'lighter'; fxGlow(c, '255,255,255', 0, 110, 150, 0.1); c.globalCompositeOperation = 'source-over'; }
        fxRing(c, 0, 162, 132, 22, fg, 0.5, 1.2); fxRing(c, 0, 162, 100, 16, fg, 0.25, 1);
        c.fillStyle = 'rgba(' + fg + ',.3)'; c.beginPath(); c.moveTo(-12, 150); c.lineTo(12, 150); c.lineTo(34, 184); c.lineTo(-34, 184); c.fill();
        ST.forEach(function (q, n) {
          var X = q[0], w = q[1], h = q[2], top = 160 - h; c.fillStyle = dk; c.strokeStyle = 'rgba(' + fg + ',.85)'; c.lineWidth = 1.2; c.lineJoin = 'round';
          if (n === 2) {
            [[-1, [[X - w / 2, 160], [X - w / 2 + 3, top + 14], [X - 8, top], [X - 2, top + 22], [X - 5, top + 60], [X - 1, 160]]], [1, [[X + 1, 160], [X + 5, top + 60], [X + 2, top + 22], [X + 9, top + 6], [X + w / 2 - 2, top + 20], [X + w / 2, 160]]]].forEach(function (hf) { c.beginPath(); hf[1].forEach(function (p, m) { if (m) { c.lineTo(p[0] + hf[0] * gap, p[1]); } else { c.moveTo(p[0] + hf[0] * gap, p[1]); } }); c.closePath(); c.fill(); c.stroke(); });
            if (inv) { c.fillStyle = '#0A0A10'; c.fillRect(X - 1.5, top, 3, h); } else { c.globalCompositeOperation = 'lighter'; fxBeam(c, X, 164, -Math.PI / 2, h + 40, 0.03, 'rgba(255,255,255,.95)'); fxGlow(c, '255,255,255', X, top + h * 0.45, 26 + gap * 2, 0.7); c.globalCompositeOperation = 'source-over'; }
          } else {
            c.beginPath(); c.moveTo(X - w / 2, 160); c.lineTo(X - w / 2 + 2, top + 12); c.lineTo(X - w * 0.1, top); c.lineTo(X + w * 0.3, top + 9); c.lineTo(X + w / 2, top + 24); c.lineTo(X + w / 2, 160); c.closePath(); c.fill(); c.stroke();
            c.beginPath(); c.moveTo(X - w * 0.1, top + 6); c.lineTo(X + 2, top + h * 0.4); c.lineTo(X - 4, top + h * 0.7); c.stroke();
          }
        });
        Sh.forEach(function (p) { p.u = (p.u + dt * p.sp) % 1; c.save(); c.translate(p.x + Math.sin(t + p.r) * 5, 165 - p.u * 150); c.rotate(t * 1.5 + p.r); c.globalAlpha = Math.sin(p.u * Math.PI) * 0.85; c.fillStyle = 'rgb(' + fg + ')'; c.beginPath(); c.moveTo(0, -p.z); c.lineTo(p.z * 0.5, 0); c.lineTo(0, p.z); c.lineTo(-p.z * 0.5, 0); c.fill(); c.restore(); });
        var wi = Math.floor(t / 2.6); c.globalAlpha = Math.sin(((t / 2.6) % 1) * Math.PI) * 0.85; c.fillStyle = 'rgb(' + fg + ')'; c.font = '600 10px ' + FX_MONO; c.textAlign = 'center'; c.fillText(W[wi % W.length], [-95, 92, -36, 100, -108, 36][wi % 6], [40, 30, 18, 60, 74, 22][wi % 6]); c.globalAlpha = 1;
      };
    }
  };
  function fxStageCls(k) { return FX_STG[k] ? ' pz-plate-stage' : ''; }
  Object.keys(FX_STG).forEach(function (k) {
    FX_AURA[k] = function (s) { var d = FX_STG[k](); return function (t, dt) { var c = s.ctx, big = s.h > 210, u = (big ? 190 : s.h) / 190; c.save(); c.translate(s.w / 2, big ? 6 : 0); c.scale(u, u); d(c, t, dt); c.restore(); }; };
  });
  /* an aura canvas starts as soon as it is on the page (Home, the Crates page) */
  function fxScan() { $$('canvas[data-pz-aura]').forEach(function (cv) { if (cv.getAttribute('data-fx-on')) { return; } var a = FX_AURA[cv.getAttribute('data-pz-aura')]; if (a) { cv.setAttribute('data-fx-on', '1'); fxScene(cv, a); } }); }
  var fxScanQ = 0;
  if ('MutationObserver' in window) { new MutationObserver(function () { if (!fxScanQ) { fxScanQ = requestAnimationFrame(function () { fxScanQ = 0; fxScan(); }); } }).observe(document.body, { childList: true, subtree: true }); }

  /* ---------- right-answer effects ---------- */
  var FX_DUR = { sparkle: 1.1, confetti: 1.7, fireworks: 1.6, lightning: 1.5, storm: 1.9, golden: 2.3, comet: 1.95, supernova: 3.1, splash: 1.3, koi: 2.45, spell: 1.75, phoenix: 2.85, pixel: 1.05, freeze: 3.35, boo: 1.3, bats: 1.8, nightmare: 3.5, wormhole: 1.6, abduct: 2.9, paint: 1.2, cranes: 2.2 };
  function fxDim(c, s, k, a, col) { if (!(a > 0)) { return; } c.globalCompositeOperation = 'source-over'; c.globalAlpha = Math.min(1, a); c.fillStyle = col || '#05050C'; c.beginPath(); c.rect(0, 0, s.w, s.h); fxRR(c, k.x - 2, k.y - 2, k.w + 4, k.h + 4, 13); c.fill('evenodd'); c.globalAlpha = 1; }
  function fxCardGlow(c, k, rgb, a) { c.globalCompositeOperation = 'lighter'; [[10, 0.18], [4, 0.5], [1.5, 1]].forEach(function (L) { c.globalAlpha = Math.max(0, Math.min(1, a * L[1])); c.lineWidth = L[0]; c.strokeStyle = 'rgb(' + rgb + ')'; c.beginPath(); fxRR(c, k.x - 1, k.y - 1, k.w + 2, k.h + 2, 12); c.stroke(); }); c.globalAlpha = 1; }
  function fxRainbow(c, k, t, a) { var g = c.createLinearGradient(k.x, 0, k.x + k.w, 0); for (var i = 0; i <= 6; i++) { g.addColorStop(i / 6, 'hsl(' + ((i * 60 + t * 220) % 360) + ',100%,65%)'); } c.globalCompositeOperation = 'lighter'; [[9, 0.25], [3.5, 0.6], [1.5, 1]].forEach(function (L) { c.globalAlpha = Math.max(0, Math.min(1, a * L[1])); c.lineWidth = L[0]; c.strokeStyle = g; c.beginPath(); fxRR(c, k.x - 1, k.y - 1, k.w + 2, k.h + 2, 12); c.stroke(); }); c.globalAlpha = 1; }
  function fxPerim(k, d) { var w = k.w, h = k.h, P = 2 * (w + h); d = ((d % P) + P) % P; if (d < w) { return [k.x + d, k.y]; } d -= w; if (d < h) { return [k.x + w, k.y + d]; } d -= h; if (d < w) { return [k.x + w - d, k.y + h]; } d -= w; return [k.x, k.y + h - d]; }
  var FX_DRAW = {
    sparkle: function (s, k) {
      var P = []; for (var i = 0; i < 9; i++) { P.push({ a: fxR(0, FX_TAU), d: fxR(0.55, 1.1), at: i * 0.07, z: fxR(6, 11) }); }
      return function (t) { var c = s.ctx; P.forEach(function (p) { var u = (t - p.at) / 0.8; if (u < 0 || u > 1) { return; } var r = p.z * Math.sin(u * Math.PI); fxStar4(c, k.cx + Math.cos(p.a) * k.w * 0.55 * p.d, k.cy + Math.sin(p.a) * (k.h * 0.5 + 26) * p.d, r, 1, '#F5B400'); fxStar4(c, k.cx + Math.cos(p.a) * k.w * 0.55 * p.d, k.cy + Math.sin(p.a) * (k.h * 0.5 + 26) * p.d, r * 0.45, 1, '#FFFBEB'); }); };
    },
    confetti: function (s, k) {
      var cols = ['#2563EB', '#7C3AED', '#F5B400', '#16A34A', '#DB2777'], P = [];
      for (var i = 0; i < 42; i++) { P.push({ x: k.cx + fxR(-k.w * 0.3, k.w * 0.3), y: k.cy, vx: fxR(-260, 260), vy: fxR(-420, -160), r: fxR(0, FX_TAU), vr: fxR(-9, 9), w: fxR(5, 8), h: fxR(9, 13), col: cols[i % 5] }); }
      return function (t, dt) { var c = s.ctx, a = t > 1.2 ? Math.max(0, 1 - (t - 1.2) / 0.5) : 1; P.forEach(function (p) { p.vy += 620 * dt; p.vx *= Math.pow(0.4, dt); p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.globalAlpha = a; c.fillStyle = p.col; c.fillRect(-p.w / 2, -p.h / 2 * Math.abs(Math.cos(p.r * 1.7)), p.w, p.h * Math.abs(Math.cos(p.r * 1.7)) + 1); c.restore(); }); };
    },
    fireworks: function (s, k) {
      var cols = ['250,204,21', '244,114,182', '96,165,250', '74,222,128', '192,132,252'], B = [[k.cx - Math.min(110, k.w * 0.35), k.y - 34, 0], [k.cx + Math.min(120, k.w * 0.38), k.y - 44, 0.38]];
      return function (t) { var c = s.ctx; c.globalCompositeOperation = FX_INK.dark ? 'lighter' : 'source-over'; B.forEach(function (b, bi) { var u = (t - b[2]) / 1.0; if (u < 0 || u > 1) { return; } var e = 1 - Math.pow(1 - u, 3); for (var j = 0; j < 18; j++) { var a = j / 18 * FX_TAU, R = 58 * e; for (var tr = 0; tr < 4; tr++) { var rr2 = R * (1 - tr * 0.12); c.globalAlpha = (1 - u) * (1 - tr * 0.22); c.fillStyle = 'rgb(' + cols[(j + bi) % 5] + ')'; c.beginPath(); c.arc(b[0] + Math.cos(a) * rr2, b[1] + Math.sin(a) * rr2 + 22 * u * u, Math.max(0.6, 2.6 - tr * 0.5), 0, FX_TAU); c.fill(); } } }); c.globalAlpha = 1; };
    },
    lightning: function (s, k) {
      var strikes = [0.12, 0.3, 0.52].map(function (at) { var tx = k.x + fxR(0.2, 0.8) * k.w, main = fxJag(tx + fxR(-90, 90), -6, tx, k.y + 2, 0.5, 6), j = main[Math.floor(main.length * fxR(0.3, 0.6))]; return { at: at, main: main, br: fxJag(j[0], j[1], j[0] + fxR(-70, 70), j[1] + fxR(16, 40), 0.5, 4) }; });
      return function (t) {
        var c = s.ctx; fxDim(c, s, k, 0.86 * fxEnv(t, 0, 0.12, 1.05, 1.5)); c.globalCompositeOperation = 'lighter';
        strikes.forEach(function (q) { var u = t - q.at; if (u < 0 || u > 0.18) { return; } var a = (u < 0.05 ? 1 : 1 - (u - 0.05) / 0.13) * (0.75 + 0.25 * Math.random()); fxBolt(c, q.main, a, '125,211,252'); fxBolt(c, q.br, a * 0.7, '125,211,252'); if (u < 0.07) { c.globalAlpha = (0.07 - u) / 0.07 * 0.4; c.fillStyle = '#E0F2FE'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; } });
        var e = fxEnv(t, 0.12, 0.16, 1.1, 1.4);
        if (e > 0) { fxCardGlow(c, k, '56,189,248', e * (0.75 + 0.25 * Math.random())); for (var i = 0; i < 2; i++) { var p = fxPerim(k, fxR(0, 2 * (k.w + k.h))); fxBolt(c, fxJag(p[0], p[1], p[0] + fxR(-16, 16), p[1] + fxR(-16, 16), 0.6, 3), e * 0.8, '125,211,252'); } }
      };
    },
    storm: function (s, k) {
      var G = ['π', '√', '∑', '∞', 'θ', 'Δ', '∫', '≈', '≠', '∠', '½', 'x²', 'y', '÷'], cols = ['#7C3AED', '#2563EB', '#DB2777', '#D97706', '#0D9488'], P = [];
      for (var i = 0; i < 34; i++) { P.push({ g: G[i % G.length], a: fxR(0, FX_TAU), r: fxR(150, 230), sp: fxR(3, 5), col: cols[i % 5], z: fxR(13, 20), out: fxR(160, 260) }); }
      return function (t) {
        var c = s.ctx; c.textAlign = 'center'; c.textBaseline = 'middle';
        P.forEach(function (p) { var r, ang, a = 1; if (t < 0.9) { var e1 = Math.pow(t / 0.9, 2); r = p.r * (1 - e1) + 26 * e1; ang = p.a + p.sp * (t / 0.9) * 1.6; } else { var u2 = (t - 0.9) / 0.9; r = 26 + p.out * (1 - Math.pow(1 - u2, 3)); ang = p.a + p.sp * 1.6 + u2 * 0.6; a = 1 - u2; } c.globalAlpha = Math.max(0, a) * 0.95; c.fillStyle = p.col; c.font = '700 ' + p.z.toFixed(0) + 'px "IBM Plex Mono", ui-monospace, monospace'; c.fillText(p.g, k.cx + Math.cos(ang) * r * 1.6, k.cy + Math.sin(ang) * r * 0.55); });
        if (t > 0.9 && t < 1.5) { var v = (t - 0.9) / 0.6; c.globalAlpha = (1 - v) * 0.8; c.strokeStyle = '#7C3AED'; c.lineWidth = 3 * (1 - v) + 0.5; c.beginPath(); c.ellipse(k.cx, k.cy, 20 + v * 220, 8 + v * 70, 0, 0, FX_TAU); c.stroke(); }
        c.globalAlpha = 1;
      };
    },
    golden: function (s, k) {
      var G = []; for (var i = 0; i < 48; i++) { G.push({ x: fxR(0, s.w), y: fxR(s.h * 0.3, s.h + 20), vy: fxR(-40, -15), p: fxR(0, FX_TAU), z: fxR(1.5, 3.2) }); }
      return function (t, dt) {
        var c = s.ctx, e = fxEnv(t, 0, 0.25, 1.8, 2.25); fxDim(c, s, k, 0.74 * e, '#0C0702');
        c.save(); c.beginPath(); c.rect(0, 0, s.w, s.h); fxRR(c, k.x - 1, k.y - 1, k.w + 2, k.h + 2, 12); c.clip('evenodd');
        c.globalCompositeOperation = 'lighter';
        for (var i = 0; i < 14; i++) { fxBeam(c, k.cx, k.cy, t * 0.5 + i / 14 * FX_TAU, Math.max(s.w, s.h), 0.07, 'rgba(253,224,71,' + (0.42 * e) + ')'); }
        fxGlow(c, '253,230,138', k.cx, k.cy, k.w * 0.75, 0.5 * e); c.restore();
        c.globalCompositeOperation = 'lighter';
        G.forEach(function (p) { p.y += p.vy * dt; p.x += Math.sin(t * 3 + p.p) * 0.3; var tw = 0.5 + 0.5 * Math.sin(t * 9 + p.p); fxGlow(c, '255,236,153', p.x, p.y, p.z * 3, e * tw); });
        fxCardGlow(c, k, '250,204,21', 0.7 * e); var q = fxPerim(k, (t * 1.3 % 1) * 2 * (k.w + k.h)); fxGlow(c, '255,255,255', q[0], q[1], 16, e);
      };
    },
    comet: function (s, k) {
      var tail = [], sparks = [], hit = false, x1 = -30, y1 = -24;
      return function (t, dt) {
        var c = s.ctx, e = fxEnv(t, 0, 0.2, 1.5, 1.9), x2 = k.cx, y2 = k.y + 4; fxDim(c, s, k, 0.82 * e); c.globalCompositeOperation = 'lighter';
        if (t >= 0.2 && t < 0.85) { var u = fxEase((t - 0.2) / 0.65), x = x1 + (x2 - x1) * u, y = y1 + (y2 - y1) * u - Math.sin(u * Math.PI) * 20; tail.push({ x: x, y: y, l: 0 }); for (var j = 0; j < 3; j++) { sparks.push({ x: x, y: y, vx: fxR(-40, 10), vy: fxR(-30, 30), l: 0, m: fxR(0.3, 0.6), rgb: '165,243,252' }); } fxGlow(c, '255,255,255', x, y, 22, 1); fxGlow(c, '103,232,249', x, y, 42, 0.6); }
        if (t >= 0.85 && !hit) { hit = true; for (var i = 0; i < 72; i++) { var a = fxR(0, FX_TAU), v = fxR(80, 260); sparks.push({ x: x2, y: y2, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 40, l: 0, m: fxR(0.5, 1), rgb: i % 3 ? '253,224,71' : '165,243,252', g: 1 }); } }
        for (var i2 = tail.length - 1; i2 >= 0; i2--) { var q = tail[i2]; q.l += dt; if (q.l > 0.5) { tail.splice(i2, 1); continue; } fxGlow(c, '103,232,249', q.x, q.y, 14 * (1 - q.l / 0.5), 0.55 * (1 - q.l / 0.5)); }
        for (var i3 = sparks.length - 1; i3 >= 0; i3--) { var p = sparks[i3]; p.l += dt; if (p.l > p.m) { sparks.splice(i3, 1); continue; } if (p.g) { p.vy += 260 * dt; } p.x += p.vx * dt; p.y += p.vy * dt; fxGlow(c, p.rgb, p.x, p.y, 4.5, 1 - p.l / p.m); }
        if (t > 0.85 && t < 1.0) { c.globalAlpha = (1 - (t - 0.85) / 0.15) * 0.55; c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; }
        if (t > 0.85 && t < 1.45) { var w = (t - 0.85) / 0.6; fxRing(c, x2, y2, 10 + w * 260, 4 + w * 80, '165,243,252', 1 - w, 3 * (1 - w) + 0.5); }
        if (t > 0.85) { fxCardGlow(c, k, '103,232,249', 0.8 * e); }
      };
    },
    supernova: function (s, k) {
      var P = [], stars = [], boom = false; for (var i = 0; i < 40; i++) { stars.push({ x: fxR(0, s.w), y: fxR(0, s.h), p: fxR(0, FX_TAU) }); }
      return function (t, dt) {
        var c = s.ctx, x0 = k.cx, y0 = k.cy, e = fxEnv(t, 0, 0.3, 2.5, 3.0); fxDim(c, s, k, 0.94 * e, '#030209'); c.globalCompositeOperation = 'lighter';
        if (t > 0.25 && t < 1.0) { var beat = Math.exp(-Math.pow((t - 0.5) / 0.05, 2)) + Math.exp(-Math.pow((t - 0.8) / 0.05, 2)), g = (t - 0.25) / 0.75; fxGlow(c, '255,255,255', x0, y0, 8 + 30 * g + 40 * beat, 0.9); fxGlow(c, '217,70,239', x0, y0, 30 + 60 * g + 60 * beat, 0.35 + 0.3 * beat); }
        if (t >= 1.0 && !boom) { boom = true; var cols = ['255,255,255', '253,224,71', '240,171,252', '103,232,249']; for (var i = 0; i < 170; i++) { var a = fxR(0, FX_TAU), v = fxR(60, 420); P.push({ x: x0, y: y0, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.62, l: 0, m: fxR(0.8, 1.6), rgb: cols[i % 4], z: fxR(2, 5) }); } }
        if (t >= 1.0) {
          var u = t - 1.0;
          if (u < 0.25) { c.globalAlpha = 1 - u / 0.25; c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; }
          [[0, '255,255,255'], [0.18, '240,171,252']].forEach(function (R) { var v = (u - R[0]) / 0.9; if (v > 0 && v < 1) { fxRing(c, x0, y0, 10 + v * s.w * 0.7, 4 + v * Math.min(s.h, 400) * 0.9, R[1], 1 - v, 4 * (1 - v) + 0.6); } });
          fxGlow(c, '192,38,211', x0 - 40, y0, 160 * Math.min(1, u * 1.5), 0.35 * e); fxGlow(c, '37,99,235', x0 + 50, y0 + 10, 150 * Math.min(1, u * 1.5), 0.3 * e);
          fxStep(c, P, dt);
          stars.forEach(function (q) { var tw = Math.max(0, Math.sin(t * 5 + q.p)); fxGlow(c, '255,255,255', q.x, q.y, 3 + 3 * tw, e * tw * Math.min(1, u)); });
          fxRainbow(c, k, t, e);
        }
      };
    },
    /* ---- Deep Sea ---- */
    splash: function (s, k) {
      var D = []; for (var i = 0; i < 26; i++) { D.push({ x: k.x + k.w * fxR(0.15, 0.85), y: k.y + 2, vx: fxR(-90, 90), vy: fxR(-330, -150), r: fxR(2.5, 5.5), at: fxR(0, 0.12) }); }
      return function (t, dt) {
        var c = s.ctx, a = t > 0.95 ? Math.max(0, 1 - (t - 0.95) / 0.35) : 1;
        [0, 0.12].forEach(function (d0) { var u = (t - d0) / 0.8; if (u > 0 && u < 1) { fxRing(c, k.cx, k.y + 2, 12 + u * k.w * 0.45, 3 + u * 9, '56,189,248', (1 - u) * 0.7, 1.5); } });
        D.forEach(function (p) {
          if (t < p.at) { return; }
          p.vy += 760 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
          c.save(); c.translate(p.x, p.y); c.rotate(Math.atan2(p.vy, p.vx) + Math.PI); c.globalAlpha = 0.85 * a; c.fillStyle = '#38BDF8';
          c.beginPath(); c.moveTo(p.r * 1.8, 0); c.quadraticCurveTo(0, p.r, -p.r, 0); c.quadraticCurveTo(0, -p.r, p.r * 1.8, 0); c.fill();
          c.globalAlpha = 0.9 * a; c.fillStyle = '#E0F2FE'; c.beginPath(); c.arc(-p.r * 0.2, -p.r * 0.3, p.r * 0.32, 0, FX_TAU); c.fill(); c.restore();
        });
        c.globalAlpha = 1;
      };
    },
    koi: function (s, k) {
      var Rp = [], D = [], last = 0, leapt = false, K = [{ ph: 0, body: '#FFF7ED', spot: '#F97316' }, { ph: Math.PI, body: '#FBBF24', spot: '#1F2937' }];
      function fish(c, x, y, ang, sz, sw, col, a) {
        c.save(); c.translate(x, y); c.rotate(ang); c.globalAlpha = a;
        c.fillStyle = col.body; c.beginPath(); c.moveTo(sz, 0); c.bezierCurveTo(sz * 0.6, -sz * 0.42, -sz * 0.5, -sz * 0.32, -sz * 0.9, sw * sz * 0.2); c.bezierCurveTo(-sz * 0.5, sz * 0.32, sz * 0.6, sz * 0.42, sz, 0); c.fill();
        c.beginPath(); c.moveTo(-sz * 0.85, sw * sz * 0.2); c.quadraticCurveTo(-sz * 1.3, -sz * 0.45 + sw * sz * 0.3, -sz * 1.45, -sz * 0.35 + sw * sz * 0.5); c.quadraticCurveTo(-sz * 1.2, sw * sz * 0.3, -sz * 1.45, sz * 0.35 + sw * sz * 0.5); c.quadraticCurveTo(-sz * 1.3, sz * 0.45 + sw * sz * 0.3, -sz * 0.85, sw * sz * 0.2); c.fill();
        c.globalAlpha = a * 0.6; c.beginPath(); c.ellipse(sz * 0.1, -sz * 0.36, sz * 0.3, sz * 0.1, -0.2, 0, FX_TAU); c.fill(); c.beginPath(); c.ellipse(sz * 0.1, sz * 0.36, sz * 0.3, sz * 0.1, 0.2, 0, FX_TAU); c.fill(); c.globalAlpha = a;
        c.fillStyle = col.spot; c.beginPath(); c.ellipse(sz * 0.25, -sz * 0.08, sz * 0.22, sz * 0.14, 0.3, 0, FX_TAU); c.fill(); c.beginPath(); c.ellipse(-sz * 0.3, sz * 0.06, sz * 0.18, sz * 0.12, -0.2, 0, FX_TAU); c.fill();
        c.fillStyle = '#111827'; c.beginPath(); c.arc(sz * 0.72, -sz * 0.12, sz * 0.06, 0, FX_TAU); c.fill();
        c.restore(); c.globalAlpha = 1;
      }
      return function (t, dt) {
        var c = s.ctx, rx = k.w / 2 + 26, ry = k.h / 2 + 22, e = fxEnv(t, 0, 0.2, 2.0, 2.45), i;
        c.globalAlpha = 0.1 * e; c.fillStyle = '#0EA5E9'; c.beginPath(); c.ellipse(k.cx, k.cy, rx + 12, ry + 12, 0, 0, FX_TAU); c.fill(); c.globalAlpha = 1;
        if (t - last > 0.12 && t < 1.7) { last = t; K.forEach(function (f) { var a0 = f.ph + t * 3.6; Rp.push({ x: k.cx + Math.cos(a0) * rx, y: k.cy + Math.sin(a0) * ry, l: 0 }); }); }
        for (i = Rp.length - 1; i >= 0; i--) { var q = Rp[i]; q.l += dt; if (q.l > 0.8) { Rp.splice(i, 1); continue; } fxRing(c, q.x, q.y, 4 + q.l * 26, 2 + q.l * 9, '56,189,248', (1 - q.l / 0.8) * 0.5, 1.2); }
        if (t >= 1.7 && !leapt) { leapt = true; K.forEach(function (f) { var a1 = f.ph + 1.7 * 3.6; for (var j = 0; j < 14; j++) { D.push({ x: k.cx + Math.cos(a1) * rx, y: k.cy + Math.sin(a1) * ry, vx: fxR(-120, 120), vy: fxR(-260, -90), r: fxR(2, 4) }); } }); }
        K.forEach(function (f, n) {
          var sz = Math.max(20, Math.min(32, k.h * 0.6)), x, y, ang, alpha = 1;
          if (t < 1.7) { var a0 = f.ph + t * 3.6; x = k.cx + Math.cos(a0) * rx; y = k.cy + Math.sin(a0) * ry; ang = Math.atan2(Math.cos(a0) * ry, -Math.sin(a0) * rx); }
          else { var u = Math.min(1, (t - 1.7) / 0.6), a1 = f.ph + 1.7 * 3.6, ox = Math.cos(a1), oy = Math.sin(a1); x = k.cx + ox * (rx + u * 70); y = k.cy + oy * ry - Math.sin(u * Math.PI) * 60 + u * 20; ang = Math.atan2(-Math.cos(u * Math.PI) * 1.2 + oy * 0.3, ox); alpha = 1 - u * u; }
          fish(c, x, y, ang, sz, Math.sin(t * 14 + n), f, alpha * e);
        });
        D.forEach(function (p) { p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt; c.globalAlpha = 0.8 * e; c.fillStyle = '#7DD3FC'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, FX_TAU); c.fill(); });
        c.globalAlpha = 1;
      };
    },
    /* ---- Myth & Magic ---- */
    spell: function (s, k) {
      var P = [], burst = false;
      return function (t, dt) {
        var c = s.ctx, D = FX_INK.dark, col = D ? '196,181,253' : '109,40,217', rx = k.w / 2 + 28, ry = k.h / 2 + 22, cx = k.cx, cy = k.cy, i;
        var g = fxEase(Math.min(1, t / 0.75)), fade = t > 1.15 ? Math.max(0, 1 - (t - 1.15) / 0.55) : 1, rot = t * 0.5;
        c.globalCompositeOperation = D ? 'lighter' : 'source-over'; c.lineWidth = 1.6; c.strokeStyle = 'rgba(' + col + ',' + (0.9 * fade).toFixed(3) + ')';
        c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, -Math.PI / 2, -Math.PI / 2 + FX_TAU * g); c.stroke();
        c.beginPath(); c.ellipse(cx, cy, rx * 0.84, ry * 0.8, 0, Math.PI / 2, Math.PI / 2 + FX_TAU * g); c.stroke();
        var pts = []; for (i = 0; i < 6; i++) { var a = -Math.PI / 2 + i / 6 * FX_TAU + rot; pts.push([cx + Math.cos(a) * rx * 0.84, cy + Math.sin(a) * ry * 0.8]); }
        [[0, 2, 4], [1, 3, 5]].forEach(function (tri) { var m = 3 * g; c.beginPath(); c.moveTo(pts[tri[0]][0], pts[tri[0]][1]); for (var j = 1; j <= Math.ceil(m); j++) { var p0 = pts[tri[(j - 1) % 3]], p1 = pts[tri[j % 3]], u = Math.min(1, m - (j - 1)); c.lineTo(p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u); } c.stroke(); });
        for (i = 0; i < 12; i++) { if (i / 12 > g) { continue; } var ra = -Math.PI / 2 + (i + 0.5) / 12 * FX_TAU - rot * 0.5; fxRune(c, cx + Math.cos(ra) * rx * 0.92, cy + Math.sin(ra) * ry * 0.9, Math.max(7, Math.min(11, ry * 0.2)), i, 'rgba(' + col + ',' + (0.95 * fade).toFixed(3) + ')'); }
        if (t > 0.75 && t < 1.2) { var fl = Math.max(0, 1 - Math.abs(t - 0.9) / 0.3); c.globalCompositeOperation = 'lighter'; fxGlow(c, D ? '196,181,253' : '167,139,250', cx, cy, rx * 1.1, 0.55 * fl); fxCardGlow(c, k, D ? '196,181,253' : '139,92,246', fl); }
        if (t > 0.85 && !burst) { burst = true; for (i = 0; i < 30; i++) { var qa = fxR(0, FX_TAU); P.push({ x: cx + Math.cos(qa) * rx * fxR(0.8, 1), y: cy + Math.sin(qa) * ry * fxR(0.8, 1), vy: fxR(-90, -40), l: 0, m: fxR(0.5, 0.9) }); } }
        c.globalCompositeOperation = D ? 'lighter' : 'source-over';
        P.forEach(function (p) { p.l += dt; p.y += p.vy * dt; var u2 = p.l / p.m; if (u2 < 1) { fxStar4(c, p.x, p.y, 4 * (1 - u2) + 1, 1 - u2, D ? '#E9D5FF' : '#7C3AED'); } });
      };
    },
    phoenix: function (s, k) {
      var E = [], T = [], boom = false, H = Math.max(60, Math.min(170, k.cy - 70)), bx0 = 0, by0 = 0;
      /* a wing: a bone out from the shoulder, raised or lowered by the beat, with long flight feathers along it */
      function wing(c, x, y, side, span, flap, a) {
        var bone = -0.35 + flap, bl = span * 0.55, ex = x + side * Math.cos(bone) * bl, ey = y + Math.sin(bone) * bl;
        c.strokeStyle = 'rgba(255,237,180,' + a + ')'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + ex) / 2, (y + ey) / 2 - span * 0.08, ex, ey); c.stroke();
        for (var f = 0; f < 10; f++) {
          var u = f / 9, th = bone + 1.45 - u * 1.3 - flap * 0.35, len = span * (0.35 + 0.45 * Math.pow(u, 0.8)), bx = x + side * Math.cos(bone) * bl * u, by = y + Math.sin(bone) * bl * u,
            tx = bx + side * Math.cos(th) * len, ty = by + Math.sin(th) * len, mx = (bx + tx) / 2 - side * Math.sin(th) * len * 0.14, my = (by + ty) / 2 + Math.cos(th) * len * 0.14,
            g = c.createLinearGradient(bx, by, tx, ty);
          g.addColorStop(0, 'rgba(255,247,205,' + a + ')'); g.addColorStop(0.45, 'rgba(251,146,60,' + a + ')'); g.addColorStop(1, 'rgba(220,38,38,' + (a * 0.55) + ')');
          c.strokeStyle = g; c.lineWidth = 4.6 - f * 0.32; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(mx, my, tx, ty); c.stroke();
          fxGlow(c, '251,146,60', tx, ty, 6, a * 0.55);
        }
      }
      return function (t, dt) {
        var c = s.ctx, e = fxEnv(t, 0, 0.25, 2.35, 2.85), u = fxEase(Math.min(1, Math.max(0, (t - 0.2) / 1.2))), x = k.cx + Math.sin(u * Math.PI * 2) * 10, y = k.cy - u * H, i;
        fxDim(c, s, k, 0.74 * e, '#0A0503'); c.globalCompositeOperation = 'lighter';
        if (t < 0.35) { fxGlow(c, '253,186,116', k.cx, k.cy, 40 + t * 200, 1 - t / 0.35); }
        var alive = t < 2.1, span = 30 + 70 * u + (t > 1.4 ? 14 * Math.min(1, (t - 1.4) / 0.3) : 0), flap = t < 1.4 ? Math.sin(t * 11) * 0.55 : -0.25 + Math.sin(t * 3) * 0.06, a = alive ? Math.min(1, t / 0.3) : 0;
        if (alive) {
          bx0 = x; by0 = y;
          for (var q = 0; q < 3; q++) { var sw = Math.sin(t * 4 + q) * 10, ex = x + (q - 1) * 20 + sw * 1.5, ey = y + 72 + q * 6; c.strokeStyle = 'rgba(251,146,60,' + (0.7 * a) + ')'; c.lineWidth = 3 - q * 0.6; c.beginPath(); c.moveTo(x, y + 6); c.bezierCurveTo(x + (q - 1) * 14 + sw, y + 30, x + (q - 1) * 26 - sw, y + 50, ex, ey); c.stroke(); fxGlow(c, '253,224,71', ex, ey, 6, a * 0.8); }
          wing(c, x - 3, y, -1, span, flap, a); wing(c, x + 3, y, 1, span, flap, a);
          fxGlow(c, '255,247,205', x, y, 14, a); fxGlow(c, '251,146,60', x, y, 30, 0.6 * a); fxGlow(c, '255,255,255', x, y - 12, 6, a);
          c.globalAlpha = a; c.fillStyle = '#FDE047'; c.beginPath(); c.moveTo(x - 3, y - 15); c.quadraticCurveTo(x - 2, y - 24, x + 4, y - 27); c.quadraticCurveTo(x + 1, y - 21, x + 3, y - 15); c.fill(); c.globalAlpha = 1;
          if (Math.random() < 0.9) { T.push({ x: x + fxR(-6, 6), y: y + 10, vx: fxR(-20, 20), vy: fxR(10, 50), l: 0, m: fxR(0.4, 0.9) }); }
        }
        if (t >= 2.1 && !boom) { boom = true; for (i = 0; i < 110; i++) { var ang = fxR(0, FX_TAU), v = fxR(80, 320); E.push({ x: bx0, y: by0, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v * 0.7 - 60, l: 0, m: fxR(0.5, 1.1), rgb: ['255,247,205', '253,224,71', '251,146,60', '239,68,68'][i % 4], z: fxR(2, 4.5) }); } }
        if (t > 2.1 && t < 2.3) { c.globalAlpha = (2.3 - t) / 0.2 * 0.5; c.fillStyle = '#FFEDD5'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; }
        for (i = T.length - 1; i >= 0; i--) { var p = T[i]; p.l += dt; if (p.l > p.m) { T.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; fxGlow(c, p.l / p.m < 0.5 ? '253,186,116' : '220,38,38', p.x, p.y, 4, (1 - p.l / p.m) * 0.8); }
        for (i = 0; i < E.length; i++) { var m = E[i]; if (m.l > m.m) { continue; } m.l += dt; m.vy += 300 * dt; m.vx *= Math.pow(0.4, dt); m.x += m.vx * dt; m.y += m.vy * dt; fxGlow(c, m.rgb, m.x, m.y, m.z * 2.4, 1 - m.l / m.m); }
        if (t > 1.2) { fxCardGlow(c, k, '251,146,60', 0.8 * e); }
      };
    },
    /* ---- Tech Lab ---- */
    pixel: function (s, k) {
      var P = [], cols = ['#F43F5E', '#F59E0B', '#22C55E', '#3B82F6', '#A855F7', '#FDE047'], g = 6;
      for (var i = 0; i < 30; i++) { var a = (i % 8) / 8 * FX_TAU + fxR(-0.15, 0.15), v = fxR(140, 300); P.push({ x: k.cx + fxR(-k.w * 0.35, k.w * 0.35), y: k.cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7 - 60, col: cols[i % 6], z: g * (i % 3 === 0 ? 2 : 1) }); }
      return function (t) {
        /* everything moves in steps, 12 a second, on a 6-pixel grid */
        var c = s.ctx, T = Math.floor(t * 12) / 12, a = T > 0.7 ? Math.max(0, 1 - (T - 0.7) / 0.3) : 1;
        P.forEach(function (p) { var x = Math.round((p.x + p.vx * T) / g) * g, y = Math.round((p.y + p.vy * T + 300 * T * T) / g) * g; c.globalAlpha = a; c.fillStyle = p.col; c.fillRect(x, y, p.z, p.z); c.globalAlpha = a * 0.55; c.fillStyle = '#FFFFFF'; c.fillRect(x, y, p.z / 3, p.z / 3); });
        if (T < 0.5) { var b = T < 0.25 ? 1 : 0.5, sx = Math.round((k.x + k.w - 18) / g) * g, sy = Math.round((k.y - 6) / g) * g; c.globalAlpha = b; c.fillStyle = '#FDE047'; [[0, -2], [0, -1], [0, 1], [0, 2], [-2, 0], [-1, 0], [1, 0], [2, 0], [0, 0]].forEach(function (q) { c.fillRect(sx + q[0] * g, sy + q[1] * g, g, g); }); }
        c.globalAlpha = 1;
      };
    },
    freeze: function (s, k) {
      var cracks = [], frost = [], dust = [], i, R = Math.max(90, Math.min(170, k.w * 0.5));
      for (i = 0; i < 70; i++) { dust.push({ x: fxR(0, s.w), y: fxR(0, s.h), z: fxR(1, 2.6), p: fxR(0, FX_TAU) }); }
      function branch(x, y, a, len, depth) { var x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; frost.push([x, y, x2, y2, depth]); if (depth < 3) { branch(x2, y2, a + fxR(0.3, 0.7), len * 0.62, depth + 1); branch(x2, y2, a - fxR(0.3, 0.7), len * 0.62, depth + 1); } }
      for (i = 0; i < 16; i++) { var side = i % 4, bx = side === 1 ? s.w : side === 3 ? 0 : fxR(0, s.w), by = side === 0 ? 0 : side === 2 ? s.h : fxR(0, s.h); branch(bx, by, [Math.PI / 2, Math.PI, -Math.PI / 2, 0][side] + fxR(-0.4, 0.4), fxR(50, 110), 0); }
      for (i = 0; i < 9; i++) { var pp = fxPerim(k, fxR(0, 2 * (k.w + k.h))); cracks.push(fxJag(k.cx, k.cy, k.cx + (pp[0] - k.cx) * 4, k.cy + (pp[1] - k.cy) * 4, 0.3, 5)); }
      return function (t) {
        var c = s.ctx, e = fxEnv(t, 0, 0.3, 2.6, 3.3), g = Math.min(1, t / 0.9), cx = k.cx, cy = k.cy;
        /* the world goes cold and still; only your answer keeps its color */
        fxDim(c, s, k, 0.78 * e, '#0B1526');
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = 'rgb(186,230,253)';
        frost.forEach(function (f) { var u = Math.min(1, Math.max(0, g * 4 - f[4])); if (u <= 0) { return; } c.globalAlpha = 0.5 * e * (1 - f[4] * 0.18); c.lineWidth = 2.2 - f[4] * 0.45; c.beginPath(); c.moveTo(f[0], f[1]); c.lineTo(f[0] + (f[2] - f[0]) * u, f[1] + (f[3] - f[1]) * u); c.stroke(); });
        c.globalAlpha = 1;
        dust.forEach(function (d) { fxGlow(c, '224,242,254', d.x, d.y, d.z * 2.4, e * (0.35 + 0.25 * Math.sin(t * 2 + d.p))); });
        /* a clock: its hands race backward, slow down, and stop */
        if (t > 0.2 && t < 2.65) {
          var a1 = fxEnv(t, 0.2, 0.5, 2.35, 2.65);
          fxRing(c, cx, cy, R, R, '186,230,253', 0.8 * a1, 2); fxRing(c, cx, cy, R * 0.93, R * 0.93, '186,230,253', 0.35 * a1, 1);
          c.strokeStyle = 'rgb(224,242,254)';
          for (var m = 0; m < 60; m++) { var ang = m / 60 * FX_TAU, big = m % 5 === 0, r1 = big ? 0.82 : 0.88; c.globalAlpha = a1 * (big ? 0.9 : 0.45); c.lineWidth = big ? 2 : 1; c.beginPath(); c.moveTo(cx + Math.cos(ang) * R * r1, cy + Math.sin(ang) * R * r1); c.lineTo(cx + Math.cos(ang) * R * 0.93, cy + Math.sin(ang) * R * 0.93); c.stroke(); }
          var turn = t < 1.4 ? -Math.sqrt((t - 0.2) / 1.2) * FX_TAU * 3 : -FX_TAU * 3, hand = turn - Math.PI / 2;
          c.globalAlpha = a1; c.strokeStyle = 'rgb(240,249,255)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(hand) * R * 0.78, cy + Math.sin(hand) * R * 0.78); c.stroke();
          c.lineWidth = 3.5; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(turn / 12 - Math.PI / 2) * R * 0.5, cy + Math.sin(turn / 12 - Math.PI / 2) * R * 0.5); c.stroke();
          c.globalAlpha = 1; fxGlow(c, '224,242,254', cx, cy, 8, a1);
          if (t > 1.4 && t < 1.75) { var tk = (t - 1.4) / 0.35; fxRing(c, cx, cy, R * (1 + tk * 0.18), R * (1 + tk * 0.18), '255,255,255', (1 - tk) * 0.85, 3); }
        }
        if (t < 2.3) { fxCardGlow(c, k, '186,230,253', 0.7 * Math.min(1, t / 0.4)); }
        /* time starts again: the ice cracks, a flash, and color floods back out from your answer */
        if (t > 2.3) {
          var v = (t - 2.3) / 1.0;
          cracks.forEach(function (ps) { fxBolt(c, ps.slice(0, Math.max(2, Math.floor(ps.length * Math.min(1, v * 3)))), Math.max(0, 1 - v), '224,242,254'); });
          if (v < 0.25) { c.globalAlpha = (0.25 - v) * 2.4; c.fillStyle = '#F0F9FF'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; }
          fxRainbow(c, k, t, Math.max(0, 1 - v));
          var w = Math.min(1, v * 1.3); fxRing(c, cx, cy, 20 + w * s.w * 0.8, 8 + w * s.h * 0.5, '240,171,252', (1 - w) * 0.8, 3);
        }
      };
    },
    /* ---- Haunted ---- */
    boo: function (s, k) {
      return function (t) { var c = s.ctx, u = Math.min(1, t / 0.45), e = 1 - Math.pow(1 - u, 3), a = t > 0.9 ? Math.max(0, 1 - (t - 0.9) / 0.4) : 1, z = 10 + 14 * e, x = k.cx + Math.sin(t * 6) * 5, y = k.y - 6 - e * (z + 14) - Math.max(0, t - 0.45) * 14;
        fxGlow(c, '167,139,250', x, y, z * 2.4, 0.3 * a); fxGhost(c, x, y, z, a, t, 0); };
    },
    bats: function (s, k) {
      var B = []; for (var i = 0; i < 16; i++) { B.push({ a: -Math.PI / 2 + fxR(-1.3, 1.3), v: fxR(160, 340), z: fxR(13, 22), ph: fxR(0, 6), at: i * 0.03, wob: fxR(2, 5) }); }
      return function (t) { var c = s.ctx, col = FX_INK.dark ? '#C4B5FD' : '#3B0764';
        B.forEach(function (b) { var u = t - b.at; if (u < 0) { return; } var d = b.v * (1 - Math.exp(-u * 1.6)), a = u > 1.1 ? Math.max(0, 1 - (u - 1.1) / 0.6) : Math.min(1, u * 6); fxBat(c, k.cx + Math.cos(b.a) * d + Math.sin(u * b.wob + b.ph) * 14, k.cy + Math.sin(b.a) * d - u * 30, b.z * (0.6 + u * 0.4), Math.sin(u * 22 + b.ph), a, col); });
      };
    },
    nightmare: function (s, k) {
      var E = [], claws = [], i; for (i = 0; i < 46; i++) { var ex = fxR(0.04, 0.96) * s.w, ey = fxR(0.04, 0.96) * s.h; if (ex > k.x - 30 && ex < k.x + k.w + 30 && ey > k.y - 30 && ey < k.y + k.h + 30) { continue; } E.push({ x: ex, y: ey, z: fxR(9, 22), at: 0.25 + fxR(0, 1.5), col: ['#EF4444', '#F59E0B', '#EF4444', '#A3E635'][i % 4] }); }
      var by = k.cy < s.h / 2 ? Math.min(s.h - 90, k.cy + 150) : Math.max(90, k.cy - 150), BR = Math.min(150, s.w * 0.36);
      for (i = 0; i < 4; i++) { claws.push([s.w * 0.08 + i * s.w * 0.07, s.h * 0.1 + i * 10, s.w * 0.6 + i * s.w * 0.09, s.h * 0.9 - i * 12]); }
      return function (t) {
        var c = s.ctx, e = fxEnv(t, 0, 0.3, 3.0, 3.45), shut = t > 2.85;
        fxDim(c, s, k, 0.93 * e, '#050208');
        E.forEach(function (q, n) {
          var open = shut ? 0 : Math.min(1, Math.max(0, (t - q.at) / 0.25)); if ((t * 1.3 + n * 0.77) % 2.9 < 0.12) { open *= 0.15; } if (open <= 0) { return; }
          var dx = k.cx - q.x, dy = k.cy - q.y, d = Math.hypot(dx, dy) || 1; c.globalCompositeOperation = 'lighter'; fxGlow(c, '239,68,68', q.x, q.y, q.z * 2.2, 0.35 * open); c.globalCompositeOperation = 'source-over'; fxEye(c, q.x, q.y, q.z, open, dx / d, dy / d, q.col, 1);
        });
        if (t > 1.8 && !shut) { var o = Math.min(1, (t - 1.8) / 0.5); c.globalCompositeOperation = 'lighter'; fxGlow(c, '220,38,38', k.cx, by, BR * 1.8, 0.5 * o); c.globalCompositeOperation = 'source-over'; fxEye(c, k.cx + (t > 2.5 ? Math.sin(t * 40) * 1.5 : 0), by, BR, o, 0, k.cy > by ? 1 : -1, '#DC2626', 1); }
        if (shut) {
          var v = (t - 2.85) / 0.6; c.globalCompositeOperation = 'lighter';
          if (v < 0.3) { c.globalAlpha = (0.3 - v) / 0.3 * 0.7; c.fillStyle = '#FECACA'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; }
          claws.forEach(function (q, n) { var g = Math.min(1, v * 4 - n * 0.15); if (g <= 0) { return; } c.strokeStyle = 'rgba(254,202,202,' + Math.max(0, 1 - v) + ')'; c.lineWidth = 5 * Math.max(0, 1 - v) + 1; c.lineCap = 'round'; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0] + (q[2] - q[0]) * g, q[1] + (q[3] - q[1]) * g); c.stroke(); });
          fxCardGlow(c, k, '239,68,68', Math.max(0, 1 - v));
        } else if (t > 0.4) { fxCardGlow(c, k, '239,68,68', 0.5 * e); }
      };
    },
    /* ---- The Unknown ---- */
    wormhole: function (s, k) {
      var P = []; for (var i = 0; i < 40; i++) { P.push({ a: fxR(0, FX_TAU), r: fxR(1.2, 2.4), sp: fxR(1.2, 2) }); }
      return function (t, dt) {
        var c = s.ctx, rx = k.w / 2 + 30, ry = k.h / 2 + 26, e = fxEnv(t, 0, 0.2, 1.2, 1.6), i, j; c.lineCap = 'round';
        for (i = 0; i < 5; i++) { var f = 1 + i * 0.16 - 0.1 * Math.sin(t * 4), rot = t * (3 - i * 0.4) * (i % 2 ? -1 : 1); for (j = 0; j < 2; j++) { c.strokeStyle = 'hsla(' + (265 + i * 18) + ',95%,60%,' + (0.9 * e * (1 - i * 0.15)) + ')'; c.lineWidth = 4 - i * 0.6; c.beginPath(); c.ellipse(k.cx, k.cy, rx * f, ry * f, 0, rot + j * Math.PI, rot + j * Math.PI + 1.8); c.stroke(); } }
        P.forEach(function (p) { p.r -= p.sp * dt; p.a += dt * 4 / Math.max(0.5, p.r); if (p.r < 0.9) { p.r = fxR(1.8, 2.4); } fxGlow(c, '34,211,238', k.cx + Math.cos(p.a) * rx * p.r, k.cy + Math.sin(p.a) * ry * p.r, 5, e); });
        if (t > 1.1) { var v = (t - 1.1) / 0.5; fxRing(c, k.cx, k.cy, rx * (1 + v * 1.5), ry * (1 + v * 1.5), '192,132,252', 1 - v, 3); }
      };
    },
    abduct: function (s, k) {
      var Sp = [];
      return function (t, dt) {
        var c = s.ctx, e = fxEnv(t, 0, 0.25, 2.4, 2.9), z = Math.max(34, Math.min(60, k.w * 0.2)), hy = Math.max(40, k.y - 120), x, y;
        fxDim(c, s, k, 0.7 * e, '#020617');
        if (t < 0.7) { var u = fxEase(t / 0.7); x = -60 + (k.cx + 60) * u; y = hy - 60 + 60 * u - Math.sin(u * Math.PI) * 30; }
        else if (t < 2.1) { x = k.cx + Math.sin(t * 3) * 4; y = hy + Math.sin(t * 5) * 3; }
        else { var v = Math.pow((t - 2.1) / 0.5, 2); x = k.cx + v * (s.w - k.cx + 120); y = hy - v * 200; }
        if (t > 0.7 && t < 2.1) {
          var b = fxEnv(t, 0.7, 0.9, 1.9, 2.1); c.globalCompositeOperation = 'lighter';
          var g = c.createLinearGradient(0, y, 0, k.y + k.h); g.addColorStop(0, 'rgba(134,239,172,' + 0.55 * b + ')'); g.addColorStop(1, 'rgba(134,239,172,' + 0.12 * b + ')'); c.fillStyle = g;
          c.beginPath(); c.moveTo(x - z * 0.3, y + z * 0.2); c.lineTo(x + z * 0.3, y + z * 0.2); c.lineTo(k.x + k.w + 6, k.y + k.h); c.lineTo(k.x - 6, k.y + k.h); c.fill();
          if (Math.random() < 0.9) { Sp.push({ x: k.x + fxR(0, k.w), y: k.y + fxR(0, k.h), l: 0 }); }
          fxCardGlow(c, k, '134,239,172', b);
        }
        c.globalCompositeOperation = 'lighter';
        for (var i = Sp.length - 1; i >= 0; i--) { var p = Sp[i]; p.l += dt; var f = p.l / 0.8; if (f > 1) { Sp.splice(i, 1); continue; } fxStar4(c, p.x + (x - p.x) * f * f, p.y + (y - p.y) * f, 5 * (1 - f) + 1.5, 1 - f * 0.5, '#D9F99D'); }
        c.globalCompositeOperation = 'source-over'; fxUfo(c, x, y, z, t, Math.min(1, e * 3)); c.globalCompositeOperation = 'lighter'; fxGlow(c, '103,232,249', x, y, z * 1.6, 0.35 * Math.min(1, e * 3));
        if (t > 2.1 && t < 2.3) { c.globalAlpha = (2.3 - t) / 0.2 * 0.35; c.fillStyle = '#ECFEFF'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; }
      };
    },
    /* ---- Dreamscape ---- */
    paint: function (s, k) {
      var S = [], cols = ['#F43F5E', '#F59E0B', '#22C55E', '#3B82F6', '#A855F7', '#EC4899'];
      for (var i = 0; i < 6; i++) { var lob = [], dr = [], j, at = fxPerim(k, (i + fxR(0.2, 0.8)) / 6 * 2 * (k.w + k.h)); for (j = 0; j < 9; j++) { lob.push(fxR(0.7, 1.35)); } for (j = 0; j < 5; j++) { dr.push([fxR(0, FX_TAU), fxR(1.4, 2.3), fxR(0.12, 0.28)]); } S.push({ x: at[0], y: at[1], r: fxR(13, 22), at: i * 0.09, lob: lob, dr: dr, col: cols[i] }); }
      return function (t) {
        var c = s.ctx, a = t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.4) : 1;
        S.forEach(function (p) {
          var u = (t - p.at) / 0.18; if (u <= 0) { return; } var r = p.r * (u >= 1 ? 1 : 1 - Math.pow(1 - u, 3)); c.globalAlpha = 0.85 * a; c.fillStyle = p.col; c.beginPath();
          for (var j = 0; j <= 9; j++) { var a0 = j / 9 * FX_TAU, rr = r * p.lob[j % 9]; if (!j) { c.moveTo(p.x + Math.cos(a0) * rr, p.y + Math.sin(a0) * rr); } else { c.quadraticCurveTo(p.x + Math.cos(a0 - 0.35) * r * 0.6, p.y + Math.sin(a0 - 0.35) * r * 0.6, p.x + Math.cos(a0) * rr, p.y + Math.sin(a0) * rr); } }
          c.fill(); p.dr.forEach(function (d) { c.beginPath(); c.arc(p.x + Math.cos(d[0]) * r * d[1], p.y + Math.sin(d[0]) * r * d[1], r * d[2], 0, FX_TAU); c.fill(); });
          c.globalAlpha = 0.5 * a; c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(p.x - r * 0.3, p.y - r * 0.3, r * 0.16, 0, FX_TAU); c.fill();
        });
        c.globalAlpha = 1;
      };
    },
    cranes: function (s, k) {
      var C = [], cols = ['#F9A8D4', '#93C5FD', '#FDE68A', '#A7F3D0', '#C4B5FD', '#FDBA74', '#FCA5A5'];
      for (var i = 0; i < 7; i++) { C.push({ x: k.x + (i + 0.5) / 7 * k.w, vx: fxR(-50, 50), vy: fxR(-150, -90), ph: fxR(0, 6), z: fxR(15, 21), at: i * 0.08, col: cols[i] }); }
      function crane(c, x, y, z, fl, dir, col, a) {
        c.save(); c.translate(x, y); c.scale(dir, 1); c.globalAlpha = a; c.lineJoin = 'round'; c.strokeStyle = 'rgba(30,41,59,.55)'; c.lineWidth = 1; c.fillStyle = col;
        [[[-z * 1.3, -z * 0.5], [-z * 0.2, 0], [z * 0.3, z * 0.3]], [[-z * 0.2, 0], [z * 0.5, 0], [z * 0.15, z * 0.35]], [[z * 0.4, 0], [z * 1.2, -z * 0.75], [z, -z * 0.35]], [[z * 1.2, -z * 0.75], [z * 1.55, -z * 0.55], [z, -z * 0.35]], [[-z * 0.3, 0], [z * 0.55, 0], [z * 0.05, -z * 0.2 - z * 1.1 * fl]]].forEach(function (tr) { c.beginPath(); c.moveTo(tr[0][0], tr[0][1]); c.lineTo(tr[1][0], tr[1][1]); c.lineTo(tr[2][0], tr[2][1]); c.closePath(); c.fill(); c.stroke(); });
        c.restore();
      }
      return function (t) { var c = s.ctx; C.forEach(function (q) { var u = t - q.at; if (u < 0) { return; } var a = u > 1.5 ? Math.max(0, 1 - (u - 1.5) / 0.6) : Math.min(1, u * 5); crane(c, q.x + q.vx * u + Math.sin(u * 2 + q.ph) * 12, k.y - 4 + q.vy * u * (1 - u * 0.12), q.z * (0.7 + 0.3 * Math.min(1, u * 2)), Math.sin(u * 9 + q.ph), q.vx >= 0 ? 1 : -1, q.col, a); }); };
    }
  };
  function fxBox(el) { var r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; }
  function fxSeen(b) { var H = window.innerHeight || 800; return b.h > 0 && b.y + b.h > 40 && b.y < H - 40; }
  /* the verdict under the answer ("Correct."): on a phone the page scrolls to it right after the answer */
  function fxVerdict(el) { for (var n = el.parentElement, i = 0; n && i < 8; n = n.parentElement, i++) { var v = n.querySelector('.verdict, #mp-fb:not([hidden])'); if (v) { return v; } } return null; }
  function fxAnchor(el, st) {
    if (el.isConnected) { var b = fxBox(el); if (fxSeen(b)) { return b; } }
    if (!st.v || !st.v.isConnected) { st.v = fxVerdict(el); }
    if (st.v) { var v = fxBox(st.v); if (fxSeen(v)) { return v; } }
    var W = window.innerWidth || 390, H = window.innerHeight || 800;
    return { x: W * 0.12, y: H * 0.42, w: W * 0.76, h: 56, cx: W / 2, cy: H * 0.42 + 28 };
  }
  /* a full-screen layer for one effect; the answer's box is read again every frame, so a scroll does not leave it behind */
  function fxOverlay(el, dur, make, end) {
    var cv = document.createElement('canvas'); cv.className = 'pz-over'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
    var st = {}, k = fxAnchor(el, st);
    return fxScene(cv, function (s) { var draw = make(s, k); return function (t, dt) { var b = fxAnchor(el, st); k.x = b.x; k.y = b.y; k.w = b.w; k.h = b.h; k.cx = b.cx; k.cy = b.cy; draw(t, dt); }; }, { dur: dur, end: function () { cv.remove(); if (end) { end(); } } });
  }
  var FX_SVG = {
    check: '<svg class="pz-d pz-check" viewBox="0 0 30 24" aria-hidden="true"><path d="M3 13l7.5 7.5L27 3"/></svg>',
    star: '<svg class="pz-d pz-star" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3l5.1 10.4 11.4 1.7-8.3 8 2 11.4L20 29.1 9.8 34.5l2-11.4-8.3-8 11.4-1.7z"/></svg>',
    stamp: '<span class="pz-d pz-stamp" aria-hidden="true">Nice!</span>',
    swipe: '<span class="pz-d pz-swipe" aria-hidden="true"></span>',
    neon: '<span class="pz-d pz-neon" aria-hidden="true"></span>'
  };
  function fxShatter(el) {
    var r = fxBox(el), box = document.createElement('div'), cols = 5, rows = 3, pts = [], tris = [], i, j;
    box.className = 'pz-shards'; box.style.left = (r.x + window.scrollX) + 'px'; box.style.top = (r.y + window.scrollY) + 'px'; box.style.width = r.w + 'px'; box.style.height = r.h + 'px';
    document.body.appendChild(box);
    for (j = 0; j <= rows; j++) { pts.push([]); for (i = 0; i <= cols; i++) { var x = i / cols * 100, y = j / rows * 100; if (i > 0 && i < cols) { x += fxR(-6, 6); } if (j > 0 && j < rows) { y += fxR(-12, 12); } pts[j].push([x, y]); } }
    for (j = 0; j < rows; j++) { for (i = 0; i < cols; i++) { var a = pts[j][i], b = pts[j][i + 1], c = pts[j + 1][i], d = pts[j + 1][i + 1]; if ((i + j) % 2) { tris.push([a, b, d], [a, d, c]); } else { tris.push([a, b, c], [b, d, c]); } } }
    var cs = getComputedStyle(el);
    tris.forEach(function (tr) {
      var piece = el.cloneNode(true); piece.removeAttribute('id'); piece.setAttribute('aria-hidden', 'true'); piece.disabled = true;
      piece.style.cssText = 'position:absolute;left:0;top:0;width:' + r.w + 'px;height:' + r.h + 'px;margin:0;box-sizing:border-box;background:' + cs.backgroundColor + ';clip-path:polygon(' + tr.map(function (p) { return p[0].toFixed(1) + '% ' + p[1].toFixed(1) + '%'; }).join(',') + ')';
      box.appendChild(piece);
      var cx = (tr[0][0] + tr[1][0] + tr[2][0]) / 3, cy = (tr[0][1] + tr[1][1] + tr[2][1]) / 3, dx = (cx - 50) / 50, dy = (cy - 50) / 50, dist = fxR(40, 90);
      var tx = dx * dist * 2.2 + fxR(-10, 10), ty = dy * dist + fxR(-20, 10) - 20, rot = fxR(-60, 60), gl = 'brightness(1.25) drop-shadow(0 0 6px rgba(167,139,250,.9))';
      if (piece.animate) {
        piece.animate([
          { transform: 'none', filter: 'none', easing: 'ease-out' },
          { transform: 'translate(' + (dx * 2).toFixed(1) + 'px,' + (dy * 2).toFixed(1) + 'px)', filter: 'none', offset: 0.12, easing: 'cubic-bezier(.2,.8,.3,1)' },
          { transform: 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) rotate(' + rot.toFixed(0) + 'deg) scale(.92)', filter: gl, offset: 0.42, easing: 'linear' },
          { transform: 'translate(' + (tx * 1.06).toFixed(1) + 'px,' + (ty * 1.06 + 6).toFixed(1) + 'px) rotate(' + (rot * 1.1).toFixed(0) + 'deg) scale(.92)', filter: gl, offset: 0.6, easing: 'cubic-bezier(.6,0,.4,1)' },
          { transform: 'none', filter: 'brightness(1.6)', offset: 0.86 },
          { transform: 'none', filter: 'none' }
        ], { duration: 2200, easing: 'linear' });
      }
    });
    el.style.visibility = 'hidden';
    var cracks = []; for (i = 0; i < 7; i++) { var p = fxPerim(r, fxR(0, 2 * (r.w + r.h))); cracks.push(fxJag(r.cx, r.cy, p[0], p[1], 0.35, 4)); }
    fxOverlay(el, 2.4, function (s, k) {
      return function (t) {
        var c = s.ctx, e = fxEnv(t, 0, 0.25, 1.9, 2.35);
        c.globalAlpha = 0.6 * e; c.fillStyle = '#05050C'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; c.globalCompositeOperation = 'lighter';
        if (t < 0.3) { var g = t / 0.28; cracks.forEach(function (ps) { fxBolt(c, ps.slice(0, Math.max(2, Math.floor(ps.length * Math.min(1, g)))), 0.9, '196,181,253'); }); }
        if (t > 0.26 && t < 0.45) { c.globalAlpha = (0.45 - t) / 0.19 * 0.5; c.fillStyle = '#EDE9FE'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; }
        if (t > 1.85 && t < 2.35) { var v = (t - 1.85) / 0.5; fxRainbow(c, k, t, 1 - v); fxRing(c, k.cx, k.cy, 20 + v * 240, 8 + v * 70, '240,171,252', 1 - v, 2.5); }
      };
    }, function () { box.remove(); el.style.visibility = ''; });
  }
  /* Glitch: the answer is cut into slices that jump sideways with their colors split, then it snaps back clean */
  function fxGlitch(el) {
    var r = fxBox(el), box = document.createElement('div'), n = 7, cs = getComputedStyle(el);
    box.className = 'pz-shards'; box.style.left = (r.x + window.scrollX) + 'px'; box.style.top = (r.y + window.scrollY) + 'px'; box.style.width = r.w + 'px'; box.style.height = r.h + 'px';
    document.body.appendChild(box);
    for (var i = 0; i < n; i++) {
      var piece = el.cloneNode(true), kf = [], steps = 10;
      piece.removeAttribute('id'); piece.setAttribute('aria-hidden', 'true'); piece.disabled = true;
      piece.style.cssText = 'position:absolute;left:0;top:0;width:' + r.w + 'px;height:' + r.h + 'px;margin:0;box-sizing:border-box;background:' + cs.backgroundColor + ';clip-path:inset(' + (i / n * 100).toFixed(1) + '% 0 ' + (100 - (i + 1) / n * 100).toFixed(1) + '% 0)';
      box.appendChild(piece);
      for (var j = 0; j <= steps; j++) { var on = j > 0 && j < steps - 1 && Math.random() < 0.7, dx = on ? fxR(-22, 22) : 0, sh = fxR(2, 5); kf.push({ transform: 'translateX(' + dx.toFixed(1) + 'px)', filter: on ? 'drop-shadow(' + sh.toFixed(1) + 'px 0 0 rgba(255,0,90,.9)) drop-shadow(' + (-sh).toFixed(1) + 'px 0 0 rgba(0,229,255,.9))' : 'none', offset: j / steps, easing: 'steps(1, end)' }); }
      if (piece.animate) { piece.animate(kf, { duration: 950 }); }
    }
    el.style.visibility = 'hidden';
    fxOverlay(el, 1.05, function (s, k) {
      return function (t) {
        var c = s.ctx, on = t < 0.85;
        if (on) { c.globalAlpha = 0.18; c.fillStyle = '#000000'; for (var y = k.y; y < k.y + k.h; y += 3) { c.fillRect(k.x - 8, y, k.w + 16, 1); } }
        if (on && Math.random() < 0.6) { for (var b = 0; b < 3; b++) { c.globalAlpha = fxR(0.25, 0.6); c.fillStyle = Math.random() < 0.5 ? '#FF005A' : '#00E5FF'; c.fillRect(k.x + fxR(-20, k.w * 0.7), k.y + fxR(0, k.h), fxR(20, k.w * 0.5), fxR(1, 4)); } }
        if (t > 0.85 && t < 1.0) { c.globalAlpha = (1 - (t - 0.85) / 0.15) * 0.7; c.fillStyle = '#FFFFFF'; c.fillRect(k.x - 4, k.y - 4, k.w + 8, k.h + 8); }
        c.globalAlpha = 1;
      };
    }, function () { box.remove(); el.style.visibility = ''; });
  }
  /* play an effect on the answer that was just marked right; never in a timed module, never with reduced motion */
  function fxRight(key, el) {
    if (FX_REDUCE || !el || !el.isConnected || (el.closest && el.closest('.mmwrap'))) { return; }
    if (FX_SVG[key]) {
      $$('.pz-d', el).forEach(function (n) { n.remove(); });
      el.classList.add('pz-host'); el.insertAdjacentHTML('beforeend', FX_SVG[key]);
      if (key === 'neon') { el.classList.remove('pz-neon-run'); void el.offsetWidth; el.classList.add('pz-neon-run'); setTimeout(function () { el.classList.remove('pz-neon-run'); $$('.pz-neon', el).forEach(function (n) { n.remove(); }); }, 2500); }
      return;
    }
    if (key === 'shatter') { fxShatter(el); return; }
    if (key === 'glitch') { fxGlitch(el); return; }
    if (FX_DRAW[key]) { fxOverlay(el, FX_DUR[key], FX_DRAW[key]); }
  }

  /* ---------- reveals that grow with rarity (the Crates page) ---------- */
  var FX_RV = { c: { dur: 0.9, show: 0.1 }, r: { dur: 1.4, show: 0.45 }, e: { dur: 2.1, show: 0.95 }, l: { dur: 3.0, show: 1.8 }, m: { dur: 5.6, show: 4.5 } };
  var FX_REVEAL = {
    c: function (s, cfg) { var x = s.w / 2, y = s.h / 2; return function (t) { var c = s.ctx, u = t - cfg.show; c.globalCompositeOperation = 'lighter'; if (u > 0) { fxGlow(c, '255,255,255', x, y, 40 + u * 170, Math.max(0, 0.6 - u * 0.8)); } }; },
    r: function (s, cfg) {
      var x = s.w / 2, y = s.h / 2, P = fxBurst(x, y, 28, ['147,197,253', '255,255,255'], 60, 220);
      return function (t, dt) { var c = s.ctx; c.globalCompositeOperation = 'lighter'; [0.02, 0.22].forEach(function (a) { var v = (t - a) / 0.5; if (v > 0 && v < 1) { fxRing(c, x, y, 20 + v * 130, 8 + v * 55, '147,197,253', 1 - v, 2); } }); var u = t - cfg.show; if (u > 0) { fxGlow(c, '96,165,250', x, y, 60 + u * 150, Math.max(0, 0.7 - u * 0.7)); fxStep(c, P, dt); } };
    },
    e: function (s, cfg) {
      var x = s.w / 2, y = s.h / 2, P = fxBurst(x, y, 64, ['216,180,254', '244,114,182', '255,255,255'], 80, 300);
      return function (t, dt) {
        var c = s.ctx, k = fxEnv(t, 0, 0.3, cfg.dur + 0.4, cfg.dur + 1.2), bi = Math.min(1, t / cfg.show), u = t - cfg.show;
        c.globalAlpha = 0.55 * k; c.fillStyle = '#000'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; c.globalCompositeOperation = 'lighter';
        for (var i = 0; i < 3; i++) { fxBeam(c, x, y, t * 1.6 + i / 3 * FX_TAU, s.w, 0.1 + 0.08 * bi, 'rgba(192,132,252,' + (0.45 * bi * k) + ')'); }
        fxGlow(c, '168,85,247', x, y, 50 + 50 * bi, 0.5 * bi * k);
        if (u > 0) { fxGlow(c, '255,255,255', x, y, 30 + u * 230, Math.max(0, 0.8 - u * 1.1)); fxStep(c, P, dt); }
      };
    },
    l: function (s, cfg, odds) {
      var x = s.w / 2, y = s.h / 2, P = fxBurst(x, y, 96, ['253,224,71', '255,255,255', '251,191,36'], 90, 360), txt = odds || '';
      return function (t, dt) {
        var c = s.ctx, k = fxEnv(t, 0, 0.35, cfg.dur + 0.4, cfg.dur + 1.2), ri = fxEase((t - 0.3) / 0.8), u = t - cfg.show;
        c.globalAlpha = 0.9 * k; c.fillStyle = '#000'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; c.globalCompositeOperation = 'lighter';
        for (var i = 0; i < 12; i++) { fxBeam(c, x, y, t * 0.5 + i / 12 * FX_TAU, s.w, 0.07, 'rgba(253,224,71,' + (0.38 * ri * k) + ')'); }
        fxGlow(c, '250,204,21', x, y, 60 + 40 * ri, 0.45 * ri * k);
        var tu = t - 0.85;
        if (txt && tu > 0 && t < cfg.show + 0.15) {
          c.globalCompositeOperation = 'source-over'; c.font = '700 28px "DM Sans", system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
          var x1 = x - c.measureText(txt).width / 2, out = t > cfg.show ? Math.max(0, 1 - (t - cfg.show) / 0.15) : 1;
          for (var j = 0; j < txt.length; j++) { var a2 = Math.max(0, Math.min(1, (tu - j * 0.07) / 0.15)); c.globalAlpha = a2 * out; c.fillStyle = '#FDE68A'; c.fillText(txt[j], x1 + c.measureText(txt.slice(0, j)).width, y + (1 - a2) * 10); }
          c.globalAlpha = 1; c.globalCompositeOperation = 'lighter';
        }
        if (u > 0) { if (u < 0.2) { c.globalAlpha = (1 - u / 0.2) * 0.7; c.fillStyle = '#FFF7D6'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; } fxRing(c, x, y, 20 + u * 270, 8 + u * 95, '253,224,71', 1 - u * 1.4, 3); fxStep(c, P, dt); }
      };
    },
    /* Mythic: a cutscene. The screen goes dark over a low fog; an eight-pointed star turns and grows while three lines type
       themselves out (the odds are the second); a ring of runes pulses twice; the edges catch light; then the prize. */
    m: function (s, cfg, odds) {
      var x = s.w / 2, y = s.h * 0.42, P = fxBurst(x, y, 170, ['255,255,255', '240,171,252', '103,232,249', '253,224,71'], 120, 520), Up = [], i, LN = ['SOMETHING RARE STIRS.', (odds || 'MYTHIC').toUpperCase() + '.', 'IT CHOSE YOU.'], T0 = [0.7, 2.0, 3.2];
      for (i = 0; i < 46; i++) { Up.push({ x: fxR(0, 1), u: Math.random(), sp: fxR(0.08, 0.22), z: fxR(1.5, 3.5) }); }
      return function (t, dt) {
        var c = s.ctx, k = fxEnv(t, 0, 0.4, cfg.dur + 0.5, cfg.dur + 1.2), g = fxEase(Math.min(1, t / (cfg.show - 0.4))), R = 12 + 52 * g, u = t - cfg.show + 0.08, pre = u < 0 ? 1 : Math.max(0, 1 - u / 0.3), n, j;
        c.globalAlpha = k; c.fillStyle = '#020108'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; c.globalCompositeOperation = 'lighter';
        for (j = 0; j < 5; j++) { fxGlow(c, j % 2 ? '126,34,206' : '190,24,93', ((t * (14 + j * 7) + j * s.w / 4) % (s.w + 500)) - 250, s.h * (0.86 + j * 0.03), 230, 0.16 * k); }
        Up.forEach(function (p) { p.u = (p.u + dt * p.sp * (1 + g)) % 1; fxGlow(c, '240,171,252', p.x * s.w + Math.sin(t + p.u * 9) * 8, s.h - p.u * s.h * 0.8, p.z, Math.sin(p.u * Math.PI) * 0.8 * k * pre); });
        if (pre > 0) {
          /* the ring of runes pulses twice before the reveal */
          [cfg.show - 1.3, cfg.show - 0.75].forEach(function (b0) { var v = (t - b0) / 0.5; if (v > 0 && v < 1) { var a = Math.sin(v * Math.PI), rr = R * (1.5 + v * 0.7); fxRing(c, x, y, rr, rr, '240,171,252', a * 0.9, 2); for (n = 0; n < 12; n++) { var ra = n / 12 * FX_TAU + t * 0.4; fxRune(c, x + Math.cos(ra) * rr * 0.86, y + Math.sin(ra) * rr * 0.86, 8 + 3 * a, n, 'rgba(250,232,255,' + a.toFixed(2) + ')'); } } });
          for (n = 0; n < 16; n++) { fxBeam(c, x, y, t * 0.5 + n / 16 * FX_TAU, R * (2.2 + 0.8 * Math.sin(t * 2 + n)), 0.05, 'hsla(' + ((n * 24 + t * 50) % 360) + ',100%,72%,' + 0.2 * g * pre + ')'); }
          fxGlow(c, '217,70,239', x, y, R * 3, 0.4 * g * pre); fxGlow(c, '255,255,255', x, y, R * 1.1, 0.9 * pre);
          c.save(); c.translate(x, y); c.rotate(t * 0.9); fxStar4(c, 0, 0, R * 1.5, pre, '#FFFFFF'); c.rotate(Math.PI / 4); fxStar4(c, 0, 0, R, pre, '#F5D0FE'); c.restore();
          /* three lines, typed */
          c.textAlign = 'center';
          LN.forEach(function (ln, m) {
            var tt = t - T0[m], end = m < 2 ? T0[m + 1] - 0.15 : cfg.show - 0.25; if (tt < 0 || t > end + 0.2) { return; }
            var shown = Math.min(ln.length, Math.floor(tt / 0.04) + 1), al = t > end ? Math.max(0, 1 - (t - end) / 0.2) : 1, big = m === 1;
            c.globalCompositeOperation = 'source-over'; c.globalAlpha = al; c.font = (big ? '800 ' + Math.max(20, Math.min(30, s.w * 0.075)) : '600 ' + Math.max(11, Math.min(15, s.w * 0.036))) + 'px ' + (big ? '"DM Sans", system-ui, sans-serif' : FX_MONO);
            if (big) { var gr = c.createLinearGradient(x - 110, 0, x + 110, 0); for (j = 0; j <= 5; j++) { gr.addColorStop(j / 5, 'hsl(' + ((j * 60 + t * 240) % 360) + ',100%,74%)'); } c.fillStyle = gr; } else { c.fillStyle = '#F5F3FF'; }
            c.fillText(ln.slice(0, shown) + (shown < ln.length && Math.floor(t * 8) % 2 ? '_' : ''), x + (big && tt < 0.3 ? fxR(-2, 2) : 0), y + R * 2.2 + 46); c.globalAlpha = 1; c.globalCompositeOperation = 'lighter';
          });
          /* the edges catch light just before the reveal */
          var eg = Math.max(0, (t - (cfg.show - 0.55)) / 0.55); if (eg > 0) { var vg = c.createRadialGradient(x, s.h / 2, Math.min(s.w, s.h) * 0.3, x, s.h / 2, Math.max(s.w, s.h) * 0.75); vg.addColorStop(0, 'rgba(240,171,252,0)'); vg.addColorStop(1, 'rgba(250,232,255,' + 0.75 * eg + ')'); c.fillStyle = vg; c.fillRect(0, 0, s.w, s.h); }
        }
        if (u > 0) {
          if (u < 0.3) { c.globalAlpha = 1 - u / 0.3; c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; }
          for (var ri = 0; ri < 3; ri++) { var v2 = (u - ri * 0.14) / 1.0; if (v2 > 0 && v2 < 1) { c.globalAlpha = 1 - v2; c.lineWidth = 3.5 * (1 - v2) + 0.6; c.strokeStyle = 'hsl(' + ((ri * 110 + t * 200) % 360) + ',100%,70%)'; c.beginPath(); c.ellipse(x, y, 30 + v2 * s.w * 0.6, 14 + v2 * s.h * 0.4, 0, 0, FX_TAU); c.stroke(); c.globalAlpha = 1; } }
          fxStep(c, P, dt); fxGlow(c, '217,70,239', x - 70, y, 150 * Math.min(1, u * 2), 0.3 * k); fxGlow(c, '34,211,238', x + 70, y, 150 * Math.min(1, u * 2), 0.25 * k);
        }
      };
    }
  };
  /* play the reveal for a tier on a stage; onShow fires when the prize card should appear. Returns the reveal's length in ms.
     A Radiant prize (radiant.js) plays its own arrival, so the reveal is given the prize too. */
  function fxReveal(stage, tier, odds, onShow, it) {
    var cfg = FX_RV[tier] || FX_RV.c;
    $$('canvas.pz-rv', stage).forEach(function (n) { n.remove(); });
    if (FX_REDUCE) { onShow(); return 0; }
    var cv = document.createElement('canvas'); cv.className = 'pz-rv'; cv.setAttribute('aria-hidden', 'true'); stage.appendChild(cv);
    fxScene(cv, function (s) { return FX_REVEAL[tier](s, cfg, odds, it); }, { dur: cfg.dur + 1.2, end: function () { cv.remove(); } });
    setTimeout(onShow, cfg.show * 1000);
    if (tier === 'l' || tier === 'm' || tier === 'z') { setTimeout(function () { stage.classList.remove('pz-shake'); void stage.offsetWidth; stage.classList.add('pz-shake'); }, cfg.show * 1000); }
    return cfg.dur * 1000;
  }

  /* ---------- moving paper and living themes, behind the whole page ---------- */
  var FX_PAPER = {
    plot: function (s) {
      return function (t) {
        var c = s.ctx, col = FX_INK.acc, mid = s.h * 0.62, A = Math.min(140, s.h * 0.16), per = 0.012, head = (t * 110) % (s.w + 260);
        c.lineWidth = 2.4; c.lineCap = 'round'; c.strokeStyle = col;
        for (var x = 0; x < Math.min(head, s.w); x += 4) { var a = 1 - (head - x) / 520; if (a <= 0) { continue; } c.globalAlpha = Math.min(1, a) * 0.35; c.beginPath(); c.moveTo(x, mid - Math.sin(x * per) * A); c.lineTo(x + 4, mid - Math.sin((x + 4) * per) * A); c.stroke(); }
        c.globalAlpha = 1;
        if (head < s.w) { var hy = mid - Math.sin(head * per) * A; c.globalAlpha = 0.5; c.fillStyle = col; c.beginPath(); c.arc(head, hy, 5, 0, FX_TAU); c.fill(); c.globalAlpha = 1; }
      };
    },
    stars: function (s) {
      var S = [], sh = null, next = 2, n = Math.min(160, Math.round(s.w * s.h / 7000));
      for (var i = 0; i < n; i++) { S.push({ x: Math.random(), y: Math.random(), z: fxR(0.3, 1), p: fxR(0, FX_TAU) }); }
      return function (t, dt) {
        var c = s.ctx, D = FX_INK.dark;
        if (D) { c.globalCompositeOperation = 'lighter'; }
        S.forEach(function (q) { var x = ((q.x * s.w - t * 6 * q.z) % s.w + s.w) % s.w, tw = 0.6 + 0.4 * Math.sin(t * 2.5 * q.z + q.p); if (D) { fxGlow(c, '224,231,255', x, q.y * s.h, 1.2 + 2.4 * q.z, tw * q.z); } else { c.globalAlpha = 0.28 * tw * q.z; c.fillStyle = FX_INK.muted; c.beginPath(); c.arc(x, q.y * s.h, 0.8 + 1.2 * q.z, 0, FX_TAU); c.fill(); } });
        c.globalAlpha = 1;
        if (t > next && !sh) { sh = { x: fxR(0.3, 1) * s.w, y: fxR(0, 0.4) * s.h, l: 0 }; next = t + fxR(3, 7); }
        if (sh) { sh.l += dt; var u = sh.l / 0.7; if (u > 1) { sh = null; } else { for (var k = 0; k < 16; k++) { var x2 = sh.x - u * 220 + k * 6, y2 = sh.y + u * 80 - k * 2.2, a = (1 - k / 16) * (1 - u); if (D) { fxGlow(c, '255,255,255', x2, y2, 3 - k * 0.12, a); } else { c.globalAlpha = a * 0.5; c.fillStyle = FX_INK.acc; c.beginPath(); c.arc(x2, y2, Math.max(0.4, 2 - k * 0.1), 0, FX_TAU); c.fill(); c.globalAlpha = 1; } } } }
      };
    },
    eqrain: function (s) {
      var G = ['π', '√', '∑', '∞', 'θ', 'Δ', '∫', '≈', '≠', '∠', '½', 'x', 'y', '+', '−', '=', '÷'], cols = [];
      return function (t, dt) {
        var c = s.ctx, n = Math.ceil(s.w / 40);
        while (cols.length < n) { cols.push({ y: fxR(-s.h, 0), sp: fxR(14, 34) }); }
        c.font = '600 15px "IBM Plex Mono", ui-monospace, monospace'; c.textAlign = 'center'; c.fillStyle = FX_INK.acc;
        for (var i = 0; i < n; i++) { var q = cols[i]; q.y += q.sp * dt; if (q.y > s.h + 120) { q.y = fxR(-80, 0); q.sp = fxR(14, 34); } for (var k = 0; k < 6; k++) { var yy = q.y - k * 20; if (yy < -10 || yy > s.h + 10) { continue; } c.globalAlpha = (k === 0 ? 0.26 : 0.16 - k * 0.022) * (FX_INK.dark ? 1.3 : 1); c.fillText(G[(i * 7 + k * 3 + Math.floor(q.y / 20) + 100) % G.length], i * 40 + 20, yy); } }
        c.globalAlpha = 1;
      };
    },
    'const': function (s) {
      var P = [], n = Math.min(70, Math.round(s.w * s.h / 14000));
      for (var i = 0; i < n; i++) { P.push({ x: Math.random(), y: Math.random(), vx: fxR(-0.012, 0.012), vy: fxR(-0.012, 0.012) }); }
      return function (t, dt) {
        var c = s.ctx, D = FX_INK.dark, i2, j;
        P.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.x < 0 || p.x > 1) { p.vx *= -1; } if (p.y < 0 || p.y > 1) { p.vy *= -1; } });
        if (D) { c.globalCompositeOperation = 'lighter'; }
        c.lineWidth = 1; c.strokeStyle = D ? '#A5B4FC' : FX_INK.acc;
        for (i2 = 0; i2 < P.length; i2++) { for (j = i2 + 1; j < P.length; j++) { var d = Math.hypot((P[i2].x - P[j].x) * s.w, (P[i2].y - P[j].y) * s.h); if (d < 120) { c.globalAlpha = (1 - d / 120) * (D ? 0.45 : 0.18); c.beginPath(); c.moveTo(P[i2].x * s.w, P[i2].y * s.h); c.lineTo(P[j].x * s.w, P[j].y * s.h); c.stroke(); } } }
        c.globalAlpha = 1;
        P.forEach(function (p, i3) { if (D) { fxGlow(c, '199,210,254', p.x * s.w, p.y * s.h, 3 + 1.5 * Math.sin(t * 2 + i3), 0.9); } else { c.globalAlpha = 0.35; c.fillStyle = FX_INK.acc; c.beginPath(); c.arc(p.x * s.w, p.y * s.h, 2.2, 0, FX_TAU); c.fill(); c.globalAlpha = 1; } });
      };
    },
    sky: function (s) {
      return function (t) {
        var c = s.ctx, D = FX_INK.dark;
        c.globalCompositeOperation = D ? 'lighter' : 'source-over';
        [['74,222,128', 0.14, 0], ['45,212,191', 0.24, 2], ['167,139,250', 0.34, 4]].forEach(function (A) {
          for (var x = 0; x <= s.w; x += 4) { var base = A[1] * s.h + Math.sin(x * 0.008 + t * 0.5 + A[2]) * 26 + Math.sin(x * 0.003 - t * 0.3) * 20, hgt = 70 + 30 * Math.sin(x * 0.012 + t * 0.8 + A[2]); c.globalAlpha = D ? 0.45 : 0.16; c.drawImage(fxSprite(A[0]), x - 4, base - hgt, 8, hgt * 1.6); }
        });
        c.globalAlpha = 1;
      };
    },
    /* the Seasons backgrounds: fall, winter and spring */
    leaves: function (s) {
      var L = [], COL = ['#EA580C', '#DC2626', '#D97706', '#CA8A04', '#B45309'], n = Math.min(26, Math.round(s.w * s.h / 28000)) + 9;
      function leaf(top) { return { x: fxR(0, s.w), y: top ? fxR(-40, -10) : fxR(-s.h * 0.2, s.h), vy: fxR(26, 52), sw: fxR(16, 38), ph: fxR(0, FX_TAU), fr: fxR(0.6, 1.3), r: fxR(0, FX_TAU), vr: fxR(-1.5, 1.5), z: fxR(8, 14), col: COL[Math.floor(Math.random() * COL.length)] }; }
      for (var i = 0; i < n; i++) { L.push(leaf(false)); }
      return function (t, dt) {
        var c = s.ctx, a = FX_INK.dark ? 0.55 : 0.42;
        L.forEach(function (q, i) {
          q.y += q.vy * dt; q.r += q.vr * dt;
          if (q.y > s.h + 30) { L[i] = leaf(true); return; }
          /* it sways from side to side, and turns over now and then (the flattening) */
          var x = q.x + Math.sin(t * q.fr + q.ph) * q.sw, turn = Math.cos(t * q.fr * 1.7 + q.ph);
          c.save(); c.translate(x, q.y); c.rotate(q.r); c.scale(1, 0.3 + 0.7 * Math.abs(turn));
          c.globalAlpha = a; c.fillStyle = q.col;
          c.beginPath(); c.moveTo(-q.z, 0); c.quadraticCurveTo(0, -q.z * 0.8, q.z, 0); c.quadraticCurveTo(0, q.z * 0.8, -q.z, 0); c.fill();
          c.globalAlpha = a * 0.7; c.strokeStyle = '#7C2D12'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-q.z, 0); c.lineTo(q.z * 1.3, 0); c.stroke();
          c.restore();
        });
        c.globalAlpha = 1;
      };
    },
    snow: function (s) {
      var F = [], n = Math.min(150, Math.round(s.w * s.h / 8500));
      for (var i = 0; i < n; i++) { F.push({ x: Math.random(), y: Math.random(), z: fxR(0.3, 1), ph: fxR(0, FX_TAU) }); }
      return function (t, dt) {
        var c = s.ctx, D = FX_INK.dark;
        if (D) { c.globalCompositeOperation = 'lighter'; }
        F.forEach(function (q) {
          q.y += (0.02 + 0.055 * q.z) * dt;
          if (q.y > 1.03) { q.y = -0.03; q.x = Math.random(); }
          var x = (q.x + Math.sin(t * 0.7 * q.z + q.ph) * 0.014) * s.w, y = q.y * s.h, r = 0.8 + 2.3 * q.z;
          if (D) { fxGlow(c, '226,232,240', x, y, r * 2.2, 0.3 + 0.55 * q.z); }
          else { c.globalAlpha = 0.2 + 0.35 * q.z; c.fillStyle = '#94A3B8'; c.beginPath(); c.arc(x, y, r, 0, FX_TAU); c.fill(); }
        });
        c.globalAlpha = 1;
      };
    },
    blossoms: function (s) {
      var P = [], COL = ['#F9A8D4', '#F472B6', '#FBCFE8', '#FDA4AF'], n = Math.min(36, Math.round(s.w * s.h / 20000)) + 10;
      function petal(first) { return { x: first ? fxR(0, s.w) : fxR(-80, s.w * 0.7), y: first ? fxR(0, s.h) : fxR(-40, -10), vx: fxR(16, 38), vy: fxR(20, 42), ph: fxR(0, FX_TAU), fr: fxR(1.2, 2.4), r: fxR(0, FX_TAU), vr: fxR(-2, 2), z: fxR(5, 9), col: COL[Math.floor(Math.random() * COL.length)] }; }
      for (var i = 0; i < n; i++) { P.push(petal(true)); }
      return function (t, dt) {
        var c = s.ctx, a = FX_INK.dark ? 0.7 : 0.6;
        P.forEach(function (q, i) {
          /* a breeze from the left that rises and falls, and a flutter of its own */
          q.x += (q.vx + Math.sin(t * 0.5) * 10) * dt; q.y += (q.vy + Math.sin(t * q.fr + q.ph) * 14) * dt; q.r += q.vr * dt;
          if (q.y > s.h + 20 || q.x > s.w + 40) { P[i] = petal(false); return; }
          var flut = Math.sin(t * q.fr + q.ph);
          c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.scale(0.4 + 0.6 * Math.abs(flut), 1);
          c.globalAlpha = a; c.fillStyle = q.col;
          c.beginPath(); c.moveTo(0, q.z); c.bezierCurveTo(q.z * 1.1, q.z * 0.2, q.z * 0.6, -q.z, 0, -q.z * 0.55); c.bezierCurveTo(-q.z * 0.6, -q.z, -q.z * 1.1, q.z * 0.2, 0, q.z); c.fill();
          c.restore();
        });
        c.globalAlpha = 1;
      };
    },
    /* ---- Deep Sea ---- */
    bubbles: function (s) {
      var B = [], pops = [], n = Math.min(30, Math.round(s.w * s.h / 30000)) + 8;
      function bub(first) { return { x: Math.random(), y: first ? fxR(0, s.h) : s.h + fxR(10, 60), r: fxR(4, 13), vy: fxR(18, 42), ph: fxR(0, FX_TAU), top: fxR(0.05, 0.4) }; }
      for (var i = 0; i < n; i++) { B.push(bub(true)); }
      return function (t, dt) {
        var c = s.ctx, D = FX_INK.dark, rim = D ? '186,230,253' : '14,116,144';
        if (D) { c.globalCompositeOperation = 'lighter'; }
        B.forEach(function (b, i) {
          b.y -= b.vy * dt; var x = b.x * s.w + Math.sin(t * 1.8 + b.ph) * 6, wob = 0.06 * Math.sin(t * 5 + b.ph);
          if (b.y < s.h * b.top) { pops.push({ x: x, y: b.y, r: b.r, l: 0 }); B[i] = bub(false); return; }
          c.globalAlpha = D ? 0.5 : 0.45; c.strokeStyle = 'rgb(' + rim + ')'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, b.y, b.r * (1 + wob), b.r * (1 - wob), 0, 0, FX_TAU); c.stroke();
          c.globalAlpha = D ? 0.75 : 0.6; c.strokeStyle = D ? '#FFFFFF' : 'rgb(' + rim + ')'; c.lineWidth = 1.4; c.beginPath(); c.arc(x - b.r * 0.15, b.y - b.r * 0.15, b.r * 0.62, Math.PI * 1.1, Math.PI * 1.45); c.stroke();
        });
        for (var j = pops.length - 1; j >= 0; j--) { var p = pops[j]; p.l += dt; if (p.l > 0.3) { pops.splice(j, 1); continue; } var u = p.l / 0.3; c.globalAlpha = (1 - u) * 0.5; c.strokeStyle = 'rgb(' + rim + ')'; c.lineWidth = 1; for (var q = 0; q < 6; q++) { var a = q / 6 * FX_TAU; c.beginPath(); c.moveTo(p.x + Math.cos(a) * p.r * (0.8 + u), p.y + Math.sin(a) * p.r * (0.8 + u)); c.lineTo(p.x + Math.cos(a) * p.r * (1.1 + u * 1.4), p.y + Math.sin(a) * p.r * (1.1 + u * 1.4)); c.stroke(); } }
        c.globalAlpha = 1;
      };
    },
    kelp: function (s) {
      var K = [], Bb = [], i;
      for (i = 0; i < 8; i++) { K.push({ left: i % 2 === 0, off: fxR(-10, 40) + Math.floor(i / 2) * 32, h: fxR(0.45, 0.85), ph: fxR(0, FX_TAU), w: fxR(5, 9), col: ['#15803D', '#4D7C0F', '#0F766E'][i % 3] }); }
      for (i = 0; i < 14; i++) { Bb.push({ x: Math.random(), y: Math.random(), sp: fxR(10, 26), r: fxR(1, 2.5) }); }
      return function (t, dt) {
        var c = s.ctx, D = FX_INK.dark;
        c.globalCompositeOperation = D ? 'lighter' : 'source-over';
        for (var b = 0; b < 5; b++) { fxBeam(c, s.w * (0.15 + b * 0.18) + Math.sin(t * 0.25 + b) * 30, -30, Math.PI / 2 + 0.25 + 0.05 * Math.sin(t * 0.3 + b * 2), s.h * 1.3, 0.06, D ? 'rgba(125,211,252,.10)' : 'rgba(56,189,248,.09)'); }
        c.globalCompositeOperation = 'source-over'; c.lineCap = 'round';
        K.forEach(function (k) {
          var x0 = k.left ? k.off : s.w - k.off, H = s.h * k.h, px = x0, py = s.h + 6;
          for (var q = 1; q <= 14; q++) {
            var f = q / 14, sway = Math.sin(t * 0.9 + k.ph + f * 2.2) * 26 * f * f, x = x0 + sway, y = s.h + 6 - H * f;
            c.globalAlpha = D ? 0.5 : 0.35; c.strokeStyle = k.col; c.lineWidth = k.w * (1 - f * 0.55); c.beginPath(); c.moveTo(px, py); c.lineTo(x, y); c.stroke();
            if (q % 2 === 0 && q < 14) { var sd = q % 4 === 0 ? 1 : -1; c.fillStyle = k.col; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + sd * 16, y - 4 + Math.sin(t * 1.4 + q) * 3, x + sd * 22 + sway * 0.2, y - 14); c.quadraticCurveTo(x + sd * 8, y - 8, x, y); c.fill(); }
            px = x; py = y;
          }
        });
        Bb.forEach(function (b) { b.y -= b.sp * dt / s.h; if (b.y < -0.02) { b.y = 1.02; b.x = Math.random(); } c.globalAlpha = D ? 0.45 : 0.35; c.strokeStyle = D ? '#BAE6FD' : '#0E7490'; c.lineWidth = 1; c.beginPath(); c.arc(b.x * s.w + Math.sin(t + b.y * 9) * 3, b.y * s.h, b.r * 2, 0, FX_TAU); c.stroke(); });
        c.globalAlpha = 1;
      };
    },
    /* ---- Myth & Magic ---- */
    fireflies: function (s) {
      var Ff = [], n = Math.min(34, Math.round(s.w * s.h / 26000)) + 8;
      for (var i = 0; i < n; i++) { Ff.push({ x: Math.random(), y: Math.random(), ax: fxR(0, FX_TAU), ay: fxR(0, FX_TAU), fx: fxR(0.08, 0.2), fy: fxR(0.07, 0.17), blink: fxR(2.5, 6), ph: fxR(0, 6) }); }
      return function (t) {
        var c = s.ctx, D = FX_INK.dark;
        c.globalCompositeOperation = D ? 'lighter' : 'source-over';
        Ff.forEach(function (f) {
          var x = (f.x + 0.06 * Math.sin(t * f.fx * 2 + f.ax) + 0.03 * Math.sin(t * f.fx * 5.3 + f.ay)) * s.w, y = (f.y + 0.05 * Math.sin(t * f.fy * 2 + f.ay) + 0.025 * Math.cos(t * f.fy * 4.7 + f.ax)) * s.h;
          var cyc = (t + f.ph) % f.blink, on = cyc < 1.2 ? Math.sin(cyc / 1.2 * Math.PI) : 0;
          if (D) { fxGlow(c, '190,242,100', x, y, 4 + 14 * on, 0.15 + 0.85 * on); fxGlow(c, '254,252,232', x, y, 2.2, 0.4 + 0.6 * on); }
          else { fxGlow(c, '234,179,8', x, y, 3 + 11 * on, 0.15 + 0.6 * on); c.globalAlpha = 0.45 + 0.4 * on; c.fillStyle = '#A16207'; c.beginPath(); c.arc(x, y, 1.6, 0, FX_TAU); c.fill(); c.globalAlpha = 1; }
        });
      };
    },
    /* ---- Tech Lab ---- */
    circuit: function (s) {
      var T = [], W = 0, H = 0, g = 36, D8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
      function build() {
        T = []; W = s.w; H = s.h;
        var n = Math.min(46, Math.round(W * H / 22000)) + 6;
        for (var i = 0; i < n; i++) {
          var x = Math.round(fxR(0, W) / g) * g, y = Math.round(fxR(0, H) / g) * g, pts = [[x, y]], di = Math.floor(Math.random() * 8);
          for (var j = 0; j < 7; j++) { if (Math.random() < 0.4) { di = (di + (Math.random() < 0.5 ? 1 : 7)) % 8; } var st = 1 + Math.floor(Math.random() * 3); x += D8[di][0] * g * st; y += D8[di][1] * g * st; if (x < -g || y < -g || x > W + g || y > H + g) { break; } pts.push([x, y]); }
          if (pts.length < 2) { continue; }
          var L = 0; for (var q = 1; q < pts.length; q++) { L += Math.hypot(pts[q][0] - pts[q - 1][0], pts[q][1] - pts[q - 1][1]); }
          T.push({ pts: pts, L: L, sp: fxR(70, 160), off: fxR(0, 1.4) });
        }
      }
      function along(tr, d) { for (var q = 1; q < tr.pts.length; q++) { var a = tr.pts[q - 1], b = tr.pts[q], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= l) { return [a[0] + (b[0] - a[0]) * d / l, a[1] + (b[1] - a[1]) * d / l]; } d -= l; } return tr.pts[tr.pts.length - 1]; }
      return function (t) {
        if (s.w !== W || s.h !== H) { build(); }
        var c = s.ctx, D = FX_INK.dark, col = D ? '#4ADE80' : FX_INK.acc;
        c.lineWidth = 1.5; c.lineJoin = 'round'; c.strokeStyle = col; c.fillStyle = col;
        T.forEach(function (tr) {
          c.globalAlpha = D ? 0.22 : 0.16; c.beginPath(); tr.pts.forEach(function (p, i) { if (i) { c.lineTo(p[0], p[1]); } else { c.moveTo(p[0], p[1]); } }); c.stroke();
          [tr.pts[0], tr.pts[tr.pts.length - 1]].forEach(function (p) { c.beginPath(); c.arc(p[0], p[1], 3, 0, FX_TAU); c.stroke(); });
          /* a pulse runs the trace, rests a moment, and runs again */
          var d = ((t * tr.sp / tr.L + tr.off) % 1.4) * tr.L; if (d > tr.L) { return; }
          for (var k = 0; k < 8; k++) { var p2 = along(tr, Math.max(0, d - k * 5)); if (D) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '134,239,172', p2[0], p2[1], 7 - k * 0.6, 1 - k / 8); c.globalCompositeOperation = 'source-over'; } else { c.globalAlpha = (1 - k / 8) * 0.6; c.beginPath(); c.arc(p2[0], p2[1], 2.6 - k * 0.2, 0, FX_TAU); c.fill(); } }
        });
        c.globalAlpha = 1;
      };
    },
    warp: function (s) {
      var S = [], n = Math.min(220, Math.round(s.w * s.h / 4000));
      for (var i = 0; i < n; i++) { S.push({ a: fxR(0, FX_TAU), d: fxR(0.02, 1), z: fxR(0.5, 1.2) }); }
      return function (t, dt) {
        /* cruise, jump to light speed, hold, drop back out: every 9 seconds */
        var c = s.ctx, D = FX_INK.dark, x0 = s.w / 2, y0 = s.h * 0.42, M = Math.hypot(s.w, s.h) * 0.6, cyc = t % 9;
        var spd = cyc < 3 ? 0.06 : cyc < 4.2 ? 0.06 + Math.pow((cyc - 3) / 1.2, 2) * 1.2 : cyc < 6.5 ? 1.26 : cyc < 7.5 ? 1.26 - (cyc - 6.5) * 1.2 : 0.06, streak = Math.min(1, spd / 1.2);
        if (D) { c.globalCompositeOperation = 'lighter'; if (spd > 0.5) { fxGlow(c, '147,197,253', x0, y0, 80 + 120 * streak, 0.25 * streak); } }
        c.lineCap = 'round';
        S.forEach(function (q) {
          q.d += spd * dt * (0.3 + q.d) * q.z; if (q.d > 1) { q.d = fxR(0.02, 0.15); q.a = fxR(0, FX_TAU); }
          var r1 = q.d * M, r0 = Math.max(0, r1 - (4 + 220 * streak * q.d)), cs = Math.cos(q.a), sn = Math.sin(q.a);
          c.globalAlpha = Math.min(1, q.d * 2.5) * (D ? 0.85 : 0.28); c.strokeStyle = D ? (q.z > 0.9 ? '#E0F2FE' : '#93C5FD') : FX_INK.muted; c.lineWidth = (0.6 + 1.6 * q.d) * q.z;
          c.beginPath(); c.moveTo(x0 + cs * r0, y0 + sn * r0); c.lineTo(x0 + cs * r1 + 0.01, y0 + sn * r1); c.stroke();
        });
        c.globalAlpha = 1;
        if (D && cyc > 4.1 && cyc < 4.4) { c.globalAlpha = (1 - Math.abs(cyc - 4.25) / 0.15) * 0.25; c.fillStyle = '#DBEAFE'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; }
      };
    },
    /* ---- Haunted ---- */
    cobweb: function (s) {
      return function (t) {
        var c = s.ctx, D = FX_INK.dark, col = D ? '226,232,240' : '71,85,105';
        c.strokeStyle = 'rgba(' + col + ',.3)'; c.lineWidth = 1;
        [[0, 0, 1], [s.w, 0, -1]].forEach(function (w) {
          var R = Math.min(170, s.w * 0.42), i, j;
          for (i = 0; i <= 5; i++) { var an = i / 5 * Math.PI / 2; c.beginPath(); c.moveTo(w[0], w[1]); c.lineTo(w[0] + w[2] * Math.cos(an) * R, w[1] + Math.sin(an) * R); c.stroke(); }
          for (j = 1; j <= 4; j++) { var r = R * j / 4.4; c.beginPath(); for (i = 0; i <= 5; i++) { var a2 = i / 5 * Math.PI / 2, x = w[0] + w[2] * Math.cos(a2) * r, y = w[1] + Math.sin(a2) * r; if (!i) { c.moveTo(x, y); } else { var am = (i - 0.5) / 5 * Math.PI / 2; c.quadraticCurveTo(w[0] + w[2] * Math.cos(am) * r * 0.9, w[1] + Math.sin(am) * r * 0.9, x, y); } } c.stroke(); }
        });
        var sx = s.w * 0.78 + Math.sin(t * 0.8) * 10, sy = s.h * (0.18 + 0.14 * (0.5 + 0.5 * Math.sin(t * 0.35)));
        c.beginPath(); c.moveTo(s.w * 0.78, 0); c.lineTo(sx, sy); c.stroke();
        c.fillStyle = 'rgba(' + (D ? '203,213,225' : '30,41,59') + ',.58)'; c.strokeStyle = c.fillStyle; c.lineWidth = 1.2;
        c.beginPath(); c.ellipse(sx, sy + 6, 5, 6.5, 0, 0, FX_TAU); c.fill(); c.beginPath(); c.arc(sx, sy - 1, 3, 0, FX_TAU); c.fill();
        for (var l = 0; l < 4; l++) { for (var sd = -1; sd <= 1; sd += 2) { var wig = Math.sin(t * 4 + l) * 1.5; c.beginPath(); c.moveTo(sx + sd * 3, sy + 2 + l * 1.5); c.quadraticCurveTo(sx + sd * (10 + l), sy - 4 + l * 3 + wig, sx + sd * (13 + l), sy + 4 + l * 4 + wig); c.stroke(); } }
      };
    },
    /* ---- The Unknown ---- */
    meteors: function (s) {
      var M = [], S = [], next = 0; for (var i = 0; i < 50; i++) { S.push({ x: Math.random(), y: Math.random(), p: fxR(0, 6) }); }
      return function (t, dt) {
        var c = s.ctx, D = FX_INK.dark;
        if (D) { c.globalCompositeOperation = 'lighter'; S.forEach(function (q) { fxGlow(c, '226,232,240', q.x * s.w, q.y * s.h, 2, 0.3 + 0.3 * Math.sin(t * 2 + q.p)); }); }
        if (t > next || t < next - 2) { next = t + fxR(0.12, 0.45); M.push({ x: fxR(0.1, 1.3) * s.w, y: -20, v: fxR(380, 620), len: fxR(70, 150), hue: [45, 190, 320, 45][Math.floor(Math.random() * 4)] }); }
        c.lineCap = 'round';
        for (var j = M.length - 1; j >= 0; j--) {
          var m = M[j]; m.x -= m.v * dt * 0.6; m.y += m.v * dt * 0.8; if (m.y > s.h + 160) { M.splice(j, 1); continue; }
          var g = c.createLinearGradient(m.x, m.y, m.x + m.len * 0.6, m.y - m.len * 0.8); g.addColorStop(0, D ? 'hsla(' + m.hue + ',100%,85%,.95)' : 'hsla(' + m.hue + ',80%,45%,.5)'); g.addColorStop(1, 'hsla(' + m.hue + ',100%,70%,0)');
          c.strokeStyle = g; c.lineWidth = 2.2; c.beginPath(); c.moveTo(m.x, m.y); c.lineTo(m.x + m.len * 0.6, m.y - m.len * 0.8); c.stroke();
          if (D) { fxGlow(c, '255,255,255', m.x, m.y, 5, 0.9); }
        }
      };
    },
    ufo: function (s) {
      var U = null, next = 0.5, S = []; for (var i = 0; i < 40; i++) { S.push({ x: Math.random(), y: Math.random(), p: fxR(0, 6) }); }
      return function (t, dt) {
        var c = s.ctx, D = FX_INK.dark;
        if (D) { c.globalCompositeOperation = 'lighter'; S.forEach(function (q) { fxGlow(c, '226,232,240', q.x * s.w, q.y * s.h, 1.8, 0.25 + 0.25 * Math.sin(t * 2 + q.p)); }); }
        if (!U && (next === 0.5 || t > next || t < next - 8)) { var dir = Math.random() < 0.5 ? 1 : -1; U = { x: next === 0.5 ? s.w * fxR(0.3, 0.7) : dir > 0 ? -70 : s.w + 70, y: fxR(0.12, 0.45) * s.h, dir: dir, v: fxR(40, 75), ph: fxR(0, 6), z: fxR(26, 40) }; }
        if (U) {
          U.x += U.dir * U.v * dt; var y = U.y + Math.sin(t * 1.2 + U.ph) * 14, sw = Math.sin(t * 0.9 + U.ph) * 0.35, bl = s.h * 0.4, k = D ? 1 : 0.5;
          c.globalCompositeOperation = D ? 'lighter' : 'source-over'; var g = c.createLinearGradient(0, y, 0, y + bl); g.addColorStop(0, 'rgba(134,239,172,' + 0.35 * k + ')'); g.addColorStop(1, 'rgba(134,239,172,0)'); c.fillStyle = g;
          c.beginPath(); c.moveTo(U.x - U.z * 0.3, y + U.z * 0.15); c.lineTo(U.x + U.z * 0.3, y + U.z * 0.15); c.lineTo(U.x + Math.sin(sw) * bl + U.z * 1.6, y + bl); c.lineTo(U.x + Math.sin(sw) * bl - U.z * 1.6, y + bl); c.fill();
          c.globalCompositeOperation = 'source-over'; fxUfo(c, U.x, y, U.z, t, D ? 0.9 : 0.5); if (D) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '103,232,249', U.x, y, U.z * 1.5, 0.25); }
          if (U.x < -90 || U.x > s.w + 90) { U = null; next = t + fxR(2, 6); }
        }
      };
    },
    /* ---- Dreamscape ---- */
    lava: function (s) {
      var B = []; for (var i = 0; i < 7; i++) { B.push({ x: fxR(0.1, 0.9), ph: fxR(0, FX_TAU), sp: fxR(0.05, 0.11), r: fxR(0.16, 0.3), rgb: ['249,115,22', '236,72,153', '168,85,247', '250,204,21', '244,63,94', '59,130,246', '20,184,166'][i] }); }
      return function (t) {
        var c = s.ctx, D = FX_INK.dark, m = Math.min(s.w, s.h); if (D) { c.globalCompositeOperation = 'lighter'; }
        B.forEach(function (b) { fxGlow(c, b.rgb, (b.x + 0.06 * Math.sin(t * b.sp * 3.1 + b.ph * 2)) * s.w, (0.5 + 0.55 * Math.sin(t * b.sp * 2 + b.ph)) * s.h, m * b.r * (1 + 0.15 * Math.sin(t * 0.7 + b.ph)) * 1.5, D ? 0.3 : 0.22); });
      };
    },
    kaleido: function (s) {
      return function (t) {
        var c = s.ctx, D = FX_INK.dark, x0 = s.w / 2, y0 = s.h * 0.42, M = Math.hypot(s.w, s.h) * 0.55, N = 12, a = D ? 0.3 : 0.13;
        for (var i = 0; i < N; i++) {
          c.save(); if (D) { c.globalCompositeOperation = 'lighter'; } c.translate(x0, y0); c.rotate(i / N * FX_TAU + t * 0.05); if (i % 2) { c.scale(1, -1); }
          for (var j = 0; j < 7; j++) {
            var r = M * (0.1 + j * 0.14 + 0.03 * Math.sin(t * 0.6 + j * 1.3)), sz = M * (0.035 + 0.02 * Math.sin(t * 0.8 + j)), off = 0.13 + 0.08 * Math.sin(t * 0.4 + j * 0.9), x = Math.cos(off) * r, y = Math.sin(off) * r;
            c.globalAlpha = a; c.fillStyle = 'hsl(' + ((j * 47 + t * 14 + i * 4) % 360) + ',90%,' + (D ? 62 : 52) + '%)'; c.beginPath();
            if (j % 3 === 0) { c.moveTo(x, y - sz); c.lineTo(x + sz * 0.8, y); c.lineTo(x, y + sz); c.lineTo(x - sz * 0.8, y); } else if (j % 3 === 1) { c.moveTo(x - sz, y + sz * 0.6); c.lineTo(x + sz, y + sz * 0.6); c.lineTo(x, y - sz * 0.9); } else { c.arc(x, y, sz * 0.7, 0, FX_TAU); }
            c.fill();
          }
          c.restore();
        }
        c.globalAlpha = 1;
      };
    },
    whale: function (s) {
      var St = [], Du = [], i; for (i = 0; i < 46; i++) { St.push({ u: Math.random(), v: fxR(-0.8, 0.8), p: fxR(0, 6), z: fxR(1.2, 2.6) }); } St.sort(function (a, b) { return a.u - b.u; });
      for (i = 0; i < 60; i++) { Du.push({ x: Math.random(), y: Math.random(), p: fxR(0, 6) }); }
      return function (t) {
        var c = s.ctx, D = FX_INK.dark, L = Math.min(s.w * 1.05, 560), per = 46, cyc = ((t + 12) % per) / per, hx = -L * 0.2 + cyc * (s.w + L * 1.5), hy = s.h * (0.34 + 0.08 * Math.sin(t * 0.21)), rgb = D ? '147,197,253' : '67,56,202', k = D ? 1 : 0.5, n = 28, top = [], bot = [], j;
        if (D) { c.globalCompositeOperation = 'lighter'; Du.forEach(function (q) { fxGlow(c, '199,210,254', q.x * s.w, q.y * s.h, 1.8, 0.2 + 0.2 * Math.sin(t * 1.5 + q.p)); }); }
        function sp(u) { return [hx - u * L, hy + Math.sin(t * 1.1 - u * 3.2) * L * 0.08 * u]; }
        function th(u) { return L * 0.15 * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(1, u * 1.06), 0.55)), 0.9) * (1 - u * 0.25) + L * 0.012; }
        for (j = 0; j <= n; j++) { var u = j / n * 0.92, p = sp(u), h = th(u); top.push([p[0], p[1] - h * 0.85]); bot.push([p[0], p[1] + h]); }
        c.beginPath(); top.forEach(function (q, m) { if (m) { c.lineTo(q[0], q[1]); } else { c.moveTo(q[0], q[1]); } }); for (j = n; j >= 0; j--) { c.lineTo(bot[j][0], bot[j][1]); } c.closePath();
        c.fillStyle = 'rgba(' + rgb + ',' + 0.17 * k + ')'; c.fill(); c.strokeStyle = 'rgba(' + rgb + ',' + 0.8 * k + ')'; c.lineWidth = 1.8; c.stroke();
        var tl = sp(0.92), tl0 = sp(0.86), ta = Math.atan2(tl[1] - tl0[1], tl[0] - tl0[0]);
        [1, -1].forEach(function (sd) { c.beginPath(); c.moveTo(tl[0], tl[1]); c.quadraticCurveTo(tl[0] + Math.cos(ta + sd * 0.5) * L * 0.1, tl[1] + Math.sin(ta + sd * 0.5) * L * 0.1, tl[0] + Math.cos(ta + sd) * L * 0.15, tl[1] + Math.sin(ta + sd) * L * 0.15); c.quadraticCurveTo(tl[0] + Math.cos(ta + sd * 0.3) * L * 0.05, tl[1] + Math.sin(ta + sd * 0.3) * L * 0.05, tl[0], tl[1]); c.fill(); c.stroke(); });
        var f0 = sp(0.3), fh = th(0.3); c.beginPath(); c.moveTo(f0[0], f0[1] + fh * 0.7); c.quadraticCurveTo(f0[0] - L * 0.06, f0[1] + fh + L * (0.1 + 0.02 * Math.sin(t * 1.4)), f0[0] - L * 0.14, f0[1] + fh + L * 0.09); c.quadraticCurveTo(f0[0] - L * 0.07, f0[1] + fh * 0.9, f0[0] - L * 0.04, f0[1] + fh * 0.75); c.fill(); c.stroke();
        var e0 = sp(0.1); fxGlow(c, D ? '255,255,255' : rgb, e0[0], e0[1] + th(0.1) * 0.15, 4, 0.9 * k);
        c.lineWidth = 0.8; for (j = 0; j < 4; j++) { c.beginPath(); for (var q2 = 1; q2 <= 9; q2++) { var pu = q2 / n * 0.92, pp = sp(pu), ph2 = th(pu); if (q2 === 1) { c.moveTo(pp[0], pp[1] + ph2 * (0.45 + j * 0.13)); } else { c.lineTo(pp[0], pp[1] + ph2 * (0.45 + j * 0.13)); } } c.stroke(); }
        var prev = null; St.forEach(function (q, m) {
          var u2 = 0.03 + q.u * 0.85, p2 = sp(u2), x = p2[0], y = p2[1] + q.v * th(u2) * 0.8, tw = 0.5 + 0.5 * Math.sin(t * 2 + q.p);
          if (prev && m % 3) { c.strokeStyle = 'rgba(' + rgb + ',' + 0.3 * k + ')'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(x, y); c.stroke(); }
          if (D) { fxGlow(c, '255,255,255', x, y, q.z * (1.6 + tw), 0.5 + 0.5 * tw); } else { c.globalAlpha = 0.35 + 0.3 * tw; c.fillStyle = 'rgb(' + rgb + ')'; c.beginPath(); c.arc(x, y, q.z * 0.8, 0, FX_TAU); c.fill(); c.globalAlpha = 1; }
          prev = [x, y];
        });
        var bc = t % 9; if (bc < 2.2) { var b0 = sp(0.14), bh = th(0.14); for (j = 0; j < 14; j++) { var f = (bc * 0.9 + j / 14) % 1, bx = b0[0] + (j % 2 ? 1 : -1) * f * f * L * 0.05 * (1 + j % 3), byy = b0[1] - bh - f * L * 0.14 + f * f * L * 0.06; if (D) { fxGlow(c, '224,231,255', bx, byy, 3, (1 - f) * 0.9); } else { c.globalAlpha = (1 - f) * 0.4; c.fillStyle = 'rgb(' + rgb + ')'; c.beginPath(); c.arc(bx, byy, 1.6, 0, FX_TAU); c.fill(); c.globalAlpha = 1; } } }
      };
    }
  };
  var FX_LIVING = {
    'prize-nebula': function (s) {
      var B = [['168,85,247', 0.25, 0.25], ['59,130,246', 0.78, 0.4], ['236,72,153', 0.5, 0.85], ['20,184,166', 0.1, 0.75]], S = [], n = Math.min(140, Math.round(s.w * s.h / 8000));
      for (var i = 0; i < n; i++) { S.push({ x: Math.random(), y: Math.random(), p: fxR(0, FX_TAU), z: fxR(0.5, 1.4) }); }
      return function (t) { var c = s.ctx, R = Math.max(s.w, s.h) * 0.45; c.globalCompositeOperation = 'lighter'; B.forEach(function (b, i) { fxGlow(c, b[0], (b[1] + 0.06 * Math.sin(t * 0.12 + i * 2)) * s.w, (b[2] + 0.05 * Math.cos(t * 0.1 + i)) * s.h, R, 0.22); }); S.forEach(function (q) { var tw = 0.5 + 0.5 * Math.sin(t * 1.6 + q.p); fxGlow(c, '255,255,255', q.x * s.w, q.y * s.h, 1.5 * q.z + tw, 0.3 + 0.5 * tw); }); };
    },
    'prize-synthwave': function (s) {
      return function (t) {
        var c = s.ctx, hy = s.h * 0.72, vx = s.w / 2, sr = Math.min(90, s.w * 0.16), sy = hy - 4;
        c.save(); c.beginPath(); c.rect(0, 0, s.w, hy); c.clip(); c.globalAlpha = 0.55;
        var g = c.createLinearGradient(0, sy - sr, 0, sy + sr); g.addColorStop(0, '#FDE047'); g.addColorStop(0.5, '#FB923C'); g.addColorStop(1, '#F472B6'); c.fillStyle = g; c.beginPath(); c.arc(vx, sy, sr, 0, FX_TAU); c.fill();
        c.globalAlpha = 1; c.globalCompositeOperation = 'destination-out'; for (var i = 0; i < 6; i++) { c.fillRect(vx - sr, sy - sr * 0.1 + i * sr * 0.18 + ((t * 10) % (sr * 0.18)), sr * 2, 2 + i); }
        c.restore(); c.globalCompositeOperation = 'lighter'; fxGlow(c, '244,114,182', vx, hy, s.w * 0.35, 0.3);
        c.strokeStyle = 'rgba(244,114,182,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, hy); c.lineTo(s.w, hy); c.stroke();
        c.globalAlpha = 0.4; for (var k = -14; k <= 14; k++) { c.beginPath(); c.moveTo(vx + k * 18, hy); c.lineTo(vx + k * 150, s.h); c.stroke(); }
        for (var j = 0; j < 10; j++) { var f = (j + (t * 0.6) % 1) / 10, yy = hy + Math.pow(f, 2.2) * (s.h - hy); c.globalAlpha = 0.12 + 0.45 * f; c.beginPath(); c.moveTo(0, yy); c.lineTo(s.w, yy); c.stroke(); }
        c.globalAlpha = 1;
      };
    },
    'prize-inferno': function (s) {
      var P = [];
      return function (t, dt) {
        var c = s.ctx; c.globalCompositeOperation = 'lighter'; fxGlow(c, '234,88,12', s.w / 2, s.h + 40, Math.max(s.w, 500) * 0.6, 0.35 + 0.08 * Math.sin(t * 5));
        for (var k = 0; k < Math.max(1, Math.round(s.w / 300)); k++) { P.push({ x: fxR(0, s.w), y: s.h + 4, vy: fxR(-80, -35), vx: fxR(-12, 12), l: 0, m: fxR(2, 4.5), z: fxR(1.5, 3.5) }); }
        for (var i = P.length - 1; i >= 0; i--) { var p = P[i]; p.l += dt; if (p.l > p.m) { P.splice(i, 1); continue; } p.x += (p.vx + Math.sin(t * 2 + i) * 12) * dt; p.y += p.vy * dt; var u = p.l / p.m; fxGlow(c, u < 0.4 ? '253,224,71' : '249,115,22', p.x, p.y, p.z * 2.2, (1 - u) * 0.8); }
        if (P.length > 260) { P.splice(0, P.length - 260); }
      };
    },
    'prize-holo': function (s) {
      var G = [], n = Math.min(30, Math.round(s.w * s.h / 30000));
      for (var i = 0; i < n; i++) { G.push({ x: Math.random(), y: Math.random(), p: fxR(0, FX_TAU), sp: fxR(1, 2.2), z: fxR(4, 9), col: ['#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B'][i % 4] }); }
      return function (t) {
        var c = s.ctx, g = c.createLinearGradient(0, 0, s.w, s.h), o = (t * 0.05) % 1;
        ['#FBCFE8', '#C7D2FE', '#A5F3FC', '#BBF7D0', '#FDE68A', '#FBCFE8'].forEach(function (col, i) { g.addColorStop(((i / 5) + o) % 1, col); });
        c.globalAlpha = 0.28; c.fillStyle = g; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1;
        G.forEach(function (q) { var k = Math.max(0, Math.sin(t * q.sp + q.p)); fxStar4(c, q.x * s.w, q.y * s.h, q.z * (0.5 + k), k * 0.7, q.col); });
      };
    },
    'prize-abyss': function (s) {
      var P = [], J = null, next = 4, n = Math.min(160, Math.round(s.w * s.h / 7000));
      for (var i = 0; i < n; i++) { P.push({ x: Math.random(), y: Math.random(), z: fxR(0.4, 1.4), p: fxR(0, FX_TAU), col: ['45,212,191', '103,232,249', '167,139,250'][i % 3] }); }
      return function (t, dt) {
        var c = s.ctx; c.globalCompositeOperation = 'lighter';
        for (var b = 0; b < 4; b++) { fxBeam(c, s.w * (0.2 + b * 0.22) + Math.sin(t * 0.18 + b) * 40, -40, Math.PI / 2 + 0.18 * Math.sin(t * 0.12 + b * 1.7), s.h * 1.4, 0.08, 'rgba(56,189,248,.07)'); }
        fxGlow(c, '14,116,144', s.w * 0.5, -s.h * 0.1, s.w * 0.7, 0.25);
        P.forEach(function (q) { var x = ((q.x * s.w + Math.sin(t * 0.2 + q.p) * 20) % s.w + s.w) % s.w, y = ((q.y * s.h - t * 6 * q.z) % s.h + s.h) % s.h, tw = 0.5 + 0.5 * Math.sin(t * 1.3 + q.p); fxGlow(c, q.col, x, y, q.z * (2 + 2.5 * tw), 0.25 + 0.5 * tw); });
        /* now and then a jellyfish rises through the dark */
        if (!J && t > next) { J = { x: fxR(0.15, 0.85), y: s.h + 60, ph: fxR(0, 6), rgb: Math.random() < 0.5 ? '244,114,182' : '103,232,249' }; }
        if (J) { J.y -= dt * 24; if (J.y < -90) { J = null; next = t + fxR(6, 12); } else { fxJelly(c, J.x * s.w + Math.sin(t * 0.5 + J.ph) * 20, J.y, 26, J.rgb, J.rgb === '244,114,182' ? '#FBCFE8' : '#CFFAFE', t, J.ph, 0.55); } }
      };
    },
    'prize-terminal': function (s) {
      var cols = [];
      return function (t, dt) {
        var c = s.ctx, n = Math.ceil(s.w / 22), i, k;
        /* ones and zeros fall in the outermost columns only, clear of the text */
        while (cols.length < n) { cols.push({ y: fxR(-s.h, 0), sp: fxR(20, 60) }); }
        c.font = '600 13px "IBM Plex Mono", ui-monospace, monospace'; c.textAlign = 'center'; c.fillStyle = '#4ADE80';
        for (i = 0; i < n; i++) { var edge = Math.min(i, n - 1 - i); if (edge > 1) { continue; } var q = cols[i]; q.y += q.sp * dt; if (q.y > s.h + 200) { q.y = fxR(-200, 0); } for (k = 0; k < 10; k++) { var yy = q.y - k * 16; if (yy < -10 || yy > s.h + 10) { continue; } c.globalAlpha = (k ? 0.08 : 0.22) * (1 - edge * 0.35); c.fillText(((i * 7 + k * 3 + Math.floor(q.y / 16)) % 3) ? '1' : '0', i * 22 + 11, yy); } }
        /* scanlines, a soft phosphor glow with a flicker, and a bright band that rolls down */
        c.globalAlpha = 0.07; c.fillStyle = '#000000'; for (var y = 0; y < s.h; y += 3) { c.fillRect(0, y, s.w, 1); }
        c.globalAlpha = 1; c.globalCompositeOperation = 'lighter'; fxGlow(c, '34,197,94', s.w / 2, s.h / 2, Math.max(s.w, s.h) * 0.7, 0.07 + 0.015 * Math.sin(t * 13) + (Math.random() < 0.02 ? 0.03 : 0));
        var by = ((t % 7) / 7) * (s.h + 200) - 100, g = c.createLinearGradient(0, by - 60, 0, by + 60); g.addColorStop(0, 'rgba(74,222,128,0)'); g.addColorStop(0.5, 'rgba(74,222,128,.05)'); g.addColorStop(1, 'rgba(74,222,128,0)'); c.fillStyle = g; c.fillRect(0, by - 60, s.w, 120);
      };
    },
    'prize-enchanted': function (s) {
      var Ff = [], Rn = [], W = null, nextW = 3, n = Math.min(40, Math.round(s.w * s.h / 22000)) + 10, i;
      for (i = 0; i < n; i++) { Ff.push({ x: Math.random(), y: Math.random(), ax: fxR(0, FX_TAU), ay: fxR(0, FX_TAU), fx: fxR(0.06, 0.16), fy: fxR(0.05, 0.14), blink: fxR(2.5, 5.5), ph: fxR(0, 6) }); }
      for (i = 0; i < 7; i++) { Rn.push({ g: i * 3, ph: fxR(0, 8), n: -1, x: 0, y: 0 }); }
      return function (t, dt) {
        var c = s.ctx; c.globalCompositeOperation = 'lighter';
        /* mist rolling along the bottom */
        for (var m = 0; m < 3; m++) { fxGlow(c, '139,92,246', ((t * (8 + m * 5) + m * s.w / 3) % (s.w + 600)) - 300, s.h * (0.82 + m * 0.07), 260, 0.12); }
        fxGlow(c, '91,33,182', s.w * 0.5, s.h * 1.05, s.w * 0.6, 0.2);
        /* runes that glow and fade where they float, somewhere new each time */
        Rn.forEach(function (r) { var k = Math.floor((t + r.ph) / 8), cyc = (t + r.ph) % 8, a = cyc < 4 ? Math.sin(cyc / 4 * Math.PI) : 0; if (k !== r.n) { r.n = k; r.x = fxR(0.05, 0.95); r.y = fxR(0.1, 0.9); } if (a > 0) { var ry = r.y * s.h - cyc * 4; fxGlow(c, '163,230,53', r.x * s.w, ry, 22, a * 0.25); fxRune(c, r.x * s.w, ry, 9, r.g, 'rgba(217,249,157,' + (a * 0.5).toFixed(2) + ')'); } });
        Ff.forEach(function (f) { var x = (f.x + 0.06 * Math.sin(t * f.fx * 2 + f.ax)) * s.w, y = (f.y + 0.05 * Math.sin(t * f.fy * 2 + f.ay)) * s.h, cyc = (t + f.ph) % f.blink, on = cyc < 1.2 ? Math.sin(cyc / 1.2 * Math.PI) : 0; fxGlow(c, '190,242,100', x, y, 3 + 14 * on, 0.2 + 0.8 * on); });
        /* a wisp streaks across now and then, leaving sparkles */
        if (!W && t > nextW) { W = { x: -40, y: fxR(0.2, 0.7) * s.h, vx: fxR(120, 200), ph: fxR(0, 6), trail: [] }; }
        if (W) {
          W.x += W.vx * dt; var wy = W.y + Math.sin(t * 2.5 + W.ph) * 40; W.trail.push([W.x, wy, 0]);
          W.trail.forEach(function (q) { q[2] += dt; }); W.trail = W.trail.filter(function (q) { return q[2] < 1.2; });
          W.trail.forEach(function (q) { fxStar4(c, q[0], q[1] + q[2] * 10, 3 * (1 - q[2] / 1.2), 1 - q[2] / 1.2, '#E9D5FF'); });
          fxGlow(c, '233,213,255', W.x, wy, 16, 0.9);
          if (W.x > s.w + 60) { W = null; nextW = t + fxR(6, 12); }
        }
      };
    },
    'prize-haunted': function (s) {
      var B = [], E = [], i; for (i = 0; i < 3; i++) { B.push({ x: fxR(0, 1), y: fxR(0.1, 0.5), v: fxR(30, 60) * (i % 2 ? 1 : -1), ph: fxR(0, 6), z: fxR(15, 24) }); }
      for (i = 0; i < 6; i++) { E.push({ x: i % 2 ? fxR(0.9, 0.97) : fxR(0.03, 0.1), y: fxR(0.2, 0.95), per: fxR(6, 11), ph: fxR(0, 9), z: fxR(7, 11) }); }
      return function (t, dt) {
        var c = s.ctx, mx = s.w * 0.8, my = Math.min(230, s.h * 0.3), j;
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,230,138', mx, my, 120, 0.22); fxGlow(c, '254,243,199', mx, my, 34, 0.9);
        c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(13,10,20,.35)'; c.beginPath(); c.arc(mx - 9, my - 6, 6, 0, FX_TAU); c.fill(); c.beginPath(); c.arc(mx + 8, my + 7, 4, 0, FX_TAU); c.fill();
        c.globalCompositeOperation = 'lighter'; for (j = 0; j < 4; j++) { fxGlow(c, '148,130,180', ((t * (10 + j * 6) + j * s.w / 3) % (s.w + 700)) - 350, s.h * (0.78 + j * 0.07), 300, 0.1); }
        c.globalCompositeOperation = 'source-over';
        B.forEach(function (b) { b.x += b.v * dt / s.w; if (b.x > 1.1) { b.x = -0.1; } if (b.x < -0.1) { b.x = 1.1; } fxBat(c, b.x * s.w, b.y * s.h + Math.sin(t * 1.5 + b.ph) * 30, b.z, Math.sin(t * 14 + b.ph), 0.7, '#8E7BB5'); });
        E.forEach(function (e) { var cyc = (t + e.ph) % e.per, open = cyc < 0.3 ? cyc / 0.3 : cyc < 2.6 ? 1 : cyc < 2.9 ? 1 - (cyc - 2.6) / 0.3 : 0; if (open > 0) { fxEye(c, e.x * s.w, e.y * s.h, e.z, open, e.x < 0.5 ? 0.8 : -0.8, 0, '#F97316', 0.75); } });
      };
    },
    'prize-eldritch': function (s) {
      var T = [], P = [], i; for (i = 0; i < 7; i++) { T.push({ x: (i + 0.5) / 7 + fxR(-0.04, 0.04), h: fxR(0.16, 0.32), ph: fxR(0, 6), w: fxR(10, 18) }); }
      for (i = 0; i < 60; i++) { P.push({ x: Math.random(), y: Math.random(), z: fxR(0.5, 1.5), p: fxR(0, 6), rgb: i % 3 ? '94,234,212' : '192,132,252' }); }
      return function (t) {
        var c = s.ctx; c.globalCompositeOperation = 'lighter'; fxGlow(c, '76,29,149', s.w / 2, s.h * 1.05, s.w * 0.8, 0.3);
        P.forEach(function (q) { var y = ((q.y * s.h - t * 5 * q.z) % s.h + s.h) % s.h, tw = 0.5 + 0.5 * Math.sin(t * 1.2 + q.p); fxGlow(c, q.rgb, q.x * s.w + Math.sin(t * 0.3 + q.p) * 14, y, q.z * (2 + 2 * tw), 0.2 + 0.45 * tw); });
        c.lineCap = 'round';
        T.forEach(function (q) {
          var px = q.x * s.w, py = s.h + 8, H = q.h * s.h;
          for (var j = 1; j <= 14; j++) {
            var f = j / 14, x = q.x * s.w + Math.sin(t * 0.8 + q.ph + f * 2.6) * 34 * f * f + Math.sin(t * 1.9 + q.ph) * 6 * f, y = s.h + 8 - H * f;
            c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#164E47'; c.lineWidth = q.w * (1 - f * 0.85) + 1.5; c.beginPath(); c.moveTo(px, py); c.lineTo(x, y); c.stroke();
            if (j % 2 === 0) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '192,132,252', x, y, 2 + 2.5 * (1 - f), 0.6); }
            px = x; py = y;
          }
        });
      };
    },
    'prize-lanterns': function (s) {
      var Ln = [], S = [], i; for (i = 0; i < 14; i++) { Ln.push({ x: Math.random(), y: Math.random() * 1.2, z: fxR(0.4, 1), ph: fxR(0, 6) }); } Ln.sort(function (a, b) { return a.z - b.z; });
      for (i = 0; i < 50; i++) { S.push({ x: Math.random(), y: Math.random() * 0.7, p: fxR(0, 6) }); }
      return function (t, dt) {
        var c = s.ctx; c.globalCompositeOperation = 'lighter'; fxGlow(c, '190,24,93', s.w * 0.5, s.h * 1.1, s.w * 0.9, 0.16);
        S.forEach(function (q) { fxGlow(c, '254,243,199', q.x * s.w, q.y * s.h, 1.8, 0.2 + 0.25 * Math.sin(t * 1.7 + q.p)); });
        Ln.forEach(function (l) {
          l.y -= dt * (0.012 + 0.02 * l.z); if (l.y < -0.15) { l.y = 1.12; l.x = Math.random(); }
          var x = l.x * s.w + Math.sin(t * 0.5 + l.ph) * 16 * l.z, y = l.y * s.h, w = 15 * l.z, h = 21 * l.z, fl = 0.8 + 0.2 * Math.sin(t * 7 + l.ph), a = 0.2 + 0.32 * l.z;
          c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,146,60', x, y, w * 3.2, 0.3 * fl * a);
          c.globalCompositeOperation = 'source-over'; var g = c.createLinearGradient(0, y - h, 0, y + h); g.addColorStop(0, 'rgba(253,186,116,' + a * 0.75 + ')'); g.addColorStop(1, 'rgba(254,240,138,' + a * fl + ')'); c.fillStyle = g;
          c.beginPath(); c.moveTo(x - w * 0.75, y - h); c.quadraticCurveTo(x, y - h * 1.25, x + w * 0.75, y - h); c.lineTo(x + w, y + h * 0.6); c.lineTo(x + w * 0.6, y + h); c.lineTo(x - w * 0.6, y + h); c.lineTo(x - w, y + h * 0.6); c.closePath(); c.fill();
          c.globalCompositeOperation = 'lighter'; fxGlow(c, '255,251,235', x, y + h * 0.7, w * 0.8, 0.7 * fl * a);
        });
      };
    }
  };
  /* ---------- scene effects: a short staged sequence around the right answer ---------- */
  FX_DUR.spotlight = 1.5; FX_DUR.constellation = 2.1; FX_DUR.curtain = 2.7; FX_DUR.liftoff = 2.9; FX_DUR.hightide = 2.9; FX_DUR.epiphany = 3.7; FX_DUR.dragonflight = 3.3;
  FX_DRAW.spotlight = function (s, k) {
    var M = [], i; for (i = 0; i < 18; i++) { M.push({ u: Math.random(), v: Math.random(), p: fxR(0, 6) }); }
    return function (t) {
      var c = s.ctx, e = fxEnv(t, 0, 0.2, 1.1, 1.5), tx = k.cx + Math.exp(-t * 3) * Math.cos(t * 9) * 120, sx = s.w * 0.5 + (k.cx - s.w * 0.5) * 0.3;
      fxDim(c, s, k, 0.45 * e, '#05050A'); c.globalCompositeOperation = 'lighter';
      var g = c.createLinearGradient(0, 0, 0, k.cy); g.addColorStop(0, 'rgba(255,244,214,' + 0.5 * e + ')'); g.addColorStop(1, 'rgba(255,244,214,' + 0.12 * e + ')'); c.fillStyle = g;
      c.beginPath(); c.moveTo(sx - 10, -10); c.lineTo(sx + 10, -10); c.lineTo(tx + k.w * 0.55, k.cy); c.lineTo(tx - k.w * 0.55, k.cy); c.fill();
      c.globalAlpha = 0.3 * e; c.fillStyle = '#FFF4D6'; c.beginPath(); c.ellipse(tx, k.cy + k.h * 0.5, k.w * 0.6, k.h * 0.5 + 8, 0, 0, FX_TAU); c.fill(); c.globalAlpha = 1;
      M.forEach(function (m) { var y = m.v * k.cy, f = y / Math.max(1, k.cy), w = 10 + (k.w * 0.55 - 10) * f; fxGlow(c, '255,244,214', sx + (tx - sx) * f + (m.u - 0.5) * 2 * w + Math.sin(t * 2 + m.p) * 4, y, 2.2, e * (0.4 + 0.4 * Math.sin(t * 3 + m.p))); });
      fxCardGlow(c, k, '253,224,71', 0.7 * e);
    };
  };
  FX_DRAW.constellation = function (s, k) {
    var Z = Math.max(0.8, Math.min(1.4, k.w / 260)), up = k.y - 70 * Z > 40, oy = up ? k.y - 44 * Z : k.y + k.h + 44 * Z, PT = [[-46, 2], [-30, 16], [-14, 30], [6, 10], [26, -14], [46, -36]], ST = [], i;
    for (i = 0; i < 16; i++) { ST.push({ x: k.cx + fxR(-k.w * 0.6, k.w * 0.6), y: oy + fxR(-70, 70), p: fxR(0, 6), z: fxR(1.5, 3) }); }
    return function (t) {
      var c = s.ctx, e = fxEnv(t, 0, 0.25, 1.6, 2.1), g = Math.min(1, Math.max(0, (t - 0.5) / 0.8)) * 5, D = FX_INK.dark, j;
      fxDim(c, s, k, 0.55 * e, '#060818'); c.globalCompositeOperation = 'lighter';
      ST.forEach(function (q) { fxGlow(c, '199,210,254', q.x, q.y, q.z * 2, e * (0.3 + 0.4 * Math.sin(t * 4 + q.p))); });
      c.strokeStyle = 'rgba(253,230,138,' + 0.85 * e + ')'; c.lineWidth = 1.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(k.cx + PT[0][0] * Z, oy + PT[0][1] * Z);
      for (j = 1; j <= Math.ceil(g); j++) { var a = PT[j - 1], b = PT[Math.min(5, j)], u = Math.min(1, g - (j - 1)); c.lineTo(k.cx + (a[0] + (b[0] - a[0]) * u) * Z, oy + (a[1] + (b[1] - a[1]) * u) * Z); }
      c.stroke();
      PT.forEach(function (p, n) { var on = Math.min(1, Math.max(0, (t - 0.1 - n * 0.07) / 0.2)); if (on <= 0) { return; } fxGlow(c, '253,230,138', k.cx + p[0] * Z, oy + p[1] * Z, 10 * Z, 0.6 * e * on); fxStar4(c, k.cx + p[0] * Z, oy + p[1] * Z, (5 + 2 * Math.sin(t * 5 + n)) * Z * on, e, '#FFFBEB'); });
      if (!D) { c.globalCompositeOperation = 'source-over'; }
      fxCardGlow(c, k, '253,230,138', 0.7 * e * Math.min(1, g / 5));
    };
  };
  FX_DRAW.curtain = function (s, k) {
    var R = [], i; for (i = 0; i < 7; i++) { R.push({ x0: k.cx + fxR(-s.w * 0.5, s.w * 0.5), x1: k.x + (i + 0.5) / 7 * k.w, at: 1.15 + i * 0.07, r: fxR(-1, 1) }); }
    return function (t) {
      var c = s.ctx, f = t < 0.5 ? fxEase(t / 0.5) : t < 0.9 ? 1 : t < 1.5 ? 1 - fxEase((t - 0.9) / 0.6) : 0, e = fxEnv(t, 0, 0.15, 2.2, 2.7), W = s.w / 2 * f, n, x;
      if (t > 0.9) { fxDim(c, s, k, 0.5 * e, '#0A0306'); c.globalCompositeOperation = 'lighter'; var g = c.createLinearGradient(0, 0, 0, k.cy); g.addColorStop(0, 'rgba(255,244,214,' + 0.35 * e + ')'); g.addColorStop(1, 'rgba(255,244,214,' + 0.1 * e + ')'); c.fillStyle = g; c.beginPath(); c.moveTo(k.cx - 12, -10); c.lineTo(k.cx + 12, -10); c.lineTo(k.x + k.w + 20, k.cy); c.lineTo(k.x - 20, k.cy); c.fill(); fxCardGlow(c, k, '253,224,71', 0.8 * e); }
      c.globalCompositeOperation = 'source-over';
      R.forEach(function (r) { var u = (t - r.at) / 0.55; if (u <= 0 || t > 2.6) { return; } u = Math.min(1, u); var px = r.x0 + (r.x1 - r.x0) * u, py = s.h + 30 + (k.y + k.h + 14 - s.h - 30) * u - Math.sin(u * Math.PI) * 130; c.save(); c.translate(px, py); c.rotate(r.r + (1 - u) * 4); c.globalAlpha = e; c.strokeStyle = '#15803D'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 2); c.lineTo(0, 20); c.stroke(); c.fillStyle = '#BE123C'; c.beginPath(); c.arc(0, 0, 6, 0, FX_TAU); c.fill(); c.fillStyle = '#FB7185'; c.beginPath(); c.arc(-1.5, -1.5, 2.5, 0, FX_TAU); c.fill(); c.restore(); });
      if (W > 1) { [-1, 1].forEach(function (sd) { var x0 = sd < 0 ? 0 : s.w - W; c.fillStyle = '#7F1D1D'; c.fillRect(x0, 0, W, s.h); for (n = 0; n < 9; n++) { x = x0 + (n + 0.5) / 9 * W; c.fillStyle = n % 2 ? 'rgba(0,0,0,.28)' : 'rgba(255,150,150,.12)'; c.fillRect(x - W / 36, 0, W / 18, s.h); } c.fillStyle = '#FBBF24'; c.fillRect(sd < 0 ? W - 4 : s.w - W, 0, 4, s.h); }); }
      var val = t < 2.2 ? Math.min(1, t / 0.3) : Math.max(0, 1 - (t - 2.2) / 0.4); if (val > 0) { c.globalAlpha = val; c.fillStyle = '#991B1B'; c.fillRect(0, 0, s.w, 26); for (n = 0; n < 9; n++) { c.beginPath(); c.arc((n + 0.5) / 9 * s.w, 26, s.w / 18, 0, Math.PI); c.fill(); } c.fillStyle = '#FBBF24'; c.fillRect(0, 24, s.w, 3); c.globalAlpha = 1; }
    };
  };
  FX_DRAW.liftoff = function (s, k) {
    var Sm = [], St = [], i; for (i = 0; i < 40; i++) { St.push({ x: fxR(0, s.w), y: fxR(0, s.h), z: fxR(0.5, 1.5) }); }
    return function (t, dt) {
      var c = s.ctx, e = fxEnv(t, 0, 0.2, 2.4, 2.9), go = Math.max(0, t - 1.05), y = k.y - 22 - go * go * 560, x = k.cx + (go > 0 ? fxR(-1.5, 1.5) : 0), n = t < 0.35 ? '3' : t < 0.7 ? '2' : t < 1.05 ? '1' : '', j;
      fxDim(c, s, k, 0.7 * e, '#04060F'); c.globalCompositeOperation = 'lighter';
      St.forEach(function (q) { var len = Math.min(120, go * go * 260) * q.z; q.y = (q.y + go * 900 * dt * q.z) % s.h; c.strokeStyle = 'rgba(224,231,255,' + 0.7 * e + ')'; c.lineWidth = q.z; c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q.x, q.y - 2 - len); c.stroke(); });
      if (go > 0 && go < 1.4) { for (j = 0; j < 3; j++) { Sm.push({ x: x + fxR(-8, 8), y: Math.min(k.y, y + 30), vx: fxR(-70, 70), vy: fxR(10, 60), l: 0, m: fxR(0.6, 1.2) }); } }
      for (j = Sm.length - 1; j >= 0; j--) { var p = Sm[j]; p.l += dt; if (p.l > p.m) { Sm.splice(j, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; fxGlow(c, '203,213,225', p.x, p.y, 10 + 26 * p.l / p.m, 0.35 * (1 - p.l / p.m) * e); }
      if (go > 0) { for (j = 0; j < 5; j++) { fxGlow(c, j < 2 ? '255,247,205' : '251,146,60', x + fxR(-3, 3), y + 30 + j * 9, 12 - j, e); } }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = e;
      c.fillStyle = '#7C3AED'; c.beginPath(); c.moveTo(x - 9, y + 12); c.lineTo(x - 17, y + 26); c.lineTo(x - 9, y + 22); c.fill(); c.beginPath(); c.moveTo(x + 9, y + 12); c.lineTo(x + 17, y + 26); c.lineTo(x + 9, y + 22); c.fill();
      c.fillStyle = '#F8FAFC'; c.strokeStyle = '#1E293B'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y - 22); c.quadraticCurveTo(x + 11, y - 8, x + 9, y + 22); c.lineTo(x - 9, y + 22); c.quadraticCurveTo(x - 11, y - 8, x, y - 22); c.fill(); c.stroke();
      c.fillStyle = '#38BDF8'; c.beginPath(); c.arc(x, y - 2, 4.5, 0, FX_TAU); c.fill(); c.stroke(); c.globalAlpha = 1;
      if (n) { var u = (t % 0.35) / 0.35; c.globalAlpha = (1 - u) * e; c.fillStyle = '#FDE68A'; c.font = '800 ' + (46 + u * 30).toFixed(0) + 'px ' + FX_MONO; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n, k.cx, Math.max(60, k.y - 90)); c.textBaseline = 'alphabetic'; c.globalAlpha = 1; }
      c.globalCompositeOperation = 'lighter'; fxCardGlow(c, k, '251,146,60', e * (go > 0 ? 1 : 0.4));
    };
  };
  FX_DRAW.hightide = function (s, k) {
    var B = [], Fi = [], i; for (i = 0; i < 26; i++) { B.push({ x: fxR(0, s.w), u: Math.random(), sp: fxR(0.3, 0.8), r: fxR(1.5, 4) }); } for (i = 0; i < 4; i++) { Fi.push({ y: fxR(0.25, 0.8), sp: fxR(140, 220) * (i % 2 ? 1 : -1), z: fxR(10, 16), ph: fxR(0, 6) }); }
    return function (t) {
      var c = s.ctx, top = Math.max(20, k.y - 60), lvl = t < 1.0 ? s.h - (s.h - top) * fxEase(t) : t < 1.7 ? top : top + (s.h - top) * fxEase((t - 1.7) / 1.1), e = fxEnv(t, 0, 0.2, 2.5, 2.9), x;
      c.globalCompositeOperation = 'source-over'; var g = c.createLinearGradient(0, lvl, 0, s.h); g.addColorStop(0, 'rgba(56,189,248,.5)'); g.addColorStop(1, 'rgba(30,64,175,.62)'); c.fillStyle = g;
      c.beginPath(); c.moveTo(0, s.h); for (x = 0; x <= s.w; x += 10) { c.lineTo(x, lvl + Math.sin(x * 0.03 + t * 5) * 7 + Math.sin(x * 0.011 - t * 3) * 5); } c.lineTo(s.w, s.h); c.fill();
      c.fillStyle = 'rgba(240,249,255,.9)'; for (x = 0; x <= s.w; x += 14) { c.beginPath(); c.arc(x + Math.sin(t * 6 + x) * 3, lvl + Math.sin(x * 0.03 + t * 5) * 7 + Math.sin(x * 0.011 - t * 3) * 5, 2.5 + 1.5 * Math.sin(x + t * 4), 0, FX_TAU); c.fill(); }
      B.forEach(function (b) { var y = s.h - ((b.u + t * b.sp) % 1) * (s.h - lvl); if (y < lvl + 6) { return; } c.strokeStyle = 'rgba(240,249,255,.7)'; c.lineWidth = 1; c.beginPath(); c.arc(b.x + Math.sin(t * 3 + b.u * 9) * 5, y, b.r, 0, FX_TAU); c.stroke(); });
      Fi.forEach(function (f) { var fy = lvl + (s.h - lvl) * f.y, fx = ((t * f.sp + f.ph * 60) % (s.w + 120) + s.w + 120) % (s.w + 120) - 60, d = f.sp > 0 ? 1 : -1; if (fy < lvl + 14 || t > 2.3) { return; } c.save(); c.translate(fx, fy + Math.sin(t * 4 + f.ph) * 4); c.scale(d, 1); c.fillStyle = 'rgba(15,23,42,.55)'; c.beginPath(); c.ellipse(0, 0, f.z, f.z * 0.42, 0, 0, FX_TAU); c.fill(); c.beginPath(); c.moveTo(-f.z * 0.8, 0); c.lineTo(-f.z * 1.5, -f.z * 0.45 + Math.sin(t * 14 + f.ph) * 2); c.lineTo(-f.z * 1.5, f.z * 0.45 + Math.sin(t * 14 + f.ph) * 2); c.fill(); c.restore(); });
      c.globalCompositeOperation = 'lighter'; fxCardGlow(c, k, '103,232,249', 0.9 * e);
    };
  };
  FX_DRAW.epiphany = function (s, k) {
    var W = 'you knew it.', Sh = [], N = [], ST = [[-0.3, 0.16, 0.5], [0, 0.22, 0.72], [0.3, 0.15, 0.44]], i;
    for (i = 0; i < 40; i++) { Sh.push({ x: fxR(0, s.w), u: Math.random(), sp: fxR(0.25, 0.6), z: fxR(3, 7), r: fxR(0, 6) }); } for (i = 0; i < 90; i++) { N.push([fxR(0, 1), fxR(0, 1)]); }
    return function (t, dt) {
      var c = s.ctx, e = fxEnv(t, 0, 0.3, 3.2, 3.7), inv = t > 2.0 && t < 2.35, fg = inv ? '10,10,14' : '255,255,255', rise = fxEase(Math.min(1, Math.max(0, (t - 0.8) / 1.0))), ty = Math.max(50, k.y - 46), n = Math.max(0, Math.min(W.length, Math.floor((t - 0.4) / 0.085)));
      fxDim(c, s, k, 0.96 * e, inv ? '#F4F4F5' : '#030305'); c.globalCompositeOperation = 'source-over';
      if (!inv) { c.fillStyle = 'rgba(255,255,255,.25)'; N.forEach(function (p, m) { c.fillRect(((p[0] + Math.floor(t * 14) * 0.37 + m * 0.11) % 1) * s.w, ((p[1] + Math.floor(t * 14) * 0.53) % 1) * s.h, 1.5, 1.5); }); }
      ST.forEach(function (q) { var X = k.cx + q[0] * s.w, w = q[1] * s.w, h = q[2] * s.h * rise, by = s.h + 4, top = by - h; if (h < 4) { return; } c.fillStyle = inv ? '#0A0A10' : '#0B0B12'; c.strokeStyle = 'rgba(' + fg + ',' + 0.7 * e + ')'; c.lineWidth = 1.5; c.lineJoin = 'round'; c.beginPath(); c.moveTo(X - w / 2, by); c.lineTo(X - w / 2 + 6, top + h * 0.1); c.lineTo(X - w * 0.1, top); c.lineTo(X + w * 0.3, top + h * 0.07); c.lineTo(X + w / 2, top + h * 0.2); c.lineTo(X + w / 2, by); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(X - w * 0.1, top + 8); c.lineTo(X + 6, top + h * 0.35); c.lineTo(X - 10, top + h * 0.6); c.stroke(); });
      if (n > 0 && t < 3.3) { c.globalAlpha = e; c.fillStyle = 'rgb(' + fg + ')'; c.font = '600 ' + Math.max(15, Math.min(22, s.w * 0.05)) + 'px ' + FX_MONO; c.textAlign = 'center'; c.fillText(W.slice(0, n) + (n < W.length && Math.floor(t * 6) % 2 ? '_' : ''), k.cx, ty); c.globalAlpha = 1; }
      if (t > 2.0) { Sh.forEach(function (p) { p.u = (p.u + dt * p.sp) % 1; c.save(); c.translate(p.x + Math.sin(t + p.r) * 6, s.h - p.u * s.h); c.rotate(t * 1.5 + p.r); c.globalAlpha = Math.sin(p.u * Math.PI) * 0.9 * e; c.fillStyle = 'rgb(' + fg + ')'; c.beginPath(); c.moveTo(0, -p.z); c.lineTo(p.z * 0.5, 0); c.lineTo(0, p.z); c.lineTo(-p.z * 0.5, 0); c.fill(); c.restore(); }); }
      c.globalCompositeOperation = 'lighter';
      if (t > 2.35) { var v = (t - 2.35) / 1.2; fxRing(c, k.cx, k.cy, 20 + v * s.w * 0.7, 10 + v * s.h * 0.4, '255,255,255', Math.max(0, 1 - v) * 0.8, 3); fxRainbow(c, k, t, Math.max(0, 1 - v * 0.8) * e); } else { fxCardGlow(c, k, '255,255,255', 0.6 * e); }
    };
  };
  FX_DRAW.dragonflight = function (s, k) {
    var Em = [], Fl = [], N = 46;
    return function (t, dt) {
      var c = s.ctx, e = fxEnv(t, 0, 0.3, 2.8, 3.3), L = Math.max(s.w * 1.1, 520), hx = -80 + (t / 2.5) * (s.w + L + 160), by = Math.max(110, Math.min(s.h - 160, k.cy - 150)), S = [], i, Z = Math.max(1, s.w / 420);
      fxDim(c, s, k, 0.8 * e, '#0A0403');
      for (i = 0; i < N; i++) { var u = i / N; S.push({ x: hx - u * L, y: by + Math.sin(u * 5 - t * 3.2) * 34 * Z * (0.3 + u), r: (5 + 22 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.6)), 0.8) * (1 - u * 0.5)) * Z }); }
      c.lineCap = 'round'; c.globalCompositeOperation = 'source-over';
      /* wings: two membranes from the shoulders, beating */
      var sh = S[9], fl = Math.sin(t * 7), wl = 150 * Z;
      [1, -1].forEach(function (sd) { var tipx = sh.x - 40 * Z, tipy = sh.y - sd * wl * (0.55 + 0.45 * fl) * (sd > 0 ? 1 : 0.8); c.fillStyle = 'rgba(69,10,10,' + 0.92 * e + ')'; c.strokeStyle = 'rgba(249,115,22,' + 0.8 * e + ')'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(sh.x + 20 * Z, sh.y); c.quadraticCurveTo(sh.x + 10 * Z, (sh.y + tipy) / 2, tipx, tipy); c.quadraticCurveTo(tipx - 30 * Z, tipy + sd * wl * 0.35, tipx - 70 * Z, tipy + sd * wl * 0.3); c.quadraticCurveTo(tipx - 60 * Z, tipy + sd * wl * 0.55, tipx - 120 * Z, tipy + sd * wl * 0.62); c.quadraticCurveTo(sh.x - 110 * Z, sh.y - sd * 10, sh.x - 90 * Z, sh.y); c.closePath(); c.fill(); c.stroke(); });
      for (i = N - 2; i >= 0; i--) { var q = S[i], q2 = S[i + 1]; c.strokeStyle = 'rgba(69,10,10,' + e + ')'; c.lineWidth = q.r * 2; c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q2.x, q2.y); c.stroke(); c.strokeStyle = 'rgba(251,146,60,' + 0.75 * e + ')'; c.lineWidth = Math.max(1, q.r * 0.3); c.beginPath(); c.moveTo(q.x, q.y + q.r * 0.6); c.lineTo(q2.x, q2.y + q2.r * 0.6); c.stroke(); if (i % 3 === 0 && i > 3) { c.fillStyle = 'rgba(253,186,116,' + 0.9 * e + ')'; c.beginPath(); c.moveTo(q.x - q.r * 0.5, q.y - q.r * 0.8); c.lineTo(q.x - q.r * 0.3, q.y - q.r * 1.9); c.lineTo(q.x + q.r * 0.5, q.y - q.r * 0.8); c.fill(); } }
      var h = S[0], hz = 16 * Z; c.fillStyle = 'rgba(69,10,10,' + e + ')'; c.strokeStyle = 'rgba(251,146,60,' + 0.9 * e + ')'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(h.x + hz * 2.2, h.y + hz * 0.3); c.quadraticCurveTo(h.x + hz, h.y - hz, h.x - hz, h.y - hz * 0.9); c.lineTo(h.x - hz * 2, h.y - hz * 2); c.lineTo(h.x - hz * 0.8, h.y - hz * 0.2); c.lineTo(h.x - hz, h.y + hz * 0.9); c.quadraticCurveTo(h.x + hz, h.y + hz, h.x + hz * 2.2, h.y + hz * 0.3); c.fill(); c.stroke();
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', h.x + hz * 0.6, h.y - hz * 0.2, hz * 0.5, e);
      /* fire, while the head is over the page */
      if (h.x > s.w * 0.15 && h.x < s.w * 1.05 && t < 2.6) { for (i = 0; i < 6; i++) { var a = Math.atan2(k.cy - h.y, k.cx - (h.x + hz * 2)) + fxR(-0.22, 0.22), v = fxR(380, 620); Fl.push({ x: h.x + hz * 2, y: h.y + hz * 0.3, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0, m: fxR(0.3, 0.55) }); } }
      for (i = Fl.length - 1; i >= 0; i--) { var p = Fl[i]; p.l += dt; if (p.l > p.m) { if (Math.random() < 0.25) { Em.push({ x: p.x, y: p.y, vx: fxR(-60, 60), vy: fxR(-120, -20), l: 0, m: fxR(0.5, 1.1) }); } Fl.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; var u2 = p.l / p.m; fxGlow(c, u2 < 0.3 ? '255,247,205' : u2 < 0.65 ? '251,146,60' : '239,68,68', p.x, p.y, 10 + 26 * u2, (1 - u2) * e); }
      for (i = Em.length - 1; i >= 0; i--) { var m = Em[i]; m.l += dt; if (m.l > m.m) { Em.splice(i, 1); continue; } m.vy += 200 * dt; m.x += m.vx * dt; m.y += m.vy * dt; fxGlow(c, '253,186,116', m.x, m.y, 4, (1 - m.l / m.m) * e); }
      if (Em.length > 240) { Em.splice(0, Em.length - 240); }
      fxCardGlow(c, k, '251,146,60', e * Math.min(1, Fl.length / 20 + (t > 1.4 ? 0.7 : 0)));
    };
  };
  /* ---------- scene backgrounds and the two scene themes ---------- */
  function fxRnd(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  FX_PAPER.planes = function (s) {
    var Pl = [], i; for (i = 0; i < 4; i++) { Pl.push({ y: 0.15 + i * 0.22, sp: fxR(28, 50) * (i % 2 ? -1 : 1), ph: fxR(0, 6), off: fxR(0, 1) }); }
    return function (t) {
      var c = s.ctx, D = FX_INK.dark, col = D ? '226,232,240' : '71,85,105', W = s.w + 240;
      Pl.forEach(function (p) {
        var d = p.sp > 0 ? 1 : -1, x = (((t * p.sp + p.off * W) % W) + W) % W - 120, y = p.y * s.h + Math.sin(x * 0.012 + p.ph) * 34, ang = Math.atan2(Math.cos(x * 0.012 + p.ph) * 34 * 0.012 * d, 1) * d, j;
        c.strokeStyle = 'rgba(' + col + ',' + (D ? 0.3 : 0.28) + ')'; c.lineWidth = 1.2; c.setLineDash([3, 6]); c.beginPath(); for (j = 0; j <= 16; j++) { var tx = x - d * j * 11, ty = p.y * s.h + Math.sin(tx * 0.012 + p.ph) * 34; if (j) { c.lineTo(tx, ty); } else { c.moveTo(tx, ty); } } c.stroke(); c.setLineDash([]);
        c.save(); c.translate(x, y); c.scale(d, 1); c.rotate(ang); c.fillStyle = 'rgba(' + col + ',' + (D ? 0.75 : 0.5) + ')'; c.beginPath(); c.moveTo(16, 0); c.lineTo(-12, -8); c.lineTo(-6, 0); c.lineTo(-12, 7); c.closePath(); c.fill(); c.fillStyle = 'rgba(' + col + ',' + (D ? 0.4 : 0.3) + ')'; c.beginPath(); c.moveTo(16, 0); c.lineTo(-6, 0); c.lineTo(-9, 9); c.closePath(); c.fill(); c.restore();
      });
    };
  };
  FX_PAPER.rain = function (s) {
    var Dr = [], Bk = [], i; for (i = 0; i < 46; i++) { Dr.push({ x: Math.random(), y: Math.random(), r: fxR(1.5, 3.6), run: 0, wait: fxR(0, 9), len: 0 }); }
    for (i = 0; i < 9; i++) { Bk.push({ x: Math.random(), y: fxR(0.1, 0.9), r: fxR(30, 70), rgb: ['251,191,36', '244,114,182', '96,165,250', '52,211,153', '248,113,113'][i % 5], ph: fxR(0, 6) }); }
    return function (t, dt) {
      var c = s.ctx, D = FX_INK.dark, col = D ? '191,219,254' : '30,64,175';
      if (D) { c.globalCompositeOperation = 'lighter'; }
      Bk.forEach(function (b) { fxGlow(c, b.rgb, (b.x + Math.sin(t * 0.07 + b.ph) * 0.03) * s.w, b.y * s.h, b.r * (1 + 0.1 * Math.sin(t * 0.6 + b.ph)), D ? 0.2 : 0.14); });
      c.globalCompositeOperation = 'source-over'; c.lineCap = 'round';
      Dr.forEach(function (d) {
        d.wait -= dt; if (d.wait < 0 && !d.run) { d.run = fxR(60, 150); }
        if (d.run) { d.y += d.run * dt / s.h; d.len = Math.min(70, d.len + d.run * dt); if (d.y > 1.05) { d.y = fxR(-0.1, 0.3); d.x = Math.random(); d.run = 0; d.len = 0; d.wait = fxR(2, 10); } }
        var x = d.x * s.w + (d.run ? Math.sin(d.y * 30) * 2 : 0), y = d.y * s.h;
        if (d.len > 2) { var g = c.createLinearGradient(x, y - d.len, x, y); g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(1, 'rgba(' + col + ',' + (D ? 0.45 : 0.3) + ')'); c.strokeStyle = g; c.lineWidth = d.r * 0.9; c.beginPath(); c.moveTo(x, y - d.len); c.lineTo(x, y); c.stroke(); }
        c.fillStyle = 'rgba(' + col + ',' + (D ? 0.5 : 0.32) + ')'; c.beginPath(); c.ellipse(x, y, d.r, d.r * 1.25, 0, 0, FX_TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,' + (D ? 0.6 : 0.5) + ')'; c.beginPath(); c.arc(x - d.r * 0.3, y - d.r * 0.4, d.r * 0.3, 0, FX_TAU); c.fill();
      });
    };
  };
  FX_PAPER.gears = function (s) {
    var G = [[0.1, 0.2, 0.2, 14], [0.33, 0.33, 0.1, 8], [0.92, 0.16, 0.24, 16], [0.84, 0.62, 0.16, 12], [0.08, 0.8, 0.26, 18], [0.5, 0.95, 0.13, 10]];
    return function (t) {
      var c = s.ctx, D = FX_INK.dark, m = Math.min(s.w, s.h), col = D ? '253,224,71' : '120,83,12', a = D ? 0.22 : 0.2, pa = Math.sin(t * 1.6) * 0.5, px = s.w * 0.62, pl = s.h * 0.34;
      c.strokeStyle = 'rgba(' + col + ',' + a + ')'; c.fillStyle = 'rgba(' + col + ',' + a * 0.35 + ')'; c.lineJoin = 'round';
      G.forEach(function (g, n) {
        var x = g[0] * s.w, y = g[1] * s.h, R = g[2] * m, T = g[3], rot = t * 0.5 * (14 / T) * (n % 2 ? -1 : 1), k;
        c.lineWidth = 1.6; c.beginPath(); for (k = 0; k <= T * 4; k++) { var an = k / (T * 4) * FX_TAU + rot, r = (k % 4 < 2) ? R : R * 0.86; if (k) { c.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r); } else { c.moveTo(x + Math.cos(an) * r, y + Math.sin(an) * r); } } c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.arc(x, y, R * 0.62, 0, FX_TAU); c.stroke(); c.beginPath(); c.arc(x, y, R * 0.16, 0, FX_TAU); c.stroke();
        for (k = 0; k < 5; k++) { var sa = k / 5 * FX_TAU + rot; c.beginPath(); c.moveTo(x + Math.cos(sa) * R * 0.16, y + Math.sin(sa) * R * 0.16); c.lineTo(x + Math.cos(sa) * R * 0.62, y + Math.sin(sa) * R * 0.62); c.stroke(); }
      });
      c.lineWidth = 2; c.beginPath(); c.moveTo(px, -10); c.lineTo(px + Math.sin(pa) * pl, Math.cos(pa) * pl); c.stroke(); c.beginPath(); c.arc(px + Math.sin(pa) * pl, Math.cos(pa) * pl, m * 0.035, 0, FX_TAU); c.fill(); c.stroke();
    };
  };
  FX_PAPER['orbit-view'] = function (s) {
    var St = [], Sa = [], i; for (i = 0; i < 90; i++) { St.push({ x: Math.random(), y: Math.random() * 0.85, p: fxR(0, 6), z: fxR(0.6, 1.6) }); } for (i = 0; i < 2; i++) { Sa.push({ sp: fxR(0.05, 0.09) * (i ? -1 : 1), off: fxR(0, 1), h: fxR(0.25, 0.5) }); }
    return function (t) {
      var c = s.ctx, D = FX_INK.dark, R = s.w * 1.5, cx = s.w * 0.5, cy = s.h + R * 0.86, k = D ? 1 : 0.45, rx = s.w * 0.8, ry = s.h * 0.2, pr = Math.min(s.w, s.h) * 0.09;
      if (D) { c.globalCompositeOperation = 'lighter'; St.forEach(function (q) { fxGlow(c, '226,232,255', q.x * s.w, q.y * s.h, 1.6 * q.z, 0.3 + 0.3 * Math.sin(t * 1.8 + q.p)); }); }
      /* the ringed world */
      c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'rgba(253,186,116,' + 0.45 * k + ')'; c.lineWidth = 2; c.beginPath(); c.ellipse(rx, ry, pr * 1.9, pr * 0.5, -0.35, Math.PI * 0.03, Math.PI * 0.97); c.stroke();
      var pg = c.createRadialGradient(rx - pr * 0.3, ry - pr * 0.3, 1, rx, ry, pr); pg.addColorStop(0, 'rgba(253,186,116,' + 0.8 * k + ')'); pg.addColorStop(1, 'rgba(154,52,18,' + 0.7 * k + ')'); c.fillStyle = pg; c.beginPath(); c.arc(rx, ry, pr, 0, FX_TAU); c.fill();
      c.beginPath(); c.ellipse(rx, ry, pr * 1.9, pr * 0.5, -0.35, Math.PI * 1.03, Math.PI * 1.97); c.stroke();
      /* the horizon: a dark limb with a thin bright atmosphere and a sunrise that drifts along it */
      var hg = c.createRadialGradient(cx, cy, R, cx, cy, R + 60); hg.addColorStop(0, 'rgba(56,189,248,' + 0.55 * k + ')'); hg.addColorStop(0.25, 'rgba(59,130,246,' + 0.22 * k + ')'); hg.addColorStop(1, 'rgba(59,130,246,0)'); c.fillStyle = hg; c.beginPath(); c.arc(cx, cy, R + 60, 0, FX_TAU); c.fill();
      c.fillStyle = D ? 'rgba(3,7,18,.92)' : 'rgba(30,58,138,.16)'; c.beginPath(); c.arc(cx, cy, R, 0, FX_TAU); c.fill(); c.strokeStyle = 'rgba(186,230,253,' + 0.8 * k + ')'; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, R, 0, FX_TAU); c.stroke();
      if (D) { c.globalCompositeOperation = 'lighter'; var sa = -Math.PI / 2 + Math.sin(t * 0.08) * 0.12; fxGlow(c, '255,247,237', cx + Math.cos(sa) * R, cy + Math.sin(sa) * R, 46, 0.8); fxGlow(c, '56,189,248', cx + Math.cos(sa) * R, cy + Math.sin(sa) * R, 130, 0.3);
        for (var j = 0; j < 40; j++) { var la = -Math.PI / 2 + (fxRnd(j) - 0.5) * 0.5, lr = R - 8 - fxRnd(j + 50) * 60; fxGlow(c, '253,224,71', cx + Math.cos(la) * lr, cy + Math.sin(la) * lr, 1.6, 0.45 * (0.5 + 0.5 * Math.sin(t + j))); } }
      Sa.forEach(function (q) { var u = ((t * q.sp + q.off) % 1 + 1) % 1, x = u * (s.w + 80) - 40, y = s.h * q.h - Math.sin(u * Math.PI) * s.h * 0.12; if (D) { fxGlow(c, '255,255,255', x, y, 3, 0.9); if (Math.floor(t * 2) % 2) { fxGlow(c, '248,113,113', x + 4, y, 4, 0.9); } } else { c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(30,58,138,.5)'; c.fillRect(x - 2, y - 1, 5, 2); } });
    };
  };
  FX_LIVING['prize-metropolis'] = function (s) {
    var B = [], W0 = 0;
    function build() { B = []; W0 = s.w; var x = -10, n = 0; while (x < s.w + 10) { var w = 26 + fxRnd(n * 3 + 1) * 40; B.push({ x: x, w: w, h: (0.1 + fxRnd(n * 3 + 2) * 0.22) * s.h, far: n % 3 === 0, ant: fxRnd(n * 3 + 3) > 0.7, n: n }); x += w + 2; n++; } }
    return function (t) {
      if (s.w !== W0) { build(); }
      var c = s.ctx, mx = s.w * 0.78, my = Math.min(210, s.h * 0.28), px = ((t * 26) % (s.w + 200)) - 100;
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '254,243,199', mx, my, 26, 0.85); fxGlow(c, '148,163,216', mx, my, 110, 0.18); fxGlow(c, '251,191,36', s.w / 2, s.h + 30, s.w * 0.8, 0.14);
      fxGlow(c, '255,255,255', px, s.h * 0.2 - px * 0.03, 2.5, 0.9); if (Math.floor(t * 1.5) % 2) { fxGlow(c, '248,113,113', px - 6, s.h * 0.2 - px * 0.03 + 1, 4, 0.9); }
      c.globalCompositeOperation = 'source-over';
      B.forEach(function (b) {
        var top = s.h - b.h * (b.far ? 1.25 : 1); c.fillStyle = b.far ? '#0C1226' : '#0A0F20'; c.fillRect(b.x, top, b.w, s.h - top); c.strokeStyle = 'rgba(148,163,216,.18)'; c.lineWidth = 1; c.strokeRect(b.x + 0.5, top + 0.5, b.w - 1, s.h - top);
        var cols = Math.floor((b.w - 6) / 8), rows = Math.floor((s.h - top - 6) / 11), i, j;
        for (i = 0; i < cols; i++) { for (j = 0; j < rows; j++) { var id = b.n * 977 + i * 31 + j * 7, on = fxRnd(id + Math.floor(t / 5 + fxRnd(id) * 5)) > 0.55; if (on) { c.fillStyle = fxRnd(id + 9) > 0.8 ? 'rgba(125,211,252,.55)' : 'rgba(253,224,71,.55)'; c.fillRect(b.x + 4 + i * 8, top + 5 + j * 11, 4, 6); } } }
        if (b.ant) { c.strokeStyle = 'rgba(148,163,216,.5)'; c.beginPath(); c.moveTo(b.x + b.w / 2, top); c.lineTo(b.x + b.w / 2, top - 16); c.stroke(); if (Math.floor(t + b.n) % 2) { c.fillStyle = '#F87171'; c.beginPath(); c.arc(b.x + b.w / 2, top - 16, 2, 0, FX_TAU); c.fill(); } }
      });
    };
  };
  FX_LIVING['prize-summit'] = function (s) {
    var Bd = [], St = [], i; for (i = 0; i < 5; i++) { Bd.push({ off: fxR(0, 1), y: fxR(0.18, 0.4), sp: fxR(0.02, 0.035), ph: fxR(0, 6) }); } for (i = 0; i < 50; i++) { St.push({ x: Math.random(), y: Math.random() * 0.4, p: fxR(0, 6) }); }
    return function (t) {
      var c = s.ctx, L, x, sx = s.w * 0.66, sy = s.h * 0.56;
      c.globalCompositeOperation = 'lighter'; St.forEach(function (q) { fxGlow(c, '254,226,226', q.x * s.w, q.y * s.h, 1.5, 0.2 + 0.25 * Math.sin(t * 1.7 + q.p)); });
      fxGlow(c, '253,164,175', sx, sy, s.w * 0.7, 0.2 + 0.04 * Math.sin(t * 0.5)); fxGlow(c, '253,186,116', sx, sy, s.w * 0.28, 0.28); fxGlow(c, '255,241,242', sx, sy, 30, 0.7);
      for (L = 0; L < 4; L++) {
        var base = s.h * (0.6 + L * 0.1), amp = s.h * (0.1 - L * 0.012), dr = t * (3 + L * 4);
        c.globalCompositeOperation = 'source-over'; c.fillStyle = ['#2E2550', '#231C3F', '#181330', '#0E0B1C'][L]; c.beginPath(); c.moveTo(0, s.h);
        for (x = 0; x <= s.w + 12; x += 12) { var q = (x + dr) * 0.006 + L * 9; c.lineTo(x, base - (Math.sin(q) * 0.5 + Math.sin(q * 2.3 + L) * 0.3 + Math.abs(Math.sin(q * 5.1 + L * 2)) * 0.25) * amp); }
        c.lineTo(s.w + 12, s.h); c.fill();
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '216,180,254', ((t * (6 + L * 3) + L * s.w / 3) % (s.w + 600)) - 300, base + amp * 0.5, 260, 0.07);
      }
      c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'rgba(255,241,242,.5)'; c.lineWidth = 1.2; c.lineCap = 'round';
      Bd.forEach(function (b) { var u = ((t * b.sp + b.off) % 1), bx = u * (s.w + 60) - 30, byy = b.y * s.h + Math.sin(t * 0.7 + b.ph) * 10, f = Math.sin(t * 8 + b.ph) * 3; c.beginPath(); c.moveTo(bx - 6, byy - 2 + f); c.quadraticCurveTo(bx - 3, byy - 4, bx, byy); c.quadraticCurveTo(bx + 3, byy - 4, bx + 6, byy - 2 + f); c.stroke(); });
    };
  };
  FX_LIVE_THEMES['prize-metropolis'] = 1; FX_LIVE_THEMES['prize-summit'] = 1;
  var FX_BG = null, FX_BGTIMER = 0;
  /* put on (or take off) what the student wears behind the page: a pattern, moving paper, a living theme's background */
  function fxApply() {
    var html = document.documentElement, theme = getTheme(), paperId = pzWorn('paper'), pk = paperId ? PZ_BY[paperId].key : '';
    fxInk(); html.classList.toggle('pz-dark', FX_INK.dark);
    ['lined', 'dots', 'graph', 'bpgrid', 'plot'].forEach(function (k) { html.classList.toggle('pz-p-' + k, pk === k); });
    var want = FX_LIVING[theme] ? 'living:' + theme : FX_PAPER[pk] ? 'paper:' + pk : '';
    if (FX_BG && FX_BG.key !== want) { FX_BG.cv.remove(); FX_BG = null; }
    if (want && !FX_BG) {
      var cv = document.createElement('canvas'); cv.className = 'pz-bg'; cv.setAttribute('aria-hidden', 'true'); document.body.insertBefore(cv, document.body.firstChild);
      FX_BG = { key: want, cv: cv, s: fxScene(cv, FX_LIVING[theme] || FX_PAPER[pk], { fps: 30 }) };
    }
    html.classList.toggle('pz-bg-on', !!want || !!pk);
    clearInterval(FX_BGTIMER);
    if (want || pk) { FX_BGTIMER = setInterval(fxPlain, 700); fxPlain(); } else { html.classList.remove('pz-plain'); }
  }
  /* a timed module is plain, like the real test */
  function fxPlain() {
    var on = !!document.querySelector('.view:not([hidden]) .mmwrap');
    document.documentElement.classList.toggle('pz-plain', on);
    if (FX_BG && FX_BG.s) { FX_BG.s.paused = on; if (!on) { fxKick(); } }
  }
  if ('MutationObserver' in window) { new MutationObserver(function () { fxApply(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }
  try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', fxApply); } catch (e) { /* older browsers */ }

  /* ---------- streak styles beside the number on Home ---------- */
  /* each drawing gets its own gradient id: a copy inside a hidden page would otherwise leave every later copy without its fill */
  var FX_SID = 0;
  function fxStreakIcon(key, n) {
    var w = Math.max(1, Math.floor(n / 7)), x, out = '';
    if (key === 'candle') { return '<svg class="pz-si" viewBox="0 0 48 48" aria-hidden="true"><path class="pz-i-flame" d="M24 4c3.5 4.5 5.5 7.5 5.5 10.5a5.5 5.5 0 0 1-11 0C18.5 11.5 20.5 8.5 24 4z"/><path class="pz-i-wick" d="M24 20.5V16.5"/><rect class="pz-i-wax" x="17" y="20.5" width="14" height="23" rx="2.5"/></svg>'; }
    if (key === 'coffee') { for (x = 0; x < Math.min(4, w); x++) { var o = x * 26; out += '<path class="pz-i-cup" d="M' + (o + 2) + ' 18h16v10a8 8 0 0 1-16 0z"/><path class="pz-i-handle" d="M' + (o + 18) + ' 21h2.5a3.5 3.5 0 0 1 0 7H' + (o + 18) + '"/>'; } return '<svg class="pz-si" viewBox="0 0 ' + (Math.min(4, w) * 26 + 2) + ' 40" aria-hidden="true">' + out + '</svg>'; }
    if (key === 'books') { var cl = ['pz-i-b0', 'pz-i-b1', 'pz-i-b2', 'pz-i-b3']; for (x = 0; x < Math.min(6, w); x++) { var y = 44 - (x + 1) * 7, wd = 30 + (x * 7) % 10; out += '<rect class="' + cl[x % 4] + '" x="' + (9 + (x * 5) % 8) + '" y="' + y + '" width="' + wd + '" height="6.5" rx="1.5"/>'; } return '<svg class="pz-si" viewBox="0 0 56 46" aria-hidden="true">' + out + '</svg>'; }
    if (key === 'rocket') { var lift = Math.min(10, w * 2); return '<svg class="pz-si" viewBox="0 0 48 58" aria-hidden="true"><g transform="translate(0 ' + (10 - lift) + ')"><path class="pz-i-flame" d="M19.5 35h9L24 45z"/><path class="pz-i-fin" d="M15.5 25l-6 8.5v4l6-3zM32.5 25l6 8.5v4l-6-3z"/><path class="pz-i-body" d="M24 3c6.5 6 9 13.5 9 22v10H15V25c0-8.5 2.5-16 9-22z"/><circle class="pz-i-window" cx="24" cy="18" r="4"/></g></svg>'; }
    if (key === 'plant') {
      var soil = '<path class="pz-i-soil" d="M6 43h28"/>';
      if (n < 7) { return '<svg class="pz-si" viewBox="0 0 40 48" aria-hidden="true">' + soil + '<ellipse class="pz-i-seed" cx="20" cy="39.5" rx="4.5" ry="3"/></svg>'; }
      if (n < 30) { return '<svg class="pz-si" viewBox="0 0 40 48" aria-hidden="true">' + soil + '<path class="pz-i-stem" d="M20 42V30"/><path class="pz-i-leaf" d="M20 33c-6 0-9-4-9-8 5 0 9 3 9 8zM20 31c5 0 8-4 8-8-5 0-8 3-8 8z"/></svg>'; }
      if (n < 100) { return '<svg class="pz-si" viewBox="0 0 40 48" aria-hidden="true">' + soil + '<path class="pz-i-stem" d="M20 42V16"/><path class="pz-i-leaf" d="M20 36c-6 0-9-4-9-8 5 0 9 3 9 8zM20 30c6 0 9-4 9-8-5 0-9 3-9 8zM20 24c-5 0-8-3-8-7 4 0 8 3 8 7zM20 19c5 0 7-3 7-7-4 0-7 3-7 7z"/></svg>'; }
      return '<svg class="pz-si" viewBox="0 0 40 48" aria-hidden="true">' + soil + '<path class="pz-i-stem" d="M20 42V17"/><path class="pz-i-leaf" d="M20 37c-6 0-9-4-9-8 5 0 9 3 9 8zM20 31c6 0 9-4 9-8-5 0-9 3-9 8z"/><circle class="pz-i-petal" cx="20" cy="6.5" r="4.2"/><circle class="pz-i-petal" cx="26" cy="11" r="4.2"/><circle class="pz-i-petal" cx="23.5" cy="17.5" r="4.2"/><circle class="pz-i-petal" cx="16.5" cy="17.5" r="4.2"/><circle class="pz-i-petal" cx="14" cy="11" r="4.2"/><circle class="pz-i-core" cx="20" cy="12.5" r="3.6"/></svg>';
    }
    if (key === 'egg') {
      /* whole, then one crack a week, hatched at 30 days, with wings at 100 */
      var shell = 'M22 4C32 4 38 19 38 30C38 41 31 47 22 47C13 47 6 41 6 30C6 19 12 4 22 4Z', spots = '<circle class="pz-i-spot" cx="15" cy="22" r="3"/><circle class="pz-i-spot" cx="28" cy="15" r="2.4"/><circle class="pz-i-spot" cx="30" cy="33" r="3.2"/><circle class="pz-i-spot" cx="16" cy="38" r="2.2"/>';
      if (n < 30) {
        var cr = ['M9 25l4 3 3-3 4 4 3-3', 'M26 9l2 4-2 3 3 3', 'M23 40l3-3 3 2 4-3'].slice(0, Math.min(3, Math.floor(n / 7))).map(function (d) { return '<path class="pz-i-crack" d="' + d + '"/>'; }).join('');
        return '<svg class="pz-si pz-egg' + (n >= 7 ? ' pz-egg-hot' : '') + '" viewBox="0 0 44 50" aria-hidden="true"><path class="pz-i-egg" d="' + shell + '"/>' + spots + cr + '</svg>';
      }
      var base = '<path class="pz-i-egg" d="M6 31l5-4 4 4 4-5 4 5 4-5 4 4 4-4 5 5C38 42 31 48 22 48C13 48 6 42 6 31Z"/><circle class="pz-i-spot" cx="16" cy="39" r="2.2"/><circle class="pz-i-spot" cx="29" cy="36" r="2.6"/>';
      var head = '<path class="pz-i-horn" d="M15 12l-3-7 6 5zM29 12l3-7-6 5z"/><ellipse class="pz-i-drg" cx="22" cy="20" rx="10" ry="8.5"/><ellipse class="pz-i-belly" cx="22" cy="24.5" rx="5.5" ry="3"/><circle class="pz-i-eye" cx="18" cy="18.5" r="1.9"/><circle class="pz-i-eye" cx="26" cy="18.5" r="1.9"/><circle class="pz-i-glint" cx="18.6" cy="17.8" r=".6"/><circle class="pz-i-glint" cx="26.6" cy="17.8" r=".6"/>';
      if (n < 100) { return '<svg class="pz-si pz-egg" viewBox="0 0 44 50" aria-hidden="true">' + head + base + '</svg>'; }
      return '<svg class="pz-si pz-egg pz-egg-wings" viewBox="0 0 64 50" aria-hidden="true"><g class="pz-i-wing"><path class="pz-i-drg" d="M22 22C12 10 4 10 1 16c5 0 8 3 9 7-4-1-7 0-8 3 6-1 11 1 15 4z"/><path class="pz-i-drg" d="M42 22c10-12 18-12 21-6-5 0-8 3-9 7 4-1 7 0 8 3-6-1-11 1-15 4z"/></g><g transform="translate(10 0)">' + head + base + '</g></svg>';
    }
    if (key === 'battery') {
      var bars = Math.min(5, Math.max(1, Math.ceil(n / 7))), out2 = '<rect class="pz-i-bat" x="2" y="4" width="42" height="22" rx="4"/><rect class="pz-i-nub" x="44" y="11" width="5" height="8" rx="1.5"/>';
      for (x = 0; x < 5; x++) { out2 += '<rect class="pz-i-bar' + (x < bars ? ' on' : '') + '" x="' + (6 + x * 7.6) + '" y="8" width="6" height="14" rx="1.5"/>'; }
      return '<svg class="pz-si pz-battery' + (bars === 5 ? ' full' : '') + '" viewBox="0 0 52 30" aria-hidden="true">' + out2 + '<path class="pz-i-bolt" d="M25 6l-7 10h5l-2 8 7-10h-5z"/></svg>';
    }
    if (key === 'pumpkin') {
      var pf = n >= 7 ? '<path class="pz-i-pface" d="M14 22l4-6 4 6zM26 22l4-6 4 6zM22 26l2-3 2 3z"/><path class="pz-i-pface" d="M12 30c4 6 20 6 24 0h-3l-2 3-3-3-3 3-3-3-3 3-2-3z"/>' : '';
      return '<svg class="pz-si pz-pumpkin' + (n >= 30 ? ' lit' : '') + '" viewBox="0 0 48 46" aria-hidden="true"><path class="pz-i-pstem" d="M22 12c0-5 2-8 5-9l1.5 3c-2 1-2.5 3-2.5 6z"/><ellipse class="pz-i-pump" cx="24" cy="27" rx="20" ry="16"/><path class="pz-i-prib" d="M24 11c-7 4-7 28 0 32M24 11c7 4 7 28 0 32M14 14c-6 6-6 20 0 26M34 14c6 6 6 20 0 26"/>' + pf + '</svg>';
    }
    if (key === 'moon') {
      var mp = Math.min(1, n / 30), mrx = 17 * Math.abs(1 - 2 * mp), lit = mp >= 1 ? '<circle class="pz-i-mlit" cx="22" cy="22" r="17"/>' : '<path class="pz-i-mlit" d="M22 5A17 17 0 0 1 22 39A' + mrx.toFixed(2) + ' 17 0 0 ' + (mp < 0.5 ? 0 : 1) + ' 22 5Z"/>';
      return '<svg class="pz-si pz-moon' + (mp >= 1 ? ' full' : '') + '" viewBox="0 0 44 44" aria-hidden="true"><circle class="pz-i-mdark" cx="22" cy="22" r="17"/>' + lit + '<circle class="pz-i-mcr" cx="27" cy="16" r="2.5"/><circle class="pz-i-mcr" cx="25" cy="28" r="3.5"/><circle class="pz-i-mcr" cx="31" cy="23" r="1.6"/></svg>';
    }
    if (key === 'hourglass') {
      var hp = Math.min(1, n / 30), ht = 13 * (1 - hp), hb = 13 * hp;
      return '<svg class="pz-si pz-hourglass' + (hp >= 1 ? ' done' : '') + '" viewBox="0 0 34 46" aria-hidden="true"><path class="pz-i-hsand" d="M' + (17 - ht * 0.85).toFixed(1) + ' ' + (22 - ht).toFixed(1) + 'L' + (17 + ht * 0.85).toFixed(1) + ' ' + (22 - ht).toFixed(1) + 'L17 22Z"/><path class="pz-i-hsand" d="M' + (17 - 11 * Math.min(1, hb / 9 + 0.15)).toFixed(1) + ' 40Q17 ' + (40 - hb * 1.6).toFixed(1) + ' ' + (17 + 11 * Math.min(1, hb / 9 + 0.15)).toFixed(1) + ' 40Z"/><path class="pz-i-hfall" d="M17 22V40"/><path class="pz-i-hglass" d="M6 6h22M6 40h22M8 6c0 9 9 12 9 16s-9 7-9 18M26 6c0 9-9 12-9 16s9 7 9 18"/></svg>';
    }
    if (key === 'crown') {
      var cj = Math.min(5, Math.floor(n / 7)), jw = ['#F43F5E', '#38BDF8', '#A78BFA', '#34D399', '#F472B6'], out3 = '';
      for (x = 0; x < 5; x++) { out3 += '<circle class="pz-i-jewel' + (x < cj ? ' on' : '') + '" cx="' + [8, 17, 26, 35, 44][x] + '" cy="' + [13, 20, 8, 20, 13][x] + '" r="3"' + (x < cj ? ' style="fill:' + jw[x] + '"' : '') + '/>'; }
      return '<svg class="pz-si pz-crown' + (cj >= 5 ? ' full' : '') + '" viewBox="0 0 52 40" aria-hidden="true"><path class="pz-i-crown" d="M5 34L8 13l9 9 9-16 9 16 9-9 3 21z"/><path class="pz-i-cband" d="M5 30h42v5H5z"/>' + out3 + '</svg>';
    }
    if (key === 'tree') { return zTreeIcon(n); }
    if (key === 'comet-tail') {
      var cl = 14 + Math.min(44, n * 1.4), gid = 'pzct' + (++FX_SID);
      return '<svg class="pz-si pz-comet" viewBox="0 0 ' + (cl + 20).toFixed(0) + ' 28" aria-hidden="true"><defs><linearGradient id="' + gid + '"><stop offset="0" stop-color="#38BDF8" stop-opacity="0"/><stop offset="1" stop-color="#E0F2FE"/></linearGradient></defs><path class="pz-i-ctail" fill="url(#' + gid + ')" d="M0 14L' + cl.toFixed(0) + ' 6v16z"/><path class="pz-i-ctail2" fill="url(#' + gid + ')" d="M' + (cl * 0.3).toFixed(0) + ' 4L' + cl.toFixed(0) + ' 9v4z"/><circle class="pz-i-chead" cx="' + (cl + 8).toFixed(0) + '" cy="14" r="8"/></svg>';
    }
    return '';
  }
  /* a small picture of a prize theme, drawn with its own colors */
  function fxThemeMini(key) {
    var p = FX_PAL[key]; if (!p) { return ''; }
    return '<span class="pz-mini' + (FX_LIVE_THEMES[key] ? ' live' : '') + '" style="background:' + p.paper + ';border-color:' + p.line + '" aria-hidden="true">' +
      '<span class="pz-mini-card" style="background:' + p.card + ';border-color:' + p.line + '"><i style="background:' + p.ink + '"></i><i style="background:' + p.ink + ';width:60%"></i><b style="background:' + p.act + '"></b><em style="background:' + p.ok_soft + ';border-color:' + p.ok + '"></em></span></span>';
  }
