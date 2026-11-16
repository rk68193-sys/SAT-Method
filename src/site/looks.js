  /* =================== More looks drawn in code: the Wildlands and Curiosities series (prizes.js) =================== */
  /* Every look here is a whole scene with its own sequence, built to the same standard as the Radiant looks: layered light,
     depth, many moving parts and a moment it builds to. They join the registries in fx.js (FX_STG for stage auras, FX_DRAW and
     FX_DUR for right-answer effects, FX_PAPER, FX_LIVING and FX_LIVE_THEMES for what is behind the page, FX_SICON for streak
     styles) and draw with its helpers. An effect never draws over the answer: lkOut clips the answer's box out of what it draws. */

  /* ---------- helpers ---------- */
  /* everything drawn until lkIn is outside the answer's box (and a margin around it) */
  function lkOut(c, s, k, m) { c.save(); c.beginPath(); c.rect(-10, -10, s.w + 20, s.h + 20); fxRR(c, k.x - m, k.y - m, k.w + m * 2, k.h + m * 2, 12 + m); c.clip('evenodd'); }
  function lkIn(c) { c.restore(); }
  /* a spawner that fires `rate` times a second, however the frames fall */
  function lkEvery(o, rate, dt, fn) { o.acc = (o.acc || 0) + rate * dt; while (o.acc >= 1) { o.acc -= 1; fn(); } }
  /* smooth noise between -1 and 1, for flicker and wind */
  function lkNoise(x) { var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return (fxRnd(i) * (1 - u) + fxRnd(i + 1) * u) * 2 - 1; }
  /* a beam that fades to its own color, so it never greys out on a light page */
  function lkBeam(c, x, y, a, len, wid, rgb, al) { if (!(al > 0)) { return; } var g = c.createLinearGradient(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len); g.addColorStop(0, 'rgba(' + rgb + ',' + al + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.arc(x, y, len, a - wid, a + wid); c.closePath(); c.fill(); }
  /* the answer's finish, as the Radiant effects end: a frame of light in three widths and a sheen that runs across it */
  function lkFinish(c, k, g, u, rgb) {
    if (!(g > 0)) { return; } c.globalCompositeOperation = 'lighter';
    [[9, 0.2], [3.5, 0.55], [1.4, 1]].forEach(function (L) { c.globalAlpha = Math.min(1, g * L[1]); c.lineWidth = L[0]; c.strokeStyle = L[0] < 2 ? 'rgb(255,250,235)' : 'rgb(' + rgb + ')'; c.beginPath(); fxRR(c, k.x - 2, k.y - 2, k.w + 4, k.h + 4, 14); c.stroke(); });
    var sx = k.x - 40 + fxEase(Math.max(0, Math.min(1, u))) * (k.w + 80), sg = c.createLinearGradient(sx - 34, 0, sx + 34, 0); sg.addColorStop(0, 'rgba(' + rgb + ',0)'); sg.addColorStop(0.5, 'rgba(255,250,235,.5)'); sg.addColorStop(1, 'rgba(' + rgb + ',0)');
    c.save(); c.beginPath(); fxRR(c, k.x, k.y, k.w, k.h, 12); c.clip(); c.globalAlpha = g; c.fillStyle = sg; c.fillRect(k.x, k.y, k.w, k.h); c.restore(); c.globalAlpha = 1;
  }
  /* a tongue of flame from (x, y) up to height h, leaning by sw */
  function lkTongue(c, x, y, h, w, sw, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x - w, y); c.bezierCurveTo(x - w * 1.15, y - h * 0.45, x + sw * 0.4 - w * 0.45, y - h * 0.72, x + sw, y - h); c.bezierCurveTo(x + sw * 0.4 + w * 0.45, y - h * 0.72, x + w * 1.15, y - h * 0.45, x + w, y); c.closePath(); c.fill(); }
  /* particles: each { x, y, vx, vy, l, m } moved with gravity g and drag dr, drawn by fn; spent ones are dropped */
  function lkStep(P, dt, g, dr, fn) { for (var i = P.length - 1; i >= 0; i--) { var p = P[i]; p.l += dt; if (p.l > p.m) { P.splice(i, 1); continue; } if (dr) { var f = Math.pow(dr, dt); p.vx *= f; p.vy *= f; } p.vy += g * dt; p.px = p.x; p.py = p.y; p.x += p.vx * dt; p.y += p.vy * dt; fn(p, 1 - p.l / p.m); } }
  /* a pine: three stacked tiers, with snow on the edges, or a rim of firelight on one side, when asked */
  function lkPine(c, x, y, h, col, snow, rim, rimSide) {
    for (var i = 0; i < 3; i++) { var w = h * (0.42 - i * 0.09), b = y - i * h * 0.26, tp = b - h * 0.42; c.fillStyle = col; c.beginPath(); c.moveTo(x - w, b); c.quadraticCurveTo(x - w * 0.4, b - h * 0.08, x, tp); c.quadraticCurveTo(x + w * 0.4, b - h * 0.08, x + w, b); c.quadraticCurveTo(x, b - h * 0.05, x - w, b); c.fill();
      if (snow) { c.fillStyle = snow; c.beginPath(); c.moveTo(x - w * 0.5, tp + (b - tp) * 0.5); c.lineTo(x, tp); c.lineTo(x + w * 0.5, tp + (b - tp) * 0.5); c.quadraticCurveTo(x, tp + (b - tp) * 0.36, x - w * 0.5, tp + (b - tp) * 0.5); c.fill(); }
      if (rim) { c.strokeStyle = rim; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, tp); c.quadraticCurveTo(x + rimSide * w * 0.4, b - h * 0.08, x + rimSide * w, b); c.stroke(); } }
    c.fillStyle = '#2A1C14'; c.fillRect(x - h * 0.04, y - 1, h * 0.08, h * 0.12);
  }

  /* ---------- stage auras: a scene above the streak, in a box 330 wide and 190 tall with the ground at y = 160 ---------- */
  var LK_STG = {
    /* Campfire: a fire in a ring of stones under the Milky Way. Logs glow and pop, throwing up sparks; a marshmallow toasts on a
       stick; a lantern glows inside the tent; an owl blinks in the pines; smoke drifts off lit from below; fireflies wander */
    campfire: function () {
      var St = [], Mw = [], Sp = [], Sm = [], Wi = [], Ff = [], Gr = [], EMB = [], STN = [], o1 = {}, o2 = {}, o3 = {}, i, pop = -9, nextPop = 2.5, sh = null, nextSh = 4, mm = 0;
      for (i = 0; i < 44; i++) { St.push({ x: fxR(-165, 165), y: fxR(4, 100), p: fxR(0, 6), z: fxR(0.5, 1.6), col: i % 7 === 0 ? '191,219,254' : i % 9 === 0 ? '254,215,170' : '255,255,255' }); }
      for (i = 0; i < 150; i++) { var u0 = Math.random(); Mw.push({ x: -170 + u0 * 340, y: 6 + u0 * 50 + (Math.random() + Math.random() + Math.random() - 1.5) * 15, z: fxR(0.3, 1) }); }
      for (i = 0; i < 11; i++) { var a0 = i / 11 * FX_TAU; STN.push([Math.cos(a0) * 28, 156 + Math.sin(a0) * 7, fxR(5, 7.5), a0]); } STN.sort(function (p, q) { return p[1] - q[1]; });
      for (i = 0; i < 30; i++) { var gx = fxR(-136, 136); Gr.push({ x: gx, y: 162 + Math.sqrt(Math.max(0, 1 - gx * gx / 19600)) * 20 * (i % 3 ? 1 : -1), h: fxR(4, 9), ph: fxR(0, 6) }); }
      for (i = 0; i < 14; i++) { EMB.push({ x: fxR(-20, 20), y: fxR(153, 160), p: fxR(0, 6), z: fxR(1.5, 3) }); }
      for (i = 0; i < 6; i++) { Ff.push({ x: i % 2 ? fxR(100, 150) : fxR(-155, -105), y: fxR(96, 150), p: fxR(0, 6), sp: fxR(0.4, 0.9) }); }
      return function (c, t, dt) {
        if (t > nextPop || t < nextPop - 9) { pop = t; nextPop = t + fxR(4.5, 7); for (i = 0; i < 46; i++) { var ba = -Math.PI / 2 + fxR(-0.9, 0.9), bv = fxR(80, 210); Sp.push({ x: fxR(-6, 6), y: 138, vx: Math.cos(ba) * bv, vy: Math.sin(ba) * bv, l: 0, m: fxR(0.7, 1.6), p: fxR(0, 6) }); } }
        var pu = t - pop, flare = pu >= 0 && pu < 2.5 ? Math.exp(-pu * 2.4) : 0, fl = 0.82 + 0.1 * lkNoise(t * 9) + 0.06 * Math.sin(t * 23) + 0.4 * flare, k, q;
        /* the sky: the Milky Way, stars, now and then a falling star, and a crescent moon */
        c.globalCompositeOperation = 'lighter';
        [[-110, 22, 80], [-20, 34, 90], [80, 52, 80]].forEach(function (h) { fxGlow(c, '139,92,246', h[0], h[1], h[2], 0.07); fxGlow(c, '96,165,250', h[0] + 20, h[1] + 6, h[2] * 0.6, 0.05); });
        Mw.forEach(function (m) { fxGlow(c, '221,214,254', m.x, m.y, 1 + m.z, 0.22 * m.z); });
        St.forEach(function (s0) { var tw = 0.5 + 0.5 * Math.sin(t * 1.7 + s0.p); fxGlow(c, s0.col, s0.x, s0.y, 2 * s0.z, 0.22 + 0.45 * tw); if (s0.z > 1.35) { fxStar4(c, s0.x, s0.y, 3.4 * s0.z * tw, 0.6 * tw, '#FFFFFF'); } });
        if (!sh && t > nextSh) { sh = { x: fxR(-150, 30), y: fxR(6, 40), l: 0 }; }
        if (sh) { sh.l += dt; var su = sh.l / 0.75; if (su > 1) { sh = null; nextSh = t + fxR(6, 11); } else { var hx = sh.x + su * 120, hy = sh.y + su * 40, tg = c.createLinearGradient(hx - 70, hy - 23, hx, hy); tg.addColorStop(0, 'rgba(255,255,255,0)'); tg.addColorStop(1, 'rgba(255,255,255,' + Math.sin(su * Math.PI) + ')'); c.strokeStyle = tg; c.lineWidth = 1.4; c.beginPath(); c.moveTo(hx - 70, hy - 23); c.lineTo(hx, hy); c.stroke(); fxGlow(c, '255,255,255', hx, hy, 4, Math.sin(su * Math.PI)); } }
        fxGlow(c, '254,243,199', 124, 28, 50, 0.16); fxGlow(c, '254,243,199', 124, 28, 22, 0.25);
        c.globalCompositeOperation = 'source-over'; c.fillStyle = '#FEF9C3'; c.beginPath(); c.arc(124, 28, 12, 0, FX_TAU); c.fill(); c.fillStyle = 'rgba(202,138,4,.22)'; [[119, 31, 2.4], [116, 24, 1.6], [121, 36, 1.4]].forEach(function (m) { c.beginPath(); c.arc(m[0], m[1], m[2], 0, FX_TAU); c.fill(); });
        c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(130, 23, 11, 0, FX_TAU); c.fill();
        /* far hills in moonlight */
        c.globalCompositeOperation = 'source-over'; c.fillStyle = '#0C0B1C'; c.beginPath(); c.moveTo(-170, 160); for (k = -170; k <= 170; k += 10) { c.lineTo(k, 134 - Math.sin(k * 0.021 + 1) * 8 - Math.sin(k * 0.05) * 4); } c.lineTo(170, 160); c.fill();
        c.strokeStyle = 'rgba(165,180,252,.25)'; c.lineWidth = 1; c.beginPath(); for (k = -170; k <= 170; k += 10) { var hy2 = 134 - Math.sin(k * 0.021 + 1) * 8 - Math.sin(k * 0.05) * 4; if (k === -170) { c.moveTo(k, hy2); } else { c.lineTo(k, hy2); } } c.stroke();
        /* pines at the edge of the light, their near sides lit by the fire */
        var rim = 'rgba(251,146,60,' + (0.3 * fl).toFixed(2) + ')';
        [[-160, 152, 58], [-140, 154, 44], [-122, 158, 36], [128, 156, 46], [146, 152, 62]].forEach(function (p) { lkPine(c, p[0], p[1], p[2], '#0B0E1E', '', rim, p[0] < 0 ? 1 : -1); });
        [[-150, 162, 86], [156, 160, 94]].forEach(function (p) { lkPine(c, p[0], p[1], p[2], '#05060E', '', 'rgba(251,146,60,' + (0.45 * fl).toFixed(2) + ')', p[0] < 0 ? 1 : -1); });
        /* an owl on a branch of the right-hand pine: it turns its head and blinks */
        var ow = 140, oh = 104, look = lkNoise(t * 0.3) * 2.2, blink = (t % 4.2) < 0.14 ? 0.1 : 1;
        c.strokeStyle = '#05060E'; c.lineWidth = 3; c.beginPath(); c.moveTo(ow - 22, oh + 12); c.lineTo(ow + 14, oh + 10); c.stroke();
        c.fillStyle = '#120E1A'; c.beginPath(); c.ellipse(ow, oh, 7.5, 10, 0, 0, FX_TAU); c.fill(); c.beginPath(); c.moveTo(ow - 7, oh - 6); c.lineTo(ow - 6, oh - 14); c.lineTo(ow - 2, oh - 8); c.lineTo(ow + 2, oh - 8); c.lineTo(ow + 6, oh - 14); c.lineTo(ow + 7, oh - 6); c.fill();
        c.globalCompositeOperation = 'lighter'; [-3, 3].forEach(function (ex) { fxGlow(c, '253,224,71', ow + ex + look, oh - 4, 4.5, 0.5 * blink); c.fillStyle = 'rgba(253,224,71,' + 0.95 * blink + ')'; c.beginPath(); c.ellipse(ow + ex + look, oh - 4, 2, 2 * blink, 0, 0, FX_TAU); c.fill(); }); c.globalCompositeOperation = 'source-over';
        /* the ground, warm where the fire reaches, with grass at its edge */
        var gg = c.createRadialGradient(0, 158, 4, 0, 160, 145); gg.addColorStop(0, 'rgb(' + Math.round(80 + 30 * fl) + ',44,18)'); gg.addColorStop(0.45, '#221A12'); gg.addColorStop(1, '#0B0B10'); c.fillStyle = gg; c.beginPath(); c.ellipse(0, 162, 142, 21, 0, 0, FX_TAU); c.fill();
        c.lineCap = 'round'; c.lineWidth = 1.2; Gr.forEach(function (g) { var lit = Math.max(0, 1 - Math.abs(g.x) / 140); c.strokeStyle = 'rgba(' + Math.round(40 + 160 * lit * fl) + ',' + Math.round(50 + 70 * lit * fl) + ',30,.9)'; for (var b = -1; b <= 1; b++) { c.beginPath(); c.moveTo(g.x + b * 2, g.y); c.quadraticCurveTo(g.x + b * 3, g.y - g.h * 0.6, g.x + b * 4 + Math.sin(t * 1.5 + g.ph) * 1.5, g.y - g.h); c.stroke(); } });
        /* the tent: lit on the side facing the fire, with a lantern glowing inside */
        var tg2 = c.createLinearGradient(-122, 0, -50, 0); tg2.addColorStop(0, '#2A0E06'); tg2.addColorStop(1, 'rgb(' + Math.round(140 + 50 * fl) + ',58,22)'); c.fillStyle = tg2; c.beginPath(); c.moveTo(-124, 164); c.lineTo(-87, 104); c.lineTo(-50, 164); c.closePath(); c.fill();
        var lg = c.createRadialGradient(-87, 150, 2, -87, 150, 22); lg.addColorStop(0, 'rgba(254,240,138,.95)'); lg.addColorStop(0.5, 'rgba(251,146,60,.55)'); lg.addColorStop(1, 'rgba(40,12,4,1)'); c.fillStyle = lg; c.beginPath(); c.moveTo(-87, 117); c.quadraticCurveTo(-92, 140, -99, 164); c.lineTo(-75, 164); c.quadraticCurveTo(-82, 140, -87, 117); c.fill();
        c.strokeStyle = 'rgba(253,186,116,' + 0.55 * fl + ')'; c.lineWidth = 1; c.beginPath(); c.moveTo(-87, 104); c.lineTo(-50, 164); c.moveTo(-87, 104); c.lineTo(-87, 96); c.moveTo(-50, 164); c.lineTo(-36, 166); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.moveTo(-105, 135); c.lineTo(-69, 135); c.stroke();
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', -87, 152, 20, 0.35 + 0.05 * Math.sin(t * 7)); c.globalCompositeOperation = 'source-over';
        /* a log to sit on, and a stick with a marshmallow that toasts over the fire and now and then catches */
        c.fillStyle = '#4A2C18'; c.beginPath(); fxRR(c, 52, 147, 54, 13, 6.5); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(60, 151); c.lineTo(96, 151); c.moveTo(64, 156); c.lineTo(100, 156); c.stroke();
        c.fillStyle = 'rgb(' + Math.round(170 + 60 * fl) + ',120,70)'; c.beginPath(); c.ellipse(54, 153.5, 4.5, 6.5, 0, 0, FX_TAU); c.fill(); c.strokeStyle = '#7C4A2D'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(54, 153.5, 2.2, 3.4, 0, 0, FX_TAU); c.stroke();
        mm = pu >= 0 ? Math.min(1, pu / 4.5) : mm; var mx = 26 + Math.sin(t * 0.8) * 1.5, my = 126 + Math.sin(t * 1.1) * 1.2, toast = Math.min(1, mm * 1.2);
        c.strokeStyle = '#8B5A2B'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(70, 148); c.lineTo(mx + 4, my + 2); c.stroke();
        c.fillStyle = 'rgb(' + Math.round(250 - 70 * toast) + ',' + Math.round(245 - 120 * toast) + ',' + Math.round(235 - 170 * toast) + ')'; c.beginPath(); fxRR(c, mx - 5, my - 4, 10, 8, 3); c.fill();
        if (flare > 0.35) { c.globalCompositeOperation = 'lighter'; lkTongue(c, mx, my - 3, 9 * flare + 3, 3, Math.sin(t * 12) * 2, 'rgba(251,146,60,.85)'); fxGlow(c, '253,224,71', mx, my - 6, 10, flare); c.globalCompositeOperation = 'source-over'; }
        /* the fire: a bed of coals, charred logs with glowing cracks, the stones, then the flames */
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '234,88,12', 0, 148, 110 * (0.9 + 0.2 * fl), 0.3 * fl); fxGlow(c, '251,146,60', 0, 140, 50, 0.5 * fl); c.globalCompositeOperation = 'source-over';
        c.fillStyle = '#1C0A04'; c.beginPath(); c.ellipse(0, 157, 25, 6, 0, 0, FX_TAU); c.fill();
        c.globalCompositeOperation = 'lighter'; EMB.forEach(function (e) { var g2 = 0.5 + 0.5 * Math.sin(t * 2.3 + e.p); fxGlow(c, g2 > 0.7 ? '254,240,138' : '249,115,22', e.x, e.y, e.z * 2, 0.5 + 0.5 * g2); }); c.globalCompositeOperation = 'source-over';
        [-0.33, 0.33].forEach(function (r) { c.save(); c.translate(0, 153); c.rotate(r); var lgd = c.createLinearGradient(0, -5, 0, 5); lgd.addColorStop(0, '#5B3A22'); lgd.addColorStop(1, '#1C0F07'); c.fillStyle = lgd; c.beginPath(); fxRR(c, -27, -5, 54, 10, 5); c.fill(); c.fillStyle = '#D9A066'; c.beginPath(); c.ellipse(r < 0 ? -26 : 26, 0, 2.6, 5, 0, 0, FX_TAU); c.fill(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(249,115,22,' + (0.5 + 0.4 * Math.sin(t * 3 + r * 9)) * fl + ')'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-14, 2); c.lineTo(-6, -1); c.lineTo(2, 2); c.lineTo(10, -1); c.stroke(); c.restore(); });
        c.globalCompositeOperation = 'source-over';
        STN.forEach(function (p) { c.fillStyle = '#3F3A36'; c.beginPath(); c.ellipse(p[0], p[1], p[2], p[2] * 0.64, 0, 0, FX_TAU); c.fill(); c.fillStyle = 'rgba(251,146,60,' + (0.4 * fl * (Math.sin(p[3]) < 0 ? 1 : 0.45)) + ')'; c.beginPath(); c.ellipse(p[0], p[1] - p[2] * 0.25, p[2] * 0.72, p[2] * 0.3, 0, 0, FX_TAU); c.fill(); });
        [['rgba(153,27,27,.9)', 1], ['#DC2626', 0.86], ['#EA580C', 0.72], ['#F59E0B', 0.56], ['#FDE68A', 0.4], ['#FFFBEB', 0.22]].forEach(function (L, n) {
          [-1.5, -0.5, 0.5, 1.5].forEach(function (j) { var h = (Math.abs(j) > 1 ? 26 : 44) * L[1] * fl * (1 + 0.2 * lkNoise(t * 3.1 + j * 7 + n)) + 4; lkTongue(c, j * 8 * L[1], 153, h, (Math.abs(j) > 1 ? 7 : 10) * L[1] + 2, lkNoise(t * 2.4 + j * 3 + n * 0.4) * 8 * L[1], L[0]); });
        });
        /* wisps of flame that break off and rise, and heat shimmer above */
        lkEvery(o3, 7, dt, function () { Wi.push({ x: fxR(-10, 10), y: 128 - 20 * fl, vx: fxR(-6, 6), vy: fxR(-60, -40), l: 0, m: fxR(0.3, 0.6) }); });
        c.globalCompositeOperation = 'lighter';
        lkStep(Wi, dt, 0, 0, function (w, f) { lkTongue(c, w.x, w.y, 12 * f, 3 * f + 0.5, Math.sin(t * 9 + w.m * 20) * 3, 'rgba(251,146,60,' + 0.8 * f + ')'); });
        c.strokeStyle = 'rgba(253,186,116,.08)'; c.lineWidth = 2; for (k = 0; k < 3; k++) { c.beginPath(); for (var y = 112; y > 60; y -= 4) { var hx3 = (k - 1) * 9 + Math.sin(y * 0.2 + t * 6 + k) * 3; if (y === 112) { c.moveTo(hx3, y); } else { c.lineTo(hx3, y); } } c.stroke(); }
        fxGlow(c, '255,247,205', 0, 142, 16, 0.6 + 0.3 * flare);
        /* sparks and smoke */
        lkEvery(o1, 20, dt, function () { Sp.push({ x: fxR(-8, 8), y: 134, vx: fxR(-16, 16), vy: fxR(-85, -45), l: 0, m: fxR(0.8, 2), p: fxR(0, 6) }); });
        lkEvery(o2, 3.5, dt, function () { Sm.push({ x: fxR(-4, 4), y: 108, vx: 0, vy: -20, l: 0, m: 3.6 }); });
        lkStep(Sm, dt, 0, 0, function (s1, f) { s1.vx = 7 + s1.l * 5 + lkNoise(t * 0.7 + s1.m) * 6; var a = Math.sin((1 - f) * Math.PI); fxGlow(c, '120,113,108', s1.x + Math.sin(t + s1.l * 2) * 4, s1.y, 12 + (1 - f) * 34, 0.12 * a); fxGlow(c, '234,88,12', s1.x, s1.y + 6, 10 + (1 - f) * 16, 0.08 * a * f); });
        lkStep(Sp, dt, -6, 0, function (p, f) { p.vx += Math.sin(t * 4 + p.p) * 60 * dt; c.strokeStyle = 'rgba(255,' + Math.round(150 + 90 * f) + ',' + Math.round(60 + 120 * f * f) + ',' + f + ')'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(p.px - p.vx * 0.02, p.py - p.vy * 0.02); c.lineTo(p.x, p.y); c.stroke(); fxGlow(c, f > 0.6 ? '254,240,138' : '251,146,60', p.x, p.y, 2.6, f); });
        if (Sp.length > 160) { Sp.splice(0, Sp.length - 160); }
        Ff.forEach(function (f) { var on = Math.max(0, Math.sin(t * f.sp * 2.4 + f.p)); fxGlow(c, '190,242,100', f.x + Math.sin(t * 0.7 + f.p) * 12, f.y + Math.cos(t * 0.5 + f.p) * 9, 2 + 6 * on, 0.15 + 0.8 * on); });
        c.globalCompositeOperation = 'source-over';
      };
    },
    /* Snow globe: a winter village under glass on a music box. A skater circles the frozen pond, smoke curls from the cabin, the
       lamp lights the snow; the key turns and notes float up. Every few seconds the globe rocks on its base, the snow whirls up
       in a vortex and settles again */
    snowglobe: function () {
      var F = [], Fr = [], Out = [], Nt = [], Sk = [], R = 66, CY = 86, i, tilt = 0, vt = 0, last = -1, o1 = {}, o2 = {}, swirl = 0;
      for (i = 0; i < 120; i++) { var a = fxR(0, FX_TAU), r = Math.sqrt(Math.random()) * (R - 6); F.push({ x: Math.cos(a) * r, y: CY + Math.sin(a) * r, vx: 0, vy: 0, z: fxR(0.7, 2), rest: false, p: fxR(0, 6) }); }
      for (i = 0; i < 40; i++) { Fr.push({ x: fxR(-R, R), u: Math.random(), sp: fxR(0.04, 0.09), p: fxR(0, 6) }); }
      for (i = 0; i < 18; i++) { Out.push({ x: fxR(-160, 160), u: Math.random(), sp: fxR(0.05, 0.12), z: fxR(0.8, 1.6) }); }
      function floor(x) { return CY + 30 + x * x * 0.0042; }
      return function (c, t, dt) {
        var n = Math.floor(t / 7.5), k;
        if (n !== last) { last = n; vt = 2.6; swirl = 1; F.forEach(function (f) { f.rest = false; var a1 = fxR(0, FX_TAU); f.vx = Math.cos(a1) * fxR(30, 110); f.vy = fxR(-150, -40); }); for (k = 0; k < 14; k++) { Sk.push({ a: fxR(0, FX_TAU), r: fxR(20, 60), l: 0, m: fxR(0.4, 0.9) }); } }
        var ka = -80 * tilt - 3.8 * vt; vt += ka * dt; tilt += vt * dt; swirl = Math.max(0, swirl - dt * 0.35);
        /* outside: soft light, slow snow, the globe's shadow and a pool of warm light on the table */
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '147,197,253', 0, CY, 130, 0.18); fxGlow(c, '253,224,71', 0, 172, 90, 0.12);
        Out.forEach(function (q) { q.u = (q.u + dt * q.sp) % 1; fxGlow(c, '224,242,254', q.x + Math.sin(t * 0.8 + q.z * 4) * 8, q.u * 170, 2 * q.z, 0.45 * Math.sin(q.u * Math.PI)); });
        c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(tilt * 6, 175, 82, 7, 0, 0, FX_TAU); c.fill();
        c.save(); c.translate(0, 174); c.rotate(tilt * 0.06); c.translate(0, -174);
        /* the base: turned wood with a gold band, a brass plate, and a key that turns */
        var bg = c.createLinearGradient(-70, 0, 70, 0); bg.addColorStop(0, '#3B1A08'); bg.addColorStop(0.35, '#9A5523'); bg.addColorStop(0.55, '#7C3F17'); bg.addColorStop(1, '#2A1205'); c.fillStyle = bg; c.beginPath(); c.moveTo(-50, 143); c.lineTo(50, 143); c.quadraticCurveTo(58, 158, 70, 173); c.lineTo(-70, 173); c.quadraticCurveTo(-58, 158, -50, 143); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.8; for (k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-60 + k * 6, 170); c.quadraticCurveTo(-30 + k * 20, 160 - k, 10 + k * 15, 168); c.stroke(); }
        c.fillStyle = '#D4A017'; c.fillRect(-55, 149, 110, 3); c.fillStyle = '#FDE68A'; c.fillRect(-55, 149, 110, 1);
        var pg = c.createLinearGradient(0, 156, 0, 167); pg.addColorStop(0, '#FDE68A'); pg.addColorStop(1, '#B7791F'); c.fillStyle = pg; c.beginPath(); fxRR(c, -17, 156, 34, 11, 2); c.fill(); fxStar4(c, -8, 161.5, 3, 1, '#7C4A03'); fxStar4(c, 0, 161.5, 3.6, 1, '#7C4A03'); fxStar4(c, 8, 161.5, 3, 1, '#7C4A03');
        var kr = t * 1.6, kw = Math.cos(kr); c.strokeStyle = '#B7791F'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(64, 160); c.lineTo(74, 160); c.stroke(); c.fillStyle = '#EAB308'; c.beginPath(); c.ellipse(78, 160, 3 + 2 * Math.abs(kw), 6, 0, 0, FX_TAU); c.fill(); c.beginPath(); c.ellipse(78, 160, Math.max(0.5, 1.4 * Math.abs(kw)), 3, 0, 0, FX_TAU); c.fillStyle = '#7C4A03'; c.fill();
        /* inside the glass: a night sky, far hills, the village */
        c.save(); c.beginPath(); c.arc(0, CY, R, 0, FX_TAU); c.clip();
        var sk = c.createLinearGradient(0, CY - R, 0, CY + R); sk.addColorStop(0, '#081634'); sk.addColorStop(0.6, '#1E3A8A'); sk.addColorStop(1, '#3B5BA9'); c.fillStyle = sk; c.fillRect(-R, CY - R, R * 2, R * 2);
        c.globalCompositeOperation = 'lighter'; for (k = 0; k < 12; k++) { fxGlow(c, '255,255,255', -52 + k * 9.5, CY - 52 + (k * 37) % 30, 1.5, 0.35 + 0.35 * Math.sin(t * 2 + k)); } fxGlow(c, '254,243,199', 34, CY - 38, 13, 0.55);
        Fr.forEach(function (q) { q.u = (q.u + dt * q.sp) % 1; fxGlow(c, '219,234,254', q.x + Math.sin(t + q.p) * 3, CY - R + q.u * R * 1.6, 1.4, 0.4); });
        c.globalCompositeOperation = 'source-over'; c.fillStyle = '#93A8D6'; c.beginPath(); c.moveTo(-R, CY + 20); c.lineTo(-38, CY + 2); c.lineTo(-20, CY + 16); c.lineTo(4, CY - 2); c.lineTo(30, CY + 18); c.lineTo(R, CY + 8); c.lineTo(R, CY + 40); c.lineTo(-R, CY + 40); c.fill(); c.fillStyle = '#E0E9FA'; c.beginPath(); c.moveTo(-38, CY + 2); c.lineTo(-31, CY + 8); c.lineTo(-43, CY + 7); c.fill(); c.beginPath(); c.moveTo(4, CY - 2); c.lineTo(12, CY + 4); c.lineTo(-3, CY + 4); c.fill();
        var sg = c.createLinearGradient(0, CY + 24, 0, CY + R); sg.addColorStop(0, '#F8FAFC'); sg.addColorStop(1, '#BFD4F2'); c.fillStyle = sg; c.beginPath(); c.moveTo(-R, floor(-R)); for (k = -R; k <= R; k += 6) { c.lineTo(k, floor(k)); } c.lineTo(R, CY + R); c.lineTo(-R, CY + R); c.fill();
        /* the frozen pond and its skater, circling */
        c.fillStyle = '#9CC3EE'; c.beginPath(); c.ellipse(-24, CY + 44, 24, 6, 0, 0, FX_TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-30, CY + 42.5, 9, 1.4, -0.1, 0, FX_TAU); c.fill();
        var sa = t * 1.3, sx = -24 + Math.cos(sa) * 17, sy2 = CY + 44 + Math.sin(sa) * 3.6, dir = -Math.sin(sa) > 0 ? 1 : -1; c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(-24, CY + 44.5, 17, 3.6, 0, sa - 1.4, sa); c.stroke();
        c.strokeStyle = '#1E293B'; c.lineWidth = 1.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx, sy2 - 1); c.lineTo(sx, sy2 - 8); c.moveTo(sx, sy2 - 6); c.lineTo(sx - dir * 4, sy2 - 4 + Math.sin(t * 6) * 1); c.moveTo(sx, sy2 - 6); c.lineTo(sx + dir * 4, sy2 - 7); c.stroke(); c.fillStyle = '#1E293B'; c.beginPath(); c.arc(sx, sy2 - 10, 1.8, 0, FX_TAU); c.fill(); c.strokeStyle = '#DC2626'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(sx, sy2 - 8); c.lineTo(sx - dir * 5, sy2 - 8 + Math.sin(t * 9) * 1.2); c.stroke();
        /* the cabin, its windows and door warm, smoke curling from the chimney */
        c.fillStyle = '#7C2D12'; c.fillRect(-4, CY + 12, 30, 19); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 0.7; for (k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-4, CY + 16 + k * 4); c.lineTo(26, CY + 16 + k * 4); c.stroke(); }
        c.fillStyle = '#F8FAFC'; c.beginPath(); c.moveTo(-9, CY + 13); c.lineTo(11, CY - 3); c.lineTo(31, CY + 13); c.closePath(); c.fill(); c.fillStyle = '#57534E'; c.fillRect(18, CY - 2, 5, 9); c.fillStyle = '#F8FAFC'; c.fillRect(17, CY - 3, 7, 2);
        var wl = 0.85 + 0.15 * Math.sin(t * 5) * Math.sin(t * 2.3); c.fillStyle = 'rgba(253,224,71,' + wl + ')'; c.fillRect(0, CY + 17, 7, 6); c.fillRect(16, CY + 17, 7, 6); c.fillStyle = 'rgba(251,146,60,' + wl * 0.9 + ')'; c.fillRect(9, CY + 21, 5, 10);
        /* a snowman with a scarf, and the pines */
        c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(44, floor(44) - 5, 6, 0, FX_TAU); c.fill(); c.beginPath(); c.arc(44, floor(44) - 14, 4.4, 0, FX_TAU); c.fill(); c.fillStyle = '#F97316'; c.beginPath(); c.moveTo(44, floor(44) - 14); c.lineTo(49, floor(44) - 13.4); c.lineTo(44, floor(44) - 12.8); c.fill(); c.strokeStyle = '#DC2626'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(40, floor(44) - 10); c.lineTo(48, floor(44) - 10); c.lineTo(49 + Math.sin(t * 3) * 1.5, floor(44) - 6); c.stroke(); c.fillStyle = '#0F172A'; c.beginPath(); c.arc(42.5, floor(44) - 15, 0.7, 0, FX_TAU); c.arc(45.5, floor(44) - 15, 0.7, 0, FX_TAU); c.fill();
        lkPine(c, 34, floor(34) + 2, 38, '#14532D', '#F8FAFC'); lkPine(c, 56, floor(56) + 2, 26, '#166534', '#F8FAFC'); lkPine(c, -52, floor(-52) + 2, 30, '#14532D', '#F8FAFC'); lkPine(c, -12, floor(-12) - 3, 22, '#166534', '#F8FAFC');
        c.strokeStyle = '#334155'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-36, floor(-36)); c.lineTo(-36, CY + 8); c.stroke();
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', 11, CY + 22, 22, 0.42 * wl); fxGlow(c, '254,240,138', -36, CY + 7, 13, 0.75); fxGlow(c, '255,255,255', -36, CY + 7, 3, 1); lkBeam(c, -36, CY + 8, Math.PI / 2, 30, 0.45, '254,240,138', 0.18);
        for (k = 0; k < 5; k++) { var su2 = (t * 0.22 + k / 5) % 1; fxGlow(c, '203,213,225', 20 + su2 * 12 + Math.sin(t + k * 1.7) * 3, CY - 4 - su2 * 30, 3 + su2 * 7, 0.22 * (1 - su2)); }
        /* the snow: thrown up by each shake into a whirl, it drifts down and settles */
        F.forEach(function (f) {
          if (!f.rest) { f.vx *= Math.pow(0.45, dt); f.vy = Math.min(14 + f.z * 3, f.vy + 55 * dt); var dx0 = f.x, dy0 = f.y - CY; f.vx += (-dy0 * 2.4 * swirl + Math.sin(t * 1.4 + f.p) * 8) * dt; f.vy += dx0 * 2.4 * swirl * dt; f.x += f.vx * dt; f.y += f.vy * dt;
            var dx = f.x, dy = f.y - CY, d = Math.sqrt(dx * dx + dy * dy); if (d > R - 4) { f.x = dx / d * (R - 4); f.y = CY + dy / d * (R - 4); f.vx *= -0.3; f.vy *= -0.3; }
            if (f.y >= floor(f.x) - 1 && f.vy > 0 && swirl < 0.5) { f.y = floor(f.x) - 1; f.rest = true; } }
          fxGlow(c, '255,255,255', f.x, f.y, f.z * 1.8, f.rest ? 0.35 : 0.95); if (!f.rest && f.z > 1.7) { fxStar4(c, f.x, f.y, f.z * 1.6, 0.6, '#FFFFFF'); }
        });
        lkStep(Sk, dt, 0, 0, function (q, f) { fxStar4(c, Math.cos(q.a + t) * q.r, CY + Math.sin(q.a + t) * q.r * 0.8, 5 * Math.sin(f * Math.PI), f, '#E0F2FE'); });
        c.restore();
        /* the glass: bright at its edge, two highlights and the reflection of a window */
        c.globalCompositeOperation = 'source-over'; var fr = c.createRadialGradient(-8, CY - 8, R * 0.5, 0, CY, R); fr.addColorStop(0, 'rgba(186,230,253,0)'); fr.addColorStop(0.85, 'rgba(186,230,253,.1)'); fr.addColorStop(1, 'rgba(224,242,254,.35)'); c.fillStyle = fr; c.beginPath(); c.arc(0, CY, R, 0, FX_TAU); c.fill();
        c.strokeStyle = 'rgba(186,230,253,.75)'; c.lineWidth = 2; c.beginPath(); c.arc(0, CY, R, 0, FX_TAU); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.arc(0, CY, R - 9, 3.6, 4.3); c.stroke(); c.lineWidth = 2.5; c.beginPath(); c.arc(0, CY, R - 9, 4.45, 4.62); c.stroke(); c.lineWidth = 1.5; c.beginPath(); c.arc(0, CY, R - 7, 0.35, 0.8); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); fxRR(c, 22, CY - 50, 12, 16, 2); c.fill();
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '255,255,255', -30, CY - 38, 16, 0.18); fxGlow(c, '186,230,253', 0, 146, 40, 0.2);
        c.restore();
        /* music from the box: notes float up from the key */
        lkEvery(o1, 0.9, dt, function () { Nt.push({ x: 82, y: 152, vx: fxR(4, 12), vy: fxR(-22, -14), l: 0, m: fxR(2.4, 3.4), g: ['♪', '♫', '♩'][Math.floor(Math.random() * 3)] }); });
        c.globalCompositeOperation = 'lighter'; c.textAlign = 'center'; c.font = '700 11px serif';
        lkStep(Nt, dt, 0, 0, function (q, f) { var x = q.x + Math.sin(t * 2 + q.m * 9) * 5; c.globalAlpha = Math.sin(f * Math.PI) * 0.85; c.fillStyle = '#FDE68A'; c.fillText(q.g, x, q.y); fxGlow(c, '253,224,138', x, q.y - 4, 7, 0.3 * Math.sin(f * Math.PI)); }); c.globalAlpha = 1;
        lkEvery(o2, 0.4, dt, function () { /* a stray glint on the glass */ Sk.push({ a: fxR(0, FX_TAU), r: fxR(30, 60), l: 0, m: 0.7 }); });
        c.globalCompositeOperation = 'source-over';
      };
    },
    /* Mimic: a treasure chest on a hoard of gold in a torch-lit vault. It breathes. Its keyhole opens into an eye; the lid creaks
       up on a row of eyes in the dark and drool; then it gapes on rows of teeth, a long tongue lashing out in a breath of purple
       mist, until it snaps shut, the vault shakes and the coins fly */
    mimic: function () {
      var Co = [], Gm = [], Fly = [], Mi = [], Dr = [], o1 = {}, o2 = {}, i, lastSnap = -1;
      for (i = 0; i < 130; i++) { var x0 = fxR(-118, 118), top = 160 - 30 * (1 - x0 * x0 / 13924); Co.push({ x: x0, y: fxR(top, 165), r: fxR(0, 1), p: fxR(0, 6) }); } Co.sort(function (a, b) { return a.y - b.y; });
      for (i = 0; i < 6; i++) { Gm.push({ x: [-92, -64, 74, 96, -30, 40][i], y: [154, 147, 150, 157, 160, 161][i], col: ['#E11D48', '#2563EB', '#16A34A', '#9333EA', '#0EA5E9', '#DC2626'][i], z: fxR(3.5, 5) }); }
      function open(u) { return u < 2.4 ? 0 : u < 3.1 ? 0.2 * fxEase((u - 2.4) / 0.7) + 0.02 * Math.sin(u * 40) * (u > 2.6 ? 1 : 0) : u < 3.4 ? 0.22 + 0.78 * fxEase((u - 3.1) / 0.3) : u < 5.3 ? 1 - 0.07 * Math.sin((u - 3.4) * 6) : u < 5.42 ? 1 - (u - 5.3) / 0.12 : u < 6.4 ? 0 : u < 6.9 ? 0.06 * Math.sin((u - 6.4) / 0.5 * Math.PI) : 0; }
      function torch(c, x, y, t, ph) {
        c.fillStyle = '#292524'; c.fillRect(x - 2, y, 4, 22); c.fillStyle = '#57534E'; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.lineTo(x + 3, y + 6); c.lineTo(x - 3, y + 6); c.fill();
        var f = 0.85 + 0.15 * lkNoise(t * 8 + ph); c.globalCompositeOperation = 'lighter'; fxGlow(c, '234,88,12', x, y - 8, 46 * f, 0.35); [['rgba(220,38,38,.9)', 1], ['#F97316', 0.75], ['#FDE68A', 0.45]].forEach(function (L) { lkTongue(c, x, y + 1, 18 * L[1] * f, 5 * L[1], lkNoise(t * 3 + ph) * 3, L[0]); }); c.globalCompositeOperation = 'source-over';
      }
      return function (c, t, dt) {
        var u = t % 7.2, a = open(u), snap = u > 5.42 && u < 6.2 ? 1 - (u - 5.42) / 0.78 : 0, br = a ? 0 : Math.sin(t * 2.4) * 0.03, lip = 100 - 48 * a, jx = snap > 0.55 ? fxR(-3, 3) : 0, cyc = Math.floor(t / 7.2), k;
        if (snap > 0 && lastSnap !== cyc) { lastSnap = cyc; for (k = 0; k < 34; k++) { var aa = -Math.PI / 2 + fxR(-1.2, 1.2), v = fxR(90, 260); Fly.push({ x: fxR(-60, 60), y: 150, vx: Math.cos(aa) * v, vy: Math.sin(aa) * v, l: 0, m: fxR(0.8, 1.3), r: fxR(0, 6), sp: fxR(8, 18) }); } }
        /* the vault: stone walls and floor that fade into the dark, and two torches */
        c.globalCompositeOperation = 'source-over'; var vg = c.createRadialGradient(0, 110, 20, 0, 110, 175); vg.addColorStop(0, 'rgba(34,26,38,.92)'); vg.addColorStop(0.7, 'rgba(22,17,28,.6)'); vg.addColorStop(1, 'rgba(10,9,21,0)'); c.fillStyle = vg; c.fillRect(-175, 0, 350, 192);
        var sg0 = c.createLinearGradient(-170, 0, 170, 0); sg0.addColorStop(0, 'rgba(120,113,108,0)'); sg0.addColorStop(0.5, 'rgba(120,113,108,.22)'); sg0.addColorStop(1, 'rgba(120,113,108,0)'); c.strokeStyle = sg0; c.lineWidth = 1;
        for (k = 0; k < 6; k++) { var by = 20 + k * 22; c.beginPath(); c.moveTo(-170, by); c.lineTo(170, by); c.stroke(); for (var bx = -170 + (k % 2) * 22; bx < 170; bx += 44) { c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by + 22); c.stroke(); } }
        var fg0 = c.createRadialGradient(0, 160, 10, 0, 160, 170); fg0.addColorStop(0, 'rgba(41,37,36,.95)'); fg0.addColorStop(1, 'rgba(12,10,9,0)'); c.fillStyle = fg0; c.beginPath(); c.ellipse(0, 166, 175, 30, 0, 0, FX_TAU); c.fill();
        c.strokeStyle = sg0; for (k = -6; k <= 6; k++) { c.beginPath(); c.moveTo(k * 22, 146); c.lineTo(k * 40, 192); c.stroke(); } [154, 166, 180].forEach(function (y) { c.beginPath(); c.moveTo(-170, y); c.lineTo(170, y); c.stroke(); });
        torch(c, -132, 70, t, 0); torch(c, 132, 70, t, 3);
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '168,85,247', 0, 112, 150, 0.16 + 0.22 * a); fxGlow(c, '250,204,21', 0, 152, 120, 0.18);
        if (snap > 0) { fxRing(c, 0, 160, 40 + (1 - snap) * 130, 8 + (1 - snap) * 22, '250,204,21', snap, 2.5); fxRing(c, 0, 160, 30 + (1 - snap) * 90, 6 + (1 - snap) * 15, '255,255,255', snap * 0.6, 1.5); }
        c.globalCompositeOperation = 'source-over';
        function coins(front) { Co.forEach(function (q) { if ((q.y > 147 && Math.abs(q.x) < 64) !== front) { return; } var jy = snap > 0 ? -Math.sin((1 - snap) * Math.PI) * 16 * q.r : (a > 0.9 ? -Math.abs(Math.sin(t * 30 + q.p)) * 1.2 : 0); var cg = c.createLinearGradient(q.x - 5, q.y - 3, q.x + 5, q.y + 3); cg.addColorStop(0, '#FEF08A'); cg.addColorStop(0.5, q.r > 0.5 ? '#FACC15' : '#EAB308'); cg.addColorStop(1, '#A16207'); c.fillStyle = cg; c.strokeStyle = '#854D0E'; c.lineWidth = 0.7; c.beginPath(); c.ellipse(q.x, q.y + jy, 5, 2.6, 0, 0, FX_TAU); c.fill(); c.stroke(); }); }
        coins(false);
        Gm.forEach(function (g) { c.fillStyle = g.col; c.beginPath(); c.moveTo(g.x, g.y - g.z); c.lineTo(g.x + g.z, g.y - g.z * 0.2); c.lineTo(g.x, g.y + g.z * 0.8); c.lineTo(g.x - g.z, g.y - g.z * 0.2); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(g.x, g.y - g.z); c.lineTo(g.x + g.z * 0.4, g.y - g.z * 0.3); c.lineTo(g.x - g.z * 0.3, g.y - g.z * 0.3); c.fill(); });
        c.globalCompositeOperation = 'lighter'; for (k = 0; k < 7; k++) { var tw = Math.max(0, Math.sin(t * 2.2 + k * 2.3)); if (tw > 0.2) { var q2 = Co[(k * 13 + Math.floor(t / 3.2)) % Co.length]; fxStar4(c, q2.x, q2.y - 2, 5.5 * tw, tw, '#FFFBEB'); } } Gm.forEach(function (g, n) { var tw2 = Math.max(0, Math.sin(t * 1.7 + n * 1.9)); fxStar4(c, g.x + 1, g.y - g.z * 0.6, 4 * tw2, tw2, '#FFFFFF'); });
        c.globalCompositeOperation = 'source-over';
        c.save(); c.translate(jx, 146); c.scale(1 + br * 0.4, 1 + br); c.translate(0, -146);
        /* the mouth, behind the front of the chest: gums, eyes, teeth */
        if (a > 0.01) {
          var mg = c.createLinearGradient(0, lip, 0, 104); mg.addColorStop(0, '#0A0204'); mg.addColorStop(1, '#6B0F1A'); c.fillStyle = mg; c.beginPath(); c.moveTo(-54, 102); c.lineTo(-54, lip + 2); c.lineTo(54, lip + 2); c.lineTo(54, 102); c.closePath(); c.fill();
          c.fillStyle = '#9F1239'; c.beginPath(); c.moveTo(-54, lip + 1); for (k = 0; k <= 10; k++) { c.quadraticCurveTo(-54 + (k - 0.5) * 10.8, lip + 6, -54 + k * 10.8, lip + 1); } c.lineTo(54, lip - 2); c.lineTo(-54, lip - 2); c.fill();
          c.globalCompositeOperation = 'lighter'; fxGlow(c, '220,38,38', 0, (lip + 100) / 2, 44 * a + 10, 0.45 * a); c.globalCompositeOperation = 'source-over';
          var ey = lip + (100 - lip) * 0.42, look = lkNoise(t * 0.9) * 0.9;
          [[-22, 1, 0], [20, 1, 1.3], [-4, 0.6, 2.1], [36, 0.45, 2.9], [-38, 0.5, 3.7]].forEach(function (E) { var er = (3.5 + 6 * a) * E[1], bl = ((t + E[2]) % 3.1) < 0.14 ? 0.15 : 1, ex = E[0], eyy = ey + (E[1] < 1 ? -er * 0.6 : 0); c.globalCompositeOperation = 'lighter'; fxGlow(c, '190,242,100', ex, eyy, er * 2.6, 0.7 * bl); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#D9F99D'; c.beginPath(); c.ellipse(ex, eyy, er, er * 0.62 * bl, ex < 0 ? 0.25 : -0.25, 0, FX_TAU); c.fill(); if (bl > 0.5) { c.fillStyle = '#0A0A0A'; c.beginPath(); c.ellipse(ex + look * er * 0.4, eyy, er * 0.16, er * 0.5, 0, 0, FX_TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(ex - er * 0.3, eyy - er * 0.2, er * 0.12, 0, FX_TAU); c.fill(); } });
          var tg = c.createLinearGradient(0, lip, 0, lip + 18); tg.addColorStop(0, '#FFFBEB'); tg.addColorStop(1, '#D6D3C4'); c.fillStyle = tg; c.strokeStyle = '#78716C'; c.lineWidth = 0.7;
          for (k = 0; k < 10; k++) { var tx = -50 + k * 11.1, L = (k === 1 || k === 8 ? 19 : 10 + (k % 3) * 2) * a; c.beginPath(); c.moveTo(tx - 4.5, lip + 1); c.quadraticCurveTo(tx - 1.5, lip + L * 0.7, tx, lip + 1 + L); c.quadraticCurveTo(tx + 1.5, lip + L * 0.7, tx + 4.5, lip + 1); c.fill(); c.stroke(); }
          for (k = 0; k < 9; k++) { var bx2 = -44.5 + k * 11.1, L2 = (k === 0 || k === 8 ? 13 : 8) * a; c.beginPath(); c.moveTo(bx2 - 4, 101); c.quadraticCurveTo(bx2 - 1, 101 - L2 * 0.7, bx2, 101 - L2); c.quadraticCurveTo(bx2 + 1, 101 - L2 * 0.7, bx2 + 4, 101); c.fill(); c.stroke(); }
          /* drool from the upper teeth */
          if (a > 0.15) { lkEvery(o1, 1.6, dt, function () { Dr.push({ x: fxR(-40, 40), y: lip + 10, vx: 0, vy: 0, l: 0, m: 1.4, s: 0 }); }); }
        }
        /* the lid, lifted back */
        var ly = -46 * a, lh = 30 * (1 - 0.55 * a), lg2 = c.createLinearGradient(0, 100 + ly - lh, 0, 100 + ly); lg2.addColorStop(0, '#6B3415'); lg2.addColorStop(1, '#3B1708');
        c.fillStyle = lg2; c.beginPath(); c.moveTo(-58, 100 + ly); c.lineTo(-58, 100 + ly - lh * 0.55); c.quadraticCurveTo(-56, 100 + ly - lh, -40, 100 + ly - lh); c.lineTo(40, 100 + ly - lh); c.quadraticCurveTo(56, 100 + ly - lh, 58, 100 + ly - lh * 0.55); c.lineTo(58, 100 + ly); c.closePath(); c.fill();
        c.strokeStyle = '#2A0F04'; c.lineWidth = 1; for (k = 1; k < 3; k++) { c.beginPath(); c.moveTo(-56, 100 + ly - lh * k / 3); c.lineTo(56, 100 + ly - lh * k / 3); c.stroke(); }
        var gb = c.createLinearGradient(0, 100 + ly - lh, 0, 100 + ly); gb.addColorStop(0, '#FDE68A'); gb.addColorStop(1, '#A16207'); c.fillStyle = gb; [-44, 36].forEach(function (bx3) { c.fillRect(bx3, 100 + ly - lh + 1, 8, lh - 1); }); c.fillRect(-58, 97 + ly, 116, 3.5);
        /* the front: planks, bands with rivets, corner caps */
        var fg = c.createLinearGradient(0, 100, 0, 146); fg.addColorStop(0, '#7A3812'); fg.addColorStop(1, '#3B1708'); c.fillStyle = fg; c.fillRect(-56, 100, 112, 46);
        c.strokeStyle = '#2A0F04'; c.lineWidth = 1; for (k = 1; k < 3; k++) { c.beginPath(); c.moveTo(-56, 100 + k * 15); c.lineTo(56, 100 + k * 15); c.stroke(); } c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 0.7; for (k = 0; k < 6; k++) { c.beginPath(); c.moveTo(-50 + k * 19, 103 + (k % 3) * 15); c.quadraticCurveTo(-42 + k * 19, 106 + (k % 3) * 15, -34 + k * 19, 103 + (k % 3) * 15); c.stroke(); }
        var gb2 = c.createLinearGradient(0, 100, 0, 146); gb2.addColorStop(0, '#FDE68A'); gb2.addColorStop(0.5, '#CA8A04'); gb2.addColorStop(1, '#854D0E'); c.fillStyle = gb2; [-44, 36].forEach(function (bx4) { c.fillRect(bx4, 100, 8, 46); }); c.fillRect(-58, 143, 116, 3.5);
        c.fillStyle = '#FEF3C7'; [-40, 40].forEach(function (bx5) { [106, 123, 140].forEach(function (ry) { c.beginPath(); c.arc(bx5, ry, 1.3, 0, FX_TAU); c.fill(); }); });
        /* the lock: its keyhole becomes an eye now and then */
        c.fillStyle = gb2; c.beginPath(); fxRR(c, -10, 104, 20, 22, 4); c.fill(); c.strokeStyle = '#854D0E'; c.stroke();
        var kb = u > 0.9 && u < 2.0 ? Math.sin((u - 0.9) / 1.1 * Math.PI) : 0;
        if (kb > 0.05) { fxEye(c, 0, 115, 7.5, kb, lkNoise(t * 2) * 1.2, 0, '#84CC16', 1); c.globalCompositeOperation = 'lighter'; fxGlow(c, '132,204,22', 0, 115, 14, 0.4 * kb); c.globalCompositeOperation = 'source-over'; } else { c.fillStyle = '#1C0A02'; c.beginPath(); c.arc(0, 113, 2.6, 0, FX_TAU); c.fill(); c.fillRect(-1.2, 113, 2.4, 7); }
        /* the tongue: a chain of segments that waves and curls over the front */
        if (a > 0.5) {
          var tl = Math.min(1, (a - 0.5) / 0.45), P = [[0, 98]], ang = Math.PI / 2 + 0.3 * Math.sin(t * 1.9), N = 12, w0 = 11;
          for (k = 1; k <= N; k++) { ang += Math.sin(t * 3.2 - k * 0.55) * 0.16 + 0.03; P.push([P[k - 1][0] + Math.cos(ang) * 5.2 * tl, P[k - 1][1] + Math.sin(ang) * 5.2 * tl]); }
          var Lft = [], Rgt = []; P.forEach(function (p, m) { var q3 = P[Math.min(N, m + 1)], q0 = P[Math.max(0, m - 1)], dx = q3[0] - q0[0], dy = q3[1] - q0[1], d = Math.hypot(dx, dy) || 1, w = w0 * (1 - m / N * 0.45); Lft.push([p[0] - dy / d * w, p[1] + dx / d * w]); Rgt.push([p[0] + dy / d * w, p[1] - dx / d * w]); });
          var tng = c.createLinearGradient(0, 98, 0, 160); tng.addColorStop(0, '#9D174D'); tng.addColorStop(1, '#F472B6'); c.fillStyle = tng; c.beginPath(); c.moveTo(Lft[0][0], Lft[0][1]); Lft.forEach(function (p) { c.lineTo(p[0], p[1]); }); var tip = P[N]; c.arc(tip[0], tip[1], w0 * 0.55, 0, Math.PI, false); Rgt.slice().reverse().forEach(function (p) { c.lineTo(p[0], p[1]); }); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(131,24,67,.7)'; c.lineWidth = 1.4; c.beginPath(); P.forEach(function (p, m) { if (m) { c.lineTo(p[0], p[1]); } else { c.moveTo(p[0], p[1]); } }); c.stroke(); c.fillStyle = 'rgba(255,255,255,.35)'; P.forEach(function (p, m) { if (m % 3 === 1) { c.beginPath(); c.arc(p[0] - 3, p[1], 1.2, 0, FX_TAU); c.fill(); } });
          /* a breath of purple mist */
          lkEvery(o2, 10 * tl, dt, function () { Mi.push({ x: fxR(-30, 30), y: lip + 10, vx: fxR(-30, 30), vy: fxR(-40, -10), l: 0, m: fxR(1, 1.8) }); });
        }
        c.restore();
        c.globalCompositeOperation = 'lighter'; lkStep(Mi, dt, -10, 0.6, function (m, f) { fxGlow(c, '192,132,252', m.x, m.y, 10 + (1 - f) * 22, 0.18 * Math.sin(f * Math.PI)); });
        c.globalCompositeOperation = 'source-over'; lkStep(Dr, dt, 160, 0, function (d, f) { d.s = Math.min(8, d.s + dt * 10); c.strokeStyle = 'rgba(186,230,253,.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(d.x, d.y - d.s); c.lineTo(d.x, d.y); c.stroke(); c.fillStyle = 'rgba(224,242,254,.85)'; c.beginPath(); c.arc(d.x, d.y, 1.8, 0, FX_TAU); c.fill(); if (d.y > 150) { d.l = d.m; } });
        coins(true);
        /* the coins thrown up by the snap */
        lkStep(Fly, dt, 520, 0, function (q, f) { q.r += q.sp * dt; var rw = 5 * Math.abs(Math.cos(q.r)) + 0.8; c.globalAlpha = Math.min(1, f * 2); c.fillStyle = Math.cos(q.r) > 0 ? '#FACC15' : '#CA8A04'; c.strokeStyle = '#854D0E'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(q.x, q.y, rw, 5, 0, 0, FX_TAU); c.fill(); c.stroke(); c.globalAlpha = 1; if (q.y > 158 && q.vy > 0) { q.vy *= -0.35; q.vx *= 0.6; } });
      };
    },
    /* Caldera: a volcano under a sky of ash. A lake of lava churns in its crater and rivers of it run down its sides with a crust
       that cracks; lava bombs arc out trailing smoke; lightning forks through the plume. It rumbles, and every few seconds it
       erupts in full: a flash, a ring of pressure in the air, a fountain of fire and a wave of ash */
    caldera: function () {
      var Lv = [], Pf = [], Sp = [], Bm = [], Em = [], Ash = [], o1 = {}, o2 = {}, o3 = {}, o4 = {}, i, j, bolts = [], nextB = 1.5, Cr = [];
      [[-12, -50], [-5, -16], [6, 22], [14, 60]].forEach(function (s0, n) { var pts = [], y; for (y = 72; y <= 160; y += 4) { var v = (y - 72) / 88; pts.push([s0[0] + (s0[1] - s0[0]) * v * v + Math.sin(n * 3 + y * 0.13) * 4 * v, y]); } Lv.push(zPath(pts)); });
      for (i = 0; i < 30; i++) { Em.push({ x: fxR(-160, 160), u: Math.random(), sp: fxR(0.04, 0.1), g: i % 3 === 0 }); }
      for (i = 0; i < 16; i++) { Cr.push({ x: fxR(-150, 150), y: fxR(164, 176), l: fxR(8, 20), a: fxR(-0.4, 0.4), p: fxR(0, 6) }); }
      function slope(x) { var ax = Math.abs(x), v = Math.min(1, Math.max(0, (ax - 20) / 132)); return 68 + 94 * (1 - (1 - v) * (1 - v)); }
      return function (c, t, dt) {
        var cyc = t % 8, pre = cyc > 6.6 ? (cyc - 6.6) / 1.4 : 0, boom = cyc < 1.4 ? 1 - cyc / 1.4 : 0, sh = boom > 0.5 ? (boom - 0.5) * 7 : pre * 1.6, k;
        c.save(); c.translate(fxR(-sh, sh), fxR(-sh, sh) * 0.5);
        /* sky: a red glow under heavy cloud */
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '220,38,38', 0, 80, 180, 0.22 + 0.25 * boom); fxGlow(c, '249,115,22', 0, 64, 80, 0.4 + 0.4 * boom + 0.2 * pre);
        Em.forEach(function (q) { q.u = (q.u + dt * q.sp) % 1; fxGlow(c, q.g ? '251,146,60' : '168,162,158', q.x + Math.sin(t + q.u * 9) * 6, q.u * 170, q.g ? 2.4 : 1.8, Math.sin(q.u * Math.PI) * (q.g ? 0.8 : 0.4)); });
        /* the plume: billows of ash, lit orange from below, pushed out hard by each eruption */
        lkEvery(o1, 5 + 14 * boom + 3 * pre, dt, function () { Pf.push({ x: fxR(-8, 8), y: 60, r: fxR(9, 15) * (1 + boom), l: 0, m: fxR(3.8, 5.4), vx: fxR(-6, 16) * (1 + boom * 2), vy: -30 - 60 * boom, sh: fxR(0.75, 1) }); });
        c.globalCompositeOperation = 'source-over';
        lkStep(Pf, dt, 0, 0.7, function (p, f) { p.vy = Math.min(p.vy, -12); p.r += (10 + 14 * (1 - f)) * dt; var al = Math.min(1, p.l * 2) * f, gr = c.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.4, 1, p.x, p.y, p.r); gr.addColorStop(0, 'rgba(' + Math.round(116 * p.sh) + ',' + Math.round(106 * p.sh) + ',' + Math.round(100 * p.sh) + ',' + 0.95 * al + ')'); gr.addColorStop(1, 'rgba(28,25,23,' + 0.9 * al + ')'); c.fillStyle = gr; c.beginPath(); c.arc(p.x, p.y, p.r, 0, FX_TAU); c.fill(); });
        c.globalCompositeOperation = 'lighter'; Pf.forEach(function (p2) { var lo = Math.max(0, (p2.y - 4) / 56); fxGlow(c, '234,88,12', p2.x, p2.y + p2.r * 0.5, p2.r * 1.1, (0.3 + 0.3 * boom) * lo * (1 - p2.l / p2.m)); });
        /* lightning in the plume, lighting it from inside */
        if (t > nextB || t < nextB - 5) { nextB = t + fxR(0.9, 2.4) * (boom > 0 ? 0.4 : 1); var bx = fxR(-50, 30), by = fxR(4, 24), main = fxJag(bx, by, bx + fxR(-20, 60), fxR(34, 56), 0.5, 4); bolts.push({ pts: main, br: [fxJag(main[6][0], main[6][1], main[6][0] + fxR(-40, 40), main[6][1] + fxR(10, 30), 0.5, 3)], l: 0 }); }
        for (k = bolts.length - 1; k >= 0; k--) { var b = bolts[k]; b.l += dt; if (b.l > 0.3) { bolts.splice(k, 1); continue; } var ba = (Math.random() < 0.7 ? 1 : 0.2) * (1 - b.l / 0.3); fxBolt(c, b.pts, ba, '191,219,254'); b.br.forEach(function (q) { fxBolt(c, q, ba * 0.6, '165,180,252'); }); fxGlow(c, '219,234,254', b.pts[0][0], b.pts[0][1] + 10, 60, 0.3 * ba); }
        /* the mountain, its strata, the crater rim */
        c.globalCompositeOperation = 'source-over'; c.fillStyle = '#1A110D'; c.beginPath(); c.moveTo(-160, 166); c.quadraticCurveTo(-120, 112, -84, 120); c.quadraticCurveTo(-60, 130, -40, 166); c.fill(); c.beginPath(); c.moveTo(160, 166); c.quadraticCurveTo(128, 124, 100, 128); c.quadraticCurveTo(76, 136, 60, 166); c.fill();
        var mg = c.createLinearGradient(0, 64, 0, 166); mg.addColorStop(0, '#40281F'); mg.addColorStop(0.5, '#22150F'); mg.addColorStop(1, '#0C0807'); c.fillStyle = mg; c.beginPath(); c.moveTo(-152, 166); for (k = -152; k <= 152; k += 4) { c.lineTo(k, slope(k)); } c.lineTo(152, 166); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1; for (k = 0; k < 5; k++) { var sy = 92 + k * 15; c.beginPath(); c.moveTo(-Math.min(150, 20 + (sy - 68) * 1.2), sy + 2); c.quadraticCurveTo(0, sy + 6 + Math.sin(k) * 3, Math.min(150, 20 + (sy - 68) * 1.2), sy + 2); c.stroke(); }
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(249,115,22,' + (0.35 + 0.3 * boom) + ')'; c.lineWidth = 1.2; c.beginPath(); for (k = -60; k <= 60; k += 4) { if (k === -60) { c.moveTo(k, slope(k)); } else { c.lineTo(k, slope(k)); } } c.stroke();
        /* the lava lake in the crater, churning */
        c.globalCompositeOperation = 'source-over'; var ll = c.createLinearGradient(0, 62, 0, 72); ll.addColorStop(0, '#FDE68A'); ll.addColorStop(1, '#EA580C'); c.fillStyle = ll; c.beginPath(); c.ellipse(0, 67, 22, 4, 0, 0, FX_TAU); c.fill();
        c.fillStyle = 'rgba(124,45,18,.75)'; for (k = 0; k < 5; k++) { var cx2 = -16 + ((t * 6 + k * 8) % 32); c.beginPath(); c.ellipse(cx2, 67 + Math.sin(k * 2) * 1.2, 3.2, 1, 0, 0, FX_TAU); c.fill(); }
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,186,116', 0, 66, 26, 0.8 + 0.2 * Math.sin(t * 8)); fxGlow(c, '255,247,205', 0, 66, 9, 0.9);
        /* rivers of lava, the crust on them cracking as it flows */
        c.lineJoin = 'round'; c.lineCap = 'round';
        Lv.forEach(function (p, n) { var P = p.pts; [[7, 'rgba(234,88,12,.25)'], [3.4, 'rgba(249,115,22,.85)'], [1.5, 'rgba(253,224,71,.95)']].forEach(function (L) { c.lineWidth = L[0]; c.strokeStyle = L[1]; fxTrace(c, P); c.stroke(); });
          c.globalCompositeOperation = 'source-over'; for (var m = 0; m < 6; m++) { var d = ((t * 10 + m * p.len / 6 + n * 13) % p.len), q = zAlong(p, d); c.fillStyle = 'rgba(41,20,12,.8)'; c.beginPath(); c.ellipse(q[0], q[1], 2.4, 1.4, 0.8, 0, FX_TAU); c.fill(); } c.globalCompositeOperation = 'lighter';
          c.setLineDash([3, 13]); c.lineDashOffset = -t * 26 - n * 7; c.strokeStyle = 'rgba(255,251,235,.9)'; c.lineWidth = 1.6; fxTrace(c, P); c.stroke(); c.setLineDash([]); var e0 = P[P.length - 1]; c.globalCompositeOperation = 'source-over'; var pl = c.createRadialGradient(e0[0], e0[1] + 2, 1, e0[0], e0[1] + 2, 14); pl.addColorStop(0, '#FDE68A'); pl.addColorStop(0.5, '#F97316'); pl.addColorStop(1, 'rgba(124,45,18,0)'); c.fillStyle = pl; c.beginPath(); c.ellipse(e0[0], e0[1] + 2, 14, 4, 0, 0, FX_TAU); c.fill(); c.globalCompositeOperation = 'lighter'; fxGlow(c, '249,115,22', e0[0], e0[1], 18, 0.55); });
        /* the fountain of fire, and the bombs */
        lkEvery(o2, 24 + 110 * boom + 20 * pre, dt, function () { Sp.push({ x: fxR(-5, 5), y: 64, vx: fxR(-55, 55) * (1 + boom * 0.7), vy: fxR(-170, -90) * (1 + boom * 0.6), l: 0, m: 6 }); });
        lkEvery(o3, 0.6 + 4 * boom, dt, function () { Bm.push({ x: 0, y: 62, vx: fxR(-90, 90), vy: fxR(-210, -150), l: 0, m: 6, tr: [] }); });
        lkStep(Sp, dt, 230, 0, function (q) { if (q.vy > 0 && q.y > slope(q.x)) { q.l = q.m; fxGlow(c, '249,115,22', q.x, q.y, 8, 0.5); return; } c.strokeStyle = 'rgba(251,146,60,.8)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(q.px - q.vx * 0.03, q.py - q.vy * 0.03); c.lineTo(q.x, q.y); c.stroke(); fxGlow(c, '253,186,116', q.x, q.y, 3, 1); });
        lkStep(Bm, dt, 200, 0, function (q) { q.tr.push([q.x, q.y]); if (q.tr.length > 14) { q.tr.shift(); } if (q.vy > 0 && q.y > slope(q.x)) { q.l = q.m; for (var m2 = 0; m2 < 8; m2++) { Sp.push({ x: q.x, y: q.y - 2, vx: fxR(-60, 60), vy: fxR(-90, -30), l: 0, m: 6 }); } return; } q.tr.forEach(function (p3, m3) { fxGlow(c, '120,113,108', p3[0], p3[1], 3 + (14 - m3) * 0.5, 0.06 * m3 / 14); }); fxGlow(c, '255,247,205', q.x, q.y, 5, 1); fxGlow(c, '249,115,22', q.x, q.y, 12, 0.6); });
        if (Sp.length > 300) { Sp.splice(0, Sp.length - 300); }
        /* the eruption: a flash and a ring of pressure in the air */
        if (boom > 0.7) { fxGlow(c, '255,237,213', 0, 60, 170, (boom - 0.7) * 2.6); }
        if (boom > 0) { var rv = 1 - boom; c.globalAlpha = boom; c.strokeStyle = 'rgba(255,237,213,.8)'; c.lineWidth = 2.5 * boom; c.beginPath(); c.ellipse(0, 60, 20 + rv * 190, 8 + rv * 90, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); c.globalAlpha = 1; }
        /* ash falling, and the ground cracked with fire */
        lkEvery(o4, 6, dt, function () { Ash.push({ x: fxR(-160, 160), y: -4, vx: fxR(4, 12), vy: fxR(10, 22), l: 0, m: 9 }); }); lkStep(Ash, dt, 0, 0, function (q) { fxGlow(c, '168,162,158', q.x + Math.sin(t + q.m * 3) * 3, q.y, 1.6, 0.4); });
        c.globalCompositeOperation = 'source-over'; c.fillStyle = '#0A0605'; c.beginPath(); c.ellipse(0, 170, 160, 13, 0, 0, FX_TAU); c.fill();
        c.globalCompositeOperation = 'lighter'; Cr.forEach(function (q) { var pu2 = 0.45 + 0.35 * Math.sin(t * 2 + q.p) + 0.3 * boom; c.strokeStyle = 'rgba(249,115,22,' + pu2 + ')'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q.x + Math.cos(q.a) * q.l * 0.5, q.y + Math.sin(q.a) * q.l * 0.2 + 1); c.lineTo(q.x + Math.cos(q.a) * q.l, q.y - 1); c.stroke(); fxGlow(c, '249,115,22', q.x + q.l * 0.5, q.y, 6, 0.25 * pu2); });
        c.restore(); c.globalCompositeOperation = 'source-over';
      };
    },
    /* Kilonova: two dead stars circle each other over a grid of bent space, their beams sweeping and their fields looping, matter
       streaming between them, faster and faster as ripples race out across the grid. They merge in a flash: jets of light, a
       shell of color, gold scattered everywhere, and a black hole with a ring of fire where they were; the grid rings like a bell */
    kilonova: function () {
      var Tr = [[], []], G = [], i, Sk = [], Neb = [], C = 11, IN = 7.2;
      for (i = 0; i < 70; i++) { Sk.push({ x: fxR(-165, 165), y: fxR(2, 150), p: fxR(0, 6), z: fxR(0.4, 1.4) }); }
      for (i = 0; i < 5; i++) { Neb.push({ x: fxR(-150, 150), y: fxR(10, 110), r: fxR(50, 90), col: ['91,33,182', '14,116,144', '190,24,93', '37,99,235', '126,34,206'][i], p: fxR(0, 6) }); }
      return function (c, t, dt) {
        var cyc = t % C, u = Math.min(1, cyc / IN), post = cyc - IN, d = 6 + 52 * Math.pow(1 - u, 0.7), ph = 74 * (1 - Math.pow(1 - u, 0.4)) + Math.floor(t / C) * 1.3, well = 10 + 16 * u, fin = cyc < 0.9 ? cyc / 0.9 : 1, ring = post > 0 ? Math.exp(-post * 1.2) * Math.sin(post * 14) : 0, k, a, r;
        c.globalCompositeOperation = 'lighter';
        Neb.forEach(function (n) { fxGlow(c, n.col, n.x + Math.sin(t * 0.05 + n.p) * 10, n.y, n.r, 0.12); });
        /* stars, pushed outward a little near the pair as their light bends */
        Sk.forEach(function (q) { var dx = q.x, dy = q.y - 82, dd = Math.hypot(dx, dy) || 1, push = post < 0 ? 140 / (dd + 20) * u : 0, x = q.x + dx / dd * push, y = q.y + dy / dd * push; fxGlow(c, '226,232,255', x, y, 1.8 * q.z, 0.2 + 0.3 * Math.sin(t * 2 + q.p)); });
        if (post < 0) { fxRing(c, 0, 82, d * 1.6 + 6, d * 0.7 + 4, '196,181,253', 0.12 * u, 1); }
        /* the grid of space: pulled down in the middle, rippling as waves pass, ringing after the merger */
        function gy(r2, an, tt) { var wave = 0, k2; for (k2 = 0; k2 < 3; k2++) { var rr = ((ph / Math.PI - Math.floor(ph / Math.PI) + k2) * (14 + 30 * (1 - u))); wave += Math.exp(-Math.pow((r2 - rr) / 6, 2)) * 3 * u; } if (post > 0) { wave += Math.exp(-Math.pow((r2 - post * 70) / 10, 2)) * 8 * Math.max(0, 1 - post / 2.5); } return 160 + Math.sin(an) * 24 * r2 / 140 + (well + ring * 8) * Math.exp(-r2 / 40) + wave; }
        c.lineWidth = 1;
        for (r = 16; r <= 144; r += 16) { c.strokeStyle = 'rgba(103,232,249,' + (0.16 + 0.12 * (1 - r / 144)) + ')'; c.beginPath(); for (k = 0; k <= 56; k++) { a = k / 56 * FX_TAU; if (k) { c.lineTo(Math.cos(a) * r, gy(r, a)); } else { c.moveTo(Math.cos(a) * r, gy(r, a)); } } c.stroke(); }
        for (k = 0; k < 20; k++) { a = k / 20 * FX_TAU; c.strokeStyle = 'rgba(167,139,250,.2)'; c.beginPath(); for (r = 4; r <= 144; r += 8) { if (r === 4) { c.moveTo(Math.cos(a) * r, gy(r, a)); } else { c.lineTo(Math.cos(a) * r, gy(r, a)); } } c.stroke(); }
        fxGlow(c, '103,232,249', 0, 160 + well, 30, 0.25 + 0.3 * u);
        if (post < 0) {
          /* the pair: trails, field loops, sweeping beams, the bridge of matter between them */
          var S = [[Math.cos(ph) * d, 82 + Math.sin(ph) * d * 0.34, Math.sin(ph), '191,219,254', ph * 3.1], [-Math.cos(ph) * d, 82 - Math.sin(ph) * d * 0.34, -Math.sin(ph), '251,207,232', -ph * 2.7]];
          S.forEach(function (q, n) { Tr[n].push([q[0], q[1]]); if (Tr[n].length > 30) { Tr[n].shift(); } Tr[n].forEach(function (p, j) { fxGlow(c, q[3], p[0], p[1], 2 + j * 0.25, (j / 30) * 0.5 * fin); }); });
          S.forEach(function (q) { c.strokeStyle = 'rgba(' + q[3] + ',' + 0.25 * fin + ')'; c.lineWidth = 0.8; [8, 13].forEach(function (lr) { [1, -1].forEach(function (sd) { c.beginPath(); c.ellipse(q[0] + sd * lr * 0.7, q[1], lr * 0.75, lr * 0.45, 0, 0, FX_TAU); c.stroke(); }); });
            [0, Math.PI].forEach(function (o) { lkBeam(c, q[0], q[1], q[4] + o, 60 + 40 * u, 0.04, q[3], 0.35 * fin); }); });
          var mx = (S[0][0] + S[1][0]) / 2, my = (S[0][1] + S[1][1]) / 2; c.strokeStyle = 'rgba(233,213,255,' + (0.3 + 0.5 * u) * fin + ')'; c.lineWidth = 2 + 4 * u; c.beginPath(); c.moveTo(S[0][0], S[0][1]); c.quadraticCurveTo(mx + Math.sin(ph) * d * 0.4, my - Math.cos(ph) * d * 0.4, S[1][0], S[1][1]); c.stroke();
          for (k = 0; k < 8; k++) { var f2 = ((t * 2 + k / 8) % 1), qx = S[0][0] + (S[1][0] - S[0][0]) * f2 + Math.sin(ph) * d * 0.4 * Math.sin(f2 * Math.PI) * 0.5, qy = S[0][1] + (S[1][1] - S[0][1]) * f2 - Math.cos(ph) * d * 0.4 * Math.sin(f2 * Math.PI) * 0.5; fxGlow(c, '255,255,255', qx, qy, 2.5, 0.8 * fin); }
          if (u > 0.6) { for (k = 0; k < 2; k++) { for (var m = 0; m < 14; m++) { var sa = ph + k * Math.PI - m * 0.22, sr = d + m * 4 * (u - 0.6) * 2.5; fxGlow(c, k ? '251,207,232' : '191,219,254', Math.cos(sa) * sr, 82 + Math.sin(sa) * sr * 0.34, 2, (1 - m / 14) * (u - 0.6) * 2); } } }
          S.sort(function (p, q) { return p[2] - q[2]; }).forEach(function (q) { var z = 1 + 0.18 * q[2]; fxGlow(c, q[3], q[0], q[1], 24 * z, 0.6 * fin); fxGlow(c, '255,255,255', q[0], q[1], 7 * z, fin); c.save(); c.translate(q[0], q[1]); c.rotate(t * 2); fxStar4(c, 0, 0, 13 * z, fin, '#FFFFFF'); c.rotate(Math.PI / 4); fxStar4(c, 0, 0, 6 * z, fin * 0.7, '#FFFFFF'); c.restore(); });
          if (u > 0.85) { fxGlow(c, '255,255,255', 0, 82, 34 * (u - 0.85) / 0.15, (u - 0.85) / 0.15 * 0.85); }
        } else {
          Tr = [[], []];
          var fade = Math.max(0, 1 - post / 3.2), e = Math.min(1, post / 0.12);
          if (post < 0.6) { fxGlow(c, '255,255,255', 0, 82, 140 + post * 320, 1 - post / 0.6); }
          /* jets with knots running out along them */
          [-1, 1].forEach(function (sd) { lkBeam(c, 0, 82, sd * Math.PI / 2, 190, 0.05 + 0.03 * Math.sin(t * 30), '224,242,254', 0.85 * fade); for (k = 0; k < 4; k++) { var kd = ((post * 120 + k * 45) % 180); fxGlow(c, '224,242,254', 0, 82 + sd * kd, 5, fade * (1 - kd / 180)); } });
          for (k = 0; k < 4; k++) { var v = (post - k * 0.15) / 2.6; if (v > 0 && v < 1) { c.globalAlpha = 1 - v; c.lineWidth = 7 * (1 - v) + 1; c.strokeStyle = ['#93C5FD', '#C4B5FD', '#F0ABFC', '#FBBF24'][k]; c.beginPath(); c.ellipse(0, 82, 10 + v * 160, 6 + v * 86, 0, 0, FX_TAU); c.stroke(); c.globalAlpha = 1; } }
          fxGlow(c, '251,146,60', 0, 82, 40 + post * 60, 0.5 * fade * e); fxGlow(c, '244,114,182', 0, 82, 30 + post * 40, 0.4 * fade * e);
          if (!G.length) { for (k = 0; k < 90; k++) { a = fxR(0, FX_TAU); var sp = fxR(30, 170); G.push({ x: 0, y: 82, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, z: fxR(2, 5.5), rest: 0 }); } }
          /* what is left: a black hole, its ring of fire, and the far side of its disk bent up over it */
          var bh = Math.min(1, Math.max(0, (post - 0.35) / 0.6)); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#000000'; c.globalAlpha = bh; c.beginPath(); c.arc(0, 82, 9, 0, FX_TAU); c.fill(); c.globalAlpha = 1; c.globalCompositeOperation = 'lighter';
          fxRing(c, 0, 82, 12, 12, '253,224,71', bh * (0.6 + 0.3 * Math.sin(t * 6)), 1.6); fxRing(c, 0, 82, 26, 6, '251,146,60', bh * 0.8, 2.4); c.globalAlpha = bh * 0.7; c.strokeStyle = '#FDBA74'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 79, 15, 11, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.globalAlpha = 1;
          c.globalCompositeOperation = 'source-over'; c.textAlign = 'center'; c.font = '600 9px ' + FX_MONO; var wtx = 'where gold is made.', wn = Math.max(0, Math.min(wtx.length, Math.floor((post - 0.8) / 0.06))); if (wn > 0 && post < 3.6) { c.globalAlpha = Math.min(1, (3.6 - post) / 0.5) * 0.85; c.fillStyle = '#FDE68A'; c.fillText(wtx.slice(0, wn), 0, 22); c.globalAlpha = 1; } c.globalCompositeOperation = 'lighter';
        }
        /* the gold rains down onto the grid and stays, glittering, until the next pair comes */
        G.forEach(function (g) { if (!g.rest) { g.vx *= Math.pow(0.35, dt); g.vy = g.vy * Math.pow(0.35, dt) + 40 * dt; g.x += g.vx * dt; g.y += g.vy * dt; var fl2 = gy(Math.min(140, Math.abs(g.x)), Math.PI / 2) - 4; if (g.y > fl2) { g.y = fl2; g.rest = 1; } } fxStar4(c, g.x, g.y, g.z * (0.6 + 0.4 * Math.sin(t * 5 + g.z * 3)), cyc > C - 0.7 ? (C - cyc) / 0.7 : 0.95, '#FDE68A'); });
        if (cyc < 0.1 && G.length) { G = []; }
        c.globalCompositeOperation = 'source-over';
      };
    }
  };
  Object.keys(LK_STG).forEach(function (k) { FX_STG[k] = LK_STG[k]; fxStageWrap(k); });

  /* ---------- right-answer effects: drawn over the page, around the answer (k is its box, read again every frame) ---------- */
  FX_DUR.dominoes = 2.7; FX_DUR.jackpot = 3.3; FX_DUR.stormbreak = 3.9; FX_DUR.angler = 3.7; FX_DUR.threshold = 4.7;
  /* the loop of ground just outside the answer: a rounded rectangle, measured so things can be placed along it */
  function lkLoop(k, m) {
    var X0 = k.x - m, Y0 = k.y - m, W = k.w + m * 2, H = k.h + m * 2, r = Math.min(20, H / 2), j;
    var Q = [[X0 + r, Y0 + H], [X0 + W - r, Y0 + H]]; for (j = 0; j <= 6; j++) { var a1 = Math.PI / 2 - j / 6 * Math.PI / 2; Q.push([X0 + W - r + Math.cos(a1) * r, Y0 + H - r + Math.sin(a1) * r]); }
    Q.push([X0 + W, Y0 + r]); for (j = 0; j <= 6; j++) { var a2 = -j / 6 * Math.PI / 2; Q.push([X0 + W - r + Math.cos(a2) * r, Y0 + r + Math.sin(a2) * r]); }
    Q.push([X0 + r, Y0]); for (j = 0; j <= 6; j++) { var a3 = -Math.PI / 2 - j / 6 * Math.PI / 2; Q.push([X0 + r + Math.cos(a3) * r, Y0 + r + Math.sin(a3) * r]); }
    Q.push([X0, Y0 + H - r]); for (j = 0; j <= 6; j++) { var a4 = Math.PI - j / 6 * Math.PI / 2; Q.push([X0 + r + Math.cos(a4) * r, Y0 + H - r + Math.sin(a4) * r]); }
    return zPath(Q);
  }
  /* Dominoes: dominoes in every color stand in a ring around your answer. They fall one after another, faster and faster, each
     with a click of light; when the last lands, a wave of light runs round the ring and your answer shines */
  FX_DRAW.dominoes = function (s, k) {
    var Sp = [], Du = [], clicked = {}, i;
    return function (t, dt) {
      var c = s.ctx, L = lkLoop(k, 18), sp = 14, n = Math.max(12, Math.floor(L.len / sp)), gap = L.len / n, e = fxEnv(t, 0, 0.1, 2.3, 2.7), D = FX_INK.dark, last = 0;
      function at(i2) { return 0.32 + 1.55 * Math.pow(i2 / (n - 1), 0.72); }
      lkOut(c, s, k, 4);
      for (i = n - 1; i >= 0; i--) {
        var d0 = i * gap, p = zAlong(L, d0), p2 = zAlong(L, d0 + 1), th = Math.atan2(p2[1] - p[1], p2[0] - p[0]), pop = fxEase(Math.min(1, Math.max(0, (t - i / n * 0.28) / 0.12))), u = Math.max(0, Math.min(1, (t - at(i)) / 0.13)), isLast = i === n - 1, len = 5 + ((isLast ? 30 : gap + 5) - 5) * Math.sin(fxEase(u) * Math.PI / 2), hue = (i / n * 330 + 10) % 360;
        if (u >= 1 && !clicked[i]) { clicked[i] = 1; var cx0 = p[0] + Math.cos(th) * len, cy0 = p[1] + Math.sin(th) * len; Sp.push({ x: cx0, y: cy0, vx: 0, vy: 0, l: 0, m: 0.25 }); for (var j = 0; j < 3; j++) { Du.push({ x: p[0], y: p[1], vx: fxR(-30, 30), vy: fxR(-30, 30), l: 0, m: fxR(0.3, 0.6) }); } }
        if (u > 0) { last = Math.max(last, i); }
        c.save(); c.translate(p[0], p[1]); c.rotate(th); c.scale(pop, pop); c.globalAlpha = e;
        c.fillStyle = D ? 'rgba(0,0,0,.45)' : 'rgba(15,23,42,.18)'; c.fillRect(2, -9, len, 22);
        var g = c.createLinearGradient(0, -11, 0, 11); g.addColorStop(0, 'hsl(' + hue + ',85%,' + (u > 0.5 ? 62 : 70) + '%)'); g.addColorStop(1, 'hsl(' + hue + ',80%,' + (u > 0.5 ? 44 : 50) + '%)'); c.fillStyle = g; c.beginPath(); fxRR(c, 0, -11, len, 22, 2.5); c.fill();
        c.strokeStyle = 'hsl(' + hue + ',70%,30%)'; c.lineWidth = 1; c.stroke();
        if (u > 0.45) { var fa = Math.min(1, (u - 0.45) * 2.2); c.globalAlpha = e * fa; c.strokeStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.moveTo(len / 2, -9); c.lineTo(len / 2, 9); c.stroke(); c.fillStyle = '#FFFFFF'; [[0.25, -0.45], [0.25, 0.45], [0.75, 0], [0.75, -0.5], [0.75, 0.5]].slice(0, 2 + (i % 4)).forEach(function (q) { c.beginPath(); c.arc(len * q[0], q[1] * 14, 1.6, 0, FX_TAU); c.fill(); }); }
        else { c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(1, -10, 2, 20); }
        c.restore();
      }
      c.globalAlpha = 1;
      /* clicks of light and puffs of dust where each one lands */
      c.globalCompositeOperation = D ? 'lighter' : 'source-over';
      lkStep(Sp, dt, 0, 0, function (q, f) { fxStar4(c, q.x, q.y, 7 * f, f * e, D ? '#FFFFFF' : '#F59E0B'); });
      lkStep(Du, dt, 0, 0.1, function (q, f) { fxGlow(c, D ? '226,232,240' : '148,163,184', q.x, q.y, 5, 0.35 * f * e); });
      /* the wave of light round the ring, and the finish */
      var endT = at(n - 1) + 0.15, w = (t - endT) / 0.55;
      if (w > 0 && w < 1.2) { c.globalCompositeOperation = 'lighter'; for (i = 0; i < 8; i++) { var q2 = zAlong(L, Math.max(0, Math.min(L.len, (w - i * 0.02) * L.len))); fxGlow(c, '253,224,71', q2[0], q2[1], 18 - i, (1 - i / 8) * 0.8 * e); } }
      lkIn(c);
      if (t > endT) { var p3 = zAlong(L, L.len - 2), v2 = (t - endT) / 0.6; if (v2 < 1) { c.globalCompositeOperation = 'lighter'; fxRing(c, p3[0], p3[1], 6 + v2 * 50, 6 + v2 * 50, '253,224,71', (1 - v2) * e, 2); fxStar4(c, p3[0], p3[1] - v2 * 30, 12 * Math.sin(v2 * Math.PI), e, '#FDE68A'); } }
      lkFinish(c, k, e * Math.max(0, Math.min(1, (t - endT - 0.2) / 0.25)), (t - endT - 0.2) / 0.6, '250,204,21');
      c.globalCompositeOperation = 'source-over';
    };
  };
  /* the reels' symbols: a 7, a cherry, a bell, a bar and a star */
  function lkSym(c, i, x, y, z) {
    i = ((i % 5) + 5) % 5; c.save(); c.translate(x, y);
    if (i === 0) { c.font = '900 ' + Math.round(z * 1.25) + 'px "DM Sans", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = '#7F1D1D'; c.strokeText('7', 0, 1); c.fillStyle = '#EF4444'; c.fillText('7', 0, 1); }
    else if (i === 1) { c.strokeStyle = '#15803D'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-z * 0.25, z * 0.1); c.quadraticCurveTo(-z * 0.1, -z * 0.35, z * 0.15, -z * 0.45); c.moveTo(z * 0.25, z * 0.15); c.quadraticCurveTo(z * 0.2, -z * 0.2, z * 0.15, -z * 0.45); c.stroke(); c.fillStyle = '#DC2626'; [[-z * 0.25, z * 0.22], [z * 0.25, z * 0.27]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], z * 0.22, 0, FX_TAU); c.fill(); }); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(-z * 0.3, z * 0.15, z * 0.06, 0, FX_TAU); c.fill(); }
    else if (i === 2) { c.fillStyle = '#F59E0B'; c.strokeStyle = '#92400E'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-z * 0.4, z * 0.3); c.quadraticCurveTo(-z * 0.32, -z * 0.45, 0, -z * 0.45); c.quadraticCurveTo(z * 0.32, -z * 0.45, z * 0.4, z * 0.3); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#92400E'; c.beginPath(); c.arc(0, z * 0.36, z * 0.09, 0, FX_TAU); c.fill(); }
    else if (i === 3) { c.fillStyle = '#18181B'; c.fillRect(-z * 0.5, -z * 0.2, z, z * 0.4); c.fillStyle = '#FFFFFF'; c.font = '800 ' + Math.round(z * 0.3) + 'px "DM Sans", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('BAR', 0, 1); }
    else { c.fillStyle = '#FACC15'; c.strokeStyle = '#A16207'; c.lineWidth = 1; c.beginPath(); for (var j = 0; j < 10; j++) { var a = -Math.PI / 2 + j * Math.PI / 5, r = j % 2 ? z * 0.2 : z * 0.45; if (j) { c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } else { c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } } c.closePath(); c.fill(); c.stroke(); }
    c.restore();
  }
  /* Jackpot: a slot machine pops up by the answer. A coin drops in, the lever comes down, the reels blur and stop one by one on
     7, 7, 7; the siren on top spins, the sign lights letter by letter, confetti bursts and coins pour out of both sides */
  FX_DRAW.jackpot = function (s, k) {
    var Co = [], Cf = [], made = false, R0 = [fxR(0, 5), fxR(0, 5), fxR(0, 5)], STOP = [1.1, 1.38, 1.66], thunk = [0, 0, 0], WIN = 1.78;
    return function (t, dt) {
      var c = s.ctx, W = 180, H = 84, up = k.y > 150, mx = k.cx - W / 2, my = up ? k.y - H - 34 : k.y + k.h + 44, e = fxEnv(t, 0, 0.2, 2.85, 3.3), pop = Math.min(1, t / 0.2), win = t > WIN, i, wt = t - WIN;
      lkOut(c, s, k, 4);
      c.save(); var sc = 0.6 + 0.4 * fxEase(pop) + (pop < 1 ? Math.sin(pop * Math.PI) * 0.08 : 0); c.translate(k.cx, my + H / 2); c.scale(sc, sc); c.translate(-k.cx, -(my + H / 2)); c.globalAlpha = e;
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(k.cx, my + H + 6, W * 0.52, 6, 0, 0, FX_TAU); c.fill();
      /* the siren on top: still until the win, then turning, throwing beams */
      var dx0 = k.cx, dy0 = my - 8; if (win) { c.globalCompositeOperation = 'lighter'; for (i = 0; i < 2; i++) { var ba = wt * 7 + i * Math.PI; lkBeam(c, dx0, dy0, ba, 170, 0.22, '248,113,113', 0.35 * Math.max(0, Math.cos(ba - Math.PI * 1.5) * 0.5 + 0.5) * e + 0.12 * e); } c.globalCompositeOperation = 'source-over'; }
      c.fillStyle = '#A1A1AA'; c.fillRect(dx0 - 16, my - 4, 32, 6); var dg = c.createRadialGradient(dx0 - 4, dy0 - 6, 1, dx0, dy0, 14); dg.addColorStop(0, win && Math.floor(t * 14) % 2 ? '#FFF1F2' : '#FCA5A5'); dg.addColorStop(1, '#B91C1C'); c.fillStyle = dg; c.beginPath(); c.arc(dx0, my - 4, 13, Math.PI, 0); c.fill();
      /* the lever, pulled with a bounce */
      var lv = t < 0.45 ? 0 : t < 0.62 ? (t - 0.45) / 0.17 : t < 0.95 ? 1 - fxEase((t - 0.62) / 0.33) * 1.12 : t < 1.1 ? -0.12 * (1 - (t - 0.95) / 0.15) : 0, la = -1.25 + 1.55 * lv, kx = mx + W + 12 + Math.cos(la) * 30, ky = my + H * 0.52 + Math.sin(la) * 30;
      c.strokeStyle = '#D4D4D8'; c.lineWidth = 4.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(mx + W + 2, my + H * 0.52); c.lineTo(kx, ky); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(mx + W + 2, my + H * 0.52 - 1); c.lineTo(kx, ky - 1); c.stroke();
      var kg = c.createRadialGradient(kx - 2, ky - 2, 1, kx, ky, 8); kg.addColorStop(0, '#FCA5A5'); kg.addColorStop(1, '#B91C1C'); c.fillStyle = kg; c.beginPath(); c.arc(kx, ky, 7, 0, FX_TAU); c.fill();
      /* the cabinet: red with chrome trim, a marquee of chasing bulbs, the coin slot and the tray */
      var g = c.createLinearGradient(0, my, 0, my + H); g.addColorStop(0, '#EF4444'); g.addColorStop(0.5, '#B91C1C'); g.addColorStop(1, '#7F1D1D'); c.fillStyle = g; c.beginPath(); fxRR(c, mx, my, W, H, 14); c.fill();
      var cg = c.createLinearGradient(mx, 0, mx + W, 0); cg.addColorStop(0, '#A1A1AA'); cg.addColorStop(0.3, '#FFFFFF'); cg.addColorStop(0.6, '#D4D4D8'); cg.addColorStop(1, '#71717A'); c.strokeStyle = cg; c.lineWidth = 3.5; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); fxRR(c, mx + 6, my + 3, W - 12, 8, 4); c.fill();
      for (i = 0; i < 20; i++) { var bx = mx + 9 + i * (W - 18) / 19, on = win ? (Math.floor(t * 14) + i) % 3 === 0 : (Math.floor(t * 6) + i) % 4 === 0; c.fillStyle = on ? '#FEF08A' : '#7C2D12'; c.beginPath(); c.arc(bx, my + 8, 2.4, 0, FX_TAU); c.fill(); if (on) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '254,240,138', bx, my + 8, 6, 0.8); c.globalCompositeOperation = 'source-over'; } }
      c.fillStyle = '#18181B'; c.fillRect(mx + W - 26, my + 66, 14, 3); c.fillStyle = '#3F3F46'; c.beginPath(); fxRR(c, mx + 40, my + H - 12, W - 80, 9, 3); c.fill();
      /* the reels, blurred while they spin; each lands with a bounce and a flash */
      [0, 1, 2].forEach(function (r) {
        var rx = mx + 15 + r * 52, ry = my + 17, rw = 46, rh = 46, stop = STOP[r], sp = 26, pos;
        if (t < 0.6) { pos = R0[r]; } else if (t < stop) { pos = R0[r] + (t - 0.6) * sp; } else { var from = R0[r] + (stop - 0.6) * sp, target = Math.ceil(from) + 5 - (Math.ceil(from) % 5), v = Math.min(1, (t - stop) / 0.24); pos = from + (target - from) * (1 - Math.pow(1 - v, 3)) - Math.sin(v * Math.PI) * 0.08; if (!thunk[r] && v >= 1) { thunk[r] = t; } }
        c.fillStyle = '#FFFBEB'; c.beginPath(); fxRR(c, rx, ry, rw, rh, 6); c.fill(); c.save(); c.beginPath(); fxRR(c, rx, ry, rw, rh, 6); c.clip();
        var base = Math.floor(pos), spin = t > 0.6 && t < stop; for (var j = -1; j <= 1; j++) { var yy = ry + rh / 2 + (j - (pos - base)) * 34; if (spin) { for (var m2 = 0; m2 < 3; m2++) { c.globalAlpha = e * 0.3; lkSym(c, base + j, rx + rw / 2, yy - m2 * 6, 26); } } c.globalAlpha = e; lkSym(c, base + j, rx + rw / 2, yy, 26); }
        var bl = c.createLinearGradient(0, ry, 0, ry + rh); bl.addColorStop(0, 'rgba(120,53,15,.5)'); bl.addColorStop(0.28, 'rgba(255,251,235,0)'); bl.addColorStop(0.72, 'rgba(255,251,235,0)'); bl.addColorStop(1, 'rgba(120,53,15,.5)'); c.fillStyle = bl; c.fillRect(rx, ry, rw, rh);
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + rw * 0.45, ry); c.lineTo(rx + rw * 0.2, ry + rh); c.lineTo(rx, ry + rh); c.fill();
        c.restore(); c.strokeStyle = '#A16207'; c.lineWidth = 2; c.beginPath(); fxRR(c, rx, ry, rw, rh, 6); c.stroke();
        if (thunk[r] && t - thunk[r] < 0.25) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '255,255,255', rx + rw / 2, ry + rh / 2, 30, (1 - (t - thunk[r]) / 0.25) * 0.7); c.globalCompositeOperation = 'source-over'; }
      });
      /* the coin going in */
      if (t > 0.2 && t < 0.55) { var cu = (t - 0.2) / 0.35, cyy = my - 60 + cu * cu * 120; c.save(); c.beginPath(); c.rect(mx - 50, -100, W + 100, my + 67 + 100 - 1); c.clip(); c.fillStyle = '#FACC15'; c.strokeStyle = '#854D0E'; c.beginPath(); c.ellipse(mx + W - 19, Math.min(cyy, my + 66), 2.5 + 3 * Math.abs(Math.cos(t * 20)), 6, 0, 0, FX_TAU); c.fill(); c.stroke(); c.restore(); }
      if (win) {
        var fl = Math.floor(t * 8) % 2; c.strokeStyle = fl ? '#FDE047' : '#FFFFFF'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(mx + 9, my + 40); c.lineTo(mx + W - 9, my + 40); c.stroke();
        /* the sign: each letter lights in turn, then the word flashes */
        var word = 'JACKPOT!', lit = Math.min(word.length, Math.floor(wt / 0.05)); c.font = '900 22px "DM Sans", system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.lineJoin = 'round'; var tw = c.measureText(word).width, x0 = k.cx - tw / 2, ty = my - 32;
        for (i = 0; i < lit; i++) { var lx = x0 + c.measureText(word.slice(0, i)).width, jump = Math.max(0, 1 - (wt - i * 0.05) / 0.15) * 6; c.lineWidth = 5; c.strokeStyle = '#7F1D1D'; c.strokeText(word[i], lx, ty - jump); c.fillStyle = fl && wt > 0.45 ? '#FFFFFF' : '#FDE047'; c.fillText(word[i], lx, ty - jump); }
        c.textBaseline = 'alphabetic';
      }
      c.restore();
      /* confetti and coins */
      if (win && !made) { made = true; for (i = 0; i < 56; i++) { var sd = i % 2 ? 1 : -1; Co.push({ x: sd > 0 ? mx + W + 4 : mx - 4, y: my + H * 0.55, vx: sd * fxR(40, 240), vy: fxR(-360, -110), l: 0, m: 3, sp: fxR(6, 14), r: fxR(0, 6) }); } for (i = 0; i < 60; i++) { var ca = fxR(-Math.PI, 0), cv = fxR(120, 340); Cf.push({ x: k.cx, y: my, vx: Math.cos(ca) * cv, vy: Math.sin(ca) * cv, l: 0, m: fxR(1.2, 1.9), r: fxR(0, 6), sp: fxR(-12, 12), col: ['#F43F5E', '#FACC15', '#22C55E', '#38BDF8', '#A78BFA', '#FB923C'][i % 6] }); } }
      lkStep(Cf, dt, 260, 0.35, function (q, f) { q.r += q.sp * dt; c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.globalAlpha = Math.min(1, f * 2) * e; c.fillStyle = q.col; c.fillRect(-3, -1.8 * Math.abs(Math.cos(q.r * 1.7)), 6, 3.6 * Math.abs(Math.cos(q.r * 1.7)) + 0.3); c.restore(); });
      lkStep(Co, dt, 640, 0, function (q) { q.r += q.sp * dt; var rw2 = 6 * Math.abs(Math.cos(q.r)) + 1; c.globalAlpha = e; var gg = c.createLinearGradient(q.x - rw2, q.y, q.x + rw2, q.y); gg.addColorStop(0, '#FEF08A'); gg.addColorStop(1, '#CA8A04'); c.fillStyle = Math.cos(q.r) > 0 ? gg : '#A16207'; c.strokeStyle = '#854D0E'; c.lineWidth = 1; c.beginPath(); c.ellipse(q.x, q.y, rw2, 6, 0, 0, FX_TAU); c.fill(); c.stroke(); if (Math.cos(q.r * 3) > 0.97) { c.globalCompositeOperation = 'lighter'; fxStar4(c, q.x - 2, q.y - 2, 6, e, '#FFFFFF'); c.globalCompositeOperation = 'source-over'; } });
      c.globalAlpha = 1; lkIn(c);
      c.globalCompositeOperation = 'lighter'; if (win) { fxGlow(c, '253,224,71', k.cx, my + H / 2, 140, 0.22 * e * (0.6 + 0.4 * Math.sin(t * 14))); }
      lkFinish(c, k, win ? e * Math.min(1, wt / 0.2) : 0, (wt - 0.1) / 0.7, '250,204,21'); c.globalCompositeOperation = 'source-over';
    };
  };
  /* After the storm: clouds roll in, lit from inside by lightning. Rain sheets down and splashes off the top of your answer; three
     strikes hit beside it, shaking the page. Then the clouds part with silver edges, sunlight pours down through the gap with
     dust glittering in it, a double rainbow rises over your answer, drops on its edge sparkle, and birds fly off */
  FX_DRAW.stormbreak = function (s, k) {
    var Cl = [], Rn = [], Sp = [], Mo = [], Bd = [], i, St = [0.62, 1.02, 1.38].map(function (at, n) { return { at: at, pts: null, br: [], n: n }; }), o1 = {};
    for (i = 0; i < 22; i++) { Cl.push({ x: (i + 0.5) / 22, y: fxR(-0.02, 0.12), r: fxR(50, 95), sh: fxR(0.75, 1), p: fxR(0, 6) }); }
    for (i = 0; i < 170; i++) { Rn.push({ x: Math.random(), y: Math.random(), sp: fxR(0.9, 1.4), l: fxR(10, 24) }); }
    for (i = 0; i < 40; i++) { Mo.push({ x: fxR(-0.3, 0.3), y: Math.random(), p: fxR(0, 6), z: fxR(1, 2.4) }); }
    for (i = 0; i < 4; i++) { Bd.push({ x: k.cx + fxR(-70, 70), y: k.y - fxR(40, 120), d: i % 2 ? 1 : -1, sp: fxR(90, 150) }); }
    return function (t, dt) {
      var c = s.ctx, inn = fxEase(Math.min(1, t / 0.5)), part = t > 1.85 ? fxEase(Math.min(1, (t - 1.85) / 0.9)) : 0, e = fxEnv(t, 0, 0.3, 3.4, 3.9), rain = (1 - part) * inn, cb = Math.min(170, k.y - 30), D = FX_INK.dark, wind = 0.12 + 0.08 * lkNoise(t * 1.5), shake = 0, flash = 0;
      St.forEach(function (b) { var u = t - b.at; if (u >= 0 && u < 0.35) { shake = Math.max(shake, (1 - u / 0.35) * 5); if (u < 0.1) { flash = Math.max(flash, 1 - u / 0.1); } } });
      fxDim(c, s, k, 0.64 * (1 - part) * e, '#0F172A');
      c.save(); c.translate(fxR(-shake, shake), fxR(-shake, shake) * 0.6); lkOut(c, s, k, 9);
      /* rain, slanting with the wind, and its splashes on the answer's top edge */
      if (rain > 0.02) { c.strokeStyle = 'rgba(191,219,254,' + 0.55 * rain + ')'; c.lineWidth = 1.2; c.beginPath(); Rn.forEach(function (q) { var y = ((q.y + t * q.sp * 1.4) % 1) * (s.h + 40) - 20, x = q.x * s.w - y * wind; if (y > k.y - 4 && y < k.y + k.h + 4 && x > k.x - 4 && x < k.x + k.w + 4) { return; } c.moveTo(x, y); c.lineTo(x - q.l * wind * 2, y + q.l); }); c.stroke();
        lkEvery(o1, 40 * rain, dt, function () { Sp.push({ x: k.x + Math.random() * k.w, y: k.y - 5, vx: fxR(-40, 40), vy: fxR(-90, -40), l: 0, m: 0.35 }); }); }
      c.globalCompositeOperation = 'source-over'; lkStep(Sp, dt, 500, 0, function (q, f) { c.fillStyle = 'rgba(191,219,254,' + f + ')'; c.fillRect(q.x, q.y, 1.6, 1.6); });
      /* lightning: three strikes beside the answer, each branching, with a flash of the whole page */
      St.forEach(function (b) { var u = t - b.at; if (u < 0 || u > 0.32) { return; } if (!b.pts) { var tx = k.x + k.w * [0.16, 0.55, 0.86][b.n] + fxR(-10, 10), ty = k.y - 5; b.pts = fxJag(tx + fxR(-70, 70), Math.max(0, cb - 30), tx, ty, 0.45, 5); for (var m = 0; m < 3; m++) { var br = b.pts[Math.floor(b.pts.length * (0.25 + m * 0.17))]; b.br.push(fxJag(br[0], br[1], br[0] + fxR(-70, 70), br[1] + fxR(20, 70), 0.5, 3)); } }
        var a = (Math.random() < 0.75 ? 1 : 0.3) * (1 - u / 0.32); c.globalCompositeOperation = 'lighter'; fxBolt(c, b.pts, a, '191,219,254'); b.br.forEach(function (q) { fxBolt(c, q, a * 0.6, '165,180,252'); }); var tp = b.pts[b.pts.length - 1]; fxGlow(c, '224,231,255', tp[0], tp[1], 60, 0.6 * a); for (var m2 = 0; m2 < 8; m2++) { fxGlow(c, '224,231,255', tp[0] + Math.cos(m2 * 0.8 - 2.6) * u * 160, tp[1] - Math.abs(Math.sin(m2 * 0.8 - 2.6)) * u * 90 + u * u * 200, 2.6, a); } c.globalCompositeOperation = 'source-over'; });
      if (flash > 0) { c.globalAlpha = 0.4 * flash; c.fillStyle = '#E0E7FF'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1; }
      /* sunlight through the gap, with dust glittering in it */
      if (part > 0) { c.globalCompositeOperation = D ? 'lighter' : 'source-over'; for (i = 0; i < 9; i++) { var ang = Math.PI / 2 + (i - 4) * 0.11 + Math.sin(t + i) * 0.02; lkBeam(c, k.cx, -30, ang, k.y + 80, 0.04, D ? '253,224,138' : '251,191,36', (D ? 0.3 : 0.2) * part * e); } fxGlow(c, D ? '254,240,138' : '251,191,36', k.cx, 0, 170, (D ? 0.35 : 0.28) * part * e);
        c.globalCompositeOperation = D ? 'lighter' : 'source-over'; Mo.forEach(function (m) { var y = ((m.y + t * 0.05) % 1) * (k.y - 10), x = k.cx + m.x * (y + 40) * 1.2 + Math.sin(t + m.p) * 4; fxStar4(c, x, y, m.z * (0.5 + 0.5 * Math.sin(t * 3 + m.p)), part * e * 0.8, D ? '#FEF3C7' : '#F59E0B'); }); c.globalCompositeOperation = 'source-over'; }
      /* the rainbows, drawn from left to right: a bright one, and a fainter one outside it with its colors turned round */
      var rb = t > 2.1 ? Math.min(1, (t - 2.1) / 0.7) : 0, COL = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#6366F1', '#A855F7'];
      if (rb > 0) { var R = Math.max(k.w * 0.56, Math.sqrt(k.w * k.w / 4 + (k.h + 8) * (k.h + 8)) + 14), cy = k.y + k.h + 8; COL.forEach(function (col, n) { c.globalAlpha = 0.75 * e; c.strokeStyle = col; c.lineWidth = 5; c.beginPath(); c.arc(k.cx, cy, R + 30 - n * 5, Math.PI, Math.PI + Math.PI * rb); c.stroke(); c.globalAlpha = 0.25 * e; c.lineWidth = 3; c.beginPath(); c.arc(k.cx, cy, R + 52 + n * 3.4, Math.PI, Math.PI + Math.PI * Math.max(0, rb - 0.15) / 0.85); c.stroke(); }); c.globalAlpha = 1; }
      /* the clouds: rolling in from the top, flickering with lightning inside, then parting with bright edges */
      Cl.forEach(function (q) { var x = q.x * s.w + Math.sin(t * 0.8 + q.p) * 6, dx = x - k.cx, px = x + (dx >= 0 ? 1 : -1) * part * (s.w * 0.62), y = q.y * cb - (1 - inn) * 150 - part * 40, sh = Math.round(52 * q.sh + 46 * part + 60 * flash); c.globalAlpha = e * (1 - part * 0.85);
        var cg = c.createLinearGradient(0, y - q.r, 0, y + q.r); cg.addColorStop(0, 'rgb(' + (sh - 18) + ',' + (sh - 12) + ',' + sh + ')'); cg.addColorStop(1, 'rgb(' + (sh + 30) + ',' + (sh + 36) + ',' + (sh + 50) + ')'); c.fillStyle = cg; c.beginPath(); c.arc(px, y, q.r, 0, FX_TAU); c.arc(px + q.r * 0.7, y + q.r * 0.25, q.r * 0.7, 0, FX_TAU); c.arc(px - q.r * 0.7, y + q.r * 0.3, q.r * 0.6, 0, FX_TAU); c.fill();
        if (part > 0) { c.globalAlpha = e * part * (1 - part * 0.6); c.strokeStyle = 'rgba(255,250,235,.85)'; c.lineWidth = 2; c.beginPath(); c.arc(px, y, q.r - 1, dx >= 0 ? Math.PI * 0.55 : Math.PI * 0.05, dx >= 0 ? Math.PI * 0.95 : Math.PI * 0.45); c.stroke(); } });
      c.globalAlpha = 1;
      /* birds leave once it clears */
      if (part > 0.5) { c.strokeStyle = (D ? 'rgba(226,232,240,' : 'rgba(30,27,75,') + e + ')'; c.lineWidth = 1.6; Bd.forEach(function (b) { var u = t - 2.4; if (u < 0) { return; } var x = b.x + b.d * u * b.sp, y = b.y - u * 40, f = Math.sin(t * 14 + b.sp) * 4; c.beginPath(); c.moveTo(x - 7, y - f); c.quadraticCurveTo(x - 3, y - 3, x, y); c.quadraticCurveTo(x + 3, y - 3, x + 7, y - f); c.stroke(); }); }
      lkIn(c);
      /* drops on the answer's top edge sparkle in the new light */
      if (part > 0.3) { c.globalCompositeOperation = 'lighter'; for (i = 0; i < 9; i++) { var tw = Math.max(0, Math.sin(t * 5 + i * 2.1)); fxStar4(c, k.x + 14 + i * (k.w - 28) / 8, k.y - 2, 5 * tw, part * tw * e, '#FFFFFF'); } }
      c.restore();
      c.globalCompositeOperation = 'lighter'; fxCardGlow(c, k, part > 0 ? '253,224,71' : '147,197,253', e * 0.4 * (1 - part)); lkFinish(c, k, e * part, (t - 2.2) / 0.8, '251,191,36'); c.globalCompositeOperation = 'source-over';
    };
  };
  /* Anglerfish: the page sinks into the deep, marine snow drifting, jellyfish far off. A small light comes bobbing toward your
     answer and a school of little fish gathers round it; then two pale eyes open in the dark and the fish it belongs to shows
     itself, your answer held in its jaws. The school scatters, the jaws snap, the light flashes, and it sinks away in bubbles */
  FX_DRAW.angler = function (s, k) {
    var Sn = [], Sc = [], Bb = [], Jl = [], i, o1 = {};
    for (i = 0; i < 90; i++) { Sn.push({ x: Math.random(), y: Math.random(), z: fxR(0.6, 1.8), sp: fxR(0.01, 0.04), p: fxR(0, 6) }); }
    for (i = 0; i < 12; i++) { Sc.push({ a: fxR(0, FX_TAU), r: fxR(16, 34), sp: fxR(2, 3.4) * (i % 2 ? 1 : -1), p: fxR(0, 6), x: fxR(0, s.w), y: fxR(0, s.h), vx: 0, vy: 0, z: fxR(0.8, 1.2) }); }
    for (i = 0; i < 3; i++) { Jl.push({ x: fxR(0.1, 0.9), y: fxR(0.1, 0.9), ph: fxR(0, 6), z: fxR(14, 24) }); }
    return function (t, dt) {
      var c = s.ctx, e = fxEnv(t, 0, 0.35, 3.25, 3.7), rev = fxEase(Math.min(1, Math.max(0, (t - 1.3) / 0.5))) * (t > 2.95 ? Math.max(0, 1 - (t - 2.95) / 0.45) : 1), eyes = Math.min(1, Math.max(0, (t - 1.05) / 0.25)), j;
      var sink = t > 2.95 ? (t - 2.95) * 60 : 0, chomp = t > 2.25 && t < 2.6 ? Math.sin((t - 2.25) / 0.35 * Math.PI) : 0, gape = 1 + 0.04 * Math.sin(t * 3.4) - 0.12 * chomp;
      var mw = k.w / 2 + 24, mh = k.h / 2 + 26, hw = k.w / 2 + 66, hh = k.h / 2 + 106, HY = k.cy - 18 + sink, lu = fxEase(Math.min(1, Math.max(0, (t - 0.2) / 1.0)));
      var lx = -30 + (k.cx + k.w * 0.12 + 30) * lu + Math.sin(t * 2.3) * 8 * (1 - rev * 0.5), ly = k.y - 150 + 76 * lu + Math.sin(t * 3.1) * 6 + sink, fl = t > 2.65 && t < 3.0 ? Math.sin((t - 2.65) / 0.35 * Math.PI) : 0;
      fxDim(c, s, k, 0.95 * e, '#020617'); lkOut(c, s, k, 4);
      /* the deep: a glow from far above, jellyfish far off, marine snow */
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '14,116,144', s.w * 0.5, -s.h * 0.1, s.w * 0.7, 0.18 * e);
      Jl.forEach(function (q) { fxJelly(c, q.x * s.w + Math.sin(t * 0.4 + q.ph) * 14, q.y * s.h - t * 8, q.z, '103,232,249', '#CFFAFE', t, q.ph, 0.22 * e); });
      Sn.forEach(function (q) { fxGlow(c, '203,213,225', q.x * s.w + Math.sin(t * 0.6 + q.p) * 6, ((q.y + t * q.sp) % 1) * s.h, q.z * 1.4, 0.3 * e); });
      if (rev > 0) {
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = rev * e;
        /* fins, translucent with rays, beating slowly */
        [-1, 1].forEach(function (sd) { var fx = k.cx + sd * (hw - 6), fy = HY + hh * 0.18; c.fillStyle = 'rgba(30,58,95,.55)'; c.beginPath(); c.moveTo(fx, fy); for (j = 0; j <= 5; j++) { var a = sd > 0 ? -0.8 + j * 0.34 + Math.sin(t * 3 + j * 0.5) * 0.12 : Math.PI + 0.8 - j * 0.34 - Math.sin(t * 3 + j * 0.5) * 0.12; c.lineTo(fx + Math.cos(a) * (40 + (j % 2) * 8), fy + Math.sin(a) * (40 + (j % 2) * 8)); } c.closePath(); c.fill(); c.strokeStyle = 'rgba(56,189,248,.4)'; c.lineWidth = 1; for (j = 0; j <= 5; j++) { var a2 = sd > 0 ? -0.8 + j * 0.34 + Math.sin(t * 3 + j * 0.5) * 0.12 : Math.PI + 0.8 - j * 0.34 - Math.sin(t * 3 + j * 0.5) * 0.12; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + Math.cos(a2) * (40 + (j % 2) * 8), fy + Math.sin(a2) * (40 + (j % 2) * 8)); c.stroke(); } });
        /* the head: lumpy, lit from its own lure, spotted, with a jutting lower jaw */
        var hg = c.createRadialGradient(lx, ly, 4, k.cx, HY, Math.max(hw, hh) * 1.1); hg.addColorStop(0, '#2A5B78'); hg.addColorStop(0.35, '#10263A'); hg.addColorStop(1, '#040A15'); c.fillStyle = hg;
        c.beginPath(); for (j = 0; j <= 48; j++) { var an = j / 48 * FX_TAU, bump = 1 + 0.035 * Math.sin(an * 7 + 1) + 0.02 * Math.sin(an * 13); if (j) { c.lineTo(k.cx + Math.cos(an) * hw * gape * bump, HY + Math.sin(an) * hh * gape * bump); } else { c.moveTo(k.cx + Math.cos(an) * hw * gape * bump, HY + Math.sin(an) * hh * gape * bump); } } c.closePath(); c.fill(); c.strokeStyle = 'rgba(56,189,248,.35)'; c.lineWidth = 1.5; c.stroke();
        var jg = c.createLinearGradient(0, k.cy, 0, k.cy + mh + 60); jg.addColorStop(0, '#173350'); jg.addColorStop(1, '#040A15'); c.fillStyle = jg; c.beginPath(); c.ellipse(k.cx, k.cy + mh * 0.35 + chomp * -6, hw * 1.07 * gape, mh + 42, 0, 0, Math.PI); c.lineTo(k.cx - hw * 1.07 * gape, k.cy + mh * 0.35); c.fill(); c.stroke();
        c.fillStyle = 'rgba(2,6,23,.45)'; for (j = 0; j < 11; j++) { c.beginPath(); c.ellipse(k.cx + (fxRnd(j) - 0.5) * hw * 1.4, HY - hh * (0.3 + fxRnd(j + 9) * 0.5), 4 + fxRnd(j + 3) * 9, 3 + fxRnd(j + 5) * 5, fxRnd(j + 7) * 3, 0, FX_TAU); c.fill(); }
        /* the jaws, open around the answer: a black throat and glassy teeth */
        var top = k.cy - mh * gape, bot = k.cy + mh * gape; c.fillStyle = '#000000'; c.beginPath(); fxRR(c, k.cx - mw * gape, top, mw * 2 * gape, mh * 2 * gape, 28); c.fill(); c.strokeStyle = '#3B5470'; c.lineWidth = 3; c.stroke();
        var n = Math.max(8, Math.round(mw * 2 / 17)), tg = c.createLinearGradient(0, top, 0, top + 24); tg.addColorStop(0, 'rgba(226,232,240,.98)'); tg.addColorStop(1, 'rgba(148,163,184,.55)'); c.strokeStyle = 'rgba(148,163,184,.8)'; c.lineWidth = 0.6;
        for (j = 0; j < n; j++) { var tx = k.cx - mw + (j + 0.5) * mw * 2 / n, L = (12 + 10 * ((j * 7) % 3) / 2) * (0.85 + 0.15 * Math.sin(t * 4 + j)); c.fillStyle = tg; c.beginPath(); c.moveTo(tx - 3.5, top + 1); c.quadraticCurveTo(tx - 1, top + L * 0.6, tx + 1.5, top + L); c.lineTo(tx + 3.5, top + 1); c.fill(); c.stroke();
          var L2 = (10 + 9 * ((j * 5) % 3) / 2) * (0.85 + 0.15 * Math.sin(t * 4 + j + 2)), bx = tx + mw / n; if (bx < k.cx + mw - 6) { c.fillStyle = 'rgba(203,213,225,.9)'; c.beginPath(); c.moveTo(bx - 3.5, bot - 1); c.quadraticCurveTo(bx - 1, bot - L2 * 0.6, bx + 1.5, bot - L2); c.lineTo(bx + 3.5, bot - 1); c.fill(); c.stroke(); } }
        c.fillStyle = 'rgba(226,232,240,.9)'; [-1, 1].forEach(function (sd) { for (j = 0; j < 2; j++) { var sy = k.cy - 10 + j * 20, sx = k.cx + sd * mw * gape; c.beginPath(); c.moveTo(sx, sy - 3); c.lineTo(sx - sd * 15, sy + 1); c.lineTo(sx, sy + 4); c.fill(); } });
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1;
        for (j = 0; j < 16; j++) { var a3 = Math.PI * (1.1 + j * 0.05), wv = 0.5 + 0.5 * Math.sin(t * 5 - j * 0.6); fxGlow(c, '45,212,191', k.cx + Math.cos(a3) * hw * 0.86, HY + Math.sin(a3) * hh * 0.86, 4 + 2 * wv, (0.25 + 0.6 * wv) * rev * e); }
      }
      /* two pale eyes open in the dark before the rest is seen, and glow back at the light */
      c.globalAlpha = 1; if (eyes > 0) { [-1, 1].forEach(function (sd) { var ex = k.cx + sd * (mw - 34), ey = k.cy - mh * gape - 30, er = 7.5; c.globalCompositeOperation = 'source-over'; c.globalAlpha = eyes * e * (t > 2.95 ? rev : 1); c.fillStyle = '#CBD5E1'; c.beginPath(); c.ellipse(ex, ey, er, er * Math.min(1, eyes * 1.4), 0, 0, FX_TAU); c.fill(); c.fillStyle = '#020617'; c.beginPath(); c.arc(ex + (lx - ex) * 0.015, ey + 1, 2.6, 0, FX_TAU); c.fill(); c.strokeStyle = '#64748B'; c.lineWidth = 1.2; c.beginPath(); c.arc(ex, ey, er + 1.5, 0, FX_TAU); c.stroke(); c.globalCompositeOperation = 'lighter'; fxGlow(c, '103,232,249', ex, ey, 14, 0.35 * eyes * e); }); c.globalAlpha = 1; }
      /* the stalk and its light, and the little fish drawn to it, until they scatter */
      var ax = rev > 0 ? -60 + (k.cx - 4 + 60) * rev : -60, ay = rev > 0 ? k.y - 300 + (HY - hh * gape + 6 - k.y + 300) * rev : k.y - 300;
      c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'rgba(71,85,105,' + 0.9 * e + ')'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo((ax + lx) / 2 + 30, Math.min(ay, ly) - 50, lx, ly - 7); c.stroke();
      var scatter = t > 1.4 ? Math.min(1, (t - 1.4) / 0.3) : 0;
      Sc.forEach(function (f) { var tx2, ty2; if (!scatter) { f.a += f.sp * dt; tx2 = lx + Math.cos(f.a) * f.r; ty2 = ly + Math.sin(f.a) * f.r * 0.6; f.vx = (tx2 - f.x) * 4; f.vy = (ty2 - f.y) * 4; } else if (!f.fled) { f.fled = 1; var fa = Math.atan2(f.y - ly, f.x - lx); f.vx = Math.cos(fa) * fxR(260, 420); f.vy = Math.sin(fa) * fxR(260, 420); }
        f.x += f.vx * dt; f.y += f.vy * dt; var hd = Math.atan2(f.vy, f.vx), z = 5 * f.z; c.save(); c.translate(f.x, f.y); c.rotate(hd); c.globalAlpha = e * 0.9; c.fillStyle = '#CBD5E1'; c.beginPath(); c.ellipse(0, 0, z, z * 0.38, 0, 0, FX_TAU); c.fill(); c.beginPath(); c.moveTo(-z * 0.8, 0); c.lineTo(-z * 1.5, -z * 0.5); c.lineTo(-z * 1.5, z * 0.5); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(-z * 0.4, -z * 0.12, z, z * 0.12); c.restore(); });
      c.globalAlpha = 1; c.globalCompositeOperation = 'lighter';
      for (j = 0; j < 6; j++) { var ra = t * 0.8 + j / 6 * FX_TAU; lkBeam(c, lx, ly, ra, 60, 0.05, '103,232,249', 0.1 * e); }
      fxGlow(c, '103,232,249', lx, ly, 46 + 14 * Math.sin(t * 5), 0.6 * e); fxGlow(c, '236,254,255', lx, ly, 9, e); fxGlow(c, '103,232,249', lx, ly, 280 * fl, 0.75 * fl);
      /* bubbles as it sinks away */
      if (t > 2.95) { lkEvery(o1, 40, dt, function () { Bb.push({ x: k.cx + fxR(-hw, hw), y: HY + fxR(-hh * 0.5, hh * 0.5), vx: fxR(-8, 8), vy: fxR(-120, -60), l: 0, m: fxR(0.5, 1) }); }); }
      c.globalCompositeOperation = 'source-over'; lkStep(Bb, dt, -40, 0, function (b, f) { c.strokeStyle = 'rgba(186,230,253,' + 0.7 * f * e + ')'; c.lineWidth = 1; c.beginPath(); c.arc(b.x + Math.sin(t * 9 + b.m * 9) * 2, b.y, 2 + (1 - f) * 2, 0, FX_TAU); c.stroke(); });
      lkIn(c);
      c.globalCompositeOperation = 'lighter'; fxCardGlow(c, k, '103,232,249', e * Math.min(1, rev + fl) * 0.8); lkFinish(c, k, fxEnv(t, 2.8, 3.0, 3.3, 3.7), (t - 2.85) / 0.7, '103,232,249'); c.globalCompositeOperation = 'source-over';
    };
  };
  /* Threshold: two great carved doors swing shut across the screen and slam, your answer set into them in a ring of gold; dust
     falls. The runes of the seal light one by one and arc to each other, its rings turn, cracks of light spread from the seam;
     the chains snap, and the doors swing open on a hall of light with pillars, rays and feathers drifting down */
  FX_DRAW.threshold = function (s, k) {
    var Mo = [], Fly = [], Du = [], Fe = [], Sk = [], Cr = [], snapped = false, slammed = false, i, o1 = {};
    for (i = 0; i < 70; i++) { Mo.push({ x: Math.random(), u: Math.random(), sp: fxR(0.12, 0.35), z: fxR(1.5, 3.5) }); }
    for (i = 0; i < 220; i++) { Sk.push([Math.random(), Math.random(), fxR(0.6, 1.6), Math.random() < 0.5]); }
    for (i = 0; i < 10; i++) { var sd0 = i % 2 ? 1 : -1; Cr.push({ y: fxR(0.04, 0.96), sd: sd0, pts: fxJag(0, 0, sd0 * fxR(70, 190), fxR(-70, 70), 0.55, 4), at: fxR(1.3, 2.1) }); }
    return function (t, dt) {
      var c = s.ctx, e = fxEnv(t, 0, 0.05, 3.95, 4.7), j;
      var close = t < 0.5 ? Math.sin(Math.min(1, t / 0.42) * Math.PI / 2) : 1, open = t > 2.5 ? fxEase(Math.min(1, (t - 2.5) / 0.85)) : 0, slam = t > 0.42 && t < 0.9 ? 1 - (t - 0.42) / 0.48 : 0;
      var seam = k.cx, R = Math.min(84, s.w * 0.21), up = k.y - R * 2 - 46 > 0, sy = up ? k.y - R - 30 : k.y + k.h + R + 30, lit = Math.max(0, Math.min(12, Math.floor((t - 0.9) / 0.1))), glow = Math.max(0, Math.min(1, (t - 1.35) / 1.15)) * (1 - open);
      var jx = slam * fxR(-7, 7), jy = slam * fxR(-5, 5);
      if (t > 0.42 && !slammed) { slammed = true; for (j = 0; j < 50; j++) { Du.push({ x: Math.random() * s.w, y: fxR(-10, 30), vx: fxR(-10, 10), vy: fxR(0, 60), l: 0, m: fxR(0.8, 1.6), g: 1 }); } for (j = 0; j < 16; j++) { Du.push({ x: seam + fxR(-30, 30), y: s.h - 6, vx: fxR(-120, 120), vy: fxR(-40, -5), l: 0, m: fxR(0.5, 1), g: 0 }); } }
      lkOut(c, s, k, 3);
      /* the hall of light behind the doors: pillars, a glowing floor, rays, motes and feathers */
      if (open > 0) {
        var la = Math.min(1, open * 1.5) * e, lg = c.createRadialGradient(k.cx, k.cy, 10, k.cx, k.cy, Math.max(s.w, s.h) * 0.8); lg.addColorStop(0, 'rgba(255,255,255,' + la + ')'); lg.addColorStop(0.4, 'rgba(254,243,199,' + 0.94 * la + ')'); lg.addColorStop(1, 'rgba(251,191,36,' + 0.8 * la + ')'); c.fillStyle = lg; c.fillRect(0, 0, s.w, s.h);
        for (j = 1; j <= 4; j++) { [-1, 1].forEach(function (sd) { var px = k.cx + sd * (30 + j * j * 16 + 20 * open), pw = 10 + j * 7, pg = c.createLinearGradient(px - pw / 2, 0, px + pw / 2, 0); pg.addColorStop(0, 'rgba(251,191,36,' + 0.35 * la / j + ')'); pg.addColorStop(0.5, 'rgba(255,255,255,' + 0.6 * la / j + ')'); pg.addColorStop(1, 'rgba(251,191,36,' + 0.35 * la / j + ')'); c.fillStyle = pg; c.fillRect(px - pw / 2, 0, pw, s.h); }); }
        c.globalCompositeOperation = 'lighter'; for (j = 0; j < 16; j++) { lkBeam(c, k.cx, k.cy, t * 0.3 + j / 16 * FX_TAU, Math.max(s.w, s.h), 0.05, '255,255,255', 0.3 * la); }
        Mo.forEach(function (q) { q.u = (q.u + dt * q.sp) % 1; fxGlow(c, '253,224,71', q.x * s.w, s.h - q.u * s.h, q.z * 2, Math.sin(q.u * Math.PI) * la); });
        lkEvery(o1, 7 * open, dt, function () { Fe.push({ x: Math.random() * s.w, y: -20, vx: fxR(-20, 20), vy: fxR(30, 60), l: 0, m: 4, r: fxR(0, 6), p: fxR(0, 6) }); });
        c.globalCompositeOperation = 'source-over'; lkStep(Fe, dt, 0, 0, function (f) { f.vx = Math.sin(t * 2 + f.p) * 40; c.save(); c.translate(f.x, f.y); c.rotate(Math.sin(t * 2 + f.p) * 0.8 + f.r); c.globalAlpha = la * 0.9; c.fillStyle = '#FFFBEB'; c.beginPath(); c.moveTo(0, -9); c.quadraticCurveTo(4.5, -2, 0, 9); c.quadraticCurveTo(-4.5, -2, 0, -9); c.fill(); c.strokeStyle = 'rgba(180,140,60,.6)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(0, -9); c.lineTo(0, 11); c.stroke(); c.restore(); }); c.globalAlpha = 1;
      }
      lkIn(c); lkOut(c, s, k, 8); c.save(); c.translate(jx, jy);
      /* a door, swung about its hinge on the outer edge (sx is how far it is closed), with its half of the seal, cracks and chains */
      function door(hinge, w, sd, sx) {
        if (sx <= 0.01) { return; } var x0 = sd < 0 ? hinge : hinge - w * sx, x1 = x0 + w * sx; c.save(); c.beginPath(); c.rect(x0, -20, w * sx, s.h + 40); c.clip(); c.translate(hinge, 0); c.scale(sx, 1); c.translate(-hinge, 0); var dx = sd < 0 ? 0 : hinge - w;
        var g = c.createLinearGradient(dx, 0, dx + w, 0); g.addColorStop(sd < 0 ? 0 : 1, '#1C1917'); g.addColorStop(sd < 0 ? 1 : 0, '#5C5550'); c.fillStyle = g; c.fillRect(dx, -20, w, s.h + 40);
        Sk.forEach(function (q) { if (q[3] !== (sd < 0)) { return; } c.fillStyle = q[2] > 1.2 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.22)'; c.fillRect(dx + q[0] * w, q[1] * s.h, q[2], q[2]); });
        /* a carved arch, nested, and a sun in it */
        var ax = dx + w / 2, aw = w * 0.32, at = s.h * 0.08, ab = s.h * 0.92; for (j = 0; j < 3; j++) { var inset = j * 9; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(ax - aw + inset, ab); c.lineTo(ax - aw + inset, at + aw); c.arc(ax, at + aw, aw - inset, Math.PI, 0); c.lineTo(ax + aw - inset, ab); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1; c.beginPath(); c.moveTo(ax - aw + inset + 2, ab); c.lineTo(ax - aw + inset + 2, at + aw); c.arc(ax, at + aw, aw - inset - 2, Math.PI, 0); c.stroke(); }
        c.strokeStyle = 'rgba(161,98,7,.55)'; c.lineWidth = 1.5; c.beginPath(); c.arc(ax, at + aw, aw * 0.35, 0, FX_TAU); c.stroke(); for (j = 0; j < 12; j++) { var ra = j / 12 * FX_TAU; c.beginPath(); c.moveTo(ax + Math.cos(ra) * aw * 0.42, at + aw + Math.sin(ra) * aw * 0.42); c.lineTo(ax + Math.cos(ra) * aw * 0.6, at + aw + Math.sin(ra) * aw * 0.6); c.stroke(); }
        /* a column of runes near the hinge, faintly lit; hinges and studs */
        var rx = sd < 0 ? dx + 10 : dx + w - 10; for (j = 0; j < 9; j++) { var on = (j + Math.floor(t * 3)) % 9 < lit * 0.75; fxRune(c, rx, s.h * (0.12 + j * 0.09), 8, j * 3 + (sd < 0 ? 1 : 5), on ? 'rgba(254,243,199,.9)' : 'rgba(120,113,108,.6)'); }
        c.fillStyle = '#18181B'; [0.15, 0.5, 0.85].forEach(function (hy) { c.fillRect(sd < 0 ? dx : dx + w - 34, s.h * hy - 7, 34, 14); c.fillStyle = '#52525B'; [8, 20, 30].forEach(function (bx) { c.beginPath(); c.arc(sd < 0 ? dx + bx : dx + w - bx, s.h * hy, 2, 0, FX_TAU); c.fill(); }); c.fillStyle = '#18181B'; });
        var gb = c.createLinearGradient(0, 0, 0, s.h); gb.addColorStop(0, '#FDE68A'); gb.addColorStop(0.5, '#A16207'); gb.addColorStop(1, '#FDE68A'); c.fillStyle = gb; c.fillRect(sd < 0 ? dx + w - 7 : dx, -20, 7, s.h + 40);
        var ox = sd < 0 ? dx + w - seam : dx - seam; c.save(); c.translate(ox, 0);
        /* the seal: two rings turning against each other, twelve runes that light in turn and arc to each other */
        c.fillStyle = '#292524'; c.beginPath(); c.arc(seam, sy, R, 0, FX_TAU); c.fill(); c.strokeStyle = '#A16207'; c.lineWidth = 3; c.stroke();
        c.save(); c.translate(seam, sy); c.rotate(t * 0.4); c.strokeStyle = '#CA8A04'; c.lineWidth = 1.2; for (j = 0; j < 36; j++) { var ta = j / 36 * FX_TAU; c.beginPath(); c.moveTo(Math.cos(ta) * R * 0.93, Math.sin(ta) * R * 0.93); c.lineTo(Math.cos(ta) * R * (j % 3 ? 0.97 : 1), Math.sin(ta) * R * (j % 3 ? 0.97 : 1)); c.stroke(); } c.rotate(-t * 0.9); c.beginPath(); c.arc(0, 0, R * 0.62, 0, FX_TAU); c.stroke(); for (j = 0; j < 8; j++) { var ta2 = j / 8 * FX_TAU; c.beginPath(); c.arc(Math.cos(ta2) * R * 0.62, Math.sin(ta2) * R * 0.62, 2.5, 0, FX_TAU); c.stroke(); } c.restore();
        for (j = 0; j < 12; j++) { var a = j / 12 * FX_TAU - Math.PI / 2, on2 = j < lit, rx2 = seam + Math.cos(a) * R * 0.8, ry2 = sy + Math.sin(a) * R * 0.8; if (on2) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', rx2, ry2, 15, 0.7 * e); if (j > 0 && j < lit && Math.random() < 0.6) { var pa = (j - 1) / 12 * FX_TAU - Math.PI / 2; fxBolt(c, fxJag(seam + Math.cos(pa) * R * 0.8, sy + Math.sin(pa) * R * 0.8, rx2, ry2, 0.6, 2), 0.6, '253,224,71'); } c.globalCompositeOperation = 'source-over'; } fxRune(c, rx2, ry2 + 4, R * 0.13, j, on2 ? '#FEF3C7' : '#78716C'); }
        c.save(); c.translate(seam, sy); c.rotate(Math.PI / 8 + t * 0.2 * (lit >= 12 ? 3 : 0)); fxStar4(c, 0, 0, R * 0.5, 1, lit >= 12 ? '#FBBF24' : '#57534E'); c.rotate(Math.PI / 4); fxStar4(c, 0, 0, R * 0.36, 1, lit >= 12 ? '#FEF3C7' : '#78716C'); c.restore();
        if (lit >= 12) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', seam, sy, R * 1.2, 0.35 * e * (1 - open)); c.globalCompositeOperation = 'source-over'; }
        /* cracks of light spreading from the seam */
        Cr.forEach(function (q) { if (q.sd !== sd) { return; } var g2 = Math.max(0, Math.min(1, (t - q.at) / 0.8)) * (1 - open); if (g2 <= 0) { return; } var P = q.pts, nP = Math.max(2, Math.floor(P.length * g2)); c.globalCompositeOperation = 'lighter'; fxBolt(c, P.slice(0, nP).map(function (p) { return [seam + p[0], q.y * s.h + p[1]]; }), 0.7 * g2, '253,224,71'); c.globalCompositeOperation = 'source-over'; });
        /* the chains, sagging across the doors in an X through the seal */
        if (t < 2.25) { [[-1, -1], [-1, 1]].forEach(function (d0) { var x1 = seam + d0[0] * s.w, y1 = sy + d0[1] * s.w * 0.9, x2 = seam - d0[0] * s.w, y2 = sy - d0[1] * s.w * 0.9, L = Math.hypot(x2 - x1, y2 - y1), an = Math.atan2(y2 - y1, x2 - x1), nl = Math.floor(L / 13); for (var m = 0; m < nl; m++) { var u2 = m / nl, sag = Math.sin(u2 * Math.PI) * 18, px = x1 + Math.cos(an) * m * 13, py2 = y1 + Math.sin(an) * m * 13 + sag; c.save(); c.translate(px, py2); c.rotate(an + Math.cos(u2 * Math.PI) * 0.2); var cg = c.createLinearGradient(0, -5, 0, 5); cg.addColorStop(0, '#E7E5E4'); cg.addColorStop(1, '#78716C'); c.strokeStyle = cg; c.lineWidth = m % 2 ? 2.6 : 2.2; c.beginPath(); c.ellipse(0, 0, 8, m % 2 ? 1.7 : 4.6, 0, 0, FX_TAU); c.stroke(); c.restore(); } }); }
        c.restore(); c.restore();
        if (sx < 1) { c.globalAlpha = (1 - sx) * 0.7; c.fillStyle = '#000000'; c.fillRect(x0, -20, x1 - x0, s.h + 40); c.globalAlpha = 1; }
      }
      door(0, seam, -1, close * (1 - open)); door(s.w, s.w - seam, 1, close * (1 - open));
      c.restore();
      /* the answer's ring of gold while the doors are shut */
      if (open < 1 && close > 0.9) { c.globalAlpha = 1 - open; var rg = c.createLinearGradient(k.x, 0, k.x + k.w, 0); rg.addColorStop(0, '#A16207'); rg.addColorStop(0.5, '#FDE68A'); rg.addColorStop(1, '#A16207'); c.strokeStyle = rg; c.lineWidth = 5; c.beginPath(); fxRR(c, k.x - 8 + jx, k.y - 8 + jy, k.w + 16, k.h + 16, 18); c.stroke(); c.globalAlpha = 1; }
      lkIn(c); lkOut(c, s, k, 3);
      c.globalCompositeOperation = 'lighter';
      /* light through the seam, dust from the slam, links and sparks when the chains go */
      if (glow > 0 && close >= 1) { var sg = c.createLinearGradient(seam - 16, 0, seam + 16, 0); sg.addColorStop(0, 'rgba(253,224,71,0)'); sg.addColorStop(0.5, 'rgba(255,251,235,' + 0.95 * glow + ')'); sg.addColorStop(1, 'rgba(253,224,71,0)'); c.fillStyle = sg; c.fillRect(seam - 16, 0, 32, s.h); for (j = 0; j < 6; j++) { lkBeam(c, seam, s.h * (0.1 + j * 0.16), j % 2 ? 0 : Math.PI, 80 * glow, 0.06, '253,224,71', 0.25 * glow); } }
      c.globalCompositeOperation = 'source-over'; lkStep(Du, dt, 120, 0.4, function (q, f) { c.fillStyle = q.g ? 'rgba(168,162,158,' + 0.8 * f + ')' : 'rgba(168,162,158,' + 0.3 * f + ')'; if (q.g) { c.fillRect(q.x, q.y, 1.6, 1.6); } else { c.beginPath(); c.arc(q.x, q.y, 8 + (1 - f) * 14, 0, FX_TAU); c.fill(); } });
      if (t > 2.25 && !snapped) { snapped = true; for (j = 0; j < 30; j++) { var aa = fxR(0, FX_TAU), v = fxR(80, 340); Fly.push({ x: seam, y: sy, vx: Math.cos(aa) * v, vy: Math.sin(aa) * v - 80, l: 0, m: 1.3, r: fxR(0, 6), sp: j % 3 === 0 }); } }
      lkStep(Fly, dt, 500, 0, function (q, f) { q.r += dt * 9; if (q.sp) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,186,116', q.x, q.y, 3, f); c.globalCompositeOperation = 'source-over'; return; } c.globalAlpha = f * e; c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.strokeStyle = '#D6D3D1'; c.lineWidth = 2.2; c.beginPath(); c.ellipse(0, 0, 7, 4, 0, 0, FX_TAU); c.stroke(); c.restore(); c.globalAlpha = 1; });
      lkIn(c);
      c.globalCompositeOperation = 'lighter'; fxCardGlow(c, k, '253,224,71', e * (0.4 + 0.5 * glow) * (1 - open)); lkFinish(c, k, open * e, (t - 2.7) / 0.8, '251,191,36'); c.globalCompositeOperation = 'source-over';
    };
  };

  /* ---------- moving paper: behind the whole page, on light pages and dark ones (FX_INK.dark) ---------- */
  /* Honeycomb: bevelled wax cells, some filling with honey and draining, some capped with wax, honey dripping from an edge. Bees
     fly over it, land on a cell, crawl about and take off again, and now and then one does its waggle dance; a sunbeam drifts
     across and pollen floats in it */
  FX_PAPER.honeycomb = function (s) {
    var Be = [], Po = [], Dp = [], i, nextDrip = 2, R = 26;
    for (i = 0; i < 6; i++) { Be.push({ x: Math.random(), y: Math.random(), a: fxR(0, FX_TAU), sp: fxR(40, 64), ph: fxR(0, 6), tr: [], tt: 0, st: 0, sw: fxR(2, 5), dance: i === 0 }); }
    for (i = 0; i < 30; i++) { Po.push({ x: Math.random(), y: Math.random(), p: fxR(0, 6), z: fxR(0.8, 2) }); }
    function hex(c, x, y, r) { for (var j = 0; j < 6; j++) { var a = j * Math.PI / 3; if (j) { c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } else { c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } } c.closePath(); }
    function cell(i2, j) { return [i2 * R * 1.5, j * R * Math.sqrt(3) + (((i2 % 2) + 2) % 2 ? R * Math.sqrt(3) / 2 : 0)]; }
    return function (t, dt) {
      var c = s.ctx, D = FX_INK.dark, hy = R * Math.sqrt(3), cols = Math.ceil(s.w / (R * 1.5)) + 2, rows = Math.ceil(s.h / hy) + 2, i2, j, sx = ((t * 14) % (s.w + 800)) - 400;
      /* a sunbeam drifting across */
      c.globalCompositeOperation = D ? 'lighter' : 'source-over'; fxGlow(c, D ? '251,191,36' : '253,224,71', sx, s.h * 0.4, 320, D ? 0.08 : 0.16); c.globalCompositeOperation = 'source-over';
      /* the comb: each cell bevelled, some filling with honey, some capped */
      for (i2 = -1; i2 < cols; i2++) { for (j = -1; j < rows; j++) {
        var p = cell(i2, j), r0 = fxRnd(i2 * 31 + j * 7 + 3), x = p[0], y = p[1];
        c.strokeStyle = D ? 'rgba(251,191,36,.16)' : 'rgba(180,120,20,.2)'; c.lineWidth = 1.4; c.beginPath(); hex(c, x, y, R - 2); c.stroke();
        c.strokeStyle = D ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.7)'; c.lineWidth = 1; c.beginPath(); hex(c, x, y, R - 5); c.stroke();
        if (r0 > 0.93) { c.fillStyle = D ? 'rgba(253,230,138,.12)' : 'rgba(253,230,138,.45)'; c.beginPath(); hex(c, x, y, R - 4); c.fill(); c.fillStyle = 'rgba(255,255,255,' + (D ? 0.08 : 0.5) + ')'; c.beginPath(); c.ellipse(x - R * 0.25, y - R * 0.3, R * 0.3, R * 0.12, -0.4, 0, FX_TAU); c.fill(); continue; }
        if (r0 < 0.84) { continue; }
        var lv = Math.max(0, Math.min(1, Math.sin(t * 0.12 + r0 * 40) * 1.3 - 0.1)); if (lv <= 0) { continue; }
        c.save(); c.beginPath(); hex(c, x, y, R - 3.5); c.clip(); var hg = c.createLinearGradient(0, y + R - lv * R * 2, 0, y + R); hg.addColorStop(0, D ? 'rgba(251,191,36,.28)' : 'rgba(251,191,36,.26)'); hg.addColorStop(1, D ? 'rgba(180,83,9,.32)' : 'rgba(217,119,6,.3)'); c.fillStyle = hg; c.fillRect(x - R, y + R - lv * R * 2, R * 2, lv * R * 2);
        c.fillStyle = 'rgba(255,251,235,' + (D ? 0.35 : 0.75) + ')'; c.beginPath(); c.ellipse(x - R * 0.3, y + R - lv * R * 2 + 4, 6, 1.6, 0, 0, FX_TAU); c.fill(); c.restore();
      } }
      /* honey drips from an edge, stretches, and falls */
      if (t > nextDrip || t < nextDrip - 20) { nextDrip = t + fxR(3, 6); var q0 = cell(Math.floor(Math.random() * (cols - 2)), Math.floor(Math.random() * (rows - 2))); Dp.push({ x: q0[0], y: q0[1] + (R - 3) * Math.sqrt(3) / 2, len: 0, fall: 0, v: 0, l: 0 }); }
      for (i = Dp.length - 1; i >= 0; i--) { var d = Dp[i]; d.l += dt; if (!d.fall) { d.len = Math.min(26, d.len + dt * 10); if (d.len >= 26) { d.fall = d.y + d.len; } } else { d.v += 700 * dt; d.fall += d.v * dt; if (d.fall > s.h + 20) { Dp.splice(i, 1); continue; } }
        c.fillStyle = D ? 'rgba(251,191,36,.6)' : 'rgba(217,119,6,.7)'; if (!d.fall) { c.beginPath(); c.moveTo(d.x - 3, d.y); c.quadraticCurveTo(d.x - 1, d.y + d.len * 0.7, d.x - 3, d.y + d.len); c.arc(d.x, d.y + d.len, 3, Math.PI, 0, true); c.quadraticCurveTo(d.x + 1, d.y + d.len * 0.7, d.x + 3, d.y); c.fill(); } else { c.beginPath(); c.ellipse(d.x, d.fall, 3, 4.5, 0, 0, FX_TAU); c.fill(); } }
      /* pollen in the light */
      Po.forEach(function (q) { var x = (q.x * s.w + Math.sin(t * 0.3 + q.p) * 20), y = ((q.y * s.h - t * 6 * q.z) % s.h + s.h) % s.h, near = Math.max(0, 1 - Math.abs(x - sx) / 360); c.fillStyle = 'rgba(234,179,8,' + (0.15 + 0.5 * near) + ')'; c.beginPath(); c.arc(x, y, q.z, 0, FX_TAU); c.fill(); });
      /* the bees: fly, land on a cell and crawl, take off; one dances */
      Be.forEach(function (b) {
        b.sw -= dt; if (b.sw < 0) { b.st = b.st ? 0 : 1; b.sw = b.st ? fxR(1.8, 3.5) : fxR(3, 6); if (b.st) { var q1 = cell(Math.floor(b.x * s.w / (R * 1.5)), Math.floor(b.y * s.h / hy)); b.lx = q1[0]; b.ly = q1[1]; } }
        var x, y, ang, fly = !b.st;
        if (fly) { b.a += (Math.sin(t * 0.9 + b.ph) * 1.6 + Math.sin(t * 2.3 + b.ph * 2) * 0.8) * dt; b.x += Math.cos(b.a) * b.sp * dt / s.w; b.y += Math.sin(b.a) * b.sp * dt / s.h; if (b.x < -0.05) { b.x = 1.05; b.tr = []; } if (b.x > 1.05) { b.x = -0.05; b.tr = []; } if (b.y < -0.05) { b.y = 1.05; b.tr = []; } if (b.y > 1.05) { b.y = -0.05; b.tr = []; } x = b.x * s.w; y = b.y * s.h; ang = b.a; }
        else if (b.dance) { var u = t * 2.2 + b.ph, e8 = Math.sin(u), wg = Math.sin(t * 40) * 2; x = b.lx + e8 * 16 + (Math.abs(e8) < 0.3 ? wg : 0); y = b.ly + Math.sin(u * 2) * 8; ang = Math.atan2(Math.cos(u * 2) * 16, Math.cos(u) * 16); b.x = x / s.w; b.y = y / s.h; c.strokeStyle = D ? 'rgba(253,230,138,.3)' : 'rgba(180,83,9,.3)'; c.lineWidth = 1; for (var m = 0; m < 3; m++) { c.beginPath(); c.arc(b.lx, b.ly, 18 + m * 7 + ((t * 20) % 7), 0, FX_TAU); c.stroke(); } }
        else { b.a += Math.sin(t * 1.3 + b.ph) * 2 * dt; x = b.lx + Math.cos(t * 0.8 + b.ph) * 7; y = b.ly + Math.sin(t * 1.1 + b.ph) * 5; ang = t * 0.8 + b.ph + Math.PI / 2; b.x = x / s.w; b.y = y / s.h; }
        b.tt += dt; if (fly && b.tt > 0.12) { b.tt = 0; b.tr.push([x, y]); if (b.tr.length > 26) { b.tr.shift(); } } if (!fly) { b.tr = []; }
        c.fillStyle = D ? 'rgba(253,230,138,.35)' : 'rgba(120,83,12,.3)'; b.tr.forEach(function (p2, n) { if (n % 2) { c.beginPath(); c.arc(p2[0], p2[1], 1.2, 0, FX_TAU); c.fill(); } });
        c.save(); c.translate(x, y); c.rotate(ang); var fl = fly || b.dance ? Math.abs(Math.sin(t * 38 + b.ph)) : 0.15;
        c.fillStyle = 'rgba(0,0,0,' + (D ? 0.3 : 0.12) + ')'; c.beginPath(); c.ellipse(3, 5, 6, 3.4, 0, 0, FX_TAU); c.fill();
        c.fillStyle = D ? 'rgba(255,255,255,.4)' : 'rgba(186,230,253,.75)'; c.strokeStyle = D ? 'rgba(255,255,255,.4)' : 'rgba(71,85,105,.5)'; c.lineWidth = 0.6; [-1, 1].forEach(function (sd) { c.beginPath(); c.ellipse(-1, sd * 4.5 * (0.5 + fl * 0.5), 4.8, 2.4 * (0.4 + fl * 0.6), sd * 0.4, 0, FX_TAU); c.fill(); c.stroke(); });
        var bg = c.createLinearGradient(0, -4, 0, 4); bg.addColorStop(0, '#FDE047'); bg.addColorStop(1, '#CA8A04'); c.fillStyle = bg; c.beginPath(); c.ellipse(0, 0, 6.2, 3.9, 0, 0, FX_TAU); c.fill(); c.fillStyle = '#1C1917'; c.fillRect(-2.8, -3.6, 1.7, 7.2); c.fillRect(0.6, -3.8, 1.7, 7.6); c.beginPath(); c.arc(5.8, 0, 2.5, 0, FX_TAU); c.fill(); c.strokeStyle = '#1C1917'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(7.5, -1); c.lineTo(10, -3); c.moveTo(7.5, 1); c.lineTo(10, 3); c.stroke(); c.lineWidth = 1; c.beginPath(); c.moveTo(-6, 0); c.lineTo(-8.5, 0); c.stroke();
        c.restore();
      });
    };
  };
  /* Kites: kites of every kind on the wind: a diamond, a delta, a box kite turning, and a long dragon kite whose body waves across
     the sky. Their tails of bows flutter, their strings run off the page, clouds drift past at two depths, and every few seconds
     a gust sweeps through and they all lurch together */
  FX_PAPER.kites = function (s) {
    var K = [], Cl = [], i, PAL = [['#F43F5E', '#FDE047'], ['#38BDF8', '#F472B6'], ['#22C55E', '#FB923C'], ['#A78BFA', '#FACC15']], Tails = [], Dr = [];
    for (i = 0; i < 4; i++) { K.push({ x: (i + 0.5) / 4 + fxR(-0.05, 0.05), y: fxR(0.1, 0.42), z: fxR(0.8, 1.15), ph: fxR(0, 6), c: PAL[i], sh: i }); Tails.push([]); }
    for (i = 0; i < 7; i++) { Cl.push({ x: Math.random(), y: fxR(0.05, 0.7), r: fxR(40, 90), sp: fxR(4, 12), far: i % 2 }); }
    for (i = 0; i < 18; i++) { Dr.push([0, 0]); }
    return function (t, dt) {
      var c = s.ctx, D = FX_INK.dark, al = D ? 0.58 : 0.5, ink = D ? '226,232,240' : '51,65,85', gc = t % 9, gust = gc < 1.6 ? Math.sin(gc / 1.6 * Math.PI) : 0, sc = Math.min(1.25, Math.max(0.95, s.w / 700)), j;
      /* clouds at two depths */
      Cl.forEach(function (q) { var x = ((q.x * (s.w + 300) + t * q.sp * (q.far ? 0.5 : 1) + gust * 30) % (s.w + 300)) - 150, y = q.y * s.h, a = q.far ? 0.5 : 1; c.fillStyle = D ? 'rgba(148,163,184,' + 0.06 * a + ')' : 'rgba(186,230,253,' + 0.3 * a + ')'; c.beginPath(); c.arc(x, y, q.r * 0.6, 0, FX_TAU); c.arc(x + q.r * 0.6, y + q.r * 0.15, q.r * 0.45, 0, FX_TAU); c.arc(x - q.r * 0.6, y + q.r * 0.18, q.r * 0.4, 0, FX_TAU); c.fill(); if (!D) { c.fillStyle = 'rgba(255,255,255,' + 0.6 * a + ')'; c.beginPath(); c.arc(x - q.r * 0.1, y - q.r * 0.1, q.r * 0.45, 0, FX_TAU); c.fill(); } });
      /* the gust: streaks of wind */
      if (gust > 0) { c.strokeStyle = 'rgba(' + ink + ',' + 0.18 * gust + ')'; c.lineWidth = 1.2; c.lineCap = 'round'; for (j = 0; j < 10; j++) { var wy = (fxRnd(j + Math.floor(t / 9) * 10) * 0.8 + 0.05) * s.h, wx = (gc / 1.6) * (s.w + 400) - 200 + fxRnd(j + 50) * 200; c.beginPath(); c.moveTo(wx - 90, wy); c.quadraticCurveTo(wx - 40, wy - 6, wx, wy); c.stroke(); } }
      K.forEach(function (k, n) {
        var z = k.z * sc, x = k.x * s.w + Math.sin(t * 0.4 + k.ph) * 30 * z + gust * 40 * z, y = k.y * s.h + Math.sin(t * 0.7 + k.ph) * 20 * z - gust * 16, tilt = Math.sin(t * 0.9 + k.ph) * 0.22 + gust * 0.35, w = 25 * z, h = 34 * z, T = Tails[n];
        c.strokeStyle = 'rgba(' + ink + ',.28)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y + h * 0.5); c.quadraticCurveTo(x + 60 * z - gust * 40, (y + s.h) / 2 + 70, k.x * s.w - 40, s.h + 10); c.stroke();
        /* the tail follows where the kite has been */
        T.unshift([x, y + h * 0.85]); if (T.length > 30) { T.pop(); } var pts = []; for (j = 0; j < T.length; j += 3) { pts.push([T[j][0] + Math.sin(t * 4 + j * 0.4 + k.ph) * 3 * j / 30, T[j][1] + j * 1.6 * z]); }
        if (pts.length > 1) { c.strokeStyle = 'rgba(' + ink + ',.35)'; c.beginPath(); fxTrace(c, pts); c.stroke(); pts.forEach(function (p, m) { if (!m) { return; } c.globalAlpha = al; c.fillStyle = k.c[m % 2]; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] - 6 * z, p[1] - 4 * z); c.lineTo(p[0] - 6 * z, p[1] + 4 * z); c.closePath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] + 6 * z, p[1] - 4 * z); c.lineTo(p[0] + 6 * z, p[1] + 4 * z); c.closePath(); c.fill(); c.globalAlpha = 1; }); }
        c.save(); c.translate(x, y); c.rotate(tilt); c.globalAlpha = al;
        if (k.sh === 0) { [[0, -h, w, -h * 0.25, 0], [w, -h * 0.25, 0, h, 1], [0, h, -w, -h * 0.25, 0], [-w, -h * 0.25, 0, -h, 1]].forEach(function (q) { var g = c.createLinearGradient(0, -h, 0, h); g.addColorStop(0, k.c[q[4]]); g.addColorStop(1, q[4] ? '#CA8A04' : '#BE123C'); c.fillStyle = g; c.beginPath(); c.moveTo(0, -h * 0.25); c.lineTo(q[0], q[1]); c.lineTo(q[2], q[3]); c.closePath(); c.fill(); }); c.strokeStyle = 'rgba(' + ink + ',.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -h); c.lineTo(0, h); c.moveTo(-w, -h * 0.25); c.lineTo(w, -h * 0.25); c.stroke(); }
        else if (k.sh === 1) { c.fillStyle = k.c[0]; c.beginPath(); c.moveTo(0, -h); c.lineTo(w * 1.3, h * 0.45); c.lineTo(0, h * 0.2); c.lineTo(-w * 1.3, h * 0.45); c.closePath(); c.fill(); c.fillStyle = k.c[1]; c.beginPath(); c.moveTo(0, -h); c.lineTo(w * 0.45, h * 0.32); c.lineTo(0, h * 0.2); c.lineTo(-w * 0.45, h * 0.32); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(0, -h); c.lineTo(-w * 1.3, h * 0.45); c.lineTo(-w * 0.6, h * 0.3); c.closePath(); c.fill(); c.strokeStyle = 'rgba(' + ink + ',.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -h); c.lineTo(0, h * 0.2); c.stroke(); }
        else if (k.sh === 2) { var turn = Math.sin(t * 1.3 + k.ph), bw = w * 0.7 * Math.abs(turn) + 4, dw = w * 0.7 - bw * 0.5; [[-h, -h * 0.35], [h * 0.35, h]].forEach(function (cell2) { c.fillStyle = k.c[0]; c.fillRect(-bw / 2, cell2[0], bw, cell2[1] - cell2[0]); c.fillStyle = k.c[1]; c.fillRect(bw / 2, cell2[0] + 3, Math.max(2, dw), cell2[1] - cell2[0] - 3); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(-bw / 2, cell2[0], bw * 0.25, cell2[1] - cell2[0]); }); c.strokeStyle = 'rgba(' + ink + ',.6)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-bw / 2, -h); c.lineTo(-bw / 2, h); c.moveTo(bw / 2, -h); c.lineTo(bw / 2, h); c.stroke(); }
        else {
          /* the dragon kite: a head, and a long body of discs that waves behind it */
          c.restore(); c.globalAlpha = al; for (j = Dr.length - 1; j >= 0; j--) { var dx = x - j * 13 * z, dy = y + Math.sin(t * 2.4 - j * 0.45) * 14 * z + j * 2 * z, rr = (9 - j * 0.3) * z; Dr[j] = [dx, dy]; c.fillStyle = j % 2 ? '#DC2626' : '#F59E0B'; c.beginPath(); c.arc(dx, dy, rr, 0, FX_TAU); c.fill(); c.strokeStyle = 'rgba(' + ink + ',.35)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(dx, dy + rr); c.lineTo(dx + Math.sin(t * 3 + j) * 3, dy + rr + 10 * z); c.stroke(); }
          c.save(); c.translate(x, y); c.rotate(Math.sin(t * 2.4) * 0.15); c.fillStyle = '#DC2626'; c.beginPath(); c.moveTo(-10 * z, -12 * z); c.lineTo(16 * z, -6 * z); c.lineTo(20 * z, 4 * z); c.lineTo(4 * z, 12 * z); c.lineTo(-12 * z, 8 * z); c.closePath(); c.fill(); c.fillStyle = '#FDE047'; c.beginPath(); c.arc(6 * z, -3 * z, 3 * z, 0, FX_TAU); c.fill(); c.fillStyle = '#111827'; c.beginPath(); c.arc(7 * z, -3 * z, 1.4 * z, 0, FX_TAU); c.fill(); c.strokeStyle = '#F59E0B'; c.lineWidth = 2 * z; c.beginPath(); c.moveTo(-6 * z, -10 * z); c.quadraticCurveTo(-12 * z, -24 * z, -2 * z, -28 * z); c.moveTo(2 * z, -9 * z); c.quadraticCurveTo(0, -22 * z, 10 * z, -24 * z); c.stroke(); c.strokeStyle = 'rgba(' + ink + ',.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(18 * z, 4 * z); c.quadraticCurveTo(28 * z, 10 * z, 34 * z, 4 * z + Math.sin(t * 4) * 4); c.stroke();
        }
        c.restore(); c.globalAlpha = 1;
      });
    };
  };
  /* Hot-air balloons: balloons of every pattern drift up past distant mountains, through clouds, at three depths. Each burner
     roars now and then with a blue and orange flame that lights its balloon from inside and lifts it; people wave from the
     baskets. On a dark page it is night, with stars and a glowing horizon; on a light one, dawn */
  FX_PAPER.balloons = function (s) {
    var B = [], Cl = [], St = [], i, PAL = [['#EF4444', '#FDE047', '#1E3A8A'], ['#3B82F6', '#F8FAFC', '#EF4444'], ['#A855F7', '#F472B6', '#FDE047'], ['#10B981', '#FDE68A', '#7C2D12'], ['#F97316', '#1E3A8A', '#F8FAFC'], ['#EC4899', '#22D3EE', '#FDE047'], ['#FACC15', '#DC2626', '#1E3A8A']];
    for (i = 0; i < 7; i++) { B.push({ x: (i + 0.5) / 7 + fxR(-0.05, 0.05), y: Math.random() * 1.3, z: [0.45, 0.6, 0.75, 0.9, 1.05, 0.55, 0.8][i], ph: fxR(0, 9), c: PAL[i], lift: 0, pat: i % 3 }); } B.sort(function (a, b) { return a.z - b.z; });
    for (i = 0; i < 6; i++) { Cl.push({ x: Math.random(), y: fxR(0.1, 0.9), r: fxR(40, 80), sp: fxR(3, 8), z: fxR(0.5, 1) }); }
    for (i = 0; i < 60; i++) { St.push({ x: Math.random(), y: Math.random() * 0.7, p: fxR(0, 6) }); }
    function gore(c, x, y, r, u0, u1) { c.beginPath(); c.moveTo(x + u0 * r * 0.35, y + r * 1.25); c.quadraticCurveTo(x + u0 * r * 1.45, y + r * 0.1, x, y - r); c.quadraticCurveTo(x + u1 * r * 1.45, y + r * 0.1, x + u1 * r * 0.35, y + r * 1.25); c.closePath(); }
    return function (t, dt) {
      var c = s.ctx, D = FX_INK.dark, ink = D ? '226,232,240' : '51,65,85', j;
      /* the sky: stars at night, a warm glow along the horizon, mountains far off */
      if (D) { c.globalCompositeOperation = 'lighter'; St.forEach(function (q) { fxGlow(c, '255,255,255', q.x * s.w, q.y * s.h, 1.6, 0.25 + 0.3 * Math.sin(t * 1.5 + q.p)); }); }
      c.globalCompositeOperation = D ? 'lighter' : 'source-over'; fxGlow(c, D ? '251,146,60' : '253,186,116', s.w * 0.5, s.h * 1.05, s.w * 0.8, D ? 0.14 : 0.3); c.globalCompositeOperation = 'source-over';
      c.fillStyle = D ? 'rgba(30,27,75,.55)' : 'rgba(148,163,184,.22)'; c.beginPath(); c.moveTo(0, s.h); for (j = 0; j <= s.w + 20; j += 20) { c.lineTo(j, s.h * 0.88 - Math.abs(Math.sin(j * 0.006 + 1)) * s.h * 0.08 - Math.sin(j * 0.02) * 6); } c.lineTo(s.w, s.h); c.fill();
      c.fillStyle = D ? 'rgba(15,23,42,.7)' : 'rgba(100,116,139,.25)'; c.beginPath(); c.moveTo(0, s.h); for (j = 0; j <= s.w + 20; j += 20) { c.lineTo(j, s.h * 0.94 - Math.abs(Math.sin(j * 0.009 + 3)) * s.h * 0.05); } c.lineTo(s.w, s.h); c.fill();
      function cloud(q) { var x = ((q.x * (s.w + 300) + t * q.sp) % (s.w + 300)) - 150, y = q.y * s.h; c.fillStyle = D ? 'rgba(148,163,184,' + 0.07 * q.z + ')' : 'rgba(255,255,255,' + 0.65 * q.z + ')'; c.beginPath(); c.arc(x, y, q.r * 0.6, 0, FX_TAU); c.arc(x + q.r * 0.6, y + q.r * 0.15, q.r * 0.45, 0, FX_TAU); c.arc(x - q.r * 0.6, y + q.r * 0.18, q.r * 0.4, 0, FX_TAU); c.fill(); }
      Cl.forEach(function (q) { if (q.z < 0.75) { cloud(q); } });
      B.forEach(function (b) {
        var r = 32 * b.z * Math.min(1.25, Math.max(0.9, s.w / 700)), al = (D ? 0.32 : 0.28) + 0.32 * b.z, cyc = (t + b.ph) % 7, burn = cyc < 1.1 ? 1 : 0; b.lift = Math.max(0, b.lift - dt * 0.5) + burn * dt * 1.2;
        b.y -= dt * (0.01 + 0.012 * b.z + 0.02 * b.lift); if (b.y < -0.25) { b.y = 1.2; b.x = Math.random(); }
        var x = b.x * s.w + Math.sin(t * 0.25 + b.ph) * 26, y = b.y * s.h;
        c.globalAlpha = al;
        /* ropes, sandbags, the basket and its passengers */
        c.strokeStyle = 'rgba(' + ink + ',.6)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - r * 0.33, y + r * 1.25); c.lineTo(x - r * 0.2, y + r * 1.62); c.moveTo(x + r * 0.33, y + r * 1.25); c.lineTo(x + r * 0.2, y + r * 1.62); c.stroke();
        c.fillStyle = '#A16207'; c.beginPath(); c.ellipse(x - r * 0.3, y + r * 1.75, r * 0.05, r * 0.08, 0, 0, FX_TAU); c.ellipse(x + r * 0.3, y + r * 1.75, r * 0.05, r * 0.08, 0, 0, FX_TAU); c.fill();
        c.fillStyle = '#334155'; [-0.08, 0.1].forEach(function (px, m) { c.beginPath(); c.arc(x + px * r, y + r * 1.56, r * 0.06, 0, FX_TAU); c.fill(); if (m && Math.sin(t * 3 + b.ph) > 0.3) { c.strokeStyle = '#334155'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + px * r + r * 0.03, y + r * 1.6); c.lineTo(x + px * r + r * 0.12, y + r * 1.48 + Math.sin(t * 9) * 2); c.stroke(); } });
        var bk = c.createLinearGradient(0, y + r * 1.6, 0, y + r * 1.9); bk.addColorStop(0, '#B45309'); bk.addColorStop(1, '#78350F'); c.fillStyle = bk; c.fillRect(x - r * 0.22, y + r * 1.6, r * 0.44, r * 0.28); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.6; for (j = 1; j < 4; j++) { c.beginPath(); c.moveTo(x - r * 0.22 + j * r * 0.11, y + r * 1.6); c.lineTo(x - r * 0.22 + j * r * 0.11, y + r * 1.88); c.stroke(); }
        /* the envelope: gores in its colors, a patterned band, shading, a crown */
        c.fillStyle = b.c[0]; gore(c, x, y, r, -1, 1); c.fill();
        c.fillStyle = b.c[1]; for (j = 0; j < 8; j += 2) { var u0 = -1 + j / 4, u1 = u0 + 0.25; gore(c, x, y, r, u0 + 0.03, u1 + 0.03); c.fill(); }
        c.save(); gore(c, x, y, r, -1, 1); c.clip(); c.fillStyle = b.c[2]; var by0 = y + r * (b.pat === 1 ? -0.2 : 0.35); if (b.pat === 0) { c.beginPath(); for (j = -6; j <= 6; j++) { c.lineTo(x + j * r * 0.18, by0 + (j % 2 ? -r * 0.09 : r * 0.09)); } c.lineTo(x + r * 1.2, by0 + r * 0.2); c.lineTo(x - r * 1.2, by0 + r * 0.2); c.fill(); } else if (b.pat === 1) { c.fillRect(x - r * 1.2, by0, r * 2.4, r * 0.14); } else { for (j = -3; j <= 3; j++) { c.beginPath(); c.arc(x + j * r * 0.32, by0, r * 0.08, 0, FX_TAU); c.fill(); } }
        var sg = c.createLinearGradient(x - r, 0, x + r, 0); sg.addColorStop(0, 'rgba(0,0,0,.28)'); sg.addColorStop(0.42, 'rgba(255,255,255,.18)'); sg.addColorStop(1, 'rgba(0,0,0,.34)'); c.fillStyle = sg; c.fillRect(x - r * 1.3, y - r * 1.1, r * 2.6, r * 2.5);
        if (burn && D) { var ig = c.createRadialGradient(x, y + r * 1.1, 2, x, y + r * 0.4, r * 1.2); ig.addColorStop(0, 'rgba(253,186,116,.55)'); ig.addColorStop(1, 'rgba(253,186,116,0)'); c.fillStyle = ig; c.fillRect(x - r * 1.3, y - r * 1.1, r * 2.6, r * 2.5); }
        c.restore();
        c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, y - r * 0.96, r * 0.18, r * 0.06, 0, 0, FX_TAU); c.fill();
        c.globalAlpha = 1;
        /* the burner: a blue core and an orange plume, flickering */
        if (burn) { var fk = 0.75 + 0.25 * Math.sin(t * 40); c.globalCompositeOperation = D ? 'lighter' : 'source-over'; lkTongue(c, x, y + r * 1.55, r * 0.42 * fk, r * 0.08, Math.sin(t * 20) * 2, 'rgba(251,146,60,' + 0.85 * al + ')'); lkTongue(c, x, y + r * 1.55, r * 0.22 * fk, r * 0.04, 0, 'rgba(96,165,250,' + 0.9 * al + ')'); fxGlow(c, '251,146,60', x, y + r * 1.3, r * 0.6, 0.6 * fk * al); c.globalCompositeOperation = 'source-over'; }
      });
      Cl.forEach(function (q) { if (q.z >= 0.75) { cloud(q); } });
    };
  };
  /* Ink wash: an ink painting that paints itself: three ranges of mountains are brushed in from left to right, a waterfall falls
     between the peaks, a pagoda stands on one; mist drifts, a boat crosses the water, cranes fly in a line, plum blossom opens on
     a branch and its petals fall, drops of ink bloom and fade, and a red seal is pressed into the corner */
  FX_PAPER.inkwash = function (s) {
    var Bl = [], nextB = 1.5, Cr = null, nextC = 5, Pt = [], o1 = {}, t0 = -1;
    function ridge(L, x) { var q = x * 0.004 + L * 7.1; return Math.pow(Math.abs(Math.sin(q)), 1.5) * 0.6 + Math.pow(Math.abs(Math.sin(q * 2.3 + 1.7)), 2) * 0.3 + Math.sin(q * 6.1 + L) * 0.05; }
    return function (t, dt) {
      if (t0 < 0) { t0 = t; } var c = s.ctx, D = FX_INK.dark, ink = D ? '226,232,240' : '28,25,23', L, x, j, age = t - t0;
      /* a pale red sun */
      c.fillStyle = D ? 'rgba(248,113,113,.14)' : 'rgba(220,38,38,.12)'; c.beginPath(); c.arc(s.w * 0.8, s.h * 0.18, Math.min(60, s.w * 0.09), 0, FX_TAU); c.fill();
      for (L = 0; L < 3; L++) {
        var base = s.h * (0.8 + L * 0.07), amp = s.h * (0.26 - L * 0.06), top = base - amp, a0 = (D ? [0.08, 0.12, 0.17] : [0.1, 0.18, 0.3])[L], rev = Math.min(1, Math.max(0, (age - L * 1.4) / 3.2)), xr = rev * (s.w + 40), g = c.createLinearGradient(0, top, 0, base + 30);
        if (rev <= 0) { continue; }
        g.addColorStop(0, 'rgba(' + ink + ',' + a0 + ')'); g.addColorStop(0.55, 'rgba(' + ink + ',' + a0 * 0.45 + ')'); g.addColorStop(1, 'rgba(' + ink + ',0)'); c.fillStyle = g;
        c.beginPath(); c.moveTo(0, base + 40); for (x = 0; x <= xr; x += 8) { c.lineTo(x, base - ridge(L, x + L * 300) * amp); } c.lineTo(xr, base + 40); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(' + ink + ',' + a0 * 1.8 + ')'; c.lineCap = 'round'; for (x = 0; x <= xr; x += 8) { c.lineWidth = (1.6 - L * 0.25) * (0.6 + 0.8 * Math.abs(Math.sin(x * 0.03 + L))); c.beginPath(); c.moveTo(x, base - ridge(L, x + L * 300) * amp); c.lineTo(x + 8, base - ridge(L, x + 8 + L * 300) * amp); c.stroke(); }
        if (rev < 1) { c.fillStyle = 'rgba(' + ink + ',' + a0 * 2 + ')'; c.beginPath(); c.arc(xr, base - ridge(L, xr + L * 300) * amp, 3, 0, FX_TAU); c.fill(); }
        /* the pagoda on the middle range, and the waterfall between peaks */
        if (L === 1 && rev >= 1) { var px0 = s.w * 0.62, py0 = base - ridge(1, px0 + 300) * amp; c.fillStyle = 'rgba(' + ink + ',' + (D ? 0.3 : 0.45) + ')'; for (j = 0; j < 4; j++) { var pw = 22 - j * 4, pyy = py0 - j * 11; c.fillRect(px0 - pw * 0.35, pyy - 9, pw * 0.7, 9); c.beginPath(); c.moveTo(px0 - pw * 0.8, pyy - 8); c.quadraticCurveTo(px0, pyy - 13, px0 + pw * 0.8, pyy - 8); c.lineTo(px0 + pw * 0.5, pyy - 11); c.lineTo(px0 - pw * 0.5, pyy - 11); c.fill(); } c.fillRect(px0 - 0.8, py0 - 54, 1.6, 10);
          var wx = s.w * 0.36, wy0 = base - amp * 0.75, wy1 = base - amp * 0.1; c.strokeStyle = 'rgba(' + ink + ',' + (D ? 0.3 : 0.35) + ')'; c.lineWidth = 1; c.setLineDash([6, 8]); for (j = 0; j < 4; j++) { c.lineDashOffset = -t * 30 - j * 5; c.beginPath(); c.moveTo(wx + j * 3, wy0); c.lineTo(wx + j * 3 + 2, wy1); c.stroke(); } c.setLineDash([]); }
        /* mist drifting between the ranges */
        c.globalCompositeOperation = D ? 'destination-out' : 'source-over'; for (j = 0; j < 3; j++) { fxGlow(c, D ? '0,0,0' : '255,255,255', ((t * (5 + L * 3) + j * s.w / 2 + L * 140) % (s.w + 500)) - 250, base - amp * 0.15, 220, D ? 0.25 : 0.55); } c.globalCompositeOperation = 'source-over';
      }
      var fin = Math.min(1, Math.max(0, (age - 4) / 2));
      /* a gnarled pine on a rock at the left */
      if (fin > 0) { c.globalAlpha = fin; var px = s.w * 0.06, py = s.h * 0.86; c.fillStyle = 'rgba(' + ink + ',' + (D ? 0.2 : 0.32) + ')'; c.beginPath(); c.moveTo(px - 60, s.h); c.quadraticCurveTo(px - 40, py + 10, px + 4, py - 6); c.quadraticCurveTo(px + 44, py + 4, px + 70, s.h); c.fill(); c.strokeStyle = 'rgba(' + ink + ',' + (D ? 0.3 : 0.45) + ')'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(px - 46, py + 24); c.quadraticCurveTo(px - 30, py + 4, px + 4, py - 6); c.quadraticCurveTo(px + 30, py, px + 44, py + 22); c.stroke();
        c.strokeStyle = 'rgba(' + ink + ',' + (D ? 0.35 : 0.55) + ')'; c.lineCap = 'round'; c.lineWidth = 4; c.beginPath(); c.moveTo(px + 4, py - 6); c.bezierCurveTo(px + 18, py - 40, px - 10, py - 60, px + 24, py - 92); c.stroke(); c.lineWidth = 2; c.beginPath(); c.moveTo(px + 10, py - 50); c.quadraticCurveTo(px + 40, py - 58, px + 64, py - 52); c.moveTo(px + 18, py - 80); c.quadraticCurveTo(px - 4, py - 90, px - 24, py - 84); c.stroke();
        c.fillStyle = 'rgba(' + ink + ',' + (D ? 0.22 : 0.34) + ')'; [[px + 64, py - 54, 22], [px - 24, py - 86, 18], [px + 24, py - 96, 20]].forEach(function (n) { c.beginPath(); c.ellipse(n[0], n[1], n[2], n[2] * 0.32, 0, 0, FX_TAU); c.fill(); c.strokeStyle = 'rgba(' + ink + ',' + (D ? 0.25 : 0.4) + ')'; c.lineWidth = 0.8; for (var m = -3; m <= 3; m++) { c.beginPath(); c.moveTo(n[0] + m * n[2] * 0.28, n[1] - n[2] * 0.2); c.lineTo(n[0] + m * n[2] * 0.3, n[1] + n[2] * 0.25); c.stroke(); } }); c.globalAlpha = 1; }
      /* a plum branch from the top corner, blossoms opening, petals falling */
      var bx = s.w, by = 0; c.strokeStyle = 'rgba(' + ink + ',' + (D ? 0.4 : 0.6) + ')'; c.lineCap = 'round'; c.lineWidth = 4 * Math.min(1, age / 2); c.beginPath(); c.moveTo(bx, by + 20); c.quadraticCurveTo(bx - 60, by + 40, bx - 110, by + 34); c.stroke(); c.lineWidth = 2; c.beginPath(); c.moveTo(bx - 60, by + 36); c.quadraticCurveTo(bx - 80, by + 60, bx - 96, by + 78); c.moveTo(bx - 90, by + 36); c.quadraticCurveTo(bx - 120, by + 20, bx - 150, by + 26); c.stroke();
      [[bx - 110, by + 34], [bx - 96, by + 78], [bx - 150, by + 26], [bx - 70, by + 42], [bx - 128, by + 24], [bx - 84, by + 62]].forEach(function (p, n) { var op = Math.min(1, Math.max(0, (age - 2 - n * 0.5) / 1)); if (op <= 0) { return; } for (var m = 0; m < 5; m++) { var pa = m / 5 * FX_TAU + n; c.fillStyle = D ? 'rgba(251,113,133,.55)' : 'rgba(225,29,72,.6)'; c.beginPath(); c.arc(p[0] + Math.cos(pa) * 3.6 * op, p[1] + Math.sin(pa) * 3.6 * op, 2.6 * op, 0, FX_TAU); c.fill(); } c.fillStyle = D ? 'rgba(253,230,138,.8)' : 'rgba(161,98,7,.8)'; c.beginPath(); c.arc(p[0], p[1], 1.2, 0, FX_TAU); c.fill(); });
      lkEvery(o1, age > 4 ? 0.5 : 0, dt, function () { Pt.push({ x: bx - fxR(70, 150), y: by + fxR(20, 80), vx: fxR(-20, -6), vy: fxR(10, 22), l: 0, m: 14, r: fxR(0, 6) }); });
      lkStep(Pt, dt, 0, 0, function (q) { q.vx = -12 + Math.sin(t + q.m * q.r) * 10; c.save(); c.translate(q.x, q.y); c.rotate(t + q.r); c.fillStyle = D ? 'rgba(251,113,133,.5)' : 'rgba(225,29,72,.5)'; c.beginPath(); c.ellipse(0, 0, 3.4, 2, 0, 0, FX_TAU); c.fill(); c.restore(); if (q.y > s.h + 10 || q.x < -10) { q.l = q.m; } });
      /* a boat with a fisherman, drifting, and its ripples */
      if (fin > 0) { c.globalAlpha = fin; var bby = s.h * 0.93, bbx = ((t * 7) % (s.w + 120)) - 60; c.strokeStyle = 'rgba(' + ink + ',' + (D ? 0.4 : 0.55) + ')'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bbx - 18, bby); c.quadraticCurveTo(bbx, bby + 6, bbx + 18, bby - 1); c.stroke(); c.beginPath(); c.moveTo(bbx + 2, bby); c.lineTo(bbx + 2, bby - 10); c.moveTo(bbx + 2, bby - 7); c.lineTo(bbx + 22, bby - 20); c.stroke(); c.lineWidth = 0.6; c.beginPath(); c.moveTo(bbx + 22, bby - 20); c.lineTo(bbx + 24, bby + 2 + Math.sin(t) * 2); c.stroke(); c.fillStyle = 'rgba(' + ink + ',' + (D ? 0.4 : 0.55) + ')'; c.beginPath(); c.moveTo(bbx - 4, bby - 10); c.lineTo(bbx + 2, bby - 15); c.lineTo(bbx + 8, bby - 10); c.fill();
        c.lineWidth = 0.8; for (j = 1; j <= 3; j++) { c.beginPath(); c.moveTo(bbx - 18 - j * 12, bby + j * 3); c.lineTo(bbx - 4 - j * 12, bby + j * 3); c.stroke(); } c.globalAlpha = 1; }
      /* cranes cross in a line now and then */
      if (!Cr && t > nextC) { Cr = { x: -60, y: fxR(0.12, 0.35) * s.h }; } if (Cr) { Cr.x += dt * 34; [0, 1, 2].forEach(function (n) { var f = Math.sin(t * 2.4 + n * 0.7), cx = Cr.x - n * 44, cy = Cr.y + n * 14 + Math.sin(t * 0.6 + n) * 8; c.strokeStyle = 'rgba(' + ink + ',' + (D ? 0.45 : 0.6) + ')'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx - 20, cy + 2); c.lineTo(cx + 10, cy); c.quadraticCurveTo(cx + 18, cy - 4, cx + 26, cy - 2); c.moveTo(cx - 20, cy + 2); c.lineTo(cx - 34, cy + 6); c.stroke(); c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx - 6, cy); c.quadraticCurveTo(cx - 14, cy - 20 * f, cx - 30, cy - 26 * f); c.moveTo(cx - 6, cy + 1); c.quadraticCurveTo(cx - 2, cy - 16 * f, cx - 12, cy - 30 * f); c.stroke(); c.fillStyle = D ? 'rgba(248,113,113,.5)' : 'rgba(220,38,38,.6)'; c.beginPath(); c.arc(cx + 24, cy - 3, 1.6, 0, FX_TAU); c.fill(); }); if (Cr.x > s.w + 160) { Cr = null; nextC = t + fxR(14, 24); } }
      /* drops of ink bloom where they land, and fade */
      if (t > nextB || t < nextB - 20) { nextB = t + fxR(2.5, 5); Bl.push({ x: fxR(0.05, 0.95) * s.w, y: fxR(0.08, 0.7) * s.h, l: 0, sd: fxR(0, 50) }); }
      for (j = Bl.length - 1; j >= 0; j--) { var b = Bl[j]; b.l += dt; if (b.l > 6) { Bl.splice(j, 1); continue; } var R = 8 + 46 * (1 - Math.exp(-b.l * 0.8)), al = (D ? 0.22 : 0.3) * (1 - b.l / 6), m2; if (D) { c.globalCompositeOperation = 'lighter'; } fxGlow(c, ink, b.x, b.y, R, al); fxGlow(c, ink, b.x, b.y, R * 0.35, al * 1.4); for (m2 = 0; m2 < 5; m2++) { var an = fxRnd(b.sd + m2) * FX_TAU, rr = R * (0.7 + 0.5 * fxRnd(b.sd + m2 + 9)); fxGlow(c, ink, b.x + Math.cos(an) * rr, b.y + Math.sin(an) * rr, 3 + 5 * fxRnd(b.sd + m2 + 4), al * 1.2); } c.globalCompositeOperation = 'source-over'; }
      /* the red seal, pressed in once the painting is done */
      var sv = Math.min(1, Math.max(0, (age - 6) / 0.35)); if (sv > 0) { var sz = 22 * (1 + (1 - sv) * 0.8), sx = s.w - 23, sy = s.h - 29; c.save(); c.translate(sx, sy); c.rotate(-0.04); c.globalAlpha = sv; c.fillStyle = D ? 'rgba(248,113,113,.55)' : 'rgba(185,28,28,.72)'; c.fillRect(-sz / 2, -sz / 2, sz, sz); c.strokeStyle = D ? 'rgba(11,11,16,.85)' : 'rgba(255,255,255,.9)'; c.lineWidth = 1.6 * sz / 22; var q = sz / 22; c.beginPath(); c.moveTo(-6 * q, -5 * q); c.lineTo(6 * q, -5 * q); c.moveTo(0, -7 * q); c.lineTo(0, 7 * q); c.moveTo(-6 * q, 1 * q); c.lineTo(6 * q, 1 * q); c.moveTo(-5 * q, 7 * q); c.lineTo(5 * q, 6 * q); c.stroke(); c.restore(); }
    };
  };
  /* Wanderers: far off on the horizon, through layers of fog, giants walk on long legs, slowly, under a huge moon. Markings glow
     along their bodies, lanterns swing from their necks, dust rises where each foot comes down. Now and then one calls, a ring of
     light rolling out from it, and the others answer one by one. Far below, a small traveller with a lantern walks the other way */
  FX_PAPER.wanderers = function (s) {
    var W = [{ u: 0.12, z: 1, sp: 0.0055, ph: 0, col: '253,186,116' }, { u: 0.55, z: 0.68, sp: 0.0042, ph: 2.1, col: '103,232,249' }, { u: 0.86, z: 0.46, sp: 0.0034, ph: 4.2, col: '240,171,252' }], St = [], Du = [], Au = [], i, lastCall = -1;
    for (i = 0; i < 80; i++) { St.push({ x: Math.random(), y: Math.random() * 0.7, p: fxR(0, 6), z: fxR(0.5, 1.3) }); }
    W.forEach(function (g) { g.feet = [0, 0, 0, 0]; });
    function leg(c, hx, hy, fx, fy, L, sd, w) { var dx = fx - hx, dy = fy - hy, d = Math.min(L * 1.98, Math.hypot(dx, dy)), h = Math.sqrt(Math.max(0, L * L - d * d / 4)), mx = (hx + fx) / 2, my = (hy + fy) / 2, nx = -dy / (Math.hypot(dx, dy) || 1), ny = dx / (Math.hypot(dx, dy) || 1), kx = mx + nx * h * sd, ky = my + ny * h * sd; c.lineWidth = w; c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.stroke(); c.lineWidth = w * 0.55; c.beginPath(); c.moveTo(kx, ky); c.lineTo(fx, fy); c.stroke(); return [kx, ky]; }
    return function (t, dt) {
      var c = s.ctx, D = FX_INK.dark, hz = s.h * 0.9, j, callCyc = Math.floor(t / 24), cu = t % 24;
      if (D) { c.globalCompositeOperation = 'lighter'; St.forEach(function (q) { fxGlow(c, '226,232,255', q.x * s.w, q.y * s.h, 1.6 * q.z, 0.25 + 0.3 * Math.sin(t * 1.5 + q.p)); });
        /* faint ribbons of aurora */
        for (j = 0; j < 3; j++) { c.strokeStyle = 'rgba(' + (j % 2 ? '52,211,153' : '167,139,250') + ',.06)'; c.lineWidth = 40; c.beginPath(); for (var x = -20; x <= s.w + 20; x += 20) { var ay = s.h * (0.15 + j * 0.08) + Math.sin(x * 0.006 + t * 0.2 + j) * 30; if (x === -20) { c.moveTo(x, ay); } else { c.lineTo(x, ay); } } c.stroke(); } }
      /* a huge moon low on the horizon (a pale sun in fog on a light page) */
      c.globalCompositeOperation = D ? 'lighter' : 'source-over'; var mx0 = s.w * 0.3, mr = Math.min(s.w, s.h) * 0.22; fxGlow(c, D ? '254,243,199' : '251,191,36', mx0, hz - mr * 0.3, mr * 2.4, D ? 0.16 : 0.1);
      if (D) { c.fillStyle = 'rgba(254,243,199,.16)'; c.beginPath(); c.arc(mx0, hz - mr * 0.3, mr, 0, FX_TAU); c.fill(); c.fillStyle = 'rgba(120,90,40,.12)'; [[-0.3, -0.2, 0.2], [0.25, 0.15, 0.14], [0.05, -0.45, 0.1], [-0.15, 0.35, 0.12]].forEach(function (q) { c.beginPath(); c.arc(mx0 + q[0] * mr, hz - mr * 0.3 + q[1] * mr, q[2] * mr, 0, FX_TAU); c.fill(); }); }
      c.globalCompositeOperation = 'source-over';
      /* far hills */
      c.fillStyle = D ? 'rgba(15,23,42,.55)' : 'rgba(148,163,184,.12)'; c.beginPath(); c.moveTo(0, hz + 4); for (j = 0; j <= s.w + 20; j += 20) { c.lineTo(j, hz - 10 - Math.abs(Math.sin(j * 0.005 + 2)) * 26); } c.lineTo(s.w, hz + 4); c.fill();
      W.forEach(function (g, gi) {
        var z = g.z * Math.min(1.3, Math.max(0.7, s.h / 900)), L = s.h * 0.2 * z, x = ((g.u + t * g.sp) % 1.3) * s.w - 0.15 * s.w, by = hz - L * 1.72 + Math.sin(t * g.sp * s.w / (L * 0.9) * FX_TAU * 2) * L * 0.02, col = D ? 'rgba(2,6,23,' + (0.55 + 0.4 * z) + ')' : 'rgba(71,85,105,' + (0.12 + 0.22 * z) + ')', st = t * g.sp * s.w / (L * 0.9);
        var callAt = gi * 1.6, call = cu > callAt && cu < callAt + 2 ? (cu - callAt) / 2 : -1;
        var hdx = x + L * 0.98 + Math.sin(t * 0.5 + g.ph) * L * 0.05 - (call >= 0 ? Math.sin(call * Math.PI) * L * 0.1 : 0), hdy = by + L * 0.18 + Math.sin(t * 0.7 + g.ph) * L * 0.04 - (call >= 0 ? Math.sin(call * Math.PI) * L * 0.25 : 0);
        (D ? [['rgba(148,163,184,' + 0.22 * z + ')', 2.2], [col, 0]] : [[col, 0]]).forEach(function (pass) {
          c.strokeStyle = pass[0]; c.fillStyle = pass[0]; c.lineCap = 'round'; var ex2 = pass[1];
          for (j = 0; j < 4; j++) { var p = (st + j * 0.25 + (j % 2) * 0.5) % 1, hx = x + (j < 2 ? 0.5 : -0.5) * L * 0.7, sw = p < 0.65 ? 1 - p / 0.65 * 2 : -1 + (p - 0.65) / 0.35 * 2, fx = hx + sw * L * 0.45, fy = hz - (p >= 0.65 ? Math.sin((p - 0.65) / 0.35 * Math.PI) * L * 0.12 : 0); leg(c, hx, by + L * 0.1, fx, fy, L * 0.95, j < 2 ? 1 : -1, 5 * z + ex2);
            if (!ex2) { var planted = p < 0.65 ? 1 : 0; if (planted && !g.feet[j]) { for (var m = 0; m < 4; m++) { Du.push({ x: fx, y: hz, vx: fxR(-20, 20) * z, vy: fxR(-14, -4) * z, l: 0, m: fxR(1, 2), z: z }); } } g.feet[j] = planted; } }
          c.beginPath(); c.ellipse(x, by, L * 0.62 + ex2, L * 0.3 + ex2, Math.sin(t * 0.3 + g.ph) * 0.04, 0, FX_TAU); c.fill();
          for (j = 0; j < 5; j++) { var spx = x - L * 0.36 + j * L * 0.17; c.beginPath(); c.moveTo(spx - L * 0.05 - ex2, by - L * 0.24); c.lineTo(spx - L * 0.02, by - L * (0.4 + 0.06 * (j % 2)) - ex2); c.lineTo(spx + L * 0.04 + ex2, by - L * 0.25); c.fill(); }
          c.lineWidth = L * 0.13 + ex2; c.beginPath(); c.moveTo(x + L * 0.45, by - L * 0.05); c.quadraticCurveTo(x + L * 0.9, by - L * 0.42, hdx, hdy); c.stroke();
          c.beginPath(); c.ellipse(hdx + L * 0.03, hdy + L * 0.03, L * 0.11 + ex2, L * 0.08 + ex2, 0.5, 0, FX_TAU); c.fill();
        });
        c.strokeStyle = col; c.lineWidth = 1.4 * z; for (j = 0; j < 7; j++) { var tx = x - L * 0.45 + j * L * 0.15; c.beginPath(); c.moveTo(tx, by + L * 0.2); c.quadraticCurveTo(tx + Math.sin(t * 0.8 + j + g.ph) * 8 * z, by + L * 0.55, tx + Math.sin(t * 0.6 + j * 2) * 12 * z, by + L * (0.7 + 0.12 * (j % 3))); c.stroke(); }
        /* markings that glow along the body, and the lantern swinging from the neck */
        c.globalCompositeOperation = D ? 'lighter' : 'source-over'; var pu = 0.6 + 0.4 * Math.sin(t * 1.3 + g.ph) + (call >= 0 ? Math.sin(call * Math.PI) * 0.6 : 0);
        for (j = 0; j < 6; j++) { var ma = Math.PI * (1.15 + j * 0.13), wv = 0.5 + 0.5 * Math.sin(t * 2 - j * 0.8 + g.ph); fxGlow(c, g.col, x + Math.cos(ma) * L * 0.5, by + Math.sin(ma) * L * 0.2, L * 0.03 + 2, (D ? 0.5 : 0.35) * wv * Math.min(1.4, pu)); }
        var sw2 = Math.sin(t * 1.6 + g.ph) * 0.35, lx = hdx + Math.sin(sw2) * L * 0.2, ly = hdy + Math.cos(sw2) * L * 0.2; c.globalCompositeOperation = 'source-over'; c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); c.moveTo(hdx, hdy + L * 0.04); c.lineTo(lx, ly); c.stroke();
        c.globalCompositeOperation = D ? 'lighter' : 'source-over'; fxGlow(c, g.col, lx, ly, L * 0.32, (D ? 0.5 : 0.35) * Math.min(1.5, pu)); fxGlow(c, D ? '255,255,255' : g.col, lx, ly, L * 0.06, D ? 0.9 : 0.7);
        if (call >= 0) { fxRing(c, lx, ly, 10 + call * L * 2.4, 4 + call * L * 0.9, g.col, (1 - call) * (D ? 0.7 : 0.5), 2); fxRing(c, lx, ly, 6 + call * L * 1.4, 2 + call * L * 0.5, g.col, (1 - call) * (D ? 0.5 : 0.35), 1.2); }
        c.globalCompositeOperation = 'source-over';
      });
      /* dust where the feet come down */
      c.globalCompositeOperation = D ? 'lighter' : 'source-over'; lkStep(Du, dt, 4, 0.5, function (q, f) { fxGlow(c, D ? '100,116,139' : '148,163,184', q.x, q.y, 5 + (1 - f) * 12 * q.z, (D ? 0.16 : 0.25) * f); });
      /* fog over the feet */
      for (j = 0; j < 5; j++) { fxGlow(c, D ? '100,116,139' : '255,255,255', ((t * (6 + j * 2) + j * s.w / 4) % (s.w + 600)) - 300, hz + 6 - (j % 2) * 20, 240, D ? 0.12 : 0.5); }
      c.globalCompositeOperation = 'source-over';
      /* the small traveller with a lantern, walking the other way along the near ground */
      var trx = s.w - ((t * 9) % (s.w + 80)) + 40, try0 = s.h - 14, step = Math.sin(t * 6); c.strokeStyle = D ? 'rgba(2,6,23,.9)' : 'rgba(51,65,85,.6)'; c.fillStyle = c.strokeStyle; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(trx, try0 - 12); c.lineTo(trx, try0 - 4); c.moveTo(trx, try0 - 4); c.lineTo(trx - 2 + step * 2, try0 + 2); c.moveTo(trx, try0 - 4); c.lineTo(trx + 2 - step * 2, try0 + 2); c.moveTo(trx, try0 - 10); c.lineTo(trx - 5, try0 - 6); c.stroke(); c.beginPath(); c.arc(trx, try0 - 14.5, 2.4, 0, FX_TAU); c.fill(); c.beginPath(); c.moveTo(trx - 3, try0 - 12); c.lineTo(trx + 3, try0 - 12); c.lineTo(trx + 4, try0 - 3); c.lineTo(trx - 4, try0 - 3); c.fill();
      c.globalCompositeOperation = D ? 'lighter' : 'source-over'; fxGlow(c, '253,186,116', trx - 6, try0 - 5, 10, D ? 0.8 : 0.6); fxGlow(c, '255,255,255', trx - 6, try0 - 5, 2, 1); c.globalCompositeOperation = 'source-over';
    };
  };

  /* ---------- living themes: drawn behind the whole page in the theme's own colors ---------- */
  /* Cloud nine: a warm sun with turning rays and a flare, soft clouds drifting at three depths, dandelion seeds floating up,
     a flock of birds in a V now and then, a plane drawing a trail that spreads and fades, and sometimes a faint rainbow */
  FX_LIVING['prize-clouds'] = function (s) {
    var Cl = [], Sd = [], Fk = null, nextF = 4, Pl = null, nextP = 8, i;
    for (i = 0; i < 10; i++) { var z = [0.5, 0.75, 1][i % 3]; Cl.push({ x: Math.random(), y: fxR(0.05, 0.95), z: z, n: 4 + (i % 3), sd: i * 17 }); } Cl.sort(function (a, b) { return a.z - b.z; });
    for (i = 0; i < 14; i++) { Sd.push({ x: Math.random(), y: Math.random(), p: fxR(0, 6), z: fxR(0.7, 1.3), sp: fxR(6, 14) }); }
    return function (t, dt) {
      var c = s.ctx, sx = s.w * 0.86, sy = s.h * 0.08, M = Math.max(s.w, s.h), j, rb = Math.max(0, Math.sin(t * 0.05 - 1)) * 0.5;
      /* the sun, its rays turning, and a flare across the sky */
      fxGlow(c, '253,224,138', sx, sy, M * 0.38, 0.3); fxGlow(c, '255,251,235', sx, sy, 70, 0.95);
      for (j = 0; j < 12; j++) { lkBeam(c, sx, sy, t * 0.03 + j / 12 * FX_TAU, M * 0.7, 0.025 + 0.01 * (j % 2), '255,253,240', 0.45); }
      [[0.35, 26, '253,186,116'], [0.55, 14, '147,197,253'], [0.8, 40, '196,181,253'], [1.1, 18, '253,224,138']].forEach(function (f) { var fx = sx + (s.w * 0.4 - sx) * f[0], fy = sy + (s.h * 0.6 - sy) * f[0]; c.fillStyle = 'rgba(' + f[2] + ',.12)'; c.beginPath(); for (var m = 0; m < 6; m++) { var a = m / 6 * FX_TAU; if (m) { c.lineTo(fx + Math.cos(a) * f[1], fy + Math.sin(a) * f[1]); } else { c.moveTo(fx + Math.cos(a) * f[1], fy + Math.sin(a) * f[1]); } } c.fill(); });
      /* a faint rainbow that comes and goes in a corner */
      if (rb > 0.02) { ['239,68,68', '249,115,22', '250,204,21', '34,197,94', '59,130,246', '99,102,241', '168,85,247'].forEach(function (col, n) { c.strokeStyle = 'rgba(' + col + ',' + 0.22 * rb + ')'; c.lineWidth = 7; c.beginPath(); c.arc(0, s.h, Math.min(s.w, s.h) * 0.55 - n * 7, -Math.PI / 2, 0); c.stroke(); }); }
      /* the clouds: shaded underneath, at three depths */
      Cl.forEach(function (q) {
        var W = 150 * q.z * Math.min(1.4, Math.max(0.8, s.w / 800)), x = ((q.x * (s.w + W * 2) + t * (3 + 9 * q.z)) % (s.w + W * 2)) - W, y = q.y * s.h, k;
        for (k = 0; k < q.n; k++) { var px = x + (k - (q.n - 1) / 2) * W * 0.32, pr = W * (0.22 + 0.14 * fxRnd(q.sd + k)) * (k === Math.floor(q.n / 2) ? 1.3 : 1); c.fillStyle = 'rgba(176,200,226,' + 0.35 * q.z + ')'; c.beginPath(); c.arc(px, y + 8 * q.z - pr * 0.2, pr, 0, FX_TAU); c.fill(); }
        for (k = 0; k < q.n; k++) { var px2 = x + (k - (q.n - 1) / 2) * W * 0.32, pr2 = W * (0.22 + 0.14 * fxRnd(q.sd + k)) * (k === Math.floor(q.n / 2) ? 1.3 : 1), g = c.createRadialGradient(px2 - pr2 * 0.3, y - pr2 * 0.6, 1, px2, y - pr2 * 0.25, pr2); g.addColorStop(0, 'rgba(255,255,255,' + (0.7 + 0.3 * q.z) + ')'); g.addColorStop(1, 'rgba(240,247,255,' + (0.55 + 0.4 * q.z) + ')'); c.fillStyle = g; c.beginPath(); c.arc(px2, y - pr2 * 0.25, pr2, 0, FX_TAU); c.fill(); }
        c.fillStyle = 'rgba(248,251,255,' + (0.55 + 0.4 * q.z) + ')'; c.beginPath(); fxRR(c, x - W * 0.62, y - W * 0.12, W * 1.24, W * 0.16, W * 0.08); c.fill();
      });
      /* dandelion seeds drifting up */
      Sd.forEach(function (q) { var x = ((q.x * s.w + Math.sin(t * 0.4 + q.p) * 30 + t * 8) % (s.w + 40)) - 20, y = ((q.y * s.h - t * q.sp) % (s.h + 40) + s.h + 40) % (s.h + 40) - 20, a = Math.sin(t * 0.7 + q.p) * 0.4; c.save(); c.translate(x, y); c.rotate(a); c.strokeStyle = 'rgba(100,116,139,.45)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 9 * q.z); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.95)'; for (var m = 0; m < 9; m++) { var fa = -Math.PI / 2 + (m - 4) * 0.32; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(fa) * 7 * q.z, Math.sin(fa) * 7 * q.z); c.stroke(); } c.fillStyle = 'rgba(148,163,184,.8)'; c.beginPath(); c.arc(0, 9 * q.z, 1.1, 0, FX_TAU); c.fill(); c.restore(); });
      /* a flock in a V */
      if (!Fk && t > nextF) { Fk = { x: -60, y: fxR(0.12, 0.55) * s.h }; } if (Fk) { Fk.x += dt * 46; c.strokeStyle = 'rgba(30,58,95,.5)'; c.lineWidth = 1.5; c.lineCap = 'round'; for (j = 0; j < 7; j++) { var row = Math.ceil(j / 2), sd = j % 2 ? 1 : -1, x = Fk.x - row * 16, y = Fk.y + (j ? sd * row * 10 : 0) + Math.sin(t * 1.2) * 6, f = Math.sin(t * 7 + j) * 4; c.beginPath(); c.moveTo(x - 8, y - f); c.quadraticCurveTo(x - 4, y - 3, x, y); c.quadraticCurveTo(x + 4, y - 3, x + 8, y - f); c.stroke(); } if (Fk.x > s.w + 120) { Fk = null; nextF = t + fxR(12, 20); } }
      /* a plane and its trail, spreading and fading */
      if (!Pl && t > nextP) { Pl = { x: s.w + 30, y: fxR(0.06, 0.3) * s.h, tr: [] }; } if (Pl) { Pl.x -= dt * 60; Pl.tr.push([Pl.x + 6, Pl.y, 0]); Pl.tr.forEach(function (q) { q[2] += dt; }); Pl.tr = Pl.tr.filter(function (q) { return q[2] < 9; }); Pl.tr.forEach(function (q, m) { if (m % 4) { return; } c.fillStyle = 'rgba(255,255,255,' + 0.5 * (1 - q[2] / 9) + ')'; c.beginPath(); c.arc(q[0], q[1] + q[2] * 0.6, 1.5 + q[2] * 1.4, 0, FX_TAU); c.fill(); }); c.fillStyle = 'rgba(71,85,105,.7)'; c.beginPath(); c.moveTo(Pl.x - 7, Pl.y); c.lineTo(Pl.x + 7, Pl.y - 1); c.lineTo(Pl.x + 7, Pl.y + 1); c.closePath(); c.fill(); c.fillRect(Pl.x - 1, Pl.y - 4, 2, 8); if (Pl.x < -200) { Pl = null; nextP = t + fxR(18, 30); } }
    };
  };
  /* Lily pond: light ripples on green water and clouds drift across its surface; lily pads float, lotus flowers open and close;
     koi glide beneath with their fins waving; a frog sits on a pad and now and then leaps to another; water striders skate; a
     dragonfly hovers and darts; and now and then a shower passes, rings spreading everywhere */
  FX_LIVING['prize-pond'] = function (s) {
    var Pd = [], Ko = [], Rp = [], Ws = [], i, nextR = 2, Df = { x: 0.3, y: 0.3, tx: 0.3, ty: 0.3, wait: 0 }, Fr = { p: 0, to: 1, jump: -1, next: 4 }, o1 = {};
    for (i = 0; i < 10; i++) { Pd.push({ x: Math.random(), y: Math.random(), r: fxR(18, 34), a: fxR(0, FX_TAU), fl: i < 3, ph: fxR(0, 6) }); }
    for (i = 0; i < 5; i++) { Ko.push({ cx: fxR(0.2, 0.8), cy: fxR(0.2, 0.8), rx: fxR(0.15, 0.35), ry: fxR(0.1, 0.25), sp: fxR(0.05, 0.09) * (i % 2 ? 1 : -1), ph: fxR(0, 6), z: fxR(0.8, 1.25), w: i % 3 === 0 }); }
    for (i = 0; i < 3; i++) { Ws.push({ x: Math.random(), y: Math.random(), a: fxR(0, FX_TAU), wait: 0 }); }
    function pad(p, t) { return [((p.x * s.w + Math.sin(t * 0.07 + p.ph) * 30) % s.w + s.w) % s.w, ((p.y * s.h + t * 2) % (s.h + 80)) - 40]; }
    return function (t, dt) {
      var c = s.ctx, j, shower = (t % 40) > 32 ? Math.sin(((t % 40) - 32) / 8 * Math.PI) : 0;
      /* the water: drifting reflections of clouds, and a web of light */
      for (j = 0; j < 4; j++) { var cx = ((t * 6 + j * s.w * 0.4) % (s.w + 400)) - 200, cy = s.h * (0.15 + j * 0.22); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(cx, cy, 120, 26, 0, 0, FX_TAU); c.ellipse(cx + 70, cy + 6, 70, 18, 0, 0, FX_TAU); c.fill(); }
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.1; for (j = 0; j < 26; j++) { var wy = ((j * 61) % 97) / 97 * s.h, wx = ((j * 37) % 89) / 89 * s.w + Math.sin(t * 0.4 + j) * 20; c.beginPath(); c.moveTo(wx - 34, wy); c.bezierCurveTo(wx - 12, wy - 6 + Math.sin(t + j) * 3, wx + 12, wy + 5 - Math.sin(t * 1.3 + j) * 3, wx + 34, wy); c.stroke(); }
      /* koi, under the pads, fins waving */
      Ko.forEach(function (k) {
        var u = t * k.sp + k.ph, x = (k.cx + Math.cos(u) * k.rx) * s.w, y = (k.cy + Math.sin(u * 2) * k.ry) * s.h, dx = -Math.sin(u) * k.rx * s.w * k.sp, dy = Math.cos(u * 2) * 2 * k.ry * s.h * k.sp, an = Math.atan2(dy, dx), z = 15 * k.z, wag = Math.sin(t * 6 + k.ph) * 0.35;
        c.save(); c.translate(x, y); c.rotate(an); c.globalAlpha = 0.32;
        c.fillStyle = 'rgba(15,60,40,.18)'; c.beginPath(); c.ellipse(4, 6, z * 1.2, z * 0.42, 0, 0, FX_TAU); c.fill();
        c.fillStyle = '#FB923C'; c.beginPath(); c.moveTo(-z * 1.1, 0); c.quadraticCurveTo(-z * 1.6, -z * 0.2 + wag * z, -z * 2, -z * 0.55 + wag * z); c.quadraticCurveTo(-z * 1.7, wag * z * 0.4, -z * 2, z * 0.55 + wag * z); c.quadraticCurveTo(-z * 1.6, z * 0.2 + wag * z, -z * 1.1, 0); c.fill();
        var kg = c.createLinearGradient(0, -z * 0.4, 0, z * 0.4); kg.addColorStop(0, k.w ? '#FFFFFF' : '#FDBA74'); kg.addColorStop(1, k.w ? '#E2E8F0' : '#EA580C'); c.fillStyle = kg; c.beginPath(); c.ellipse(0, 0, z * 1.2, z * 0.42, 0, 0, FX_TAU); c.fill();
        c.fillStyle = k.w ? '#EF4444' : '#FFFFFF'; c.beginPath(); c.ellipse(z * 0.3, -z * 0.05, z * 0.38, z * 0.24, 0.3, 0, FX_TAU); c.fill(); c.beginPath(); c.ellipse(-z * 0.5, z * 0.08, z * 0.28, z * 0.18, -0.2, 0, FX_TAU); c.fill();
        c.fillStyle = 'rgba(249,115,22,.75)'; [-1, 1].forEach(function (sd) { c.beginPath(); c.ellipse(z * 0.4, sd * z * 0.45, z * 0.32, z * 0.12, sd * (0.6 + Math.sin(t * 5 + k.ph) * 0.3), 0, FX_TAU); c.fill(); });
        c.restore(); c.globalAlpha = 1;
      });
      /* rings: where a fish touches the surface, where a strider steps, and everywhere in a shower */
      if (t > nextR || t < nextR - 10) { nextR = t + fxR(1.5, 4); var k0 = Ko[Math.floor(Math.random() * Ko.length)], u0 = t * k0.sp + k0.ph; Rp.push({ x: (k0.cx + Math.cos(u0) * k0.rx) * s.w, y: (k0.cy + Math.sin(u0 * 2) * k0.ry) * s.h, l: 0, n: 3 }); }
      lkEvery(o1, shower * Math.max(6, s.w * s.h / 30000), dt, function () { Rp.push({ x: Math.random() * s.w, y: Math.random() * s.h, l: 0, n: 2, sm: 1 }); });
      for (j = Rp.length - 1; j >= 0; j--) { var r = Rp[j]; r.l += dt; if (r.l > 3) { Rp.splice(j, 1); continue; } for (var m = 0; m < r.n; m++) { var v = r.l - m * 0.35; if (v > 0) { c.strokeStyle = 'rgba(15,118,110,' + 0.35 * (1 - r.l / 3) + ')'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(r.x, r.y, v * (r.sm ? 14 : 26), v * (r.sm ? 6 : 11), 0, 0, FX_TAU); c.stroke(); } } }
      /* lily pads, some in flower, opening and closing */
      Pd.forEach(function (p) {
        var q = pad(p, t), x = q[0], y = q[1], a = p.a + Math.sin(t * 0.2 + p.ph) * 0.2; c.globalAlpha = 0.42;
        c.fillStyle = 'rgba(0,0,0,.06)'; c.beginPath(); c.ellipse(x + 3, y + 4, p.r, p.r * 0.8, 0, 0, FX_TAU); c.fill();
        var pg = c.createRadialGradient(x - p.r * 0.3, y - p.r * 0.3, 2, x, y, p.r); pg.addColorStop(0, '#6BBF7A'); pg.addColorStop(1, '#3F8A4E'); c.fillStyle = pg; c.beginPath(); c.moveTo(x, y); c.ellipse(x, y, p.r, p.r * 0.8, 0, a + 0.35, a + FX_TAU - 0.05); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(21,83,45,.45)'; c.lineWidth = 1; for (var q2 = 0; q2 < 7; q2++) { var va = a + 0.6 + q2 * 0.8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(va) * p.r * 0.85, y + Math.sin(va) * p.r * 0.68); c.stroke(); }
        c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(x + p.r * 0.35, y - p.r * 0.2, 1.6, 0, FX_TAU); c.fill();
        if (p.fl) { var op = 0.55 + 0.45 * Math.sin(t * 0.15 + p.ph); for (q2 = 0; q2 < 10; q2++) { var pa = q2 / 10 * FX_TAU + t * 0.05, rr = 5 + 4 * op; c.fillStyle = q2 % 2 ? '#F9A8D4' : '#F472B6'; c.beginPath(); c.ellipse(x + Math.cos(pa) * rr, y - 4 + Math.sin(pa) * rr * 0.7, 7 * (0.6 + 0.4 * op), 3.4, pa, 0, FX_TAU); c.fill(); } c.fillStyle = '#FDE047'; c.beginPath(); c.arc(x, y - 5, 3.4, 0, FX_TAU); c.fill(); }
        c.globalAlpha = 1;
      });
      /* the frog: sits on a pad, throat pulsing, and leaps to another */
      Fr.next -= dt; if (Fr.jump < 0 && Fr.next < 0) { Fr.jump = 0; Fr.to = (Fr.p + 1 + Math.floor(Math.random() * 3)) % Pd.length; }
      var A = pad(Pd[Fr.p], t), fx, fy, fz = 1;
      if (Fr.jump >= 0) { Fr.jump += dt / 0.6; var B2 = pad(Pd[Fr.to], t), u2 = Math.min(1, Fr.jump); fx = A[0] + (B2[0] - A[0]) * u2; fy = A[1] + (B2[1] - A[1]) * u2 - Math.sin(u2 * Math.PI) * 60; fz = 1 + Math.sin(u2 * Math.PI) * 0.3; if (u2 >= 1) { Fr.p = Fr.to; Fr.jump = -1; Fr.next = fxR(6, 12); Rp.push({ x: B2[0], y: B2[1], l: 0, n: 3 }); } } else { fx = A[0]; fy = A[1]; }
      c.save(); c.translate(fx, fy - 3); c.scale(fz, fz); c.globalAlpha = 0.7; c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(2, 6, 9, 4, 0, 0, FX_TAU); c.fill(); c.fillStyle = '#65A30D'; c.beginPath(); c.ellipse(0, 0, 8, 6.5, 0, 0, FX_TAU); c.fill(); c.fillStyle = '#84CC16'; c.beginPath(); c.ellipse(-4, -5, 3, 3, 0, 0, FX_TAU); c.ellipse(4, -5, 3, 3, 0, 0, FX_TAU); c.fill(); c.fillStyle = '#111827'; c.beginPath(); c.arc(-4, -5.5, 1.3, 0, FX_TAU); c.arc(4, -5.5, 1.3, 0, FX_TAU); c.fill(); c.fillStyle = 'rgba(254,249,195,' + (0.5 + 0.4 * Math.sin(t * 8)) + ')'; c.beginPath(); c.ellipse(0, 3, 3.5 + Math.sin(t * 8), 2.4, 0, 0, FX_TAU); c.fill(); c.restore(); c.globalAlpha = 1;
      /* water striders */
      Ws.forEach(function (w) { w.wait -= dt; if (w.wait < 0) { w.a += fxR(-1.5, 1.5); w.wait = fxR(0.8, 2); w.dash = 0.25; } w.dash = Math.max(0, (w.dash || 0) - dt); var v2 = w.dash > 0 ? 120 : 6; w.x = ((w.x + Math.cos(w.a) * v2 * dt / s.w) % 1 + 1) % 1; w.y = ((w.y + Math.sin(w.a) * v2 * dt / s.h) % 1 + 1) % 1; var x = w.x * s.w, y = w.y * s.h; c.strokeStyle = 'rgba(30,41,59,.6)'; c.lineWidth = 0.8; for (var m2 = 0; m2 < 3; m2++) { var la = w.a + (m2 - 1) * 0.9; [1, -1].forEach(function (sd) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(la + sd * Math.PI / 2) * 8, y + Math.sin(la + sd * Math.PI / 2) * 8); c.stroke(); c.strokeStyle = 'rgba(15,118,110,.25)'; c.beginPath(); c.arc(x + Math.cos(la + sd * Math.PI / 2) * 8, y + Math.sin(la + sd * Math.PI / 2) * 8, 2, 0, FX_TAU); c.stroke(); c.strokeStyle = 'rgba(30,41,59,.6)'; }); } c.fillStyle = '#1E293B'; c.beginPath(); c.ellipse(x, y, 3.5, 1.2, w.a, 0, FX_TAU); c.fill(); });
      /* a dragonfly: hovers, then darts somewhere new */
      Df.wait -= dt; if (Df.wait < 0) { Df.tx = fxR(0.05, 0.95); Df.ty = fxR(0.05, 0.95); Df.wait = fxR(2, 5); }
      Df.x += (Df.tx - Df.x) * Math.min(1, dt * 3); Df.y += (Df.ty - Df.y) * Math.min(1, dt * 3);
      var dx2 = Df.x * s.w + Math.sin(t * 9) * 1.5, dy2 = Df.y * s.h + Math.cos(t * 7) * 1.5, ang = Math.atan2(Df.ty - Df.y, Df.tx - Df.x + 0.0001);
      c.save(); c.translate(dx2, dy2); c.rotate(ang); var wf = Math.abs(Math.sin(t * 45)); [[-1, 2], [1, 2], [-1, -3], [1, -3]].forEach(function (w2, m) { var wg = c.createLinearGradient(0, 0, 0, w2[0] * 10); wg.addColorStop(0, 'rgba(165,243,252,.65)'); wg.addColorStop(1, 'rgba(216,180,254,.45)'); c.fillStyle = wg; c.beginPath(); c.ellipse(w2[1], w2[0] * 9 * (0.6 + 0.4 * wf), 3, 9.5, 0, 0, FX_TAU); c.fill(); });
      c.strokeStyle = '#0E7490'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-17, 0); c.lineTo(6, 0); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 0.8; for (var m3 = -14; m3 < 4; m3 += 4) { c.beginPath(); c.moveTo(m3, -1); c.lineTo(m3, 1); c.stroke(); } c.fillStyle = '#0891B2'; c.beginPath(); c.arc(8, 0, 3.2, 0, FX_TAU); c.fill(); c.restore();
    };
  };
  /* Mycelium: threads of light run along the bottom of the page and pulse; glowing mushrooms grow in clusters, breathing, and a
     wave of light passes through the whole colony every few seconds; shelf fungi climb both edges; glowing roots hang from the
     top and drip light; moths circle the brightest caps; a glowing snail leaves a trail; caps puff out clouds of spores */
  FX_LIVING['prize-mycelium'] = function (s) {
    var W0 = 0, H0 = 0, Th = [], Mu = [], Sp = [], Sh = [], Rt = [], Mo = [], Dr = [], o1 = {}, o2 = {}, nextP = 3, sn = { x: 0.1 }, i;
    for (i = 0; i < 4; i++) { Mo.push({ a: fxR(0, FX_TAU), r: fxR(20, 46), sp: fxR(1.2, 2.2) * (i % 2 ? 1 : -1), m: i, ph: fxR(0, 6) }); }
    function build() {
      W0 = s.w; H0 = s.h; Th = []; Mu = []; Sh = []; Rt = []; var n = 0, i2, j;
      function grow(x, y, a, len, d) { var pts = [[x, y]], q; for (q = 0; q < len; q++) { a += (fxRnd(n++) - 0.5) * 0.9; a = Math.max(-Math.PI * 0.95, Math.min(-Math.PI * 0.05, a)); x += Math.cos(a) * 14; y += Math.sin(a) * 10 + 2; pts.push([x, y]); if (d < 2 && fxRnd(n++) > 0.8) { grow(x, y, a + (fxRnd(n++) > 0.5 ? 0.8 : -0.8), Math.floor(len / 2), d + 1); } } Th.push({ p: pts, ph: fxRnd(n++) * 6 }); }
      var nt = Math.max(4, Math.round(s.w / 140)); for (i2 = 0; i2 < nt; i2++) { grow((i2 + 0.5) / nt * s.w, s.h + 4, -Math.PI / 2 + (fxRnd(i2 + 900) - 0.5), 9, 0); }
      [[0.04, 1], [0.12, 0.8], [0.9, 1], [0.97, 0.7], [0.5, 0.6], [0.3, 0.5], [0.72, 0.55]].forEach(function (q, m) { var cnt = 2 + (m % 3); for (j = 0; j < cnt; j++) { Mu.push({ x: q[0] * s.w + (j - cnt / 2) * 16 + fxRnd(m * 9 + j) * 10, h: (20 + fxRnd(m * 7 + j) * 40) * q[1], r: (8 + fxRnd(m * 5 + j) * 14) * q[1], col: (m + j) % 3 === 0 ? '240,171,252' : '94,234,212', ph: fxRnd(m * 3 + j) * 6 }); } });
      Mu.sort(function (a, b) { return a.h - b.h; });
      for (i2 = 0; i2 < 10; i2++) { var sd = i2 % 2 ? 1 : -1; Sh.push({ sd: sd, y: (0.12 + 0.8 * fxRnd(i2 + 300)) * s.h, r: 6 + fxRnd(i2 + 310) * 8, col: i2 % 3 ? '94,234,212' : '240,171,252', ph: fxRnd(i2 + 320) * 6 }); }
      for (i2 = 0; i2 < Math.max(5, Math.round(s.w / 120)); i2++) { var rx = (i2 + 0.3 + fxRnd(i2 + 500) * 0.4) / Math.max(5, Math.round(s.w / 120)) * s.w, pts2 = [[rx, -2]], yy = 0, xx = rx; for (j = 0; j < 6; j++) { yy += 10 + fxRnd(i2 * 7 + j) * 14; xx += (fxRnd(i2 * 11 + j) - 0.5) * 16; pts2.push([xx, yy]); } Rt.push({ p: pts2, ph: fxRnd(i2) * 6 }); }
    }
    return function (t, dt) {
      if (s.w !== W0 || s.h !== H0) { build(); }
      var c = s.ctx, j, wave = (t % 7) / 7 * (s.w + 400) - 200;
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '13,148,136', s.w / 2, s.h + 40, s.w * 0.7, 0.22); fxGlow(c, '192,38,211', s.w * 0.15, s.h, s.w * 0.3, 0.12); fxGlow(c, '192,38,211', s.w * 0.85, s.h, s.w * 0.3, 0.12);
      /* roots hanging from the top, drops of light running down and falling */
      c.lineCap = 'round'; Rt.forEach(function (r) { c.strokeStyle = 'rgba(94,234,212,.16)'; c.lineWidth = 1.6; c.beginPath(); fxTrace(c, r.p.map(function (p) { return [p[0] + Math.sin(t * 0.5 + r.ph + p[1] * 0.02) * 3, p[1]]; })); c.stroke(); var tip = r.p[r.p.length - 1], du = ((t * 0.4 + r.ph) % 2.5) / 2.5; if (du < 0.7) { fxGlow(c, '153,246,228', tip[0], tip[1] + du * 6, 3 + du * 3, du * 1.2); } else if (!r.fell || r.fell < Math.floor(t * 0.4 / 2.5 + r.ph)) { r.fell = Math.floor(t * 0.4 / 2.5 + r.ph); Dr.push({ x: tip[0], y: tip[1] + 6, vx: 0, vy: 0, l: 0, m: 3 }); } });
      lkStep(Dr, dt, 300, 0, function (d) { fxGlow(c, '153,246,228', d.x, d.y, 3, 0.8); if (d.y > s.h) { d.l = d.m; } });
      /* threads, with light running along them */
      Th.forEach(function (th) { c.strokeStyle = 'rgba(94,234,212,.22)'; c.lineWidth = 1.2; c.beginPath(); fxTrace(c, th.p); c.stroke(); var u = ((t * 0.35 + th.ph) % 1.6) / 1.6, idx = Math.floor(u * (th.p.length - 1)), q = th.p[Math.min(th.p.length - 1, th.p.length - 1 - idx)]; fxGlow(c, '153,246,228', q[0], q[1], 7, 0.8); });
      /* shelf fungi up both edges */
      Sh.forEach(function (f) { var x = f.sd < 0 ? 0 : s.w, wv = Math.max(0, 1 - Math.abs(x - wave) / 220), pu = 0.6 + 0.4 * Math.sin(t * 1.1 + f.ph) + 0.6 * wv; c.globalCompositeOperation = 'lighter'; fxGlow(c, f.col, x, f.y, f.r * 3, 0.3 * pu); c.globalCompositeOperation = 'source-over';
        for (var q = 0; q < 3; q++) { var yy = f.y + q * f.r * 0.7, rr = f.r * (1 - q * 0.22); c.fillStyle = 'rgba(' + f.col + ',' + Math.min(1, 0.75 - q * 0.15 + 0.2 * wv) + ')'; c.beginPath(); c.ellipse(x, yy, rr, rr * 0.38, 0, f.sd < 0 ? -Math.PI / 2 : Math.PI / 2, f.sd < 0 ? Math.PI / 2 : Math.PI * 1.5); c.fill(); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(x, yy, rr * 0.7, rr * 0.25, 0, f.sd < 0 ? -Math.PI / 2 : Math.PI / 2, f.sd < 0 ? Math.PI / 2 : Math.PI * 1.5); c.stroke(); } });
      /* mushrooms: stems, glowing caps with spots and gills, breathing, lit by the passing wave */
      Mu.forEach(function (m) {
        var wv = Math.max(0, 1 - Math.abs(m.x - wave) / 160), br = 1 + 0.05 * Math.sin(t * 0.9 + m.ph), x = m.x + Math.sin(t * 0.6 + m.ph) * 1.5, by = s.h + 2, ty = by - m.h * br, r = m.r * br, pu = 0.6 + 0.4 * Math.sin(t * 1.4 + m.ph) + 0.8 * wv;
        c.globalCompositeOperation = 'source-over'; var sg = c.createLinearGradient(0, ty, 0, by); sg.addColorStop(0, 'rgba(204,251,241,.7)'); sg.addColorStop(1, 'rgba(94,234,212,.25)'); c.strokeStyle = sg; c.lineWidth = Math.max(2, r * 0.28); c.beginPath(); c.moveTo(m.x, by); c.quadraticCurveTo(m.x + Math.sin(m.ph) * 6, (by + ty) / 2, x, ty); c.stroke();
        c.globalCompositeOperation = 'lighter'; fxGlow(c, m.col, x, ty, r * 2.8, 0.32 * pu);
        c.globalCompositeOperation = 'source-over'; var cg = c.createLinearGradient(0, ty - r, 0, ty); cg.addColorStop(0, 'rgba(' + m.col + ',.95)'); cg.addColorStop(1, 'rgba(' + m.col + ',.45)'); c.fillStyle = cg; c.beginPath(); c.ellipse(x, ty, r, r * 0.62, 0, Math.PI, FX_TAU); c.quadraticCurveTo(x, ty + r * 0.18, x - r, ty); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 0.6; for (j = -3; j <= 3; j++) { c.beginPath(); c.moveTo(x + j * r * 0.25, ty + 0.5); c.lineTo(x + j * r * 0.1, ty + r * 0.14); c.stroke(); }
        c.fillStyle = 'rgba(255,255,255,.55)'; for (j = 0; j < 3; j++) { c.beginPath(); c.arc(x - r * 0.4 + j * r * 0.4, ty - r * (0.3 + 0.12 * (j % 2)), r * 0.08, 0, FX_TAU); c.fill(); }
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '255,255,255', x, ty + 1, r * 0.6, 0.35 * pu);
      });
      /* moths circling the brightest caps */
      c.globalCompositeOperation = 'source-over'; Mo.forEach(function (mo) { var host = Mu[(mo.m * 5 + 3) % Mu.length], hx = host.x, hy = s.h + 2 - host.h - host.r; mo.a += mo.sp * dt; var x = hx + Math.cos(mo.a) * mo.r, y = hy - 10 + Math.sin(mo.a * 1.3) * mo.r * 0.5, f = Math.abs(Math.sin(t * 22 + mo.ph)); c.globalCompositeOperation = 'lighter'; fxGlow(c, '240,171,252', x, y, 6, 0.35); c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(240,253,250,.75)'; [-1, 1].forEach(function (sd) { c.beginPath(); c.ellipse(x + sd * 3 * f, y, 3.2 * (0.3 + 0.7 * f), 4, sd * 0.4, 0, FX_TAU); c.fill(); }); });
      /* a glowing snail along the bottom, with its trail */
      sn.x += dt * 0.004; if (sn.x > 1.05) { sn.x = -0.05; } var snx = sn.x * s.w, sny = s.h - 6; c.globalCompositeOperation = 'lighter'; var tg = c.createLinearGradient(snx - 120, 0, snx, 0); tg.addColorStop(0, 'rgba(153,246,228,0)'); tg.addColorStop(1, 'rgba(153,246,228,.45)'); c.strokeStyle = tg; c.lineWidth = 2; c.beginPath(); c.moveTo(snx - 120, sny + 2); c.lineTo(snx, sny + 2); c.stroke(); c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(204,251,241,.8)'; c.beginPath(); c.ellipse(snx + 2, sny, 9, 3, 0, 0, FX_TAU); c.fill(); c.strokeStyle = 'rgba(204,251,241,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(snx + 9, sny - 1); c.lineTo(snx + 12, sny - 8); c.moveTo(snx + 7, sny - 1); c.lineTo(snx + 8, sny - 7); c.stroke(); var shg = c.createRadialGradient(snx - 2, sny - 6, 1, snx, sny - 5, 7); shg.addColorStop(0, '#F5D0FE'); shg.addColorStop(1, '#C026D3'); c.fillStyle = shg; c.beginPath(); c.arc(snx, sny - 5, 6, 0, FX_TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(snx, sny - 5, 3, 0, Math.PI * 1.5); c.stroke(); c.globalCompositeOperation = 'lighter'; fxGlow(c, '240,171,252', snx, sny - 5, 14, 0.4);
      /* spores drift up; now and then a cap puffs out a cloud of them */
      lkEvery(o1, Math.max(4, s.w / 100), dt, function () { var m = Mu[Math.floor(Math.random() * Mu.length)]; Sp.push({ x: m.x + fxR(-m.r, m.r), y: s.h - m.h, vx: fxR(-6, 6), vy: fxR(-26, -10), l: 0, m: fxR(5, 10), col: m.col }); });
      lkEvery(o2, Math.max(2, s.w * s.h / 120000), dt, function () { Sp.push({ x: Math.random() * s.w, y: s.h * fxR(0.3, 1), vx: fxR(-4, 4), vy: fxR(-14, -5), l: 0, m: fxR(5, 9), col: Math.random() < 0.7 ? '94,234,212' : '240,171,252' }); });
      if (t > nextP || t < nextP - 10) { nextP = t + fxR(3, 7); var mp = Mu[Math.floor(Math.random() * Mu.length)]; for (j = 0; j < 30; j++) { var a = fxR(-Math.PI, 0), v = fxR(20, 80); Sp.push({ x: mp.x, y: s.h - mp.h - mp.r * 0.4, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0, m: fxR(3, 6), col: mp.col }); } }
      lkStep(Sp, dt, -6, 0.6, function (q, f) { q.x += Math.sin(t + q.m * 7) * 4 * dt; fxGlow(c, q.col, q.x, q.y, 2.4, Math.sin(f * Math.PI) * 0.8); });
      if (Sp.length > 400) { Sp.splice(0, Sp.length - 400); }
      c.globalCompositeOperation = 'source-over';
    };
  };
  /* Dunes: night over the desert. A huge moon and the Milky Way; now and then a shower of falling stars. Dunes in layers, lit on
     the moon's side, rippled, sand streaming off their crests; a ruined arch on a far ridge; a caravan of camels and riders with
     a swinging lantern on the far crest; a fennec fox on the near dune, ears twitching, eyes catching the light; sometimes a
     veil of blowing sand sweeps across */
  FX_LIVING['prize-dunes'] = function (s) {
    var St = [], Mw = [], Sd = [], o1 = {}, Sh = [], nextS = 5, i;
    for (i = 0; i < 100; i++) { St.push({ x: Math.random(), y: Math.random() * 0.6, p: fxR(0, 6), z: fxR(0.5, 1.4) }); }
    for (i = 0; i < 160; i++) { var u0 = Math.random(); Mw.push({ x: u0, y: 0.05 + u0 * 0.35 + (Math.random() + Math.random() - 1) * 0.06, z: fxR(0.3, 1) }); }
    function crest(L, x) { return s.h * (0.7 + L * 0.09) - Math.sin(x * 0.006 + L * 2.1) * s.h * 0.035 - Math.sin(x * 0.013 + L) * s.h * 0.02; }
    function camel(c, x, y, z, t, ph, rider) {
      var st = Math.sin(t * 3 + ph), j, bob = Math.abs(st) * 1.2 * z; c.beginPath(); c.ellipse(x, y - 14 * z - bob, 13 * z, 6 * z, 0, 0, FX_TAU); c.fill(); c.beginPath(); c.ellipse(x - 1 * z, y - 20 * z - bob, 6 * z, 5 * z, 0, Math.PI, FX_TAU); c.fill();
      c.lineCap = 'round'; c.lineWidth = 3 * z; c.beginPath(); c.moveTo(x + 10 * z, y - 15 * z - bob); c.quadraticCurveTo(x + 18 * z, y - 18 * z - bob, x + 17 * z, y - 26 * z - bob); c.stroke(); c.beginPath(); c.ellipse(x + 19 * z, y - 26 * z - bob, 4 * z, 2.4 * z, 0.2, 0, FX_TAU); c.fill();
      c.lineWidth = 2 * z; for (j = 0; j < 4; j++) { var lx = x + (j < 2 ? 8 : -8) * z + (j % 2 ? 2 : -2) * z, sw = (j % 2 ? st : -st) * 3 * z; c.beginPath(); c.moveTo(lx, y - 10 * z - bob); c.lineTo(lx + sw * 0.6, y - 5 * z); c.lineTo(lx + sw, y); c.stroke(); }
      c.lineWidth = 1.2 * z; c.beginPath(); c.moveTo(x - 13 * z, y - 15 * z - bob); c.quadraticCurveTo(x - 17 * z, y - 10 * z, x - 15 * z + Math.sin(t * 2 + ph) * 2, y - 6 * z); c.stroke();
      if (rider) { c.beginPath(); c.moveTo(x - 4 * z, y - 24 * z - bob); c.lineTo(x - 2 * z, y - 34 * z - bob); c.lineTo(x + 2 * z, y - 24 * z - bob); c.fill(); c.beginPath(); c.arc(x - 1.5 * z, y - 36 * z - bob, 2.6 * z, 0, FX_TAU); c.fill(); c.beginPath(); c.moveTo(x - 1.5 * z, y - 37 * z - bob); c.quadraticCurveTo(x - 8 * z, y - 36 * z - bob + Math.sin(t * 4 + ph) * 1.5 * z, x - 11 * z, y - 31 * z - bob); c.lineWidth = 1.5 * z; c.stroke(); }
    }
    return function (t, dt) {
      var c = s.ctx, mx = s.w * 0.78, my = s.h * 0.2, mr = Math.min(s.w, s.h) * 0.11, L, x, j, storm = (t % 45) > 36 ? Math.sin(((t % 45) - 36) / 9 * Math.PI) : 0;
      c.globalCompositeOperation = 'lighter';
      Mw.forEach(function (q) { fxGlow(c, '221,214,254', q.x * s.w, q.y * s.h, 1 + q.z, 0.18 * q.z); }); fxGlow(c, '139,92,246', s.w * 0.4, s.h * 0.2, s.w * 0.3, 0.06);
      St.forEach(function (q) { fxGlow(c, '255,247,237', q.x * s.w, q.y * s.h, 1.6 * q.z, 0.25 + 0.35 * Math.sin(t * 1.4 + q.p)); });
      fxGlow(c, '253,230,138', mx, my, mr * 4, 0.16); c.globalCompositeOperation = 'source-over'; var mg = c.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, 2, mx, my, mr); mg.addColorStop(0, '#FFFBEB'); mg.addColorStop(1, '#F5E6C4'); c.fillStyle = mg; c.beginPath(); c.arc(mx, my, mr, 0, FX_TAU); c.fill(); c.fillStyle = 'rgba(180,140,90,.25)'; [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.16], [-0.05, 0.4, 0.12], [0.35, -0.35, 0.1]].forEach(function (q) { c.beginPath(); c.arc(mx + q[0] * mr, my + q[1] * mr, q[2] * mr, 0, FX_TAU); c.fill(); });
      /* falling stars, sometimes several at once */
      if (t > nextS || t < nextS - 20) { var burst = Math.random() < 0.3 ? 5 : 1; for (j = 0; j < burst; j++) { Sh.push({ x: fxR(0.05, 0.7) * s.w, y: fxR(0.03, 0.3) * s.h, l: -j * 0.25, m: 0.8 }); } nextS = t + fxR(6, 12); }
      c.globalCompositeOperation = 'lighter'; for (j = Sh.length - 1; j >= 0; j--) { var sh = Sh[j]; sh.l += dt; if (sh.l > sh.m) { Sh.splice(j, 1); continue; } if (sh.l < 0) { continue; } var u = sh.l / sh.m, hx = sh.x + u * 160, hy = sh.y + u * 70, g = c.createLinearGradient(hx - 90, hy - 40, hx, hy); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,' + Math.sin(u * Math.PI) + ')'); c.strokeStyle = g; c.lineWidth = 1.6; c.beginPath(); c.moveTo(hx - 90, hy - 40); c.lineTo(hx, hy); c.stroke(); fxGlow(c, '255,255,255', hx, hy, 3, Math.sin(u * Math.PI)); }
      c.globalCompositeOperation = 'source-over';
      for (L = 0; L < 3; L++) {
        var col = ['#2B1D3E', '#3A2340', '#4A2B3A'][L], rim = ['rgba(253,230,138,.25)', 'rgba(253,230,138,.32)', 'rgba(253,230,138,.4)'][L], top0 = s.h * (0.64 + L * 0.09);
        var dg = c.createLinearGradient(s.w, top0, 0, s.h); dg.addColorStop(0, ['#4A3666', '#5C3A60', '#704456'][L]); dg.addColorStop(1, col); c.fillStyle = dg; c.beginPath(); c.moveTo(0, s.h); for (x = 0; x <= s.w + 10; x += 10) { c.lineTo(x, crest(L, x + t * (1 + L))); } c.lineTo(s.w, s.h); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(253,230,138,' + (0.05 + L * 0.02) + ')'; c.lineWidth = 1; for (j = 1; j < 5; j++) { c.beginPath(); for (x = 0; x <= s.w + 20; x += 20) { var ry = crest(L, x + t * (1 + L)) + j * s.h * 0.018 + Math.sin(x * 0.05 + j * 2 + L) * 3; if (x) { c.lineTo(x, ry); } else { c.moveTo(x, ry); } } c.stroke(); }
        c.strokeStyle = rim; c.lineWidth = 1.2; c.beginPath(); for (x = 0; x <= s.w + 10; x += 10) { if (x) { c.lineTo(x, crest(L, x + t * (1 + L))); } else { c.moveTo(x, crest(L, x + t * (1 + L))); } } c.stroke();
        if (L === 0) {
          /* a ruined arch on the far ridge, and the caravan */
          var ax = s.w * 0.18, ay = crest(0, ax + t); c.fillStyle = '#120B1C'; c.fillRect(ax - 22, ay - 34, 7, 34); c.fillRect(ax + 15, ay - 26, 7, 26); c.beginPath(); c.moveTo(ax - 22, ay - 34); c.quadraticCurveTo(ax, ay - 52, ax + 22, ay - 28); c.lineTo(ax + 15, ay - 26); c.quadraticCurveTo(ax, ay - 42, ax - 15, ay - 32); c.fill(); c.fillRect(ax + 26, ay - 6, 10, 6);
          var cx = ((t * 9 + s.w * 0.45) % (s.w + 300)) - 150, z = Math.min(1.6, Math.max(1.15, s.w / 700)); c.fillStyle = '#120B1C'; c.strokeStyle = '#120B1C';
          for (j = 0; j < 4; j++) { var px = cx - j * 46 * z; camel(c, px, crest(0, px + t) + 2, z, t, j * 1.3, j !== 2); }
          c.globalCompositeOperation = 'lighter'; var sw = Math.sin(t * 3) * 0.3, lx2 = cx + 24 * z + Math.sin(sw) * 8 * z, ly2 = crest(0, cx + t) - 28 * z + Math.cos(sw) * 3 * z; c.strokeStyle = 'rgba(253,230,138,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx + 18 * z, crest(0, cx + t) - 28 * z); c.lineTo(lx2, ly2 - 4 * z); c.stroke(); fxGlow(c, '251,191,36', lx2, ly2, 28 * z, 0.5 + 0.15 * Math.sin(t * 9)); fxGlow(c, '255,247,205', lx2, ly2, 4 * z, 1); c.globalCompositeOperation = 'source-over';
        }
        if (L === 2) {
          /* the fennec fox on the near dune */
          var fx = s.w * 0.86, fy = crest(2, fx + t * 3) + 2, ft = Math.sin(t * 1.5) * 0.25, tw = (t % 5) < 0.2 ? 0.3 : 0; c.fillStyle = '#1A1020';
          c.beginPath(); c.ellipse(fx, fy - 8, 9, 7, 0, 0, FX_TAU); c.fill(); c.beginPath(); c.arc(fx + 2, fy - 18, 5.5, 0, FX_TAU); c.fill();
          c.beginPath(); c.moveTo(fx - 2, fy - 21); c.lineTo(fx - 7 - tw * 4, fy - 34); c.lineTo(fx + 1, fy - 23); c.fill(); c.beginPath(); c.moveTo(fx + 4, fy - 22); c.lineTo(fx + 10, fy - 35 + tw * 6); c.lineTo(fx + 7, fy - 20); c.fill();
          c.lineWidth = 4; c.lineCap = 'round'; c.strokeStyle = '#1A1020'; c.beginPath(); c.moveTo(fx - 8, fy - 5); c.quadraticCurveTo(fx - 20, fy - 6 + ft * 10, fx - 24, fy - 14 + ft * 12); c.stroke();
          c.globalCompositeOperation = 'lighter'; [[0, 0], [5, 0]].forEach(function (e2) { fxGlow(c, '253,230,138', fx + e2[0] - 0.5, fy - 18.5, 2.4, (t % 6) < 0.15 ? 0 : 0.9); }); c.globalCompositeOperation = 'source-over';
        }
      }
      /* sand blowing off the crests, and sometimes a veil of it sweeping across */
      lkEvery(o1, Math.max(10, s.w / 30) * (1 + storm * 3), dt, function () { var x0 = Math.random() * s.w, L0 = 1 + Math.floor(Math.random() * 2); Sd.push({ x: x0, y: crest(L0, x0 + t * (1 + L0)) - 1, vx: fxR(-60, -25) * (1 + storm * 2), vy: fxR(-14, -2), l: 0, m: fxR(0.8, 1.8) }); });
      c.globalCompositeOperation = 'lighter'; lkStep(Sd, dt, 8, 0, function (q, f) { fxGlow(c, '253,230,138', q.x, q.y, 1.6, 0.4 * Math.sin(f * Math.PI)); });
      if (Sd.length > 400) { Sd.splice(0, Sd.length - 400); }
      if (storm > 0) { for (j = 0; j < 5; j++) { fxGlow(c, '214,160,110', ((t * 80 + j * s.w / 3) % (s.w + 800)) - 400, s.h * (0.55 + j * 0.08), 280, 0.08 * storm); } }
      c.globalCompositeOperation = 'source-over';
    };
  };
  /* Glacier: inside an ice cave. Walls of faceted ice at both sides hold frozen shapes; icicles hang along the top, glinting,
     and drip; frost grows in from the corners and melts back; an aurora glows through the ice and light falls in shafts with
     snow dust in it; now and then a crack runs through the ice with a flash. And deep under the ice at the bottom, something
     opens a great eye, looks around, and closes it again; the icicles tremble while it looks */
  FX_LIVING['prize-glacier'] = function (s) {
    var W0 = 0, H0 = 0, Ic = [], Dr = [], Fr = [], Mo = [], Wl = [], Fz = [], Ck = null, nextCk = 9, i;
    for (i = 0; i < 46; i++) { Mo.push({ x: Math.random(), y: Math.random(), p: fxR(0, 6), z: fxR(2, 4.5), sp: fxR(0.004, 0.012) }); }
    function build() {
      W0 = s.w; H0 = s.h; Ic = []; Fr = []; Wl = []; Fz = []; var x = 0, n = 0, i2;
      while (x < s.w) { var w = 10 + fxRnd(n * 3) * 18; Ic.push({ x: x + w / 2, w: w, h: 20 + fxRnd(n * 3 + 1) * 70 * (fxRnd(n * 3 + 2) > 0.7 ? 1.8 : 1), ph: fxRnd(n * 7) * 6, drip: fxRnd(n * 5) * 4 }); x += w * 0.85; n++; }
      [[0, s.h, -Math.PI / 4], [s.w, 0, Math.PI * 0.75]].forEach(function (cr) {
        function br(x0, y0, a, len, d, dist) { var x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len; Fr.push([x0, y0, x1, y1, dist, dist + len]); if (d < 4) { var k2 = n++; br(x1, y1, a + 0.5, len * 0.62, d + 1, dist + len); br(x1, y1, a - 0.5, len * 0.62, d + 1, dist + len); if (fxRnd(k2) > 0.4) { br(x1, y1, a, len * 0.7, d + 1, dist + len); } } }
        for (i2 = 0; i2 < 5; i2++) { br(cr[0], cr[1], cr[2] + (i2 - 2) * 0.32, Math.min(s.w, s.h) * 0.09, 0, 0); }
      });
      /* facets of ice up both walls, and shapes frozen in them */
      [-1, 1].forEach(function (sd) { var y = -20; while (y < s.h + 20) { var hgt = 40 + fxRnd(n++) * 70, dep = 8 + fxRnd(n++) * 18; Wl.push({ sd: sd, y: y, h: hgt, d: dep, sh: fxRnd(n++) }); y += hgt * 0.8; } });
      for (i2 = 0; i2 < 4; i2++) { Fz.push({ sd: i2 % 2 ? 1 : -1, y: (0.2 + i2 * 0.2) * s.h, z: 10 + fxRnd(n++) * 8, k: i2 % 2 }); }
    }
    return function (t, dt) {
      if (s.w !== W0 || s.h !== H0) { build(); }
      var c = s.ctx, j, u;
      /* the eye's timing first: the icicles tremble while it looks */
      var ec = t % 30, open = ec < 1.5 ? 0 : ec < 3 ? fxEase((ec - 1.5) / 1.5) : ec < 7 ? 1 - (ec > 6.85 ? (ec - 6.85) / 0.15 * 0.9 : 0) : ec < 8.5 ? 1 - fxEase((ec - 7) / 1.5) : 0, trem = open > 0.5 ? (open - 0.5) * 2 : 0;
      /* the aurora through the ice, and shafts of light with snow dust */
      c.globalCompositeOperation = 'lighter'; for (j = 0; j < 4; j++) { fxGlow(c, j % 2 ? '52,211,153' : '139,92,246', ((t * (12 + j * 5) + j * s.w / 3) % (s.w + 600)) - 300, s.h * 0.1 + Math.sin(t * 0.3 + j) * 30, 260, 0.14); }
      fxGlow(c, '56,189,248', s.w / 2, s.h * 1.1, s.w * 0.7, 0.18);
      for (j = 0; j < 3; j++) { var shx = s.w * (0.25 + j * 0.25) + Math.sin(t * 0.1 + j) * 30; lkBeam(c, shx, -20, Math.PI / 2 + 0.12 * (j - 1), s.h * 0.9, 0.06, '186,230,253', 0.07); }
      /* the walls of faceted ice, with frozen shapes in them */
      c.globalCompositeOperation = 'source-over';
      Wl.forEach(function (w) { var x0 = w.sd < 0 ? 0 : s.w, x1 = x0 - w.sd * w.d, g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, 'rgba(14,50,80,.85)'); g.addColorStop(1, 'rgba(56,130,180,' + (0.25 + 0.2 * w.sh) + ')'); c.fillStyle = g; c.beginPath(); c.moveTo(x0, w.y); c.lineTo(x1, w.y + w.h * (0.3 + 0.3 * w.sh)); c.lineTo(x1 + w.sd * w.d * 0.3, w.y + w.h); c.lineTo(x0, w.y + w.h * 1.1); c.closePath(); c.fill(); c.strokeStyle = 'rgba(186,230,253,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x1, w.y + w.h * (0.3 + 0.3 * w.sh)); c.lineTo(x1 + w.sd * w.d * 0.3, w.y + w.h); c.stroke(); });
      Fz.forEach(function (f) { var x = f.sd < 0 ? 9 : s.w - 9; c.globalAlpha = 0.35; c.fillStyle = '#0B2A40'; if (f.k) { c.beginPath(); c.ellipse(x, f.y, f.z, f.z * 0.4, 0.3, 0, FX_TAU); c.fill(); c.beginPath(); c.moveTo(x - f.z * 0.9, f.y); c.lineTo(x - f.z * 1.5, f.y - f.z * 0.4); c.lineTo(x - f.z * 1.4, f.y + f.z * 0.5); c.fill(); } else { c.strokeStyle = '#0B2A40'; c.lineWidth = 2; c.beginPath(); for (var a = 0; a < 12; a += 0.3) { var rr = 1 + a * f.z / 12; if (a) { c.lineTo(x + Math.cos(a) * rr, f.y + Math.sin(a) * rr); } else { c.moveTo(x + Math.cos(a) * rr, f.y + Math.sin(a) * rr); } } c.stroke(); } c.globalAlpha = 1; });
      /* the eye under the ice */
      if (open > 0.02) { var ex = s.w / 2, ey = s.h * 0.96, er = Math.min(s.w * 0.36, 220), hh = er * 0.45 * open, look = Math.sin((ec - 3) * 1.2) * 0.5;
        c.save(); c.beginPath(); c.moveTo(ex - er, ey); c.quadraticCurveTo(ex, ey - hh * 2, ex + er, ey); c.quadraticCurveTo(ex, ey + hh * 2, ex - er, ey); c.closePath(); c.clip();
        var ig = c.createRadialGradient(ex + look * er * 0.3, ey, 2, ex + look * er * 0.3, ey, er * 0.5); ig.addColorStop(0, 'rgba(253,224,71,.42)'); ig.addColorStop(0.6, 'rgba(234,88,12,.34)'); ig.addColorStop(1, 'rgba(67,20,7,.3)'); c.fillStyle = 'rgba(2,8,16,.55)'; c.fillRect(ex - er, ey - er, er * 2, er * 2); c.fillStyle = ig; c.beginPath(); c.arc(ex + look * er * 0.3, ey, er * 0.48, 0, FX_TAU); c.fill();
        c.strokeStyle = 'rgba(120,53,15,.35)'; c.lineWidth = 1; for (j = 0; j < 24; j++) { var ia = j / 24 * FX_TAU; c.beginPath(); c.moveTo(ex + look * er * 0.3 + Math.cos(ia) * er * 0.12, ey + Math.sin(ia) * er * 0.12); c.lineTo(ex + look * er * 0.3 + Math.cos(ia) * er * 0.46, ey + Math.sin(ia) * er * 0.46); c.stroke(); }
        c.fillStyle = 'rgba(2,6,23,.85)'; c.beginPath(); c.ellipse(ex + look * er * 0.3, ey, er * 0.06, er * 0.4, 0, 0, FX_TAU); c.fill(); c.restore();
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '234,88,12', ex + look * er * 0.3, ey, er * 0.7, 0.12 * open); c.globalCompositeOperation = 'source-over'; var fg = c.createLinearGradient(0, ey - er * 0.7, 0, s.h); fg.addColorStop(0, 'rgba(186,230,253,0)'); fg.addColorStop(0.5, 'rgba(186,230,253,.14)'); fg.addColorStop(1, 'rgba(186,230,253,.2)'); c.fillStyle = fg; c.fillRect(0, ey - er * 0.7, s.w, s.h);
      }
      /* frost from the corners, growing in and melting back */
      var grow = (Math.sin(t * 0.18) * 0.5 + 0.5) * Math.min(s.w, s.h) * 0.42 + 20;
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(186,230,253,.4)'; c.lineWidth = 1; c.beginPath(); Fr.forEach(function (f) { if (f[4] > grow) { return; } var v = Math.min(1, (grow - f[4]) / (f[5] - f[4])); c.moveTo(f[0], f[1]); c.lineTo(f[0] + (f[2] - f[0]) * v, f[1] + (f[3] - f[1]) * v); }); c.stroke();
      /* a crack runs through the ice now and then, with a flash */
      if (!Ck && t > nextCk) { var cx0 = fxR(0.15, 0.85) * s.w, cy0 = fxR(0.15, 0.6) * s.h; Ck = { pts: fxJag(cx0, cy0, cx0 + fxR(-200, 200), cy0 + fxR(80, 220), 0.5, 5), l: 0 }; }
      if (Ck) { Ck.l += dt; var cg = Math.min(1, Ck.l / 0.25), cf = Ck.l < 0.25 ? 1 : Math.max(0, 1 - (Ck.l - 0.25) / 4); fxBolt(c, Ck.pts.slice(0, Math.max(2, Math.floor(Ck.pts.length * cg))), 0.6 * cf, '186,230,253'); if (Ck.l < 0.15) { fxGlow(c, '224,242,254', Ck.pts[0][0], Ck.pts[0][1], 160, 0.3 * (1 - Ck.l / 0.15)); } if (Ck.l > 4.3) { Ck = null; nextCk = t + fxR(12, 22); } }
      /* motes of ice */
      Mo.forEach(function (m) { var y = ((m.y - t * m.sp) % 1 + 1) % 1; fxStar4(c, m.x * s.w + Math.sin(t * 0.4 + m.p) * 10, y * s.h, m.z * (0.5 + 0.5 * Math.sin(t * 2 + m.p)), 0.6, '#E0F2FE'); });
      /* the icicles, glinting and dripping, trembling while the eye is open */
      c.globalCompositeOperation = 'source-over';
      Ic.forEach(function (q) { var tx = trem ? Math.sin(t * 40 + q.ph) * trem * 1.5 : 0, g = c.createLinearGradient(0, 0, 0, q.h); g.addColorStop(0, 'rgba(224,242,254,.75)'); g.addColorStop(1, 'rgba(125,211,252,.35)'); c.fillStyle = g; c.beginPath(); c.moveTo(q.x - q.w / 2, -2); c.lineTo(q.x + q.w / 2, -2); c.lineTo(q.x + 1 + tx, q.h); c.lineTo(q.x - 1 + tx, q.h); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(q.x - q.w * 0.3, 0); c.lineTo(q.x - q.w * 0.15, 0); c.lineTo(q.x - 0.5 + tx, q.h * 0.8); c.closePath(); c.fill();
        var gl = ((t * 0.3 + q.ph) % 3) / 3; if (gl < 0.3) { c.globalCompositeOperation = 'lighter'; fxStar4(c, q.x - q.w * 0.15 + tx * gl, q.h * gl / 0.3 * 0.8, 4, Math.sin(gl / 0.3 * Math.PI), '#FFFFFF'); c.globalCompositeOperation = 'source-over'; }
        u = ((t + q.drip * 3) % (4 + q.drip)) / (4 + q.drip); if (u < 0.5) { var dr = u / 0.5; q.fell = 0; c.fillStyle = 'rgba(224,242,254,.85)'; c.beginPath(); c.ellipse(q.x + tx, q.h + 2 + dr * 3, 1.8 * dr + 0.5, 2.4 * dr + 0.5, 0, 0, FX_TAU); c.fill(); } else if (!q.fell) { q.fell = 1; Dr.push({ x: q.x, y: q.h + 5, v: 0 }); } });
      for (j = Dr.length - 1; j >= 0; j--) { var d = Dr[j]; d.v += 900 * dt; d.y += d.v * dt; if (d.y > s.h - 4) { Dr.splice(j, 1); c.strokeStyle = 'rgba(186,230,253,.6)'; c.beginPath(); c.ellipse(d.x, s.h - 4, 8, 2, 0, 0, FX_TAU); c.stroke(); continue; } c.fillStyle = 'rgba(224,242,254,.8)'; c.fillRect(d.x - 1, d.y - 6, 2, 8); }
    };
  };

  /* ---------- streak styles beside the number on Home (fxStreakIcon asks FX_SICON); their colors and motion are in prizes.css ---------- */
  /* a four-pointed spark, for the styles that twinkle once they are grown */
  function lkSpk(x, y, i) { return '<path class="lk-spark lk-spark' + (i % 3) + '" d="M' + x + ' ' + (y - 3) + 'l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>'; }
  /* Tally marks: a chalk mark a day in bundles of five, the newest one drawing itself in, chalk dust drifting; past 20 days they
     turn gold and shimmer, and at 100 a gold star sits over them, with sparks */
  FX_SICON.tally = function (n) {
    var m = Math.max(1, Math.min(20, n)), g = Math.ceil(m / 5), W = g * 24 + 2, out = '', i;
    for (i = 0; i < m; i++) { var b = Math.floor(i / 5), j = i % 5, x = 4 + b * 24 + j * 4.6, jt = fxRnd(i + 1) * 1.6 - 0.8, cl = 'lk-tal' + (i === m - 1 && n <= 20 ? ' lk-new' : ''); out += j < 4 ? '<path class="' + cl + '" d="M' + (x + jt).toFixed(1) + ' 7Q' + (x + 1).toFixed(1) + ' 17 ' + (x - jt * 0.5).toFixed(1) + ' 28"/>' : '<path class="' + cl + '" d="M' + (x - 19).toFixed(1) + ' 23L' + (x + 3).toFixed(1) + ' 11"/>'; }
    for (i = 0; i < 4; i++) { out += '<circle class="lk-dust lk-dust' + i + '" cx="' + (6 + fxRnd(i + 40) * (W - 12)).toFixed(1) + '" cy="30" r=".9"/>'; }
    if (n >= 100) { out += '<path class="lk-tstar" d="M' + (W / 2) + ' 0l1.6 3.4 3.7.5-2.7 2.6.7 3.7-3.3-1.8-3.3 1.8.7-3.7-2.7-2.6 3.7-.5z"/>' + lkSpk(4, 6, 0) + lkSpk(W - 4, 8, 1); }
    return '<svg class="pz-si lk-tally' + (n > 20 ? ' full' : '') + (n < 1 ? ' none' : '') + '" viewBox="0 -1 ' + W + ' 33" aria-hidden="true">' + out + '</svg>';
  };
  /* Paper chain: a folded paper link for every week, up to eight, swinging in a wave; at 30 days it glitters, and at 100 every
     link is edged in gold */
  FX_SICON.chain = function (n) {
    var L = Math.min(8, 1 + Math.floor(n / 7)), out = '', i;
    for (i = 0; i < L; i++) { var x = 10 + i * 13, flat = i % 2; out += '<g class="lk-link" style="transform-origin:' + x + 'px 14px;animation-delay:' + (-i * 0.25).toFixed(2) + 's"><ellipse class="lk-ch lk-ch' + (i % 6) + '" cx="' + x + '" cy="14" rx="8.5" ry="' + (flat ? 2.6 : 6.5) + '"/>' + (flat ? '' : '<ellipse class="lk-chin" cx="' + x + '" cy="14" rx="6.4" ry="4.6"/>') + '</g>'; }
    if (n >= 30) { out += lkSpk(6, 4, 0) + lkSpk(L * 13 + 2, 5, 1) + lkSpk(L * 6.5 + 4, 26, 2); }
    return '<svg class="pz-si lk-chain' + (n >= 100 ? ' gold' : '') + '" viewBox="0 0 ' + (L * 13 + 8) + ' 30" aria-hidden="true">' + out + '</svg>';
  };
  /* Marquee: a little theater sign with a flickering flame, ringed by sixteen bulbs, one lit for each day; once all are lit they
     chase, gold with sparks at 30 days, every color at 100 */
  FX_SICON.marquee = function (n) {
    var on = Math.min(16, n), out = '<rect class="lk-mqf" x="3" y="3" width="42" height="30" rx="5"/><rect class="lk-mqin" x="8" y="8" width="32" height="20" rx="2"/><g class="lk-mqfl"><path class="lk-mqo" d="M24 8.5c2.8 3.6 5.6 5.8 5.6 10.4a5.6 5.6 0 0 1-11.2 0c0-2.3 1.2-4 2.6-5.4.2 1.7.9 2.8 2 3.2C22.4 14.3 22.6 11.1 24 8.5z"/><path class="lk-mqi" d="M24 16c1.4 1.6 2.6 2.7 2.6 4.6a2.6 2.6 0 0 1-5.2 0c0-1.3.9-2.6 2.6-4.6z"/></g>', i;
    for (i = 0; i < 16; i++) { var d = i / 16 * 144, x, y; if (d < 42) { x = 3 + d; y = 3; } else if (d < 72) { x = 45; y = 3 + d - 42; } else if (d < 114) { x = 45 - (d - 72); y = 33; } else { x = 3; y = 33 - (d - 114); } out += (i < on ? '<circle class="lk-mqh" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.4"' + (on >= 16 ? ' style="animation-delay:' + (-(i % 4) * 0.2).toFixed(1) + 's"' : '') + '/>' : '') + '<circle class="lk-mqb' + (i < on ? ' on' : '') + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.1"' + (on >= 16 ? ' style="animation-delay:' + (-(i % 4) * 0.2).toFixed(1) + 's"' : '') + '/>'; }
    if (n >= 30) { out += lkSpk(0, 0, 0) + lkSpk(48, 2, 1) + lkSpk(46, 36, 2); }
    return '<svg class="pz-si lk-marquee' + (on >= 16 ? ' chase' : '') + (n >= 30 ? ' gold' : '') + (n >= 100 ? ' rainbow' : '') + '" viewBox="-3 -3 54 42" aria-hidden="true">' + out + '</svg>';
  };
  /* Lotus: a bud on the water that opens a pair of petals each week, rings spreading round it; in full bloom at 30 days with a
     golden heart that beats, and at 100 glowing, with motes of light rising and sparks */
  FX_SICON.lotus = function (n) {
    var open = n >= 30 ? 4 : Math.min(3, Math.floor(n / 7)), out = '<ellipse class="lk-lr lk-lr0" cx="24" cy="38" rx="20" ry="4.2"/><ellipse class="lk-lr lk-lr1" cx="24" cy="38" rx="20" ry="4.2"/><ellipse class="lk-lw" cx="24" cy="38" rx="21" ry="4.5"/><path class="lk-lpad" d="M24 38L7.4 37.2A17 3.6 0 1 0 9 36.2z"/>', k;
    out += '<g class="lk-lbloom">';
    for (k = 3; k >= 0; k--) { var a = k < open ? 16 + k * 19 : 6 + k * 2, cl = 'lk-lp' + (k % 2); [-1, 1].forEach(function (sd) { out += '<path class="' + cl + '" transform="rotate(' + (sd * a) + ' 24 34)" d="M24 34C19 28 20 17 24 12C28 17 29 28 24 34Z"/>'; }); }
    out += '<path class="lk-lp2" d="M24 34C20.5 28 21 20 24 15C27 20 27.5 28 24 34Z"/></g>';
    if (n >= 30) { out += '<circle class="lk-lhalo" cx="24" cy="27" r="6"/><circle class="lk-lc" cx="24" cy="27" r="3.4"/>'; }
    if (n >= 100) { out += '<circle class="lk-lm" cx="14" cy="16" r="1.4"/><circle class="lk-lm lk-lm1" cx="33" cy="12" r="1.2"/><circle class="lk-lm lk-lm2" cx="25" cy="7" r="1.1"/>' + lkSpk(6, 10, 0) + lkSpk(43, 18, 1); }
    return '<svg class="pz-si lk-lotus' + (n >= 100 ? ' glow' : '') + '" viewBox="0 0 48 44" aria-hidden="true">' + out + '</svg>';
  };
  /* Ouroboros: a serpent that curls a little further round each day, slithering, its tongue flicking; at 30 days it holds its own
     tail and glows, and at 100 it turns, shining in every color, with sparks */
  FX_SICON.ouroboros = function (n) {
    var f = Math.min(0.96, 0.28 + n / 30 * 0.68), a0 = -Math.PI / 2, a1 = a0 + f * FX_TAU, R = 15, gid = 'pzob' + (++FX_SID);
    var sx = 22 + Math.cos(a0) * R, sy = 22 + Math.sin(a0) * R, ex = 22 + Math.cos(a1) * R, ey = 22 + Math.sin(a1) * R, d = 'M' + sx.toFixed(2) + ' ' + sy.toFixed(2) + 'A' + R + ' ' + R + ' 0 ' + (f > 0.5 ? 1 : 0) + ' 1 ' + ex.toFixed(2) + ' ' + ey.toFixed(2), deg = (a1 * 180 / Math.PI + 90).toFixed(1);
    var stops = n >= 100 ? '<stop offset="0" stop-color="#F472B6"/><stop offset=".35" stop-color="#FDE047"/><stop offset=".7" stop-color="#4ADE80"/><stop offset="1" stop-color="#22D3EE"/>' : '<stop offset="0" stop-color="#065F46"/><stop offset="1" stop-color="#34D399"/>';
    var spk = n >= 100 ? lkSpk(3, 4, 0) + lkSpk(41, 6, 1) + lkSpk(40, 41, 2) : '';
    return '<svg class="pz-si lk-ouro' + (n >= 30 ? ' whole' : '') + (n >= 100 ? ' shine' : '') + '" viewBox="0 0 44 44" aria-hidden="true"><defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' + stops + '</linearGradient></defs>' + (n >= 30 ? '<circle class="lk-ohalo" cx="22" cy="22" r="15"/>' : '') + '<g class="lk-orot">' +
      '<path class="lk-obody" stroke="url(#' + gid + ')" d="' + d + '"/><path class="lk-oscale" d="' + d + '"/><path class="lk-obelly" d="' + d + '"/>' +
      '<g transform="translate(' + ex.toFixed(2) + ' ' + ey.toFixed(2) + ') rotate(' + deg + ')"><ellipse class="lk-ohead" cx="1.5" cy="0" rx="4.8" ry="3.6"/><circle class="lk-oeye" cx="2.6" cy="-1.4" r="1.05"/><circle class="lk-oglint" cx="2.9" cy="-1.7" r=".35"/><path class="lk-otongue" d="M6 .3l2.6-.9M6 .3l2.6 1.4"/></g></g>' + spk + '</svg>';
  };
  FX_LIVE_THEMES['prize-clouds'] = 1; FX_LIVE_THEMES['prize-pond'] = 1; FX_LIVE_THEMES['prize-mycelium'] = 1; FX_LIVE_THEMES['prize-dunes'] = 1; FX_LIVE_THEMES['prize-glacier'] = 1;
