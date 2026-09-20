function wCov(root) {
  const cv = $('canvas', root);
  let base = [], sel = -1, last = null;
  function gen() { base = []; for (let i = 0; i < 150; i++) base.push([randn(), randn()]); }
  gen();
  function dataset(ds, rho) {
    if (ds === 'par') { const a = []; for (let i = 0; i < 121; i++) { const x = -2 + 4 * i / 120; a.push([x, x * x]); } return a; }
    if (ds === 'ind') return base.map(p => [p[0], p[1]]);
    return base.map(p => [p[0], rho * p[0] + Math.sqrt(1 - rho * rho) * p[1]]);
  }
  function draw() {
    const { ctx, w, h } = setupCanvas(cv); if (w < 20) return;
    const P = pal(root), ds = segVal(root, 'ds') || 'lin', rho = kv(root, 'rho'), std = kv(root, 'std');
    const rs = $('[data-k=rho]', root); rs.disabled = ds !== 'lin'; rs.style.opacity = ds === 'lin' ? 1 : 0.4;
    let pts = dataset(ds, rho);
    const n = pts.length;
    let mx = avg(pts.map(p => p[0])), my = avg(pts.map(p => p[1]));
    let sx = Math.sqrt(avg(pts.map(p => (p[0] - mx) ** 2))), sy = Math.sqrt(avg(pts.map(p => (p[1] - my) ** 2)));
    if (std) pts = pts.map(p => [(p[0] - mx) / sx, (p[1] - my) / sy]);
    const MX = avg(pts.map(p => p[0])), MY = avg(pts.map(p => p[1]));
    const cov = avg(pts.map(p => (p[0] - MX) * (p[1] - MY)));
    const SX = Math.sqrt(avg(pts.map(p => (p[0] - MX) ** 2))), SY = Math.sqrt(avg(pts.map(p => (p[1] - MY) ** 2)));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const padx = (Math.max(...xs) - Math.min(...xs)) * 0.08, pady = (Math.max(...ys) - Math.min(...ys)) * 0.08;
    const xr = [Math.min(...xs) - padx, Math.max(...xs) + padx], yr = [Math.min(...ys) - pady, Math.max(...ys) + pady];
    const pl = new Plot(ctx, P, 14, 10, w - 24, h - 30, xr, yr);
    last = { pl, pts, MX, MY };
    pl.rect(MX, MY, xr[1], yr[1], rgba(P.acc, 0.10)); pl.rect(xr[0], yr[0], MX, MY, rgba(P.acc, 0.10));
    pl.rect(xr[0], MY, MX, yr[1], rgba(P.warn, 0.12)); pl.rect(MX, yr[0], xr[1], MY, rgba(P.warn, 0.12));
    pl.seg(MX, yr[0], MX, yr[1], P.muted, 1.2, [4, 3]); pl.seg(xr[0], MY, xr[1], MY, P.muted, 1.2, [4, 3]);
    pts.forEach((p, i) => pl.dot(p[0], p[1], 3, (p[0] - MX) * (p[1] - MY) >= 0 ? rgba(P.acc, 0.85) : rgba(P.warn, 0.9)));
    pl.text('x', w - 10, pl.Y(MY) - 6, { size: 13, italic: true, color: P.ink }); pl.text('y', pl.X(MX) + 10, 22, { size: 13, italic: true, color: P.ink });
    if (sel >= 0 && sel < pts.length) {
      const p = pts[sel], c = (p[0] - MX) * (p[1] - MY), col = c >= 0 ? P.acc : P.warn;
      ctx.save(); ctx.fillStyle = rgba(col, 0.3); ctx.strokeStyle = col; ctx.lineWidth = 2;
      const x1 = pl.X(MX), y1 = pl.Y(MY), x2 = pl.X(p[0]), y2 = pl.Y(p[1]);
      ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1)); ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1)); ctx.restore();
      pl.dot(p[0], p[1], 5.5, col, P.surface);
      setO(root, 'contrib', (c >= 0 ? '+' : '') + f2(c));
    } else setO(root, 'contrib', 'tap a point');
    setO(root, 'mx', f2(MX)); setO(root, 'my', f2(MY)); setO(root, 'cov', f2(Math.abs(cov) < 0.005 ? 0 : cov));
    const r = SX * SY > 0 ? cov / (SX * SY) : 0; setO(root, 'corr', f2(Math.abs(r) < 0.005 ? 0 : r));
    const cap = $('[data-o=cap]', root);
    if (cap) cap.textContent = ds === 'par'
      ? 'Y is exactly X squared, so it is completely determined by X. Yet the positive and negative rectangles cancel and the covariance is zero. Zero covariance does not mean independent.'
      : (ds === 'ind' ? 'X and Y are independent, so positive and negative rectangles cancel on average and the covariance is near zero.'
        : 'Purple points sit in quadrants where the deviations have the same sign (product positive). Amber points sit where they differ. Covariance is the average signed rectangle area.');
  }
  cv.style.touchAction = 'pan-y';
  function pick(e) {
    if (!last) return; const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    let best = -1, bd = 1e9; last.pts.forEach((p, i) => { const d = (last.pl.X(p[0]) - mx) ** 2 + (last.pl.Y(p[1]) - my) ** 2; if (d < bd) { bd = d; best = i; } });
    sel = bd < 40 * 40 ? best : -1; rr();
  }
  let down = false;
  cv.addEventListener('pointerdown', e => { down = true; pick(e); }); cv.addEventListener('pointermove', e => { if (down || e.pointerType === 'mouse') pick(e); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => cv.addEventListener(n, () => { down = false; }));
  root.addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (a && a.dataset.act === 'resample') { gen(); sel = -1; rr(); } });
  root.addEventListener('click', e => { if (e.target.closest('.seg button')) sel = -1; });
  const rr = initW(root, draw);
}
