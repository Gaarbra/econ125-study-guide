const WMAP = { select: wSelect, pdf: wPdf, joint3d: wJoint, bars3d: wBars, cov: wCov, varsum: wVarsum, scale: wScale, lie: wLie, sampling: wSampling };
$$('.viz[data-w]').forEach(el => { try { WMAP[el.dataset.w](el); } catch (err) { console.error('widget ' + el.dataset.w, err); } });
const redrawAll = () => REDRAW.forEach(f => f());
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redrawAll); } catch (_) {}
new MutationObserver(redrawAll).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(redrawAll);
