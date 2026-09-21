function wInference(root) {
  const cv = $('canvas', root), MU = 75;
  function draw() {
    const { ctx, w, h } = setupCanvas(cv); if (w < 20) return;
    const P = pal(root), n = kv(root, 'n'), sd = kv(root, 'sd'), yb = kv(root, 'yb'), mu0 = kv(root, 'mu0');
    const se = sd / Math.sqrt(n), z = (yb - mu0) / se, p = 2 * (1 - ncdf(Math.abs(z), 0, 1));
    const ci0 = yb - 1.96 * se, ci1 = yb + 1.96 * se, view = segVal(root, 'view') || 'clt';
    if (view === 'test') {
      const pl = new Plot(ctx, P, 22, 18, w - 44, h - 54, [-4, 4], [0, 0.44]);
      pl.frame({ xt: [-4,-3,-2,-1,0,1,2,3,4] });
      pl.area(x => npdf(x,0,1), -4, -Math.abs(z), rgba(P.c4,.28)); pl.area(x => npdf(x,0,1), Math.abs(z), 4, rgba(P.c4,.28));
      pl.line(x => npdf(x,0,1), -4, 4, P.ink, 2.4); pl.seg(z, 0, z, npdf(z,0,1), P.warn, 2.5);
      pl.text('observed z = ' + f2(z), pl.X(clamp(z,-3.7,3.7)), pl.Y(Math.min(.41,npdf(z,0,1)+.06)), { size:12, color:P.warn, weight:600 });
      pl.text('shaded tails = p-value', w/2, h-6, { size:12, color:P.c4, weight:600 });
    } else {
      const span = Math.max(15, 5 * se), lo = MU - span, hi = MU + span;
      const peak = npdf(MU,MU,se), pl = new Plot(ctx, P, 22, 18, w - 44, h - 54, [lo,hi], [0,peak*1.2]);
      const xt=[]; for(let x=Math.ceil(lo/5)*5;x<=hi;x+=5) xt.push(x); pl.frame({xt});
      pl.area(x => npdf(x,MU,se), lo, hi, rgba(P.acc,.16)); pl.line(x => npdf(x,MU,se), lo, hi, P.acc, 2.5);
      pl.seg(MU,0,MU,peak,P.ink,2,[4,3]); pl.text('true mean μ = 75',pl.X(MU),pl.Y(peak)+14,{size:12,color:P.ink,weight:600});
      if (view === 'clt') {
        pl.seg(yb,0,yb,npdf(yb,MU,se),P.warn,2.5); pl.text('observed ȳ',pl.X(clamp(yb,lo,hi)),pl.Y(Math.min(peak,npdf(yb,MU,se)))+14,{size:12,color:P.warn,weight:600});
      } else {
        const y = peak*.18; pl.seg(ci0,y,ci1,y,P.warn,5); pl.dot(yb,y,5,P.warn); pl.text('95% interval',pl.X(yb),pl.Y(y)+22,{size:12,color:P.warn,weight:600});
      }
    }
    setO(root,'se',f2(se)); setO(root,'ci','['+f2(ci0)+', '+f2(ci1)+']'); setO(root,'z',f2(z)); setO(root,'p',f4(p));
    const cap = $('[data-o=cap]',root);
    cap.textContent = view === 'clt' ? 'Raise n: the curve narrows because σ/√n falls. LLN is the concentration on μ; CLT is the approximately normal shape after standardizing.'
      : view === 'ci' ? 'The interval is centered on the observed sample mean. It narrows as n grows and covers μ = 75 when the black reference line falls inside the gold bar.'
      : 'The null value sets the center of the test. The gold line is the observed standardized gap; the shaded tails are outcomes at least as extreme under H₀.';
  }
  initW(root, draw);
}
