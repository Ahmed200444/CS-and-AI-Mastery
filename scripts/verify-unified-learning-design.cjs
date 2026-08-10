const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const courseDir = path.join(root, 'courses');
const failures = [];

function fail(msg){ failures.push(msg); }
function count(haystack, needle){ return haystack.split(needle).length - 1; }

if (!fs.existsSync(indexPath)) fail('index.html missing');
if (!fs.existsSync(path.join(root,'assets','unified-learning-design.css'))) fail('unified-learning-design.css missing');
if (!fs.existsSync(path.join(root,'assets','unified-learning-design.js'))) fail('unified-learning-design.js missing');

if (!failures.length) {
  const index = fs.readFileSync(indexPath,'utf8');
  if (count(index,'assets/unified-learning-design.css') !== 1) fail('index.html must contain exactly one unified design stylesheet tag');
  if (count(index,'assets/unified-learning-design.js') !== 1) fail('index.html must contain exactly one unified design script tag');
  if (index.includes('2 courses available now (Computer Architecture, Computer Networks), 5 more stages planned')) fail('stale Computer Engineering 2/5 hub count is still visible');
  if (index.includes('title="This course is planned and is not available yet.">This course is planned and is not available yet</button>')) fail('old repetitive planned-stage button copy is still present');

  // Syntax-check every inline JavaScript block after build-time injection. JSON/data
  // script tags are skipped. This directly guards against a path page accidentally
  // exposing/breaking because an inline script was malformed.
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let m, checked = 0;
  while ((m = re.exec(index))) {
    const attrs = m[1] || '';
    if (/\bsrc\s*=/.test(attrs)) continue;
    const typeMatch = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i);
    const type = typeMatch ? typeMatch[1].toLowerCase() : '';
    if (type && !/(javascript|ecmascript|module)/.test(type)) continue;
    const code = m[2] || '';
    if (!code.trim()) continue;
    try { new vm.Script(code, { filename:`index-inline-${checked+1}.js` }); }
    catch (e) { fail(`inline script ${checked+1} has invalid JavaScript: ${e.message}`); }
    checked++;
  }
  if (checked < 1) fail('no inline JavaScript blocks were syntax-checked');
}

if (!fs.existsSync(courseDir)) {
  fail('generated courses directory missing');
} else {
  const pages = fs.readdirSync(courseDir).filter(f=>f.endsWith('.html'));
  if (pages.length !== 54) fail(`expected 54 generated course pages, found ${pages.length}`);
  for (const file of pages) {
    const html = fs.readFileSync(path.join(courseDir,file),'utf8');
    if (count(html,'../assets/unified-learning-design.css') !== 1) fail(`${file}: missing or duplicate unified stylesheet`);
    if (count(html,'../assets/unified-learning-design.js') !== 1) fail(`${file}: missing or duplicate unified script`);
    if (count(html,"document.documentElement.classList.add('csai-unified-design')") !== 1) fail(`${file}: missing unified design first-paint marker`);
  }
}

if (failures.length) {
  console.error('Unified learning design verification failed:');
  failures.forEach(f=>console.error(` - ${f}`));
  process.exit(1);
}
console.log('Unified learning design verification passed: index path UI + 54 generated course pages are wired consistently.');
