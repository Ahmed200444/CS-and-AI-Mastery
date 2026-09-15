'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const study=read('assets/study-examples.js');
const guidance=read('assets/practice-guidance.js');

assert(study.includes('v5.72 — every study example has one concise, always-present learning question'),'missing v5.72 study-question layer');
assert(study.includes("data-csai-learning-question','example'"),'generated examples must mark their Question block');
assert(study.includes("node.innerHTML='<b>Question</b><p>'"),'example Question must be visible text, not an optional control');
for(const phrase of [
  'build a prefix-sum list that starts at 0',
  'count how many times each value appears',
  'reverse the list in place by working from both ends',
  'produce the unique values in sorted order',
  'create one flat list containing every inner value in order',
  'produce values one at a time instead of building every result immediately',
  'related data stored in more than one table'
]) assert(study.includes(phrase),`missing tailored example question: ${phrase}`);
assert(study.includes('function ensureStudyQuestion(card,index)'),'each generated study card must receive a question before lazy rendering');
assert(/prepareLazyStudyExamples\(set\)[\s\S]*ensureStudyQuestion\(card,i\)/.test(study),'Question must be attached to every generated example card');

assert(guidance.includes('function questionOnlyElement(question,kind)'),'lesson/exercise/project Question renderer missing');
assert(guidance.includes("d.innerHTML='<b>Question</b><p>'"),'question-only guidance must be visibly labeled Question');
assert(guidance.includes('function lessonQuestionFor(el,meta)'),'lesson-specific question generator missing');
for(const phrase of [
  'When is an array/list a good fit',
  'When should you choose last-in-first-out behavior',
  'What is the base case',
  'What running information should you precompute',
  'Which columns connect the tables',
  'what continuous target should come out',
  'what tool result comes back'
]) assert(guidance.includes(phrase),`missing lesson-specific question family: ${phrase}`);
const guideFn=(guidance.match(/function guideElement\(g,kind\)\{[\s\S]*?\n\}/)||[''])[0];
assert(guideFn.includes("kind==='example'||kind==='quiz'"),'practice guidance should not duplicate generated example or existing quiz questions');
assert(!guideFn.includes('Required'),'new question-only UI must not say Required');

const pages=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html')).sort();
assert.equal(pages.length,62,'expected 62 course pages');
let lessons=0;
for(const f of pages){
  const h=read('courses/'+f);
  assert(h.includes('../assets/study-examples.js?v=20260824-v574'),`${f}: v5.72 example questions not loaded`);
  assert(h.includes('../assets/practice-guidance.js?v=20260823-v573'),`${f}: v5.72 lesson/exercise/project questions not loaded`);
  lessons+=(h.match(/data-lesson="[^"]+"/g)||[]).length;
}
assert.equal(lessons,800,'expected 800 lessons');

let guideLessons=0,exercises=0,projects=0;
for(const f of fs.readdirSync(path.join(root,'assets','practice-guidance')).filter(f=>f.endsWith('.json'))){
  const d=JSON.parse(read('assets/practice-guidance/'+f));
  for(const meta of Object.values(d.lessons||{})){
    guideLessons++;
    assert(String(meta.practice&&meta.practice.question||'').trim().length>20,`${f}: lesson missing source question`);
  }
  for(const item of d.exercises||[]){exercises++;assert(String(item.practice&&item.practice.question||'').trim().length>20,`${f}: exercise missing question`);}
  for(const item of d.projects||[]){projects++;assert(String(item.practice&&item.practice.question||'').trim().length>20,`${f}: project missing question`);}
}
assert.equal(guideLessons,800,'practice-guidance lesson count drift');
assert(exercises>0&&projects>0,'expected exercise/project questions');
assert.equal(JSON.parse(read('package.json')).version,'5.74.0','package version must be current');
assert(read('local-server.js').includes("RELEASE='5.74'"),'server release must be 5.72');
assert(read('desktop-launcher.js').includes("RELEASE = '5.74'"),'launcher release must be 5.72');
assert(read('sw.js').includes("csai-v5-74-concepts-questions-runners"),'service-worker cache must move to v5.72');
console.log(`Learning questions v5.72: PASS across ${pages.length} courses / ${lessons} lessons / ${exercises} exercises / ${projects} projects.`);
