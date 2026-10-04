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
 const start=html.lastIndexOf('<details',pos),next=html.indexOf('<details class="lesson"',pos+marker.length),sectionEnd=html.indexOf('</section>',pos+marker.length);
 const end=(next>=0&&sectionEnd>=0)?Math.min(next,sectionEnd):(next>=0?next:sectionEnd);
 return html.slice(start,end);
}
let lessons=0,examples=0;
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
}
assert.equal(lessons,832,'all authored lessons must remain synchronized');
console.log('Source/page synchronization PASS — '+lessons+' lessons and '+examples+' authored examples match canonical course data.');
