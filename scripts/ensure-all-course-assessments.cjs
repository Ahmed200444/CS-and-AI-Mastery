const fs=require('fs');
const path=require('path');
const root=process.cwd(),coursesDir=path.join(root,'courses'),dataDir=path.join(root,'assets','course-data');
if(!fs.existsSync(coursesDir)||!fs.existsSync(dataDir))throw new Error('Generated courses/course-data missing');
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeJson(v){return JSON.stringify(v).replace(/<\//g,'<\\/');}
function key(item,i){return String(item&&item.id||('exercise-'+(i+1)));}
function starter(title){return `#include <iostream>\nusing namespace std;\n\n// ${String(title||'Course exercise').replace(/\r?\n/g,' ')}\n// Replace this starter with your solution.\nint main(){\n    cout << "Start your solution" << "\\n";\n    return 0;\n}\n`;}
function fallbackSection(exercises){return `<section class="card assessment-section csai-oa-fallback-assessment"><div class="assessment-head"><div><h2>Assessment practice</h2><p>Post-lesson exercises in C++ assessment mode.</p></div><span class="runner-state">C++ prepares automatically</span></div><p class="assess-note">These exercises come after the lessons. They do not change or score lesson examples.</p><div class="assessment-stack">${exercises.map((item,i)=>{const k=key(item,i),title=item.title||`Exercise ${i+1}`,prompt=item.prompt||item.description||'Complete the task in C++.';return `<article class="oa-task" data-task="${esc(k)}" data-title="${esc(title)}"><div class="oa-task-top"><div class="oa-task-id"><span class="oa-chip">Task ${String(i+1).padStart(2,'0')}</span><span class="oa-chip medium">Assessment</span></div><span class="oa-solved" data-solved></span></div><div class="oa-grid"><div class="oa-prompt"><h3>${esc(title)}</h3><p>${esc(prompt)}</p></div><div class="oa-work"><div class="oa-editorbar"><span class="oa-dots"><i></i><i></i><i></i></span><span>${esc(k)}.cpp</span><span>C++</span></div><textarea class="oa-editor" spellcheck="false" data-editor data-csai-oa-cpp-editor>${esc(starter(title))}</textarea><div class="oa-toolbar"><button type="button" class="oa-btn run" data-csai-oa-cpp-run>▶ Run code</button><button type="button" class="oa-btn submit" data-csai-oa-mark>Mark solved</button><button type="button" class="oa-btn" data-csai-oa-reset>Reset</button><button type="button" class="oa-btn publish" data-csai-oa-publish>Publish to GitHub</button><span class="gh-inline-msg" data-msg></span></div><div class="oa-output" data-output>Ready.</div></div></div></article>`}).join('')}</div></section>`;}
let pages=0,fallbacks=0;
for(const file of fs.readdirSync(coursesDir).filter(f=>f.endsWith('.html'))){
 const id=file.replace(/\.html$/,''),p=path.join(coursesDir,file),dataPath=path.join(dataDir,id+'.json');if(!fs.existsSync(dataPath))throw new Error(`Missing course data for ${id}`);
 const course=JSON.parse(fs.readFileSync(dataPath,'utf8')),exercises=Array.isArray(course.exercises)?course.exercises:[];let html=fs.readFileSync(p,'utf8');
 if(!html.includes('id="csai-assessment-data"')&&!html.includes("id='csai-assessment-data'")){
   const payload={courseId:id,courseTitle:course.title||id,defaultLanguage:'cpp',exercises,quiz:[],structured:{}};
   const section=fallbackSection(exercises);
   const projectAt=html.search(/<section\b[^>]*class=["'][^"']*project-section/i);const mainAt=html.toLowerCase().lastIndexOf('</main>');const at=projectAt>=0?projectAt:mainAt;
   html=at>=0?html.slice(0,at)+section+'\n'+html.slice(at):html+'\n'+section;
   const bodyAt=html.toLowerCase().lastIndexOf('</body>');const tags=`<script id="csai-assessment-data" type="application/json">${safeJson(payload)}</script>\n<script src="/assets/github-integration.js?v=20260811-2" defer></script>\n`;
   html=bodyAt>=0?html.slice(0,bodyAt)+tags+html.slice(bodyAt):html+'\n'+tags;fallbacks++;
 }
 fs.writeFileSync(p,html,'utf8');pages++;
}
if(pages!==57)throw new Error(`Expected 57 generated course pages, found ${pages}`);
console.log(`Assessment coverage ensured on ${pages} courses; added C++ fallback exercise workspaces to ${fallbacks} course page(s).`);
