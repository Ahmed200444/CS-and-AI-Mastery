'use strict';
const fs=require('fs');
const path=require('path');
const root=process.cwd();
const source=JSON.parse(fs.readFileSync(path.join(root,'assets','coursedata-source.json'),'utf8'));
const byId=new Map(source.map(c=>[c.id,c]));
const dir=path.join(root,'courses');

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
// Replaces the provider name in visible text only. Identifiers such as ids, anchors, classes and
// data-lesson values (aptech-py-intro, lesson-aptech-oop-solid, ...) are left untouched, because
// rewriting them breaks in-page links and the progress keys saved in learners' browsers.
function aptechClean(s){
 const start='(?<=^|[>.:!?]\\s*)';
 return String(s)
  .replace(/APTECH-ALIGNED ((?:[A-Z]+ )+CURRICULUM)/g,'STRUCTURED $1')
  .replace(/(?<![\w-])Aptech Beginner\s*(\d+)\s*[—-]\s*/g,'Python Foundations $1 — ')
  .replace(/(?<![\w-])Aptech Beginner\s*(\d+)/g,'Python Foundations $1')
  .replace(/(?<![\w-])Aptech OOP\s*\d+\s*[—-]\s*/g,'Python OOP practice — ')
  .replace(/(?<![\w-])Aptech DSA\s*\d+\s*[—-]\s*/g,'')
  .replace(/(?<![\w-])Aptech OOP(?![\w-])/g,'OOP')
  .replace(new RegExp(start+'Aptech-aligned','g'),'Curriculum-aligned')
  .replace(/(?<![\w-])Aptech-aligned/g,'curriculum-aligned')
  .replace(/(?<![\w-])APTECH-ALIGNED/g,'CURRICULUM-ALIGNED')
  .replace(/(?<![\w-])Aptech\s+(?=[a-z])/g,'')
  .replace(/(?<![\w-])Aptech(?![\w-])/gi,'curriculum');
}
function cleanVisible(s){
 return aptechClean(s)
  .replace(/ahmed@my-server\.example\.com/gi,'admin@my-server.example.com')
  .replace(/Ahmed/gi,'Alex')
  .replace(/\bDubai\b/g,'Toronto')
  .replace(/\bKHDA-benchmarked\b/gi,'industry-focused')
  .replace(/\bKHDA\b/gi,'professional training')
  .replace(/\buniversity-aligned\b/gi,'engineering-focused')
  .replace(/\buniversity laboratory\b/gi,'practical laboratory')
  .replace(/\buniversity embedded\b/gi,'embedded')
  .replace(/\bthe lectures\b/gi,'this course')
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
 // A lesson is the <details> element that carries data-lesson="id". Inner <section>
 // blocks (explanation, practice, ...) and nested <details> belong to that lesson, so the
 // end is found by balancing <details> tags, never by the first </section> after the marker.
 const marker='data-lesson="'+id+'"';
 const pos=html.indexOf(marker); if(pos<0)return null;
 const start=html.lastIndexOf('<details',pos); if(start<0)return null;
 const tag=/<(\/?)details\b/gi; tag.lastIndex=start;
 let depth=0,m;
 while((m=tag.exec(html))){
  depth+=m[1]?-1:1;
  if(depth===0){const close=html.indexOf('>',m.index); return close>=0?[start,close+1]:null;}
 }
 return null;
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
   const heading='Explanation';
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
 // Keep responsive viewport metadata in the canonical order expected by quality checks.
 html=html.replace(/<meta\s+content="width=device-width,initial-scale=1"\s+name="viewport"\s*\/>/i,'<meta name="viewport" content="width=device-width,initial-scale=1"/>');
 html=cleanVisible(html);
 if(course){
   if(course.blurb||course.description){
     const intro=esc(course.blurb||course.description);
     html=html.replace(/(<section class="hero">[\s\S]*?<h1>[\s\S]*?<\/h1><p class="muted">)[\s\S]*?(<\/p>)/,'$1'+intro+'$2');
   }
   for(const lesson of course.lessons||[]) html=syncLesson(html,lesson,id);
   // Curriculum chips link to lessons by id; show each lesson's real title instead of provider-labelled text.
   for(const lesson of course.lessons||[]){
     const re=new RegExp('(<a class="btn" href="#lesson-'+lesson.id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'"[^>]*>)[\\s\\S]*?(</a>)','g');
     html=html.replace(re,(m,a,b)=>a+esc(lesson.title||'Lesson')+b);
   }
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
// Visible provider wording outside the course pages (home page copy, runtime strings, practice guidance).
const sweep=[path.join(root,'index.html')];
for(const d of ['assets/runtime-inline','assets/practice-guidance']){
 const full=path.join(root,d);
 if(fs.existsSync(full)) for(const n of fs.readdirSync(full)) if(/\.(js|json)$/.test(n)) sweep.push(path.join(full,n));
}
let swept=0;
for(const f of sweep){
 if(!fs.existsSync(f)) continue;
 const before=fs.readFileSync(f,'utf8');
 if(!/aptech/i.test(before)) continue;
 const after=aptechClean(before);
 if(after!==before){ fs.writeFileSync(f,after,'utf8'); swept++; }
}
if(personal)throw new Error('Personal course content remained after sanitization: '+personal);
if(lectureUi)throw new Error('Lecture/source metadata remained after sanitization: '+lectureUi);
console.log('Commercial course sanitizer: '+files.length+' pages cleaned; personal/source metadata removed; lesson text synced.');
