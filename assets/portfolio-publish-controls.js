(()=>{'use strict';
const STATUS_URL='/api/github/status',FILE_URL='/api/github/file',STORE_KEY='csai-github-preferred-repo';
let statusPromise=null,enhanceQueued=false;
const clean=v=>String(v??'').trim();
const slug=v=>clean(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item';
function meta(){
  for(const id of ['course-page-meta','csai-assessment-data']){
    const node=document.getElementById(id); if(!node) continue;
    try{return JSON.parse(node.textContent||'{}')||{};}catch(e){}
  }
  return {};
}
function courseInfo(){
  const m=meta(),id=slug(m.id||m.courseId||location.pathname.split('/').pop()?.replace(/\.html$/,'')||'course');
  const title=clean(m.title||document.querySelector('.hero h1,main h1')?.textContent||id);
  return {id,title};
}
function ext(code,hint=''){
  hint=hint.toLowerCase();
  if(/c\+\+|cpp/.test(hint)||/#include\s*</.test(code)||/\bint\s+main\s*\(/.test(code))return'cpp';
  if(/python|\bpy\b/.test(hint)||/^\s*(def |from |import |class )/m.test(code)||/\bprint\s*\(/.test(code))return'py';
  if(/javascript|\bjs\b/.test(hint)||/\b(const|let|function)\b|=>/.test(code))return'js';
  if(/\b(shell|bash|sh)\b/.test(hint)||/^#!.*\b(?:ba)?sh\b/m.test(code))return'sh';
  if(/\bjson\b/.test(hint))return'json';
  if(/sql/.test(hint)||/\b(select|insert|update|create table)\b/i.test(code))return'sql';
  if(/html/.test(hint)||/<[a-z][\s\S]*>/i.test(code))return'html';
  return'txt';
}
function languageFolder(extension){
  return {py:'python',cpp:'cpp',js:'javascript',sh:'shell',json:'json',sql:'sql',html:'html',txt:'text'}[extension]||extension;
}
function languageLabel(language){
  return {cpp:'C++',javascript:'JavaScript',shell:'Shell',json:'JSON',sql:'SQL',html:'HTML',python:'Python',text:'Text'}[language]||language.charAt(0).toUpperCase()+language.slice(1);
}
function containerFor(button){
  return button.closest('[data-project],.project-card,[data-task],.oa-task,.csai-example-card,.csai-example,[data-lang-variant],.evergreen-example,.lesson-run-card,section,article')||button.parentElement;
}
function exactText(root,selectors){
  for(const selector of selectors){
    const node=root?.querySelector(selector),text=clean(node?.textContent);
    if(text)return text;
  }
  return '';
}
function details(button){
  const root=containerFor(button);
  const project=button.dataset.finalKind==='project'||!!button.closest('[data-project],.project-card,.project-workspace');
  const example=button.dataset.finalKind==='example'||!!button.closest('.csai-example,.csai-example-card,[data-lang-variant],.evergreen-example,.lesson-run-card');
  const kind=project?'projects':example?'examples':'practice';
  const editor=root?.querySelector('textarea[data-project-editor],textarea[data-editor],textarea[data-dual-editor],textarea');
  const pre=root?.querySelector('[data-csai-language-generated],.csai-language-code,pre code,pre');
  const code=clean(editor?.value??pre?.textContent);
  const title=clean(root?.dataset.title||root?.getAttribute('data-title')||root?.querySelector('h2,h3,h4,.title,.exercise-title,.project-title')?.textContent||button.dataset.title||(example?'Example':project?'Project':'Practice'));
  const responseTask=!!root?.querySelector('textarea.oa-answer')||root?.getAttribute('data-response-task')==='1';
  const activeLanguage=clean(root?.getAttribute('data-csai-editor-language')||root?.dataset.projectLanguage||root?.querySelector('[data-project-lang],[data-lang]')?.value||button.dataset.language||editor?.dataset.language||root?.dataset.language||root?.getAttribute('data-lang-variant')||pre?.className);
  const extension=responseTask?'txt':ext(code,activeLanguage),language=languageFolder(extension),item=slug(title);
  const course=courseInfo(),base=`student-code/${kind}/${course.id}/${item}/${language}`;
  const filename=kind==='examples'?`example.${extension}`:`solution.${extension}`;
  const description=exactText(root,['.oa-prompt p','.project-head p','[data-project-description]','.project-description','.exercise-description','.description']);
  const requirements=[...root?.querySelectorAll?.('.project-requirements li,.requirements li,[data-requirements] li')||[]].map(n=>clean(n.textContent)).filter(Boolean);
  return {root,kind,code,title,extension,language,course,base,codePath:`${base}/${filename}`,readmePath:`${base}/README.md`,description,requirements};
}
function runLine(d){
  const f=d.codePath.split('/').pop();
  if(d.extension==='py')return`python ${f}`;
  if(d.extension==='js')return`node ${f}`;
  if(d.extension==='cpp')return`g++ ${f} -std=c++17 -O2 -o app && ./app`;
  if(d.extension==='sh')return`bash ${f}`;
  if(d.extension==='html')return'Open the HTML file in a browser.';
  if(d.extension==='sql')return'Run the SQL in the CS & AI Mastery SQL runner or a compatible SQL database.';
  if(d.extension==='json')return'Validate or open the JSON file with the tool used by this project.';
  return'Open the file with the appropriate tool for its content.';
}
function codeStructure(d){
  const code=d.code,notes=[];
  if(!['py','cpp','js','sql'].includes(d.extension))return notes;
  const functions=[...code.matchAll(d.extension==='py'?/^\s*def\s+([A-Za-z_]\w*)\s*\(/gm:/\b(?:[A-Za-z_]\w*[\s:*&]+)+([A-Za-z_]\w*)\s*\([^;{}]*\)\s*\{/g)].map(m=>m[1]).filter(Boolean);
  const classes=[...code.matchAll(/\bclass\s+([A-Za-z_]\w*)/g)].map(m=>m[1]);
  if(functions.length)notes.push(`Defines function${functions.length>1?'s':''}: ${[...new Set(functions)].map(x=>'`'+x+'`').join(', ')}.`);
  if(classes.length)notes.push(`Defines class${classes.length>1?'es':''}: ${[...new Set(classes)].map(x=>'`'+x+'`').join(', ')}.`);
  if(/\b(for|while)\b/.test(code))notes.push('Uses iteration to repeat part of the solution.');
  if(/\b(if|elif|else|switch)\b/.test(code))notes.push('Uses conditional logic to choose between cases.');
  if(d.extension==='py'&&/\b(dict|set)\s*\(|\{[^}\n]*:/.test(code))notes.push('Uses a Python mapping/set-style data structure in the solution.');
  if(d.extension==='cpp'&&/\b(vector|unordered_map|map|set|queue|stack|priority_queue)\s*</.test(code))notes.push('Uses a C++ standard-library container.');
  if(/\bprint\s*\(|\bcout\s*<</.test(code))notes.push('Writes a result to the program output.');
  return notes;
}
function reviewChecklist(d){
  if(['txt','json','sh'].includes(d.extension))return '1. Re-read the task and requirements.\n2. Check each line/configuration choice against those requirements.\n3. Validate or run it with the appropriate tool when possible.\n4. Test a failure, boundary, or configuration edge case relevant to the project.';
  return '1. Re-read the task above and identify the required input, processing, and output.\n2. Trace the code from top to bottom and follow each branch or loop with a small example.\n3. Run it and compare the output with the requirement.\n4. Test an edge case before considering the exercise complete.';
}
function readme(d){
  const type=d.kind==='projects'?'Project':d.kind==='examples'?'Example':'Practice / Exercise';
  const task=d.description||'Use the course prompt for this item as the source of truth for the task.';
  const req=d.requirements.length?`\n## Requirements\n${d.requirements.map(x=>`- ${x}`).join('\n')}\n`:'';
  const structure=codeStructure(d);
  const structureText=structure.length?`\n## What the program does structurally\n${structure.map(x=>`- ${x}`).join('\n')}\n`:'';
  return `# ${d.title}\n\n**Course:** ${d.course.title}  \n**Type:** ${type}  \n**Language:** ${languageLabel(d.language)}\n\n## Task\n\n${task}\n${req}\n## Solution\n\nThe solution for this exact item and language is stored in \`${d.codePath.split('/').pop()}\`. Other language versions of this item are kept in their own language folders, so one version never overwrites another.\n${structureText}\n## How to run\n\n\`\`\`bash\n${runLine(d)}\n\`\`\`\n\n## Review checklist\n\n${reviewChecklist(d)}\n\nGenerated from the exact CS & AI Mastery item and code selected when **Add a README** was pressed.\n`;
}
async function status(){
  if(!statusPromise)statusPromise=fetch(STATUS_URL,{credentials:'same-origin'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'GitHub status failed');return d}).catch(e=>{statusPromise=null;throw e});
  return statusPromise;
}
function selectedRepo(s){
  const preferred=localStorage.getItem(STORE_KEY);
  return s.repositories?.find(r=>r.full_name===preferred)?.full_name||s.repositories?.find(r=>r.full_name==='Ahmed200444/CS-and-AI-Mastery')?.full_name||s.repositories?.[0]?.full_name||'';
}
function setMessage(button,text,kind=''){
  let row=button.closest('.csai-final-publish-row')||button.parentElement,el=row?.querySelector('.csai-final-publish-status');
  if(!el&&row){el=document.createElement('span');el.className='csai-final-publish-status';el.setAttribute('aria-live','polite');row.appendChild(el);}
  if(el){el.textContent=text;el.className=`csai-final-publish-status ${kind}`;}
}
async function publish(button,isReadme){
  const d=details(button);
  if(!d.code){setMessage(button,'Add code first','is-error');return;}
  setMessage(button,isReadme?'Adding README…':'Publishing…');
  try{
    const s=await status();if(!s.connected)throw new Error('Connect GitHub first.');
    const repository=selectedRepo(s);if(!repository)throw new Error('Choose a GitHub repository first.');
    const path=isReadme?d.readmePath:d.codePath,content=isReadme?readme(d):d.code;
    const response=await fetch(FILE_URL,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSAI-CSRF':s.csrf},body:JSON.stringify({
      repository,path,content,createOnly:true,requirePath:isReadme?d.codePath:undefined,
      message:isReadme?`Add ${d.language} README for ${d.title}`:`Add ${d.language} solution for ${d.title} from CS & AI Mastery`
    })});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'GitHub publish failed');
    setMessage(button,data.alreadyExists?(isReadme?'README already added ✓':'Already published ✓'):(isReadme?'README added ✓':'Published ✓'),'is-ok');
  }catch(error){setMessage(button,error.message,'is-error');}
}
function pair(existing,kind){
  if(!existing||existing.dataset.finalPublishReady)return existing;
  existing.dataset.finalPublishReady='1';existing.dataset.finalKind=kind;existing.setAttribute('data-final-publish','');existing.setAttribute('data-publish','');
  for(const attr of ['data-project-publish','data-dual-publish-language'])existing.removeAttribute(attr);
  existing.textContent='Publish to GitHub';
  let row=existing.closest('.csai-final-publish-row');
  if(!row){row=document.createElement('span');row.className='csai-final-publish-row';existing.parentNode?.insertBefore(row,existing);row.appendChild(existing);}
  if(!row.querySelector('[data-final-readme]')){
    const readme=document.createElement('button');readme.type='button';readme.textContent='Add a README';readme.setAttribute('data-final-readme','');readme.dataset.finalKind=kind;row.appendChild(readme);
  }
  if(!row.querySelector('.csai-final-publish-status')){const s=document.createElement('span');s.className='csai-final-publish-status';s.setAttribute('aria-live','polite');row.appendChild(s);}
  return existing;
}
function normalizeTaskPublishers(){
  document.querySelectorAll('.oa-task,.project-card').forEach(root=>{
    const old=[...root.querySelectorAll('[data-publish],[data-project-publish],[data-dual-publish-language],[data-final-publish]')];
    if(!old.length)return;
    const keep=old.find(b=>b.hasAttribute('data-final-publish'))||old[0];
    old.forEach(b=>{if(b!==keep)b.remove();});
    pair(keep,root.matches('.project-card')?'project':'practice');
  });
}
function enhanceExamples(){
  document.querySelectorAll('.csai-example-actions').forEach(actions=>{
    let publish=actions.querySelector('[data-final-publish]');
    if(!publish){publish=document.createElement('button');publish.type='button';publish.textContent='Publish to GitHub';actions.appendChild(publish);}
    pair(publish,'example');
  });
}
function enhance(){normalizeTaskPublishers();enhanceExamples();}
function queueEnhance(){if(enhanceQueued)return;enhanceQueued=true;requestAnimationFrame(()=>{enhanceQueued=false;enhance();});}
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-final-publish],[data-final-readme]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();publish(button,button.hasAttribute('data-final-readme'));},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
new MutationObserver(queueEnhance).observe(document.documentElement,{childList:true,subtree:true});
window.CSAIPortfolioPublisher={details,readme};
})();