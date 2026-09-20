function wPdf(root) {
  const cv = $('canvas', root);
  root.addEventListener('input', e => {
    const k = e.target.dataset.k;
    if (k !== 'a' && k !== 'b') return;
    const A = $('[data-k=a]', root), B = $('[data-k=b]', root);
    if (k === 'a' && +A.value > +B.value - 0.05) { B.value = String(Math.min(6, +A.value + 0.05)); syncOut(B); }
    if (k === 'b' && +B.value < +A.value + 0.05) { A.value = String(Math.max(-6, +B.value - 0.05)); syncOut(A); }
  });
  function draw() {
    const { ctx, w, h } = setupCanvas(cv); if (w < 20) return;
    const P = pal(root);
    const mu = kv(root, 'mu'), sd = kv(root, 'sd'), lo = kv(root, 'a'), hi = kv(root, 'b'), q = kv(root, 'q');
    const Fl = ncdf(lo, mu, sd), Fh = ncdf(hi, mu, sd), xq = nq(q, mu, sd);
    const pdf = x => npdf(x, mu, sd), peak = pdf(mu), xr = [-6, 6];
    const H1 = Math.round(h * 0.42), pp = new Plot(ctx, P, 40, 12, w - 52, H1, xr, [0, peak * 1.2]);
    const cp = new Plot(ctx, P, 40, H1 + 50, w - 52, H1 - 14, xr, [0, 1.04]);
    pp.frame({ xt: [-6, -4, -2, 0, 2, 4, 6] });
    pp.text('density f(x)', 44, 10, { size: 12, align: 'left' });
    pp.area(pdf, xr[0], lo, rgba(P.warn, 0.45)); pp.area(pdf, lo, hi, rgba(P.acc, 0.6)); pp.area(pdf, hi, xr[1], rgba(P.muted, 0.18));
    pp.line(pdf, xr[0], xr[1], P.ink, 2);
    [[lo, 'x1'], [hi, 'x2']].forEach(([x, t]) => { pp.seg(x, 0, x, peak * 1.15, P.ink, 1.4, [4, 3]); pp.dot(x, 0, 6, P.surface, P.ink); pp.text(t, pp.X(x), pp.Y(peak * 1.15) - 4, { size: 12, color: P.ink, weight: 600 }); });
    cp.frame({ xt: [-6, -4, -2, 0, 2, 4, 6], yt: [0, 0.5, 1], fy: v => v.toFixed(1) });
    cp.text('cdf F(x)', 44, cp.y - 2, { size: 12, align: 'left' });
    const cdf = x => ncdf(x, mu, sd);
    cp.line(cdf, xr[0], xr[1], P.acc, 2.4);
    cp.seg(xr[0], Fl, lo, Fl, P.warn, 1.4, [4, 3]); cp.seg(xr[0], Fh, hi, Fh, P.acc, 1.4, [4, 3]);
    cp.seg(lo, 0, lo, Fl, P.warn, 1.4, [4, 3]); cp.seg(hi, 0, hi, Fh, P.acc, 1.4, [4, 3]);
    cp.seg(xr[0] + 0.12, Fl, xr[0] + 0.12, Fh, P.acc, 6);
    cp.dot(lo, Fl, 4.5, P.warn); cp.dot(hi, Fh, 4.5, P.acc);
    cp.seg(xq, 0, xq, q, P.ink, 1.2, [2, 3]); cp.seg(xr[0], q, xq, q, P.ink, 1.2, [2, 3]); cp.dot(xq, q, 5, P.surface, P.ink);
    cp.text('quantile', cp.X(xq) + 8, cp.Y(q) + 16, { size: 11, align: 'left', color: P.ink });
    setO(root, 'Fl', f4(Fl)); setO(root, 'Fh', f4(Fh)); setO(root, 'diff', f4(Fh - Fl)); setO(root, 'tail', f4(1 - Fh)); setO(root, 'q', f2(q)); setO(root, 'xq', f3(xq));
  }
  root.addEventListener('click', e => {
    const a = e.target.closest('[data-act]'); if (!a || a.dataset.act !== 'slide8') return;
    setRange(root, 'mu', 0); setRange(root, 'sd', 1); setRange(root, 'a', -1.75); setRange(root, 'b', -0.25); rr();
  });
  const rr = initW(root, draw);
}
