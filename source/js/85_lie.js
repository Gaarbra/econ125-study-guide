function wLie(root) {
  const cv = $('canvas', root), NOISE = [], JIT = [];
  for (let i = 0; i < 4; i++) { NOISE.push(Array.from({ length: 40 }, randn)); JIT.push(Array.from({ length: 40 }, () => Math.random())); }
  function draw() {
    const { ctx, w, h } = setupCanvas(cv); if (w < 20) return;
    const P = pal(root), size = [1, 2, 3, 4].map(i => Math.round(kv(root, 's' + i))), mean = [1, 2, 3, 4].map(i => kv(root, 'm' + i));
    const N = size.reduce((s, v) => s + v, 0), cols = [P.c1, P.c2, P.c3, P.c4];
    const grades = size.map((n, i) => {
      const nz = NOISE[i].slice(0, n), c = avg(nz);
      return nz.map(v => mean[i] + 7 * (v - c));
    });
    const all = grades.flat(), direct = avg(all), weighted = size.reduce((s, n, i) => s + n / N * mean[i], 0);
    const yr = [40, 110], pl = new Plot(ctx, P, 34, 10, w - 44, h - 50, [0, 1], yr);
    pl.frame({ yt: [50, 70, 90, 110], grid: true });
    let x = 0; const gap = 0.012;
    size.forEach((n, i) => {
      const w1 = n / N, xa = x + gap / 2, xb = x + w1 - gap / 2;
      pl.rect(xa, yr[0], xb, yr[1], rgba(cols[i], 0.07));
      grades[i].forEach((g, j) => pl.dot(xa + (xb - xa) * (0.1 + 0.8 * JIT[i][j]), clamp(g, yr[0] + 1, yr[1] - 1), 3, rgba(cols[i], 0.85)));
      pl.seg(xa, mean[i], xb, mean[i], cols[i], 3.5);
      pl.text('S' + (i + 1), pl.X((xa + xb) / 2), h - 26, { size: 12, weight: 600, color: cols[i] });
      pl.text(Math.round(w1 * 100) + '%', pl.X((xa + xb) / 2), h - 11, { size: 11 });
      x += w1;
    });
    pl.seg(0, direct, 1, direct, P.ink, 2, [6, 4]);
    text2(ctx, P, 'overall mean', w - 12, pl.Y(direct) - 6, { size: 12, align: 'right', color: P.ink, weight: 600 });
    setO(root, 'N', String(N)); setO(root, 'direct', f3(direct)); setO(root, 'weighted', f3(weighted));
    setO(root, 'calc', size.map((n, i) => f2(n / N) + '\u00d7' + f2(mean[i])).join(' + '));
  }
  initW(root, draw);
}
