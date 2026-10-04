'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const courses=JSON.parse(read('assets/coursedata-source.json'));

assert.equal(courses.length,65,'platform must preserve all 65 courses');

let lessonCount=0,exerciseCount=0,quizCount=0,projectCount=0;
const global={explanation:new Map(),example:new Map(),objective:new Map(),mistake:new Map()};
const norm=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
function remember(kind,text,loc){
 const key=norm(text); if(!key)return;
 if(!global[kind].has(key))global[kind].set(key,[]);
 global[kind].get(key).push(loc);
}
function words(s){return String(s||'').toLowerCase().replace(/[^a-z0-9+#.]+/g,' ').trim().split(/\s+/).filter(w=>w.length>2);}
function shingles(s,n=4){const w=words(s),set=new Set();for(let i=0;i<=w.length-n;i++)set.add(w.slice(i,i+n).join(' '));return set;}
function jaccard(a,b){if(!a.size||!b.size)return 0;let inter=0;for(const x of a)if(b.has(x))inter++;return inter/(a.size+b.size-inter);}

for(const course of courses){
 assert.ok(course.id&&course.title, 'course missing id/title');
 assert.ok(String(course.blurb||course.description||'').trim().length>=30,course.id+' needs a professional course description');
 const lessons=course.lessons||[], exercises=course.exercises||[], quiz=course.quiz||[];
 const projects=(course.projects||[]).length+(course.capstone?1:0);
 assert.ok(lessons.length>=1,course.id+' needs lessons');
 assert.ok(exercises.length>=3,course.id+' needs at least three exercises');
 assert.ok(quiz.length>=2,course.id+' needs knowledge checks');
 assert.ok(projects>=1,course.id+' needs at least one project/capstone');
 lessonCount+=lessons.length; exerciseCount+=exercises.length; quizCount+=quiz.length; projectCount+=projects;

 const ids=new Set(),explanations=[];
 for(const lesson of lessons){
  const loc=course.id+'/'+lesson.id;
  assert.ok(lesson.id&&!ids.has(lesson.id),loc+' missing/duplicate lesson id'); ids.add(lesson.id);
  assert.ok(String(lesson.title||'').trim().length>=3,loc+' needs a useful title');
  const explanation=String(lesson.explanation||lesson.explain||lesson.description||'').trim();
  assert.ok(explanation.length>=80,loc+' explanation is too thin');
  assert.ok((lesson.concepts||[]).length>=2,loc+' needs at least two concrete concepts');
  assert.ok((lesson.objectives||[]).length>=1,loc+' needs a learning objective');
  const examples=lesson.examples|| (lesson.example?[lesson.example]:[]);
  assert.ok(examples.length>=1,loc+' needs at least one worked/reference example');
  for(const example of examples)assert.ok(String(example).trim().length>=15,loc+' has an empty/trivial example');

  assert.doesNotMatch(explanation,/focus specifically on apply|trace the starting state|input, state, or operation changes into a result|02Registers|written with WITH/i,loc+' contains generic/broken teaching prose');
  assert.doesNotMatch(explanation,/\b([A-Za-z]{3,})\s+\1\b/i,loc+' contains a repeated word');
  assert.doesNotMatch(lesson.title||'',/professional curriculum|EECE\s*340|Follow your lecture order/i,loc+' exposes internal/provider wording');

  remember('explanation',explanation,loc);
  for(const x of examples)remember('example',x,loc);
  for(const x of lesson.objectives||[])remember('objective',x,loc);
  for(const x of lesson.commonMistakes||[])remember('mistake',x,loc);
  explanations.push({id:lesson.id,set:shingles(explanation)});
 }
 for(let i=0;i<explanations.length;i++)for(let j=i+1;j<explanations.length;j++){
  const score=jaccard(explanations[i].set,explanations[j].set);
  assert.ok(score<0.45,course.id+' has near-duplicate theory in '+explanations[i].id+' and '+explanations[j].id+' (similarity '+score.toFixed(2)+')');
 }

 for(const outlineKey of ['aptechCurriculum','curriculumOutline']){
  for(const section of course[outlineKey]||[])for(const id of section.lessonIds||[]){
   assert.ok(ids.has(id),course.id+' '+outlineKey+' references missing lesson '+id);
  }
 }
}
assert.equal(lessonCount,832,'all 832 authored lessons must remain present');
assert.ok(exerciseCount>=800,'platform needs broad exercise coverage');
assert.ok(quizCount>=1600,'platform needs broad knowledge-check coverage');
assert.ok(projectCount>=280,'platform needs broad project/capstone coverage');

for(const [kind,map] of Object.entries(global)){
 for(const [text,locs] of map)assert.equal(locs.length,1,'exact duplicate '+kind+' appears in '+locs.join(', ')+' :: '+text.slice(0,120));
}

const visible=JSON.stringify(courses);
assert.doesNotMatch(visible,/\bAhmed\b|\bDubai\b|Follow your lecture order|data-lecture-order/i,'sellable course data contains personal/private course wording');

const arm=courses.find(c=>c.id==='arm-assembly');
const cpu=courses.find(c=>c.id==='microprocessors-arm');
assert.match(arm.description,/practical|writing|tracing|debugging/i);
assert.match((cpu.lessons||[]).map(l=>l.explanation||'').join(' '),/RISC|register|CPSR|exception|vector/i);
for(const lesson of arm.lessons||[]){
 if(lesson.id==='arm-12')continue;
 for(const code of lesson.examples||[]){
  assert.ok(code.startsWith('AREA RESET, CODE, READONLY\nENTRY\n'),lesson.id+' must use the standard ARMASM program header');
  assert.ok(code.trimEnd().endsWith('END'),lesson.id+' must end with END');
 }
}
for(const lab of cpu.labs||[])if(lab.language==='armasm'){
 for(const code of [lab.starterCode,lab.solutionCode].filter(Boolean)){
  assert.ok(code.startsWith('AREA RESET, CODE, READONLY\nENTRY\n'),lab.id+' ARM code must use the standard header');
  assert.ok(code.trimEnd().endsWith('END'),lab.id+' ARM code must end with END');
 }
}

const cpp=courses.find(c=>c.id==='cpp-dsa');
for(const lesson of cpp.lessons||[])for(const code of lesson.examples||[]){
 assert.match(code,/^#include <iostream>/,lesson.id+' C++ example must start with #include <iostream>');
 assert.match(code,/using namespace std;/,lesson.id+' C++ example must include using namespace std;');
 assert.doesNotMatch(code,/\bstd::/,lesson.id+' C++ example mixes namespace styles');
}

const matlab=courses.find(c=>c.id==='matlab-engineering');
assert.equal((matlab.lessons||[]).length,10,'MATLAB must keep all 10 lessons');
const matlabAsset=read('assets/matlab-visualizer.js');
for(const marker of ['matlab-workbench','grid-template-columns:minmax(0,1.05fr) minmax(420px,1fr)','viewBox="0 0 ','xlabel','ylabel','legend','matlab-result-table','matlab-plot-card']){
 assert.ok(matlabAsset.includes(marker),'MATLAB visualizer missing '+marker);
}

const syllabus=JSON.parse(read('EECE340_SYLLABUS_COVERAGE_AUDIT.json'));
assert.equal(syllabus.syllabusTopicsCount,27,'internal syllabus map must keep 27 requirements');
assert.equal(syllabus.requiredLabsCount,16,'internal syllabus map must keep 16 labs');
assert.equal((cpu.labs||[]).length,16,'CPU course must keep the 16-lab practice track');

const pages=fs.readdirSync(path.join(root,'courses')).filter(n=>n.endsWith('.html'));
assert.equal(pages.length,65,'all 65 course pages must exist');
for(const name of pages){
 const html=read('courses/'+name);
 assert.match(html,/<meta\b[^>]*\bname=["']viewport["'][^>]*>/i,name+' needs responsive viewport metadata');
 assert.match(html,/data-progress|progress/i,name+' needs visible progress/resume UI');
 assert.match(html,/theme/i,name+' needs consistent theme support');
 assert.doesNotMatch(html,/Follow your lecture order|data-lecture-order|\bAhmed\b|\bDubai\b|\bKHDA\b/i,name+' exposes private/personal implementation content');
 assert.doesNotMatch(html,/\b(?:[A-Za-z]{3,})\s+\1\b/i,name+' contains a repeated word');
 assert.doesNotMatch(html,/which is exactly\.|focus specifically on apply|input, state, or operation changes into a result|02Registers|written with WITH/i,name+' contains broken/generic teaching prose');
 assert.doesNotMatch(html,/data-shared-study-checklist/i,name+' still contains the old duplicated generic study checklist');
}

const armUi=read('assets/arm-trace-ui.js');
assert.match(armUi,/arm-code-table-layout/);
assert.match(armUi,/grid-template-columns:minmax\(0,1\.05fr\) minmax\(460px,1fr\)/);
assert.match(armUi,/@media\(max-width:980px\).*grid-template-columns:1fr/);

console.log('Platform professional audit PASS — 65 courses / 832 lessons have substantive teaching, no exact repeated authored theory/examples, standardized ARM/C++ syntax, syllabus coverage, responsive ARM/MATLAB workbenches, and product-safe course UI.');
