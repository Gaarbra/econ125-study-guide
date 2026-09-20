function wBars(root) {
  const cv = $('canvas.cv3', root);
  const P0 = [[0.20, 0.20, 0.10], [0.05, 0.20, 0.25]];
  const YV = [20, 40, 60];
  const fx0 = P0.map(r => r[0] + r[1] + r[2]);
  const fy0 = [0, 1, 2].map(j => P0[0][j] + P0[1][j]);
  const K = 9, XC = [-1.7, 1.7], YC = [-3.1, 0, 3.1], BW = 1.9, EX = 3.9, EY = 5.1;
  const DEF = { az: -0.62, el: 0.6 };
  let rr = null;
  const elS = $('[data-k=el]', root);
  const view = new View3D(cv, { az: DEF.az, el: DEF.el, R: 6.8, zc: 2.2, onchange: () => { syncEl(); if (rr) rr(); } });
  function syncEl() { elS.value = String(Math.round(view.el * 180 / Math.PI)); syncOut(elS); }

  function draw() {
    const mode = segVal(root, 'mode') || 'joint';
    const cx = parseInt(segVal(root, 'cx') || '0', 10);
    const sd = Math.round(+elS.value);
    if (sd !== Math.round(view.el * 180 / Math.PI)) view.el = sd * Math.PI / 180;
    showOnly(root, mode);
    const { ctx, w, h } = setupCanvas(cv);
    if (w < 20) return;
    view.setSize(w, h);
    const P = pal(root);
    const lam = kv(root, 'lam'), ghost = kv(root, 'ghost');
    const J = P0.map((r, i) => r.map((p, j) => (1 - lam) * p + lam * fx0[i] * fy0[j]));
    const fx = J.map(r => r[0] + r[1] + r[2]);
    const fy = [0, 1, 2].map(j => J[0][j] + J[1][j]);
    const rowCol = [P.c2, P.c4];

    /* floor */
    poly(ctx, [[-EX, -EY], [EX, -EY], [EX, EY], [-EX, EY]].map(p => view.P(p[0], p[1], 0)), rgba(P.rule, 0.25), P.rule, 1);
    XC.forEach(x => polyline(ctx, [view.P(x, -EY, 0), view.P(x, EY, 0)], rgba(P.rule, 0.8), 1));
    YC.forEach(y => polyline(ctx, [view.P(-EX, y, 0), view.P(EX, y, 0)], rgba(P.rule, 0.8), 1));

    const faces = [];
    function addBox(x0, x1, y0, y1, z0, z1, hex, alpha) {
      if (z1 - z0 < 1e-6) return;
      const defs = [
        { n: [0, 0, 1], f: 1.0, q: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] },
        { n: [1, 0, 0], f: 0.82, q: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]] },
        { n: [-1, 0, 0], f: 0.82, q: [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]] },
        { n: [0, 1, 0], f: 0.66, q: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]] },
        { n: [0, -1, 0], f: 0.66, q: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]] },
      ];
      defs.forEach(d => {
        if (view.nd(d.n[0], d.n[1], d.n[2]) >= 0) return;
        const pp = d.q.map(p => view.P(p[0], p[1], p[2]));
        faces.push({ pts: pp, d: (pp[0][2] + pp[1][2] + pp[2][2] + pp[3][2]) / 4, fill: shade(hex, d.f, alpha), stroke: rgba(P.surface, 0.55) });
      });
    }
    /* far walls */
    const wy = view.P(0, EY, 0)[2] > view.P(0, -EY, 0)[2] ? EY : -EY;
    const wx = view.P(EX, 0, 0)[2] > view.P(-EX, 0, 0)[2] ? EX : -EX;
    const wallY = mode === 'sumY', wallX = mode === 'sumX' || mode === 'cond';
    if (wallY) poly(ctx, [view.P(-EX, wy, 0), view.P(EX, wy, 0), view.P(EX, wy, 5.6), view.P(-EX, wy, 5.6)], rgba(P.rule, 0.18), P.rule, 1);
    if (wallX) poly(ctx, [view.P(wx, -EY, 0), view.P(wx, EY, 0), view.P(wx, EY, 5.6), view.P(wx, -EY, 5.6)], rgba(P.rule, 0.18), P.rule, 1);

    /* joint bars */
    const lv = [0.5, 0.25, 0];  // lightening by y-level in sumY
    for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
      let alpha = 1, hex = rowCol[i];
      if (mode === 'cond' && i !== cx) alpha = 0.22;
      const x0 = XC[i] - BW / 2, x1 = XC[i] + BW / 2, y0 = YC[j] - BW / 2, y1 = YC[j] + BW / 2;
      let col = hex;
      if (mode === 'sumY') { const c = hex2rgb(hex), s = hex2rgb(P.surface); const t = lv[j]; col = '#' + [0, 1, 2].map(k => Math.round(c[k] + (s[k] - c[k]) * t).toString(16).padStart(2, '0')).join(''); }
      addBox(x0, x1, y0, y1, 0, K * J[i][j], col, alpha);
    }
    /* wall stacks */
    const inY = wy > 0 ? -1 : 1, inX = wx > 0 ? -1 : 1, T = 0.8;
    if (wallY) for (let i = 0; i < 2; i++) {
      let z = 0;
      for (let j = 0; j < 3; j++) {
        const c = hex2rgb(rowCol[i]), s = hex2rgb(P.surface), t = lv[j];
        const col = '#' + [0, 1, 2].map(k => Math.round(c[k] + (s[k] - c[k]) * t).toString(16).padStart(2, '0')).join('');
        const y0 = Math.min(wy, wy + inY * T), y1 = Math.max(wy, wy + inY * T);
        addBox(XC[i] - BW / 2, XC[i] + BW / 2, y0, y1, z, z + K * J[i][j], col, 1); z += K * J[i][j];
      }
    }
    if (wallX) for (let j = 0; j < 3; j++) {
      const x0 = Math.min(wx, wx + inX * T), x1 = Math.max(wx, wx + inX * T);
      if (mode === 'sumX') { addBox(x0, x1, YC[j] - BW / 2, YC[j] + BW / 2, 0, K * J[0][j], rowCol[0], 1); addBox(x0, x1, YC[j] - BW / 2, YC[j] + BW / 2, K * J[0][j], K * (J[0][j] + J[1][j]), rowCol[1], 1); }
      else addBox(x0, x1, YC[j] - BW / 2, YC[j] + BW / 2, 0, K * J[cx][j] / fx[cx], rowCol[cx], 1);
    }
    faces.sort((a, b) => b.d - a.d);
    faces.forEach(f => poly(ctx, f.pts, f.fill, f.stroke, 0.8));

    /* ghost: product of marginals */
    if (ghost) for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
      const z = K * fx[i] * fy[j], x0 = XC[i] - BW / 2, x1 = XC[i] + BW / 2, y0 = YC[j] - BW / 2, y1 = YC[j] + BW / 2;
      polyline(ctx, [view.P(x0, y0, z), view.P(x1, y0, z), view.P(x1, y1, z), view.P(x0, y1, z), view.P(x0, y0, z)], P.ink, 1.6, [4, 3]);
    }
    /* value labels */
    for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
      if (mode === 'cond' && i !== cx) continue;
      const q = view.P(XC[i], YC[j], K * J[i][j]);
      text2(ctx, P, nolead(J[i][j]), q[0], q[1] - 6, { size: 12, weight: 600, color: P.ink });
    }
    if (wallY) for (let i = 0; i < 2; i++) { const q = view.P(XC[i], wy + inY * T / 2, K * fx[i]); text2(ctx, P, nolead(fx[i]), q[0], q[1] - 6, { size: 13, weight: 600, color: P.ink }); }
    if (mode === 'sumX') for (let j = 0; j < 3; j++) { const q = view.P(wx + inX * T / 2, YC[j], K * fy[j]); text2(ctx, P, nolead(fy[j]), q[0], q[1] - 6, { size: 13, weight: 600, color: P.ink }); }
    if (mode === 'cond') for (let j = 0; j < 3; j++) { const q = view.P(wx + inX * T / 2, YC[j], K * J[cx][j] / fx[cx]); text2(ctx, P, nolead(J[cx][j] / fx[cx]), q[0], q[1] - 6, { size: 13, weight: 600, color: P.ink }); }

    /* axis tick labels on the near edges */
    const nearY = view.P(0, EY, 0)[2] < view.P(0, -EY, 0)[2] ? EY : -EY, nearX = view.P(EX, 0, 0)[2] < view.P(-EX, 0, 0)[2] ? EX : -EX;
    for (let i = 0; i < 2; i++) { const q = view.P(XC[i], nearY + (nearY > 0 ? 0.9 : -0.9), 0); text2(ctx, P, 'X=' + i, q[0], q[1] + 4, { size: 12, weight: 600, color: rowCol[i] }); }
    for (let j = 0; j < 3; j++) { const q = view.P(nearX + (nearX > 0 ? 0.9 : -0.9), YC[j], 0); text2(ctx, P, 'Y=' + YV[j], q[0], q[1] + 4, { size: 12, weight: 600, color: P.muted }); }
    if (view.hint) text2(ctx, P, 'Drag to rotate', 10, h - 10, { size: 12, align: 'left' });

    /* table + stats */
    for (let i = 0; i < 2; i++) { for (let j = 0; j < 3; j++) setO(root, 'j' + i + j, nolead(J[i][j])); setO(root, 'fx' + i, nolead(fx[i])); }
    for (let j = 0; j < 3; j++) { setO(root, 'fy' + j, nolead(fy[j])); setO(root, 'c' + j, nolead(J[cx][j] / fx[cx])); }
    $$('[data-row]', root).forEach(e => e.classList.toggle('hl', mode === 'cond' && +e.dataset.row === cx));
    const ey0 = YV.reduce((s, y, j) => s + y * J[0][j] / fx[0], 0), ey1 = YV.reduce((s, y, j) => s + y * J[1][j] / fx[1], 0);
    const EY_ = YV.reduce((s, y, j) => s + y * fy[j], 0), exy = YV.reduce((s, y, j) => s + y * J[1][j], 0);
    const cov = exy - fx[1] * EY_, varY = YV.reduce((s, y, j) => s + y * y * fy[j], 0) - EY_ * EY_, varX = fx[1] * (1 - fx[1]);
    setO(root, 'ey0', f2(ey0)); setO(root, 'ey1', f2(ey1)); setO(root, 'ey', f2(EY_));
    setO(root, 'cov', f2(cov)); setO(root, 'corr', f2(cov / Math.sqrt(varX * varY)));
    setO(root, 'ind', lam > 0.995 ? 'Yes: every slice is the same' : 'No');
  }

  root.addEventListener('click', e => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'reset') { view.az = DEF.az; view.el = DEF.el; syncEl(); rr(); }
    if (a.dataset.act === 'indep') { setRange(root, 'lam', a.dataset.v); rr(); }
  });
  rr = initW(root, draw);
  syncEl();
  return rr;
}
