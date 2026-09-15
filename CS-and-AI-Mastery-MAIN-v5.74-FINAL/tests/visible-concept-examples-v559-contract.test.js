const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const study=fs.readFileSync(path.join(root,'assets/study-examples.js'),'utf8');
const calm=fs.readFileSync(path.join(root,'assets/calm-study-flow.js'),'utf8');
const courseDir=path.join(root,'courses');
const pages=fs.readdirSync(courseDir).filter(n=>n.endsWith('.html'));
assert.strictEqual(pages.length,62,'expected all 62 course pages');
for(const name of pages){
  const html=fs.readFileSync(path.join(courseDir,name),'utf8');
  assert.ok(html.includes('study-examples.js?v=20260824-v574'),name+' must load the v5.59 concept-example renderer');
  assert.ok(html.includes('calm-study-flow.js?v=20260822-v567'),name+' must load the v5.59 all-visible flow');
}
assert.ok(study.includes("var cs=concepts(b),plan=cs.map(function(c){return{label:c,kind:'Concept example'};});"),'general plan must map each key concept to a dedicated example');
for(const label of ['time complexity','space complexity','growth rate','Big-O','best / average / worst case','O(1) — constant time','O(log n) — logarithmic time','O(n) — linear time','O(n log n) — linearithmic time','O(n²) — quadratic time','Time–space trade-off']) assert.ok(study.includes("label:'"+label+"'"),'Big-O ladder missing '+label);
assert.ok(study.includes('Key-idea examples come first'),'concept examples must appear before additional native examples');
assert.ok(study.includes('content-visibility:auto'),'example cards must use browser paint containment');
assert.ok(study.includes('function buildCurrent()'),'only opened lesson should build examples');
assert.ok(calm.includes('none are hidden as optional practice'),'all examples must remain visible');
console.log('Visible concept examples v5.59 contract PASS — 62/62 pages, every concept mapped, Big-O ladder complete, lightweight visible flow.');
