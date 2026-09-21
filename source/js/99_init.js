const WMAP = { select: wSelect, pdf: wPdf, joint3d: wJoint, bars3d: wBars, cov: wCov, varsum: wVarsum, scale: wScale, lie: wLie, sampling: wSampling };
$$('.viz[data-w]').forEach(el => { try { WMAP[el.dataset.w](el); } catch (err) { console.error('widget ' + el.dataset.w, err); } });

const formulaTerms = [
  ['\\bar Y|\\bar y', 'sample mean: the average calculated from the observations'],
  ['Y_i|Y', 'an outcome or observation'], ['X', 'an explanatory or conditioning variable'],
  ['n', 'sample size: how many observations are included'],
  ['\\mu|mu', 'population mean: the long-run average'],
  ['\\sigma|sigma', 'population standard deviation: typical distance from the mean'],
  ['S|s', 'sample standard deviation: an estimate of population spread'],
  ['\\theta|theta', 'the population quantity the estimator is targeting'],
  ['\\alpha|alpha', 'significance level: the chosen Type I error rate'],
  ['\\Phi|Phi', 'standard normal CDF: the area to the left of z'],
  ['t', 'a standardized distance from a null value'],
  ['\\E|E', 'expected value: a probability-weighted average'],
  ['\\var|var', 'variance: expected squared distance from a mean'],
  ['\\cov|cov', 'covariance: whether two variables move together']
];
const formulaRule = src => {
  if (/xrightarrow\{p\}|plim/.test(src)) return 'This is a probability-limit statement: as the sample grows, the estimator gets arbitrarily close to its target. The Law of Large Numbers supplies this result for a sample average.';
  if (/xrightarrow\{d\}|N\(0,1\)/.test(src)) return 'This is an approximation about a sampling distribution. The Central Limit Theorem says a standardized sample average becomes approximately normal in large samples.';
  if (/1\.96|0\.95/.test(src)) return 'This rearranges a central 95% normal probability statement to place a plausible range around the unknown population value.';
  if (/t=|p_\{|p\\/.test(src)) return 'This compares the estimate with a null value in standard-error units. A larger absolute distance is harder to explain if the null is true.';
  if (/sum|int/.test(src)) return 'This is a weighted average or accumulated area: each possible value is weighted by how likely it is.';
  if (/var|sd|sigma/.test(src)) return 'This measures spread. Squaring makes positive and negative deviations contribute equally; the square root returns to the original units.';
  if (/cov|corr|rho/.test(src)) return 'This summarizes how two variables move together, then scales the result when a unit-free comparison is needed.';
  if (/mid|conditional|\|/.test(src)) return 'The vertical bar means “given.” The formula restricts attention to a subgroup or information set before averaging.';
  return 'Read the left side as the quantity being described and the right side as the rule for calculating it. Each equals sign preserves the same quantity while making one step more explicit.';
};
const formulaPractice = src => {
  if (/xrightarrow\{p\}|plim/.test(src)) return 'Imagine sample means of wages with true mean 20. Explain what should happen to the chance that |ȳ − 20| > 1 as n grows.';
  if (/xrightarrow\{d\}|N\(0,1\)/.test(src)) return 'If μ = 75, σ = 25, and n = 100, compute the standard error before using the normal approximation.';
  if (/1\.96|0\.95/.test(src)) return 'With ȳ = 75, s = 25, and n = 100, substitute into ȳ ± 1.96s/√n and interpret the interval.';
  if (/t=|p_\{|p\\/.test(src)) return 'With ȳ = 75, μ₀ = 70, s = 25, and n = 100, calculate t and decide what a two-sided test suggests at 5%.';
  if (/var|sd|sigma/.test(src)) return 'Choose three observed values, compute their mean, then compare the average squared distance with the variance formula.';
  return 'Choose small, realistic values for each symbol, substitute them one at a time, and state what the resulting number means in the original units.';
};
function installFormulaExplorer() {
  $$('.lec:not(.ls) .eq').forEach((eq, index) => {
    if (eq.dataset.explorerReady) return;
    eq.dataset.explorerReady = '1'; eq.tabIndex = 0; eq.setAttribute('role', 'button'); eq.setAttribute('aria-expanded', 'false');
    const panel = document.createElement('div'); panel.className = 'formula-breakdown'; panel.hidden = true; panel.id = 'formula-breakdown-' + index;
    const math = eq.querySelector('[aria-label]'); const src = math ? math.getAttribute('aria-label') : eq.textContent;
    const terms = formulaTerms.filter(([pattern]) => new RegExp(pattern).test(src));
    panel.innerHTML = '<p class="fb-title">Formula explorer</p>'
      + '<p><strong>Step 1 — identify the target:</strong> the expression on the left is the quantity you want to describe or estimate.</p>'
      + '<p><strong>Step 2 — read the operation:</strong> the symbols on the right tell you which observations, weights, deviations, or probabilities are combined.</p>'
      + '<p><strong>Step 3 — ask why:</strong> ' + formulaRule(src) + '</p>'
      + (terms.length ? '<p><strong>Symbols in this formula:</strong></p><ul>' + terms.map(([_, text]) => '<li>' + text + '</li>').join('') + '</ul>' : '')
      + '<p><strong>Try it:</strong> ' + formulaPractice(src) + '</p>';
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
