function wScale(root) {
  const cv = $('canvas', root);
  function draw() {
    const { ctx, w, h } = setupCanvas(cv); if (w < 20) return;
    const P = pal(root), mu = kv(root, 'mu'), sd = kv(root, 'sd'); let a = kv(root, 'a'); const b = kv(root, 'b'), z = kv(root, 'z');
    if (Math.abs(a) < 0.05) a = a < 0 ? -0.05 : 0.05;
    const mY = a * mu + b, sY = Math.abs(a) * sd;
    const curves = [{ m: mu, s: sd, col: P.acc, name: 'X' }, { m: mY, s: sY, col: P.warn, name: 'Y = aX + b' }];
    if (z) curves.push({ m: 0, s: 1, col: P.ink, name: 'Z', dash: [5, 4] });
    const lo = Math.min(...curves.map(c => c.m - 4 * c.s)), hi = Math.max(...curves.map(c => c.m + 4 * c.s));
    const pk = Math.max(...curves.map(c => npdf(c.m, c.m, c.s)));
    const pl = new Plot(ctx, P, 14, 12, w - 28, h - 58, [lo, hi], [0, pk * 1.15]);
    const step = (hi - lo) > 16 ? 4 : ((hi - lo) > 8 ? 2 : 1), xt = []; for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) xt.push(t);
    pl.frame({ xt, fx: v => String(Math.round(v * 10) / 10) });
    curves.forEach(c => {
      const fn = x => npdf(x, c.m, c.s);
      pl.area(fn, c.m - 4 * c.s, c.m + 4 * c.s, rgba(c.col, 0.14)); pl.line(fn, c.m - 4 * c.s, c.m + 4 * c.s, c.col, 2.4, c.dash || null);
      pl.seg(c.m, 0, c.m, npdf(c.m, c.m, c.s), c.col, 1.4, [3, 3]);
      const yy = npdf(c.m + c.s, c.m, c.s); pl.seg(c.m - c.s, yy, c.m + c.s, yy, c.col, 2);
    });
    let lx = 16; curves.forEach(c => { ctx.fillStyle = c.col; ctx.fillRect(lx, h - 13, 12, 3); text2(ctx, P, c.name, lx + 16, h - 8, { size: 12, align: 'left', color: P.ink }); lx += 26 + c.name.length * 7; });
    setO(root, 'EX', f2(mu)); setO(root, 'EY', f2(mY)); setO(root, 'vX', f2(sd * sd)); setO(root, 'vY', f2(sY * sY)); setO(root, 'sY', f2(sY));
  }
  initW(root, draw);
}
