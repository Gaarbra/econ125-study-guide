function wJoint(root) {
  const cv = $('canvas.cv3', root), cv2 = $('canvas.cv2', root);
  const L = 4, N = 30, HS = 4.8, HW = 3.8;
  const DEF = { az: -0.72, el: 0.68 };
  let rr = null, trace = null;
  const elS = $('[data-k=el]', root);
  const view = new View3D(cv, { az: DEF.az, el: DEF.el, R: 5.9, zc: 1.9, onchange: () => { syncEl(); if (rr) rr(); } });
  function syncEl() { elS.value = String(Math.round(view.el * 180 / Math.PI)); syncOut(elS); }
  function fsub(ctx, P, x, y, sub, arg, color, size) {
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color;
    ctx.font = `italic ${size}px ${P.sans}`; ctx.fillText('f', x, y); const w0 = ctx.measureText('f').width;
    ctx.font = `italic ${size * 0.72}px ${P.sans}`; ctx.fillText(sub, x + w0, y + 3); const w1 = ctx.measureText(sub).width;
    ctx.font = `${size}px ${P.sans}`; ctx.fillText(arg, x + w0 + w1 + 1, y);
  }

  function draw() {
    const mode = segVal(root, 'mode') || 'joint';
    const sd = Math.round(+elS.value);
    if (sd !== Math.round(view.el * 180 / Math.PI)) view.el = sd * Math.PI / 180;
    const ax = mode === 'mY' ? 'y' : 'x';
    const sliceOn = mode !== 'joint';
    showOnly(root, mode);
    $('[data-inset]', root).hidden = !sliceOn;
    $('[data-slice]', root).hidden = !sliceOn;
    $$('[data-lab]', root).forEach(e => { e.hidden = e.dataset.lab !== ax; });
    $$('[data-mode-only]', root).forEach(e => { e.hidden = !e.dataset.modeOnly.split(',').includes(mode); });
    const cefRow = $('[data-cefrow]', root); if (cefRow) cefRow.hidden = (mode === 'mX' || mode === 'mY');

    const { ctx, w, h } = setupCanvas(cv);
    if (w < 20) return;
    view.setSize(w, h);
    const P = pal(root);
    const rho = kv(root, 'rho'), sx = kv(root, 'sx'), sy = kv(root, 'sy');
    const showCef = kv(root, 'cef') && ax === 'x';
    const su = ax === 'x' ? sx : sy, sv = ax === 'x' ? sy : sx;
    const den = Math.sqrt(1 - rho * rho);
    const peak = 1 / (2 * Math.PI * sx * sy * den), k1 = HS / peak;
    const u0 = clamp(kv(root, 'u0'), -L + 0.3, L - 0.3);
    const f = (u, v) => bvn(u, v, su, sv, rho);
    const XY = (u, v) => (ax === 'x' ? [u, v] : [v, u]);
    const Pt = (u, v, z) => { const q = XY(u, v); return view.P(q[0], q[1], z); };

    /* floor, grid, level sets */
    poly(ctx, [[-L, -L], [L, -L], [L, L], [-L, L]].map(p => view.P(p[0], p[1], 0)), rgba(P.rule, 0.25), P.rule, 1);
    for (let t = -L; t <= L; t += 2) {
      polyline(ctx, [view.P(t, -L, 0), view.P(t, L, 0)], rgba(P.rule, 0.9), 1);
      polyline(ctx, [view.P(-L, t, 0), view.P(L, t, 0)], rgba(P.rule, 0.9), 1);
    }
    polyline(ctx, [view.P(-L, 0, 0), view.P(L, 0, 0)], rgba(P.muted, 0.6), 1.2);
    polyline(ctx, [view.P(0, -L, 0), view.P(0, L, 0)], rgba(P.muted, 0.6), 1.2);
    [1, 2].forEach(r => {
      const pts = [];
      for (let i = 0; i <= 60; i++) { const t = 2 * Math.PI * i / 60; pts.push(Pt(su * r * Math.cos(t), sv * r * (rho * Math.cos(t) + den * Math.sin(t)), 0)); }
      polyline(ctx, pts, rgba(P.acc, 0.55), 1.2, [4, 3]);
    });

    /* far wall with marginal curve (sum-out modes) */
    const wallMode = mode === 'mX' || mode === 'mY';
    let wy = L, wx = L;
    if (ax === 'x') wy = view.P(0, L, 0)[2] > view.P(0, -L, 0)[2] ? L : -L; else wx = view.P(L, 0, 0)[2] > view.P(-L, 0, 0)[2] ? L : -L;
    const WP = (u, z) => (ax === 'x' ? view.P(u, wy, z) : view.P(wx, u, z));
    const km = HW / npdf(0, 0, su);
    const fU = npdf(u0, 0, su);
    if (wallMode) {
      poly(ctx, [WP(-L, 0), WP(L, 0), WP(L, HW + 0.5), WP(-L, HW + 0.5)], rgba(P.rule, 0.18), P.rule, 1);
      const uEnd = trace ? u0 : L;
      const curve = []; for (let i = 0; i <= 80; i++) { const u = -L + 2 * L * i / 80; curve.push(WP(u, km * npdf(u, 0, su))); }
      polyline(ctx, curve, rgba(P.muted, 0.7), 1.5);
      const part = []; part.push(WP(-L, 0));
      for (let i = 0; i <= 80; i++) { const u = -L + 2 * L * i / 80; if (u > uEnd) break; part.push(WP(u, km * npdf(u, 0, su))); }
      part.push(WP(Math.min(uEnd, L), 0));
      if (part.length > 2) poly(ctx, part, rgba(P.acc, 0.28), null);
      const tr = []; for (let i = 0; i <= 80; i++) { const u = -L + 2 * L * i / 80; if (u > uEnd) break; tr.push(WP(u, km * npdf(u, 0, su))); }
      if (tr.length > 1) polyline(ctx, tr, P.acc, 2.4);
      const d0 = WP(u0, 0), d1 = WP(u0, km * fU);
      polyline(ctx, [d0, d1], P.warn, 2, [3, 3]);
      ctx.beginPath(); ctx.arc(d1[0], d1[1], 4.5, 0, 7); ctx.fillStyle = P.warn; ctx.fill();
      if (ax === 'x') fsub(ctx, P, d1[0] + 8, d1[1] - 6, 'X', '(x0)', P.ink, 12); else fsub(ctx, P, d1[0] + 8, d1[1] - 6, 'Y', '(y0)', P.ink, 12);
    }

    /* depth-sorted surface + curtain */
    const polys = [];
    const g = []; for (let i = 0; i <= N; i++) g.push(-L + 2 * L * i / N);
    const Z = g.map(u => g.map(v => k1 * f(u, v)));
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const c = [[g[i], g[j], Z[i][j]], [g[i + 1], g[j], Z[i + 1][j]], [g[i + 1], g[j + 1], Z[i + 1][j + 1]], [g[i], g[j + 1], Z[i][j + 1]]];
      const pp = c.map(q => Pt(q[0], q[1], q[2]));
      const zf = (c[0][2] + c[1][2] + c[2][2] + c[3][2]) / 4 / HS;
      polys.push({ pts: pp, d: (pp[0][2] + pp[1][2] + pp[2][2] + pp[3][2]) / 4, fill: mixc(P.tint, P.acc, clamp(zf * 1.05, 0, 1), 0.9), stroke: rgba(P.ink, 0.10) });
    }
    polys.sort((a, b) => b.d - a.d);
    polys.forEach(p => poly(ctx, p.pts, p.fill, p.stroke, 0.6));
    if (sliceOn) {   // the curtain (area being integrated) drawn over the surface so it is always visible
      for (let j = 0; j < N; j++) {
        const z0 = k1 * f(u0, g[j]), z1 = k1 * f(u0, g[j + 1]);
        poly(ctx, [Pt(u0, g[j], 0), Pt(u0, g[j + 1], 0), Pt(u0, g[j + 1], z1), Pt(u0, g[j], z0)], rgba(P.warn, 0.42), null);
      }
    }

    /* slice curve, conditional (rescaled) curve, CEF */
    const muC = rho * sv / su * u0, sdC = sv * den;
    if (sliceOn) {
      const sl = g.map(v => Pt(u0, v, k1 * f(u0, v)));
      polyline(ctx, sl, P.warn, 3);
      if (mode === 'cond') {
        const kc = HS / npdf(0, 0, sdC);
        const dc = []; for (let i = 0; i <= 60; i++) { const v = -L + 2 * L * i / 60; dc.push(Pt(u0, v, kc * npdf(v, muC, sdC))); }
        polyline(ctx, dc, P.ink, 2, [5, 4]);
        const a = Pt(u0, clamp(muC, -L, L), 0), b = Pt(u0, clamp(muC, -L, L), kc * npdf(muC, muC, sdC));
        polyline(ctx, [a, b], P.ink, 1.5, [2, 3]);
      }
    }
    if (showCef) {
      const cp = []; for (let i = 0; i <= 40; i++) { const u = -L + 2 * L * i / 40; const v = rho * sv / su * u; if (Math.abs(v) <= L) cp.push(Pt(u, v, 0)); }
      if (cp.length > 1) polyline(ctx, cp, P.ink, 3);
      const q = Pt(L - 0.2, clamp(rho * sv / su * (L - 0.2), -L, L), 0);
      text2(ctx, P, 'E[Y|X=x]', q[0], q[1] - 8, { size: 12, color: P.ink, weight: 600 });
      if (sliceOn) { const m = Pt(u0, clamp(muC, -L, L), 0); ctx.beginPath(); ctx.arc(m[0], m[1], 5, 0, 7); ctx.fillStyle = P.ink; ctx.fill(); }
    }
    const ex = view.P(L + 0.7, 0, 0), ey = view.P(0, L + 0.7, 0);
    text2(ctx, P, 'x', ex[0], ex[1] + 4, { size: 13, italic: true, color: P.ink });
    text2(ctx, P, 'y', ey[0], ey[1] + 4, { size: 13, italic: true, color: P.ink });
    if (view.hint) text2(ctx, P, 'Drag to rotate', 10, h - 10, { size: 12, align: 'left' });

    /* inset */
    if (sliceOn && cv2) {
      const s2 = setupCanvas(cv2);
      if (s2.w > 20) {
        const c2 = s2.ctx, raw = v => f(u0, v);
        const condPk = npdf(0, 0, sdC), margPk = npdf(0, 0, sv);
        const rawPeak = fU * condPk;
        const ymax = (mode === 'cond' ? Math.max(condPk, margPk) : Math.max(rawPeak, 1e-3)) * 1.22;
        const pl = new Plot(c2, P, 14, 8, s2.w - 28, s2.h - 34, [-L, L], [0, ymax]);
        pl.frame({ xt: [-4, -2, 0, 2, 4] });
        pl.area(raw, -L, L, rgba(P.warn, 0.4), 0, 120); pl.line(raw, -L, L, P.warn, 2.4, null, 120);
        if (mode === 'cond') {
          pl.line(v => npdf(v, muC, sdC), -L, L, P.ink, 2, [5, 4], 120);
          pl.line(v => npdf(v, 0, sv), -L, L, P.muted, 1.6, null, 120);
          pl.seg(muC, 0, muC, ymax * 0.92, P.ink, 1.4, [2, 3]);
          pl.seg(0, 0, 0, ymax * 0.92, P.muted, 1.2, [2, 3]);
        }
        text2(c2, P, (ax === 'x' ? 'y' : 'x') + ' axis', s2.w - 8, 16, { size: 12, italic: true, color: P.muted, align: 'right' });
      }
    }

    /* readouts */
    let area = 0; for (let i = 0; i < 400; i++) { const v = -L + 2 * L * (i + 0.5) / 400; area += f(u0, v) * (2 * L / 400); }
    setO(root, 'rho', f2(rho)); setO(root, 'cov', f2(rho * sx * sy));
    setO(root, 'area', f3(area)); setO(root, 'marg', f3(fU));
    setO(root, 'ecx', f2(muC)); setO(root, 'vcx', f2(sdC * sdC)); setO(root, 'sdx', f2(sx)); setO(root, 'sdy', f2(sy));
  }

  root.addEventListener('click', e => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    const act = a.dataset.act;
    if (act === 'reset') { view.az = DEF.az; view.el = DEF.el; syncEl(); rr(); }
    else if (act === 'top') { view.el = 1.4; view.az = 0; syncEl(); rr(); }
    else if (act === 'sweep') {
      if (trace) { trace = null; rr(); return; }
      trace = { t0: performance.now() };
      const loop = () => {
        if (!trace) return;
        const t = Math.min((performance.now() - trace.t0) / 4500, 1);
        setRange(root, 'u0', (-3.7 + 7.4 * t).toFixed(2));
        draw();
        if (t < 1) requestAnimationFrame(loop); else { trace = null; rr(); }
      };
      requestAnimationFrame(loop);
    }
  });
  rr = initW(root, draw);
  syncEl();
  return rr;
}
