'use strict';
// Provider wording must be removed from visible text WITHOUT rewriting identifiers: ids, anchors and
// data-lesson values are used for in-page links and for progress saved in learners' browsers.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pages=fs.readdirSync(path.join(root,'courses')).filter(n=>n.endsWith('.html'));
for(const n of pages){
  const h=read('courses/'+n);
  assert.doesNotMatch(h,/professional curriculum/i,n+' still contains the "professional curriculum" replacement text');
  const withSpaces=[...h.matchAll(/\b(?:id|data-lesson)="([^"]*)"/g)].map(m=>m[1]).filter(v=>/\s/.test(v)&&/lesson-|aptech|curriculum/i.test(v));
  assert.deepStrictEqual(withSpaces,[],n+' has lesson ids/anchors containing spaces');
}
const py=read('courses/python.html');
assert.match(py,/data-lesson="aptech-py-intro"/,'python lesson id aptech-py-intro must be preserved for saved progress');
assert.match(py,/id="lesson-aptech-py-intro"/,'lesson anchor id must be preserved');
assert.match(py,/<span class="title">Python Foundations 1 — /,'lesson 1 title must come from the course data');
assert.doesNotMatch(py,/\bAptech\b(?![\w-])/,'visible provider name remains on python page');
const dsa=read('courses/dsa.html');
assert.match(dsa,/data-lesson="aptech-dsa-memory"/,'dsa lesson id must be preserved');
assert.doesNotMatch(dsa,/(?<![\w-])Aptech(?![\w-])|APTECH-ALIGNED/,'visible provider name remains on dsa page');
const idx=read('index.html');
assert.doesNotMatch(idx,/(?<![\w-])Aptech(?![\w-])/,'visible provider name remains on home page');
assert.match(idx,/"id":"aptech-py-intro"/,'course data ids must be preserved');
console.log('Aptech identifier safety PASS — visible wording removed, ids/anchors/progress keys preserved across '+pages.length+' pages.');
