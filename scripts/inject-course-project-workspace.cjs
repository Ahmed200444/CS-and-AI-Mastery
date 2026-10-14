const fs=require('fs');
const path=require('path');

const root=process.cwd();
const coursesDir=path.join(root,'courses');
const dataDir=path.join(root,'assets','course-data');
if(!fs.existsSync(coursesDir))throw new Error('courses directory is missing');
if(!fs.existsSync(dataDir))throw new Error('course-data directory is missing');

const PY=new Set(['python','oop','dsa','problem-solving','software-engineering','testing','debugging','apis','backend-development','machine-learning','deep-learning','transformers','hugging-face','generative-ai','llms','rag','ai-agents','model-deployment','data-science','computer-vision','nlp','pytorch','tensorflow','mlops','data-engineering','ai-system-design','secure-ai-applications','llm-evaluation-testing']);
const JS=new Set(['web-development','frontend-dev','frontend-development']);
const SQL=new Set(['sql','databases']);
const SHELL=new Set(['linux','git-github','docker','kubernetes','cloud','devops','ci-cd','computer-networks']);
function lang(id){if(PY.has(id))return'python';if(JS.has(id))return'javascript';if(SQL.has(id))return'sql';if(SHELL.has(id))return'shell';return'text'}
function list(v){if(Array.isArray(v))return v.filter(Boolean).map(String);if(v==null||v==='')return[];return[String(v)]}
function safe(v){return JSON.stringify(v).replace(/<\//g,'<\\/')}
function pick(obj,names){for(const name of names){if(obj&&obj[name]!=null&&obj[name]!=='')return obj[name]}return''}
function starter(project){return pick(project,['starter','starterCode','template','scaffold','codeTemplate','boilerplate'])}
function requirements(project){return [
 ...list(project.requirements),...list(project.deliverables),...list(project.acceptanceCriteria),...list(project.objectives),...list(project.tasks)
].filter((v,i,a)=>a.indexOf(v)===i).slice(0,12)}
function normalizeProject(p,index,defaultLanguage){
 const title=pick(p,['title','name'])||`Project ${index+1}`;
 return {
  id:String(p.id||`project-${index+1}`),
  title:String(title),
  description:String(pick(p,['description','desc','prompt','summary'])||'Build this project using the concepts from the course.'),
  requirements:requirements(p),
  starter:String(starter(p)||''),
  language:String(p.language||p.lang||defaultLanguage)
 };
}

const files=fs.readdirSync(coursesDir).filter(f=>f.endsWith('.html'));
if(files.length!==62)throw new Error(`Expected 62 course pages, found ${files.length}`);
let updated=0,totalProjects=0;
for(const file of files){
 const id=file.replace(/\.html$/,'');
 const dataPath=path.join(dataDir,id+'.json');
 if(!fs.existsSync(dataPath))throw new Error(`Missing course data for ${id}`);
 const course=JSON.parse(fs.readFileSync(dataPath,'utf8'));
 let raw=Array.isArray(course.projects)?course.projects.slice():[];
 if(course.capstone)raw.push(course.capstone);
 // FIX #32 -- lang() is a hard-coded per-course table that has no entry for the dedicated C++
 // course, so the C++/DSA project workspace defaulted to "text" even though every project on
 // that page declares language "cpp". Derive the default from the projects instead.
 const fallbackLanguage=lang(id);
 const projects=raw.map((p,i)=>normalizeProject(p||{},i,fallbackLanguage));
 const declaredLanguages=projects.map(x=>x&&x.language).filter(Boolean);
 const uniformLanguage=declaredLanguages.length&&declaredLanguages.every(l=>l===declaredLanguages[0])?declaredLanguages[0]:null;
 const defaultLanguage=uniformLanguage||fallbackLanguage;
 totalProjects+=projects.length;
 const payload={courseId:id,courseTitle:course.title||id,defaultLanguage,projects};
 const dataTag=`<script id="csai-project-data" type="application/json">${safe(payload)}</script>`;
 const assetTag='<script defer src="../assets/course-project-workspace.js?v=20260822-v571"></script>';
 const full=path.join(coursesDir,file);
 let html=fs.readFileSync(full,'utf8');
 html=html.replace(/<script\b[^>]*\bid=["']csai-project-data["'][^>]*>[\s\S]*?<\/script>\s*/gi,'');
 html=html.replace(/<script[^>]*src=["']\/assets\/course-project-workspace\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
 const at=html.toLowerCase().lastIndexOf('</body>');
 const tags=dataTag+'\n'+assetTag+'\n';
 html=at>=0?html.slice(0,at)+tags+html.slice(at):html+'\n'+tags;
 fs.writeFileSync(full,html,'utf8');
 updated++;
}
if(updated!==62)throw new Error(`Expected to update 62 course pages, updated ${updated}`);
console.log(`Injected project workspaces into ${updated} course pages (${totalProjects} projects/capstones total). Evergreen location guidance is enabled at each course header.`);
