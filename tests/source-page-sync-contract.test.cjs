'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const courses=JSON.parse(fs.readFileSync(path.join(root,'assets','coursedata-source.json'),'utf8'));
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function lessonSegment(html,id){
 const marker='data-lesson="'+id+'"',pos=html.indexOf(marker);
 assert.ok(pos>=0,'page missing lesson '+id);
 const start=html.lastIndexOf('<details',pos),close=html.indexOf('</details>',pos+marker.length);
 assert.ok(start>=0&&close>start,'page has malformed lesson '+id);
 return html.slice(start,close+'</details>'.length);
}
let lessons=0,examples=0,exercises=0,quizzes=0,projects=0;
for(const course of courses){
 const html=fs.readFileSync(path.join(root,'courses',course.id+'.html'),'utf8');
 for(const lesson of course.lessons||[]){
  lessons++;
  const seg=lessonSegment(html,lesson.id);
  assert.ok(seg.includes('<span class="title">'+esc(lesson.title||'Lesson')+'</span>'),course.id+'/'+lesson.id+' title is stale');
  const explanation=lesson.explanation||lesson.explain||lesson.description||'';
  if(explanation)assert.ok(seg.includes('<p>'+esc(explanation)+'</p>'),course.id+'/'+lesson.id+' explanation is stale');
  for(const objective of lesson.objectives||[])assert.ok(seg.includes('<li>'+esc(objective)+'</li>'),course.id+'/'+lesson.id+' objective is stale');
  for(const concept of lesson.concepts||[])assert.ok(seg.includes('<span class="pill">'+esc(concept)+'</span>'),course.id+'/'+lesson.id+' concept is stale');
  const lessonExamples=lesson.examples||(lesson.example?[lesson.example]:[]);
  for(const example of lessonExamples){examples++;assert.ok(seg.includes(esc(example)),course.id+'/'+lesson.id+' example is stale');}
  for(const mistake of lesson.commonMistakes||[])assert.ok(seg.includes(esc(mistake)),course.id+'/'+lesson.id+' common mistake is stale');
 }
 for(const [i,item] of (course.exercises||[]).entries()){
  exercises++;
  assert.ok(html.includes('<b>'+esc(item.title||('Exercise '+(i+1)))+'</b>'),course.id+' exercise title is stale');
  assert.ok(html.includes('<p>'+esc(item.prompt||item.description||'Complete this exercise using what you learned in the course.')+'</p>'),course.id+' exercise prompt is stale');
 }
 for(const [i,item] of (course.quiz||[]).entries()){
  quizzes++;
  const q=item.q||item.question||item.prompt||('Question '+(i+1));
  assert.ok(html.includes('<b>'+esc(q)+'</b>'),course.id+' quiz question is stale');
  for(const option of item.options||[])assert.ok(html.includes('<li>'+esc(option)+'</li>'),course.id+' quiz option is stale');
 }
 const projectItems=(course.projects||[]).slice();if(course.capstone)projectItems.push(course.capstone);
 for(const [i,item] of projectItems.entries()){
  projects++;
  assert.ok(html.includes('<b>'+esc(item.title||item.name||('Project '+(i+1)))+'</b>'),course.id+' project title is stale');
  assert.ok(html.includes('<p>'+esc(item.description||item.desc||item.prompt||'Build this project and document what you learned.')+'</p>'),course.id+' project description is stale');
 }
}
assert.equal(lessons,832,'all authored lessons must remain synchronized');
assert.equal(exercises,830,'all authored exercises must remain synchronized');
assert.equal(quizzes,1657,'all authored quizzes must remain synchronized');
assert.equal(projects,283,'all authored projects/capstones must remain synchronized');
console.log('Source/page synchronization PASS — '+lessons+' lessons, '+examples+' examples, '+exercises+' exercises, '+quizzes+' quizzes, and '+projects+' projects/capstones match canonical course data.');
