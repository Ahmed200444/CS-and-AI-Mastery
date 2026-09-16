'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');

const pages=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html')).sort();
assert.equal(pages.length,62,'general audit expects 62 generated course pages');
for(const f of pages){
  const h=fs.readFileSync(path.join(root,'courses',f),'utf8');
  for(const marker of [
    'study-examples.js?v=20260824-v574',
    'practice-guidance.js?v=20260823-v573'
  ]) assert.ok(h.includes(marker),`${f}: stale modified learning asset tag: ${marker}`);
  if(h.includes('practice-publish-completer.js'))assert.ok(h.includes('practice-publish-completer.js?v=20260823-v573'),`${f}: stale practice-publish-completer cache tag`);
}
const canonical=JSON.parse(fs.readFileSync(path.join(root,'assets','coursedata-source.json'),'utf8'));
const lessons=canonical.reduce((n,c)=>n+(c.lessons||[]).length,0);
assert.equal(lessons,800,'general audit expects 800 lessons in canonical course data');

const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
assert.equal(pkg.version,'5.74.0','package version must be current v5.74');
for(const f of ['README.md','SETUP.md','PC_INSTALL_README.txt','INSTALL_ON_MY_COMPUTER.bat']){
  const s=fs.readFileSync(path.join(root,f),'utf8');
  assert.ok(s.includes('CS-and-AI-Mastery'),`${f}: current install folder missing`);
  assert.ok(!/CS-and-AI-Mastery-MAIN-v5\./i.test(s),`${f}: stale version-specific install folder remains`);
}

const study=fs.readFileSync(path.join(root,'assets','study-examples.js'),'utf8');
for(const banned of [
  'is a key idea in this lesson',
  'Use this for a different operation',
  'Company task —',
  'Specific responsibility:',
  'Scenario angle:',
  'Practice move:',
  'Behavior to explain:'
]) assert.ok(!study.includes(banned),`general audit: obsolete/generic teaching filler remains: ${banned}`);

let runnable=study.replace(/\}\)\(\);\s*$/,"globalThis.__audit573={practicalUseFor,professionalBehavior};})();");
const sandbox={document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},location:{pathname:'/courses/debugging.html'},window:{},setTimeout(){},clearTimeout(){},MutationObserver:function(){this.observe=function(){}},console};
vm.createContext(sandbox);vm.runInContext(runnable,sandbox,{filename:'study-examples.js'});
const api=sandbox.__audit573;
assert.ok(api&&typeof api.practicalUseFor==='function','v5.73 practical-use API unavailable');
const traceUse=api.practicalUseFor('debugging','Reading tracebacks & stack traces','stack trace',0);
assert.match(traceUse,/fail|traceback|exception/i,'stack-trace use must describe debugging a failure');
assert.doesNotMatch(traceUse,/undo|bracket|last-in|reverse a sequence/i,'stack trace must not inherit data-structure stack scenarios');
const callStackUse=api.practicalUseFor('debugging','Reading tracebacks & stack traces','call stack',0);
assert.match(callStackUse,/function|call|return|recursive/i,'call stack must have call-stack-specific use');
const dataStackUse=api.practicalUseFor('dsa','Stacks','stack',0);
assert.match(dataStackUse,/undo|bracket|reverse|depth|last-in|history/i,'DSA stack must keep data-structure uses');

const dsa=fs.readFileSync(path.join(root,'courses','dsa.html'),'utf8');
assert.ok(dsa.includes('steps += 1'),'Big-O O(n) example must count operations');
assert.ok(dsa.includes('print(steps)'),'Big-O O(n) example must print the operation count');
assert.ok(!/\# O\(n\): one pass[\s\S]{0,180}print\(x\)/.test(dsa),'Big-O example must not print each input value instead of the count');

const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
assert.ok(!/2\/3 checks passed/i.test(readme),'old partial-check README wording must stay removed');
assert.ok(!/core implementation/i.test(readme),'old core-implementation README wording must stay removed');

console.log('v5.73 general project audit contract PASS — 62 courses / 800 lessons, current install/versioning, focused teaching UI, Big-O correction, and stack-trace concept isolation verified.');
