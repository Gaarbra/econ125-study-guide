/* Minimal orthographic 3D view: az rotates about the vertical axis, el tilts. Depth grows away from the camera. */
class View3D {
  constructor(cv, o) {
    this.cv = cv; this.az = o.az; this.el = o.el; this.R = o.R; this.zc = o.zc; this.onchange = o.onchange || (() => {}); this.hint = true;
    cv.style.touchAction = 'pan-y'; cv.tabIndex = 0;
    let d = null;
    cv.addEventListener('pointerdown', e => { d = { x: e.clientX, y: e.clientY, t: e.pointerType }; try { cv.setPointerCapture(e.pointerId); } catch (_) {} this.hint = false; });
    cv.addEventListener('pointermove', e => {
      if (!d) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y; d.x = e.clientX; d.y = e.clientY;
      this.az += dx * 0.012;
      if (d.t !== 'touch') this.el = clamp(this.el + dy * 0.01, 0.1, 1.45);
      this.onchange();
    });
    const end = () => { d = null; };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => cv.addEventListener(n, end));
    cv.addEventListener('keydown', e => {
      const k = e.key;
      if (k === 'ArrowLeft') this.az -= 0.08; else if (k === 'ArrowRight') this.az += 0.08;
      else if (k === 'ArrowUp') this.el = clamp(this.el + 0.06, 0.1, 1.45); else if (k === 'ArrowDown') this.el = clamp(this.el - 0.06, 0.1, 1.45);
      else return;
      e.preventDefault(); this.hint = false; this.onchange();
    });
  }
  setSize(w, h) { this.w = w; this.h = h; this.s = 0.5 * Math.min(w, h * 1.05) / this.R; this.cx = w / 2; this.cy = h * 0.53; }
  P(x, y, z) {
    z -= this.zc;
    const ca = Math.cos(this.az), sa = Math.sin(this.az), ce = Math.cos(this.el), se = Math.sin(this.el);
    const x1 = x * ca - y * sa, y1 = x * sa + y * ca;
    return [this.cx + this.s * x1, this.cy - this.s * (y1 * se + z * ce), y1 * ce - z * se];
  }
  nd(nx, ny, nz) {
    const ca = Math.cos(this.az), sa = Math.sin(this.az), ce = Math.cos(this.el), se = Math.sin(this.el);
    return (nx * sa + ny * ca) * ce - nz * se;
  }
}
