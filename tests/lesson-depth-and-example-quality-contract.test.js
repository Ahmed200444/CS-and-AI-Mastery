const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const coursesDir = path.join(root, 'courses');
const pages = fs.readdirSync(coursesDir).filter(name => name.endsWith('.html'));
assert.strictEqual(pages.length, 62, 'expected all 62 course/track pages');

let lessonCount = 0;
for (const name of pages) {
  const html = fs.readFileSync(path.join(coursesDir, name), 'utf8');
  const starts = [...html.matchAll(/<details class="[^"]*\blesson\b[^"]*" data-lesson="([^"]+)"/g)];
  assert.ok(starts.length > 0, `${name} should contain lessons`);
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i].index;
    const end = i + 1 < starts.length ? starts[i + 1].index : html.indexOf('</section>', start) > start ? html.length : html.length;
    const chunk = html.slice(start, end);
    const explanation = chunk.indexOf('class="lesson-main-explanation"');
    const example = chunk.search(/<h3>Examples?<\/h3>/i);
    assert.ok(explanation >= 0, `${name}:${starts[i][1]} is missing the full main explanation`);
    if (example >= 0) assert.ok(explanation < example, `${name}:${starts[i][1]} must explain before examples`);
    assert.ok(!chunk.includes('class="lesson-deep-dive"'), `${name}:${starts[i][1]} still uses the old buried deep-dive layout`);
    lessonCount++;
  }
}
assert.ok(lessonCount >= 640, `expected at least 640 visible lessons after curriculum deduplication, found ${lessonCount}`);

const python = fs.readFileSync(path.join(coursesDir, 'python.html'), 'utf8');
const varsStart = python.indexOf('data-lesson="python-variables-types"');
const varsEnd = python.indexOf('</details>', varsStart);
const varsChunk = python.slice(varsStart, varsEnd);
assert.ok(varsChunk.includes('dynamic typing'), 'Variables explanation should discuss dynamic typing');
assert.ok(!/largest value in a list|BFS|graph represents entities/i.test(varsChunk), 'Variables explanation must not drift into unrelated DSA content');

const study = fs.readFileSync(path.join(root, 'assets', 'study-examples.js'), 'utf8');
assert.ok(study.includes('[data-adaptive-lab],[data-evergreen-lab]{display:none!important}'), 'old duplicate example labs must be hidden');
assert.ok(study.includes('structureSignature'), 'study examples must structurally deduplicate code');
assert.ok(study.includes('changing only a literal value does not count'), 'example quality rule must be visible in the UI');
for (const bad of ['Same concept, different input', 'Change an edge value', "return'Different input'"]) {
  assert.ok(!study.includes(bad), `obsolete low-value example label remains: ${bad}`);
}

console.log(`Lesson depth/example-quality contract passed for ${lessonCount} lessons across ${pages.length} course pages.`);
