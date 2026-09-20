const fs = require('fs');
const path = require('path');
const { mathjax } = require('mathjax-full/js/mathjax.js');
const { TeX } = require('mathjax-full/js/input/tex.js');
const { SVG } = require('mathjax-full/js/output/svg.js');
const { liteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor.js');
const { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html.js');
require('mathjax-full/js/input/tex/AllPackages.js');

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const tex = new TeX({
  packages: ['base', 'ams', 'newcommand', 'configmacros', 'noundefined'],
  macros: {
    E: '\\operatorname{E}', var: '\\operatorname{var}', cov: '\\operatorname{cov}', corr: '\\operatorname{corr}',
    sd: '\\operatorname{sd}', se: '\\operatorname{se}', Supp: '\\operatorname{Supp}', Bias: '\\operatorname{Bias}',
    skew: '\\operatorname{skew}', kurt: '\\operatorname{kurtosis}',
  },
});
const svg = new SVG({ fontCache: 'none' });
const doc = mathjax.document('', { InputJax: tex, OutputJax: svg });

let count = 0;
function conv(src, display) {
  const node = doc.convert(src, { display, em: 16, ex: 8, containerWidth: 1200 });
  let out = adaptor.innerHTML(node);
  if (/data-mjx-error|merror/.test(out)) throw new Error('MathJax error in: ' + src + '\n' + out.slice(0, 300));
  out = out.replace(/<svg[^>]*>/, tag => tag.replace(/(-?\d+(?:\.\d+)?)ex/g, (_, n) => (parseFloat(n) * 0.442).toFixed(3) + 'em'));
  if (display) out = out.replace(/style="[^"]*"/, '');
  count++;
  const label = src.replace(/\s+/g, ' ').trim().replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `<span class="${display ? 'mb' : 'm'}" role="img" aria-label="${label}">${out}</span>`;
}
function mathify(t) {
  t = t.replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => conv(m, true));
  t = t.replace(/([(\[]*)\$([^$\n]+?)\$([,.;:!?)\]]*)/g, (_, pre, m, post) =>
    (pre || post) ? `<span class="nw">${pre}${conv(m, false)}${post}</span>` : conv(m, false));
  return t;
}

const dir = path.join(__dirname, 'src');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort();
let html = '';
for (const f of files) {
  let t = fs.readFileSync(path.join(dir, f), 'utf8');
  // widget includes: <!--W:name-->
  t = t.replace(/<!--W:([\w-]+)-->/g, (_, n) => fs.readFileSync(path.join(dir, 'widgets', n + '.html'), 'utf8'));
  t = mathify(t);
  html += t + '\n';
}
// script
const jsdir = path.join(__dirname, 'js');
const js = fs.readdirSync(jsdir).filter(f => f.endsWith('.js')).sort().map(f => fs.readFileSync(path.join(jsdir, f), 'utf8')).join('\n');
if (/<\/script/i.test(js)) throw new Error('script contains </script');
const scriptTag = '<script>\n(function(){\n\'use strict\';\n' + js + '\n})();\n</script>';
html = html.replace('%%SCRIPT%%', () => scriptTag);
const out = process.argv[2] || path.join(__dirname, '..', 'index.html');
fs.writeFileSync(out, html);
console.log('equations rendered:', count, ' bytes:', Buffer.byteLength(html));
