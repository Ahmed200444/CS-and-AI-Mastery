"use strict";
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const asset=read('assets/study-examples.js');
assert(!asset.includes(' is a key idea in '),'generic key-idea definition fallback must be removed');
assert(!asset.includes('It names the specific'),'old label-repeating definition filler must be removed');
assert(asset.includes('function conceptSourceDefinition(b,label)'),'definitions must use lesson evidence when the concept is discussed');
assert(asset.includes('function expandedConceptDefinition(b,label)'),'definitions need concept/domain-specific explanation rules');
assert(asset.includes('function contextualConceptFallback(b,label)'),'unknown concepts need a contextual fallback');
for(const phrase of [
  'An integrated application combines several ideas from ',
  'An edge case is a boundary or unusual input where normal assumptions can fail.',
  'Concept transfer means recognizing the same underlying ',
  'Maintainability is how easy and safe software is to understand, change, fix, and extend over time.',
  'Propagation delay is the small amount of time a hardware signal needs to travel through a gate or circuit',
  'An event loop repeatedly waits for work, takes ready events or callbacks, and runs them one at a time on its thread.',
  'An error budget is the amount of unreliability a service can tolerate while still meeting its reliability target or SLO.',
  "heading=meta?'What you are learning':'Definition'"
]) assert(asset.includes(phrase),`missing deeper definition behavior: ${phrase}`);
assert(asset.includes("if(/integrated application/.test(t))return'Use this when one task requires several ideas from '"),'integrated application must have a real use explanation');
assert(asset.includes("if(/edge case.*debug|debug.*edge case/.test(t))return'Use this when checking '"),'edge/debug must have a real use explanation');
const courses=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html'));
assert.strictEqual(courses.length,62,'expected all 62 course pages');
let lessons=0;
for(const f of courses){
  const h=read('courses/'+f);
  assert(h.includes('../assets/study-examples.js?v=20260824-v574'),`${f}: must load v5.71 definition layer`);
  lessons+=(h.match(/data-lesson="[^"]+"/g)||[]).length;
}
assert.strictEqual(lessons,800,'expected 800 lessons');
assert.strictEqual(JSON.parse(read('package.json')).version,'5.74.0');
console.log(`Concept-definition depth v5.71: PASS across ${courses.length} courses / ${lessons} lessons.`);
