const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'assets', 'course-data');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'catalog-data.json'), 'utf8'));
const meta = new Map(catalog.courses.map(c => [c.id, c]));
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json')).sort();
assert.equal(files.length, 62, 'expected all 62 course-data files');

function conceptKey(value) {
  const raw = String(value == null ? '' : value).trim().toLowerCase();
  const words = raw.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  return words || raw.replace(/\s+/g, ' ');
}
function exactExampleKey(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}
function codeShape(value) {
  const src = String(value || '');
  const executable = src.split(/\r?\n/).filter(line => {
    const t = line.trim();
    return t && !t.startsWith('#') && !t.startsWith('//');
  }).join('\n');
  if (!executable.trim()) return '';
  return executable
    .replace(/(["'])(?:\\.|(?!\1).)*\1/g, 'STR')
    .replace(/\b\d+(?:\.\d+)?\b/g, 'NUM')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const study = fs.readFileSync(path.join(root, 'assets', 'study-examples.js'), 'utf8');
assert.ok(study.includes('Examples for every key idea'), 'per-key-idea heading missing');
assert.ok(study.includes("cs.map(function(c){return{label:c,kind:'Concept example'};})"), 'every concept must map to its own plan entry');
assert.ok(study.includes('claimGeneratedSignature'), 'course-wide generated-code repetition guard missing');
assert.ok(study.includes("raw==='~'"), 'symbol-only ~ concept needs explicit behavior');
assert.ok(study.includes("raw==='>>'"), 'symbol-only >> concept needs explicit behavior');
assert.ok(study.includes("raw==='=='"), 'symbol-only == concept needs explicit behavior');

let runnable = study.replace(/\}\)\(\);\s*$/, "globalThis.__v556={program,shouldGenerateConceptCode,professionalScenario,professionalBehavior,structureSignature,bigOPlan,claimGeneratedSignature};})();");
const sandbox = {
  document: {readyState:'loading', addEventListener(){}, getElementById(){return null;}},
  location: {pathname:'/courses/dsa.html'}, window:{}, setTimeout(){}, clearTimeout(){},
  MutationObserver:function(){this.observe=function(){}}, console
};
vm.createContext(sandbox);
vm.runInContext(runnable, sandbox);
const api = sandbox.__v556;
assert.ok(api && typeof api.program === 'function', 'study-example audit API did not load');

let lessonCount = 0;
let keyIdeaCount = 0;
let activeNativeExamples = 0;
let hiddenCompatibilityExamples = 0;
let codeEligible = 0;
const pythonPrograms = [];
const activeExact = new Map();
const activeShapes = new Map();
const problems = [];

for (const file of files) {
  const course = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  const courseMeta = meta.get(course.id) || {};
  const hidden = courseMeta.hidden === true;
  assert.ok(Array.isArray(course.lessons) && course.lessons.length > 0, `${course.id}: course has no lessons`);

  for (const lesson of course.lessons) {
    lessonCount++;
    const seen = new Set();
    const concepts = [];
    for (const raw of lesson.concepts || []) {
      const k = conceptKey(raw);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      concepts.push(String(raw).trim());
    }
    if (!concepts.length) problems.push(`${course.id}/${lesson.id}: no key ideas`);
    keyIdeaCount += concepts.length;

    const scenarioTexts = new Set();
    concepts.forEach((concept, index) => {
      const spec = api.professionalScenario(course.id, lesson.title, concept, index);
      const example = String(spec && spec.example || '');
      const check = String(spec && spec.check || '');
      if (!example.includes('Company task —')) problems.push(`${course.id}/${lesson.id}/${concept}: company task missing`);
      if (!example.includes(concept)) problems.push(`${course.id}/${lesson.id}/${concept}: concept name missing from example`);
      if (!example.includes('Specific responsibility:')) problems.push(`${course.id}/${lesson.id}/${concept}: concept-specific responsibility missing`);
      if (!example.includes('Scenario angle:')) problems.push(`${course.id}/${lesson.id}/${concept}: distinct scenario angle missing`);
      if (!example.includes('Practice move:')) problems.push(`${course.id}/${lesson.id}/${concept}: practice move missing`);
      if (example.length < 180 || check.length < 80) problems.push(`${course.id}/${lesson.id}/${concept}: explanation too short`);
      if (scenarioTexts.has(example)) problems.push(`${course.id}/${lesson.id}: repeated professional example for ${concept}`);
      scenarioTexts.add(example);
      const behavior = String(api.professionalBehavior(course.id, lesson.title, concept) || '');
      if (behavior.length < 55) problems.push(`${course.id}/${lesson.id}/${concept}: behavior explanation too weak`);

      if (api.shouldGenerateConceptCode(course.id, lesson.title, concept)) {
        codeEligible++;
        try {
          const code = String(api.program(`${lesson.title} ${concept}`, index + 1, course.id) || '');
          if (!code.trim()) problems.push(`${course.id}/${lesson.id}/${concept}: generated program is empty`);
          pythonPrograms.push({name:`${course.id}/${lesson.id}/${concept}`, code});
        } catch (error) {
          problems.push(`${course.id}/${lesson.id}/${concept}: generator threw ${error.message}`);
        }
      }
    });

    const source = Array.isArray(lesson.example) ? lesson.example.join('\n') : String(lesson.example || '').trim();
    if (source) {
      if (hidden) {
        hiddenCompatibilityExamples++;
      } else {
        activeNativeExamples++;
        const exKey = exactExampleKey(source);
        const prior = activeExact.get(exKey);
        if (prior) problems.push(`${course.id}/${lesson.id}: exact native example repeats ${prior}`);
        else activeExact.set(exKey, `${course.id}/${lesson.id}`);
        const shape = codeShape(source);
        if (shape) {
          const priorShape = activeShapes.get(shape);
          if (priorShape) problems.push(`${course.id}/${lesson.id}: native code structure repeats ${priorShape} with only literal/text changes`);
          else activeShapes.set(shape, `${course.id}/${lesson.id}`);
        }
      }
    }
  }
}

assert.equal(lessonCount, 800, 'lesson count drift');
assert.equal(keyIdeaCount, 3427, 'full key-idea count must include symbol-only concepts');
assert.equal(codeEligible, 432, 'generated-code eligibility drift');

// Big-O must cover the lesson's five listed key ideas one-to-one, then add the common growth families/trade-off.
const bigO = api.bigOPlan();
assert.equal(bigO.length, 11, 'Big-O should have 11 distinct examples');
for (const label of ['time complexity','space complexity','growth rate','Big-O','best / average / worst case','O(1) — constant time','O(log n) — logarithmic time','O(n) — linear time','O(n log n) — linearithmic time','O(n²) — quadratic time','Time–space trade-off']) {
  assert.ok(bigO.some(x => x.label === label), `Big-O example missing: ${label}`);
}
const bigOSigs = bigO.map(x => api.structureSignature(x.code));
assert.equal(new Set(bigOSigs).size, bigO.length, 'Big-O examples must be structurally distinct');
for (const item of bigO) pythonPrograms.push({name:`dsa/big-o/${item.label}`, code:item.code});

// The generated-code registry must reject a repeated structure inside one course.
const localA = {};
assert.equal(api.claimGeneratedSignature('python', 'SAME-SHAPE', localA), true, 'first generated structure should be accepted');
assert.equal(api.claimGeneratedSignature('python', 'SAME-SHAPE', {}), false, 'same generated structure must be rejected later in the same course');
assert.equal(api.claimGeneratedSignature('dsa', 'SAME-SHAPE', {}), true, 'different course may legitimately use the same structure');

// Actually execute all currently eligible generated Python examples plus the curated Big-O examples.
const pyAudit = String.raw`
import json,sys,contextlib,io
items=json.load(sys.stdin)
errors=[]
for item in items:
    try:
        out=io.StringIO()
        with contextlib.redirect_stdout(out):
            exec(compile(item['code'], item['name'], 'exec'), {})
    except Exception as exc:
        errors.append({'name':item['name'],'error':type(exc).__name__+': '+str(exc)})
print(json.dumps(errors))
`;
const run = spawnSync('python3', ['-c', pyAudit], {input:JSON.stringify(pythonPrograms), encoding:'utf8', maxBuffer:10*1024*1024});
assert.equal(run.status, 0, `generated Python execution audit failed to run: ${run.stderr}`);
const runtimeErrors = JSON.parse(run.stdout || '[]');
if (runtimeErrors.length) problems.push(...runtimeErrors.slice(0,30).map(x => `${x.name}: generated code runtime error ${x.error}`));

// All static course pages must still load the per-key-idea example engine, and every active static example must be distinct.
const coursePages = fs.readdirSync(path.join(root, 'courses')).filter(f => f.endsWith('.html'));
assert.equal(coursePages.length, 62, 'expected 62 generated course pages');
const staticExact = new Map(), staticShapes = new Map();
let staticExamples = 0, activeStaticExamples = 0, hiddenStaticExamples = 0;
function decodeHtml(v){return String(v||'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'\"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');}
for (const file of coursePages) {
  const html = fs.readFileSync(path.join(root, 'courses', file), 'utf8');
  if (!html.includes('/assets/study-examples.js')) problems.push(`${file}: study-examples engine missing`);
  const cid = file.replace(/\.html$/,'');
  const hidden = (meta.get(cid)||{}).hidden === true;
  const re = /<pre\b[^>]*class=(?:"[^"]*\bcode\b[^"]*"|'[^']*\bcode\b[^']*')[^>]*>([\s\S]*?)<\/pre>/gi;
  let m;
  while ((m = re.exec(html))) {
    const code = decodeHtml(m[1]).trim();
    if (!code) continue;
    staticExamples++;
    if (hidden) { hiddenStaticExamples++; continue; }
    activeStaticExamples++;
    const ek = exactExampleKey(code);
    if (staticExact.has(ek)) problems.push(`${cid}: static example exactly repeats ${staticExact.get(ek)}`);
    else staticExact.set(ek, cid);
    const sk = codeShape(code);
    if (sk) {
      if (staticShapes.has(sk)) problems.push(`${cid}: static code structure repeats ${staticShapes.get(sk)} with only literal/text changes`);
      else staticShapes.set(sk, cid);
    }
  }
}
assert.equal(staticExamples, 895, 'static example count drift');
assert.equal(activeStaticExamples, 886, 'active static example count drift');
assert.equal(hiddenStaticExamples, 9, 'hidden compatibility static-example count drift');

// Hidden OOP is a compatibility redirect, not a second active study route.
const oopMeta = meta.get('oop');
assert.equal(oopMeta.hidden, true, 'legacy OOP route should stay hidden');
assert.equal(oopMeta.integratedInto, 'python', 'legacy OOP route should point to Python');

assert.equal(problems.length, 0, `v5.57 example-completeness audit found ${problems.length} problem(s):\n${problems.slice(0,60).join('\n')}`);
console.log(`v5.57 example-completeness PASS — ${lessonCount} lessons / ${keyIdeaCount} key ideas; ${codeEligible}/${codeEligible} generated-code paths execute; ${activeNativeExamples} active native source examples and ${activeStaticExamples} active static examples have no exact or literal-only structural duplicates; ${hiddenCompatibilityExamples} native / ${hiddenStaticExamples} static examples remain only in the hidden OOP compatibility route.`);
