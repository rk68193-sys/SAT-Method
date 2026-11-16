  /* =================== Radiant: the tier above Mythic (prizes.js) =================== */
  /* Nine looks, at least one of every kind, each with its own arrival scene when it is won: the Beacon living theme; the Diamond
     ring, Fortissimo and Starforge effects; the Kintsugi, Orrery and Rose Window auras; the Gyre paper; and the Learning tree
     streak style. They join the registries in fx.js (FX_AURA, FX_DRAW, FX_LIVING, FX_PAPER, FX_REVEAL) and draw with its helpers. */

  /* ---------- helpers ---------- */
  /* a random number generator with a seed, so a tree or a crack network looks the same every time it is drawn */
  function zRng(seed) {
    var x = (Math.imul((seed >>> 0) + 0x9E3779B9, 2654435761) ^ 0x5bd1e995) >>> 0;
    return function () { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  }
  /* fxJag with its own random numbers */
  function zJag(r, x1, y1, x2, y2, rough, iters) {
    var pts = [[x1, y1], [x2, y2]];
    for (var it = 0; it < iters; it++) {
      var np = [pts[0]];
      for (var i = 0; i < pts.length - 1; i++) { var a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, off = (r() * 2 - 1) * rough * len / 2; np.push([(a[0] + b[0]) / 2 - dy / len * off, (a[1] + b[1]) / 2 + dx / len * off], b); }
      pts = np; rough *= 0.62;
    }
    return pts;
  }
  /* a line of points, measured, so it can be drawn part of the way */
  function zPath(pts) { var d = [0]; for (var i = 1; i < pts.length; i++) { d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); } return { pts: pts, d: d, len: d[d.length - 1] }; }
  function zAlong(p, dist) { var P = p.pts, D = p.d; if (dist <= 0) { return P[0]; } for (var i = 1; i < P.length; i++) { if (D[i] >= dist) { var u = (dist - D[i - 1]) / ((D[i] - D[i - 1]) || 1); return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * u, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * u]; } } return P[P.length - 1]; }
  function zStrokeTo(c, p, dist, col, w) {
    if (dist <= 0) { return; } var P = p.pts, D = p.d;
    c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(P[0][0], P[0][1]);
    for (var i = 1; i < P.length; i++) { if (D[i] <= dist) { c.lineTo(P[i][0], P[i][1]); } else { var q = zAlong(p, dist); c.lineTo(q[0], q[1]); break; } }
    c.stroke();
  }
  /* type a line of text, a letter at a time, centred */
  function zType(c, txt, x, y, u, font, col, glow) {
    if (u <= 0 || !txt) { return; }
    c.save(); c.globalCompositeOperation = 'source-over'; c.font = font; c.textAlign = 'left'; c.textBaseline = 'middle';
    var n = txt.length, shown = Math.min(n, u * n), x1 = x - c.measureText(txt).width / 2;
    for (var j = 0; j < Math.ceil(shown); j++) {
      var a = Math.max(0, Math.min(1, shown - j)), dx = c.measureText(txt.slice(0, j)).width;
      if (glow) { c.shadowColor = glow; c.shadowBlur = 14; }
      c.globalAlpha = a; c.fillStyle = col; c.fillText(txt[j], x1 + dx, y + (1 - a) * 6);
    }
    c.restore();
  }
  /* a 5 x 7 pixel font for the arcade letters */
  var Z_PX = { P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'], E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'], F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'], C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'], T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'], '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'] };
  function zPixelWord(c, word, x, y, px, colFn, a) {
    var W = word.length * 6 * px - px, x0 = x - W / 2, y0 = y - 3.5 * px;
    for (var i = 0; i < word.length; i++) {
      var g = Z_PX[word[i]]; if (!g) { continue; }
      var col = colFn(i);
      for (var r = 0; r < 7; r++) { for (var q = 0; q < 5; q++) { if (g[r][q] === '1') { c.globalAlpha = a; c.fillStyle = col; c.fillRect(x0 + (i * 6 + q) * px, y0 + r * px, px - 0.5, px - 0.5); } } }
    }
    c.globalAlpha = 1;
  }
  /* a rounded ring a little outside the answer */
  function zBoxRing(c, k, e, col, a, w) { if (!(a > 0)) { return; } c.globalAlpha = Math.min(1, a); c.strokeStyle = col; c.lineWidth = w; c.beginPath(); fxRR(c, k.x - e, k.y - e, k.w + e * 2, k.h + e * 2, 12 + e); c.stroke(); c.globalAlpha = 1; }

  /* ---------- auras: drawn on the dark plate around the streak ---------- */
  /* ---- Kintsugi: black glaze with seams of gold. Cracks form and fill with molten gold; light runs along the seams ---- */
  FX_AURA.kintsugi = function (s) {
    var N = [], born = 0, next = 0, seed = 11, S = [], D = [], i;
    for (i = 0; i < 26; i++) { D.push({ x: Math.random(), y: Math.random(), z: fxR(0.5, 1.2), p: fxR(0, FX_TAU), sp: fxR(4, 9) }); }
    function crack(t, main) {
      var r = zRng(seed++), x0 = s.w / 2, y0 = s.h / 2, m = Math.min(s.w, s.h), a = main && main.n !== undefined ? main.n / 5 * FX_TAU + 0.4 + (r() - 0.5) * 0.7 : r() * FX_TAU;
      var ex = x0 + Math.cos(a) * s.w * 0.62, ey = y0 + Math.sin(a) * s.h * 0.62, tx = x0 + Math.cos(a + (r() - 0.5) * 0.8) * m * (0.12 + 0.12 * r()), ty = y0 + Math.sin(a + (r() - 0.5) * 0.8) * m * (0.1 + 0.1 * r());
      if (!main && N.length) { var host = N[Math.floor(r() * N.length)].p, q = zAlong(host, host.len * (0.3 + 0.5 * r())); tx = q[0]; ty = q[1]; }
      var pts = zJag(r, ex, ey, tx, ty, 0.3, 5);
      var C = { p: zPath(pts), at: t, dur: 1.1 + 0.5 * r(), w: main ? 1.25 + 0.4 * r() : 0.8 + 0.3 * r(), kids: [], heal: 0 };
      var nb = main ? 2 : 1;
      for (var b = 0; b < nb; b++) {
        var j = zAlong(C.p, C.p.len * (0.25 + 0.5 * r())), ba = Math.atan2(ty - ey, tx - ex) + (b % 2 ? 1 : -1) * (0.5 + 0.7 * r()), bl = m * (0.12 + 0.2 * r());
        var bp = zJag(r, j[0], j[1], j[0] + Math.cos(ba) * bl, j[1] + Math.sin(ba) * bl, 0.34, 4);
        C.kids.push({ p: zPath(bp), w: C.w * 0.6, at: 0.5 + 0.4 * r() });
      }
      return C;
    }
    function gold(c, p, dist, w, fade, hot) {
      c.lineJoin = 'round'; c.lineCap = 'round';
      zStrokeTo(c, p, dist, 'rgba(255,160,40,' + (0.2 * fade) + ')', w * 6);
      zStrokeTo(c, p, dist, 'rgba(255,196,80,' + (0.8 * fade) + ')', w * 2.2);
      zStrokeTo(c, p, dist, 'rgba(255,246,214,' + ((0.45 + 0.55 * hot) * fade) + ')', w * 0.9);
    }
    return function (t, dt) {
      var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2;
      if (!N.length) { for (i = 0; i < 5; i++) { N.push(crack(i * 0.7 - (FX_REDUCE ? 6 : 0), { n: i })); } next = 9; }
      if (t > next) { N.push(crack(t, N.length % 3 === 0)); next = t + 7; if (N.length > 8) { N[0].heal = N[0].heal || t; } }
      N = N.filter(function (q) { return !q.heal || t - q.heal < 2; });
      /* the glaze: black, with slow light moving over its gloss */
      c.fillStyle = 'rgba(10,9,14,.9)'; c.fillRect(0, 0, s.w, s.h);
      c.globalCompositeOperation = 'lighter';
      fxGlow(c, '74,64,120', x0 + Math.cos(t * 0.21) * s.w * 0.32, y0 + Math.sin(t * 0.17) * s.h * 0.3, s.w * 0.6, 0.2);
      fxGlow(c, '120,86,52', x0 - Math.cos(t * 0.13) * s.w * 0.35, y0 - Math.sin(t * 0.19) * s.h * 0.28, s.w * 0.5, 0.14);
      var sweep = (t % 6) / 6, gx = -s.w * 0.4 + sweep * s.w * 1.8;
      var lg = c.createLinearGradient(gx - 70, 0, gx + 70, s.h * 0.5);
      lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,250,230,.95)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
      N.forEach(function (q) {
        var age = t - q.at, fade = q.heal ? Math.max(0, 1 - (t - q.heal) / 2) : 1;
        if (age <= 0) { return; }
        var cu = Math.min(1, age / (q.dur * 0.55)), gu = Math.max(0, Math.min(1, (age - q.dur * 0.35) / q.dur)), hot = Math.max(0, 1 - (age - q.dur) / 2.2);
        c.lineCap = 'round'; zStrokeTo(c, q.p, q.p.len * cu, 'rgba(170,160,205,' + (0.35 * fade) + ')', 0.7);
        gold(c, q.p, q.p.len * gu, q.w, fade, hot);
        if (gu > 0 && gu < 1) { var f = zAlong(q.p, q.p.len * gu); fxGlow(c, '255,232,160', f[0], f[1], 12, fade); if (Math.random() < 0.6) { S.push({ x: f[0], y: f[1], vx: fxR(-28, 28), vy: fxR(-46, -8), l: 0, m: fxR(0.4, 0.9) }); } }
        q.kids.forEach(function (k) {
          var ka = age - q.dur * k.at; if (ka <= 0) { return; }
          var kc = Math.min(1, ka / 0.5), kg = Math.max(0, Math.min(1, (ka - 0.2) / 0.8));
          zStrokeTo(c, k.p, k.p.len * kc, 'rgba(170,160,205,' + (0.3 * fade) + ')', 0.6);
          gold(c, k.p, k.p.len * kg, k.w, fade, Math.max(0, 1 - (ka - 1) / 2.2));
        });
        /* the glint that runs across the finished seams */
        if (gu >= 1) { c.globalAlpha = 0.7 * fade; zStrokeTo(c, q.p, q.p.len, lg, q.w * 1.6); q.kids.forEach(function (k) { zStrokeTo(c, k.p, k.p.len, lg, k.w * 1.6); }); c.globalAlpha = 1; }
        /* now and then a drop of light runs down a finished seam */
        if (gu >= 1) { var run = ((t * 0.35 + q.at * 0.37) % 1.6); if (run < 1) { var pp = zAlong(q.p, q.p.len * run); fxGlow(c, '255,240,190', pp[0], pp[1], 7, 0.8 * fade * Math.sin(run * Math.PI)); } }
      });
      for (i = S.length - 1; i >= 0; i--) { var p = S[i]; p.l += dt; if (p.l > p.m) { S.splice(i, 1); continue; } p.vy += 90 * dt; p.x += p.vx * dt; p.y += p.vy * dt; fxGlow(c, '255,214,120', p.x, p.y, 3.2, 1 - p.l / p.m); }
      /* gold dust drifting up */
      D.forEach(function (d) { var y = ((d.y * s.h - t * d.sp) % s.h + s.h) % s.h, tw = 0.5 + 0.5 * Math.sin(t * 2 + d.p); fxGlow(c, '255,214,140', d.x * s.w + Math.sin(t * 0.6 + d.p) * 6, y, 1.4 + d.z, 0.35 * tw * d.z); });
    };
  };

  /* ---- Orrery: a brass clockwork sky. Rings turn, planets ride their arms, gears mesh, and a hand ticks the seconds ---- */
  FX_AURA.orrery = function (s) {
    var CH = [], G = [], i;
    for (i = 0; i < 34; i++) { CH.push({ a: fxR(0, FX_TAU), r: fxR(0.25, 1), z: fxR(0.5, 1.2), p: fxR(0, 6) }); }
    var PL = [
      { r: 0.17, sp: 1.05, z: 3.4, col: ['#F5D0C5', '#9A5B4C'], a0: 0.4 },
      { r: 0.255, sp: 0.66, z: 5, col: ['#BFDBFE', '#1E3A8A'], a0: 2.3, moon: 1 },
      { r: 0.335, sp: 0.44, z: 4.3, col: ['#FECACA', '#9F1239'], a0: 4.1 },
      { r: 0.415, sp: 0.29, z: 7, col: ['#FDE68A', '#92400E'], a0: 5.4, ring: 1 }
    ];
    var BR = '214,170,92';
    function gear(c, cx, cy, r, n, ang) {
      var td = r * 0.16;
      c.save(); c.translate(cx, cy); c.rotate(ang);
      c.beginPath();
      for (var k = 0; k < n; k++) {
        var a = k / n * FX_TAU, h = Math.PI / n;
        c.lineTo(Math.cos(a - h * 0.95) * r, Math.sin(a - h * 0.95) * r);
        c.lineTo(Math.cos(a - h * 0.45) * (r + td), Math.sin(a - h * 0.45) * (r + td));
        c.lineTo(Math.cos(a + h * 0.45) * (r + td), Math.sin(a + h * 0.45) * (r + td));
        c.lineTo(Math.cos(a + h * 0.95) * r, Math.sin(a + h * 0.95) * r);
      }
      c.closePath();
      var gg = c.createLinearGradient(-r, -r, r, r); gg.addColorStop(0, 'rgba(120,84,36,.95)'); gg.addColorStop(0.5, 'rgba(176,128,58,.95)'); gg.addColorStop(1, 'rgba(84,58,26,.95)');
      c.fillStyle = gg; c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(255,226,160,.55)'; c.stroke();
      c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(0, 0, r * 0.72, 0, FX_TAU); c.fill(); c.globalCompositeOperation = 'source-over';
      c.strokeStyle = 'rgba(190,140,66,.95)'; c.lineWidth = Math.max(1.5, r * 0.09);
      for (var sp = 0; sp < 5; sp++) { var sa = sp / 5 * FX_TAU; c.beginPath(); c.moveTo(Math.cos(sa) * r * 0.18, Math.sin(sa) * r * 0.18); c.lineTo(Math.cos(sa) * r * 0.74, Math.sin(sa) * r * 0.74); c.stroke(); }
      c.lineWidth = 1; c.strokeStyle = 'rgba(255,226,160,.5)'; c.beginPath(); c.arc(0, 0, r * 0.72, 0, FX_TAU); c.stroke();
      c.fillStyle = 'rgba(214,170,92,1)'; c.beginPath(); c.arc(0, 0, r * 0.18, 0, FX_TAU); c.fill();
      c.restore();
    }
    function sphere(c, x, y, z, col, lit) {
      var g = c.createRadialGradient(x - z * 0.35, y - z * 0.35, z * 0.1, x, y, z);
      g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = lit; c.fillStyle = g; c.beginPath(); c.arc(x, y, z, 0, FX_TAU); c.fill(); c.globalAlpha = 1;
    }
    return function (t, dt) {
      var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, k = Math.min(1, s.h / 180), W = s.w, H = s.h;
      /* the star chart behind */
      c.globalCompositeOperation = 'lighter';
      var rot = t * 0.03;
      CH.forEach(function (q, n) { var x = x0 + Math.cos(q.a + rot) * q.r * W * 0.55, y = y0 + Math.sin(q.a + rot) * q.r * H * 0.55; fxGlow(c, '191,219,254', x, y, 1.2 + q.z, 0.25 + 0.2 * Math.sin(t * 2 + q.p)); if (n % 5 === 1) { var o = CH[n - 1]; c.globalAlpha = 0.1; c.strokeStyle = '#BFDBFE'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x0 + Math.cos(o.a + rot) * o.r * W * 0.55, y0 + Math.sin(o.a + rot) * o.r * H * 0.55); c.stroke(); c.globalAlpha = 1; } });
      /* gears in the corners, meshing */
      c.globalCompositeOperation = 'source-over';
      var r1 = H * 0.3, r2 = H * 0.21, r3 = H * 0.15;
      gear(c, W * 0.06, H * 1.0, r1, 18, t * 0.35);
      gear(c, W * 0.06 + r1 * 1.0 + r2 * 1.12, H * 1.06, r2, 13, -t * 0.35 * 18 / 13 + 0.12);
      gear(c, W * 0.97, H * 0.02, r3, 10, t * 0.5);
      gear(c, W * 0.99, H * 0.97, r2 * 0.9, 12, -t * 0.42);
      /* the rings: a dial with numerals, a tilted band, a meridian */
      var ax = W * 0.465, ay = H * 0.4, dial = t * 0.05;
      c.lineWidth = 2.2 * k; c.strokeStyle = 'rgba(' + BR + ',.85)'; c.beginPath(); c.ellipse(x0, y0, ax, ay, 0, 0, FX_TAU); c.stroke();
      c.lineWidth = 1; c.strokeStyle = 'rgba(255,226,160,.6)'; c.beginPath(); c.ellipse(x0, y0, ax - 6 * k, ay - 6 * k, 0, 0, FX_TAU); c.stroke();
      for (i = 0; i < 60; i++) { var ta = i / 60 * FX_TAU + dial, lx = Math.cos(ta), ly = Math.sin(ta), L = i % 5 ? 3 : 6; c.globalAlpha = 0.75; c.strokeStyle = 'rgba(' + BR + ',1)'; c.lineWidth = i % 5 ? 0.7 : 1.3; c.beginPath(); c.moveTo(x0 + lx * ax, y0 + ly * ay); c.lineTo(x0 + lx * (ax - L * k), y0 + ly * (ay - L * k)); c.stroke(); }
      c.globalAlpha = 1;
      var NUM = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      c.font = '600 ' + (9 * k + 1).toFixed(1) + 'px "Literata", Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      NUM.forEach(function (nm, n) { var na = -Math.PI / 2 + n / 12 * FX_TAU + dial; c.fillStyle = 'rgba(255,226,160,.9)'; c.fillText(nm, x0 + Math.cos(na) * (ax - 15 * k), y0 + Math.sin(na) * (ay - 13 * k)); });
      c.lineWidth = 1.6 * k; c.strokeStyle = 'rgba(' + BR + ',.7)'; c.beginPath(); c.ellipse(x0, y0, W * 0.36, H * 0.14, 0.28, 0, FX_TAU); c.stroke();
      for (i = 0; i < 24; i++) { var ea = i / 24 * FX_TAU - t * 0.2, ex = Math.cos(ea) * W * 0.36, ey = Math.sin(ea) * H * 0.14, cs = Math.cos(0.28), sn = Math.sin(0.28); fxGlow(c, '255,226,160', x0 + ex * cs - ey * sn, y0 + ex * sn + ey * cs, 1.6, 0.5); }
      c.lineWidth = 1.4 * k; c.strokeStyle = 'rgba(' + BR + ',.55)'; c.beginPath(); c.ellipse(x0, y0, H * 0.46, W * 0.1, Math.PI / 2 - 0.2, 0, FX_TAU); c.stroke();
      /* planets on their arms: the far ones first, then the sun, then the near ones */
      var pos = PL.map(function (p) { var a = p.a0 + t * p.sp, rx = p.r * W, ry = p.r * W * 0.3; return { p: p, a: a, x: x0 + Math.cos(a) * rx, y: y0 + Math.sin(a) * ry, d: Math.sin(a), rx: rx, ry: ry }; });
      function drawP(q) {
        var sc = (0.82 + 0.25 * (q.d + 1) / 2) * k, z = q.p.z * sc, lit = 0.7 + 0.3 * (q.d + 1) / 2;
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.7; c.strokeStyle = 'rgba(' + BR + ',1)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(q.x, q.y); c.stroke(); c.globalAlpha = 1;
        c.fillStyle = 'rgba(' + BR + ',1)'; c.beginPath(); c.arc(q.x, q.y + z + 2, 1.6, 0, FX_TAU); c.fill();
        if (q.p.ring) { c.globalAlpha = 0.9; c.strokeStyle = 'rgba(253,230,138,.9)'; c.lineWidth = 1.3; c.beginPath(); c.ellipse(q.x, q.y, z * 1.9, z * 0.55, -0.35, Math.PI, FX_TAU); c.stroke(); }
        sphere(c, q.x, q.y, z, q.p.col, lit);
        if (q.p.ring) { c.strokeStyle = 'rgba(253,230,138,.95)'; c.lineWidth = 1.3; c.beginPath(); c.ellipse(q.x, q.y, z * 1.9, z * 0.55, -0.35, 0, Math.PI); c.stroke(); c.globalAlpha = 1; }
        if (q.p.moon) { var ma = t * 3.2; sphere(c, q.x + Math.cos(ma) * z * 2.2, q.y + Math.sin(ma) * z * 0.9, 1.6 * k + 0.6, ['#F1F5F9', '#64748B'], 0.95); }
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '255,236,190', q.x - z * 0.3, q.y - z * 0.3, z * 0.9, 0.25);
      }
      c.lineWidth = 0.7; c.strokeStyle = 'rgba(' + BR + ',.28)'; pos.forEach(function (q) { c.beginPath(); c.ellipse(x0, y0, q.rx, q.ry, 0, 0, FX_TAU); c.stroke(); });
      pos.filter(function (q) { return q.d < 0; }).forEach(drawP);
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,191,36', x0, y0, 64 * k, 0.55); fxGlow(c, '255,247,214', x0, y0, 26 * k, 0.9);
      pos.filter(function (q) { return q.d >= 0; }).forEach(drawP);
      /* the second hand: it ticks, and its tip catches the light */
      var sec = Math.floor(t), fr = t - sec, step = sec + fxEase(Math.min(1, fr * 5)), ha = -Math.PI / 2 + step * FX_TAU / 60;
      var hx = x0 + Math.cos(ha) * (ax - 4 * k), hy = y0 + Math.sin(ha) * (ay - 4 * k);
      c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'rgba(255,226,160,.95)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x0 - Math.cos(ha) * 14 * k, y0 - Math.sin(ha) * 9 * k); c.lineTo(hx, hy); c.stroke();
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '255,240,200', hx, hy, 7, 0.4 + 0.6 * Math.max(0, 1 - fr * 3));
      /* glints that wander over the brass */
      if (Math.random() < dt * 3) { var ga = fxR(0, FX_TAU); G.push({ x: x0 + Math.cos(ga) * ax, y: y0 + Math.sin(ga) * ay, l: 0 }); }
      for (i = G.length - 1; i >= 0; i--) { var gq = G[i]; gq.l += dt; if (gq.l > 0.6) { G.splice(i, 1); continue; } fxStar4(c, gq.x, gq.y, 5 * Math.sin(gq.l / 0.6 * Math.PI), 1, '#FFF7E0'); }
    };
  };

  /* ---- Rose Window: a circle of stained glass. Sunlight moves around it pane by pane, colored beams fall from it, and dust glitters in the light ---- */
  FX_AURA.rose = function (s) {
    var DU = [], i;
    for (i = 0; i < 46; i++) { DU.push({ x: Math.random(), y: Math.random(), z: fxR(0.4, 1.2), p: fxR(0, FX_TAU), v: fxR(2, 6) }); }
    var GL = { ruby: '220,38,72', sapph: '37,99,235', emer: '16,185,129', amber: '245,158,11', ame: '147,51,234', deep: '30,58,138' };
    var WED = ['ruby', 'sapph', 'amber', 'emer', 'sapph', 'ame'], LOB = ['sapph', 'ruby', 'ame', 'ruby'];
    function col(name, a) { return 'rgba(' + GL[name] + ',' + a.toFixed(3) + ')'; }
    return function (t, dt) {
      var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, R = Math.min(s.h * 0.5, s.w * 0.37) * ((s.opt && s.opt.rs) || 1), sun = t * 0.4, flare = fxEnv(t % 14, 10.5, 11.3, 11.8, 13.2), k = R / 90;
      function lit(a) { var d = Math.cos(a - sun); return Math.min(1, 0.18 + 0.82 * Math.pow(Math.max(0, d), 2) + 0.6 * flare); }
      /* colored beams fall from the window and dust glitters in them */
      c.globalCompositeOperation = 'lighter';
      for (i = 0; i < 6; i++) { var ba = Math.PI / 2 + (i - 2.5) * 0.3 + Math.sin(t * 0.2) * 0.05, nm = WED[i % WED.length]; fxBeam(c, x0 + Math.cos(ba) * R * 0.4, y0 + Math.sin(ba) * R * 0.4, ba, s.h * 1.4, 0.12, col(nm, 0.14 + 0.22 * lit(ba))); }
      DU.forEach(function (d) { var x = (d.x * s.w + t * d.v * 0.6) % s.w, y = ((d.y * s.h + t * d.v) % s.h), tw = Math.max(0, Math.sin(t * 2.2 * d.z + d.p)); fxGlow(c, '255,244,214', x, y, 1.2 + 1.6 * d.z, 0.55 * tw); });
      fxGlow(c, '255,236,190', x0, y0, R * 1.5, 0.12 + 0.2 * flare);
      /* the glass: wedges inside, round lobes outside, deep blue between */
      c.globalCompositeOperation = 'source-over';
      var r0 = R * 0.3, r1 = R * 0.62;
      c.fillStyle = col('deep', 0.55 + 0.2 * flare); c.beginPath(); c.arc(x0, y0, R, 0, FX_TAU); c.arc(x0, y0, r1, 0, FX_TAU, true); c.fill();
      for (i = 0; i < 12; i++) {
        var a0 = i / 12 * FX_TAU - Math.PI / 2, a1 = a0 + FX_TAU / 12, am = (a0 + a1) / 2, L = lit(am), nm2 = WED[i % WED.length];
        var g = c.createRadialGradient(x0, y0, r0, x0, y0, r1); g.addColorStop(0, col(nm2, 0.22 + 0.6 * L)); g.addColorStop(1, col(nm2, 0.4 + 0.6 * L));
        c.fillStyle = g; c.beginPath(); c.arc(x0, y0, r1, a0, a1); c.arc(x0, y0, r0, a1, a0, true); c.closePath(); c.fill();
        var la = am, lx = x0 + Math.cos(la) * R * 0.81, ly = y0 + Math.sin(la) * R * 0.81, LL = lit(la), nm3 = LOB[i % LOB.length];
        var lg = c.createRadialGradient(lx - R * 0.04, ly - R * 0.04, 1, lx, ly, R * 0.16); lg.addColorStop(0, col(nm3, 0.45 + 0.55 * LL)); lg.addColorStop(1, col(nm3, 0.25 + 0.55 * LL));
        c.fillStyle = lg; c.beginPath(); c.arc(lx, ly, R * 0.155, 0, FX_TAU); c.fill();
      }
      var mg = c.createRadialGradient(x0, y0, 1, x0, y0, r0); mg.addColorStop(0, 'rgba(255,247,214,' + (0.75 + 0.25 * flare) + ')'); mg.addColorStop(1, 'rgba(245,158,11,.6)');
      c.fillStyle = mg; c.beginPath(); c.arc(x0, y0, r0, 0, FX_TAU); c.fill();
      /* light through the glass */
      c.globalCompositeOperation = 'lighter';
      for (i = 0; i < 12; i++) { var am2 = (i + 0.5) / 12 * FX_TAU - Math.PI / 2, L2 = lit(am2); fxGlow(c, GL[WED[i % WED.length]], x0 + Math.cos(am2) * R * 0.47, y0 + Math.sin(am2) * R * 0.47, R * 0.26, 0.45 * L2); fxGlow(c, GL[LOB[i % LOB.length]], x0 + Math.cos(am2) * R * 0.81, y0 + Math.sin(am2) * R * 0.81, R * 0.2, 0.4 * lit(am2)); }
      /* the stone tracery and its lead lines */
      c.globalCompositeOperation = 'source-over';
      function trace(w, st) {
        c.lineWidth = w; c.strokeStyle = st;
        c.beginPath(); c.arc(x0, y0, R, 0, FX_TAU); c.stroke(); c.beginPath(); c.arc(x0, y0, r1, 0, FX_TAU); c.stroke(); c.beginPath(); c.arc(x0, y0, r0, 0, FX_TAU); c.stroke();
        for (var j = 0; j < 12; j++) { var aa = j / 12 * FX_TAU - Math.PI / 2, mm = aa + FX_TAU / 24; c.beginPath(); c.moveTo(x0 + Math.cos(aa) * r0, y0 + Math.sin(aa) * r0); c.lineTo(x0 + Math.cos(aa) * r1, y0 + Math.sin(aa) * r1); c.stroke(); c.beginPath(); c.arc(x0 + Math.cos(mm) * R * 0.81, y0 + Math.sin(mm) * R * 0.81, R * 0.155, 0, FX_TAU); c.stroke(); }
      }
      trace(3.4 * k, 'rgba(22,17,30,.96)');
      trace(0.8, 'rgba(232,200,130,' + (0.45 + 0.3 * flare) + ')');
      c.lineWidth = 5 * k; c.strokeStyle = 'rgba(58,50,72,.95)'; c.beginPath(); c.arc(x0, y0, R + 3 * k, 0, FX_TAU); c.stroke();
      c.lineWidth = 1; c.strokeStyle = 'rgba(232,200,130,.6)'; c.beginPath(); c.arc(x0, y0, R + 5.5 * k, 0, FX_TAU); c.stroke();
      /* where the light is strongest, a glint */
      c.globalCompositeOperation = 'lighter';
      var gx = x0 + Math.cos(sun) * R * 0.81, gy = y0 + Math.sin(sun) * R * 0.81; fxGlow(c, '255,250,235', gx, gy, R * 0.22, 0.5); fxStar4(c, gx, gy, R * 0.12 * (0.8 + 0.2 * Math.sin(t * 5)), 0.8, '#FFFFFF');
      if (flare > 0) { fxGlow(c, '255,250,235', x0, y0, R * 1.3, 0.45 * flare); }
    };
  };

  /* ---------- right-answer effects: drawn over the page, around the answer (k is its box, read again every frame) ---------- */
  FX_DUR.fortissimo = 2.8; FX_DUR.diamond = 2.9; FX_DUR.starforge = 3.0;
  /* ---- Fortissimo: five beats, each one quicker and brighter, every light on the same color; then the drop, a rainbow burst and PERFECT in pixel letters ---- */
  FX_DRAW.fortissimo = function (s, k) {
    var BEATS = [0.06, 0.48, 0.82, 1.08, 1.27], HUES = [190, 265, 320, 30, 140], DROP = 1.45, BARS = 22, PX = [], i, burst = false;
    var ph = []; for (i = 0; i < BARS; i++) { ph.push(fxR(0, 6)); }
    function hueAt(t) { if (t >= DROP) { return (140 + (t - DROP) * 420) % 360; } var h = HUES[0]; BEATS.forEach(function (b, n) { if (t >= b) { h = HUES[n]; } }); return h; }
    return function (t, dt) {
      var c = s.ctx, hue = hueAt(t), last = -9;
      BEATS.forEach(function (b) { if (t >= b) { last = b; } });
      fxDim(c, s, k, 0.5 * fxEnv(t, 0, 0.2, 2.3, 2.8));
      c.globalCompositeOperation = 'lighter';
      /* each beat sends out a ring, and the border flashes in the beat's color */
      BEATS.forEach(function (b, n) { var u = (t - b) / 0.55; if (u > 0 && u < 1) { zBoxRing(c, k, 3 + fxEase(u) * (22 + n * 9), 'hsl(' + HUES[n] + ',100%,66%)', (1 - u) * (0.55 + n * 0.1), 3 * (1 - u) + 1); } });
      var flash = t < DROP ? Math.exp(-(t - last) * 5) : Math.exp(-(t - DROP) * 2.2);
      [[9, 0.18], [4, 0.45], [1.6, 1]].forEach(function (L) { zBoxRing(c, k, 1, 'hsl(' + hue + ',100%,' + (L[0] < 2 ? 85 : 62) + '%)', flash * L[1], L[0]); });
      /* equalizer bars on the top and bottom edges: they jump on every beat */
      var energy = 0; BEATS.forEach(function (b, n) { var u = t - b; if (u >= 0) { energy = Math.max(energy, Math.exp(-u * 5.5) * (0.45 + n * 0.14)); } });
      if (t >= DROP) { energy = Math.max(energy, 1.1 * Math.exp(-(t - DROP) * 1.6) * (0.75 + 0.25 * Math.abs(Math.sin((t - DROP) * 17)))); }
      var bw = k.w / BARS, alive = fxEnv(t, 0, 0.05, 2.3, 2.75);
      for (i = 0; i < BARS; i++) {
        var shape = 0.45 + 0.55 * Math.sin((i + 0.5) / BARS * Math.PI), hgt = (5 + 38 * energy * shape) * (0.55 + 0.45 * Math.abs(Math.sin(t * 13 + ph[i]))), x = k.x + i * bw + bw * 0.18, wd = bw * 0.64;
        c.globalAlpha = 0.9 * alive; c.fillStyle = 'hsl(' + ((hue + i * 5) % 360) + ',100%,62%)';
        c.fillRect(x, k.y - 4 - hgt, wd, hgt); c.fillRect(x, k.y + k.h + 4, wd, hgt * 0.7);
        c.globalAlpha = 0.9 * alive; c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(x, k.y - 4 - hgt, wd, 2);
      }
      c.globalAlpha = 1;
      /* the drop */
      if (t >= DROP) {
        var u = t - DROP;
        if (!burst) { burst = true; for (i = 0; i < 70; i++) { var a = fxR(0, FX_TAU), v = fxR(120, 420), ex = k.cx + Math.cos(a) * k.w * 0.5, ey = k.cy + Math.sin(a) * k.h * 0.5; PX.push({ x: ex, y: ey, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7 - 120, z: Math.round(fxR(3, 6)), h: Math.floor(fxR(0, 360)) }); } }
        if (u < 0.08) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = (1 - u / 0.08) * 0.22; c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; c.globalCompositeOperation = 'lighter'; }
        [0, 0.1, 0.2].forEach(function (d0, n) { var v2 = (u - d0) / 0.9; if (v2 > 0 && v2 < 1) { zBoxRing(c, k, 4 + fxEase(v2) * (90 + n * 50), 'hsl(' + ((n * 120 + t * 300) % 360) + ',100%,66%)', 1 - v2, 4 * (1 - v2) + 1); } });
        c.globalCompositeOperation = 'source-over';
        PX.forEach(function (p) { p.vy += 640 * dt; p.vx *= Math.pow(0.5, dt); p.x += p.vx * dt; p.y += p.vy * dt; var g = 4; c.globalAlpha = Math.max(0, 1 - u / 1.25); c.fillStyle = 'hsl(' + ((p.h + t * 200) % 360) + ',100%,62%)'; c.fillRect(Math.round(p.x / g) * g, Math.round(p.y / g) * g, p.z, p.z); });
        c.globalAlpha = 1;
        /* PERFECT, in pixel letters, stamped above the answer */
        var px = Math.max(3, Math.min(5, Math.round(k.w / 70))), sc = u < 0.14 ? 1.7 - 0.7 * fxEase(u / 0.14) : 1, wa = u > 0.95 ? Math.max(0, 1 - (u - 0.95) / 0.35) : 1, wy = k.y - 30 - px * 4;
        c.save(); c.translate(k.cx, wy); c.scale(sc, sc);
        zPixelWord(c, 'PERFECT!', 2, 2, px, function () { return 'rgba(0,0,0,.55)'; }, wa);
        zPixelWord(c, 'PERFECT!', 0, 0, px, function (n) { return 'hsl(' + ((n * 45 + t * 360) % 360) + ',100%,64%)'; }, wa);
        c.restore();
      }
    };
  };

  /* ---- Diamond ring: the page darkens as a moon's shadow crosses your answer; at totality a corona of light rays opens around it, then the first light returns as a diamond flash.
          The rays are kept from the answer's top left corner, so they move with it if the page scrolls ---- */
  FX_DRAW.diamond = function (s, k) {
    var ST = [], RAYS = [], i, r = zRng(41), per = 2 * (k.w + k.h), N = 46;
    for (i = 0; i < 28; i++) { ST.push({ x: fxR(0, 1), y: fxR(0, 1), p: fxR(0, 6), z: fxR(0.6, 1.4) }); }
    for (i = 0; i < N; i++) {
      var d = (i + 0.2 + r() * 0.6) / N * per, x, y, nx, ny;
      if (d < k.w) { x = k.x + d; y = k.y; nx = 0; ny = -1; } else if (d < k.w + k.h) { x = k.x + k.w; y = k.y + d - k.w; nx = 1; ny = 0; } else if (d < 2 * k.w + k.h) { x = k.x + k.w - (d - k.w - k.h); y = k.y + k.h; nx = 0; ny = 1; } else { x = k.x; y = k.y + k.h - (d - 2 * k.w - k.h); nx = -1; ny = 0; }
      var ends = Math.pow(Math.abs((x - k.cx) / (k.w / 2)), 3), ox = x - k.cx, oy = (y - k.cy) * 2.2, ol = Math.hypot(ox, oy) || 1, mx = nx * 0.55 + ox / ol * 0.45, my = ny * 0.55 + oy / ol * 0.45, ml = Math.hypot(mx, my) || 1;
      var tw2 = (r() - 0.5) * 0.35, cs = Math.cos(tw2), sn2 = Math.sin(tw2), ux = mx / ml, uy = my / ml; RAYS.push({ x: x - k.x, y: y - k.y, nx: ux * cs - uy * sn2, ny: ux * sn2 + uy * cs, L: (8 + Math.pow(r(), 2) * 44) * (1 + 2.6 * ends), w: 2 + r() * 4, p: r() * 6 });
    }
    var PROM = [0.16, 0.41, 0.66, 0.92].map(function (f) { return RAYS[Math.floor(f * N)]; });
    return function (t, dt) {
      var c = s.ctx, dim = fxEnv(t, 0, 0.35, 2.15, 2.9), mR = Math.max(k.w * 0.75, 120), m0 = k.x - mR * 1.05, m1 = k.x + k.w + mR * 1.05, mp;
      if (t < 1.0) { mp = m0 + (k.cx - m0) * fxEase(Math.max(0, (t - 0.12) / 0.88)); } else if (t < 1.72) { mp = k.cx; } else { mp = k.cx + (m1 - k.cx) * fxEase((t - 1.72) / 0.75); }
      fxDim(c, s, k, 0.8 * dim, '#04050C');
      /* before totality the answer shines like the sun */
      var cov = Math.max(0, Math.min(1, (mp + mR - k.x) / k.w)), sun = t < 1.0 ? 1 - Math.pow(cov, 1.6) : 0;
      c.globalCompositeOperation = 'lighter';
      if (sun > 0.01) { [[10, 0.25], [3, 0.7]].forEach(function (L) { zBoxRing(c, k, 2, 'rgb(255,247,214)', sun * L[1] * dim, L[0]); }); fxGlow(c, '255,240,200', k.x + k.w - (k.w * cov) / 2, k.cy, k.h * 1.6, 0.35 * sun * dim); }
      /* the moon's shadow, only on the answer */
      c.save(); c.beginPath(); fxRR(c, k.x, k.y, k.w, k.h, 12); c.clip();
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.84 * dim; c.fillStyle = '#06070D'; c.beginPath(); c.arc(mp, k.cy, mR, 0, FX_TAU); c.fill(); c.globalAlpha = 1;
      c.restore();
      /* totality: stars on the dark page and a corona of rays around the answer */
      var ca = fxEnv(t, 0.95, 1.15, 1.7, 2.05) * dim;
      c.globalCompositeOperation = 'lighter';
      if (ca > 0) {
        ST.forEach(function (q) { var tw = 0.5 + 0.5 * Math.sin(t * 4 + q.p); fxGlow(c, '255,255,255', q.x * s.w, q.y * s.h, 1 + q.z, ca * (0.3 + 0.5 * tw)); });
        c.lineCap = 'round'; c.save(); c.translate(k.x, k.y);
        RAYS.forEach(function (q) { var L = q.L * (0.8 + 0.2 * Math.sin(t * 3 + q.p)) * (0.6 + 0.4 * ca), px = -q.ny * q.w, py = q.nx * q.w; [[1, 0.13], [0.45, 0.32]].forEach(function (P) { c.fillStyle = 'rgba(255,250,240,' + (P[1] * ca) + ')'; c.beginPath(); c.moveTo(q.x + px * P[0], q.y + py * P[0]); c.lineTo(q.x + q.nx * L * (P[0] < 1 ? 0.5 : 1), q.y + q.ny * L * (P[0] < 1 ? 0.5 : 1)); c.lineTo(q.x - px * P[0], q.y - py * P[0]); c.closePath(); c.fill(); }); });
        PROM.forEach(function (q) { fxGlow(c, '255,84,128', q.x + q.nx * 4, q.y + q.ny * 4, 8, 0.9 * ca); fxGlow(c, '255,160,190', q.x + q.nx * 3, q.y + q.ny * 3, 3, ca); });
        c.restore();
        zBoxRing(c, k, 7, 'rgb(220,230,255)', 0.3 * ca, 9); zBoxRing(c, k, 2, 'rgb(255,250,240)', 0.9 * ca, 2.2);
      }
      /* the last beads of sunlight, then the diamond flash where the light comes back */
      var dx = k.x + 3, dy = k.y + k.h * 0.32, bd = fxEnv(t, 1.6, 1.66, 1.74, 1.8);
      if (bd > 0) { for (i = 0; i < 5; i++) { fxGlow(c, '255,250,235', k.x + 1, k.y + k.h * (0.15 + i * 0.17), 2.5 + 2.5 * Math.abs(Math.sin(t * 40 + i)), bd); } }
      var dd = fxEnv(t, 1.74, 1.84, 1.98, 2.6);
      if (dd > 0) {
        fxGlow(c, '255,255,255', dx, dy, 64 * dd, dd); fxStar4(c, dx, dy, 46 * dd, dd, '#FFFFFF');
        c.save(); c.translate(dx, dy); c.scale(1, 0.06); fxGlow(c, '255,250,235', 0, 0, s.w * 0.42 * dd, 0.9 * dd); c.restore();
        var ru = (t - 1.74) / 0.8; if (ru > 0 && ru < 1) { fxRing(c, dx, dy, 10 + ru * 130, 4 + ru * 34, '255,247,214', 1 - ru, 1.5); }
      }
      /* the light returns: a white-gold rim that fades */
      var g = fxEnv(t, 1.9, 2.05, 2.45, 2.9);
      if (g > 0) { zBoxRing(c, k, 2, 'rgb(234,179,8)', 0.4 * g, 7); zBoxRing(c, k, 2, 'rgb(255,247,214)', g, 1.6); }
    };
  };

  /* ---- Starforge: the page goes dark as a forge, a hammer of light strikes your answer three times, sparks fly, and it cools into gold ---- */
  FX_DRAW.starforge = function (s, k) {
    var HITS = [0.72, 1.24, 1.76], SP = [], ST = [], EM = [], i, done = [false, false, false];
    for (i = 0; i < 26; i++) { EM.push({ x: fxR(-0.7, 0.7), y: fxR(0, 1), v: fxR(18, 46), p: fxR(0, 6), z: fxR(0.6, 1.3) }); }
    /* how far the hammer is raised: up, down hard on each hit, a bounce, and away at the end */
    function lift(t) {
      if (t < HITS[0]) { var u = t / HITS[0]; return u < 0.62 ? 0.2 + 1.2 * fxEase(u / 0.62) : 1.4 * (1 - Math.pow((u - 0.62) / 0.38, 2)); }
      for (var n = 0; n < 3; n++) {
        var a = HITS[n], b = n < 2 ? HITS[n + 1] : a + 0.7;
        if (t < b) { var v = (t - a) / (b - a); if (n === 2) { return 1.6 * fxEase(v); } return v < 0.55 ? 1.25 * Math.sin(v / 0.55 * Math.PI / 2) : 1.25 * (1 - Math.pow((v - 0.55) / 0.45, 2)); }
      }
      return 1.6;
    }
    /* a hammer made of light: a glowing handle and a white-gold head with a molten edge */
    function hammer(c, px, py, ang, L, a, glow) {
      var hx = px + Math.cos(ang) * L, hy = py + Math.sin(ang) * L, hw = Math.max(40, Math.min(64, k.h * 1.05)), hh = hw * 0.56;
      c.save(); c.globalAlpha = a; c.lineCap = 'round'; c.globalCompositeOperation = 'lighter';
      c.strokeStyle = 'rgba(251,146,60,.35)'; c.lineWidth = 11; c.beginPath(); c.moveTo(px, py); c.lineTo(hx, hy); c.stroke();
      c.strokeStyle = 'rgba(255,220,160,.95)'; c.lineWidth = 4; c.beginPath(); c.moveTo(px, py); c.lineTo(hx, hy); c.stroke();
      fxGlow(c, '251,191,36', hx, hy, hw * 1.3, 0.55 + 0.4 * glow);
      c.translate(hx, hy); c.rotate(ang + Math.PI / 2);
      var g = c.createLinearGradient(0, -hh / 2, 0, hh / 2); g.addColorStop(0, 'rgba(255,250,235,1)'); g.addColorStop(0.55, 'rgba(255,214,140,1)'); g.addColorStop(1, 'rgba(251,146,60,1)');
      c.globalCompositeOperation = 'source-over'; c.fillStyle = g; c.beginPath(); fxRR(c, -hw / 2, -hh / 2, hw, hh, 5); c.fill();
      c.strokeStyle = 'rgba(180,83,9,.9)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-hw * 0.32, -hh / 2 + 2); c.lineTo(-hw * 0.32, hh / 2 - 2); c.moveTo(hw * 0.32, -hh / 2 + 2); c.lineTo(hw * 0.32, hh / 2 - 2); c.stroke();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,247,214,' + (0.7 + 0.3 * glow) + ')'; c.lineWidth = 1.6; c.beginPath(); fxRR(c, -hw / 2, -hh / 2, hw, hh, 5); c.stroke();
      c.restore();
    }
    return function (t, dt) {
      var c = s.ctx, ix = k.cx, iy = k.y - 2;
      fxDim(c, s, k, 0.74 * fxEnv(t, 0, 0.3, 2.45, 3.0), '#0A0503');
      c.globalCompositeOperation = 'lighter';
      /* embers rising around the answer */
      var ea = fxEnv(t, 0, 0.3, 2.4, 3.0);
      EM.forEach(function (e) { var y = k.cy + k.h * 0.5 - ((e.y * 140 + t * e.v) % 140), x = k.cx + e.x * k.w * 0.7 + Math.sin(t * 2 + e.p) * 6, f = Math.max(0, Math.sin(t * 9 + e.p)); fxGlow(c, '251,146,60', x, y, 2 + 2.4 * e.z, ea * (0.4 + 0.5 * f)); });
      /* heat: each hit leaves the answer hotter, then it cools from white through orange to gold */
      var heat = 0; HITS.forEach(function (h, n) { if (t >= h) { heat = Math.max(heat, (0.45 + n * 0.28) * Math.exp(-(t - h) * (n === 2 ? 1.1 : 2.2))); } });
      if (heat > 0.02) { var hr = 255, hg = Math.round(150 + 100 * Math.min(1, heat)), hb = Math.round(60 + 160 * Math.max(0, heat - 0.5)); c.globalAlpha = Math.min(0.6, heat * 0.55); c.fillStyle = 'rgb(' + hr + ',' + hg + ',' + hb + ')'; c.beginPath(); fxRR(c, k.x, k.y, k.w, k.h, 12); c.fill(); c.globalAlpha = 1; [[10, 0.25], [4, 0.6]].forEach(function (L) { zBoxRing(c, k, 1, 'rgb(' + hr + ',' + hg + ',' + hb + ')', heat * L[1], L[0]); }); }
      /* the hit: a flash, a shockwave along the edge, and a fountain of sparks */
      HITS.forEach(function (h, n) {
        var u = t - h;
        if (u >= 0 && !done[n]) { done[n] = true; for (var j = 0; j < 26 + n * 16; j++) { var a = -Math.PI / 2 + fxR(-1.35, 1.35), v = fxR(140, 380 + n * 60); SP.push({ x: ix + fxR(-12, 12), y: iy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0, m: fxR(0.45, 0.95) }); } for (var q = 0; q < 4 + n * 2; q++) { ST.push({ x: ix + fxR(-k.w * 0.4, k.w * 0.4), y: iy - fxR(10, 60), vy: fxR(-30, -12), l: 0, m: fxR(0.8, 1.3), z: fxR(4, 8) }); } }
        if (u >= 0 && u < 0.2) { fxGlow(c, '255,247,214', ix, iy, 40 + n * 20, (1 - u / 0.2)); fxGlow(c, '251,146,60', ix, iy, 120 + n * 40, 0.6 * (1 - u / 0.2)); }
        var v2 = u / 0.55; if (v2 > 0 && v2 < 1) { fxRing(c, ix, iy, 10 + fxEase(v2) * (k.w * 0.55 + n * 40), 3 + v2 * (14 + n * 5), '253,186,116', (1 - v2) * 0.9, 2.5 * (1 - v2) + 0.8); }
      });
      c.lineCap = 'round';
      for (i = SP.length - 1; i >= 0; i--) { var p = SP[i]; p.l += dt; if (p.l > p.m) { SP.splice(i, 1); continue; } p.vy += 900 * dt; var ox = p.x, oy = p.y; p.x += p.vx * dt; p.y += p.vy * dt; var f2 = 1 - p.l / p.m; c.strokeStyle = 'rgba(255,' + Math.round(180 + 70 * f2) + ',' + Math.round(80 + 140 * f2 * f2) + ',' + f2 + ')'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ox - p.vx * 0.012, oy - p.vy * 0.012); c.lineTo(p.x, p.y); c.stroke(); fxGlow(c, '255,236,170', p.x, p.y, 3, f2); }
      for (i = ST.length - 1; i >= 0; i--) { var st = ST[i]; st.l += dt; if (st.l > st.m) { ST.splice(i, 1); continue; } st.y += st.vy * dt; var sf = Math.sin(st.l / st.m * Math.PI); fxStar4(c, st.x, st.y, st.z * sf, sf, '#FFF7E0'); fxGlow(c, '253,224,71', st.x, st.y, st.z * 1.6, 0.5 * sf); }
      /* the hammer, swung from up and to the right */
      var hw0 = Math.max(40, Math.min(64, k.h * 1.05)), px = Math.min(s.w - 16, ix + 88), py = iy - hw0 * 0.3 - 92, L = Math.hypot(ix - px, iy - hw0 * 0.3 - py), base = Math.atan2(iy - hw0 * 0.3 - py, ix - px), ang = base + lift(t), ha = fxEnv(t, 0, 0.18, 2.2, 2.55);
      /* the swoosh of the swing: a soft streak from where the head was a moment ago */
      var aOld = base + lift(Math.max(0, t - 0.13)), span = ang - aOld;
      if (Math.abs(span) > 0.1) {
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'butt';
        for (var q2 = 0; q2 < 10; q2++) {
          var f0 = q2 / 10, f1 = (q2 + 1) / 10, al = ha * 0.3 * f1 * f1;
          c.strokeStyle = 'rgba(255,214,140,' + al + ')'; c.lineWidth = hw0 * 0.36;
          c.beginPath(); c.arc(px, py, L, aOld + span * f0, aOld + span * f1, span < 0); c.stroke();
          c.strokeStyle = 'rgba(255,247,214,' + Math.min(1, al * 2) + ')'; c.lineWidth = 1.4;
          c.beginPath(); c.arc(px, py, L + hw0 * 0.26, aOld + span * f0, aOld + span * f1, span < 0); c.stroke();
        }
      }
      var near = 0; HITS.forEach(function (h) { near = Math.max(near, Math.exp(-Math.abs(t - h) * 8)); });
      hammer(c, px, py, ang, L, ha, near);
      /* cooling into gold: a gold frame and a sheen that runs across it */
      var g = fxEnv(t, 1.95, 2.15, 2.5, 3.0);
      if (g > 0) {
        c.globalCompositeOperation = 'lighter';
        [[8, 0.2], [3, 0.6], [1.3, 1]].forEach(function (L2) { zBoxRing(c, k, 2, L2[0] < 2 ? 'rgb(255,247,214)' : 'rgb(234,179,8)', g * L2[1], L2[0]); });
        var sx = k.x - 40 + fxEase((t - 2.0) / 0.6) * (k.w + 80), sg = c.createLinearGradient(sx - 30, 0, sx + 30, 0); sg.addColorStop(0, 'rgba(255,236,170,0)'); sg.addColorStop(0.5, 'rgba(255,236,170,.55)'); sg.addColorStop(1, 'rgba(255,236,170,0)');
        c.save(); c.beginPath(); fxRR(c, k.x, k.y, k.w, k.h, 12); c.clip(); c.globalAlpha = g; c.fillStyle = sg; c.fillRect(k.x, k.y, k.w, k.h); c.restore();
      }
    };
  };

  /* ---------- the Beacon living theme: drawn behind the whole page ---------- */
  /* ---- Beacon: a lighthouse keeps watch over a dark sea. Its beam turns slowly, and the rain and fog shine only where the light passes ---- */
  FX_LIVING['prize-beacon'] = function (s) {
    var r = zRng(11), ST = [], RN = [], WV = [], FG = [], i, opt = s.opt || {};
    for (i = 0; i < 90; i++) { ST.push({ x: r(), y: r() * 0.66, z: 0.5 + r(), p: r() * FX_TAU }); }
    for (i = 0; i < 420; i++) { RN.push({ x: r(), y: r(), v: 0.8 + r() * 0.5, l: 0.7 + r() * 0.7 }); }
    for (i = 0; i < 80; i++) { WV.push({ x: r(), d: r(), w: 0.5 + r() * 0.8, p: r() * FX_TAU }); }
    for (i = 0; i < 6; i++) { FG.push({ x: r() * 1.4 - 0.2, y: 0.5 + r() * 0.3, v: 5 + r() * 9, z: 0.6 + r() * 0.6 }); }
    var ROCK = [[-0.66, 0.03], [-0.52, -0.04], [-0.4, -0.07], [-0.26, -0.12], [-0.1, -0.13], [0.08, -0.16], [0.26, -0.12], [0.46, -0.09], [0.7, -0.06], [1.4, -0.02], [1.4, 0.14], [-0.66, 0.14]];
    /* how strongly a point sits inside the beam: 0 outside, up to 1 near the lamp on the beam's line */
    function inBeam(B, x, y, pad) {
      var dx = x - B.x, dy = y - B.y, al = dx * B.cx + dy * B.sy, pe = -dx * B.sy + dy * B.cx;
      if (al <= 0 || al > B.len) { return 0; }
      var q = Math.abs(pe) / (B.w0 + al * B.sp + (pad || 0));
      return q >= 1 ? 0 : (1 - q) * (1 - al / B.len);
    }
    function cone(c, B, mult, a) {
      var L = B.len, h0 = B.w0 * mult, h1 = (B.w0 + L * B.sp) * mult, ex = B.x + B.cx * L, ey = B.y + B.sy * L, nx = -B.sy, ny = B.cx;
      var g = c.createLinearGradient(B.x, B.y, ex, ey);
      g.addColorStop(0, 'rgba(255,232,180,' + a + ')'); g.addColorStop(0.35, 'rgba(255,214,140,' + (a * 0.45) + ')'); g.addColorStop(1, 'rgba(255,214,140,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(B.x + nx * h0, B.y + ny * h0); c.lineTo(ex + nx * h1, ey + ny * h1); c.lineTo(ex - nx * h1, ey - ny * h1); c.lineTo(B.x - nx * h0, B.y - ny * h0); c.closePath(); c.fill();
    }
    return function (t, dt) {
      var c = s.ctx, W = s.w, H = s.h, hy = Math.round(H * 0.74), th = Math.max(110, Math.min(230, H * 0.34)), tx = W - Math.max(64, Math.min(160, W * 0.11));
      var base = hy - th * 0.08, top = base - th, tw = th * 0.085, bw = th * 0.13, gy = top + th * 0.2, lx = tx, ly = top + th * 0.13;
      /* in the arrival, the lamp lights for the first time; otherwise it is always lit */
      var lit = opt.lit === undefined ? 1 : fxEase((t - opt.lit) / 0.8), on = opt.lit === undefined ? 1 : fxEase((t - opt.lit - 0.5) / 1.2);
      var ph = t * FX_TAU / 10 * (opt.speed || 1) - 1.29 + (opt.ph || 0), cx = Math.cos(ph), sn = Math.sin(ph), dir = cx >= 0 ? 1 : -1, ang = dir > 0 ? 0.03 : Math.PI - 0.03;
      var B = { x: lx, y: ly, cx: Math.cos(ang), sy: Math.sin(ang), len: Math.max(W, H) * 1.25 * Math.pow(Math.abs(cx), 0.7) * on, sp: 0.05 + 0.22 * Math.pow(1 - Math.abs(cx), 2), w0: th * 0.04, inten: (0.45 + 0.55 * (0.5 + 0.5 * sn)) * on };
      var flash = Math.pow(Math.max(0, sn), 18) * on;
      /* the sea is a shade darker than the sky */
      c.globalCompositeOperation = 'source-over';
      var sg = c.createLinearGradient(0, hy, 0, H); sg.addColorStop(0, 'rgba(2,7,14,.5)'); sg.addColorStop(1, 'rgba(1,4,9,.78)'); c.fillStyle = sg; c.fillRect(0, hy, W, H - hy);
      c.globalCompositeOperation = 'lighter';
      var hz = c.createLinearGradient(0, hy - H * 0.2, 0, hy + H * 0.05); hz.addColorStop(0, 'rgba(60,95,140,0)'); hz.addColorStop(0.8, 'rgba(60,95,140,.16)'); hz.addColorStop(1, 'rgba(60,95,140,0)'); c.fillStyle = hz; c.fillRect(0, hy - H * 0.2, W, H * 0.25);
      c.strokeStyle = 'rgba(150,180,220,.22)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, hy + 0.5); c.lineTo(W, hy + 0.5); c.stroke();
      /* stars */
      ST.forEach(function (q) { var y = q.y * H; if (y > hy - 12) { return; } var tw2 = 0.5 + 0.5 * Math.sin(t * (0.8 + q.z) + q.p); fxGlow(c, '255,255,255', q.x * W, y, 1 + q.z * 0.8 + tw2 * 0.6, 0.16 + 0.36 * tw2 * q.z / 1.5); });
      /* banks of fog drift by low over the water, and glow where the beam catches them (flat, so they cost a phone less to draw) */
      FG.forEach(function (f) {
        f.x += f.v * dt / W; if (f.x > 1.3) { f.x = -0.3; }
        var fx = f.x * W, fy = f.y * H, fr = W * 0.2 * f.z + 120, lb = inBeam(B, fx, fy, fr * 0.5);
        c.save(); c.translate(fx, fy); c.scale(1, 0.42); fxGlow(c, '96,128,170', 0, 0, fr, 0.08); if (lb > 0) { fxGlow(c, '255,214,150', 0, 0, fr * 0.8, 0.18 * lb * B.inten); } c.restore();
      });
      /* a ship's light far out on the horizon */
      var shx = ((t * 7 + W * 0.3) % (W + 160)) - 80, blink = 0.6 + 0.4 * Math.sin(t * 2.2);
      fxGlow(c, '248,113,113', shx, hy - 3, 3.4, 0.8 * blink); fxGlow(c, '248,113,113', shx, hy - 3, 10, 0.25 * blink);
      c.strokeStyle = 'rgba(248,113,113,' + (0.25 * blink) + ')'; c.beginPath(); c.moveTo(shx, hy + 3); c.lineTo(shx, hy + 12); c.stroke();
      /* the beam */
      if (B.len > 2) { [[2.8, 0.05], [2.2, 0.06], [1.7, 0.07], [1.3, 0.08], [0.95, 0.1], [0.65, 0.12], [0.4, 0.13], [0.18, 0.15]].forEach(function (L) { cone(c, B, L[0], L[1] * B.inten); }); }
      /* rain, seen only where the light falls on it */
      var fall = 1.1 * dt;
      c.lineWidth = 1; c.lineCap = 'round';
      RN.forEach(function (d) {
        d.y += d.v * fall; d.x -= 0.25 * d.v * fall * H / W; if (d.y > 1) { d.y -= 1; d.x = Math.random(); } if (d.x < 0) { d.x += 1; }
        if (B.len < 4) { return; }
        var x = d.x * W, y = d.y * H; if (y > hy) { return; }
        var lb = inBeam(B, x, y, 6); if (lb <= 0) { return; }
        var Ls = d.l * 16; c.strokeStyle = 'rgba(214,230,255,' + Math.min(1, lb * B.inten * 1.3) + ')';
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + 0.25 * Ls, y - Ls); c.stroke();
      });
      /* the water: glints that drift, a gold sheen under the beam, and the lamp's reflection */
      var mid = lx + B.cx * B.len * 0.5, half = Math.max(1, B.len * 0.5);
      WV.forEach(function (q) {
        var y = hy + 3 + Math.pow(q.d, 1.7) * (H - hy - 6), L = (6 + 46 * q.d) * q.w, x = ((q.x + t * 0.006 * (0.4 + q.d)) % 1) * (W + 100) - 50, by = y + Math.sin(t * 1.3 + q.p) * (0.5 + q.d * 2);
        c.strokeStyle = 'rgba(170,200,235,' + ((0.05 + 0.12 * q.d) * (0.6 + 0.4 * Math.sin(t * 0.9 + q.p))) + ')'; c.beginPath(); c.moveTo(x - L / 2, by); c.lineTo(x + L / 2, by); c.stroke();
        var gl = Math.max(0, 1 - Math.abs(x - mid) / half) * B.inten * Math.abs(cx) * (1 - q.d * 0.5) * 0.5 + Math.max(0, 1 - Math.abs(x - lx) / (20 + q.d * 60)) * 0.7 * lit;
        if (gl > 0.02) { c.strokeStyle = 'rgba(245,181,71,' + Math.min(1, gl) + ')'; c.beginPath(); c.moveTo(x - L * 0.3, by); c.lineTo(x + L * 0.3, by); c.stroke(); }
      });
      if (B.len > 40) { c.save(); c.translate(lx + B.cx * B.len * 0.45, hy + 10); c.scale(1, 0.08); fxGlow(c, '255,214,140', 0, 0, B.len * 0.45, 0.22 * B.inten); c.restore(); }
      for (i = 0; i < 19; i++) { var ry = hy + 4 + i * (H - hy) * 0.8 / 19, rw = 3 + i * 1.6, ra = 0.45 * (1 - i / 20) * (0.55 + 0.45 * Math.sin(t * 2.6 + i * 1.9)) * lit, rx = lx + Math.sin(t * 1.7 + i) * 3; c.strokeStyle = 'rgba(245,181,71,' + ra + ')'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(rx - rw, ry); c.lineTo(rx + rw, ry); c.stroke(); }
      c.lineWidth = 1;
      fxGlow(c, '245,181,71', lx, ly, th * 0.5, 0.42 * lit);
      /* the lighthouse, dark against the sky, with two warm windows */
      c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#0A1828'; c.beginPath(); c.moveTo(tx - bw, base); c.lineTo(tx - tw, gy); c.lineTo(tx + tw, gy); c.lineTo(tx + bw, base); c.closePath(); c.fill();
      [0.36, 0.66].forEach(function (f) { var y0 = gy + (base - gy) * f, w0 = tw + (bw - tw) * f; c.fillStyle = '#0E2134'; c.fillRect(tx - w0, y0, w0 * 2, th * 0.07); });
      c.strokeStyle = 'rgba(140,170,210,.2)'; c.beginPath(); c.moveTo(tx - bw, base); c.lineTo(tx - tw, gy); c.stroke();
      [0.3, 0.58].forEach(function (f) { var y0 = gy + (base - gy) * f; c.fillStyle = 'rgba(245,181,71,' + (0.55 * lit + 0.15) + ')'; c.fillRect(tx - th * 0.012, y0, th * 0.024, th * 0.04); });
      c.fillStyle = '#0C1B2C'; c.fillRect(tx - tw * 1.5, gy - 3, tw * 3, 4);
      c.strokeStyle = '#13283F'; c.beginPath(); c.moveTo(tx - tw * 1.5, gy - 9); c.lineTo(tx + tw * 1.5, gy - 9); for (i = 0; i <= 6; i++) { var px = tx - tw * 1.5 + i * tw * 0.5; c.moveTo(px, gy - 9); c.lineTo(px, gy - 3); } c.stroke();
      var lr = c.createLinearGradient(0, top + th * 0.06, 0, gy - 3); lr.addColorStop(0, 'rgba(255,236,190,' + (0.25 + 0.7 * lit) + ')'); lr.addColorStop(1, 'rgba(245,181,71,' + (0.2 + 0.65 * lit) + ')');
      c.fillStyle = lit > 0.02 ? lr : '#0E2134'; c.fillRect(tx - tw * 0.8, top + th * 0.06, tw * 1.6, gy - 3 - (top + th * 0.06));
      c.strokeStyle = '#0A1828'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(tx - tw * 0.27, top + th * 0.06); c.lineTo(tx - tw * 0.27, gy - 3); c.moveTo(tx + tw * 0.27, top + th * 0.06); c.lineTo(tx + tw * 0.27, gy - 3); c.stroke();
      c.fillStyle = '#0A1828'; c.beginPath(); c.ellipse(tx, top + th * 0.065, tw * 0.95, th * 0.055, 0, Math.PI, FX_TAU); c.fill();
      c.lineWidth = 1.5; c.strokeStyle = '#0A1828'; c.beginPath(); c.moveTo(tx, top + th * 0.01); c.lineTo(tx, top - th * 0.03); c.stroke(); c.beginPath(); c.arc(tx, top - th * 0.035, 2, 0, FX_TAU); c.fillStyle = '#0A1828'; c.fill();
      /* the rock it stands on */
      c.fillStyle = '#030A12'; c.beginPath(); ROCK.forEach(function (p, n) { var x = tx + p[0] * th, y = hy + p[1] * th; if (n) { c.lineTo(x, y); } else { c.moveTo(x, y); } }); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(120,150,190,.16)'; c.lineWidth = 1; c.beginPath(); for (i = 0; i < 10; i++) { var x2 = tx + ROCK[i][0] * th, y2 = hy + ROCK[i][1] * th; if (i) { c.lineTo(x2, y2); } else { c.moveTo(x2, y2); } } c.stroke();
      /* the lamp, and a great flash each time the beam turns toward you */
      c.globalCompositeOperation = 'lighter';
      fxGlow(c, '255,236,190', lx, ly, th * 0.1, 0.9 * lit);
      if (flash > 0.01) {
        fxGlow(c, '255,240,205', lx, ly, th * (0.6 + 1.6 * flash), 0.85 * flash);
        c.save(); c.translate(lx, ly); c.scale(1, 0.05); fxGlow(c, '255,226,170', 0, 0, W * 0.55 * flash + 1, 0.75 * flash); c.restore();
        fxStar4(c, lx, ly, th * 0.5 * flash, flash, '#FFF7E0');
        c.fillStyle = 'rgba(245,181,71,' + (0.06 * flash) + ')'; c.fillRect(0, 0, W, H);
      }
    };
  };
  FX_LIVE_THEMES['prize-beacon'] = 1;

  /* ---------- the Gyre paper: drawn behind the whole page, on light pages and dark ones ---------- */
  /* ---- Gyre: a slow spiral current of tiny glowing sea life turns behind the page, and now and then a school of fish swims through ---- */
  FX_PAPER.gyre = function (s) {
    var P = [], FS = [], i, area = 0;
    function seed() {
      P = []; area = s.w * s.h;
      var N = Math.max(260, Math.min(900, Math.round(area / 1400)));
      for (var j = 0; j < N; j++) { P.push({ arm: j % 3, r: Math.pow(Math.random(), 0.75) * 0.97 + 0.03, off: (Math.random() - 0.5) * 0.24 * (Math.random() < 0.15 ? 2.2 : 1), z: fxR(0.5, 1.4), p: fxR(0, 6), v: Math.random() < 0.1 }); }
    }
    for (i = 0; i < 18; i++) { FS.push({ o: fxR(-1, 1), d: fxR(0, 0.25), z: fxR(0.8, 1.2) }); }
    function fish(c, x, y, ang, L, col) { c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, L, L * 0.32, 0, 0, FX_TAU); c.fill(); c.beginPath(); c.moveTo(-L * 0.8, 0); c.lineTo(-L * 1.5, -L * 0.42); c.lineTo(-L * 1.5, L * 0.42); c.closePath(); c.fill(); c.restore(); }
    return function (t, dt) {
      if (s.w * s.h !== area) { seed(); }
      var c = s.ctx, W = s.w, H = s.h, D = FX_INK.dark, cx = W * 0.5, cy = H * 0.42, RM = Math.max(W, H) * 0.62, spin = t * 0.05;
      if (D) {
        c.globalCompositeOperation = 'lighter';
        for (i = 0; i < 3; i++) { fxBeam(c, W * (0.25 + i * 0.25) + Math.sin(t * 0.2 + i) * 30, -30, Math.PI / 2 + 0.16 * (i - 1), H * 1.2, 0.07, 'rgba(103,232,249,.05)'); }
        fxGlow(c, '45,212,191', cx, cy, RM * 0.35, 0.12);
      } else { c.globalCompositeOperation = 'source-over'; }
      /* the three arms of the current, as soft bands */
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (var arm = 0; arm < 3; arm++) {
        c.beginPath();
        for (var q2 = 0; q2 <= 60; q2++) { var rr = 0.05 + q2 / 60 * 0.95, an = arm * FX_TAU / 3 + Math.log(rr) * 2.4 + spin, px = cx + Math.cos(an) * rr * RM, py = cy + Math.sin(an) * rr * RM * 0.75; if (q2) { c.lineTo(px, py); } else { c.moveTo(px, py); } }
        (D ? [[46, '45,212,191', 0.022], [28, '45,212,191', 0.028], [14, '103,232,249', 0.035], [5, '103,232,249', 0.04]] : [[42, '14,116,144', 0.018], [24, '14,116,144', 0.022], [10, '14,116,144', 0.026]]).forEach(function (L) { c.strokeStyle = 'rgba(' + L[1] + ',' + L[2] + ')'; c.lineWidth = L[0]; c.stroke(); });
      }
      P.forEach(function (q) {
        var ang = q.arm * FX_TAU / 3 + Math.log(q.r) * 2.4 + spin + q.off + Math.sin(t * 0.3 + q.p) * 0.02, R = q.r * RM, x = cx + Math.cos(ang) * R, y = cy + Math.sin(ang) * R * 0.75;
        if (x < -10 || x > W + 10 || y < -10 || y > H + 10) { return; }
        var tw = 0.55 + 0.45 * Math.sin(t * 1.6 + q.p);
        if (D) { fxGlow(c, q.v ? '196,181,253' : '103,232,249', x, y, 1.4 + q.z * 1.8, tw * (0.45 + 0.45 * (1 - q.r))); }
        else { c.globalAlpha = (0.18 + 0.26 * (1 - q.r)) * tw; c.fillStyle = q.v ? '#7C3AED' : '#0E7490'; c.beginPath(); c.arc(x, y, 0.8 + q.z * 0.9, 0, FX_TAU); c.fill(); c.globalAlpha = 1; }
      });
      /* every sixteen seconds a school of fish follows the current round */
      var fu = (t % 16) / 5;
      if (fu < 1.3) {
        FS.forEach(function (f) {
          var v = fu - f.d; if (v <= 0 || v >= 1) { return; }
          var al = Math.PI * 0.9 - v * Math.PI * 1.25, Rr = RM * 0.42 * (1 + f.o * 0.16), x = cx + Math.cos(al) * Rr, y = cy + Math.sin(al) * Rr * 0.75, dir = Math.atan2(-Math.cos(al) * 0.75, Math.sin(al)), fa = Math.sin(v * Math.PI);
          if (D) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '103,232,249', x, y, 9 * f.z, 0.25 * fa); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.75 * fa; fish(c, x, y, dir, 7 * f.z, 'rgb(165,243,252)'); }
          else { c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.32 * fa; fish(c, x, y, dir, 7 * f.z, '#0E7490'); }
          c.globalAlpha = 1;
        });
      }
    };
  };

  /* ---------- the Learning tree streak style (fxStreakIcon draws it; its colors and motion are in prizes.css) ---------- */
  /* Learning tree: a glowing seed, then a sapling at 7 days, a full tree at 30, and at 100 a great tree with lanterns and a beating golden heart */
  function zTreeIcon(n) {
    var soil = '<path class="zt-soil" d="M5 45h38"/>';
    if (n < 7) { return '<svg class="pz-si zt" viewBox="0 0 48 48" aria-hidden="true">' + soil + '<circle class="zt-halo" cx="24" cy="41" r="7"/><ellipse class="zt-seed" cx="24" cy="41.5" rx="4" ry="2.8"/></svg>'; }
    if (n < 30) { return '<svg class="pz-si zt" viewBox="0 0 48 48" aria-hidden="true">' + soil + '<circle class="zt-halo" cx="24" cy="40" r="6"/><path class="zt-trunk" d="M24 45V29" stroke-width="2.4"/><g class="zt-crown" style="transform-origin:24px 32px"><path class="zt-leaf" d="M24 33c-6 0-9-4-9-8 5 0 9 3 9 8z"/><path class="zt-leaf2" d="M24 30c5 0 8-4 8-8-5 0-8 3-8 8z"/></g><circle class="zt-heart" cx="24" cy="41" r="1.6"/></svg>'; }
    if (n < 100) {
      var cr = [[24, 13, 7, 2], [15.5, 17, 6, 1], [32.5, 17, 6, 3], [11, 24, 5, 2], [37, 24, 5, 1], [19, 22.5, 6.5, 3], [29, 22.5, 6.5, 2], [24, 20, 6.5, 1]].map(function (q) { return '<circle class="zt-leaf' + q[3] + '" cx="' + q[0] + '" cy="' + q[1] + '" r="' + q[2] + '"/>'; }).join('');
      return '<svg class="pz-si zt" viewBox="0 0 48 48" aria-hidden="true">' + soil + '<circle class="zt-glowc" cx="24" cy="19" r="16"/><path class="zt-trunk" d="M24 45C24 38 23.5 33 24 27" stroke-width="3.4"/><path class="zt-trunk" d="M24 31C20 28 17 26 15 22M24 29C28 26 31 24 33 20" stroke-width="2"/><g class="zt-crown" style="transform-origin:24px 28px">' + cr + '</g><circle class="zt-heart" cx="24" cy="37" r="1.8"/></svg>';
    }
    var cr2 = [[30, 11, 8, 2], [20, 14, 7, 1], [40, 14, 7, 3], [13, 21, 6, 2], [47, 21, 6, 1], [23, 20, 7.5, 3], [37, 20, 7.5, 2], [30, 18, 7.5, 1], [17, 27, 5.5, 3], [43, 27, 5.5, 2]].map(function (q) { return '<circle class="zt-leaf' + q[3] + '" cx="' + q[0] + '" cy="' + q[1] + '" r="' + q[2] + '"/>'; }).join('');
    var lan = [[11, 26.5, 35], [49, 26.5, 35]].map(function (q, i) { return '<path class="zt-string" d="M' + q[0] + ' ' + q[1] + 'V' + (q[2] - 2.2) + '"/><circle class="zt-lanhalo" cx="' + q[0] + '" cy="' + q[2] + '" r="4.8"/><circle class="zt-lanhalo zt-in" cx="' + q[0] + '" cy="' + q[2] + '" r="3.5"/><rect class="zt-lan zt-lan' + i + '" x="' + (q[0] - 1.9) + '" y="' + (q[2] - 2.4) + '" width="3.8" height="4.8" rx="1.3"/><circle class="zt-lancore" cx="' + q[0] + '" cy="' + q[2] + '" r="1"/>'; }).join('');
    var spk = [[8, 7], [52, 5], [55, 30]].map(function (q, i) { return '<path class="zt-spark zt-spark' + i + '" d="M' + q[0] + ' ' + (q[1] - 3) + 'l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>'; }).join('');
    return '<svg class="pz-si zt zt-great" viewBox="0 0 60 52" aria-hidden="true"><path class="zt-soil" d="M4 49h52"/><ellipse class="zt-glowc" cx="30" cy="19" rx="25" ry="18"/><path class="zt-trunk" d="M30 49C30 41 29 35 30 27" stroke-width="4.4"/><path class="zt-trunk" d="M30 35C25 31 21 28 18 23M30 32C35 28 39 26 42 21M30 29C30 24 29 21 30 16" stroke-width="2.4"/><g class="zt-crown" style="transform-origin:30px 30px">' + cr2 + lan + '</g><circle class="zt-halo" cx="30" cy="40" r="5"/><circle class="zt-heart" cx="30" cy="40" r="2.2"/>' + spk + '</svg>';
  }

  /* ---------- arrivals: the scene that plays when one of the nine is won ---------- */
  /* two drawings that only the arrivals use. zEclipse: a total eclipse, with a corona that streams out and, every ten seconds,
     the diamond ring (Diamond ring's arrival). zGrove: a tree of light whose size follows s.opt.days and whose leaves follow
     s.opt.season (Learning tree's arrival). Neither is a prize of its own. */
  var zEclipse = function (s) {
    var ST = [], SR = [], i;
    for (i = 0; i < 42; i++) { ST.push({ x: Math.random(), y: Math.random(), z: fxR(0.4, 1.2), p: fxR(0, FX_TAU) }); }
    for (i = 0; i < 70; i++) {
      var a = i / 70 * FX_TAU + fxR(-0.04, 0.04), eq = Math.pow(Math.abs(Math.cos(a)), 1.3);
      SR.push({ a: a, L: fxR(0.35, 1) * (0.45 + 1.1 * eq), w: fxR(0.025, 0.07) * (0.6 + 0.8 * eq), b: fxR(0.5, 1), ph: fxR(0, FX_TAU), sp: fxR(0.25, 0.6), cu: fxR(-0.35, 0.35) });
    }
    var PR = [{ a: -2.5, h: 0.17, w: 0.26, ph: 0 }, { a: 0.45, h: 0.12, w: 0.18, ph: 2 }, { a: 2.55, h: 0.15, w: 0.22, ph: 4 }, { a: 1.6, h: 0.07, w: 0.12, ph: 1 }];
    return function (t) {
      var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, m = Math.min(s.w, s.h), R = m * 0.25, cyc = t % 10;
      var dia = fxEnv(cyc, 7.7, 8.05, 8.45, 9.5), beads = fxEnv(cyc, 7.25, 7.5, 7.75, 8.0), dim = 1 - 0.6 * dia;
      /* the sky darkens toward the edges, blue near the sun */
      var g = c.createRadialGradient(x0, y0, R, x0, y0, Math.max(s.w, s.h) * 0.8);
      g.addColorStop(0, 'rgba(28,42,96,.75)'); g.addColorStop(0.5, 'rgba(10,16,44,.55)'); g.addColorStop(1, 'rgba(3,4,14,.2)');
      c.fillStyle = g; c.fillRect(0, 0, s.w, s.h);
      c.globalCompositeOperation = 'lighter';
      ST.forEach(function (q) { var tw = 0.5 + 0.5 * Math.sin(t * 1.6 * q.z + q.p); fxGlow(c, '220,228,255', q.x * s.w, q.y * s.h, 1.1 + 1.5 * q.z, (0.2 + 0.5 * tw) * q.z * (1 - 0.7 * dia)); });
      /* the corona: pearly streamers, longest along the equator, slowly flowing */
      fxGlow(c, '190,205,255', x0, y0, R * 3.1, 0.42 * dim);
      fxGlow(c, '255,246,232', x0, y0, R * 1.55, 0.75 * dim);
      var cg = c.createRadialGradient(x0, y0, R * 0.95, x0, y0, R * 3.4);
      cg.addColorStop(0, 'rgba(246,248,255,.9)'); cg.addColorStop(0.25, 'rgba(220,230,255,.42)'); cg.addColorStop(0.6, 'rgba(190,206,255,.12)'); cg.addColorStop(1, 'rgba(180,200,255,0)');
      c.fillStyle = cg;
      SR.forEach(function (q) {
        var a0 = q.a + t * 0.008, len = R * (0.35 + q.L * 1.9) * (0.9 + 0.1 * Math.sin(t * q.sp + q.ph)), bend = q.cu + 0.12 * Math.sin(t * q.sp * 0.7 + q.ph);
        var ta = a0 + bend * 0.3, ma = a0 + bend * 0.12, rt = R + len, rm = R + len * 0.45;
        c.globalAlpha = q.b * 0.55 * dim; c.beginPath();
        c.moveTo(x0 + Math.cos(a0 - q.w) * R, y0 + Math.sin(a0 - q.w) * R);
        c.quadraticCurveTo(x0 + Math.cos(ma - q.w * 0.45) * rm, y0 + Math.sin(ma - q.w * 0.45) * rm, x0 + Math.cos(ta) * rt, y0 + Math.sin(ta) * rt);
        c.quadraticCurveTo(x0 + Math.cos(ma + q.w * 0.45) * rm, y0 + Math.sin(ma + q.w * 0.45) * rm, x0 + Math.cos(a0 + q.w) * R, y0 + Math.sin(a0 + q.w) * R);
        c.closePath(); c.fill();
      });
      c.globalAlpha = 1;
      /* prominences: small loops of pink fire at the rim */
      PR.forEach(function (p) {
        for (var k = 0; k <= 18; k++) {
          var u = k / 18, a = p.a + (u - 0.5) * p.w, hh = Math.sin(u * Math.PI) * R * p.h * (0.8 + 0.2 * Math.sin(t * 1.4 + p.ph + u * 4));
          fxGlow(c, '255,84,128', x0 + Math.cos(a) * (R + hh), y0 + Math.sin(a) * (R + hh), R * 0.07 + 1.5, 0.7 * dim);
        }
      });
      /* the moon */
      c.globalCompositeOperation = 'source-over';
      var mg = c.createRadialGradient(x0 - R * 0.3, y0 - R * 0.3, R * 0.1, x0, y0, R);
      mg.addColorStop(0, '#0B0D18'); mg.addColorStop(1, '#010103');
      c.fillStyle = mg; c.beginPath(); c.arc(x0, y0, R, 0, FX_TAU); c.fill();
      c.globalCompositeOperation = 'lighter';
      c.lineWidth = 1.4; c.strokeStyle = 'rgba(255,196,214,' + (0.55 + 0.35 * dim) + ')'; c.beginPath(); c.arc(x0, y0, R + 0.6, 0, FX_TAU); c.stroke();
      /* Baily's beads, then the diamond ring */
      var da = -0.78, dx = x0 + Math.cos(da) * R, dy = y0 + Math.sin(da) * R;
      if (beads > 0) { for (var b = 0; b < 6; b++) { var ba = da + (b - 2.5) * 0.11; fxGlow(c, '255,250,236', x0 + Math.cos(ba) * R, y0 + Math.sin(ba) * R, 3 + 2 * Math.abs(Math.sin(t * 17 + b)), beads * (0.5 + 0.5 * Math.abs(Math.sin(t * 11 + b * 2)))); } }
      if (dia > 0) {
        fxGlow(c, '255,255,255', dx, dy, R * 1.1 * dia + 4, dia);
        fxGlow(c, '255,240,205', dx, dy, R * 2.6 * dia, 0.55 * dia);
        fxStar4(c, dx, dy, R * 1.25 * dia, dia, '#FFFFFF');
        c.globalAlpha = 0.55 * dia; c.fillStyle = '#FFFFFF'; c.fillRect(dx - s.w * 0.45 * dia, dy - 0.7, s.w * 0.9 * dia, 1.4); c.globalAlpha = 1;
      }
    };
  };
  var zGrove = function (s) {
    var BR = [], LV = [], SEED = [], SNOW = [], built = '', info = null, i;
    var GLY = ['a', 'b', 'x', 'y', 'π', '√', 'Σ', 'Δ', 'θ', '%', '=', '?', 'n', '÷'];
    var SEAS = {
      spring: { leaf: ['134,239,172', '187,247,208', '244,114,182', '251,207,232'], glyph: '#FDF2F8', ground: '134,239,172' },
      summer: { leaf: ['34,197,94', '74,222,128', '163,230,53', '250,204,21'], glyph: '#F7FEE7', ground: '74,222,128' },
      fall: { leaf: ['249,115,22', '251,146,60', '234,179,8', '220,38,38'], glyph: '#FEF3C7', ground: '251,146,60' },
      winter: { leaf: ['125,211,252', '165,180,252', '186,230,253', '224,242,254'], glyph: '#F0F9FF', ground: '147,197,253' }
    };
    function opts() { var o = s.opt || {}, n = o.days || 30, sea = o.season || ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter'][new Date().getMonth()]; return { stage: n >= 100 ? 3 : n >= 30 ? 2 : n >= 7 ? 1 : 0, season: sea }; }
    /* a round crown: limbs fan out from the top of the trunk, split twice or three times, and end in clusters of leaves */
    function build(stage) {
      var r = zRng(97 + stage * 31), limbs = [4, 6, 8, 10][stage], depth = [1, 2, 2, 3][stage];
      BR = []; LV = [];
      var trunk = { par: null, a: -Math.PI / 2, len: 1, d: 0, w: [2.4, 3.8, 5.2, 6.4][stage], sw: 0 };
      BR.push(trunk);
      function br(par, a, len, d, wid) {
        var b = { par: par, a: a, len: len, d: d, w: wid, sw: r() * 6 };
        BR.push(b);
        if (d < depth + 1) { for (var j = 0; j < 2; j++) { br(b, (j ? 1 : -1) * (0.32 + 0.3 * r()), len * (0.62 + 0.12 * r()), d + 1, wid * 0.62); } }
        else { var nl = 4 + Math.floor(r() * 3); for (var q = 0; q < nl; q++) { LV.push({ b: b, ox: r() * 2 - 1, oy: r() * 2 - 1, z: 0.6 + r() * 0.7, c: Math.floor(r() * 4), g: r() < 0.14 ? GLY[Math.floor(r() * GLY.length)] : '', p: r() * 6 }); } }
        if (stage === 3 && d === 2 && r() < 0.45) { LV.push({ b: b, lantern: 1, p: r() * 6 }); }
      }
      for (var k = 0; k < limbs; k++) { var u = limbs === 1 ? 0.5 : k / (limbs - 1), a = (-Math.PI - 0.32) + u * (Math.PI + 0.64) + (r() - 0.5) * 0.18; br(trunk, a + Math.PI / 2, 0.5 + 0.12 * r(), 1, trunk.w * 0.55); }
      return { stage: stage, cy: [0.8, 0.56, 0.5, 0.47][stage], cr: [0.14, 0.27, 0.36, 0.4][stage] };
    }
    return function (t, dt) {
      var c = s.ctx, o = opts(), key = o.stage + ':' + Math.round(s.w) + 'x' + Math.round(s.h), P = SEAS[o.season], H = s.h, W = s.w, x0 = W / 2;
      if (key !== built) { info = build(o.stage); built = key; SEED = []; }
      var yc = H * info.cy, CR = H * info.cr, ex = Math.min(1.9, W / H * 0.95), wind = Math.sin(t * 0.8) * 0.6 + Math.sin(t * 1.9 + 1) * 0.25, depthMax = 4, pulse = (t * 1.1) % (depthMax + 3.2) - 1.2;
      /* ground glow and roots */
      c.globalCompositeOperation = 'lighter';
      fxGlow(c, P.ground, x0, H + 8, H * 0.55, 0.32);
      fxGlow(c, '255,214,140', x0, yc, CR * 2.2, 0.1);
      var rootGlow = Math.max(0, 1 - Math.abs(pulse + 0.9) / 0.7);
      c.lineCap = 'round';
      for (i = 0; i < 6; i++) { var side = i % 2 ? 1 : -1, len = W * (0.12 + 0.05 * i); c.strokeStyle = 'rgba(255,214,150,' + (0.14 + 0.45 * rootGlow) + ')'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x0, H + 2); c.quadraticCurveTo(x0 + side * len * 0.4, H - 5 - i, x0 + side * len, H - 1 + (i % 3) * 2); c.stroke(); }
      /* place every branch: the trunk runs up to the crown, the limbs fan out, wider than tall to fill the plate */
      BR.forEach(function (b) {
        if (!b.par) { b.ang = -Math.PI / 2 + wind * 0.01; b.x = x0; b.y = H + 2; b.x2 = x0 + Math.cos(b.ang) * (H + 2 - yc); b.y2 = yc; return; }
        var pa = b.par.par ? b.par.ang : -Math.PI / 2, ang = pa + b.a + wind * 0.02 * b.d + Math.sin(t * 1.3 + b.sw) * 0.012 * b.d;
        b.ang = ang; b.x = b.par.x2; b.y = b.par.y2;
        b.x2 = b.x + Math.cos(ang) * b.len * CR * ex; b.y2 = b.y + Math.sin(ang) * b.len * CR;
      });
      BR.forEach(function (b) {
        var g = Math.exp(-Math.pow(b.d - pulse, 2) / 0.5), k = Math.max(0.7, b.w * H / 190);
        c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'rgba(66,44,30,.95)'; c.lineWidth = k + 0.8; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x2, b.y2); c.stroke();
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,206,130,' + (0.2 + 0.65 * g) + ')'; c.lineWidth = Math.max(0.8, k * 0.42); c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x2, b.y2); c.stroke();
        if (g > 0.35) { fxGlow(c, '255,224,160', (b.x + b.x2) / 2, (b.y + b.y2) / 2, 7 + k * 2, (g - 0.35) * 0.9); }
      });
      /* leaves: soft lights, a few of them letters and numbers; at 100 days, lanterns hang among them */
      var spread = CR * 0.2;
      c.globalCompositeOperation = 'lighter';
      c.font = '600 ' + Math.max(8, H * 0.052).toFixed(1) + 'px ' + FX_MONO; c.textAlign = 'center'; c.textBaseline = 'middle';
      LV.forEach(function (l) {
        var tw = 0.6 + 0.4 * Math.sin(t * 2.2 + l.p * 3);
        if (l.lantern) { var lx = l.b.x2 + Math.sin(t * 1.4 + l.p) * 2.5, ly = l.b.y2 + H * 0.07; c.strokeStyle = 'rgba(255,214,150,.45)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(l.b.x2, l.b.y2); c.lineTo(lx, ly); c.stroke(); fxGlow(c, '251,191,36', lx, ly, 10, 0.75 + 0.2 * tw); fxGlow(c, '255,247,214', lx, ly, 3.2, 1); return; }
        var x = l.b.x2 + l.ox * spread * ex + Math.sin(t * 1.7 + l.p) * 1.4, y = l.b.y2 + l.oy * spread + Math.cos(t * 1.3 + l.p) * 1.1;
        if (l.g) { fxGlow(c, P.leaf[l.c], x, y, 8 * l.z, 0.35 * tw); c.globalAlpha = 0.55 + 0.45 * tw; c.fillStyle = P.glyph; c.fillText(l.g, x, y); c.globalAlpha = 1; return; }
        fxGlow(c, P.leaf[l.c], x, y, (2.6 + 2.6 * l.z) * Math.max(0.8, H / 190), 0.3 + 0.35 * tw);
      });
      /* seeds of light lift off the crown and drift away */
      if (LV.length && Math.random() < dt * (1.5 + o.stage)) { var src = LV[Math.floor(Math.random() * LV.length)]; SEED.push({ x: src.b.x2, y: src.b.y2, vx: fxR(-8, 14), vy: fxR(-22, -10), l: 0, m: fxR(2.5, 4.5), p: fxR(0, 6) }); }
      for (i = SEED.length - 1; i >= 0; i--) { var q = SEED[i]; q.l += dt; if (q.l > q.m) { SEED.splice(i, 1); continue; } q.x += (q.vx + wind * 10) * dt; q.y += q.vy * dt; var fa = Math.sin(q.l / q.m * Math.PI), qx = q.x + Math.sin(q.l * 3 + q.p) * 4; fxGlow(c, '255,247,214', qx, q.y, 3.4, 0.75 * fa); fxStar4(c, qx, q.y, 3, 0.55 * fa, '#FFFFFF'); }
      if (o.season === 'winter') {
        if (SNOW.length < 30) { SNOW.push({ x: Math.random(), y: Math.random(), z: fxR(0.5, 1.3), p: fxR(0, 6) }); }
        SNOW.forEach(function (f) { f.y += dt * 0.05 * f.z; if (f.y > 1.05) { f.y = -0.05; f.x = Math.random(); } fxGlow(c, '255,255,255', f.x * W + Math.sin(t + f.p) * 6, f.y * H, 1.6 * f.z, 0.45); });
      }
    };
  };
  function zHsl(h, s, l) { h = (((h % 360) + 360) % 360) / 360; s /= 100; l /= 100; function f(n) { var k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); } return f(0) + ',' + f(8) + ',' + f(4); }
  /* draw another look on its own small canvas, so a scene can place it, fade it and grow it */
  function zSub(make, w, h, opt, mask) {
    var d = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(w * d)); cv.height = Math.max(1, Math.round(h * d));
    var ss = { c: cv, ctx: cv.getContext('2d'), w: w, h: h, opt: opt || {} }, draw = make(ss);
    return { cv: cv, w: w, h: h, step: function (t, dt) { var c = ss.ctx; c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h); fxClean(c); draw(t, dt); if (mask) { fxClean(c); c.globalCompositeOperation = 'destination-in'; zMask(c, w, h, mask); fxClean(c); } } };
  }
  /* fade a drawing out toward its edges: 'round' for a circle, or how far in to fade from each side */
  function zMask(c, w, h, m) {
    if (m === 'round') { var r = Math.min(w, h) / 2, g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); return; }
    var gx = c.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(0,0,0,' + (m.l ? 0 : 1) + ')'); gx.addColorStop(m.l || 0, 'rgba(0,0,0,1)'); gx.addColorStop(1 - (m.r || 0), 'rgba(0,0,0,1)'); gx.addColorStop(1, 'rgba(0,0,0,' + (m.r ? 0 : 1) + ')'); c.fillStyle = gx; c.fillRect(0, 0, w, h);
    var gy = c.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, 'rgba(0,0,0,' + (m.t ? 0 : 1) + ')'); gy.addColorStop(m.t || 0, 'rgba(0,0,0,1)'); gy.addColorStop(1 - (m.b || 0), 'rgba(0,0,0,1)'); gy.addColorStop(1, 'rgba(0,0,0,' + (m.b ? 0 : 1) + ')'); c.fillStyle = gy; c.fillRect(0, 0, w, h);
  }
  function zBlit(c, sub, x, y, a, sc, ox, oy) {
    if (!(a > 0)) { return; }
    c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = Math.min(1, a);
    if (sc && sc !== 1) { ox = ox === undefined ? x + sub.w / 2 : ox; oy = oy === undefined ? y + sub.h / 2 : oy; c.translate(ox, oy); c.scale(sc, sc); c.translate(-ox, -oy); }
    c.drawImage(sub.cv, x, y, sub.w, sub.h); c.restore();
  }
  /* every Radiant arrival opens the same way: a star climbs to the very top of the screen and flares */
  function zRise(c, s, t) {
    var x = s.w / 2, y0 = s.h * 0.96, y1 = s.h * 0.13, u = fxEase((t - 0.1) / 0.8), y = y0 + (y1 - y0) * u, a = fxEnv(t, 0.08, 0.2, 0.95, 1.3);
    c.globalCompositeOperation = 'lighter';
    if (a > 0) {
      var tl = Math.min(y0, y + s.h * 0.3), g = c.createLinearGradient(0, y, 0, tl); g.addColorStop(0, 'rgba(255,247,214,' + (0.6 * a) + ')'); g.addColorStop(1, 'rgba(255,247,214,0)');
      c.strokeStyle = g; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, tl); c.stroke();
      fxGlow(c, '253,224,71', x, y, 22, 0.7 * a); fxGlow(c, '255,255,255', x, y, 6, a);
    }
    var f = t - 0.9;
    if (f > 0 && f < 0.8) { var e = 1 - f / 0.8; fxStar4(c, x, y1, 8 + 34 * Math.sin(Math.min(1, f / 0.25) * Math.PI / 2) * e, e, '#FFF7E0'); fxGlow(c, '253,224,71', x, y1, 110 * e, 0.45 * e); fxRing(c, x, y1, 8 + f * 170, 3 + f * 42, '253,224,71', 0.7 * e, 1.2); }
  }
  /* the name at the end: RADIANT and the kind of look, the look's name, and how rare it is */
  function zTitle(c, s, t, t0, show, info, odds) {
    var u = t - t0, out = t < show - 0.12 ? 1 : Math.max(0, 1 - (t - show + 0.12) / 0.2);
    if (u <= 0 || out <= 0) { return; }
    var x = s.w / 2, y = s.h / 2, big = Math.round(Math.max(30, Math.min(58, s.w * 0.075))), R = Math.max(big * 5, s.w * 0.42);
    c.save(); c.globalCompositeOperation = 'source-over';
    var g = c.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, 'rgba(3,3,10,' + (0.66 * Math.min(1, u / 0.4) * out) + ')'); g.addColorStop(1, 'rgba(3,3,10,0)');
    c.fillStyle = g; c.fillRect(x - R, y - R, R * 2, R * 2);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    var la = Math.min(1, u / 0.35) * out;
    c.globalAlpha = la; c.fillStyle = '#FDE68A'; c.font = '700 ' + Math.max(11, Math.round(big * 0.27)) + 'px "DM Sans", system-ui, sans-serif';
    c.fillText(('RADIANT · ' + info[1].toUpperCase()).split('').join(' '), x, y - big * 1.0 + (1 - la) * 6);
    var nu = u - 0.18;
    if (nu > 0) {
      var sc = nu < 0.3 ? 1.4 - 0.4 * fxEase(nu / 0.3) : 1;
      c.translate(x, y); c.scale(sc, sc);
      c.globalAlpha = Math.min(1, nu / 0.2) * out; c.font = '800 ' + big + 'px "DM Sans", system-ui, sans-serif';
      c.shadowColor = 'rgba(' + info[2] + ',.95)'; c.shadowBlur = 28; c.fillStyle = '#FFFFFF'; c.fillText(info[0], 0, 0);
    }
    c.restore();
    zType(c, odds, x, y + big * 0.98, (u - 0.55) / 0.5, '600 ' + Math.max(13, Math.round(big * 0.38)) + 'px "DM Sans", system-ui, sans-serif', 'rgba(245,243,255,' + out + ')', null);
  }
  /* the moment the prize appears: a white flash and rings */
  function zFlash(c, s, t, show, rgb) {
    var u = t - show + 0.06; if (u <= 0) { return; }
    if (u < 0.35) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1 - u / 0.35; c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; }
    c.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 3; i++) { var v = (u - i * 0.12) / 1.0; if (v > 0 && v < 1) { fxRing(c, s.w / 2, s.h / 2, 20 + v * s.w * 0.75, 8 + v * s.h * 0.75, i === 1 ? '255,255,255' : rgb, 1 - v, 3.5 * (1 - v) + 0.6); } }
  }
  /* a brass gear, drawn in outline */
  function zGear(c, x, y, r, n, ang, col, a) {
    if (!(a > 0)) { return; }
    c.save(); c.translate(x, y); c.rotate(ang); c.globalAlpha = Math.min(1, a); c.strokeStyle = col; c.lineWidth = 1.6; c.lineJoin = 'round';
    var td = r * 0.12, i; c.beginPath();
    for (i = 0; i < n; i++) { var a0 = i / n * FX_TAU, w = FX_TAU / n; [[a0, r], [a0 + w * 0.12, r + td], [a0 + w * 0.45, r + td], [a0 + w * 0.57, r], [a0 + w, r]].forEach(function (p, j) { var px = Math.cos(p[0]) * p[1], py = Math.sin(p[0]) * p[1]; if (i === 0 && j === 0) { c.moveTo(px, py); } else { c.lineTo(px, py); } }); }
    c.closePath(); c.stroke();
    c.beginPath(); c.arc(0, 0, r * 0.72, 0, FX_TAU); c.stroke(); c.beginPath(); c.arc(0, 0, r * 0.16, 0, FX_TAU); c.stroke();
    for (i = 0; i < 5; i++) { var sa = i / 5 * FX_TAU; c.beginPath(); c.moveTo(Math.cos(sa) * r * 0.16, Math.sin(sa) * r * 0.16); c.lineTo(Math.cos(sa) * r * 0.72, Math.sin(sa) * r * 0.72); c.stroke(); }
    c.restore();
  }
  /* the hammer of light from Starforge */
  function zHammer(c, px, py, ang, L, a, glow, hw) {
    var hx = px + Math.cos(ang) * L, hy = py + Math.sin(ang) * L, hh = hw * 0.56;
    c.save(); c.globalAlpha = a; c.lineCap = 'round'; c.globalCompositeOperation = 'lighter';
    c.strokeStyle = 'rgba(251,146,60,.35)'; c.lineWidth = hw * 0.2; c.beginPath(); c.moveTo(px, py); c.lineTo(hx, hy); c.stroke();
    c.strokeStyle = 'rgba(255,220,160,.95)'; c.lineWidth = hw * 0.075; c.beginPath(); c.moveTo(px, py); c.lineTo(hx, hy); c.stroke();
    fxGlow(c, '251,191,36', hx, hy, hw * 1.3, 0.55 + 0.4 * glow);
    c.translate(hx, hy); c.rotate(ang + Math.PI / 2);
    var g = c.createLinearGradient(0, -hh / 2, 0, hh / 2); g.addColorStop(0, 'rgba(255,250,235,1)'); g.addColorStop(0.55, 'rgba(255,214,140,1)'); g.addColorStop(1, 'rgba(251,146,60,1)');
    c.globalCompositeOperation = 'source-over'; c.fillStyle = g; c.beginPath(); fxRR(c, -hw / 2, -hh / 2, hw, hh, hw * 0.08); c.fill();
    c.strokeStyle = 'rgba(180,83,9,.9)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-hw * 0.32, -hh / 2 + 2); c.lineTo(-hw * 0.32, hh / 2 - 2); c.moveTo(hw * 0.32, -hh / 2 + 2); c.lineTo(hw * 0.32, hh / 2 - 2); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,247,214,' + (0.7 + 0.3 * glow) + ')'; c.lineWidth = 1.6; c.beginPath(); fxRR(c, -hw / 2, -hh / 2, hw, hh, hw * 0.08); c.stroke();
    c.restore();
  }
  /* where each lit square of a pixel word sits, so the word can break apart */
  function zPixelBits(word, x, y, px) {
    var out = [], W = word.length * 6 * px - px, x0 = x - W / 2, y0 = y - 3.5 * px;
    for (var i = 0; i < word.length; i++) { var g = Z_PX[word[i]]; if (!g) { continue; } for (var r = 0; r < 7; r++) { for (var q = 0; q < 5; q++) { if (g[r][q] === '1') { out.push({ x: x0 + (i * 6 + q) * px, y: y0 + r * px, i: i }); } } } }
    return out;
  }

  var Z_SCENE = {
    /* ---- Diamond ring: the moon slides across the sun, the day goes dark, the stars come out, and the corona opens ---- */
    diamond: function (s) {
      var W = s.w, H = s.h, R = Math.min(W, H) * 0.15, cx = W / 2, cy = H * 0.5, sub = zSub(zEclipse, R * 4, R * 4, {}, 'round'), ST = [], i, ad = Math.atan2(-0.95, 2.7);
      for (i = 0; i < 90; i++) { ST.push({ x: Math.random(), y: Math.random(), p: fxR(0, 6), z: fxR(0.5, 1.5) }); }
      return function (t, dt, k) {
        var c = s.ctx, a = fxEnv(t, 0.6, 1.1, 99, 100) * k, u = fxEase((t - 0.85) / 2.3), mx = cx - (1 - u) * 2.7 * R, my = cy + (1 - u) * 0.95 * R;
        var f = Math.max(0, 1 - Math.hypot(mx - cx, my - cy) / (2 * R)), sun = u >= 1 ? 0 : 1 - Math.pow(f, 2.2);
        c.globalCompositeOperation = 'lighter';
        var sky = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.75); sky.addColorStop(0, 'rgba(130,170,230,' + (0.5 * sun * a) + ')'); sky.addColorStop(1, 'rgba(40,70,130,' + (0.22 * sun * a) + ')'); c.fillStyle = sky; c.fillRect(0, 0, W, H);
        var sa = Math.pow(1 - sun, 2) * a;
        ST.forEach(function (q) { var tw = 0.5 + 0.5 * Math.sin(t * 3 + q.p); fxGlow(c, '255,255,255', q.x * W, q.y * H, 1 + q.z * (0.8 + 0.5 * tw), sa * (0.25 + 0.5 * tw)); });
        fxGlow(c, '255,240,200', cx, cy, R * 4.2, 0.55 * sun * a); fxGlow(c, '255,250,235', cx, cy, R * 1.7, 0.85 * sun * a);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
        var sg = c.createRadialGradient(cx, cy, 0, cx, cy, R); sg.addColorStop(0, '#FFFFFF'); sg.addColorStop(0.75, '#FFF7DC'); sg.addColorStop(1, '#FFE6A0'); c.fillStyle = sg; c.beginPath(); c.arc(cx, cy, R, 0, FX_TAU); c.fill();
        var ca = fxEase((t - 3.15) / 0.8) * a;
        if (ca > 0) { sub.step(t - 2.85, dt); zBlit(c, sub, cx - R * 2, cy - R * 2, ca, 0.85 + 0.15 * fxEase((t - 3.15) / 1.2)); }
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.fillStyle = '#04050B'; c.beginPath(); c.arc(mx, my, R * 1.01, 0, FX_TAU); c.fill(); c.globalAlpha = 1;
        /* the last light of the sun: a string of beads, then the diamond ring */
        c.globalCompositeOperation = 'lighter';
        var bx = cx + Math.cos(ad) * R, by = cy + Math.sin(ad) * R, bd = fxEnv(t, 2.85, 2.95, 3.1, 3.2) * a;
        if (bd > 0) { for (i = -3; i <= 3; i++) { var ba = ad + i * 0.1; fxGlow(c, '255,250,235', cx + Math.cos(ba) * R, cy + Math.sin(ba) * R, 3 + 3 * Math.abs(Math.sin(t * 40 + i)), bd); } }
        var d = fxEnv(t, 3.08, 3.2, 3.4, 4.1) * a;
        if (d > 0) { fxGlow(c, '255,255,255', bx, by, R * 1.5 * d, d); fxStar4(c, bx, by, R * 1.2 * d, d, '#FFFFFF'); c.save(); c.translate(bx, by); c.scale(1, 0.05); fxGlow(c, '255,250,235', 0, 0, W * 0.45 * d, 0.85 * d); c.restore(); }
      };
    },

    /* ---- Kintsugi: a dark bowl is struck and cracks, then molten gold runs into every crack and mends it ---- */
    kintsugi: function (s) {
      var W = s.w, H = s.h, cx = W / 2, cy = H * 0.5, R = Math.min(W, H) * 0.3, r = zRng(23), CR = [], SH = [], DU = [], i, hit = false;
      var ix = cx + R * 0.1, iy = cy - R * 0.12;
      for (i = 0; i < 7; i++) {
        var an = i / 7 * FX_TAU + 0.3 + r() * 0.45, p = zPath(zJag(r, ix, iy, cx + Math.cos(an) * R * 1.08, cy + Math.sin(an) * R * 1.08, 0.3, 5));
        CR.push({ p: p, t0: 1.25 + r() * 0.12, w: 2.6 });
        var m = zAlong(p, p.len * (0.3 + r() * 0.35)), bn = an + (r() < 0.5 ? -1 : 1) * (0.55 + r() * 0.4), bl = R * (0.2 + r() * 0.3);
        CR.push({ p: zPath(zJag(r, m[0], m[1], m[0] + Math.cos(bn) * bl, m[1] + Math.sin(bn) * bl, 0.34, 4)), t0: 1.42 + r() * 0.25, w: 1.6 });
      }
      return function (t, dt, k) {
        var c = s.ctx, a = fxEnv(t, 0.6, 1.0, 99, 100) * k, sh = t > 1.25 && t < 1.65 ? (1 - (t - 1.25) / 0.4) * 7 : 0;
        c.save(); if (sh) { c.translate(fxR(-sh, sh), fxR(-sh, sh)); }
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
        var g = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R); g.addColorStop(0, '#323852'); g.addColorStop(0.55, '#171A2B'); g.addColorStop(1, '#0B0C17');
        c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, FX_TAU); c.fill();
        c.strokeStyle = 'rgba(170,180,220,.35)'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R - 1, 0, FX_TAU); c.stroke();
        c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = R * 0.05; c.beginPath(); c.arc(cx, cy, R * 0.55, 0, FX_TAU); c.stroke();
        c.save(); c.beginPath(); c.arc(cx, cy, R - 1.5, 0, FX_TAU); c.clip();
        c.lineJoin = 'round'; c.lineCap = 'round';
        CR.forEach(function (q) { var u = (t - q.t0) / 0.16; if (u <= 0) { return; } var d = q.p.len * Math.min(1, u); zStrokeTo(c, q.p, d, 'rgba(0,0,0,.95)', q.w); zStrokeTo(c, q.p, d, 'rgba(210,220,250,.22)', 0.7); });
        c.globalCompositeOperation = 'lighter';
        CR.forEach(function (q, n) {
          var u = (t - 2.05 - n * 0.045) / 1.05; if (u <= 0) { return; } var d = q.p.len * fxEase(Math.min(1, u));
          zStrokeTo(c, q.p, d, 'rgba(234,179,8,' + (0.22 * a) + ')', q.w * 4); zStrokeTo(c, q.p, d, 'rgba(250,204,21,' + (0.85 * a) + ')', q.w * 1.1); zStrokeTo(c, q.p, d, 'rgba(255,247,214,' + (0.9 * a) + ')', q.w * 0.45);
          if (u < 1) { var h = zAlong(q.p, d); fxGlow(c, '255,214,120', h[0], h[1], 16, 0.9 * a); fxGlow(c, '255,255,255', h[0], h[1], 4, a); }
        });
        var gu = (t - 3.35) / 0.7;
        if (gu > 0 && gu < 1) { var gx = cx - R * 1.3 + gu * R * 2.6, gg = c.createLinearGradient(gx - R * 0.25, 0, gx + R * 0.25, 0); gg.addColorStop(0, 'rgba(255,236,170,0)'); gg.addColorStop(0.5, 'rgba(255,236,170,' + (0.35 * a) + ')'); gg.addColorStop(1, 'rgba(255,236,170,0)'); c.fillStyle = gg; c.fillRect(cx - R, cy - R, R * 2, R * 2); }
        c.restore();
        /* the blow: a flash, and chips of glaze that fly */
        c.globalCompositeOperation = 'lighter';
        if (t > 1.25 && !hit) { hit = true; for (i = 0; i < 18; i++) { var sa = fxR(0, FX_TAU), sv = fxR(80, 260); SH.push({ x: ix, y: iy, vx: Math.cos(sa) * sv, vy: Math.sin(sa) * sv - 60, l: 0, m: fxR(0.5, 0.9), z: fxR(2, 5), r: fxR(0, 6) }); } }
        var fu = t - 1.25; if (fu > 0 && fu < 0.3) { fxGlow(c, '255,255,255', ix, iy, R * 0.7, (1 - fu / 0.3) * a); }
        c.globalCompositeOperation = 'source-over';
        for (i = SH.length - 1; i >= 0; i--) { var p = SH[i]; p.l += dt; if (p.l > p.m) { SH.splice(i, 1); continue; } p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 8; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.globalAlpha = (1 - p.l / p.m) * a; c.fillStyle = '#3A4060'; c.beginPath(); c.moveTo(-p.z, -p.z * 0.6); c.lineTo(p.z, -p.z * 0.2); c.lineTo(-p.z * 0.2, p.z); c.closePath(); c.fill(); c.restore(); }
        /* once it is whole again, gold dust rises from the seams */
        c.globalCompositeOperation = 'lighter';
        if (t > 3.0 && Math.random() < 0.7) { var q = CR[Math.floor(Math.random() * CR.length)].p, pt = zAlong(q, Math.random() * q.len); DU.push({ x: pt[0], y: pt[1], vy: fxR(-40, -15), l: 0, m: fxR(1, 2) }); }
        for (i = DU.length - 1; i >= 0; i--) { var du = DU[i]; du.l += dt; if (du.l > du.m) { DU.splice(i, 1); continue; } du.y += du.vy * dt; fxGlow(c, '253,224,71', du.x + Math.sin(du.l * 4) * 3, du.y, 3, Math.sin(du.l / du.m * Math.PI) * a); }
        c.restore();
      };
    },

    /* ---- Orrery: a clock face draws itself, gears turn, and the planets race round until every one of them lines up ---- */
    orrery: function (s) {
      var W = s.w, H = s.h, cx = W / 2, cy = H * 0.5, RD = Math.min(W * 0.4, H * 0.44), RX = RD * 0.98, RY = RX * 0.36, TAL = 3.3, TH = -0.62;
      var PL = [[0.3, 2.9, '253,186,116', 0.045], [0.48, 2.1, '147,197,253', 0.06], [0.66, 1.45, '252,165,165', 0.05], [0.84, 0.95, '216,180,254', 0.075], [1.0, 0.6, '134,239,172', 0.055]];
      var NUM = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      function brake(tau) { return tau < 1 ? tau * tau / 2 : tau - 0.5; }
      return function (t, dt, k) {
        var c = s.ctx, a = fxEnv(t, 0.6, 1.1, 99, 100) * k, i, ga = 0.55 * a;
        zGear(c, cx - RD * 1.3, cy + RD * 0.55, RD * 0.5, 24, t * 0.35, 'rgba(214,170,90,.6)', ga);
        zGear(c, cx - RD * 0.66, cy + RD * 0.98, RD * 0.22, 11, -t * 0.35 * 24 / 11 + 0.14, 'rgba(214,170,90,.6)', ga);
        zGear(c, cx + RD * 1.22, cy - RD * 0.45, RD * 0.42, 20, -t * 0.3, 'rgba(214,170,90,.6)', ga);
        /* the clock face draws itself round */
        var dr = fxEase((t - 0.9) / 0.9), end = -Math.PI / 2 + FX_TAU * dr;
        if (dr > 0) {
          c.strokeStyle = 'rgba(214,170,90,' + (0.75 * a) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, RD, -Math.PI / 2, end); c.stroke();
          c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, RD * 0.93, -Math.PI / 2, end); c.stroke();
          for (i = 0; i < 60; i++) { var ta = i / 60 * FX_TAU - Math.PI / 2; if (ta > end) { break; } var r0 = i % 5 ? RD * 0.95 : RD * 0.9; c.beginPath(); c.moveTo(cx + Math.cos(ta) * r0, cy + Math.sin(ta) * r0); c.lineTo(cx + Math.cos(ta) * RD, cy + Math.sin(ta) * RD); c.stroke(); }
          c.fillStyle = 'rgba(234,200,140,' + (0.85 * a) + ')'; c.font = Math.round(RD * 0.075) + 'px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          for (i = 0; i < 12; i++) { var na = i / 12 * FX_TAU - Math.PI / 2; if (na > end) { break; } c.fillText(NUM[i], cx + Math.cos(na) * RD * 0.82, cy + Math.sin(na) * RD * 0.82); }
        }
        /* the orbits, the sun, and the planets on their brass arms */
        var oa = fxEase((t - 1.0) / 0.6) * a;
        c.strokeStyle = 'rgba(214,170,90,' + (0.35 * oa) + ')'; c.lineWidth = 1;
        PL.forEach(function (p) { c.beginPath(); c.ellipse(cx, cy, RX * p[0], RY * p[0], 0, 0, FX_TAU); c.stroke(); });
        var pos = PL.map(function (p, n) { var th = t < TAL ? TH - p[1] * brake(TAL - t) : TH, x = cx + Math.cos(th) * RX * p[0], y = cy + Math.sin(th) * RY * p[0]; return { x: x, y: y, z: Math.sin(th), p: p, n: n }; });
        function planet(q) {
          var pr = q.p[3] * RD;
          c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'rgba(214,170,90,' + (0.6 * oa) + ')'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(q.x, q.y); c.stroke();
          c.globalCompositeOperation = 'lighter'; fxGlow(c, q.p[2], q.x, q.y, pr * 2.6, 0.45 * oa);
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = oa;
          var pg = c.createRadialGradient(q.x - pr * 0.35, q.y - pr * 0.35, pr * 0.1, q.x, q.y, pr); pg.addColorStop(0, 'rgba(255,255,255,1)'); pg.addColorStop(0.35, 'rgba(' + q.p[2] + ',1)'); pg.addColorStop(1, 'rgba(30,24,40,1)');
          c.fillStyle = pg; c.beginPath(); c.arc(q.x, q.y, pr, 0, FX_TAU); c.fill();
          if (q.n === 3) { c.strokeStyle = 'rgba(233,213,255,.8)'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(q.x, q.y, pr * 1.9, pr * 0.55, -0.35, 0, FX_TAU); c.stroke(); }
          c.globalAlpha = 1;
        }
        pos.filter(function (q) { return q.z < 0; }).forEach(planet);
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', cx, cy, RD * 0.34, 0.6 * oa); fxGlow(c, '255,247,214', cx, cy, RD * 0.08, oa);
        pos.filter(function (q) { return q.z >= 0; }).forEach(planet);
        /* the moment they line up: light runs out through every planet */
        var al = fxEnv(t, TAL, TAL + 0.12, TAL + 0.7, TAL + 1.6) * a;
        if (al > 0) {
          c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
          var ex = cx + Math.cos(TH) * RX * 1.6, ey = cy + Math.sin(TH) * RY * 1.6;
          [[12, 0.12], [5, 0.35], [1.6, 0.9]].forEach(function (L) { c.strokeStyle = 'rgba(255,236,170,' + (L[1] * al) + ')'; c.lineWidth = L[0]; c.beginPath(); c.moveTo(cx, cy); c.lineTo(ex, ey); c.stroke(); });
          pos.forEach(function (q, n) { var pf = fxEnv(t, TAL + n * 0.06, TAL + n * 0.06 + 0.1, TAL + n * 0.06 + 0.3, TAL + n * 0.06 + 1.0) * a; fxGlow(c, '255,255,255', q.x, q.y, q.p[3] * RD * 4, 0.8 * pf); fxStar4(c, q.x, q.y, q.p[3] * RD * 3 * pf, pf, '#FFFFFF'); });
          var ru = (t - TAL) / 1.1; if (ru > 0 && ru < 1) { fxRing(c, cx, cy, RD * (0.1 + ru * 1.1), RD * (0.04 + ru * 0.4), '253,224,71', (1 - ru) * a, 2); }
        }
      };
    },

    /* ---- Learning tree: the star falls as a seed, and a tree grows from it through four seasons until lanterns hang in its branches ---- */
    tree: function (s) {
      var W = s.w, H = s.h, gy = H * 0.86, sw = Math.min(W * 0.92, H * 1.2), sh = Math.min(H * 0.72, sw * 0.82), sx = (W - sw) / 2, sy = gy - sh;
      var opt = { days: 3, season: 'spring' }, sub = zSub(zGrove, sw, sh, opt, { l: 0.14, r: 0.14, t: 0.16, b: 0 }), ST = [[1.55, 3, 'spring'], [2.2, 12, 'summer'], [2.85, 45, 'fall'], [3.5, 150, 'winter']];
      return function (t, dt, k) {
        var c = s.ctx, a = k, fu = (t - 0.95) / 0.5;
        c.globalCompositeOperation = 'lighter';
        if (fu > 0 && fu < 1) { var y = H * 0.13 + (gy - H * 0.13) * fu * fu, ty = Math.max(H * 0.13, y - 60), g = c.createLinearGradient(0, ty, 0, y); g.addColorStop(0, 'rgba(255,247,214,0)'); g.addColorStop(1, 'rgba(255,247,214,' + (0.6 * a) + ')'); c.strokeStyle = g; c.lineWidth = 2; c.beginPath(); c.moveTo(W / 2, ty); c.lineTo(W / 2, y); c.stroke(); fxGlow(c, '255,236,170', W / 2, y, 14, a); fxGlow(c, '255,255,255', W / 2, y, 4, a); }
        var gl = fxEase((t - 1.45) / 0.4) * a;
        if (gl > 0) {
          fxGlow(c, '134,239,172', W / 2, gy, W * 0.35, 0.22 * gl);
          var lg = c.createLinearGradient(0, 0, W, 0); lg.addColorStop(0, 'rgba(134,239,172,0)'); lg.addColorStop(0.5, 'rgba(134,239,172,' + (0.45 * gl) + ')'); lg.addColorStop(1, 'rgba(134,239,172,0)');
          c.strokeStyle = lg; c.lineWidth = 1; c.beginPath(); c.moveTo(0, gy + 0.5); c.lineTo(W, gy + 0.5); c.stroke();
          var ru = (t - 1.45) / 0.8; if (ru > 0 && ru < 1) { fxRing(c, W / 2, gy, 10 + ru * W * 0.3, 3 + ru * 16, '187,247,208', (1 - ru) * a, 1.5); }
        }
        var cur = null; ST.forEach(function (q) { if (t >= q[0]) { cur = q; } });
        if (cur) {
          opt.days = cur[1]; opt.season = cur[2]; sub.step(t, dt);
          var since = t - cur[0], pop = since < 0.3 ? 0.93 + 0.07 * fxEase(since / 0.3) : 1;
          zBlit(c, sub, sx, sy, a * (cur === ST[0] ? fxEase(since / 0.35) : 1), pop, W / 2, gy);
          if (since < 0.4) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '255,236,170', W / 2, sy + sh * 0.45, sh * 0.55, (1 - since / 0.4) * 0.3 * a); }
        }
      };
    },

    /* ---- Gyre: scattered sparks in deep water gather into a turning spiral, and a shining school of fish sweeps through it ---- */
    gyre: function (s) {
      var W = s.w, H = s.h, cx = W / 2, cy = H * 0.5, RM = Math.min(W, H) * 0.46, P = [], FS = [], i;
      for (i = 0; i < 300; i++) { var rr = Math.pow(Math.random(), 0.7) * 0.95 + 0.05; P.push({ arm: i % 3, r: rr, off: (Math.random() - 0.5) * 0.32 * (Math.random() < 0.2 ? 2.4 : 1), sx: Math.random() * W, sy: Math.random() * H, d: i === 0 ? 0 : fxR(0.15, 0.9), z: fxR(0.6, 1.5), p: fxR(0, 6), v: Math.random() < 0.1 }); }
      P[0].r = 0.05; P[0].sx = cx; P[0].sy = cy;
      for (i = 0; i < 16; i++) { FS.push({ o: fxR(-1, 1), d: fxR(0, 0.24), z: fxR(0.8, 1.2) }); }
      function fish(c, x, y, ang, L, al) { c.save(); c.translate(x, y); c.rotate(ang); c.globalAlpha = Math.min(1, al); c.fillStyle = 'rgb(165,243,252)'; c.beginPath(); c.ellipse(0, 0, L, L * 0.32, 0, 0, FX_TAU); c.fill(); c.beginPath(); c.moveTo(-L * 0.8, 0); c.lineTo(-L * 1.5, -L * 0.42); c.lineTo(-L * 1.5, L * 0.42); c.closePath(); c.fill(); c.restore(); }
      return function (t, dt, k) {
        var c = s.ctx, a = fxEnv(t, 0.6, 1.0, 99, 100) * k;
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
        var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#062A3A'); g.addColorStop(0.6, '#03141F'); g.addColorStop(1, '#020A12'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
        c.globalCompositeOperation = 'lighter';
        for (i = 0; i < 3; i++) { fxBeam(c, W * (0.3 + i * 0.2) + Math.sin(t * 0.3 + i) * 20, -20, Math.PI / 2 + 0.14 * (i - 1), H * 1.1, 0.06, 'rgba(103,232,249,' + (0.07 * a) + ')'); }
        var spin = t * 0.35 + 2.4 * fxEase((t - 1.2) / 2.6), gather = fxEase((t - 1.0) / 1.9);
        P.forEach(function (q) {
          var sh = Math.max(0, Math.min(1, (t - 0.8 - q.d) / 0.3)); if (sh <= 0) { return; }
          var ang = q.arm * FX_TAU / 3 + Math.log(q.r) * 2.4 + spin + q.off, R = q.r * RM, tx = cx + Math.cos(ang) * R, ty = cy + Math.sin(ang) * R * 0.8;
          var x = q.sx + (tx - q.sx) * gather, y = q.sy + (ty - q.sy) * gather;
          fxGlow(c, q.v ? '196,181,253' : '103,232,249', x, y, 2 + q.z * 1.6, a * sh * (0.45 + 0.35 * Math.sin(t * 3 + q.p)));
        });
        fxGlow(c, '103,232,249', cx, cy, RM * 0.45 * (0.3 + 0.7 * gather), 0.3 * a * (0.3 + 0.7 * gather)); fxGlow(c, '255,255,255', cx, cy, RM * 0.06, 0.6 * gather * a);
        /* the school of fish */
        var fu = (t - 2.8) / 1.4;
        if (fu > 0 && fu < 1.1) {
          FS.forEach(function (f) {
            var v = fu - f.d; if (v <= 0 || v >= 1) { return; }
            var al = Math.PI * 0.95 - v * Math.PI * 1.3, Rr = RM * 0.72 * (1 + f.o * 0.18), x = cx + Math.cos(al) * Rr, y = cy + Math.sin(al) * Rr * 0.8, dir = Math.atan2(-Math.cos(al) * 0.8, Math.sin(al)), fa = Math.sin(v * Math.PI) * a;
            c.globalCompositeOperation = 'lighter'; fxGlow(c, '103,232,249', x, y, 9 * f.z, 0.22 * fa); c.globalCompositeOperation = 'source-over'; fish(c, x, y, dir, 7 * f.z, 0.8 * fa);
          });
        }
        var pu = (t - 3.3) / 1.0; if (pu > 0 && pu < 1) { fxRing(c, cx, cy, RM * (0.1 + pu * 0.9), RM * 0.8 * (0.1 + pu * 0.9), '165,243,252', (1 - pu) * 0.8 * a, 2); }
      };
    },

    /* ---- Rose Window: in a dark cathedral, morning light finds the glass and the panes light one by one, then the gold heart ---- */
    rose: function (s) {
      var W = s.w, H = s.h, sub = zSub(FX_AURA.rose, W, H, { rs: 0.84 }), x0 = W / 2, y0 = H / 2, R = Math.min(H * 0.5, W * 0.37) * 0.84;
      return function (t, dt, k) {
        var c = s.ctx, a = fxEnv(t, 0.6, 1.0, 99, 100) * k, i, lit = 0;
        sub.step(t + 2, dt); zBlit(c, sub, 0, 0, a);
        c.globalCompositeOperation = 'source-over'; c.fillStyle = '#03030A';
        for (i = 0; i < 12; i++) {
          var on = fxEase((t - 1.25 - i * 0.14) / 0.3); lit += on / 12;
          if (on >= 1) { continue; }
          var a0 = i / 12 * FX_TAU - Math.PI / 2, a1 = a0 + FX_TAU / 12;
          c.globalAlpha = 0.92 * (1 - on); c.beginPath(); c.moveTo(x0, y0); c.arc(x0, y0, R * 1.14, a0 - 0.003, a1 + 0.003); c.closePath(); c.fill();
        }
        var mo = fxEase((t - 3.0) / 0.3); if (mo < 1) { c.globalAlpha = 0.92 * (1 - mo); c.beginPath(); c.arc(x0, y0, R * 0.31, 0, FX_TAU); c.fill(); }
        c.globalAlpha = 0.9 * (1 - lit); c.beginPath(); c.rect(0, 0, W, H); c.arc(x0, y0, R * 1.14, 0, FX_TAU, true); c.fill('evenodd'); c.globalAlpha = 1;
        /* the first ray of morning, and a spark as each pane catches it */
        c.globalCompositeOperation = 'lighter';
        var fr = fxEnv(t, 0.8, 1.2, 1.7, 2.6) * a; if (fr > 0) { fxBeam(c, -W * 0.05, -H * 0.1, Math.atan2(y0 + H * 0.1, x0 + W * 0.05), Math.hypot(x0, y0) * 1.1, 0.05, 'rgba(255,236,190,' + (0.3 * fr) + ')'); }
        for (i = 0; i < 12; i++) { var o2 = (t - 1.25 - i * 0.14) / 0.3; if (o2 > 0 && o2 < 1.4) { var am = (i + 0.5) / 12 * FX_TAU - Math.PI / 2, sp = Math.sin(Math.min(1, o2 / 1.4) * Math.PI) * a; fxGlow(c, '255,247,214', x0 + Math.cos(am) * R * 0.7, y0 + Math.sin(am) * R * 0.7, R * 0.3, 0.5 * sp); fxStar4(c, x0 + Math.cos(am) * R * 0.81, y0 + Math.sin(am) * R * 0.81, R * 0.1 * sp, sp, '#FFFFFF'); } }
        var cu = t - 3.0; if (cu > 0 && cu < 1.2) { var ce = 1 - cu / 1.2; fxGlow(c, '255,236,170', x0, y0, R * (0.4 + cu), 0.7 * ce * a); fxRing(c, x0, y0, R * (0.3 + cu * 1.2), R * (0.3 + cu * 1.2), '253,224,71', ce * a, 2); }
      };
    },

    /* ---- Fortissimo: five beats, each quicker and brighter, then a hush, then the drop and PERFECT, which breaks into confetti ---- */
    fortissimo: function (s) {
      var W = s.w, H = s.h, cx = W / 2, cy = H * 0.5, BEATS = [1.0, 1.55, 2.0, 2.35, 2.6], HUES = [190, 265, 320, 30, 140], DROP = 2.9, NB = 32, PX = [], BITS = [], ph = [], i, burst = false, shat = false;
      var px = Math.max(5, Math.min(14, Math.round(W / 52)));
      for (i = 0; i < NB; i++) { ph.push(fxR(0, 6)); }
      return function (t, dt, k) {
        var c = s.ctx, a = fxEnv(t, 0.6, 0.9, 99, 100) * k, n0 = -1, last = -9;
        BEATS.forEach(function (b, n) { if (t >= b) { n0 = n; last = b; } });
        var hue = t >= DROP ? (140 + (t - DROP) * 300) % 360 : n0 >= 0 ? HUES[n0] : 200;
        c.globalCompositeOperation = 'lighter';
        BEATS.forEach(function (b, n) { var u = (t - b) / 0.7; if (u > 0 && u < 1) { fxRing(c, cx, cy, 20 + fxEase(u) * (W * 0.28 + n * 40), 8 + fxEase(u) * (H * 0.22 + n * 25), zHsl(HUES[n], 100, 66), (1 - u) * (0.6 + n * 0.1) * a, 3 * (1 - u) + 1); fxGlow(c, zHsl(HUES[n], 100, 60), cx, cy, 60 + n * 30, (1 - u) * 0.55 * a); } });
        var energy = 0; BEATS.forEach(function (b, n) { var u = t - b; if (u >= 0) { energy = Math.max(energy, Math.exp(-u * 5) * (0.4 + n * 0.15)); } });
        var hush = t > 2.72 && t < DROP ? 0 : 1;
        if (t >= DROP) { energy = Math.max(energy, 1.15 * Math.exp(-(t - DROP) * 1.2) * (0.75 + 0.25 * Math.abs(Math.sin((t - DROP) * 17)))); }
        /* equalizer bars along the top and bottom */
        var bw = W / NB;
        for (i = 0; i < NB; i++) {
          var shape = 0.45 + 0.55 * Math.sin((i + 0.5) / NB * Math.PI), hgt = hush * (4 + H * 0.3 * energy * shape) * (0.55 + 0.45 * Math.abs(Math.sin(t * 13 + ph[i]))), x = i * bw + bw * 0.18, wd = bw * 0.64;
          c.globalAlpha = 0.85 * a; c.fillStyle = 'hsl(' + ((hue + i * 6) % 360) + ',100%,62%)'; c.fillRect(x, H - hgt, wd, hgt); c.fillRect(x, 0, wd, hgt * 0.6);
          c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(x, H - hgt, wd, 2);
        }
        c.globalAlpha = 1;
        /* the hush before the drop: a single line pulls in to the middle */
        var hu = (t - 2.72) / (DROP - 2.72); if (hu > 0 && hu < 1) { var lw = W * 0.45 * (1 - fxEase(hu)); c.strokeStyle = 'rgba(255,255,255,' + (0.9 * a) + ')'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - lw, cy); c.lineTo(cx + lw, cy); c.stroke(); fxGlow(c, '255,255,255', cx, cy, 20 + 30 * hu, 0.6 * a); }
        if (t >= DROP) {
          var u = t - DROP;
          if (!burst) { burst = true; for (i = 0; i < 120; i++) { var an = fxR(0, FX_TAU), v = fxR(160, 520); PX.push({ x: cx, y: cy, vx: Math.cos(an) * v, vy: Math.sin(an) * v * 0.8 - 120, z: Math.round(fxR(4, 8)), h: Math.floor(fxR(0, 360)) }); } }
          if (u < 0.12) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = (1 - u / 0.12) * 0.5 * a; c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; c.globalCompositeOperation = 'lighter'; }
          [0, 0.1, 0.2].forEach(function (d0, n) { var v2 = (u - d0) / 1.0; if (v2 > 0 && v2 < 1) { fxRing(c, cx, cy, 20 + fxEase(v2) * W * 0.6, 8 + fxEase(v2) * H * 0.55, zHsl(n * 120 + t * 300, 100, 66), (1 - v2) * a, 4 * (1 - v2) + 1); } });
          c.globalCompositeOperation = 'source-over';
          PX.forEach(function (p) { p.vy += 520 * dt; p.vx *= Math.pow(0.5, dt); p.x += p.vx * dt; p.y += p.vy * dt; var g = 4; c.globalAlpha = Math.max(0, 1 - u / 1.6) * a; c.fillStyle = 'hsl(' + ((p.h + t * 200) % 360) + ',100%,62%)'; c.fillRect(Math.round(p.x / g) * g, Math.round(p.y / g) * g, p.z, p.z); });
          c.globalAlpha = 1;
          /* PERFECT stamps down, holds, then breaks into pixels */
          var wy = cy - px * 0.5;
          if (u < 0.85) {
            var sc = u < 0.14 ? 1.8 - 0.8 * fxEase(u / 0.14) : 1;
            c.save(); c.translate(cx, wy); c.scale(sc, sc);
            zPixelWord(c, 'PERFECT!', 3, 3, px, function () { return 'rgba(0,0,0,.6)'; }, a);
            zPixelWord(c, 'PERFECT!', 0, 0, px, function (n) { return 'hsl(' + ((n * 45 + t * 360) % 360) + ',100%,64%)'; }, a);
            c.restore();
          } else {
            if (!shat) { shat = true; BITS = zPixelBits('PERFECT!', cx, wy, px).map(function (b) { var an2 = Math.atan2(b.y - wy, b.x - cx) + fxR(-0.5, 0.5), v3 = fxR(60, 260); return { x: b.x, y: b.y, vx: Math.cos(an2) * v3, vy: Math.sin(an2) * v3 - 80, i: b.i, r: 0, vr: fxR(-6, 6) }; }); }
            var su = u - 0.85;
            BITS.forEach(function (b) { b.vy += 380 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.r += b.vr * dt; c.save(); c.translate(b.x + px / 2, b.y + px / 2); c.rotate(b.r); c.globalAlpha = Math.max(0, 1 - su / 1.2) * a; c.fillStyle = 'hsl(' + ((b.i * 45 + t * 360) % 360) + ',100%,64%)'; c.fillRect(-px / 2, -px / 2, px - 0.5, px - 0.5); c.restore(); });
            c.globalAlpha = 1;
          }
        }
      };
    },

    /* ---- Starforge: a hammer of light strikes a bar of star-metal three times, and on the last blow it becomes a star and rises ---- */
    starforge: function (s) {
      var W = s.w, H = s.h, cx = W / 2, ay = H * 0.68, aw = Math.min(W * 0.5, H * 0.75, 320), ah = aw * 0.3, iw = aw * 0.42, ih = Math.max(8, aw * 0.07);
      var HITS = [1.45, 2.05, 2.65], SP = [], EM = [], done = [false, false, false], i, hw = Math.max(36, aw * 0.24);
      for (i = 0; i < 40; i++) { EM.push({ x: fxR(-0.6, 0.6), y: fxR(0, 1), v: fxR(20, 50), p: fxR(0, 6), z: fxR(0.6, 1.4) }); }
      var sx0 = cx, sy0 = ay - ih - hw * 0.28, px = cx + aw * 0.62, py = ay - aw * 1.0, L = Math.hypot(sx0 - px, sy0 - py), base = Math.atan2(sy0 - py, sx0 - px);
      function lift(t) {
        if (t < HITS[0]) { var u = Math.max(0, (t - 0.85) / (HITS[0] - 0.85)); return u < 0.62 ? 0.2 + 1.2 * fxEase(u / 0.62) : 1.4 * (1 - Math.pow((u - 0.62) / 0.38, 2)); }
        for (var n = 0; n < 3; n++) { var q = HITS[n], b = n < 2 ? HITS[n + 1] : q + 0.7; if (t < b) { var v = (t - q) / (b - q); if (n === 2) { return 1.6 * fxEase(v); } return v < 0.55 ? 1.25 * Math.sin(v / 0.55 * Math.PI / 2) : 1.25 * (1 - Math.pow((v - 0.55) / 0.45, 2)); } }
        return 1.6;
      }
      return function (t, dt, k) {
        var c = s.ctx, a = fxEnv(t, 0.6, 1.0, 99, 100) * k;
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '234,88,12', cx, H + 60, Math.max(W, H) * 0.6, 0.38 * a);
        EM.forEach(function (e) { var y = H - ((e.y * H * 0.9 + t * e.v) % (H * 0.9)), x = cx + e.x * W * 0.8 + Math.sin(t * 2 + e.p) * 8, f = Math.max(0, Math.sin(t * 7 + e.p)); fxGlow(c, '251,146,60', x, y, 2 + 2.4 * e.z, a * (0.3 + 0.5 * f)); });
        /* the anvil */
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; var ag = c.createLinearGradient(0, ay, 0, ay + ah * 1.8); ag.addColorStop(0, '#4A2C1A'); ag.addColorStop(0.18, '#24160E'); ag.addColorStop(1, '#0D0907'); c.fillStyle = ag;
        c.beginPath(); c.moveTo(cx - aw * 0.42, ay); c.lineTo(cx + aw * 0.5, ay); c.lineTo(cx + aw * 0.5, ay + ah * 0.35); c.quadraticCurveTo(cx + aw * 0.24, ay + ah * 0.45, cx + aw * 0.2, ay + ah * 0.8);
        c.lineTo(cx + aw * 0.22, ay + ah * 1.25); c.lineTo(cx + aw * 0.38, ay + ah * 1.55); c.lineTo(cx + aw * 0.38, ay + ah * 1.8); c.lineTo(cx - aw * 0.38, ay + ah * 1.8); c.lineTo(cx - aw * 0.38, ay + ah * 1.55); c.lineTo(cx - aw * 0.22, ay + ah * 1.25);
        c.lineTo(cx - aw * 0.2, ay + ah * 0.8); c.quadraticCurveTo(cx - aw * 0.3, ay + ah * 0.4, cx - aw * 0.48, ay + ah * 0.32); c.quadraticCurveTo(cx - aw * 0.66, ay + ah * 0.22, cx - aw * 0.82, ay + ah * 0.04); c.quadraticCurveTo(cx - aw * 0.62, ay, cx - aw * 0.42, ay); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(251,146,60,.55)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx - aw * 0.82, ay + ah * 0.04); c.quadraticCurveTo(cx - aw * 0.62, ay, cx - aw * 0.42, ay); c.lineTo(cx + aw * 0.5, ay); c.stroke();
        c.globalAlpha = 1;
        /* the bar of star-metal: hotter with every blow */
        var heat = 0.45; HITS.forEach(function (h, n) { if (t >= h) { heat = Math.max(heat, 0.45 + (0.55 + n * 0.1) * Math.exp(-(t - h) * 2.2)); } });
        var st = fxEase((t - 2.95) / 0.25), bwid = iw * (1 - st);
        if (bwid > 1) {
          var r0 = 234 + 21 * heat, g0 = Math.round(88 + 160 * heat), b0 = Math.round(12 + 210 * Math.max(0, heat - 0.4));
          c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,146,60', cx, ay - ih / 2, iw * (0.6 + heat * 0.6), (0.4 + 0.5 * heat) * a);
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.fillStyle = 'rgb(' + Math.min(255, r0) + ',' + Math.min(255, g0) + ',' + Math.min(255, b0) + ')'; c.beginPath(); fxRR(c, cx - bwid / 2, ay - ih, bwid, ih, ih * 0.35); c.fill(); c.globalAlpha = 1;
        }
        /* each blow: a flash, a ring along the anvil, and a fountain of sparks */
        c.globalCompositeOperation = 'lighter';
        HITS.forEach(function (h, n) {
          var u = t - h;
          if (u >= 0 && !done[n]) { done[n] = true; for (var j = 0; j < 30 + n * 18; j++) { var an = -Math.PI / 2 + fxR(-1.4, 1.4), v = fxR(160, 420 + n * 70); SP.push({ x: cx + fxR(-12, 12), y: ay - ih, vx: Math.cos(an) * v, vy: Math.sin(an) * v, l: 0, m: fxR(0.45, 1.0) }); } }
          if (u >= 0 && u < 0.2) { fxGlow(c, '255,247,214', cx, ay - ih, 50 + n * 25, (1 - u / 0.2) * a); fxGlow(c, '251,146,60', cx, ay - ih, 140 + n * 50, 0.6 * (1 - u / 0.2) * a); }
          var v2 = u / 0.6; if (v2 > 0 && v2 < 1) { fxRing(c, cx, ay - ih * 0.5, 10 + fxEase(v2) * (aw * 0.7 + n * 50), 3 + v2 * (12 + n * 5), '253,186,116', (1 - v2) * 0.9 * a, 2.5 * (1 - v2) + 0.8); }
        });
        c.lineCap = 'round';
        for (i = SP.length - 1; i >= 0; i--) { var p = SP[i]; p.l += dt; if (p.l > p.m) { SP.splice(i, 1); continue; } p.vy += 900 * dt; var ox = p.x, oy = p.y; p.x += p.vx * dt; p.y += p.vy * dt; var f2 = 1 - p.l / p.m; c.strokeStyle = 'rgba(255,' + Math.round(180 + 70 * f2) + ',' + Math.round(80 + 140 * f2 * f2) + ',' + (f2 * a) + ')'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ox - p.vx * 0.012, oy - p.vy * 0.012); c.lineTo(p.x, p.y); c.stroke(); fxGlow(c, '255,236,170', p.x, p.y, 3, f2 * a); }
        /* the hammer */
        var ang = base + lift(t), ha = fxEnv(t, 0.85, 1.05, 2.95, 3.3) * a, aOld = base + lift(Math.max(0, t - 0.13)), span = ang - aOld, near = 0;
        if (Math.abs(span) > 0.1 && ha > 0) { c.globalCompositeOperation = 'lighter'; c.lineCap = 'butt'; for (var q2 = 0; q2 < 10; q2++) { var f0 = q2 / 10, f1 = (q2 + 1) / 10, al = ha * 0.3 * f1 * f1; c.strokeStyle = 'rgba(255,214,140,' + al + ')'; c.lineWidth = hw * 0.36; c.beginPath(); c.arc(px, py, L, aOld + span * f0, aOld + span * f1, span < 0); c.stroke(); } }
        HITS.forEach(function (h) { near = Math.max(near, Math.exp(-Math.abs(t - h) * 8)); });
        if (ha > 0) { zHammer(c, px, py, ang, L, ha, near, hw); }
        /* the metal becomes a star and rises to the top */
        var ru = (t - 2.95) / 0.6;
        if (ru > 0) {
          c.globalCompositeOperation = 'lighter';
          var ry = ay - ih / 2 + (H * 0.2 - (ay - ih / 2)) * fxEase(Math.min(1, ru)), sz = Math.min(1, ru * 2);
          if (ru < 1) { var tg = c.createLinearGradient(0, ry, 0, ay); tg.addColorStop(0, 'rgba(255,236,170,' + (0.6 * a) + ')'); tg.addColorStop(1, 'rgba(255,236,170,0)'); c.strokeStyle = tg; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, ry); c.lineTo(cx, ay - ih); c.stroke(); }
          var bu = ru - 1, pulse = bu > 0 ? Math.exp(-bu * 3) : 0;
          fxGlow(c, '253,224,71', cx, ry, 30 + 120 * pulse, (0.6 + 0.4 * pulse) * a); fxGlow(c, '255,255,255', cx, ry, 8 + 6 * sz, a);
          fxStar4(c, cx, ry, (14 + 50 * pulse) * sz, a, '#FFF7E0');
          if (bu > 0 && bu < 1) { fxRing(c, cx, ry, 10 + bu * W * 0.4, 4 + bu * H * 0.15, '253,186,116', (1 - bu) * a, 2); }
        }
      };
    },

    /* ---- Beacon: a dark lighthouse in the rain. Its lamp lights for the first time, the beam sweeps across the sea and turns to you ---- */
    'prize-beacon': function (s) {
      var sub = zSub(FX_LIVING['prize-beacon'], s.w, s.h, { lit: 1.2, speed: -1.75, ph: 6.82 });
      return function (t, dt, k) {
        var c = s.ctx, a = fxEnv(t, 0.5, 1.0, 99, 100) * k;
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.fillStyle = '#06121F'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1;
        sub.step(t, dt); zBlit(c, sub, 0, 0, a);
      };
    }
  };

  /* the whole arrival: the dark, the rising star, the look's own scene, its name and odds, and the flash as the prize card shows.
     Every arrival takes the same time (FX_RV.z), so the card always shows at 5.4 seconds. */
  var Z_KIND = { theme: 'Living theme', fx: 'Right-answer effect', aura: 'Aura', paper: 'Moving paper', streak: 'Streak style' };
  var Z_COL = { 'prize-beacon': '245,181,71', diamond: '244,114,182', fortissimo: '217,70,239', starforge: '251,146,60', kintsugi: '250,204,21', orrery: '234,179,8', rose: '165,180,252', gyre: '103,232,249', tree: '134,239,172' };
  FX_RV.z = { dur: 6.4, show: 5.4 };
  FX_REVEAL.z = function (s, cfg, odds, it) {
    if (!it || !Z_SCENE[it.key]) { return FX_REVEAL.m(s, cfg, odds); }
    var show = cfg.show, info = [it.name, Z_KIND[it.kind] || '', Z_COL[it.key]], draw = Z_SCENE[it.key](s);
    return function (t, dt) {
      var c = s.ctx, k = fxEnv(t, 0, 0.3, show + 0.25, show + 1.0);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.97 * k; c.fillStyle = '#03030A'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1;
      c.save(); draw(t, dt, k); c.restore(); fxClean(c);
      zRise(c, s, t); fxClean(c);
      zTitle(c, s, t, 3.95, show, info, odds || ''); fxClean(c);
      zFlash(c, s, t, show, info[2]); fxClean(c);
    };
  };
