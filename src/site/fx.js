  /* =================== Prize looks: auras, right-answer effects, reveals and moving backgrounds =================== */
  /* Every animation draws on a canvas that runs only while it is on screen (backgrounds at 30 frames a second), stops in a
     hidden tab, never runs inside a timed module, and holds one still frame on a device set to reduce motion. */
  var FX_REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var FX_TAU = Math.PI * 2;
  function fxR(a, b) { return a + Math.random() * (b - a); }
  /* the prize themes' colors, for swatches and previews (the same values as src/tools/themes.py) */
  var FX_PAL = {"prize-graphite":{"paper":"#F5F5F2","card":"#FFFFFF","ink":"#1C1C1A","line":"#E2E2DB","act":"#2E2E2B","act_ink":"#FFFFFF","ok":"#15803D","ok_soft":"#DCFCE7"},"prize-sunrise":{"paper":"#FFF6F0","card":"#FFFFFF","ink":"#2E1A10","line":"#F8DDCD","act":"#C2410C","act_ink":"#FFFFFF","ok":"#15803D","ok_soft":"#DCFCE7"},"prize-ocean":{"paper":"#F0FAFA","card":"#FFFFFF","ink":"#0B2626","line":"#D2EBEB","act":"#0F766E","act_ink":"#FFFFFF","ok":"#15803D","ok_soft":"#DCFCE7"},"prize-highlighter":{"paper":"#FFFDF2","card":"#FFFFFF","ink":"#1A1A12","line":"#F1EBC8","act":"#FACC15","act_ink":"#1A1A12","ok":"#15803D","ok_soft":"#DCFCE7"},"prize-library":{"paper":"#FBF7EF","card":"#FFFDF8","ink":"#2A1D17","line":"#E9DFCF","act":"#7A1F2B","act_ink":"#FFFFFF","ok":"#15803D","ok_soft":"#DCFCE7"},"prize-varsity":{"paper":"#F5F6FA","card":"#FFFFFF","ink":"#141A33","line":"#DFE2EC","act":"#1E2A5A","act_ink":"#FFFFFF","ok":"#15803D","ok_soft":"#DCFCE7"},"prize-chalkboard":{"paper":"#1E2B24","card":"#26352D","ink":"#F1F5EE","line":"#34473C","act":"#F1F5EE","act_ink":"#1E2B24","ok":"#4ADE80","ok_soft":"#12301F"},"prize-blueprint":{"paper":"#0E2A52","card":"#133566","ink":"#F0F6FF","line":"#23497F","act":"#F0F6FF","act_ink":"#0E2A52","ok":"#4ADE80","ok_soft":"#12301F"},"prize-lamplight":{"paper":"#0F1424","card":"#171D33","ink":"#F5F1E8","line":"#262E4A","act":"#FBBF24","act_ink":"#1A1405","ok":"#4ADE80","ok_soft":"#12301F"},"prize-arcade":{"paper":"#0D0A1A","card":"#171230","ink":"#F8F5FF","line":"#2A2150","act":"#F472B6","act_ink":"#14051A","ok":"#4ADE80","ok_soft":"#12301F"},"prize-aurora":{"paper":"#071A1F","card":"#0D252C","ink":"#EFFBF8","line":"#18363E","act":"#5EEAD4","act_ink":"#04201C","ok":"#4ADE80","ok_soft":"#12301F"},"prize-gold":{"paper":"#0A0907","card":"#15130E","ink":"#FBF6E9","line":"#2A2619","act":"#E0B54A","act_ink":"#1A1405","ok":"#4ADE80","ok_soft":"#12301F"},"prize-holo":{"paper":"#F7F6FD","card":"#FFFFFF","ink":"#16142B","line":"#E4E1F5","act":"#1E1B4B","act_ink":"#FFFFFF","ok":"#15803D","ok_soft":"#DCFCE7"},"prize-nebula":{"paper":"#0B0820","card":"#15112E","ink":"#F5F3FF","line":"#2A2352","act":"#E879F9","act_ink":"#1A0526","ok":"#4ADE80","ok_soft":"#12301F"},"prize-synthwave":{"paper":"#120A26","card":"#1C1238","ink":"#FFF5FB","line":"#33215E","act":"#F472B6","act_ink":"#1A0512","ok":"#4ADE80","ok_soft":"#12301F"},"prize-inferno":{"paper":"#120806","card":"#1E0F0A","ink":"#FFF4EC","line":"#3A1E14","act":"#F97316","act_ink":"#1C0A02","ok":"#4ADE80","ok_soft":"#12301F"}};
  var FX_LIVE_THEMES = { 'prize-synthwave': 1, 'prize-inferno': 1, 'prize-nebula': 1, 'prize-holo': 1 };
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
    }
  };
  /* an aura canvas starts as soon as it is on the page (Home, the Crates page) */
  function fxScan() { $$('canvas[data-pz-aura]').forEach(function (cv) { if (cv.getAttribute('data-fx-on')) { return; } var a = FX_AURA[cv.getAttribute('data-pz-aura')]; if (a) { cv.setAttribute('data-fx-on', '1'); fxScene(cv, a); } }); }
  var fxScanQ = 0;
  if ('MutationObserver' in window) { new MutationObserver(function () { if (!fxScanQ) { fxScanQ = requestAnimationFrame(function () { fxScanQ = 0; fxScan(); }); } }).observe(document.body, { childList: true, subtree: true }); }

  /* ---------- right-answer effects ---------- */
  var FX_DUR = { sparkle: 1.1, confetti: 1.7, fireworks: 1.6, lightning: 1.5, storm: 1.9, golden: 2.3, comet: 1.95, supernova: 3.1 };
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
    if (FX_DRAW[key]) { fxOverlay(el, FX_DUR[key], FX_DRAW[key]); }
  }

  /* ---------- reveals that grow with rarity (the Crates page) ---------- */
  var FX_RV = { c: { dur: 0.9, show: 0.1 }, r: { dur: 1.4, show: 0.45 }, e: { dur: 2.1, show: 0.95 }, l: { dur: 3.0, show: 1.8 }, m: { dur: 4.2, show: 2.75 } };
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
    m: function (s, cfg, odds) {
      var x = s.w / 2, y = s.h / 2, stars = [], P = fxBurst(x, y, 170, ['255,255,255', '240,171,252', '103,232,249', '253,224,71'], 120, 520), txt = odds || '';
      for (var i = 0; i < 70; i++) { stars.push({ x: fxR(0, s.w), y: fxR(0, s.h), p: fxR(0, FX_TAU), z: fxR(0.6, 1.8) }); }
      return function (t, dt) {
        var c = s.ctx, k = fxEnv(t, 0, 0.4, cfg.dur + 0.5, cfg.dur + 1.2);
        c.globalAlpha = k; c.fillStyle = '#020108'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; c.globalCompositeOperation = 'lighter';
        var sf = fxEase((t - 0.2) / 0.7) * k;
        stars.forEach(function (q) { var tw = 0.5 + 0.5 * Math.sin(t * 4 + q.p); fxGlow(c, '226,232,255', q.x, q.y, 2.2 * q.z + 1.5 * tw, sf * (0.4 + 0.6 * tw)); });
        [1.0, 1.4].forEach(function (b) { var v = (t - b) / 0.35; if (v > 0 && v < 1) { var a = Math.sin(v * Math.PI); fxGlow(c, '217,70,239', x, y, 80 + 120 * v, 0.55 * a); fxRing(c, x, y, 30 + 150 * v, 12 + 55 * v, '240,171,252', a * 0.8, 2); } });
        var ab = fxEase((t - 0.6) / 1.4) * k;
        if (ab > 0) { for (var r = 0; r < 3; r++) { c.lineWidth = 18; c.strokeStyle = 'hsla(' + ((r * 70 + t * 60) % 360) + ',100%,65%,' + (0.12 * ab) + ')'; c.beginPath(); for (var xx = 0; xx <= s.w; xx += 8) { var yy = y + Math.sin(xx * 0.018 + t * 1.6 + r * 2) * 26 + (r - 1) * 28; if (xx) { c.lineTo(xx, yy); } else { c.moveTo(xx, yy); } } c.stroke(); } }
        var tu = t - 1.75;
        if (txt && tu > 0 && t < cfg.show + 0.05) {
          var sc = tu < 0.18 ? 2.6 - 1.6 * fxEase(tu / 0.18) : 1;
          c.save(); c.globalCompositeOperation = 'source-over'; c.translate(x + (tu < 0.4 ? fxR(-3, 3) : 0), y + (tu < 0.4 ? fxR(-2, 2) : 0)); c.scale(sc, sc);
          c.font = '800 32px "DM Sans", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          var g = c.createLinearGradient(-95, 0, 95, 0); for (var gi = 0; gi <= 5; gi++) { g.addColorStop(gi / 5, 'hsl(' + ((gi * 60 + t * 240) % 360) + ',100%,72%)'); }
          c.fillStyle = g; c.globalAlpha = Math.min(1, tu / 0.1) * (t > cfg.show - 0.1 ? Math.max(0, 1 - (t - cfg.show + 0.1) / 0.15) : 1); c.fillText(txt, 0, 0); c.restore(); c.globalCompositeOperation = 'lighter';
        }
        var u = t - cfg.show + 0.08;
        if (u > 0) {
          if (u < 0.3) { c.globalAlpha = 1 - u / 0.3; c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; }
          for (var ri = 0; ri < 3; ri++) { var v2 = (u - ri * 0.14) / 1.0; if (v2 > 0 && v2 < 1) { c.globalAlpha = 1 - v2; c.lineWidth = 3.5 * (1 - v2) + 0.6; c.strokeStyle = 'hsl(' + ((ri * 110 + t * 200) % 360) + ',100%,70%)'; c.beginPath(); c.ellipse(x, y, 20 + v2 * s.w * 0.8, 8 + v2 * s.h * 0.9, 0, 0, FX_TAU); c.stroke(); c.globalAlpha = 1; } }
          fxStep(c, P, dt); fxGlow(c, '217,70,239', x - 70, y, 150 * Math.min(1, u * 2), 0.3 * k); fxGlow(c, '34,211,238', x + 70, y, 150 * Math.min(1, u * 2), 0.25 * k);
        }
      };
    }
  };
  /* play the reveal for a tier on a stage; onShow fires when the prize card should appear. Returns the reveal's length in ms. */
  function fxReveal(stage, tier, odds, onShow) {
    var cfg = FX_RV[tier] || FX_RV.c;
    $$('canvas.pz-rv', stage).forEach(function (n) { n.remove(); });
    if (FX_REDUCE) { onShow(); return 0; }
    var cv = document.createElement('canvas'); cv.className = 'pz-rv'; cv.setAttribute('aria-hidden', 'true'); stage.appendChild(cv);
    fxScene(cv, function (s) { return FX_REVEAL[tier](s, cfg, odds); }, { dur: cfg.dur + 1.2, end: function () { cv.remove(); } });
    setTimeout(onShow, cfg.show * 1000);
    if (tier === 'l' || tier === 'm') { setTimeout(function () { stage.classList.remove('pz-shake'); void stage.offsetWidth; stage.classList.add('pz-shake'); }, (tier === 'm' ? 1.75 : cfg.show) * 1000); }
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
    }
  };
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
    return '';
  }
  /* a small picture of a prize theme, drawn with its own colors */
  function fxThemeMini(key) {
    var p = FX_PAL[key]; if (!p) { return ''; }
    return '<span class="pz-mini' + (FX_LIVE_THEMES[key] ? ' live' : '') + '" style="background:' + p.paper + ';border-color:' + p.line + '" aria-hidden="true">' +
      '<span class="pz-mini-card" style="background:' + p.card + ';border-color:' + p.line + '"><i style="background:' + p.ink + '"></i><i style="background:' + p.ink + ';width:60%"></i><b style="background:' + p.act + '"></b><em style="background:' + p.ok_soft + ';border-color:' + p.ok + '"></em></span></span>';
  }
