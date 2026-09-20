function wSelect(root) {
  const cv = $('canvas', root);
  let data = [];
  function gen() { data = []; for (let i = 0; i < 170; i++) data.push({ z: randn(), e: randn(), u: randn() }); }
  gen();
  function draw() {
    const { ctx, w, h } = setupCanvas(cv); if (w < 20) return;
    const P = pal(root), gm = kv(root, 'g'), hold = kv(root, 'hold'), beta = 2;
    const pts = data.map(d => { const x = 5 + 2 * (gm * d.z + Math.sqrt(1 - gm * gm) * d.e); return { x, z: d.z, y: 10 + beta * x + 3 * d.z + 1.5 * d.u }; });
    const n = pts.length, mx = avg(pts.map(p => p.x)), my = avg(pts.map(p => p.y)), mz = avg(pts.map(p => p.z));
    let Sxx = 0, Sxy = 0, Sxz = 0, Szz = 0, Szy = 0;
    pts.forEach(p => { const a = p.x - mx, b = p.y - my, c = p.z - mz; Sxx += a * a; Sxy += a * b; Sxz += a * c; Szz += c * c; Szy += c * b; });
    const naive = Sxy / Sxx, det = Sxx * Szz - Sxz * Sxz;
    const b1 = (Szz * Sxy - Sxz * Szy) / det, b2 = (Sxx * Szy - Sxz * Sxy) / det, a0 = my - b1 * mx - b2 * mz;
    const ys = pts.map(p => p.y), xr = [-1, 11], yr = [Math.floor(Math.min(...ys) - 2), Math.ceil(Math.max(...ys) + 2)];
    const pl = new Plot(ctx, P, 40, 10, w - 52, h - 44, xr, yr);
    pl.frame({ xt: [0, 2, 4, 6, 8, 10], yt: [], grid: false });
    pl.text('years of education (x)', pl.x + pl.w / 2, h - 6, { size: 12 });
    pl.text('wage (y)', 14, pl.y + 10, { size: 12, align: 'left' });
    const colz = z => mixc(P.c2, P.c4, clamp((z + 2) / 4, 0, 1), 0.85);
    pts.forEach(p => pl.dot(p.x, p.y, 3.2, colz(p.z)));
    pl.seg(xr[0], my + beta * (xr[0] - mx), xr[1], my + beta * (xr[1] - mx), P.warn, 2, [6, 4]);
    if (!hold) pl.seg(xr[0], my + naive * (xr[0] - mx), xr[1], my + naive * (xr[1] - mx), P.ink, 3);
    else [-1, 0, 1].forEach(z0 => { const c = a0 + b2 * z0; pl.seg(xr[0], c + b1 * xr[0], xr[1], c + b1 * xr[1], colz(z0 * 1.6), 3); });
    setO(root, 'naive', f2(naive)); setO(root, 'ctrl', f2(b1)); setO(root, 'true', '2.00'); setO(root, 'bias', f2(naive - beta));
    const cap = $('[data-o=cap]', root);
    if (cap) cap.textContent = gm < 0.05
      ? 'Randomized: education is independent of ability, so the fitted line lands on the true effect of 2. Any gap is just sampling noise.'
      : (hold ? 'Holding ability fixed compares people with the same ability, so the three parallel lines all have the true slope of about 2.'
        : 'Self-selected: high-ability people (red) get more education, so the fitted line mixes the effect of education with the effect of ability. That is omitted variable bias.');
  }
  root.addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (a && a.dataset.act === 'resample') { gen(); rr(); } });
  const rr = initW(root, draw);
}
