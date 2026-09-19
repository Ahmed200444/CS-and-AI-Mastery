'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const pages=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html')).sort();
assert.equal(pages.length,62,'expected 62 course pages');
for(const f of pages){
  const html=fs.readFileSync(path.join(root,'courses',f),'utf8');
  assert.ok(html.includes('study-examples.js?v=20260824-v574'),`${f}: current study example layer missing`);
  assert.ok(/line-by-line-explanations\.js\?v=/.test(html),`${f}: versioned line explainer missing`);
  assert.ok(html.includes('progressive-lesson-layout.js?v=20260822-v567'),`${f}: current lesson explanation layer missing`);
}
const lineSource=fs.readFileSync(path.join(root,'assets','line-by-line-explanations.js'),'utf8');
const sandbox={window:{},document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},setTimeout(){return 1;},clearTimeout(){},MutationObserver:function(){this.observe=function(){};},WeakMap,console};
vm.createContext(sandbox);vm.runInContext(lineSource,sandbox,{filename:'line-by-line-explanations.js'});
const api=sandbox.window.CSAILineExplainer;
assert.ok(api&&api.explain&&api.glossaryTerms,'line explainer API missing');

const bigO=`nums = [4, 1, 7, 3]\n# O(n): one pass\nfor x in nums:\n    print(x)\n# O(n^2): nested passes\npairs = 0\nfor i in nums:\n    for j in nums:\n        pairs += 1\nprint(pairs)`;
const bigTerms=Array.from(api.glossaryTerms(bigO,'python'),x=>x.term);
assert.ok(!bigTerms.includes('I/O'),'Big-O example must not invent an I/O concept just because print() is present');
assert.ok(!bigTerms.includes('io module'),'Big-O example must not mention io module');
assert.ok(!bigTerms.includes('tuple'),'Big-O example must not invent tuple syntax');
assert.ok(bigTerms.includes('print()'),'actual print() should still be explained');

const stripCode=`email = "  student@example.com  "\nclean = email.strip().lower()\nprint(clean)\nprint(clean.endswith(".com"))`;
const stripRows=api.explain(stripCode,'python');
assert.match(stripRows[1].purpose,/\.strip\(\).*whitespace/i,'strip() must be explained on the line where it appears');
assert.match(stripRows[1].purpose,/\.lower\(\).*lowercase/i,'lower() must be explained on the line where it appears');
assert.match(stripRows[3].purpose,/\.endswith\(\).*True.*False/i,'endswith() must be explained on the line where it appears');
const stripTerms=Array.from(api.glossaryTerms(stripCode,'python'),x=>x.term);
for(const term of ['strip()','lower()','endswith()'])assert.ok(stripTerms.includes(term),`missing grounded glossary term ${term}`);
assert.ok(!stripTerms.includes('I/O'),'string-cleaning example must not add an unrelated I/O glossary item');

const joinCode=`tokens = ["learn", "practice", "build"]\ncontext = " | ".join(tokens)\nprint("context:", context)`;
const joinRows=api.explain(joinCode,'python');
assert.match(joinRows[1].purpose,/\.join\(\).*combines.*strings/i,'join() must be explained where it appears');
const joinTerms=Array.from(api.glossaryTerms(joinCode,'python'),x=>x.term);
assert.ok(joinTerms.includes('join()'),'join() glossary term missing');
assert.ok(!joinTerms.includes('tuple'),'print arguments must not be mislabeled as a tuple');
assert.ok(!joinTerms.includes('I/O'),'join example must not add unrelated I/O terminology');

const study=fs.readFileSync(path.join(root,'assets','study-examples.js'),'utf8');
for(const marker of ["programBehavior(code,'python')","programBehavior(entry.code||'',lang)","programBehavior(src.code,src.language||'text')"])
  assert.ok(study.includes(marker),`study descriptions must be generated from actual code: ${marker}`);
assert.ok(!/What the program does<\/b><p>'\+esc\(professionalBehavior/.test(study),'code cards must not use topic/company prose as the program description');

const progressive=fs.readFileSync(path.join(root,'assets','progressive-lesson-layout.js'),'utf8');
assert.ok(progressive.includes('MAX_QUICK_WORDS=55'),'lesson quick explanations should be capped at 55 words');
assert.ok(progressive.includes('simpleExplanation'),'lesson layer must provide a shorter beginner-friendly version');
assert.ok(progressive.includes('firstWords(plainify(first),28)'),'simple explanation should stay under about 28 words');

console.log('Code-grounded explanations v5.64 contract PASS — 62 courses use actual-code-only example explanations and shorter lesson explanations.');
