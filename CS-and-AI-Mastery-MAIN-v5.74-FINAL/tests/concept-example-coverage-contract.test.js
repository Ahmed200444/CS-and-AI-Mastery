const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const dataDir=path.join(root,'assets','course-data');
const files=fs.readdirSync(dataDir).filter(f=>f.endsWith('.json')).sort();
assert.equal(files.length,62,'expected 62 course-data files');
function norm(v){var raw=String(v||'').toLowerCase().trim();var words=raw.replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();return words||raw.replace(/\s+/g,' ');}
let lessons=0,concepts=0,planned=0,maxConcepts=0;
for(const file of files){
  const course=JSON.parse(fs.readFileSync(path.join(dataDir,file),'utf8'));
  for(const lesson of course.lessons||[]){
    lessons++;
    const seen=new Set();
    const cs=(lesson.concepts||[]).filter(c=>{const k=norm(c);if(!k||seen.has(k))return false;seen.add(k);return true;});
    assert.ok(cs.length>=1,`${course.id}/${lesson.id||lesson.title}: every lesson needs at least one key concept`);
    concepts+=cs.length;maxConcepts=Math.max(maxConcepts,cs.length);planned+=Math.max(5,cs.length+2);
  }
}
assert.equal(lessons,800,'expected all 800 lessons');
assert.equal(concepts,3427,'key-concept coverage drift including symbol-only concepts');
assert.equal(planned,5040,'base concept-example plan drift');
assert.equal(maxConcepts,14,'max concept count drift');

const study=fs.readFileSync(path.join(root,'assets','study-examples.js'),'utf8');
assert.ok(study.includes('Examples for every key idea'),'UI must promise per-idea examples');
assert.ok(study.includes("set.setAttribute('data-concept-coverage','complete')"),'coverage marker missing');
assert.ok(study.includes('cs.map(function(c){return{label:c,kind:\'Concept example\'};})'),'general plan must map every key concept to a card');
assert.ok(!study.includes('return uniq(xs).slice(0,8);'),'concept list must not be truncated to 8');
assert.ok(!study.includes('clamp(Math.max(concepts(b).length,objectives(b).length)+2,5,8)'),'old 8-example cap must be gone');
assert.ok(study.includes('Each example shows a different practical use of the lesson ideas.'),'diverse concise example-set description missing');
assert.ok(study.includes("studyBrief(programBehavior(code,'python'))")||study.includes("conceptCodeBrief(b,label,programBehavior(code,'python'))"),'generated Python examples need a code-grounded program-description brief');
assert.ok(study.includes("studyBrief(programBehavior(entry.code||'',lang))")||study.includes("conceptCodeBrief(b,label,programBehavior(entry.code||'',lang))"),'generated native examples need a code-grounded program-description brief');

const fixer=fs.readFileSync(path.join(root,'assets','runnable-lesson-example-fixes.js'),'utf8');
assert.ok(!fixer.includes('BIG_O_EXAMPLE'),'Big-O must not be replaced by one shared snippet');
assert.ok(!/pre\.textContent\s*=/.test(fixer),'classifier must never overwrite lesson example code');

let runnable=study.replace(/\}\)\(\);\s*$/,"globalThis.__coverageAudit={bigOPlan,structureSignature};})();");
const sandbox={document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},location:{pathname:'/courses/dsa.html'},window:{},setTimeout(){},clearTimeout(){},MutationObserver:function(){this.observe=function(){}},console};
vm.createContext(sandbox);vm.runInContext(runnable,sandbox);
const plan=sandbox.__coverageAudit.bigOPlan();
assert.equal(plan.length,11,'Big-O needs every listed key idea plus the common complexity ladder');
for(const label of ['time complexity','space complexity','growth rate','Big-O','best / average / worst case','O(1) — constant time','O(log n) — logarithmic time','O(n) — linear time','O(n log n) — linearithmic time','O(n²) — quadratic time','Time–space trade-off']){
  assert.ok(plan.some(x=>x.label===label),`Big-O example missing: ${label}`);
}
const signatures=plan.map(x=>sandbox.__coverageAudit.structureSignature(x.code));
assert.equal(new Set(signatures).size,plan.length,'Big-O examples must be structurally distinct');
console.log(`Concept-example coverage PASS — ${lessons} lessons, ${concepts} key concepts, ${planned} base concept/integration/edge example slots; Big-O has 11 distinct curated examples.`);
