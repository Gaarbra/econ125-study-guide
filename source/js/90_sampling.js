function wSampling(root) {
  const cv1 = $('canvas.cv-a', root), cv2 = $('canvas.cv-b', root);
  const NS = [2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000], MU = 75, SD = 25;
  const s2 = Math.log(1 + (SD / MU) ** 2), m0 = Math.log(MU) - s2 / 2, sl = Math.sqrt(s2);
  let est = [], last = null, key = '', lastEst = null;
  const draw1 = pop => (pop === 'ln' ? Math.exp(m0 + sl * randn()) : MU + SD * randn());
  const popPdf = (pop, y) => (pop === 'ln' ? (y > 0 ? Math.exp(-((Math.log(y) - m0) ** 2) / (2 * s2)) / (y * sl * SQ2PI) : 0) : npdf(y, MU, SD));
  function estimate(a, t) {
    const n = a.length; if (t === 'mean') return avg(Array.from(a));
    if (t === 'y1') return a[0];
    const m = avg(Array.from(a)); let ss = 0; for (let i = 0; i < n; i++) ss += (a[i] - m) ** 2;
    return t === 's2' ? ss / (n - 1) : ss / n;
  }
  function cfg() { return { n: NS[Math.round(kv(root, 'n'))], pop: segVal(root, 'pop') || 'ln', t: segVal(root, 'est') || 'mean' }; }
  function sync() { const c = cfg(), k0 = c.n + '|' + c.pop + '|' + c.t; if (k0 !== key) { key = k0; est = []; last = null; lastEst = null; } return c; }
  function add(count) {
    const c = sync();
    for (let k = 0; k < count && est.length < 20000; k++) {
      const a = new Float64Array(c.n); for (let i = 0; i < c.n; i++) a[i] = draw1(c.pop);
      last = a; lastEst = estimate(a, c.t); est.push(lastEst);
    }
    rr();
  }
  function theta(t) { return (t === 'mean' || t === 'y1') ? MU : SD * SD; }
  function hist(ctx, pl, vals, lo, hi, nb, fill) {
    const cnt = new Array(nb).fill(0), bw = (hi - lo) / nb; vals.forEach(v => { const k = Math.floor((v - lo) / bw); if (k >= 0 && k < nb) cnt[k]++; });
    const tot = vals.length * bw; return cnt.map((c, k) => ({ x0: lo + k * bw, x1: lo + (k + 1) * bw, d: c / tot }));
  }
  function draw() {
    const c = sync(), P = pal(root);
    const th = theta(c.t), isVar = c.t === 's2' || c.t === 'sn';
    setO(root, 'nlab', String(c.n));
    /* panel A: one sample */
    const A = setupCanvas(cv1);
    if (A.w > 20) {
      const pl = new Plot(A.ctx, P, 14, 10, A.w - 28, A.h - 32, [0, 175], [0, 0.03]);
      pl.frame({ xt: [0, 25, 50, 75, 100, 125, 150, 175] });
      pl.line(y => popPdf(c.pop, y), 1, 175, P.muted, 2, [5, 4], 200);
      if (last) {
        const bars = hist(A.ctx, pl, Array.from(last), 0, 175, c.n < 30 ? 14 : 35);
        const ym = Math.max(...bars.map(b => b.d), 0.02) * 1.15; pl.yr = [0, ym];
        bars.forEach(b => { if (b.d > 0) pl.rect(b.x0, 0, b.x1, b.d, rgba(P.acc, 0.55)); });
        pl.line(y => popPdf(c.pop, y), 1, 175, P.muted, 2, [5, 4], 200);
        const m = avg(Array.from(last)); pl.seg(m, 0, m, ym, P.warn, 2.4); { const r = pl.X(m) > pl.x + pl.w * 0.55; pl.text('sample mean ' + f2(m), pl.X(m) + (r ? -6 : 6), pl.Y(ym) + 12, { size: 12, align: r ? 'right' : 'left', color: P.ink, weight: 600 }); }
      } else pl.text('Draw a sample to see one', A.w / 2, A.h / 2, { size: 13 });
    }
    /* panel B: sampling distribution */
    const B = setupCanvas(cv2);
    if (B.w > 20) {
      let lo, hi;
      if (est.length >= 30) { const s = est.slice().sort((a, b) => a - b); lo = Math.min(s[Math.floor(s.length * 0.004)], th); hi = Math.max(s[Math.ceil(s.length * 0.996) - 1], th); const pad = (hi - lo) * 0.08; lo -= pad; hi += pad; }
      else if (c.t === 'mean') { lo = th - 4 * SD / Math.sqrt(c.n); hi = th + 4 * SD / Math.sqrt(c.n); }
      else if (c.t === 'y1') { lo = 0; hi = 175; } else { lo = 0; hi = 2000; }
      const pl = new Plot(B.ctx, P, 14, 10, B.w - 28, B.h - 32, [lo, hi], [0, 1]);
      const nb = 34;
      const bars = est.length ? hist(B.ctx, pl, est, lo, hi, nb) : [];
      let ym = Math.max(...bars.map(b => b.d), 1e-9); const se0 = c.t === 'mean' ? SD / Math.sqrt(c.n) : 0;
      if (c.t === 'mean') ym = Math.max(ym, npdf(th, th, se0));
      pl.yr = [0, ym * 1.15];
      const step = (hi - lo) / 5, mag = Math.pow(10, Math.floor(Math.log10(step))), st = Math.ceil(step / mag) * mag, xt = []; for (let t = Math.ceil(lo / st) * st; t <= hi; t += st) xt.push(t);
      pl.frame({ xt, fx: v => (Math.abs(v) >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10)) });
      bars.forEach(b => { if (b.d > 0) pl.rect(b.x0, 0, b.x1, b.d, rgba(P.acc, 0.55)); });
      if (c.t === 'mean') pl.line(x => npdf(x, th, se0), lo, hi, P.ink, 2, [5, 4], 200);
      pl.seg(th, 0, th, pl.yr[1], P.ink, 2);
      { const r = pl.X(th) > pl.x + pl.w * 0.6; pl.text('true value ' + (isVar ? '625' : '75'), pl.X(th) + (r ? -6 : 6), pl.Y(pl.yr[1]) + 12, { size: 12, align: r ? 'right' : 'left', color: P.ink, weight: 600 }); }
      if (est.length) { const m = avg(est); pl.seg(m, 0, m, pl.yr[1] * 0.85, P.warn, 2.4); { const r = pl.X(m) > pl.x + pl.w * 0.55; pl.text('average of estimates ' + f2(m), pl.X(m) + (r ? -6 : 6), pl.Y(pl.yr[1] * 0.85) + 12, { size: 12, align: r ? 'right' : 'left', color: P.warn, weight: 600 }); } }
      else pl.text('Press "Draw 100 samples"', B.w / 2, B.h / 2, { size: 13 });
    }
    /* readouts */
    const m = est.length ? avg(est) : NaN, sdE = est.length > 1 ? Math.sqrt(avg(est.map(v => (v - m) ** 2))) : NaN;
    setO(root, 'count', String(est.length)); setO(root, 'th', f2(th)); setO(root, 'mean', f2(m)); setO(root, 'bias', f2(m - th)); setO(root, 'sd', f2(sdE));
    setO(root, 'theory', c.t === 'mean' ? f2(SD / Math.sqrt(c.n)) : (c.t === 'y1' ? '25.00' : 'n/a'));
    setO(root, 'expect', c.t === 'sn' ? f2(625 * (c.n - 1) / c.n) : f2(th));
    const cap = $('[data-o=cap]', root);
    if (cap) cap.textContent = c.t === 'mean' ? 'The sample average is unbiased and its spread (standard error) shrinks like 25 divided by the square root of n. Raise n and the histogram tightens around 75.'
      : c.t === 'y1' ? 'Using only the first observation is also unbiased, but its spread stays at about 25 no matter how big n gets. Unbiased is not the same as precise.'
      : c.t === 's2' ? 'Dividing by n-1 makes the sample variance unbiased: the average of the estimates sits on 625.'
      : 'Dividing by n instead is biased low: the average of the estimates sits at (n-1)/n times 625, which matters most for small n.';
  }
  root.addEventListener('click', e => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    const act = a.dataset.act;
    if (act === 'd1') add(1); else if (act === 'd100') add(100); else if (act === 'd1000') add(1000);
    else if (act === 'reset') { est = []; last = null; rr(); }
  });
  const rr = initW(root, draw);
  add(200);
}
