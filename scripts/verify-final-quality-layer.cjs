const fs = require('fs');
const path = require('path');
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

const pages = fs.readdirSync('courses').filter(file => file.endsWith('.html'));
assert(pages.length === 62, `Expected 62 courses, found ${pages.length}`);

for (const file of pages) {
  const html = fs.readFileSync(path.join('courses', file), 'utf8');
  for (const asset of ['final-quality-layer.css', 'smart-code-editor.js', 'portfolio-publish-controls.js']) {
    assert(
      (html.match(new RegExp(asset.replace('.', '\\.'), 'g')) || []).length === 1,
      `${file}: ${asset} must appear exactly once`
    );
  }
}

const backend = fs.readFileSync('netlify/functions/github-file.js', 'utf8');
for (const marker of ['createOnly', 'requirePath', 'alreadyExists', 'Publish the code first']) {
  assert(backend.includes(marker), `github-file missing ${marker}`);
}

const sw = fs.readFileSync('sw.js', 'utf8');
assert(sw.includes("url.pathname.startsWith('/api/')"), 'service worker must exclude /api/');
assert(sw.includes("request.mode==='navigate'"), 'service worker must limit index fallback to navigation');

const readme = fs.readFileSync('README.md', 'utf8');
for (const heading of [
  '## What the platform includes',
  '## GitHub portfolio publishing',
  '## Development and verification',
  '## Security and safety'
]) {
  assert(readme.includes(heading), `README missing ${heading}`);
}
assert(readme.includes('62 generated course pages'), 'README course count must be 62');

// student-code is user-owned portfolio output. A learner may legitimately delete
// an individual published exercise, so production verification must never require
// specific personal portfolio files to exist. We only guard against the obsolete
// pre-migration flat paths returning accidentally.
for (const file of [
  'student-code/practice/python/fizzbuzz.py',
  'student-code/practice/python/real-second-largest-distinct.py',
  'student-code/practice/python/real-valley-array.py',
  'student-code/practice/dsa/dsa-two-sum.py',
  'student-code/practice/oop/oop-counter-state.py',
  'student-code/practice/oop/oop-point.py'
]) {
  assert(!fs.existsSync(file), `Old flat copy still exists: ${file}`);
}

console.log('Final quality layer verification passed across all 62 courses.');
