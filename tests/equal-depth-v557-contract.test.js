const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'assets', 'course-data');
const pagesDir = path.join(root, 'courses');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json')).sort();
assert.equal(files.length, 62, 'expected 62 course-data files');
const courseById = new Map(files.map(file => {
  const c = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  return [c.id, c];
}));

function wc(text) { return (String(text || '').match(/\b[\w'’-]+\b/g) || []).length; }
function norm(v) { const raw=String(v||'').toLowerCase().trim(); const words=raw.replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim(); return words || raw.replace(/\s+/g,' '); }

let lessons = 0, concepts = 0;
const problems = [];
const courseStats = [];
for (const file of files) {
  const course = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  assert.ok(Array.isArray(course.lessons) && course.lessons.length, `${course.id}: no lessons`);
  let min = Infinity, total = 0;
  for (const lesson of course.lessons) {
    lessons++;
    const explain = lesson.explanation || lesson.explain || '';
    const words = wc(explain); min = Math.min(min, words); total += words;
    if (words < 90) problems.push(`${course.id}/${lesson.id}: explanation has only ${words} words`);
    const objectives = Array.isArray(lesson.objectives) ? lesson.objectives.filter(Boolean) : [];
    if (objectives.length < 3) problems.push(`${course.id}/${lesson.id}: fewer than 3 practical objectives`);
    const rawConcepts = Array.isArray(lesson.concepts) ? lesson.concepts : [];
    const unique = new Set(rawConcepts.map(norm).filter(Boolean));
    if (unique.size < 2) problems.push(`${course.id}/${lesson.id}: fewer than 2 distinct key ideas`);
    concepts += unique.size;
    const mistakes = lesson.commonMistakes || lesson.commonMistake;
    if (!mistakes || (Array.isArray(mistakes) && !mistakes.length)) problems.push(`${course.id}/${lesson.id}: common mistake missing`);
    const ex = lesson.example || lesson.examples;
    if (!ex || (Array.isArray(ex) && !ex.length)) problems.push(`${course.id}/${lesson.id}: native example missing`);
  }
  courseStats.push({id:course.id,min,avg:total/course.lessons.length});
}
assert.equal(lessons, 800, 'lesson count drift');
assert.equal(concepts, 3427, 'key-idea count drift after company-use depth additions');
assert.equal(problems.length, 0, `equal-depth data audit found ${problems.length} issue(s):\n${problems.slice(0,50).join('\n')}`);
assert.ok(courseStats.every(x => x.min >= 90), 'every course must have no shallow explanation outlier');

const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html')).sort();
assert.equal(pages.length, 62, 'expected 62 static course pages');
let staticLessons = 0;
for (const file of pages) {
  const html = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  const cid = file.replace(/\.html$/,'');
  const course = courseById.get(cid);
  assert.ok(course, `${file}: course data missing`);
  const sections = [...html.matchAll(/<section class="lesson-main-explanation" data-main-explanation>([\s\S]*?)<\/section>/g)];
  assert.ok(sections.length, `${file}: no expanded lesson explanations`);
  for (const lesson of course.lessons) {
    const marker = `data-lesson="${lesson.id}"`;
    const start = html.indexOf(marker);
    assert.ok(start >= 0, `${file}/${lesson.id}: static lesson missing`);
    const end = html.indexOf('</details>', start);
    const chunk = html.slice(start, end);
    const keyStart = chunk.indexOf('<h3>Key concepts</h3>');
    const exStart = chunk.indexOf('<h3>Example</h3>', keyStart);
    assert.ok(keyStart >= 0 && exStart > keyStart, `${file}/${lesson.id}: static key-concept block missing`);
    const keyChunk = chunk.slice(keyStart, exStart);
    const pills = [...keyChunk.matchAll(/<span class="pill">([\s\S]*?)<\/span>/g)].map(m => m[1]
      .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&#x27;/gi,"'"));
    const expected = new Set((lesson.concepts || []).map(norm).filter(Boolean));
    const actual = new Set(pills.map(norm).filter(Boolean));
    assert.deepEqual(actual, expected, `${file}/${lesson.id}: static key ideas drift from source data`);
  }
  for (const match of sections) {
    staticLessons++;
    const chunk = match[1];
    for (const label of ['How to think about it step by step','Worked scenario','Why this matters','Common pitfalls','Interview / practical takeaway','Check yourself']) {
      assert.ok(chunk.includes(label), `${file}: missing depth section ${label}`);
    }
    const plain = chunk.replace(/<[^>]+>/g,' ').replace(/&[a-z#0-9]+;/gi,' ');
    assert.ok(wc(plain) >= 350, `${file}: rendered teaching block is too shallow (${wc(plain)} words)`);
  }
}
assert.equal(staticLessons, 800, 'rendered lesson count drift');

// Practical gap checks identified in the v5.56 audit.
const required = {
  backend: ['database migration','idempotency','retry with exponential backoff'],
  'frontend-dev': ['form state','typescript props and interfaces','frontend component testing','production error handling'],
  'cloud-computing': ['dns','infrastructure as code','terraform','slo','error budget'],
  'system-design': ['rate limiting','idempotency','consistent hashing','backpressure','at least once delivery','slo','failure mode analysis']
};
for (const [cid, need] of Object.entries(required)) {
  const course = JSON.parse(fs.readFileSync(path.join(dataDir, `${cid}.json`), 'utf8'));
  const all = new Set(course.lessons.flatMap(l => l.concepts || []).map(norm));
  for (const c of need) assert.ok(all.has(norm(c)), `${cid}: missing professionally useful depth topic ${c}`);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
assert.equal(pkg.version,'5.63.0','package version must be 5.63.0');
const launcher = fs.readFileSync(path.join(root,'desktop-launcher.js'),'utf8');
const server = fs.readFileSync(path.join(root,'local-server.js'),'utf8');
assert.ok(launcher.includes("RELEASE = '5.63'"),'launcher release drift');
assert.ok(server.includes("RELEASE='5.63'"),'server release drift');
console.log(`v5.57 equal-depth PASS — ${files.length} courses / ${lessons} lessons / ${concepts} key ideas; every source explanation >=90 words and every rendered teaching block >=350 words with professional reasoning sections.`);
