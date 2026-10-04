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
 const rest=html.slice(pos+marker.length);
 const nextRel=rest.search(/<details\b[^>]*class=["'][^"']*\blesson\b[^"']*["'][^>]*>/i);
 const close=html.indexOf('</details>',pos+marker.length);
 const next=nextRel>=0?pos+marker.length+nextRel:-1;
 const end=close>=0&&(!next||next<0||close<next)?close+'</details>'.length:next;
 return end>start?[start,end]:null;
}
function exampleLanguage(courseId){
 if(courseId==='arm-assembly')return'armasm';
 if(courseId==='matlab-engineering')return'matlab';
 if(courseId==='cpp-dsa')return'cpp';
 return'';
}
function syncLesson(html,lesson,courseId){
 const b=lessonBounds(html,lesson.id); if(!b)return html;
 let seg=html.slice(b[0],b[1]);
 seg=seg.replace(/<span class="title">[\s\S]*?<\/span>/, '<span class="title">'+esc(lesson.title||'Lesson')+'</span>');

 const objectives=Array.isArray(lesson.objectives)?lesson.objectives:[];
 const objectiveHtml=objectives.length?'<h3>What you will learn</h3><ul>'+objectives.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul>':'';
 if(/<h3>What you will learn<\/h3><ul>[\s\S]*?<\/ul>/.test(seg))seg=seg.replace(/<h3>What you will learn<\/h3><ul>[\s\S]*?<\/ul>/,objectiveHtml);
 else if(objectiveHtml)seg=seg.replace(/<section class="lesson-main-explanation"/,objectiveHtml+'\n<section class="lesson-main-explanation"');

 const explanation=lesson.explanation||lesson.explain||lesson.description||'';
 if(explanation){
   const heading=courseId==='arm-assembly'?'Practice focus':'Explanation';
   const section='<section class="lesson-main-explanation" data-main-explanation><h3>'+heading+'</h3><p>'+esc(explanation)+'</p></section>';
   if(/<section class="lesson-main-explanation"[^>]*>[\s\S]*?<\/section>/.test(seg))seg=seg.replace(/<section class="lesson-main-explanation"[^>]*>[\s\S]*?<\/section>/,section);
 }

 const concepts=Array.isArray(lesson.concepts)?lesson.concepts:[];
 const conceptHtml=concepts.length?'<h3>Key concepts</h3><div class="meta">'+concepts.map(v=>'<span class="pill">'+esc(v)+'</span>').join('')+'</div>':'';
 if(/<h3>Key concepts<\/h3><div class="meta">[\s\S]*?<\/div>/.test(seg))seg=seg.replace(/<h3>Key concepts<\/h3><div class="meta">[\s\S]*?<\/div>/,conceptHtml);
 else if(conceptHtml)seg=seg.replace(/<h3>Example<\/h3>/,conceptHtml+'\n<h3>Example</h3>');

 const examples=Array.isArray(lesson.examples)?lesson.examples:(lesson.example?[lesson.example]:[]);
 const exampleRegion=/<h3>Example<\/h3>[\s\S]*?(?=<div class="note"|<\/div><\/details>)/;
 const current=(seg.match(exampleRegion)||[''])[0];
 const attrs=[...current.matchAll(/<pre\b([^>]*)>/g)].map(m=>m[1]||'');
 const lang=exampleLanguage(courseId);
 const exampleHtml=examples.length?'<h3>Example</h3>'+examples.map((v,i)=>{
   let a=attrs[i]||attrs[0]||' class="code" data-example-audit="candidate"';
   if(!/\bclass=/.test(a))a=' class="code"'+a;
   if(lang){
     if(/\bdata-language=/.test(a))a=a.replace(/\bdata-language=(["'])[^"']*\1/,'data-language="'+lang+'"');
     else a+=' data-language="'+lang+'"';
   }
   return '<pre'+a+'>'+esc(v)+'</pre>';
 }).join(''):'';
 if(exampleRegion.test(seg))seg=seg.replace(exampleRegion,exampleHtml);
 else if(exampleHtml)seg=seg.replace(/<div class="note"/,exampleHtml+'\n<div class="note"');

 const mistakes=Array.isArray(lesson.commonMistakes)?lesson.commonMistakes:(lesson.commonMistake?[lesson.commonMistake]:[]);
 const note=mistakes.length?'<div class="note"><b>Common mistake:</b> '+esc(mistakes.join(' • '))+'</div>':'';
 if(/<div class="note"><b>Common mistake:<\/b>[\s\S]*?<\/div>/.test(seg))seg=seg.replace(/<div class="note"><b>Common mistake:<\/b>[\s\S]*?<\/div>/,note);
 else if(note)seg=seg.replace(/<\/div><\/details>\s*$/,note+'</div></details>');

 return html.slice(0,b[0])+seg+html.slice(b[1]);
}
function exerciseHtml(item,index){
 return '<div class="item"><b>'+esc(item.title||('Exercise '+(index+1)))+'</b><p>'+esc(item.prompt||item.description||'Complete this exercise using what you learned in the course.')+'</p>'+(item.hint?'<details><summary>Hint</summary><p>'+esc(item.hint)+'</p></details>':'')+'<textarea class="answer" placeholder="Write code or notes here..."></textarea></div>';
}
function quizHtml(item,index){
 const question=item.q||item.question||item.prompt||('Question '+(index+1)),options=Array.isArray(item.options)?item.options:[];
 return '<div class="item"><b>'+esc(question)+'</b>'+(options.length?'<ol>'+options.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ol>':'')+'<textarea class="answer" placeholder="Write your answer..."></textarea></div>';
}
function projectHtml(item,index){
 return '<div class="item"><b>'+esc(item.title||item.name||('Project '+(index+1)))+'</b><p>'+esc(item.description||item.desc||item.prompt||'Build this project and document what you learned.')+'</p></div>';
}
function replaceCardContent(html,heading,content){
 const h='<h2>'+heading+'</h2>',pos=html.indexOf(h);if(pos<0)return html;
 const start=html.lastIndexOf('<section',pos),openEnd=html.indexOf('>',start),end=html.indexOf('</section>',pos);
 if(start<0||openEnd<start||end<pos)return html;
 return html.slice(0,openEnd+1)+h+content+html.slice(end);
}
function syncCourseItems(html,course){
 const exercises=Array.isArray(course.exercises)?course.exercises:[];
 const quiz=Array.isArray(course.quiz)?course.quiz:[];
 const projects=(Array.isArray(course.projects)?course.projects.slice():[]).concat(course.capstone?[course.capstone]:[]);
 html=replaceCardContent(html,'Exercises',exercises.length?exercises.map(exerciseHtml).join(''):'<p class="muted">No separate exercises are listed.</p>');
 html=replaceCardContent(html,'Knowledge checks',quiz.length?quiz.map(quizHtml).join(''):'<p class="muted">No separate checkpoints are listed.</p>');
 html=replaceCardContent(html,'Projects',projects.length?projects.map(projectHtml).join(''):'<p class="muted">No separate projects are listed.</p>');
 return html;
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
   html=syncCourseItems(html,course);
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
