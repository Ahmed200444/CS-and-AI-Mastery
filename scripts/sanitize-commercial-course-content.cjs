'use strict';
const fs=require('fs');
const path=require('path');
const root=process.cwd();
const source=JSON.parse(fs.readFileSync(path.join(root,'assets','coursedata-source.json'),'utf8'));
const byId=new Map(source.map(c=>[c.id,c]));
const dir=path.join(root,'courses');

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function cleanVisible(s){
 return String(s)
  .replace(/ahmed@my-server\.example\.com/gi,'admin@my-server.example.com')
  .replace(/Ahmed/gi,'Alex')
  .replace(/\bDubai\b/g,'Toronto')
  .replace(/\bKHDA-benchmarked\b/gi,'industry-focused')
  .replace(/\bKHDA\b/gi,'professional training')
  .replace(/\bAptech\b/gi,'professional curriculum')
  .replace(/\bAptech Beginner\s*(\d+)\s*[—-]\s*/gi,'Python Foundations $1 — ')
  .replace(/\bAptech Beginner\s*(\d+)/gi,'Python Foundations $1')
  .replace(/\bEECE340\b/g,'Microprocessors & ARM')
  .replace(/\bEECE\s*340\b/g,'Microprocessors & ARM')
  .replace(/\buniversity-aligned\b/gi,'engineering-focused')
  .replace(/\buniversity laboratory\b/gi,'practical laboratory')
  .replace(/\buniversity embedded\b/gi,'embedded')
  .replace(/\buniversity microprocessor\b/gi,'microprocessor')
  .replace(/\bthe lectures\b/gi,'this course')
  .replace(/\bin the lecture syntax\b/gi,'in ARMASM syntax')
  .replace(/\bthe lecture syntax\b/gi,'the ARMASM syntax')
  .replace(/\bThe lecture shows\b/g,'The example shows')
  .replace(/\bThe lecture gives\b/g,'The example uses')
  .replace(/\bThe lecture covers\b/g,'This lesson covers')
  .replace(/\bA engineering-focused\b/g,'An engineering-focused')
  .replace(/\ba engineering-focused\b/g,'an engineering-focused')
  .replace(/\bPython versions changes\b/g,'Python versions change')
  .replace(/, which is exactly\./g,'.')
  .replace(/\bwhich is exactly\./g,'')
  .replace(/\btools changes\b/gi,'tools change')
  .replace(/\bfunction calling changes the behavior, result, or engineering decision in a concrete example\b/gi,'function calling changes how an application selects and executes external actions');
}
function lessonBounds(html,id){
 const marker='data-lesson="'+id+'"';
 const pos=html.indexOf(marker); if(pos<0)return null;
 const start=html.lastIndexOf('<details',pos); if(start<0)return null;
 const next=html.indexOf('<details class="lesson"',pos+marker.length);
 const sectionEnd=html.indexOf('</section>',pos+marker.length);
 const end=(next>=0&&sectionEnd>=0)?Math.min(next,sectionEnd):(next>=0?next:sectionEnd);
 return end>start?[start,end]:null;
}
function syncLesson(html,lesson,courseId){
 const b=lessonBounds(html,lesson.id); if(!b)return html;
 let seg=html.slice(b[0],b[1]);
 seg=seg.replace(/<span class="title">[\s\S]*?<\/span>/, '<span class="title">'+esc(lesson.title||'Lesson')+'</span>');
 if(Array.isArray(lesson.objectives)){
   const list='<h3>What you will learn</h3><ul>'+lesson.objectives.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul>';
   if(/<h3>What you will learn<\/h3><ul>[\s\S]*?<\/ul>/.test(seg)) seg=seg.replace(/<h3>What you will learn<\/h3><ul>[\s\S]*?<\/ul>/,list);
 }
 if(lesson.explanation){
   const heading=courseId==='arm-assembly'?'Practice focus':'Explanation';
   const section='<section class="lesson-main-explanation" data-main-explanation><h3>'+heading+'</h3><p>'+esc(lesson.explanation)+'</p></section>';
   seg=seg.replace(/<section class="lesson-main-explanation"[^>]*>[\s\S]*?<\/section>/,section);
 }
 if(Array.isArray(lesson.concepts)){
   const meta='<h3>Key concepts</h3><div class="meta">'+lesson.concepts.map(v=>'<span class="pill">'+esc(v)+'</span>').join('')+'</div>';
   if(/<h3>Key concepts<\/h3><div class="meta">[\s\S]*?<\/div>/.test(seg)) seg=seg.replace(/<h3>Key concepts<\/h3><div class="meta">[\s\S]*?<\/div>/,meta);
 }
 if(Array.isArray(lesson.commonMistakes)){
   const note=lesson.commonMistakes.length?'<div class="note"><b>Common mistake:</b> '+esc(lesson.commonMistakes.join(' • '))+'</div>':'';
   if(/<div class="note"><b>Common mistake:<\/b>[\s\S]*?<\/div>/.test(seg)) seg=seg.replace(/<div class="note"><b>Common mistake:<\/b>[\s\S]*?<\/div>/,note);
 }
 return html.slice(0,b[0])+seg+html.slice(b[1]);
}
function sanitizePage(file){
 const id=path.basename(file,'.html'),course=byId.get(id);
 let html=fs.readFileSync(file,'utf8');
 html=html.replace(/<section class="card" style="margin-bottom:14px" aria-label="Lecture order">[\s\S]*?<\/section>\s*/gi,'');
 html=html.replace(/<p class="muted" data-lecture-order="[^"]*">[\s\S]*?<\/p>\s*/gi,'');
 html=html.replace(/<section class="card" data-shared-study-checklist>[\s\S]*?<\/section>\s*/gi,'');
 html=html.replace(/<div style="display:flex;flex-wrap:wrap;gap:6px">\s*<span class="pill">Homework:[\s\S]*?<\/div>/gi,'');
 html=html.replace(/<p class="muted"><b>Syllabus topic:<\/b>\s*([\s\S]*?)\s*·\s*<b>Weight:<\/b>\s*([\s\S]*?)<\/p>/gi,'<p class="muted"><b>Topic:</b> $1</p>');
 html=html.replace(/EECE 340 SYLLABUS LAB TRACK/g,'MICROPROCESSOR &amp; ARM LAB TRACK');
 html=html.replace(/Complete 16-module university laboratory sequence aligned with the EECE 340 syllabus and lab exam\./g,'Complete 16-module practical laboratory sequence covering microprocessor and ARM skills.');
 html=html.replace(/16 syllabus labs/gi,'16 labs');
 // Keep responsive viewport metadata in the canonical order expected by quality checks.
 html=html.replace(/<meta\s+content="width=device-width,initial-scale=1"\s+name="viewport"\s*\/>/i,'<meta name="viewport" content="width=device-width,initial-scale=1"/>');
 html=cleanVisible(html);
 if(course){
   if(course.blurb||course.description){
     const intro=esc(course.blurb||course.description);
     html=html.replace(/(<section class="hero">[\s\S]*?<h1>[\s\S]*?<\/h1><p class="muted">)[\s\S]*?(<\/p>)/,'$1'+intro+'$2');
   }
   for(const lesson of course.lessons||[]) html=syncLesson(html,lesson,id);
 }
 fs.writeFileSync(file,html,'utf8');
 return html;
}
let files=fs.readdirSync(dir).filter(n=>n.endsWith('.html')),personal=0,lectureUi=0;
for(const name of files){
 const html=sanitizePage(path.join(dir,name));
 personal+=(html.match(/\b(?:Ahmed|Dubai|KHDA)\b/gi)||[]).length;
 lectureUi+=(html.match(/Follow your lecture order|data-lecture-order|\.pdf\b/gi)||[]).length;
}
if(personal)throw new Error('Personal course content remained after sanitization: '+personal);
if(lectureUi)throw new Error('Lecture/source metadata remained after sanitization: '+lectureUi);
console.log('Commercial course sanitizer: '+files.length+' pages cleaned; personal/source metadata removed; lesson text synced.');
