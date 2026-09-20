class Plot {
  constructor(ctx, P, x, y, w, h, xr, yr) { this.ctx = ctx; this.P = P; this.x = x; this.y = y; this.w = w; this.h = h; this.xr = xr; this.yr = yr; }
  X(v) { return this.x + (v - this.xr[0]) / (this.xr[1] - this.xr[0]) * this.w; }
  Y(v) { return this.y + this.h - (v - this.yr[0]) / (this.yr[1] - this.yr[0]) * this.h; }
  text(s, x, y, o = {}) {
    const c = this.ctx;
    c.font = `${o.italic ? 'italic ' : ''}${o.weight || 400} ${o.size || 12}px ${this.P.sans}`;
    c.fillStyle = o.color || this.P.muted; c.textAlign = o.align || 'center'; c.textBaseline = o.base || 'alphabetic';
    c.fillText(s, x, y);
  }
  frame(o = {}) {
    const c = this.ctx, P = this.P, yb = this.Y(this.yr[0]);
    c.save(); c.strokeStyle = P.rule; c.lineWidth = 1;
    c.beginPath(); c.moveTo(this.x, yb + 0.5); c.lineTo(this.x + this.w, yb + 0.5); c.stroke();
    (o.xt || []).forEach(v => {
      const px = this.X(v);
      c.beginPath(); c.moveTo(px + 0.5, yb); c.lineTo(px + 0.5, yb + 4); c.stroke();
      this.text((o.fx || (t => String(t)))(v), px, yb + 16, { size: 11 });
    });
    (o.yt || []).forEach(v => {
      const py = this.Y(v);
      if (o.grid !== false) { c.globalAlpha = 0.6; c.beginPath(); c.moveTo(this.x, py + 0.5); c.lineTo(this.x + this.w, py + 0.5); c.stroke(); c.globalAlpha = 1; }
      this.text((o.fy || (t => String(t)))(v), this.x - 6, py + 4, { size: 11, align: 'right' });
    });
    c.restore();
  }
  path(fn, a, b, n) {
    const c = this.ctx; c.beginPath();
    for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; const px = this.X(x), py = this.Y(fn(x)); if (i === 0) c.moveTo(px, py); else c.lineTo(px, py); }
  }
  line(fn, a, b, color, lw = 2, dash = null, n = 220) {
    const c = this.ctx; c.save(); this.path(fn, a, b, n);
    c.strokeStyle = color; c.lineWidth = lw; c.setLineDash(dash || []); c.lineJoin = 'round'; c.stroke(); c.restore();
  }
  area(fn, a, b, fill, base = 0, n = 180) {
    if (b <= a) return;
    const c = this.ctx; c.save(); c.beginPath(); c.moveTo(this.X(a), this.Y(base));
    for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; c.lineTo(this.X(x), this.Y(fn(x))); }
    c.lineTo(this.X(b), this.Y(base)); c.closePath(); c.fillStyle = fill; c.fill(); c.restore();
  }
  seg(x1, y1, x2, y2, color, lw = 1.5, dash = null) {
    const c = this.ctx; c.save(); c.beginPath(); c.moveTo(this.X(x1), this.Y(y1)); c.lineTo(this.X(x2), this.Y(y2));
    c.strokeStyle = color; c.lineWidth = lw; c.setLineDash(dash || []); c.stroke(); c.restore();
  }
  dot(x, y, r, fill, stroke) {
    const c = this.ctx; c.beginPath(); c.arc(this.X(x), this.Y(y), r, 0, 7); c.fillStyle = fill; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
  }
  rect(x1, y1, x2, y2, fill) {
    const c = this.ctx; c.fillStyle = fill; c.fillRect(this.X(x1), this.Y(y2), this.X(x2) - this.X(x1), this.Y(y1) - this.Y(y2));
  }
}
function poly(ctx, pts, fill, stroke, lw) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
function polyline(ctx, pts, color, lw, dash) {
  ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = color; ctx.lineWidth = lw || 1; ctx.setLineDash(dash || []); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
}
function text2(ctx, P, s, x, y, o = {}) {
  ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || 400} ${o.size || 12}px ${P.sans}`;
  ctx.fillStyle = o.color || P.muted; ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'alphabetic';
  ctx.fillText(s, x, y);
}
