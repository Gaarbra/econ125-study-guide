const WMAP = { select: wSelect, pdf: wPdf, joint3d: wJoint, bars3d: wBars, cov: wCov, varsum: wVarsum, scale: wScale, lie: wLie, sampling: wSampling, inference: wInference };
$$('.viz[data-w]').forEach(el => { try { WMAP[el.dataset.w](el); } catch (err) { console.error('widget ' + el.dataset.w, err); } });

const cleanFormula = s => s.replace(/\\begin\{[^}]+\}|\\end\{[^}]+\}|\\left|\\right|\\big|\\quad|\\qquad|\\!/g, ' ').replace(/\\[a-zA-Z]+/g, m => ({'\\mu':'μ','\\sigma':'σ','\\theta':'θ','\\rho':'ρ','\\Phi':'Φ','\\E':'E','\\Pr':'Pr','\\var':'var','\\cov':'cov','\\corr':'corr','\\sqrt':'√','\\sum':'Σ','\\int':'∫','\\pm':'±','\\ne':'≠','\\le':'≤','\\ge':'≥','\\to':'→'}[m] || m.slice(1))).replace(/[{}]/g, '').replace(/\\/g, ' ').replace(/\s+/g, ' ').trim();
const formulaOrigin = (src, lecture) => {
  if (lecture === 'l1') return 'This comes from separating the systematic part of an economic model from the unobserved factors collected in the error term.';
  if (/f_\{Y\|X\}|mid/.test(src)) return 'This comes from the definition of conditional probability: joint probability divided by the probability of the condition.';
  if (/1-F|F\(.+\)-F/.test(src)) return 'This comes from subtracting accumulated probability: use the complement for an upper tail or subtract two CDF values for an interval.';
  if (/E\[|\\E/.test(src) && /sum|int/.test(src)) return 'This comes from the definition of expectation: multiply every possible outcome by its probability, then add or integrate.';
  if (/var/.test(src)) return 'This comes from measuring squared distance from the mean. Expanding the square and using linearity gives the shortcut form.';
  if (/cov|corr/.test(src)) return 'This comes from multiplying the two variables’ deviations from their means. Correlation divides by both standard deviations to remove units.';
  if (/E\[.*mid|\\E.*mid/.test(src)) return 'This comes from taking an average after restricting attention to observations with the stated information.';
  if (/xrightarrow\{p\}|plim/.test(src)) return 'This comes from the Law of Large Numbers: independent sample information accumulates, so a sample average concentrates on its population mean.';
  if (/xrightarrow\{d\}|N\(0,1\)/.test(src)) return 'This comes from the Central Limit Theorem after subtracting the true mean and dividing by the standard error.';
  if (/1\.96|0\.95/.test(src)) return 'This comes from the middle 95% of the standard normal curve, whose endpoints are approximately −1.96 and 1.96.';
  if (/t=|mu_0/.test(src)) return 'This comes from standardizing the gap between an estimate and the null value by the estimate’s standard error.';
  if (lecture === 'l4') return 'This follows from the definitions of an estimator, expectation, and sampling variance applied across repeated samples.';
  return 'This follows from the definition immediately above it and ordinary algebra that preserves equality.';
};
function formulaParts(src) {
  const chunks = cleanFormula(src).split('=').map(s => s.trim()).filter(Boolean);
  if (chunks.length === 1) return [{ kind: 'target', text: chunks[0], label: 'complete statement' }];
  const out = [{ kind: 'target', text: chunks[0], label: 'target: what we want to describe' }];
  chunks.slice(1).forEach((text, i) => { out.push({ kind: 'relation', text: '=', label: 'equality: both sides are the same quantity' }); out.push({ kind: i ? 'step' : 'recipe', text, label: i ? 'equivalent step: the same rule simplified' : 'recipe: inputs and operations used to calculate the target' }); });
  return out;
}
function installFormulaExplorer() {
  $$('.lec:not(.ls) .eq').forEach((eq, index) => {
    if (eq.dataset.explorerReady) return;
    eq.dataset.explorerReady = '1'; eq.tabIndex = 0; eq.setAttribute('role', 'button'); eq.setAttribute('aria-expanded', 'false');
    const panel = document.createElement('div'); panel.className = 'formula-breakdown'; panel.hidden = true; panel.id = 'formula-breakdown-' + index;
    const math = eq.querySelector('[aria-label]'); const src = math ? math.getAttribute('aria-label') : eq.textContent;
    const lecture = eq.closest('.lec').id, parts = formulaParts(src);
    panel.innerHTML = '<p class="fb-title">Formula explorer</p>'
      + '<p>The colors separate the formula by job. Read the pieces from left to right.</p>'
      + '<div class="formula-anatomy" aria-label="Color-coded formula parts">' + parts.map(p => '<span class="formula-part" data-kind="' + p.kind + '">' + p.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</span>').join('') + '</div>'
      + '<ol class="anatomy-list">' + parts.map(p => '<li><strong>' + p.label.split(':')[0] + ':</strong> ' + (p.label.split(':')[1] || p.label) + '</li>').join('') + '</ol>'
      + '<p class="fb-origin"><strong>Where it comes from:</strong> ' + formulaOrigin(src, lecture) + '</p>';
    eq.insertAdjacentElement('afterend', panel);
    const toggle = () => { const open = !panel.hidden; panel.hidden = open; eq.setAttribute('aria-expanded', String(!open)); };
    eq.addEventListener('click', toggle);
    eq.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); } });
  });
}
installFormulaExplorer();
const redrawAll = () => REDRAW.forEach(f => f());
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redrawAll); } catch (_) {}
new MutationObserver(redrawAll).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(redrawAll);
