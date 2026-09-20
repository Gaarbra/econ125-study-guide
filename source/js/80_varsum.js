function wVarsum(root) {
  const cv = $('canvas', root);
  function draw() {
    const { ctx, w, h } = setupCanvas(cv); if (w < 20) return;
    const P = pal(root), a = kv(root, 'a'), b = kv(root, 'b'), sx = kv(root, 'sx'), sy = kv(root, 'sy'), rho = kv(root, 'rho');
    const cov = rho * sx * sy, t1 = a * a * sx * sx, t2 = b * b * sy * sy, t3 = 2 * a * b * cov, tot = t1 + t2 + t3;
    const rows = [['a\u00b2\u00b7var[X]', t1, P.c2], ['b\u00b2\u00b7var[Y]', t2, P.c3], ['2ab\u00b7cov[X,Y]', t3, P.warn], ['var[aX+bY]', tot, P.ink]];
    const lo = Math.min(0, t3, tot) * 1.12, hi = Math.max(t1, t2, tot, 0.5) * 1.12;
    const x0 = 6, x1 = w - 6, X = v => x0 + (v - lo) / (hi - lo) * (x1 - x0), rh = Math.floor((h - 8) / 4);
    rows.forEach(([lab, v, col], i) => {
      const y = 4 + i * rh + 20, bh = rh - 34;
      text2(ctx, P, lab, 6, y - 5, { size: 12, align: 'left', color: P.ink, weight: i === 3 ? 600 : 400 });
      ctx.fillStyle = i === 3 ? P.ink : col; ctx.globalAlpha = 0.9;
      ctx.fillRect(Math.min(X(0), X(v)), y, Math.abs(X(v) - X(0)), bh); ctx.globalAlpha = 1;
      const tx = v >= 0 ? X(v) + 6 : X(v) - 6;
      text2(ctx, P, f2(v), tx, y + bh / 2 + 4, { size: 13, weight: 600, color: P.ink, align: v >= 0 ? 'left' : 'right' });
    });
    ctx.strokeStyle = P.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X(0) + 0.5, 4); ctx.lineTo(X(0) + 0.5, h - 4); ctx.stroke();
    setO(root, 't1', f2(t1)); setO(root, 't2', f2(t2)); setO(root, 't3', f2(t3)); setO(root, 'tot', f2(tot)); setO(root, 'cov', f2(cov));
    const cap = $('[data-o=cap]', root);
    if (cap) cap.textContent = Math.abs(rho) < 0.03 ? 'With rho near 0 (independent or uncorrelated) the cross term vanishes and the variance of the sum is just the two variance terms.'
      : (t3 < 0 ? 'The cross term is negative: X and Y offset each other, so the sum varies less than the two pieces added together.'
        : 'The cross term is positive: X and Y move together, so the sum varies more than the two pieces added together.');
  }
  initW(root, draw);
}
