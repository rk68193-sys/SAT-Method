  /* =================== Rocks & Gems and Forecast: rocks, gems and weather in every kind of look (prizes.js) =================== */
  /* Thirty-five looks in two series, with an Epic, a Legendary and a Mythic of every kind and two Commons and two Rares of each.
     Rocks & Gems is rocks and gems; Forecast is weather. They join the registries in fx.js (FX_AURA and FX_STG, FX_DRAW and FX_DUR,
     FX_PAPER, FX_LIVING and FX_LIVE_THEMES, FX_STREAK) and draw with its helpers. Backgrounds and effects read FX_INK, so each
     one works on a light page and on a dark one. */

  /* ---------- helpers ---------- */
  /* a random number generator with a seed, so a cloud or a crystal cluster keeps its shape from one frame to the next */
  function gwRng(seed) {
    var x = (Math.imul((seed >>> 0) + 0x9E3779B9, 2654435761) >>> 0) || 1;
    return function () { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  }
  function gwHsl(h, s, l, a) { return 'hsla(' + Math.round(h) + ',' + Math.round(s) + '%,' + Math.round(Math.max(0, Math.min(100, l))) + '%,' + (a === undefined ? 1 : Math.max(0, Math.min(1, a))).toFixed(3) + ')'; }
  /* the same color as 'r,g,b' for fxGlow; only ever called with a fixed set of colors, since fxGlow keeps one sprite per color */
  function gwRgb(h, s, l) { s /= 100; l /= 100; var a = s * Math.min(l, 1 - l), f = function (n) { var k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; return f(0) + ',' + f(8) + ',' + f(4); }
  function gwPoly(c, P) { c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (var i = 1; i < P.length; i++) { c.lineTo(P[i][0], P[i][1]); } c.closePath(); }
  /* a round cut gem seen from above: a table in the middle, star and bezel facets lit from the upper left; lit (0 to 1) is a glint */
  function gwGem(c, x, y, r, h, s, l, lit, a, rot) {
    if (!(a > 0) || !(r > 0.4)) { return; }
    var i, an, O = [], T = [];
    rot = rot || 0; lit = lit || 0; c.globalAlpha = Math.min(1, a);
    if (r < 3.5) { c.fillStyle = gwHsl(h, s, l + lit * 30); c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.8, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.8, y); c.closePath(); c.fill(); c.globalAlpha = 1; return; }
    for (i = 0; i < 8; i++) { an = rot + i / 8 * FX_TAU; T.push([x + Math.cos(an) * r * 0.5, y + Math.sin(an) * r * 0.5]); an += Math.PI / 8; O.push([x + Math.cos(an) * r, y + Math.sin(an) * r]); }
    for (i = 0; i < 8; i++) {
      var fa = rot + i / 8 * FX_TAU;
      c.fillStyle = gwHsl(h, s, l * (0.64 + 0.32 * Math.cos(fa + 2.356)) + lit * 28); gwPoly(c, [O[(i + 7) % 8], T[i], O[i]]); c.fill();
      c.fillStyle = gwHsl(h, s, l * (0.84 + 0.24 * Math.cos(fa + 2.356 + 0.4)) + lit * 30); gwPoly(c, [T[i], O[i], T[(i + 1) % 8]]); c.fill();
    }
    c.fillStyle = gwHsl(h, s * 0.9, l * 1.1 + 6 + lit * 30); gwPoly(c, T); c.fill();
    c.strokeStyle = gwHsl(h, s, Math.min(96, l * 1.3 + 22), 0.6); c.lineWidth = Math.max(0.5, r * 0.07); gwPoly(c, O); c.stroke();
    c.globalAlpha = Math.min(1, a) * 0.85; c.fillStyle = '#FFFFFF'; gwPoly(c, [T[5], T[6], [x + (T[5][0] + T[6][0] - 2 * x) * 0.2, y + (T[5][1] + T[6][1] - 2 * y) * 0.2]]); c.fill();
    c.globalAlpha = 1;
  }
  /* a smooth domed stone (a pearl, turquoise, or an opal with flecks of color that drift) */
  function gwCab(c, x, y, r, h, s, l, lit, a, opal, t) {
    if (!(a > 0) || !(r > 0.4)) { return; }
    var g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r), i;
    g.addColorStop(0, gwHsl(h, s * 0.6, l + 16 + lit * 20, a)); g.addColorStop(0.65, gwHsl(h, s, l, a)); g.addColorStop(1, gwHsl(h, s, l * 0.62, a));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, FX_TAU); c.fill();
    if (opal) { for (i = 0; i < 5; i++) { var an = i * 1.3 + t * 0.7, rr = r * (0.22 + 0.14 * (i % 3)); c.fillStyle = gwHsl((i * 72 + t * 50) % 360, 90, 62, a * (0.4 + 0.35 * Math.sin(t * 2.2 + i))); c.beginPath(); c.arc(x + Math.cos(an) * rr, y + Math.sin(an) * rr, r * 0.24, 0, FX_TAU); c.fill(); } }
    c.fillStyle = 'rgba(255,255,255,' + (0.75 * a).toFixed(3) + ')'; c.beginPath(); c.ellipse(x - r * 0.34, y - r * 0.4, r * 0.3, r * 0.17, -0.6, 0, FX_TAU); c.fill();
  }
  /* a crystal: a six-sided prism with a pointed tip, standing on (bx, by) and pointing along angle an; lit (0 to 1) brightens it */
  function gwPrism(c, bx, by, an, len, wid, h, s, l, lit, a) {
    if (!(a > 0) || len < 1) { return; }
    var dx = Math.cos(an), dy = Math.sin(an), nx = -dy, ny = dx, tip = Math.min(len * 0.45, wid * 1.5), sx = bx + dx * (len - tip), sy = by + dy * (len - tip), ex = bx + dx * len, ey = by + dy * len, hw = wid / 2, m = 0.12;
    c.globalAlpha = Math.min(1, a); c.lineJoin = 'round';
    c.fillStyle = gwHsl(h, s, l + 10 + lit * 30); gwPoly(c, [[bx - nx * hw, by - ny * hw], [sx - nx * hw, sy - ny * hw], [ex, ey], [sx + nx * hw * m, sy + ny * hw * m], [bx + nx * hw * m, by + ny * hw * m]]); c.fill();
    c.fillStyle = gwHsl(h, s, l * 0.66 + lit * 26); gwPoly(c, [[bx + nx * hw * m, by + ny * hw * m], [sx + nx * hw * m, sy + ny * hw * m], [ex, ey], [sx + nx * hw, sy + ny * hw], [bx + nx * hw, by + ny * hw]]); c.fill();
    c.strokeStyle = gwHsl(h, s * 0.8, l + 32 + lit * 25, 0.85); c.lineWidth = Math.max(0.6, wid * 0.07);
    gwPoly(c, [[bx - nx * hw, by - ny * hw], [sx - nx * hw, sy - ny * hw], [ex, ey], [sx + nx * hw, sy + ny * hw], [bx + nx * hw, by + ny * hw]]); c.stroke();
    c.beginPath(); c.moveTo(bx + nx * hw * m, by + ny * hw * m); c.lineTo(sx + nx * hw * m, sy + ny * hw * m); c.lineTo(ex, ey); c.stroke();
    c.globalAlpha = 1;
  }
  /* a cloud as one shape, ready to fill: puffs on a flat base, w wide and about h tall, its base at y; the puffs swell a little with t */
  function gwCloud(c, x, y, w, h, seed, t) {
    var R = gwRng(seed), n = Math.max(3, Math.round(w / h * 1.4)), i;
    c.beginPath();
    for (i = 0; i < n; i++) {
      var u = (i + 0.5) / n, hump = Math.sin(u * Math.PI), r = h * (0.3 + 0.42 * hump) * (0.85 + 0.3 * R()) * (1 + 0.035 * Math.sin(t * 0.9 + i * 2.1 + seed)), cx = x - w / 2 + u * w + (R() - 0.5) * w / n * 0.4, cy = y - r * (0.92 + 0.3 * hump * R());
      c.moveTo(cx + r, cy); c.arc(cx, cy, r, 0, FX_TAU);
    }
    c.moveTo(x - w / 2 + h * 0.3, y); c.rect(x - w / 2 + h * 0.3, y - h * 0.34, w - h * 0.6, h * 0.34);
  }
  /* a stage aura made here: FX_STG holds the scene, and FX_AURA scales it to the plate the same way fx.js does for its own */
  function gwStage(k, make) {
    FX_STG[k] = make;
    FX_AURA[k] = function (s) { var d = make(); return function (t, dt) { var c = s.ctx, big = s.h > 210, u = (big ? 190 : s.h) / 190; c.save(); c.translate(s.w / 2, big ? 6 : 0); c.scale(u, u); d(c, t, dt); c.restore(); }; };
  }

  /* ---------- auras, on the dark plate around the streak ---------- */
  /* Gem dust (Common): flakes of colored stone rise around the streak, turning over and flashing when they face you */
  FX_AURA.gemdust = function (s) {
    var P = [], H = [[350, 85, 62], [217, 90, 66], [150, 70, 55], [275, 75, 72], [42, 95, 62], [186, 80, 66]], i;
    for (i = 0; i < 32; i++) { P.push({ x: fxR(-1, 1), u: Math.random(), sp: fxR(0.07, 0.14), z: fxR(2.8, 5.2), ph: fxR(0, FX_TAU), fl: fxR(1.6, 3.2), c: H[i % H.length] }); }
    return function (t, dt) {
      var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, R = Math.min(170, s.w * 0.45);
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '167,139,250', x0, y0, R * 0.8, 0.1 + 0.04 * Math.sin(t * 1.5));
      P.forEach(function (p) {
        p.u += dt * p.sp; if (p.u > 1) { p.u -= 1; p.x = fxR(-1, 1); }
        var x = x0 + p.x * R + Math.sin(t * 0.9 + p.ph) * 7, y = s.h + 8 - p.u * (s.h + 16), a = Math.sin(p.u * Math.PI), f = Math.cos(t * p.fl + p.ph), wd = p.z * 0.8 * Math.max(0.12, Math.abs(f)), lit = Math.pow(Math.max(0, f), 14);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.9 * a;
        c.fillStyle = gwHsl(p.c[0], p.c[1], p.c[2] - 18 + 22 * Math.abs(f)); c.beginPath(); c.moveTo(x, y - p.z * 1.25); c.lineTo(x + wd, y); c.lineTo(x, y + p.z * 1.25); c.lineTo(x - wd, y); c.closePath(); c.fill();
        c.fillStyle = gwHsl(p.c[0], p.c[1] * 0.7, p.c[2] + 22); c.beginPath(); c.moveTo(x, y - p.z * 1.25); c.lineTo(x + (f > 0 ? wd : -wd), y); c.lineTo(x, y); c.closePath(); c.fill();
        c.globalAlpha = 1;
        if (lit > 0.03) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '255,255,255', x, y, p.z * 4, lit * a * 0.7); fxStar4(c, x, y, p.z * 2.8 * lit, a * lit, '#FFFFFF'); }
      });
    };
  };
  /* Drizzle (Common): a small cloud rains softly over the streak, and the drops ring where they land */
  FX_AURA.drizzle = function (s) {
    var D = [], Sp = [], i;
    for (i = 0; i < 36; i++) { D.push({ x: Math.random(), y: Math.random(), v: fxR(0.75, 1.1), len: fxR(5, 10) }); }
    return function (t, dt) {
      var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, cw = Math.min(s.w * 0.6, 240), ch = Math.min(s.h * 0.2, 30), cx = x0 + Math.sin(t * 0.35) * 8, base = Math.max(ch * 1.8, y0 - s.h * 0.14), floor = s.h - 6;
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      D.forEach(function (d) {
        d.y += dt * d.v * 0.85;
        if (d.y > 1) { d.y -= 1; Sp.push({ x: cx - cw * 0.4 + d.x * cw * 0.8 - 6, l: 0 }); d.x = Math.random(); }
        var x = cx - cw * 0.4 + d.x * cw * 0.8 - d.y * 6, y = base + d.y * (floor - base);
        c.strokeStyle = 'rgba(147,197,253,' + (0.65 * Math.min(1, d.y * 5)).toFixed(3) + ')'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1.2, y - d.len); c.stroke();
      });
      for (i = Sp.length - 1; i >= 0; i--) { var q = Sp[i]; q.l += dt; if (q.l > 0.45) { Sp.splice(i, 1); continue; } var v = q.l / 0.45; fxRing(c, q.x, floor, 2 + v * 9, 1 + v * 2.5, '147,197,253', (1 - v) * 0.6, 1); }
      if (Sp.length > 60) { Sp.splice(0, Sp.length - 60); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.94;
      var g = c.createLinearGradient(0, base - ch * 1.5, 0, base); g.addColorStop(0, '#E2E8F0'); g.addColorStop(0.55, '#A3B1C6'); g.addColorStop(1, '#5B6B84');
      c.fillStyle = g; gwCloud(c, cx, base, cw, ch, 7, t); c.fill(); c.globalAlpha = 1;
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '226,232,240', cx, base - ch * 0.7, cw * 0.45, 0.08);
    };
  };
  /* Birthstones (Rare): the twelve stones of the months circle the streak on a gold chain, and this month's stone shines brightest */
  var GW_BIRTH = [[350, 70, 32], [272, 62, 54], [186, 62, 64], [205, 20, 88], [148, 72, 38], [32, 30, 88, 'cab'], [350, 85, 46], [80, 75, 46], [222, 80, 48], [210, 35, 80, 'opal'], [40, 92, 54], [176, 58, 48, 'cab']];
  FX_AURA.birthstones = function (s) {
    var mo = new Date().getMonth(), glow = GW_BIRTH.map(function (g) { return gwRgb(g[0], g[1], Math.max(55, g[2])); });
    return function (t) {
      var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, rx = Math.min(s.w * 0.4, 160), ry = Math.min(s.h * 0.36, 52), rot = t * 0.22, sweep = t * 0.9, sc = Math.min(1.25, s.h / 120 + 0.15), L = [], i;
      c.globalCompositeOperation = 'lighter';
      fxGlow(c, '253,224,71', x0, y0, rx * 1.1, 0.05); fxRing(c, x0, y0, rx, ry, '253,224,71', 0.3, 1.2); fxRing(c, x0, y0, rx, ry, '253,224,71', 0.12, 3);
      for (i = 0; i < 12; i++) { var a = rot + i / 12 * FX_TAU; L.push({ i: i, a: a, d: Math.sin(a), x: x0 + Math.cos(a) * rx, y: y0 + Math.sin(a) * ry }); }
      L.sort(function (p, q) { return p.d - q.d; });
      L.forEach(function (p) {
        var g = GW_BIRTH[p.i], me = p.i === mo, depth = 0.6 + 0.4 * (p.d + 1) / 2, r = (me ? 9.5 : 6.4) * depth * sc, lit = Math.pow(Math.max(0, Math.cos(p.a - sweep)), 18);
        if (me) { c.globalCompositeOperation = 'lighter'; fxGlow(c, glow[p.i], p.x, p.y, r * 4, 0.5 + 0.15 * Math.sin(t * 2.4)); }
        c.globalCompositeOperation = 'source-over';
        if (g[3]) { gwCab(c, p.x, p.y, r * 0.86, g[0], g[1], g[2], lit, depth, g[3] === 'opal', t); }
        else { gwGem(c, p.x, p.y, r, g[0], g[1], g[2], lit, depth, p.a * 0.5); }
        if (me || lit > 0.2) { c.globalCompositeOperation = 'lighter'; fxStar4(c, p.x + r * 0.3, p.y - r * 0.35, me ? r * (1.3 + 0.5 * Math.sin(t * 3)) : r * 1.8 * lit, me ? 0.9 : lit, '#FFFFFF'); }
      });
    };
  };
  /* Snow globe (Rare): the streak sits in a snow globe; every few seconds it is shaken and the snow swirls, then settles */
  FX_AURA.snowglobe = function (s) {
    var F = [], sh = -1, next = 2.2, i;
    for (i = 0; i < 54; i++) { var a = fxR(0, FX_TAU), r = Math.sqrt(Math.random()); F.push({ x: Math.cos(a) * r * 0.85, y: fxR(0.5, 0.9), vx: 0, vy: 0, z: fxR(0.7, 1.7), ph: fxR(0, 6) }); }
    return function (t, dt) {
      var c = s.ctx, bh = Math.min(16, s.h * 0.12), rx = Math.min(s.w * 0.36, 128), ry = Math.min((s.h - bh) * 0.46, 70), y0 = (s.h - bh) / 2 + 2, wob = 0, cx, by;
      if (t > next && sh < 0) { sh = t; var spin = Math.random() < 0.5 ? 1 : -1; F.forEach(function (f) { var sp = fxR(1.4, 2.4) * spin; f.vx = -(f.y - 0.1) * sp + fxR(-0.3, 0.3); f.vy = f.x * sp - fxR(0.9, 1.7); }); }
      if (sh >= 0) { var u = t - sh; wob = Math.sin(u * 30) * 4 * Math.max(0, 1 - u / 0.7); if (u > 6.5) { sh = -1; next = t + fxR(1.5, 3); } }
      cx = s.w / 2 + wob; by = y0 + ry * 0.9;
      /* the stand */
      c.globalCompositeOperation = 'source-over';
      var wg = c.createLinearGradient(0, by, 0, by + bh); wg.addColorStop(0, '#8A5A3B'); wg.addColorStop(1, '#3B2416');
      c.fillStyle = wg; c.beginPath(); c.moveTo(cx - rx * 0.56, by); c.lineTo(cx + rx * 0.56, by); c.lineTo(cx + rx * 0.68, by + bh); c.lineTo(cx - rx * 0.68, by + bh); c.closePath(); c.fill();
      c.fillStyle = '#E2B04A'; c.fillRect(cx - rx * 0.6, by + bh * 0.28, rx * 1.2, Math.max(1.5, bh * 0.14));
      /* inside the glass: a night sky, a snow drift, two little pines, and the snow */
      c.save(); c.beginPath(); c.ellipse(cx, y0, rx, ry, 0, 0, FX_TAU); c.clip();
      var sg = c.createRadialGradient(cx, y0 - ry * 0.3, 2, cx, y0, rx); sg.addColorStop(0, 'rgba(59,130,246,.28)'); sg.addColorStop(1, 'rgba(30,27,75,.2)'); c.fillStyle = sg; c.fillRect(cx - rx, y0 - ry, rx * 2, ry * 2);
      [-1, 1].forEach(function (sd) { var tx = cx + sd * rx * 0.62, ty = y0 + ry * 0.72, z = ry * 0.2; for (var j = 0; j < 3; j++) { var w = z * (1 - j * 0.24), yy = ty - j * z * 0.55; c.fillStyle = '#166534'; c.beginPath(); c.moveTo(tx, yy - z * 0.75); c.lineTo(tx + w, yy); c.lineTo(tx - w, yy); c.closePath(); c.fill(); c.fillStyle = '#F1F5F9'; c.beginPath(); c.moveTo(tx, yy - z * 0.75); c.lineTo(tx + w * 0.35, yy - z * 0.48); c.lineTo(tx - w * 0.35, yy - z * 0.48); c.closePath(); c.fill(); } });
      c.fillStyle = '#E2E8F0'; c.beginPath(); c.ellipse(cx, y0 + ry * 1.02, rx * 0.98, ry * 0.3, 0, 0, FX_TAU); c.fill();
      /* a cabin in the drift, its window lit and its chimney smoking */
      var hz = Math.max(7, ry * 0.17), hx = cx + rx * 0.28, hy = y0 + ry * 0.78;
      c.fillStyle = '#7C2D12'; c.fillRect(hx - hz, hy - hz * 0.9, hz * 2, hz * 0.9);
      c.fillStyle = '#F8FAFC'; c.beginPath(); c.moveTo(hx - hz * 1.25, hy - hz * 0.86); c.lineTo(hx, hy - hz * 1.75); c.lineTo(hx + hz * 1.25, hy - hz * 0.86); c.closePath(); c.fill();
      c.fillStyle = '#44403C'; c.fillRect(hx + hz * 0.45, hy - hz * 1.75, hz * 0.32, hz * 0.6);
      c.fillStyle = '#FDE68A'; c.fillRect(hx - hz * 0.55, hy - hz * 0.62, hz * 0.42, hz * 0.36); c.fillRect(hx + hz * 0.15, hy - hz * 0.62, hz * 0.42, hz * 0.36);
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', hx, hy - hz * 0.45, hz * 1.9, 0.32 + 0.06 * Math.sin(t * 3.1));
      for (var q = 0; q < 4; q++) { var su = (t * 0.32 + q / 4) % 1; fxGlow(c, '203,213,225', hx + hz * 0.6 + Math.sin(su * 5 + q) * 3 + su * 6, hy - hz * 1.8 - su * ry * 0.55, 2 + su * 4, 0.3 * (1 - su)); }
      F.forEach(function (f) {
        var floor = 0.86 - Math.abs(f.x) * 0.25;
        f.vx *= Math.pow(0.35, dt); if (f.vy < 0) { f.vy *= Math.pow(0.3, dt); } f.vy = Math.min(0.24, f.vy + dt * 1.1);
        if (f.y < floor || f.vy < 0) { f.x += (f.vx + Math.sin(t * 1.3 + f.ph) * 0.04) * dt; f.y += f.vy * dt; }
        if (f.y > floor) { f.y = floor; f.vx = 0; }
        var d = f.x * f.x + f.y * f.y; if (d > 0.88) { var k = Math.sqrt(0.88 / d); f.x *= k; f.y *= k; f.vx *= -0.3; }
        fxGlow(c, '241,245,249', cx + f.x * rx, y0 + f.y * ry, 2.2 * f.z, 0.75);
      });
      c.restore();
      /* the glass */
      c.globalCompositeOperation = 'lighter';
      fxRing(c, cx, y0, rx, ry, '224,242,254', 0.5, 1.4);
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.ellipse(cx, y0, rx * 0.86, ry * 0.86, 0, 3.55, 4.25); c.stroke();
      c.lineWidth = 2; c.beginPath(); c.ellipse(cx, y0, rx * 0.86, ry * 0.86, 0, 4.4, 4.55); c.stroke();
    };
  };
  /* Crystal choir (Epic): crystals stand on either side of the streak and glow one after another like the notes of a chord,
     each sending up a ring and a wisp of sound; every eight seconds they all sing together */
  FX_AURA.choir = function (s) {
    var C = [], seq = [0, 4, 1, 5, 2, 6, 3, 7], H = [268, 228, 190, 300, 282, 205, 320, 248], i;
    for (i = 0; i < 8; i++) { var j = i % 4; C.push({ sd: i < 4 ? -1 : 1, off: 0.44 + 0.17 * j, hgt: [0.62, 1, 0.8, 0.52][j], tilt: [0.05, -0.02, -0.08, -0.16][j], wid: [10, 14, 12, 9][j], h: H[i], rgb: gwRgb(H[i], 85, 70), at: seq.indexOf(i) * 0.5 + 0.3 }); }
    var M = []; for (i = 0; i < 14; i++) { M.push({ x: fxR(-1, 1), u: Math.random(), sp: fxR(0.08, 0.16), ph: fxR(0, 6) }); }
    return function (t, dt) {
      var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, W = Math.min(s.w * 0.45, 200), H2 = Math.min(s.h * 0.66, 96), floor = y0 + Math.min(s.h * 0.36, 52), cyc = t % 8, chord = fxEnv(cyc, 5.1, 5.35, 6.2, 7.4);
      c.globalCompositeOperation = 'lighter';
      fxGlow(c, '167,139,250', x0, floor, W * 1.2, 0.1 + 0.12 * chord); c.fillStyle = 'rgba(196,181,253,.18)'; c.fillRect(x0 - W * 1.05, floor, W * 2.1, 1);
      M.forEach(function (m) { m.u = (m.u + dt * m.sp) % 1; fxGlow(c, '233,213,255', x0 + m.x * W * 1.05 + Math.sin(t + m.ph) * 5, floor - m.u * H2 * 1.1, 2, Math.sin(m.u * Math.PI) * 0.6); });
      C.forEach(function (q) {
        var sing = Math.max(chord, fxEnv(cyc, q.at, q.at + 0.1, q.at + 0.4, q.at + 1.0)), L = H2 * q.hgt, bx = x0 + q.sd * W * q.off, an = -Math.PI / 2 + q.sd * q.tilt, tx = bx + Math.cos(an) * L, ty = floor + Math.sin(an) * L;
        c.globalCompositeOperation = 'source-over';
        gwPrism(c, bx, floor, an, L, q.wid * Math.min(1, s.h / 130 + 0.25), q.h, 70, 48, sing, 0.92);
        c.globalCompositeOperation = 'lighter';
        fxGlow(c, q.rgb, (bx + tx) / 2, (floor + ty) / 2, L * 0.55, 0.12 + 0.5 * sing);
        if (sing > 0.02) {
          fxStar4(c, tx, ty, 5 + 9 * sing, sing, '#FFFFFF');
          var v = Math.min(1, Math.max(0, (cyc - q.at) / 1.4));
          if (v > 0 && v < 1 && chord < 0.05) {
            fxRing(c, tx, ty, 4 + v * 26, 2 + v * 10, q.rgb, (1 - v) * 0.7, 1.2);
            c.strokeStyle = 'rgba(' + q.rgb + ',' + (0.6 * (1 - v)).toFixed(3) + ')'; c.lineWidth = 1.2; c.beginPath();
            for (var k = 0; k <= 10; k++) { var yy = ty - 4 - k * 2.6 * (0.4 + v), xx = tx + Math.sin(k * 0.9 - t * 9) * 2.5 * (k / 10); if (k) { c.lineTo(xx, yy); } else { c.moveTo(xx, yy); } } c.stroke();
          }
        }
      });
      if (chord > 0) { var cv = (cyc - 5.1) / 2.3; [0, 0.18].forEach(function (d) { var v = cv - d; if (v > 0 && v < 1) { fxRing(c, x0, floor - H2 * 0.35, 20 + v * W * 1.4, 8 + v * H2 * 0.8, '233,213,255', (1 - v) * 0.6, 1.5); } }); }
    };
  };
  /* Sundog (Legendary): the streak is a low winter sun inside a halo of ice light, with a bright mock sun on each side,
     an arc above, a pillar and a line of light through it, and diamond dust glittering in the cold air */
  FX_AURA.sundog = function (s) {
    var Dd = [], i; for (i = 0; i < 64; i++) { Dd.push({ x: Math.random(), y: Math.random(), z: fxR(0.5, 1.5), ph: fxR(0, 6), f: fxR(1.5, 4) }); }
    return function (t, dt) {
      var c = s.ctx, x0 = s.w / 2, y0 = s.h / 2, R = Math.min(s.w * 0.31, 112), p = 0.85 + 0.15 * Math.sin(t * 1.4), sw = t * 0.8, k;
      c.globalCompositeOperation = 'lighter';
      fxGlow(c, '255,251,235', x0, y0, R * 0.9, 0.5); fxGlow(c, '186,230,253', x0, y0, R * 2.3, 0.16);
      var g = c.createLinearGradient(0, 0, s.w, 0); g.addColorStop(0, 'rgba(224,242,254,0)'); g.addColorStop(0.5, 'rgba(255,255,255,' + (0.45 * p).toFixed(3) + ')'); g.addColorStop(1, 'rgba(224,242,254,0)');
      c.fillStyle = g; c.fillRect(0, y0 - 1, s.w, 2);
      c.save(); c.translate(x0, y0); c.scale(0.09, 1); fxGlow(c, '255,247,237', 0, 0, R * 1.5, 0.55 * p); c.restore();
      /* the halo: red on the inside edge, white, then blue fading outward */
      [[-2.6, '248,113,113', 0.34], [-1.3, '253,186,116', 0.36], [0, '255,255,255', 0.62], [1.5, '191,219,254', 0.34], [3.2, '147,197,253', 0.16]].forEach(function (b) { fxRing(c, x0, y0, R + b[0], R + b[0], b[1], b[2] * p, 1.7); });
      for (k = 0; k < 12; k++) { var a = sw - k * 0.045; fxGlow(c, '255,255,255', x0 + Math.cos(a) * R, y0 + Math.sin(a) * R, 7, 0.45 * (1 - k / 12)); }
      /* the upper tangent arc, touching the top of the halo */
      if (y0 - R * 1.3 > 3) { [['248,113,113', 2.5, 0.25], ['255,255,255', 0, 0.42]].forEach(function (b) { c.strokeStyle = 'rgba(' + b[0] + ',' + (b[2] * p).toFixed(3) + ')'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x0 - R * 0.95, y0 - R * 1.3 + b[1]); c.quadraticCurveTo(x0, y0 - R * 0.7 + b[1], x0 + R * 0.95, y0 - R * 1.3 + b[1]); c.stroke(); }); }
      /* the two sun dogs: red toward the sun, white, then a blue tail running away from it */
      [-1, 1].forEach(function (sd) {
        var dx = x0 + sd * (R + 5), tw = 0.8 + 0.2 * Math.sin(t * 3.1 + sd);
        c.save(); c.translate(dx, y0); c.scale(0.8, 1.5);
        fxGlow(c, '248,113,113', -sd * 4, 0, 9, 0.6 * p); fxGlow(c, '253,224,71', -sd * 1.5, 0, 10, 0.55 * p); fxGlow(c, '255,255,255', sd * 1.5, 0, 12, 0.95 * p * tw); fxGlow(c, '147,197,253', sd * 7, 0, 13, 0.35 * p);
        c.restore();
        var tg = c.createLinearGradient(dx, 0, dx + sd * R * 1.2, 0); tg.addColorStop(0, 'rgba(255,255,255,' + (0.5 * p).toFixed(3) + ')'); tg.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = tg; c.fillRect(Math.min(dx, dx + sd * R * 1.2), y0 - 1.5, R * 1.2, 3);
        fxStar4(c, dx + sd * 1.5, y0, 7 + 4 * tw, 0.9 * p, '#FFFFFF');
      });
      Dd.forEach(function (q) {
        q.y += dt * 0.025 * q.z; if (q.y > 1) { q.y -= 1; q.x = Math.random(); }
        var x = (q.x + Math.sin(t * 0.3 + q.ph) * 0.01) * s.w, y = q.y * s.h, f = Math.pow(Math.max(0, Math.sin(t * q.f + q.ph)), 10);
        fxGlow(c, '224,242,254', x, y, 1.6 * q.z, 0.3 + 0.2 * q.z); if (f > 0.05) { fxStar4(c, x, y, 4 * q.z * f, f, '#FFFFFF'); }
      });
    };
  };
  /* Supercell (Mythic, a stage aura): a great storm stands over the streak at sunset. Its anvil streams off across the sky
     with pouches hanging under it, the tower glows where the low sun reaches it and turns slowly at its base, lightning
     flickers inside and strikes the ground, and a rainbow shows in the rain shaft while a windmill spins on the farm below */
  gwStage('supercell', function () {
    var R = gwRng(41), L = [], Rt = [], Mm = [], Rn = [], Hl = [], Dust = [], ev = null, next = 1.2, i;
    var BOW = ['239,68,68', '249,115,22', '250,204,21', '34,197,94', '59,130,246', '99,102,241', '168,85,247'];
    /* puffs down the sunlit left side and the shaded right side of the tower */
    for (i = 0; i < 6; i++) { var y = 100 - i * 11.5; L.push({ x: -104 + i * 3.4 + (R() - 0.5) * 6, y: y, r: 13 + R() * 7, ph: R() * 6 }); Rt.push({ x: 8 - i * 3.4 + (R() - 0.5) * 6, y: y - 4, r: 11 + R() * 7, ph: R() * 6 }); }
    [[-72, 44, 15], [-48, 40, 16], [-24, 43, 14]].forEach(function (q) { L.push({ x: q[0], y: q[1], r: q[2], ph: R() * 6 }); });
    for (i = 0; i < 11; i++) { Mm.push({ x: 16 + i * 14 + (R() - 0.5) * 5, r: 4.5 + R() * 3, ph: R() * 6 }); }
    for (i = 0; i < 40; i++) { Rn.push({ x: R(), o: R(), l: 6 + R() * 9 }); }
    for (i = 0; i < 16; i++) { Dust.push({ a: R() * FX_TAU, r: R(), h: R(), sp: 1.1 + R() * 1.4 }); }
    function anvil(c) { c.beginPath(); c.moveTo(-118, 36); c.bezierCurveTo(-124, 22, -96, 15, -64, 17); c.bezierCurveTo(-20, 12, 60, 13, 176, 21); c.lineTo(176, 33); c.bezierCurveTo(110, 37, 40, 44, -10, 45); c.bezierCurveTo(-60, 47, -110, 45, -118, 36); c.closePath(); }
    function tower(c, t) {
      c.beginPath(); c.moveTo(-108, 108); c.lineTo(-86, 42); c.lineTo(-8, 42); c.lineTo(14, 108); c.closePath();
      L.concat(Rt).forEach(function (p) { var r = p.r * (1 + 0.05 * Math.sin(t * 0.7 + p.ph)); c.moveTo(p.x + r, p.y); c.arc(p.x, p.y, r, 0, FX_TAU); });
      c.moveTo(-20, 21); c.ellipse(-46, 21, 26 + Math.sin(t * 0.5), 12, 0, 0, FX_TAU);
      c.moveTo(4, 108); c.bezierCurveTo(10, 93, 38, 88, 60, 95); c.bezierCurveTo(82, 90, 104, 98, 106, 108); c.closePath();
    }
    function cloud(c, t, lit) {
      c.save(); c.beginPath(); c.rect(-176, -20, 352, 128); c.clip();
      var ga = c.createLinearGradient(0, 14, 0, 46); ga.addColorStop(0, lit ? '#E0E7FF' : '#E8B4A6'); ga.addColorStop(0.45, lit ? '#C7D2FE' : '#8C8CAA'); ga.addColorStop(1, lit ? '#A5B4FC' : '#3A4462');
      c.fillStyle = ga; anvil(c); c.fill();
      var gt = c.createLinearGradient(-112, 0, 30, 0); gt.addColorStop(0, lit ? '#E0E7FF' : '#F0B088'); gt.addColorStop(0.3, lit ? '#C7D2FE' : '#A897AE'); gt.addColorStop(0.7, lit ? '#A5B4FC' : '#58648A'); gt.addColorStop(1, lit ? '#93A3F8' : '#2E3756');
      c.fillStyle = gt; tower(c, t); c.fill();
      if (!lit) {
        var gv = c.createLinearGradient(0, 30, 0, 108); gv.addColorStop(0, 'rgba(14,18,36,0)'); gv.addColorStop(0.45, 'rgba(14,18,36,.25)'); gv.addColorStop(1, 'rgba(14,18,36,.9)');
        c.fillStyle = gv; tower(c, t); c.fill();
        /* the low sun catches the left edge of each puff */
        c.lineCap = 'round'; c.lineWidth = 1.8;
        L.forEach(function (p, n) { if (n > 5) { return; } var r = p.r * (1 + 0.05 * Math.sin(t * 0.7 + p.ph)) - 1.2; c.strokeStyle = 'rgba(253,186,116,' + (0.22 + 0.05 * n).toFixed(3) + ')'; c.beginPath(); c.arc(p.x, p.y, r, Math.PI * (0.85 + 0.04 * (n % 3)), Math.PI * (1.3 + 0.05 * (n % 2))); c.stroke(); });
        c.strokeStyle = 'rgba(254,215,170,.5)'; c.beginPath(); c.ellipse(-46, 21, 24.5, 10.6, 0, Math.PI * 1.02, Math.PI * 1.55); c.stroke();
      }
      c.restore();
    }
    return function (c, t, dt) {
      var k, fl = 0;
      /* the sky: the sun has just set on the left; stars come out in the clear */
      c.globalCompositeOperation = 'lighter';
      fxGlow(c, '251,146,60', -170, 172, 160, 0.3); fxGlow(c, '244,114,182', -120, 130, 150, 0.1); fxGlow(c, '129,140,248', 120, 60, 160, 0.06);
      for (k = 0; k < 10; k++) { var sx0 = k < 6 ? -160 + (k * 29) % 40 : -110 + k * 31, sy0 = k < 6 ? 8 + (k * 17) % 70 : 4 + (k * 7) % 8; fxGlow(c, '255,255,255', sx0, sy0, 1.5, 0.25 + 0.3 * Math.sin(t * 1.7 + k * 2)); }
      /* the lightning picks its moment */
      if (!ev && t > next) {
        var ty = Math.random(); ev = { t0: t, type: ty < 0.4 ? 0 : ty < 0.78 ? 1 : 2, p: L.concat(Rt)[Math.floor(Math.random() * 12)] };
        if (ev.type === 1) { var bx = Math.random() < 0.5 ? fxR(-96, -80) : fxR(22, 84); ev.bolt = fxJag(bx, 108, bx + fxR(-18, 18), 159, 0.45, 5); var b = ev.bolt[11]; ev.br = fxJag(b[0], b[1], b[0] + fxR(-26, 26), b[1] + fxR(12, 24), 0.5, 3); }
        else if (ev.type === 2) { ev.bolt = fxJag(-30, 45, 168, 33, 0.1, 6); var b2 = ev.bolt[22]; ev.br = fxJag(b2[0], b2[1], b2[0] + fxR(12, 40), b2[1] + fxR(-10, -2), 0.3, 3); }
      }
      if (ev) { var e = t - ev.t0; fl = [1, 0.1, 0.8, 0, 0.55, 0.2, 0][Math.min(6, Math.floor(e / 0.06))]; if (e > 0.45) { ev = null; next = t + fxR(1.1, 3.2); } }
      /* the rain shaft under the shelf, with a rainbow in it and hail bouncing out of it */
      c.globalCompositeOperation = 'source-over';
      var rg = c.createLinearGradient(0, 106, 0, 160); rg.addColorStop(0, 'rgba(71,85,105,.2)'); rg.addColorStop(1, 'rgba(71,85,105,.05)'); c.fillStyle = rg;
      for (k = 0; k < 4; k++) { var w = k * 7; c.beginPath(); c.moveTo(10 + w, 106); c.lineTo(102 - w, 106); c.lineTo(92 - w - k * 2, 160); c.lineTo(-2 + w + k * 2, 160); c.closePath(); c.fill(); }
      c.globalCompositeOperation = 'lighter'; c.lineWidth = 2.6;
      var ba = 0.36 + 0.08 * Math.sin(t * 0.7);
      BOW.forEach(function (rgb, n) { c.strokeStyle = 'rgb(' + rgb + ')'; for (var q = 0; q < 12; q++) { var a0 = Math.PI * (1.27 + q * 0.04); c.globalAlpha = ba * Math.sin((q + 0.5) / 12 * Math.PI); c.beginPath(); c.arc(46, 214, 92 - n * 2.6, a0, a0 + Math.PI * 0.041); c.stroke(); } });
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'rgba(203,213,225,.38)'; c.lineWidth = 1;
      c.beginPath(); Rn.forEach(function (q) { var y = 108 + ((q.o * 52 + t * 160) % 52), x = 16 + q.x * 82 - (y - 108) * 0.2; c.moveTo(x, y); c.lineTo(x - 2.2, y + q.l); }); c.stroke();
      if (Hl.length < 7 && Math.random() < dt * 5) { Hl.push({ x: fxR(8, 86), y: 112, vy: fxR(60, 90), vx: fxR(-16, 6), b: 0 }); }
      c.fillStyle = '#F1F5F9';
      for (k = Hl.length - 1; k >= 0; k--) { var hq = Hl[k]; hq.vy += 300 * dt; hq.x += hq.vx * dt; hq.y += hq.vy * dt; if (hq.y > 159) { hq.y = 159; hq.vy *= -0.45; hq.b += 1; } if (hq.b > 3) { Hl.splice(k, 1); continue; } c.beginPath(); c.arc(hq.x, hq.y, 1.5, 0, FX_TAU); c.fill(); }
      /* the storm */
      cloud(c, t, false);
      Mm.forEach(function (m, n) { var r = m.r * (1 + 0.08 * Math.sin(t * 1.2 + m.ph)), yb = 44 - (m.x + 10) / 186 * 11; c.fillStyle = '#353F5C'; c.beginPath(); c.arc(m.x, yb - 1, r, 0, Math.PI); c.fill(); c.strokeStyle = 'rgba(251,146,60,.5)'; c.lineWidth = 1.1; c.beginPath(); c.arc(m.x, yb - 1, r, 0.35, Math.PI - 0.35); c.stroke(); });
      /* the wall cloud under the tower, and the slow turn of the updraft */
      c.fillStyle = '#151C30'; c.beginPath(); c.moveTo(-76, 107); c.lineTo(-16, 107); c.bezierCurveTo(-14, 116, -20, 123, -30, 124); c.lineTo(-62, 124); c.bezierCurveTo(-74, 123, -78, 116, -76, 107); c.closePath(); c.fill();
      c.lineCap = 'round';
      for (k = 0; k < 5; k++) {
        var wc = k < 2, ey = wc ? 112 + k * 5 : 101 - (k - 2) * 10, erx = wc ? 26 - k * 5 : 52 - (k - 2) * 4, ery = wc ? 3 : 4.5, ph = ((t * (wc ? 0.9 : 0.5) + k * 0.7) % 1.6) - 0.3;
        c.strokeStyle = wc ? 'rgba(148,163,184,.16)' : 'rgba(226,232,240,.1)'; c.lineWidth = wc ? 1.4 : 2.4; c.beginPath(); c.ellipse(-46, ey, erx, ery, 0, 0.1, Math.PI - 0.1); c.stroke();
        c.strokeStyle = wc ? 'rgba(203,213,225,.32)' : 'rgba(254,215,170,.24)'; c.beginPath(); c.ellipse(-46, ey, erx, ery, 0, Math.max(0.1, Math.PI * ph), Math.min(Math.PI - 0.1, Math.PI * (ph + 0.3))); c.stroke();
      }
      if (fl > 0) {
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.32 * fl; cloud(c, t, true); c.globalAlpha = 1;
        if (ev.type === 0) { fxGlow(c, '219,234,254', ev.p.x, ev.p.y, ev.p.r * 2.6, 0.85 * fl); }
        if (ev.type === 1) { fxBolt(c, ev.bolt, fl, '191,219,254'); fxBolt(c, ev.br, fl * 0.7, '191,219,254'); fxGlow(c, '219,234,254', ev.bolt[ev.bolt.length - 1][0], 159, 28, fl); fxGlow(c, '191,219,254', 0, 120, 170, 0.12 * fl); }
        if (ev.type === 2) { fxBolt(c, ev.bolt, fl * 0.85, '196,181,253'); fxBolt(c, ev.br, fl * 0.6, '196,181,253'); }
      }
      /* inflow: dust turning in toward the wall cloud */
      c.globalCompositeOperation = 'source-over';
      Dust.forEach(function (d) { var a = d.a + t * d.sp, rr = 18 + d.r * 40, yy = 158 - d.h * 34; c.fillStyle = 'rgba(203,213,225,' + (0.3 * (0.5 + 0.5 * Math.sin(a))).toFixed(3) + ')'; c.fillRect(-46 + Math.cos(a) * rr, yy + Math.sin(a) * 3, 1.6, 1.6); });
      /* the land: a low rise, a fence in the last light, a farmhouse with a lit window and a windmill spinning in the gusts */
      c.fillStyle = '#0A0E1C'; c.beginPath(); c.moveTo(-176, 196); c.lineTo(-176, 160); c.quadraticCurveTo(-90, 153, 0, 159); c.quadraticCurveTo(90, 165, 176, 156); c.lineTo(176, 196); c.closePath(); c.fill();
      c.strokeStyle = '#0A0E1C'; c.lineWidth = 1.2; c.beginPath(); for (k = 0; k < 6; k++) { c.moveTo(-160 + k * 11, 158); c.lineTo(-160 + k * 11, 151); } c.moveTo(-162, 153.5); c.lineTo(-103, 153.5); c.stroke();
      c.fillStyle = '#05070F'; c.fillRect(112, 150, 16, 10); c.beginPath(); c.moveTo(110, 151); c.lineTo(120, 142); c.lineTo(130, 151); c.closePath(); c.fill();
      c.fillStyle = 'rgba(253,224,71,' + (0.75 + 0.15 * Math.sin(t * 3.3)).toFixed(3) + ')'; c.fillRect(116, 153, 3, 3);
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', 117.5, 154.5, 7, 0.35); c.globalCompositeOperation = 'source-over';
      c.strokeStyle = '#05070F'; c.lineWidth = 2; c.beginPath(); c.moveTo(146, 158); c.lineTo(148, 133); c.lineTo(150, 158); c.stroke();
      c.lineWidth = 1.6; c.beginPath(); for (k = 0; k < 4; k++) { var ba = t * 3.4 + k * Math.PI / 2; c.moveTo(148, 133); c.lineTo(148 + Math.cos(ba) * 10, 133 + Math.sin(ba) * 10); } c.stroke();
      c.strokeStyle = 'rgba(30,41,59,.95)'; c.lineWidth = 1; c.beginPath();
      for (k = 0; k < 24; k++) { var gx = -168 + k * 14.5, lean = gx < -46 ? 1 : -1, sway = lean * (2 + Math.sin(t * 2.6 + k) * 1.5); c.moveTo(gx, 162); c.quadraticCurveTo(gx + sway * 0.5, 158, gx + sway, 155); }
      c.stroke();
      if (fl > 0 && ev && ev.type === 1) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '191,219,254', ev.bolt[ev.bolt.length - 1][0], 160, 60, 0.25 * fl); }
    };
  });

  /* ---------- right-answer effects, drawn on a layer over the page around your answer (k is its box) ---------- */
  /* light that adds up on a dark page; over the half-clear shade on a light page, adding would darken it, so paint over instead */
  function gwLit(c) { c.globalCompositeOperation = FX_INK.dark ? 'lighter' : 'source-over'; }
  var GW_BOW = ['239,68,68', '249,115,22', '250,204,21', '34,197,94', '59,130,246', '99,102,241', '168,85,247'];
  FX_DUR.glint = 1.0; FX_DUR.raindrop = 1.4; FX_DUR.geode = 1.7; FX_DUR.gust = 1.5; FX_DUR.sunshower = 2.6; FX_DUR.twister = 3.2; FX_DUR.motherlode = 3.9;
  /* Glint (Common): a sheen sweeps across your answer and a cut gem flashes at its corner */
  FX_DRAW.glint = function (s, k) {
    var F = [], i; for (i = 0; i < 6; i++) { F.push({ u: (i + fxR(0.2, 0.8)) / 6, v: fxR(0.1, 0.9), z: fxR(4, 7) }); }
    return function (t) {
      var c = s.ctx, D = FX_INK.dark, sw = (t - 0.04) / 0.5, gx = k.x + k.w - 12, gy = k.y + 1, pu = Math.min(1, t / 0.24), pop = fxEase(pu) * (1 + 0.3 * Math.sin(pu * Math.PI)), out = 1 - fxEase(Math.max(0, (t - 0.7) / 0.3)), fl = fxEnv(t, 0.36, 0.44, 0.5, 0.7);
      if (sw > 0 && sw < 1) {
        c.save(); c.beginPath(); fxRR(c, k.x, k.y, k.w, k.h, 12); c.clip();
        var bx = k.x - 40 + sw * (k.w + 80), g = c.createLinearGradient(bx - 40, 0, bx + 40, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,' + (D ? 0.34 : 0.8) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(bx - 14, k.y - 4); c.lineTo(bx + 40, k.y - 4); c.lineTo(bx + 14, k.y + k.h + 4); c.lineTo(bx - 40, k.y + k.h + 4); c.closePath(); c.fill();
        c.restore();
      }
      F.forEach(function (f) { var u = (t - 0.04 - f.u * 0.5) / 0.32; if (u > 0 && u < 1) { var x = k.x + f.u * k.w, y = k.y + f.v * k.h, r = f.z * Math.sin(u * Math.PI); fxStar4(c, x, y, r, 0.9, D ? '#7DD3FC' : '#0284C7'); fxStar4(c, x, y, r * 0.45, 1, '#FFFFFF'); } });
      if (D) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '125,211,252', gx, gy, 26 * pop, 0.45 * out); c.globalCompositeOperation = 'source-over'; }
      gwGem(c, gx, gy, 12 * pop, 199, 89, D ? 64 : 50, fl, out, -0.4 + t * 0.5);
      if (fl > 0) { fxStar4(c, gx + 2, gy - 3, 22 * fl, fl * 0.85, D ? '#BAE6FD' : '#0EA5E9'); fxStar4(c, gx + 2, gy - 3, 12 * fl, fl, '#FFFFFF'); }
    };
  };
  /* Raindrop (Common): one fat drop falls on your answer, splashes, and rings spread across it */
  FX_DRAW.raindrop = function (s, k) {
    var ix = k.x + k.w * 0.74, Dp = [], i;
    for (i = 0; i < 8; i++) { var a = -Math.PI / 2 + (i - 3.5) * 0.3; Dp.push({ vx: Math.cos(a) * fxR(60, 120), vy: Math.sin(a) * fxR(150, 240), z: fxR(1.6, 3) }); }
    return function (t) {
      var c = s.ctx, D = FX_INK.dark, col = D ? '147,197,253' : '37,99,235', hit = 0.34, iy = k.cy, out = 1 - fxEase(Math.max(0, (t - 1.05) / 0.35));
      if (t < hit) {
        var u = t / hit, y = iy - 160 + 160 * u * u, z = 6.5, g = c.createLinearGradient(ix - z, y - z * 2, ix + z, y + z);
        g.addColorStop(0, 'rgba(' + col + ',.55)'); g.addColorStop(1, 'rgba(' + col + ',.95)');
        c.fillStyle = g; c.beginPath(); c.moveTo(ix, y - z * 2.5); c.quadraticCurveTo(ix + z * 1.1, y - z * 0.7, ix + z, y); c.arc(ix, y, z, 0, Math.PI); c.quadraticCurveTo(ix - z * 1.1, y - z * 0.7, ix, y - z * 2.5); c.fill();
        c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(ix - z * 0.4, y - z * 0.3, z * 0.22, z * 0.42, -0.4, 0, FX_TAU); c.fill();
        return;
      }
      var e = t - hit;
      c.save(); c.beginPath(); fxRR(c, k.x, k.y, k.w, k.h, 12); c.clip();
      for (i = 0; i < 3; i++) { var v = (e - i * 0.15) / 0.85; if (v > 0 && v < 1) { var rr = 5 + v * k.w * 0.5; fxRing(c, ix, iy, rr, rr * 0.32, col, (1 - v) * 0.85 * out, 2.2 - v * 1.2); } }
      c.restore();
      if (e < 0.12) { fxRing(c, ix, iy, 8 + e * 120, 3 + e * 40, col, 1 - e / 0.12, 2); }
      c.fillStyle = 'rgb(' + col + ')';
      Dp.forEach(function (d) { if (e > 0.6) { return; } c.globalAlpha = 1 - e / 0.6; c.beginPath(); c.arc(ix + d.vx * e, iy + d.vy * e + 560 * e * e, d.z, 0, FX_TAU); c.fill(); });
      c.globalAlpha = 1;
    };
  };
  /* the inside of a cracked geode, one half: a stone rim, a white band, lavender, then a ring of crystals round a dark hollow */
  function gwGeodeFace(c, r, P, D) {
    c.save(); gwPoly(c, P); c.fillStyle = D ? '#8A817C' : '#78716C'; c.fill(); c.clip();
    c.fillStyle = '#F5F5F4'; c.beginPath(); c.arc(0, 0, r * 0.82, 0, FX_TAU); c.fill();
    c.fillStyle = '#C4B5FD'; c.beginPath(); c.arc(0, 0, r * 0.74, 0, FX_TAU); c.fill();
    c.fillStyle = '#5B21B6'; c.beginPath(); c.arc(0, 0, r * 0.66, 0, FX_TAU); c.fill();
    for (var i = 0; i < 18; i++) { var a = i / 18 * FX_TAU, b = a + 0.17, m = a + 0.085, r1 = r * 0.66, r2 = r * (0.3 + 0.08 * (i % 3)); c.fillStyle = ['#A78BFA', '#DDD6FE', '#8B5CF6'][i % 3]; c.beginPath(); c.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); c.lineTo(Math.cos(m) * r2, Math.sin(m) * r2); c.lineTo(Math.cos(b) * r1, Math.sin(b) * r1); c.closePath(); c.fill(); }
    c.fillStyle = '#2E1065'; c.beginPath(); c.arc(0, 0, r * 0.26, 0, FX_TAU); c.fill();
    c.restore();
  }
  /* Geode (Rare): a plain round stone drops onto your answer, cracks, and falls open to show the crystals inside */
  FX_DRAW.geode = function (s, k) {
    var r = Math.max(15, Math.min(24, k.h * 0.44)), R = gwRng(Math.floor(Math.random() * 1e6)), J = [], O = [], Sp = [], i;
    for (i = 0; i <= 8; i++) { J.push([i === 0 || i === 8 ? 0 : (R() - 0.5) * r * 0.36, -r + i * r / 4]); }
    for (i = 0; i <= 16; i++) { var a = -Math.PI / 2 + i / 16 * FX_TAU, q = i % 16 === 0 || i === 8 ? 1 : 0.9 + R() * 0.16; O.push([Math.cos(a) * r * q, Math.sin(a) * r * q]); }
    var RH = J.concat(O.slice(0, 9).reverse()), LH = J.concat(O.slice(8, 17));
    for (i = 0; i < 16; i++) { Sp.push({ a: fxR(0, FX_TAU), v: fxR(40, 110), z: fxR(3, 7), col: ['#8B5CF6', '#C084FC', '#38BDF8', '#F472B6'][i % 4] }); }
    return function (t) {
      var c = s.ctx, D = FX_INK.dark, land = 0.28, gx = k.x + k.w - r - 16, cy, op = fxEase(Math.min(1, Math.max(0, (t - 0.62) / 0.38))), fade = 1 - fxEase(Math.max(0, (t - 1.35) / 0.35)), cr = Math.min(1, Math.max(0, (t - 0.38) / 0.2)), sh = t > 0.38 && t < 0.62 ? Math.sin(t * 90) * 1.4 : 0;
      if (t < land) { var u = t / land; cy = k.cy - 130 * (1 - u * u); } else { var b = t - land; cy = k.cy - Math.abs(Math.sin(b * 14)) * 9 * Math.exp(-b * 9); }
      c.globalAlpha = fade;
      if (op <= 0) {
        c.save(); c.translate(gx + sh, cy);
        var g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r); g.addColorStop(0, '#D6D3D1'); g.addColorStop(0.6, '#A8A29E'); g.addColorStop(1, '#57534E');
        c.fillStyle = g; gwPoly(c, O); c.fill(); c.strokeStyle = D ? '#D6D3D1' : '#44403C'; c.lineWidth = 1.2; c.stroke();
        c.fillStyle = 'rgba(68,64,60,.5)'; [[0.3, -0.2], [-0.4, 0.3], [0.1, 0.5], [-0.15, -0.5]].forEach(function (p) { c.beginPath(); c.arc(p[0] * r, p[1] * r, r * 0.06, 0, FX_TAU); c.fill(); });
        if (cr > 0) { c.strokeStyle = D ? '#F5F3FF' : '#1C1917'; c.lineWidth = 1.6; c.lineJoin = 'round'; c.beginPath(); var m = Math.max(1, Math.ceil(cr * 8)); c.moveTo(J[0][0], J[0][1]); for (i = 1; i <= m; i++) { c.lineTo(J[i][0], J[i][1]); } c.stroke(); if (cr > 0.5) { c.globalCompositeOperation = D ? 'lighter' : 'source-over'; fxGlow(c, '167,139,250', 0, 0, r * 1.3, (cr - 0.5) * (D ? 0.9 : 0.5)); } }
        c.restore();
      } else {
        if (D) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '167,139,250', gx, cy, r * 3.2, 0.6 * op * fade); c.globalCompositeOperation = 'source-over'; }
        [[-1, LH], [1, RH]].forEach(function (h) { c.save(); c.translate(gx + h[0] * op * r * 0.8, cy + op * 3); c.rotate(h[0] * op * 0.42); gwGeodeFace(c, r, h[1], D); c.restore(); });
        c.globalAlpha = fade;
        var e = t - 0.62;
        Sp.forEach(function (p) { var u2 = e / 0.75; if (u2 > 1) { return; } var d = p.v * (1 - Math.pow(1 - u2, 2)), x = gx + Math.cos(p.a) * d, y = cy + Math.sin(p.a) * d * 0.7 - 16 * u2, rr = p.z * Math.sin(u2 * Math.PI); fxStar4(c, x, y, rr, fade, p.col); fxStar4(c, x, y, rr * 0.4, fade, '#FFFFFF'); });
      }
      c.globalAlpha = 1;
    };
  };
  function gwLeaf(c, x, y, z, an, flip, col) { c.save(); c.translate(x, y); c.rotate(an); c.scale(1, flip); c.fillStyle = col; c.beginPath(); c.moveTo(-z, 0); c.quadraticCurveTo(0, -z * 0.7, z, 0); c.quadraticCurveTo(0, z * 0.7, -z, 0); c.fill(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-z, 0); c.lineTo(z * 0.8, 0); c.stroke(); c.restore(); }
  /* Gust (Rare): a gust of wind loops around your answer and carries three leaves away with it */
  FX_DRAW.gust = function (s, k) {
    var Ln = [], Lv = [], i;
    for (i = 0; i < 5; i++) { Ln.push({ y: k.cy + (i - 2) * k.h * 0.36, at: Math.abs(i - 2) * 0.05 + fxR(0, 0.04), amp: fxR(4, 10), ph: fxR(0, 6), loop: i === 2 }); }
    for (i = 0; i < 3; i++) { Lv.push({ L: { y: k.cy + (i - 1) * k.h * 0.55 - 6, amp: fxR(8, 14), ph: fxR(0, 6), loop: false }, at: 0.12 + i * 0.1, sp: fxR(5, 8), col: ['#16A34A', '#EA580C', '#CA8A04'][i] }); }
    function P(L, u) {
      var x = -80 + u * (s.w + 160), y = L.y + Math.sin(u * 8 + L.ph) * L.amp;
      if (L.loop) { var lu = (x - (k.cx - 50)) / 100; if (lu > 0 && lu < 1) { var a = fxEase(lu) * FX_TAU, R = Math.min(30, k.h * 0.75); x = k.cx - 50 + lu * 100 + Math.sin(a) * R; y = y - (1 - Math.cos(a)) * R; } }
      return [x, y];
    }
    return function (t) {
      var c = s.ctx, D = FX_INK.dark, col = D ? '224,242,254' : '56,116,170', j;
      c.lineCap = 'round'; c.lineJoin = 'round';
      Ln.forEach(function (L) {
        var hu = (t - L.at) / 1.05; if (hu < 0) { return; }
        for (j = 0; j < 6; j++) {
          var u0 = Math.max(0, hu - 0.34 * (j + 1) / 6), u1 = Math.min(1, hu - 0.34 * j / 6); if (u1 <= u0) { continue; }
          var a = (1 - j / 6) * (D ? 0.75 : 0.65), q, p0 = P(L, u0);
          [[5, 0.18], [2, 1]].forEach(function (W2) { c.lineWidth = W2[0]; c.strokeStyle = 'rgba(' + col + ',' + (a * W2[1]).toFixed(3) + ')'; c.beginPath(); c.moveTo(p0[0], p0[1]); for (q = 1; q <= 12; q++) { var pq = P(L, u0 + (u1 - u0) * q / 12); c.lineTo(pq[0], pq[1]); } c.stroke(); });
        }
      });
      Lv.forEach(function (v) { var u = (t - v.at) / 1.15; if (u < 0 || u > 1) { return; } var p = P(v.L, u); gwLeaf(c, p[0], p[1] - Math.sin(u * Math.PI) * 18, 9, t * v.sp, Math.cos(t * v.sp * 1.3), v.col); });
      fxCardGlow(c, k, D ? '125,211,252' : '14,165,233', 0.7 * fxEnv(t, 0.35, 0.55, 1.05, 1.5));
    };
  };
  /* Sun shower (Epic): the sky darkens, the sun breaks through above your answer, the rain turns gold in its light,
     and a rainbow arches over the answer */
  FX_DRAW.sunshower = function (s, k) {
    var Dr = [], n = Math.min(110, Math.round(s.w / 4)), i;
    for (i = 0; i < n; i++) { Dr.push({ x: Math.random(), y: fxR(-0.6, 1), v: fxR(0.8, 1.3), l: fxR(10, 18) }); }
    return function (t, dt) {
      var c = s.ctx, e = fxEnv(t, 0, 0.3, 2.1, 2.6), RB = k.w * 0.5 + 26, sx = Math.max(40, k.x + k.w * 0.16), sy = Math.max(40, k.cy - RB - 90), aim = Math.atan2(k.cy - sy, k.cx - sx), sun = fxEase(Math.min(1, Math.max(0, (t - 0.35) / 0.5))), bow = fxEase(Math.min(1, Math.max(0, (t - 0.85) / 0.75)));
      fxDim(c, s, k, 0.66 * e, '#0B1324');
      gwLit(c);
      for (i = 0; i < 10; i++) { fxBeam(c, sx, sy, aim + (i - 4.5) * 0.12 + Math.sin(t * 0.6 + i) * 0.03, Math.max(s.w, s.h) * sun, 0.028, 'rgba(253,230,138,' + (0.13 * e).toFixed(3) + ')'); }
      fxGlow(c, '253,186,116', sx, sy, 110 * sun, 0.5 * e); fxGlow(c, '253,224,71', sx, sy, 50 * sun, 0.9 * e); fxGlow(c, '255,251,235', sx, sy, 20 * sun, e);
      c.lineCap = 'round'; c.lineWidth = 1.4;
      Dr.forEach(function (d) { d.y += dt * d.v; if (d.y > 1.05) { d.y -= 1.15; d.x = Math.random(); } var x = d.x * s.w, y = d.y * s.h, ang = Math.atan2(y - sy, x - sx), lit = Math.max(0, 1 - Math.abs(ang - aim) / 0.62) * sun; c.strokeStyle = 'rgba(' + (lit > 0.35 ? '253,224,71' : '186,230,253') + ',' + (e * (0.32 + 0.5 * lit)).toFixed(3) + ')'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y + d.l); c.stroke(); });
      if (bow > 0) { c.lineWidth = 4.5; GW_BOW.forEach(function (rgb, m) { c.strokeStyle = 'rgba(' + rgb + ',' + (0.62 * e).toFixed(3) + ')'; c.beginPath(); c.arc(k.cx, k.cy, RB + 16 - m * 4.5, Math.PI, Math.PI * (1 + bow)); c.stroke(); }); }
      fxCardGlow(c, k, '253,224,71', 0.85 * e * sun);
    };
  };
  /* Twister (Legendary): the sky turns green-gray, a twister drops from the clouds, crosses your answer picking up sparks,
     then lifts back into the sky and lets them fall */
  FX_DRAW.twister = function (s, k) {
    var Db = [], Up = [], i, top = Math.max(34, k.y - 240), gnd = k.y + k.h + 4;
    for (i = 0; i < 34; i++) { Db.push({ h: Math.random(), a: fxR(0, FX_TAU), sp: fxR(5, 9), z: fxR(2, 4), kind: i % 3, col: ['#16A34A', '#CA8A04', '#94A3B8'][i % 3] }); }
    return function (t, dt) {
      var c = s.ctx, e = fxEnv(t, 0, 0.35, 2.75, 3.2), touch = fxEase(Math.min(1, Math.max(0, (t - 0.3) / 0.5))), lift = fxEase(Math.min(1, Math.max(0, (t - 2.2) / 0.55))), go = fxEase(Math.min(1, Math.max(0, (t - 0.45) / 1.9))), bx = k.x - 40 + go * (k.w + 80), H = gnd - top, cx0 = s.w * 0.5 + (bx - s.w * 0.5) * 0.25;
      var low = top + 14 + (H - 14) * touch * (1 - lift * 0.92), j;
      function X(u) { return cx0 + (bx - cx0) * u + Math.sin(u * 5 - t * 3) * 10 * u; }
      function Wd(u) { return 7 + 62 * Math.pow(1 - u, 2.4); }
      fxDim(c, s, k, 0.8 * e, '#0B1612');
      gwLit(c); fxGlow(c, '134,239,172', s.w * 0.5, top, s.w * 0.6, 0.1 * e);
      c.globalCompositeOperation = 'source-over';
      /* the funnel, as a soft shape with streaks turning round it */
      var n = 30, L = [], Rr = [];
      for (i = 0; i <= n; i++) { var u = i / n, y = top + 14 + u * (H - 14); if (y > low) { break; } L.push([X(u) - Wd(u), y]); Rr.push([X(u) + Wd(u), y]); }
      if (L.length > 1) {
        c.fillStyle = 'rgba(100,116,139,' + (0.5 * e).toFixed(3) + ')'; c.beginPath(); c.moveTo(L[0][0], L[0][1]); L.forEach(function (p) { c.lineTo(p[0], p[1]); }); for (i = Rr.length - 1; i >= 0; i--) { c.lineTo(Rr[i][0], Rr[i][1]); } c.closePath(); c.fill();
        c.lineWidth = 1.6; c.lineCap = 'round';
        for (j = 0; j < 7; j++) { for (i = 0; i < L.length - 1; i++) { var u1 = i / n, u2 = (i + 1) / n, a1 = j / 7 * FX_TAU + u1 * 11 - t * 11, a2 = j / 7 * FX_TAU + u2 * 11 - t * 11, f = Math.cos((a1 + a2) / 2); if (f < 0.05) { continue; } c.strokeStyle = 'rgba(226,232,240,' + (0.55 * f * e).toFixed(3) + ')'; c.beginPath(); c.moveTo(X(u1) + Wd(u1) * Math.sin(a1), L[i][1]); c.lineTo(X(u2) + Wd(u2) * Math.sin(a2), L[i + 1][1]); c.stroke(); } }
      }
      /* the cloud deck it hangs from */
      var cg = c.createLinearGradient(0, top - 30, 0, top + 22); cg.addColorStop(0, 'rgba(51,65,85,' + e + ')'); cg.addColorStop(1, 'rgba(15,23,42,' + e + ')');
      c.fillStyle = cg; gwCloud(c, s.w / 2, top + 16, s.w * 1.4, 44, 3, t); c.fill();
      /* dust where it touches down, and what it carries round */
      var onGround = touch > 0.98 && lift < 0.05;
      if (onGround) { gwLit(c); fxGlow(c, '148,163,184', bx, gnd, 46, 0.35 * e); c.globalCompositeOperation = 'source-over'; }
      Db.forEach(function (d) { var y = top + 20 + d.h * (H - 20); if (y > low) { return; } var u = (y - top - 14) / (H - 14), a = d.a + t * d.sp, x = X(u) + Wd(u) * 1.25 * Math.cos(a), yy = y + Wd(u) * 0.2 * Math.sin(a), f = 0.5 + 0.5 * Math.sin(a); c.globalAlpha = e * (0.4 + 0.6 * f); if (d.kind === 0) { gwLeaf(c, x, yy, d.z * 1.4, a, Math.cos(a * 1.7), d.col); } else { c.fillStyle = d.col; c.fillRect(x - d.z / 2, yy - d.z / 2, d.z, d.z); } c.globalAlpha = 1; });
      /* while it crosses the answer it lifts sparks off it; when it rises they fall */
      if (onGround && bx > k.x && bx < k.x + k.w && Up.length < 60) { for (i = 0; i < 2; i++) { Up.push({ a: fxR(0, FX_TAU), h: 0, sp: fxR(0.5, 0.9), fall: 0, x: 0, y: 0, vx: 0, vy: 0, col: ['253,224,71', '134,239,172', '125,211,252'][Up.length % 3] }); } }
      gwLit(c);
      Up.forEach(function (p) {
        if (lift < 0.15) { p.h = Math.min(1, p.h + dt * p.sp); p.a += dt * 8; var u = 1 - p.h, w = Wd(u) * 0.9; p.x = X(u) + w * Math.cos(p.a); p.y = top + 14 + u * (H - 14) + w * 0.2 * Math.sin(p.a); p.vx = -Math.sin(p.a) * 140; p.vy = -60; }
        else { p.vy += 260 * dt; p.vx *= Math.pow(0.5, dt); p.x += p.vx * dt; p.y += p.vy * dt; }
        fxGlow(c, p.col, p.x, p.y, 7, 0.9 * e); fxStar4(c, p.x, p.y, 4, e, '#FFFFFF');
      });
      if (t > 2.3) { fxRainbow(c, k, t, fxEnv(t, 2.3, 2.5, 2.8, 3.2)); } else { fxCardGlow(c, k, '134,239,172', 0.6 * e * touch); }
    };
  };
  /* Motherlode (Mythic): the page goes dark as a cave, golden seams crack outward from your answer, crystals burst out
     around it, a shower of cut gems flies up and falls, and the words "a rare find." are typed above it */
  FX_DRAW.motherlode = function (s, k) {
    var W = 'a rare find.', Cr = [], X = [], G = [], M = [], HU = [[270, 75, 62], [190, 80, 56], [330, 75, 64], [45, 92, 56], [150, 65, 50]], i;
    for (i = 0; i < 8; i++) { var p = fxPerim(k, (i + fxR(0.2, 0.8)) / 8 * 2 * (k.w + k.h)), dx = p[0] - k.cx, dy = (p[1] - k.cy) * 4, L = Math.hypot(dx, dy) || 1, len = fxR(0.25, 0.5) * Math.max(s.w, s.h); X.push(fxJag(p[0], p[1], p[0] + dx / L * len, p[1] + dy / L * len * 0.7, 0.4, 5)); }
    for (i = 0; i < 16; i++) { var up = i % 2 === 0, u = (Math.floor(i / 2) + fxR(0.15, 0.85)) / 8; Cr.push({ x: k.x + 8 + u * (k.w - 16), y: up ? k.y + 3 : k.y + k.h - 3, an: (up ? -Math.PI / 2 : Math.PI / 2) + (u - 0.5) * 1.1 + fxR(-0.25, 0.25), len: fxR(26, 62) * (up ? 1 : 0.7), wid: fxR(10, 17), c: HU[i % 5], at: 1.0 + fxR(0, 0.55) }); }
    [[k.x + 6, Math.PI * 1.2], [k.x + k.w - 6, -Math.PI * 0.2]].forEach(function (q, n) { Cr.push({ x: q[0], y: k.cy - 4, an: q[1], len: 62, wid: 20, c: HU[n * 2], at: 0.95 }); });
    for (i = 0; i < 26; i++) { var a = -Math.PI / 2 + fxR(-1.25, 1.25), v = fxR(260, 560); G.push({ x: k.cx + fxR(-k.w * 0.3, k.w * 0.3), y: k.cy, vx: Math.cos(a) * v * 0.8, vy: Math.sin(a) * v, r: fxR(5, 10), rot: fxR(0, 6), vr: fxR(-5, 5), c: HU[i % 5], fl: fxR(2, 4), ph: fxR(0, 6) }); }
    for (i = 0; i < 40; i++) { M.push({ x: Math.random(), y: Math.random(), z: fxR(0.6, 1.6), ph: fxR(0, 6) }); }
    return function (t, dt) {
      var c = s.ctx, e = fxEnv(t, 0, 0.35, 3.4, 3.9), g = Math.min(1, Math.max(0, (t - 0.3) / 0.8)), ty = Math.max(46, k.y - 92), n = Math.max(0, Math.min(W.length, Math.floor((t - 1.9) / 0.08)));
      fxDim(c, s, k, 0.93 * e, '#06050B');
      gwLit(c);
      M.forEach(function (m) { fxGlow(c, '253,230,138', m.x * s.w + Math.sin(t * 0.5 + m.ph) * 8, (m.y - t * 0.01 * m.z) * s.h, 1.6 * m.z, e * 0.35 * (0.5 + 0.5 * Math.sin(t * 2 + m.ph))); });
      /* golden seams */
      if (g > 0) { c.lineCap = 'round'; c.lineJoin = 'round'; X.forEach(function (P) { var m = Math.max(2, Math.ceil(g * P.length)); [[6, 0.14, '251,191,36'], [2.6, 0.5, '252,211,77'], [1, 1, '255,247,214']].forEach(function (Lw) { c.lineWidth = Lw[0]; c.strokeStyle = 'rgba(' + Lw[2] + ',' + (Lw[1] * e).toFixed(3) + ')'; c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (var q = 1; q < m; q++) { c.lineTo(P[q][0], P[q][1]); } c.stroke(); }); }); }
      /* shafts of light from above once the crystals are out */
      var sl = fxEnv(t, 1.2, 1.7, 3.2, 3.8); if (sl > 0) { for (i = 0; i < 3; i++) { fxBeam(c, k.cx + (i - 1) * k.w * 0.35, -20, Math.PI / 2 + (i - 1) * 0.1, k.cy + 60, 0.08, 'rgba(253,230,138,' + (0.12 * sl * e).toFixed(3) + ')'); } }
      /* crystals growing out round the answer */
      Cr.forEach(function (q) { var u = fxEase(Math.min(1, Math.max(0, (t - q.at) / 0.35))); if (u <= 0) { return; } var shine = fxEnv(t, q.at + 0.3, q.at + 0.4, q.at + 0.5, q.at + 0.9); gwLit(c); fxGlow(c, gwRgb(q.c[0], q.c[1], 66), q.x + Math.cos(q.an) * q.len * u * 0.5, q.y + Math.sin(q.an) * q.len * u * 0.5, q.len * 0.7 * u, 0.4 * e); c.globalCompositeOperation = 'source-over'; gwPrism(c, q.x, q.y, q.an, q.len * u, q.wid, q.c[0], q.c[1], q.c[2], shine, e); gwLit(c); if (shine > 0) { fxStar4(c, q.x + Math.cos(q.an) * q.len, q.y + Math.sin(q.an) * q.len, 12 * shine, shine * e, '#FFFFFF'); } });
      if (t > 1.0 && t < 1.6) { var v0 = (t - 1.0) / 0.6; fxRing(c, k.cx, k.cy, k.w * 0.5 + v0 * s.w * 0.4, k.h * 0.5 + v0 * s.h * 0.25, '253,230,138', (1 - v0) * 0.8, 3); }
      /* the shower of gems */
      if (t > 1.55) { G.forEach(function (q) { q.vy += 620 * dt; q.vx *= Math.pow(0.6, dt); q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt; var lit = Math.pow(Math.max(0, Math.sin(t * q.fl + q.ph)), 12); c.globalCompositeOperation = 'source-over'; gwGem(c, q.x, q.y, q.r, q.c[0], q.c[1], q.c[2], lit, e, q.rot); gwLit(c); if (lit > 0.1) { fxStar4(c, q.x, q.y, q.r * 2.4 * lit, lit * e, '#FFFFFF'); } }); }
      /* the words */
      if (n > 0 && t < 3.5) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = e; c.fillStyle = '#FDE68A'; c.font = '600 ' + Math.max(16, Math.min(24, s.w * 0.05)) + 'px ' + FX_MONO; c.textAlign = 'center'; c.fillText(W.slice(0, n) + (n < W.length && Math.floor(t * 6) % 2 ? '_' : ''), k.cx, ty); c.textAlign = 'left'; c.globalAlpha = 1; gwLit(c); }
      if (t > 2.2) { fxRainbow(c, k, t, fxEnv(t, 2.2, 2.5, 3.3, 3.8)); } else { fxCardGlow(c, k, '251,191,36', e * g); }
    };
  };

  /* ---------- papers: moving backgrounds behind the page at 30 frames a second. On a light page they are soft ink,
     on a dark page soft light, and they stay pale enough that the words on the page read as clearly as before ---------- */
  /* Cumulus (Common): fair-weather clouds drift slowly across the page, the far ones smaller, paler and slower */
  FX_PAPER.cumulus = function (s) {
    var C = [], i;
    for (i = 0; i < 7; i++) { C.push({ x: Math.random(), y: fxR(0.05, 0.95), z: 0.45 + i / 6 * 0.55, sd: 11 + i * 17, w: fxR(160, 260), h: fxR(44, 62) }); }
    return function (t) {
      var c = s.ctx, D = FX_INK.dark;
      C.forEach(function (q) {
        var w = q.w * q.z, h = q.h * q.z, span = s.w + w * 1.6, x = ((q.x * span + t * 7 * q.z) % span) - w * 0.8 + w / 2, y = q.y * s.h, g = c.createLinearGradient(0, y - h * 1.7, 0, y);
        if (D) { g.addColorStop(0, 'rgba(224,231,255,' + (0.13 * q.z).toFixed(3) + ')'); g.addColorStop(1, 'rgba(129,140,248,' + (0.06 * q.z).toFixed(3) + ')'); }
        else { g.addColorStop(0, 'rgba(191,205,225,' + (0.22 * q.z).toFixed(3) + ')'); g.addColorStop(1, 'rgba(148,163,184,' + (0.32 * q.z).toFixed(3) + ')'); }
        c.fillStyle = g; gwCloud(c, x, y, w, h, q.sd, t); c.fill();
      });
    };
  };
  /* Agate (Rare): banded agate fills two corners of the page, and every few seconds a gleam of light slides across the stone */
  FX_PAPER.agate = function (s) {
    var off = null, key = '', Out = [];
    var PL = ['#94A3B8', '#F8FAFC', '#CBD5E1', '#FFFFFF', '#C4B5FD', '#F1F5F9', '#7DD3FC', '#FFFFFF', '#FBCFE8', '#E2E8F0', '#FDBA74', '#F8FAFC', '#A5B4FC'], PD = ['#475569', '#CBD5E1', '#334155', '#E2E8F0', '#7C3AED', '#64748B', '#0284C7', '#F1F5F9', '#DB2777', '#1E293B', '#EA580C', '#CBD5E1', '#6366F1'];
    function stone(c, cx, cy, R, seed, P) {
      var rg = gwRng(seed), W = [], i, j, edge = [], r0 = R, n = 0;
      for (i = 0; i < 5; i++) { W.push([rg() * 6, 2 + Math.floor(rg() * 5), 0.03 + rg() * 0.05]); }
      while (r0 > R * 0.16) {
        c.beginPath();
        for (j = 0; j <= 100; j++) { var a = j / 100 * FX_TAU, rr = r0; W.forEach(function (w) { rr += Math.sin(a * w[1] + w[0] + n * 0.11) * w[2] * r0; }); var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.86; if (j) { c.lineTo(x, y); } else { c.moveTo(x, y); } if (!n) { edge.push([x, y]); } }
        c.closePath(); c.fillStyle = P[(n + seed) % P.length]; c.fill(); c.strokeStyle = 'rgba(71,85,105,.35)'; c.lineWidth = 0.6; c.stroke();
        r0 -= R * (0.012 + rg() * rg() * 0.07); n++;
      }
      for (i = 0; i < 40; i++) { var a2 = rg() * FX_TAU, d2 = Math.sqrt(rg()) * r0 * 0.9, x2 = cx + Math.cos(a2) * d2, y2 = cy + Math.sin(a2) * d2 * 0.86, z2 = 2 + rg() * 4; c.fillStyle = i % 2 ? '#FFFFFF' : '#E2E8F0'; c.beginPath(); c.moveTo(x2, y2 - z2); c.lineTo(x2 + z2 * 0.6, y2 + z2 * 0.5); c.lineTo(x2 - z2 * 0.6, y2 + z2 * 0.5); c.closePath(); c.fill(); }
      return edge;
    }
    return function (t) {
      var c = s.ctx, D = FX_INK.dark, d = s.c.width / Math.max(1, s.w), k2 = s.w + 'x' + s.h + ':' + D + ':' + d;
      if (k2 !== key) {
        key = k2; off = document.createElement('canvas'); off.width = Math.max(1, Math.round(s.w * d)); off.height = Math.max(1, Math.round(s.h * d));
        var o = off.getContext('2d'), R = Math.max(150, Math.min(Math.max(s.w, s.h) * 0.34, 420)); o.scale(d, d);
        Out = [stone(o, s.w + R * 0.12, -R * 0.1, R, 3, D ? PD : PL), stone(o, -R * 0.15, s.h + R * 0.05, R * 0.9, 8, D ? PD : PL)];
      }
      c.globalAlpha = D ? 0.2 : 0.34; c.drawImage(off, 0, 0, s.w, s.h); c.globalAlpha = 1;
      var u = (t % 8) / 2.2; if (u < 1) {
        c.save(); c.beginPath(); Out.forEach(function (E) { c.moveTo(E[0][0], E[0][1]); for (var j = 1; j < E.length; j++) { c.lineTo(E[j][0], E[j][1]); } c.closePath(); }); c.clip();
        var gx = -90 - 0.8 * s.h + u * (s.w + 180 + 0.8 * s.h), g = c.createLinearGradient(gx - 90, 0, gx + 90, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,' + (D ? 0.12 : 0.55) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.globalCompositeOperation = D ? 'lighter' : 'source-over'; c.fillStyle = g; c.transform(1, 0, -0.8, 1, 0.8 * s.h, 0); c.fillRect(gx - 90, 0, 180, s.h);
        c.restore();
      }
    };
  };
  /* Kites (Rare): three kites ride the breeze across the page, tugging at their strings, their tails rippling behind */
  FX_PAPER.kites = function (s) {
    var K = [{ x: 0.12, y: 0.2, z: 1, c1: '#EF4444', c2: '#FACC15', ph: 0 }, { x: 0.62, y: 0.12, z: 0.78, c1: '#2563EB', c2: '#22D3EE', ph: 2.1 }, { x: 0.4, y: 0.5, z: 0.62, c1: '#16A34A', c2: '#A855F7', ph: 4.2 }];
    return function (t) {
      var c = s.ctx, D = FX_INK.dark, al = D ? 0.55 : 0.5, ink = D ? 'rgba(226,232,240,' : 'rgba(71,85,105,', sc = Math.min(1.25, Math.max(0.75, s.w / 640));
      K.forEach(function (k) {
        var z = k.z * sc, W = 30 * z, H = 42 * z, x = (((k.x + t * 0.006 * k.z) % 1.25) - 0.12) * s.w + Math.sin(t * 0.7 + k.ph) * 16 * z, y = k.y * s.h + Math.sin(t * 0.9 + k.ph * 1.3) * 14 * z, rot = Math.sin(t * 1.1 + k.ph) * 0.16 - 0.12, j;
        var bx = x + Math.sin(rot) * H * 0.45, by = y + Math.cos(rot) * H * 0.45;
        c.strokeStyle = ink + '.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - Math.sin(rot) * H * 0.05, y + H * 0.05); c.quadraticCurveTo(x - s.w * 0.12, y + s.h * 0.45, x - s.w * 0.3, s.h + 30); c.stroke();
        /* the tail, rippling, with little bows */
        c.strokeStyle = ink + '.45)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(bx, by);
        var T = []; for (j = 1; j <= 14; j++) { var tx = bx - j * 5.5 * z, ty = by + j * 4.2 * z + Math.sin(t * 5 - j * 0.7 + k.ph) * 5 * z * (j / 14 + 0.3); c.lineTo(tx, ty); if (j % 3 === 0) { T.push([tx, ty, j]); } } c.stroke();
        c.globalAlpha = al; T.forEach(function (q) { c.fillStyle = q[2] % 2 ? k.c1 : k.c2; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0] - 4 * z, q[1] - 3 * z); c.lineTo(q[0] - 4 * z, q[1] + 3 * z); c.closePath(); c.moveTo(q[0], q[1]); c.lineTo(q[0] + 4 * z, q[1] - 3 * z); c.lineTo(q[0] + 4 * z, q[1] + 3 * z); c.closePath(); c.fill(); });
        /* the kite: four panels in two colors, with a cross of spars */
        c.save(); c.translate(x, y); c.rotate(rot);
        [[1, 0, k.c1], [-1, 0, k.c2], [1, 1, k.c2], [-1, 1, k.c1]].forEach(function (p) { c.fillStyle = p[2]; c.beginPath(); c.moveTo(0, p[1] ? H * 0.45 : -H * 0.55); c.lineTo(p[0] * W * 0.5, -H * 0.12); c.lineTo(0, -H * 0.12); c.closePath(); c.fill(); });
        c.globalAlpha = 1; c.strokeStyle = ink + '.55)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(0, -H * 0.55); c.lineTo(W * 0.5, -H * 0.12); c.lineTo(0, H * 0.45); c.lineTo(-W * 0.5, -H * 0.12); c.closePath(); c.moveTo(0, -H * 0.55); c.lineTo(0, H * 0.45); c.moveTo(-W * 0.5, -H * 0.12); c.lineTo(W * 0.5, -H * 0.12); c.stroke();
        c.restore();
      });
    };
  };
  /* Weather map (Epic): isobars ring a high and a low that drift slowly, a cold front and a warm front slide out from the low,
     and patches of rain pass along the front the way they do on radar */
  FX_PAPER.wxmap = function (s) {
    var Rd = [], i; for (i = 0; i < 9; i++) { Rd.push({ u: Math.random(), sp: fxR(0.01, 0.02), r: fxR(18, 40), ph: fxR(0, 6) }); }
    function front(u, Lx, Ly, cold) { return cold ? [Lx - u * s.w * 0.5, Ly + Math.sin(u * 2.4) * s.h * 0.16 + u * s.h * 0.12] : [Lx - u * s.w * 0.42, Ly - u * s.h * 0.3 - Math.sin(u * 3) * s.h * 0.05]; }
    return function (t) {
      var c = s.ctx, D = FX_INK.dark, Hx = s.w * (0.22 + 0.04 * Math.sin(t * 0.05)), Hy = s.h * (0.28 + 0.04 * Math.cos(t * 0.04)), Lx = s.w * (0.78 + 0.03 * Math.cos(t * 0.045)), Ly = s.h * (0.6 + 0.04 * Math.sin(t * 0.055)), R0 = Math.max(46, Math.min(s.w, s.h) * 0.11), j, n;
      var blue = D ? '147,197,253' : '37,99,235', red = D ? '252,165,165' : '220,38,38';
      /* radar rain along the cold front */
      if (D) { c.globalCompositeOperation = 'lighter'; }
      Rd.forEach(function (q) { var u = (q.u + t * q.sp) % 1, p = front(u, Lx, Ly, true), a = Math.sin(u * Math.PI) * (D ? 0.22 : 0.3); fxGlow(c, '74,222,128', p[0] + 18, p[1] + 10, q.r * 1.4, a); fxGlow(c, '250,204,21', p[0] + 16, p[1] + 8, q.r * 0.7, a * 0.9); if (q.r > 32) { fxGlow(c, '248,113,113', p[0] + 14, p[1] + 7, q.r * 0.3, a); } });
      c.globalCompositeOperation = 'source-over';
      /* isobars */
      c.lineWidth = 1.2; c.strokeStyle = D ? 'rgba(203,213,225,.17)' : 'rgba(71,85,105,.22)';
      [[Hx, Hy], [Lx, Ly]].forEach(function (P, m) { for (n = 1; n <= 5; n++) { c.beginPath(); for (j = 0; j <= 64; j++) { var a = j / 64 * FX_TAU, r = R0 * n * 0.9 * (1 + 0.12 * Math.sin(a * 2 + n + t * 0.1 + m) + 0.06 * Math.sin(a * 3 - t * 0.07)), x = P[0] + Math.cos(a) * r * 1.3, y = P[1] + Math.sin(a) * r; if (j) { c.lineTo(x, y); } else { c.moveTo(x, y); } } c.stroke(); } });
      c.font = '800 ' + Math.round(R0 * 0.6) + 'px ' + FX_MONO; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = 'rgba(' + blue + ',.4)'; c.fillText('H', Hx, Hy); c.fillStyle = 'rgba(' + red + ',.4)'; c.fillText('L', Lx, Ly); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      /* the fronts, with their marks sliding along */
      [[true, blue], [false, red]].forEach(function (F) {
        var cold = F[0], P = [], L = 0, k;
        for (j = 0; j <= 50; j++) { P.push(front(0.07 + j / 50 * 0.93, Lx, Ly, cold)); if (j) { L += Math.hypot(P[j][0] - P[j - 1][0], P[j][1] - P[j - 1][1]); } }
        c.strokeStyle = 'rgba(' + F[1] + ',.5)'; c.lineWidth = 2.2; c.beginPath(); P.forEach(function (p, m) { if (m) { c.lineTo(p[0], p[1]); } else { c.moveTo(p[0], p[1]); } }); c.stroke();
        c.fillStyle = 'rgba(' + F[1] + ',.5)';
        for (k = (t * 9) % 34 + 14; k < L - 8; k += 34) {
          var acc = 0; for (j = 1; j < P.length; j++) { var sl = Math.hypot(P[j][0] - P[j - 1][0], P[j][1] - P[j - 1][1]); if (acc + sl >= k) { break; } acc += sl; }
          if (j >= P.length) { break; }
          var f = (k - acc) / Math.max(0.01, Math.hypot(P[j][0] - P[j - 1][0], P[j][1] - P[j - 1][1])), x = P[j - 1][0] + (P[j][0] - P[j - 1][0]) * f, y = P[j - 1][1] + (P[j][1] - P[j - 1][1]) * f, an = Math.atan2(P[j][1] - P[j - 1][1], P[j][0] - P[j - 1][0]), nx = Math.sin(an), ny = -Math.cos(an);
          if (cold) { nx = -nx; ny = -ny; }
          c.beginPath();
          if (cold) { c.moveTo(x - Math.cos(an) * 7, y - Math.sin(an) * 7); c.lineTo(x + nx * 9, y + ny * 9); c.lineTo(x + Math.cos(an) * 7, y + Math.sin(an) * 7); }
          else { c.arc(x, y, 7, an + Math.PI, an + FX_TAU, ny > 0); }
          c.closePath(); c.fill();
        }
      });
    };
  };
  /* Crystal garden (Legendary): clusters of crystals grow from the corners of the page; light runs up them one at a time,
     their tips flash, and sparkles drift up out of them */
  FX_PAPER.cgarden = function (s) {
    var Cl = [], key = '', off = null, Mo = [], run = null, i;
    var HU = [[268, 70, 62], [199, 80, 56], [330, 70, 66], [174, 62, 48], [250, 75, 70], [45, 85, 58]];
    for (i = 0; i < 24; i++) { Mo.push({ c: i % 3, u: Math.random(), sp: fxR(0.03, 0.07), dx: fxR(-1, 1), ph: fxR(0, 6) }); }
    function layout() {
      var R = gwRng(5), z = Math.max(0.95, Math.min(1.45, Math.min(s.w, s.h) / 420)), out = [];
      [[0, s.h, -Math.PI / 4, 11, 1], [s.w, s.h, -Math.PI * 3 / 4, 10, 0.9], [s.w, 0, Math.PI * 3 / 4, 6, 0.62]].forEach(function (g, gi) {
        for (var j = 0; j < g[3]; j++) { var spread = (j / (g[3] - 1) - 0.5) * 1.5, h = HU[(j + gi * 2) % HU.length], len = (80 + R() * 120) * g[4] * z * (1 - Math.abs(spread) * 0.4); out.push({ g: gi, bx: g[0] + Math.cos(g[2] + spread + Math.PI / 2) * (R() - 0.5) * 40 * z, by: g[1] + Math.sin(g[2] + spread + Math.PI / 2) * (R() - 0.5) * 40 * z, an: g[2] + spread + (R() - 0.5) * 0.2, len: len, wid: (14 + R() * 14) * z * g[4], h: h, at: R() * 0.8 }); }
      });
      out.sort(function (a, b) { return b.len - a.len; });
      return out;
    }
    function draw(c, grow, D) { Cl.forEach(function (q) { var u = fxEase(Math.min(1, Math.max(0, (grow - q.at) / 1.2))); if (u > 0) { gwPrism(c, q.bx, q.by, q.an, q.len * u, q.wid, q.h[0], q.h[1], q.h[2], 0, D ? 0.6 : 0.5); } }); }
    return function (t, dt) {
      var c = s.ctx, D = FX_INK.dark, d = s.c.width / Math.max(1, s.w), k2 = s.w + 'x' + s.h + ':' + D + ':' + d, g = Math.min(2.1, t);
      if (k2 !== key) { key = k2; Cl = layout(); off = null; }
      if (g < 2.1) { draw(c, g, D); }
      else {
        if (!off) { off = document.createElement('canvas'); off.width = Math.max(1, Math.round(s.w * d)); off.height = Math.max(1, Math.round(s.h * d)); var o = off.getContext('2d'); o.scale(d, d); draw(o, 3, D); }
        c.drawImage(off, 0, 0, s.w, s.h);
      }
      /* light running up one crystal, then a flash at its tip */
      if (!run || t - run.t0 > 1.6) { run = { t0: t, q: Cl[Math.floor(Math.random() * Cl.length)] }; }
      var q = run.q, u = (t - run.t0) / 1.1, rgb = gwRgb(q.h[0], q.h[1], 74);
      c.globalCompositeOperation = D ? 'lighter' : 'source-over';
      if (u < 1 && g >= 2.1) { var x = q.bx + Math.cos(q.an) * q.len * u, y = q.by + Math.sin(q.an) * q.len * u; fxGlow(c, D ? rgb : '255,255,255', x, y, q.wid * 1.1, D ? 0.55 : 0.75); }
      if (u > 0.95 && u < 1.45 && g >= 2.1) { var f = Math.sin((u - 0.95) / 0.5 * Math.PI); fxStar4(c, q.bx + Math.cos(q.an) * q.len, q.by + Math.sin(q.an) * q.len, 16 * f, f, D ? '#FFFFFF' : gwHsl(q.h[0], q.h[1], 50)); }
      /* sparkles drifting up out of the clusters */
      Mo.forEach(function (m) {
        m.u += dt * m.sp; if (m.u > 1) { m.u -= 1; m.dx = fxR(-1, 1); }
        var base = m.c === 0 ? [s.w * 0.08, s.h] : m.c === 1 ? [s.w * 0.92, s.h] : [s.w * 0.9, s.h * 0.08], x = base[0] + m.dx * 70 + Math.sin(t + m.ph) * 8, y = m.c === 2 ? base[1] + m.u * 160 : base[1] - m.u * 240, a = Math.sin(m.u * Math.PI) * (0.5 + 0.5 * Math.sin(t * 3 + m.ph));
        if (D) { fxGlow(c, '233,213,255', x, y, 3, a * 0.8); } else { fxStar4(c, x, y, 3.2, a * 0.7, '#8B5CF6'); }
      });
      c.globalCompositeOperation = 'source-over';
    };
  };
  /* Sea of clouds (Mythic): the page floats high above a sea of clouds at sunrise. The cloud tops roll slowly by in layers,
     the sun climbs out of them and colors them gold and pink, rays reach up past the page, and now and then birds glide across */
  FX_PAPER.cloudsea = function (s) {
    var L = [], Bd = [], nextB = 4, i;
    for (i = 0; i < 4; i++) { L.push({ y: 0.64 + i * 0.085, sp: 5 + i * 6, gap: 70 + i * 26, sd: 50 + i * 13 }); }
    function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
    return function (t, dt) {
      var c = s.ctx, D = FX_INK.dark, cyc = ((t + 20) % 160) / 160, up = Math.sin(cyc * Math.PI), sx = s.w * (0.25 + 0.5 * cyc), hz = s.h * 0.66, sy = hz + 40 - up * s.h * 0.34, k;
      var g = c.createLinearGradient(0, 0, 0, s.h);
      if (D) { g.addColorStop(0, 'rgba(30,27,75,0)'); g.addColorStop(0.45, 'rgba(76,29,149,.1)'); g.addColorStop(0.66, 'rgba(244,114,182,.12)'); g.addColorStop(1, 'rgba(251,146,60,.06)'); }
      else { g.addColorStop(0, 'rgba(186,230,253,.18)'); g.addColorStop(0.45, 'rgba(254,215,170,.16)'); g.addColorStop(0.66, 'rgba(253,164,175,.2)'); g.addColorStop(1, 'rgba(254,215,170,.1)'); }
      c.fillStyle = g; c.fillRect(0, 0, s.w, s.h);
      /* the sun and its rays */
      c.globalCompositeOperation = D ? 'lighter' : 'source-over';
      for (k = 0; k < 9; k++) { fxBeam(c, sx, sy, -Math.PI / 2 + (k - 4) * 0.2 + Math.sin(t * 0.13 + k) * 0.03, s.h * 0.9, 0.035, D ? 'rgba(253,186,116,' + (0.07 * up).toFixed(3) + ')' : 'rgba(251,146,60,' + (0.06 * up).toFixed(3) + ')'); }
      fxGlow(c, '253,186,116', sx, sy, 190, (D ? 0.35 : 0.4) * (0.4 + 0.6 * up)); fxGlow(c, '254,215,170', sx, sy, 70, (D ? 0.6 : 0.65) * (0.4 + 0.6 * up)); fxGlow(c, '255,247,237', sx, sy, 30, 0.8 * (0.4 + 0.6 * up));
      c.globalCompositeOperation = 'source-over';
      /* birds, now and then */
      if (t > nextB && !Bd.length) { var by = s.h * fxR(0.15, 0.4), dir = Math.random() < 0.5 ? 1 : -1; for (k = 0; k < 5; k++) { Bd.push({ x: dir > 0 ? -40 - k * 22 : s.w + 40 + k * 22, y: by + Math.abs(k - 2) * 10 + fxR(-3, 3), d: dir, ph: fxR(0, 6) }); } nextB = t + fxR(18, 30); }
      c.strokeStyle = D ? 'rgba(226,232,240,.45)' : 'rgba(51,65,85,.4)'; c.lineWidth = 1.4; c.lineCap = 'round';
      for (k = Bd.length - 1; k >= 0; k--) { var b = Bd[k]; b.x += b.d * 34 * dt; if (b.x < -80 || b.x > s.w + 80) { if ((b.d > 0 && b.x > s.w + 80) || (b.d < 0 && b.x < -80)) { Bd.splice(k, 1); continue; } } var fl = Math.sin(t * 6 + b.ph) * 4; c.beginPath(); c.moveTo(b.x - 8, b.y - fl); c.quadraticCurveTo(b.x - 3, b.y - 3, b.x, b.y); c.quadraticCurveTo(b.x + 3, b.y - 3, b.x + 8, b.y - fl); c.stroke(); }
      /* the layers of cloud, far to near */
      L.forEach(function (l, n) {
        var y = l.y * s.h, off = (t * l.sp) % l.gap, base = Math.floor(t * l.sp / l.gap), cnt = Math.ceil(s.w / l.gap) + 3, j, cg = c.createLinearGradient(0, y - l.gap * 0.7, 0, y + l.gap * 0.6), lit = 0.5 + 0.5 * up;
        if (D) { cg.addColorStop(0, 'rgba(253,186,116,' + ((0.13 + 0.04 * n) * lit).toFixed(3) + ')'); cg.addColorStop(0.45, 'rgba(167,139,250,' + (0.1 + 0.03 * n).toFixed(3) + ')'); cg.addColorStop(1, 'rgba(49,46,129,' + (0.16 + 0.05 * n).toFixed(3) + ')'); }
        else { cg.addColorStop(0, 'rgba(253,186,116,' + ((0.15 + 0.05 * n) * lit).toFixed(3) + ')'); cg.addColorStop(0.45, 'rgba(244,182,200,' + (0.14 + 0.04 * n).toFixed(3) + ')'); cg.addColorStop(1, 'rgba(196,181,253,' + (0.15 + 0.05 * n).toFixed(3) + ')'); }
        c.fillStyle = cg; c.beginPath();
        for (j = 0; j < cnt; j++) { var idx = base + j, x = j * l.gap - off - l.gap + hash(idx + n * 97) * l.gap * 0.3, r = l.gap * (0.34 + 0.3 * hash(idx * 3 + n)) * (1 + 0.04 * Math.sin(t * 0.6 + idx)), cy = y - r * 0.25 + hash(idx * 7 + n) * 10, r2 = r * (0.45 + 0.2 * hash(idx * 11 + n)); c.moveTo(x + r, cy); c.ellipse(x, cy, r, r * 0.72, 0, 0, FX_TAU); c.moveTo(x + r * 0.55 + r2, cy - r * 0.42); c.ellipse(x + r * 0.55, cy - r * 0.42, r2, r2 * 0.8, 0, 0, FX_TAU); }
        c.rect(-10, y, s.w + 20, s.h - y + 10); c.fill();
      });
    };
  };

  /* ---------- living themes: a dark page with a scene behind it ---------- */
  /* Black opal (Epic): a dark stone full of fire. Patches of color flash and fade as the light moves over it, and they shift
     when you scroll, the way an opal changes when you tilt it */
  FX_LIVING['prize-opal'] = function (s) {
    var C = [], W0 = 0, H0 = 0, HUE = [150, 168, 186, 200, 214, 262, 292, 330, 12, 42], GL = HUE.map(function (h) { return gwRgb(h, 88, 60); }), R = gwRng(17);
    function build() {
      C = []; W0 = s.w; H0 = s.h; var z = 38, dx = z * 1.5, dy = z * Math.sqrt(3), i, j;
      for (i = 0; i * dx < s.w + z * 2; i++) { for (j = 0; j * dy < s.h + z * 2; j++) { var cx = i * dx, cy = j * dy + (i % 2 ? dy / 2 : 0), P = []; for (var k = 0; k < 6; k++) { var a = k / 6 * FX_TAU + (R() - 0.5) * 0.3, jit = 0.98 + R() * 0.22; P.push([cx + Math.cos(a) * z * jit, cy + Math.sin(a) * z * jit]); } var hi = Math.floor(R() * HUE.length); C.push({ P: P, x: cx, y: cy, z: z, h: HUE[hi], g: GL[hi], a: R() * FX_TAU, ph: R() * 6, sh: 0.6 + R() * 0.5 }); } }
    }
    return function (t) {
      if (s.w !== W0 || s.h !== H0) { build(); }
      var c = s.ctx, sy = 0; try { sy = window.scrollY || 0; } catch (e) { sy = 0; }
      var la = t * 0.22 + sy * 0.004;
      c.globalCompositeOperation = 'lighter';
      fxGlow(c, '165,243,252', s.w * (0.3 + 0.2 * Math.sin(t * 0.07)), s.h * 0.3, s.w * 0.7, 0.06); fxGlow(c, '244,114,182', s.w * (0.7 - 0.2 * Math.sin(t * 0.05)), s.h * 0.75, s.w * 0.6, 0.05);
      C.forEach(function (q) {
        var f = Math.cos(la * q.sh + q.a), I = f > 0.55 ? Math.pow((f - 0.55) / 0.45, 2) * (0.6 + 0.4 * Math.sin(t * 0.9 + q.ph)) : 0;
        if (I < 0.03) { return; }
        fxGlow(c, q.g, q.x, q.y, q.z * 1.9, 0.22 * I); c.fillStyle = gwHsl((q.h + 18 * Math.sin(la + q.ph)) % 360, 88, 58, 0.16 * I); gwPoly(c, q.P); c.fill();
      });
      c.globalCompositeOperation = 'source-over';
    };
  };
  FX_LIVE_THEMES['prize-opal'] = 1;
  /* Thunderhead (Legendary): storm clouds roll along the top of the page, lightning flickers inside them and now and then
     strikes down the edge of the page, and soft rain falls */
  FX_LIVING['prize-thunderhead'] = function (s) {
    var Dr = [], ev = null, next = 2, i;
    for (i = 0; i < 90; i++) { Dr.push({ x: Math.random(), y: Math.random(), v: fxR(0.5, 0.8), l: fxR(8, 16) }); }
    function bank(c, t, y, hgt, sp, seed, gap) { var off = (t * sp) % gap, base = Math.floor(t * sp / gap), j, P = []; c.beginPath(); for (j = 0; j < Math.ceil(s.w / gap) + 3; j++) { var idx = base + j, r = gap * (0.35 + 0.55 * fxRnd(idx * 7 + seed)), x = j * gap - off - gap + fxRnd(idx + seed) * gap * 0.7, cy = y + (fxRnd(idx * 3 + seed) - 0.3) * hgt * 0.5; c.moveTo(x + r, cy); c.arc(x, cy, r, 0, FX_TAU); P.push([x, cy, r]); } c.rect(-10, -10, s.w + 20, y + 10); return P; }
    return function (t, dt) {
      var c = s.ctx, top = Math.min(250, s.h * 0.26), fl = 0, k;
      if (!ev && t > next) { var ty = Math.random(), side = Math.random() < 0.5 ? fxR(0.03, 0.14) : fxR(0.86, 0.97); ev = { t0: t, bolt: ty < 0.55, x: (ty < 0.55 ? side : fxR(0.1, 0.9)) * s.w }; if (ev.bolt) { ev.P = fxJag(ev.x, top * 0.85, ev.x + fxR(-40, 40), s.h * fxR(0.55, 0.9), 0.4, 6); var b = ev.P[20]; ev.B = fxJag(b[0], b[1], b[0] + fxR(-60, 60), b[1] + fxR(40, 120), 0.5, 4); } }
      if (ev) { var e = t - ev.t0; fl = [1, 0.15, 0.85, 0.05, 0.6, 0.25, 0][Math.min(6, Math.floor(e / 0.07))]; if (e > 0.5) { ev = null; next = t + fxR(2.5, 6.5); } }
      /* rain */
      c.strokeStyle = 'rgba(148,163,184,.16)'; c.lineWidth = 1; c.beginPath();
      Dr.forEach(function (d) { d.y += dt * d.v; if (d.y > 1.05) { d.y -= 1.1; d.x = Math.random(); } var x = d.x * s.w - d.y * 40, y = top * 0.6 + d.y * (s.h - top * 0.6); c.moveTo(x, y); c.lineTo(x - 3, y + d.l); }); c.stroke();
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '99,102,241', s.w * 0.5, top * 0.7, s.w * 0.8, 0.08); if (fl > 0) { fxGlow(c, '165,180,252', s.w / 2, s.h / 2, s.w, 0.05 * fl); }
      c.globalCompositeOperation = 'source-over';
      /* the cloud ceiling: three rows of bulging cloud, lit from inside when the lightning flickers */
      c.fillStyle = '#131827'; bank(c, t, top * 0.42, top * 0.4, 4, 9, 86); c.fill();
      c.fillStyle = '#1A2133'; bank(c, t, top * 0.66, top * 0.45, 7, 3, 70); c.fill();
      c.fillStyle = 'rgba(34,42,62,.92)'; var FR = bank(c, t, top * 0.86, top * 0.3, 11, 17, 52); c.fill();
      c.lineWidth = 1.4; c.strokeStyle = 'rgba(165,180,252,' + (0.1 + 0.45 * fl).toFixed(3) + ')'; c.beginPath(); FR.forEach(function (p) { c.moveTo(p[0] + Math.cos(0.5) * p[2], p[1] + Math.sin(0.5) * p[2]); c.arc(p[0], p[1], p[2], 0.5, Math.PI - 0.5); }); c.stroke();
      if (fl > 0) {
        c.save(); bank(c, t, top * 0.86, top * 0.3, 11, 17, 52); c.clip(); c.globalCompositeOperation = 'lighter'; fxGlow(c, '165,180,252', ev.x, top * 0.55, Math.min(380, s.w * 0.85), 0.55 * fl); fxGlow(c, '224,231,255', ev.x, top * 0.65, 150, 0.32 * fl); c.restore();
        c.globalCompositeOperation = 'lighter'; if (ev.bolt) { fxBolt(c, ev.P, fl * 0.9, '165,180,252'); fxBolt(c, ev.B, fl * 0.6, '165,180,252'); }
      }
      c.globalCompositeOperation = 'source-over';
    };
  };
  FX_LIVE_THEMES['prize-thunderhead'] = 1;
  /* Crystal cavern (Mythic): the page is a cave lined with giant crystals that glow from within. Shafts of light fall from an
     opening above, water drips from the crystal tips and rings as it lands, and every so often a chime runs through the cave
     and every crystal lights up as it passes */
  FX_LIVING['prize-cavern'] = function (s) {
    var Cr = [], key = '', off = null, Dp = [], Rp = [], Mo = [], i;
    var HU = [[268, 70, 58], [190, 80, 52], [300, 62, 62], [174, 64, 44], [248, 72, 66]];
    for (i = 0; i < 30; i++) { Mo.push({ x: Math.random(), y: Math.random(), sp: fxR(0.006, 0.016), ph: fxR(0, 6) }); }
    function layout() {
      var R = gwRng(23), z = Math.max(0.85, Math.min(1.4, Math.min(s.w, s.h) / 480)), out = [], j;
      for (j = 0; j < 12; j++) { var side = j % 2 ? 1 : -1, y = (0.12 + (j >> 1) / 6 * 0.86 + R() * 0.05) * s.h, len = (50 + R() * 90) * z; out.push({ bx: side < 0 ? -6 : s.w + 6, by: y, an: side < 0 ? -0.25 - R() * 0.65 : Math.PI + 0.25 + R() * 0.65, len: len, wid: (14 + R() * 16) * z, h: HU[j % HU.length] }); }
      for (j = 0; j < 7; j++) { var x = (0.06 + j / 6 * 0.88 + (R() - 0.5) * 0.06) * s.w; out.push({ bx: x, by: -6, an: Math.PI / 2 + (R() - 0.5) * 0.5, len: (36 + R() * 60) * z, wid: (12 + R() * 12) * z, h: HU[(j + 2) % HU.length], top: 1 }); }
      for (j = 0; j < 8; j++) { var x2 = (0.04 + j / 7 * 0.92 + (R() - 0.5) * 0.05) * s.w; out.push({ bx: x2, by: s.h + 6, an: -Math.PI / 2 + (R() - 0.5) * 0.6, len: (30 + R() * 70) * z, wid: (14 + R() * 14) * z, h: HU[(j + 1) % HU.length] }); }
      out.forEach(function (q) { q.tx = q.bx + Math.cos(q.an) * q.len; q.ty = q.by + Math.sin(q.an) * q.len; q.mx = (q.bx + q.tx) / 2; q.my = (q.by + q.ty) / 2; q.rgb = gwRgb(q.h[0], q.h[1], 66); });
      return out;
    }
    return function (t, dt) {
      var c = s.ctx, d = s.c.width / Math.max(1, s.w), k2 = s.w + 'x' + s.h + ':' + d, cyc = t % 11, wave = cyc < 2.4 ? cyc / 2.4 : -1, k;
      if (k2 !== key) { key = k2; Cr = layout(); off = document.createElement('canvas'); off.width = Math.max(1, Math.round(s.w * d)); off.height = Math.max(1, Math.round(s.h * d)); var o = off.getContext('2d'); o.scale(d, d); Cr.forEach(function (q) { gwPrism(o, q.bx, q.by, q.an, q.len, q.wid, q.h[0], q.h[1], q.h[2] - 8, 0, 0.85); }); }
      c.globalCompositeOperation = 'lighter';
      /* light falling from an opening above */
      for (k = 0; k < 4; k++) { fxBeam(c, s.w * (0.42 + k * 0.05), -40, Math.PI / 2 + (k - 1.5) * 0.09 + Math.sin(t * 0.2 + k) * 0.02, s.h * 0.95, 0.05, 'rgba(196,181,253,' + (0.05 + 0.02 * Math.sin(t * 0.5 + k)).toFixed(3) + ')'); }
      Mo.forEach(function (m) { m.y -= dt * m.sp; if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); } fxGlow(c, '233,213,255', (m.x + Math.sin(t * 0.3 + m.ph) * 0.02) * s.w, m.y * s.h, 2, 0.3 + 0.25 * Math.sin(t * 2 + m.ph)); });
      /* the crystals, each glowing from within; the chime lights them as it passes */
      Cr.forEach(function (q, n) { var g = 0.16 + 0.06 * Math.sin(t * 0.8 + n); if (wave >= 0) { var dd = Math.hypot(q.mx - s.w / 2, q.my - s.h / 2) / Math.hypot(s.w / 2, s.h / 2), hit = Math.max(0, 1 - Math.abs(dd - wave) / 0.12); g += 0.5 * hit; } fxGlow(c, q.rgb, q.mx, q.my, q.len * 0.75, g); });
      c.globalCompositeOperation = 'source-over'; c.drawImage(off, 0, 0, s.w, s.h); c.globalCompositeOperation = 'lighter';
      if (wave >= 0) { var wr = wave * Math.hypot(s.w / 2, s.h / 2); fxRing(c, s.w / 2, s.h / 2, wr, wr * 0.85, '233,213,255', (1 - wave) * 0.22, 2); Cr.forEach(function (q) { var dd2 = Math.hypot(q.tx - s.w / 2, q.ty - s.h / 2) / Math.hypot(s.w / 2, s.h / 2), f = Math.max(0, 1 - Math.abs(dd2 - wave) / 0.08); if (f > 0) { fxStar4(c, q.tx, q.ty, 10 * f, f, '#FFFFFF'); } }); }
      /* drips from the crystals overhead, and rings where they land */
      if (Math.random() < dt * 0.9) { var src = Cr.filter(function (q) { return q.top; }); if (src.length) { var q0 = src[Math.floor(Math.random() * src.length)]; Dp.push({ x: q0.tx, y: q0.ty, v: 0, rgb: q0.rgb }); } }
      for (k = Dp.length - 1; k >= 0; k--) { var p = Dp[k]; p.v += 900 * dt; p.y += p.v * dt; if (p.y > s.h - 14) { Rp.push({ x: p.x, l: 0, rgb: p.rgb }); Dp.splice(k, 1); continue; } fxGlow(c, p.rgb, p.x, p.y, 3.5, 0.8); }
      for (k = Rp.length - 1; k >= 0; k--) { var r = Rp[k]; r.l += dt; if (r.l > 1.1) { Rp.splice(k, 1); continue; } var u = r.l / 1.1; fxRing(c, r.x, s.h - 14, 4 + u * 40, 1.5 + u * 8, r.rgb, (1 - u) * 0.5, 1.2); }
      c.globalCompositeOperation = 'source-over';
    };
  };
  FX_LIVE_THEMES['prize-cavern'] = 1;

  /* ---------- streak styles: small drawings beside the streak number on Home that change as the streak grows (styled in prizes.css) ---------- */
  function gwSvg(cls, vb, body) { return '<svg class="pz-si ' + cls + '" viewBox="' + vb + '" aria-hidden="true">' + body + '</svg>'; }
  function gwDiamond(x, y, r, cls) { return '<path class="' + cls + '" d="M' + (x - r) + ' ' + y + 'l' + r * 0.5 + ' ' + (-r * 0.6) + 'h' + r + 'l' + r * 0.5 + ' ' + r * 0.6 + 'l' + (-r) + ' ' + r * 1.1 + 'z"/><path class="gw-facet" d="M' + (x - r * 0.5) + ' ' + (y - r * 0.6) + 'l' + r * 0.5 + ' ' + r * 0.6 + 'l' + r * 0.5 + ' ' + (-r * 0.6) + 'M' + (x - r) + ' ' + y + 'h' + 2 * r + '"/>'; }
  /* Cairn (Common): balanced stones, one more each week up to six; at 100 days a gem sits on top */
  FX_STREAK.cairn = function (n) {
    var k = Math.min(6, 2 + Math.floor(n / 7)), S = [[24, 50, 16, 5.5], [23, 40.5, 13, 4.8], [25, 32, 10.5, 4.2], [23.5, 24.5, 8.5, 3.6], [24.5, 18, 6.5, 3], [24, 12.6, 4.8, 2.4]], out = '<path class="gw-ground" d="M3 55.5h42"/>', i;
    for (i = 0; i < k; i++) { var q = S[i]; out += '<ellipse class="gw-st' + (i % 3) + '" cx="' + q[0] + '" cy="' + q[1] + '" rx="' + q[2] + '" ry="' + q[3] + '"/><path class="gw-sthi" d="M' + (q[0] - q[2] * 0.55) + ' ' + (q[1] - q[3] * 0.35) + 'q' + q[2] * 0.4 + ' ' + (-q[3] * 0.55) + ' ' + q[2] * 0.8 + ' ' + (-q[3] * 0.5) + '"/>'; }
    if (n >= 100) { out += '<g class="gw-cgem">' + gwDiamond(24, 5.4, 4.6, 'gw-gem') + '</g>'; }
    var top = n >= 100 ? 0 : Math.min(24, S[k - 1][1] - S[k - 1][3] - 3);
    return gwSvg('gw-cairn' + (n >= 100 ? ' gw-top' : ''), '0 ' + top.toFixed(1) + ' 48 ' + (58 - top).toFixed(1), out);
  };
  /* Thermometer (Common): the red line climbs with the streak and reaches the top at 30 days; at 100 days the heat shimmers off it */
  FX_STREAK.thermo = function (n) {
    var f = Math.min(1, n / 30), top = 33 - f * 25;
    return gwSvg('gw-thermo' + (n >= 30 ? ' gw-full' : '') + (n >= 100 ? ' gw-hot' : ''), '0 0 34 52',
      (n >= 100 ? '<path class="gw-heat" d="M6 20c-2-2.5 2-4 0-6.5s2-4 0-6.5M28 20c-2-2.5 2-4 0-6.5s2-4 0-6.5"/>' : '') +
      '<path class="gw-tglass" d="M12.5 8a4.5 4.5 0 0 1 9 0v26a8.5 8.5 0 1 1-9 0z"/><rect class="gw-tmerc" x="15" y="' + top.toFixed(1) + '" width="4" height="' + (40 - top).toFixed(1) + '" rx="2"/><circle class="gw-tbulb" cx="17" cy="41" r="5.6"/><path class="gw-ttick" d="M24 10h3M24 16h2M24 22h3M24 28h2"/>');
  };
  /* Treasure chest (Rare): shut at first; at 7 days the lid lifts and light spills out; at 30 days it opens on gold and gems,
     and at 100 days it overflows */
  FX_STREAK.chest = function (n) {
    var body = '<rect class="gw-wood" x="6" y="26" width="40" height="18" rx="2"/><path class="gw-band" d="M13 26v18M39 26v18"/><rect class="gw-lock" x="22.5" y="27" width="7" height="8" rx="1.5"/>', out;
    if (n < 7) { out = body + '<path class="gw-wood" d="M6 26v-5a9 8 0 0 1 9-8h22a9 8 0 0 1 9 8v5z"/><path class="gw-band" d="M13 14v12M39 14v12"/>'; }
    else if (n < 30) { out = '<path class="gw-glowline" d="M8 25.5h36"/>' + body + '<g transform="rotate(-14 6 26)"><path class="gw-wood" d="M6 25v-5a9 8 0 0 1 9-8h22a9 8 0 0 1 9 8v5z"/><path class="gw-band" d="M13 13v12M39 13v12"/></g>'; }
    else {
      var heap = '<path class="gw-gold" d="M8 27c3-6 8-8 18-8s15 2 18 8z"/><circle class="gw-coin" cx="15" cy="23" r="3"/><circle class="gw-coin" cx="35" cy="22.5" r="3"/><circle class="gw-coin" cx="25" cy="20" r="3"/>' + gwDiamond(20, 21, 3.2, 'gw-gem gw-g1') + gwDiamond(30, 19.5, 3, 'gw-gem gw-g2');
      if (n >= 100) { heap += '<circle class="gw-coin" cx="9" cy="42" r="2.6"/><circle class="gw-coin" cx="44.5" cy="43" r="2.4"/>' + gwDiamond(25, 13.5, 3.6, 'gw-gem gw-g3') + '<path class="gw-spark" d="M10 13l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM42 9l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>'; }
      out = '<path class="gw-lidin" d="M7 26l3-15h32l3 15z"/>' + heap + body;
    }
    return gwSvg('gw-chest' + (n >= 7 && n < 30 ? ' gw-ajar' : '') + (n >= 100 ? ' gw-over' : ''), '0 0 52 48', out);
  };
  /* Skies (Rare): the weather clears as the streak grows: rain, then cloud, then the sun breaking through, then a clear sky,
     and at 100 days a rainbow */
  FX_STREAK.skies = function (n) {
    var st = n < 3 ? 0 : n < 7 ? 1 : n < 14 ? 2 : n < 30 ? 3 : n < 100 ? 4 : 5, out = '', i, rays = '';
    for (i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2; rays += 'M' + (30 + Math.cos(a) * 11).toFixed(1) + ' ' + (18 + Math.sin(a) * 11).toFixed(1) + 'L' + (30 + Math.cos(a) * 14.5).toFixed(1) + ' ' + (18 + Math.sin(a) * 14.5).toFixed(1); }
    if (st === 5) { ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6'].forEach(function (col, j) { out += '<path class="gw-rb" stroke="' + col + '" d="M' + (4 + j * 2.6) + ' 44a' + (22 - j * 2.6) + ' ' + (22 - j * 2.6) + ' 0 0 1 ' + (44 - j * 5.2) + ' 0"/>'; }); }
    if (st >= 2) { out += '<g class="gw-sun' + (st >= 4 ? ' gw-clear' : '') + '"><path class="gw-ray" d="' + rays + '"/><circle class="gw-sunc" cx="30" cy="18" r="8"/></g>'; }
    if (st <= 3) { var big = st <= 1, cx = big ? 0 : st === 2 ? 0 : 8; out += '<path class="gw-cloud' + (st === 0 ? ' gw-rainc' : '') + '" transform="translate(' + cx + ' 0)' + (st === 3 ? ' scale(.8) translate(-2 10)' : '') + '" d="M10 36h26a7 7 0 0 0 0-14 9.5 9.5 0 0 0-18-2.5A7.5 7.5 0 0 0 10 36z"/>'; }
    if (st === 0) { out += '<path class="gw-drop gw-d1" d="M15 40l-2 5"/><path class="gw-drop gw-d2" d="M23 40l-2 5"/><path class="gw-drop gw-d3" d="M31 40l-2 5"/>'; }
    return gwSvg('gw-skies', '0 0 52 48', out);
  };
  /* Rainbow (Epic): one band for every week, red first, until all seven shine at 49 days; at 100 days it shimmers */
  FX_STREAK.rainbow = function (n) {
    var k = Math.min(7, Math.floor(n / 7)), C = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#6366F1', '#A855F7'], out = '', i;
    out += '<path class="gw-rbghost" d="M5 36a23 23 0 0 1 46 0"/>';
    for (i = 0; i < k; i++) { var r = 23 - i * 2.7; out += '<path class="gw-rb" stroke="' + C[i] + '" d="M' + (28 - r).toFixed(1) + ' 36a' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 0 1 ' + (2 * r).toFixed(1) + ' 0"/>'; }
    out += '<path class="gw-cloud gw-rbcl" d="M0 38h11a4 4 0 0 0 0-8 5 5 0 0 0-9-1 4 4 0 0 0-2 9z"/><path class="gw-cloud gw-rbcl" d="M44 38h11a4 4 0 0 0 0-8 5 5 0 0 0-9-1 4 4 0 0 0-2 9z"/>';
    if (n >= 100) { out += '<path class="gw-spark" d="M28 3l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1zM9 12l.8 1.6 1.6.8-1.6.8-.8 1.6-.8-1.6-1.6-.8 1.6-.8zM47 12l.8 1.6 1.6.8-1.6.8-.8 1.6-.8-1.6-1.6-.8 1.6-.8z"/>'; }
    return gwSvg('gw-rainbow' + (k >= 7 ? ' gw-full' : '') + (n >= 100 ? ' gw-shine' : ''), '-3 0 64 42', out);
  };
  /* Hidden gem (Legendary): a plain rock that cracks at 7 days and glows through its cracks at 14; at 30 days it splits open
     on a geode of crystals, and at 100 days a cut gem rises out of it and shines */
  FX_STREAK.hiddengem = function (n) {
    var out = '';
    if (n < 30) {
      out = '<path class="gw-rock" d="M8 40l2.5-13 8.5-9 12 .5 9 8.5 2.5 12-5.5 6H13z"/><path class="gw-rockhi" d="M12 27l7-7"/>';
      if (n >= 7) { out += '<path class="gw-crack' + (n >= 14 ? ' gw-lit' : '') + '" d="M25 18.5l-2 7 3 5-2 6 1 7"/>'; }
      if (n >= 14) { out += '<path class="gw-crack gw-lit" d="M26 30.5l6 3 2 5"/>'; }
      return gwSvg('gw-hgem' + (n >= 14 ? ' gw-warm' : ''), '2 13 46 37', out);
    }
    var rock = '', teeth = '', i, W = [0.06, -0.04, 0.08, 0, -0.06, 0.05, -0.02, 0.07, -0.05, 0.03, -0.07, 0.04, 0.02, -0.03];
    for (i = 0; i < 14; i++) { var ra = i / 14 * Math.PI * 2; rock += (i ? 'L' : 'M') + (25 + Math.cos(ra) * 20 * (1 + W[i])).toFixed(1) + ' ' + (33 + Math.sin(ra) * 15.5 * (1 + W[i])).toFixed(1); }
    for (i = 0; i < 12; i++) {
      var a = i / 12 * Math.PI * 2 + 0.2, b = 0.24, L = i % 2 ? 0.42 : 0.3;
      teeth += 'M' + (25 + Math.cos(a - b) * 11).toFixed(1) + ' ' + (33 + Math.sin(a - b) * 8.4).toFixed(1) + 'L' + (25 + Math.cos(a) * 11 * L).toFixed(1) + ' ' + (33 + Math.sin(a) * 8.4 * L).toFixed(1) + 'L' + (25 + Math.cos(a + b) * 11).toFixed(1) + ' ' + (33 + Math.sin(a + b) * 8.4).toFixed(1) + 'z';
    }
    out = '<ellipse class="gw-geoglow" cx="25" cy="33" rx="20" ry="15"/><path class="gw-rock" d="' + rock + 'z"/><ellipse class="gw-band2" cx="25" cy="33" rx="15.5" ry="12"/><ellipse class="gw-band3" cx="25" cy="33" rx="13.2" ry="10.2"/><ellipse class="gw-geo" cx="25" cy="33" rx="11" ry="8.4"/><path class="gw-xtal" d="' + teeth + '"/><ellipse class="gw-heart" cx="25" cy="33" rx="3" ry="2.2"/><path class="gw-rockhi" d="M9 27l4-6"/>';
    if (n >= 100) { out += '<g class="gw-float">' + gwDiamond(25, 8.5, 6.5, 'gw-gem gw-g3') + '</g><path class="gw-spark" d="M10 7l.8 1.6 1.6.8-1.6.8-.8 1.6-.8-1.6-1.6-.8 1.6-.8zM40 5l.8 1.6 1.6.8-1.6.8-.8 1.6-.8-1.6-1.6-.8 1.6-.8z"/>'; }
    return gwSvg('gw-hgem gw-open' + (n >= 100 ? ' gw-risen' : ''), n >= 100 ? '0 0 50 52' : '0 15 50 37', out);
  };
  /* Lightning in a bottle (Mythic): a corked bottle with a storm inside. It starts as a spark; at 7 days a cloud forms and
     a bolt flickers; at 30 days the storm fills it; at 100 days the glass glows and bolts leap to the cork */
  FX_STREAK.bottle = function (n) {
    var out = '<path class="gw-glass" d="M15 6h10v6c0 2 2 3 4 5 3 3 5 6 5 11v17c0 4-3 6-6 6H12c-3 0-6-2-6-6V28c0-5 2-8 5-11 2-2 4-3 4-5z"/><rect class="gw-cork" x="14" y="1.5" width="12" height="6" rx="1.6"/>';
    if (n < 7) { out += '<path class="gw-zap gw-z1" d="M20 33l1.2 2.6 2.6 1.2-2.6 1.2L20 40.6l-1.2-2.6-2.6-1.2 2.6-1.2z"/>'; }
    else {
      var big = n >= 30;
      out += '<path class="gw-scloud" d="M' + (big ? '9 30h22a5 5 0 0 0 0-10 7 7 0 0 0-12.5-2A5.5 5.5 0 0 0 9 30z' : '12 30h16a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10-1.5A4.5 4.5 0 0 0 12 30z') + '"/>';
      out += '<path class="gw-zap gw-z1" d="M20 30l-3 6h3.5l-2.5 7 6-8.5h-3.5l2-4.5z"/>';
      if (big) { out += '<path class="gw-zap gw-z2" d="M27 30l-2 4h2.5l-2 5 4.5-6h-2.5l1.5-3z"/><path class="gw-zap gw-z3" d="M13 30l-1.5 3.5h2l-1.5 4 3.5-5h-2l1-2.5z"/>'; }
      if (n >= 100) { out += '<path class="gw-arc" d="M18.5 17l-1.5-3 2-2.5-1.5-3.5M22 17l1.5-3-2-2.5 1.5-3.5"/>'; }
    }
    return gwSvg('gw-bottle' + (n >= 30 ? ' gw-storm' : '') + (n >= 100 ? ' gw-charged' : ''), '0 0 40 54', out);
  };
