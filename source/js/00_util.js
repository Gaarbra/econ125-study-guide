const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const REDRAW = [];

function cssVar(n, el) { return getComputedStyle(el || document.documentElement).getPropertyValue(n).trim(); }
function hex2rgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(h, a) { const c = hex2rgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function mixc(h1, h2, t, a = 1) {
  const x = hex2rgb(h1), y = hex2rgb(h2);
  return `rgba(${Math.round(x[0] + (y[0] - x[0]) * t)},${Math.round(x[1] + (y[1] - x[1]) * t)},${Math.round(x[2] + (y[2] - x[2]) * t)},${a})`;
}
function shade(h, f, a = 1) { const c = hex2rgb(h); return `rgba(${Math.round(c[0] * f)},${Math.round(c[1] * f)},${Math.round(c[2] * f)},${a})`; }
function pal(el) {
  const g = n => cssVar(n, el);
  return { ink: g('--ink'), muted: g('--muted'), rule: g('--rule'), surface: g('--surface'), acc: g('--acc'), tint: g('--tint'),
    warn: g('--warn'), c1: g('--c1'), c2: g('--c2'), c3: g('--c3'), c4: g('--c4'), onacc: g('--onacc'), sans: g('--sans') };
}

/* statistics */
const SQ2PI = Math.sqrt(2 * Math.PI);
const npdf = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * SQ2PI);
function erf(x) {
  const s = x < 0 ? -1 : 1; x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const p = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  return s * (1 - p * Math.exp(-x * x));
}
const ncdf = (x, m, s) => 0.5 * (1 + erf((x - m) / (s * Math.SQRT2)));
function nq(q, m, s) {
  let lo = -12, hi = 12;
  for (let i = 0; i < 70; i++) { const mid = (lo + hi) / 2; if (ncdf(mid, 0, 1) < q) lo = mid; else hi = mid; }
  return m + s * (lo + hi) / 2;
}
function randn() { let u = 0; while (u === 0) u = Math.random(); const v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function bvn(u, v, su, sv, r) {
  const zu = u / su, zv = v / sv, d = 1 - r * r;
  return Math.exp(-0.5 * (zu * zu - 2 * r * zu * zv + zv * zv) / d) / (2 * Math.PI * su * sv * Math.sqrt(d));
}
const avg = a => a.reduce((s, v) => s + v, 0) / a.length;
const f2 = v => (isFinite(v) ? v.toFixed(2) : 'n/a');
const f3 = v => (isFinite(v) ? v.toFixed(3) : 'n/a');
const f4 = v => (isFinite(v) ? v.toFixed(4) : 'n/a');
const nolead = v => v.toFixed(2).replace(/^0\./, '.').replace(/^-0\./, '-.');

/* canvas + scheduling */
function setupCanvas(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = cv.getBoundingClientRect();
  const w = Math.round(r.width), h = Math.round(r.height);
  if (w > 0 && (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr))) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}
function scheduler(fn) {
  let pending = false;
  return () => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; try { fn(); } catch (e) { console.error(e); } }); };
}

/* controls */
function segVal(root, name) { const b = $(`.seg[data-name="${name}"] button[aria-pressed="true"]`, root); return b ? b.dataset.v : null; }
function kv(root, k) { const e = $(`[data-k="${k}"]`, root); if (!e) return null; return e.type === 'checkbox' ? e.checked : parseFloat(e.value); }
function setO(root, k, txt) { $$(`[data-o="${k}"]`, root).forEach(e => { e.textContent = txt; }); }
function syncOut(inp) {
  const o = inp.parentElement.querySelector('output');
  if (o) { const dp = parseInt(inp.dataset.dp, 10); o.textContent = (+inp.value).toFixed(isNaN(dp) ? 2 : dp); }
}
function showOnly(root, mode) {
  $$('[data-only]', root).forEach(e => { e.hidden = !e.dataset.only.split(',').includes(mode); });
  $$('[data-cap]', root).forEach(e => { e.hidden = e.dataset.cap !== mode; });
}
function initW(root, render) {
  const rr = scheduler(render);
  $$('input[type=range]', root).forEach(syncOut);
  root.addEventListener('input', e => { if (e.target.type === 'range') syncOut(e.target); rr(); });
  root.addEventListener('click', e => {
    const b = e.target.closest('.seg button');
    if (b && root.contains(b)) { $$('button', b.parentElement).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); rr(); }
  });
  REDRAW.push(rr);
  $$('canvas', root).forEach(c => new ResizeObserver(rr).observe(c));
  rr();
  return rr;
}
function setRange(root, k, v) { const e = $(`[data-k="${k}"]`, root); if (e) { e.value = String(v); syncOut(e); } }
