(()=>{'use strict';
const STATUS_URL='/api/github/status',FILE_URL='/api/github/file',STORE_KEY='csai-github-preferred-repo';
let statusPromise=null;
const clean=v=>String(v||'').trim();
const slug=v=>clean(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item';
function courseId(){return slug(document.body.dataset.courseId||document.documentElement.dataset.courseId||location.pathname.split('/').pop()?.replace(/\.html$/,'')||document.querySelector('h1')?.textContent||'course')}
function courseTitle(){return clean(document.querySelector('.hero h1,h1')?.textContent||courseId())}
function ext(code,hint=''){
 hint=String(hint||'').toLowerCase();
 if(/python|\bpy\b/.test(hint)||/^\s*(def |from |import )/m.test(code))return'py';
 if(/sql/.test(hint)||/\b(select|insert|update|create table)\b/i.test(code))return'sql';
 if(/html/.test(hint)||/<[a-z][\s\S]*>/i.test(code))return'html';
 if(/javascript|\bjs\b/.test(hint)||/\b(const|let|function)\b|=>/.test(code))return'js';
 return'txt';
}
function languageName(extension){return({py:'Python',js:'JavaScript',sql:'SQL',html:'HTML',txt:'Text / concept work'})[extension]||extension.toUpperCase()}
function runLine(extension,filename){if(extension==='py')return`python ${filename}`;if(extension==='js')return`node ${filename}`;if(extension==='html')return`Open ${filename} in a browser.`;if(extension==='sql')return`Run ${filename} in the course SQL runner or your SQL client.`;return`Open ${filename} with the appropriate tool.`}
function containerFor(button){return button.closest('.evergreen-example,.csai-example-card,.csai-example,.oa-task,[data-exercise],[data-practice],.exercise,.practice')||button.parentElement}
function details(button){
 const root=containerFor(button),example=!!root?.matches('.evergreen-example,.csai-example-card,.csai-example')||button.dataset.finalKind==='example',kind=example?'examples':'practice';
 const editor=root?.querySelector('textarea[data-evergreen-code],textarea[data-editor],textarea'),pre=root?.querySelector('pre code,pre'),code=clean(editor?.value??pre?.textContent);
 const title=clean(root?.dataset.title||root?.querySelector('.evergreen-example-head b,h2,h3,h4,.title,.exercise-title')?.textContent||button.dataset.title||(example?'Example':'Practice'));
 const hint=clean(button.dataset.language||editor?.dataset.language||root?.dataset.lang||root?.dataset.language||pre?.className),extension=ext(code,hint),item=slug(title),filename=kind==='examples'?`example.${extension}`:`${item}.${extension}`,base=`student-code/${kind}/${courseId()}/${item}`;
 const description=clean(root?.querySelector('.description,.exercise-description,.oa-prompt,p')?.textContent);
 return{root,kind,code,title,description,extension,filename,base,codePath:`${base}/${filename}`,readmePath:`${base}/README.md`};
}
function readme(d){
 const type=d.kind==='examples'?'Learning Example':'Course Exercise';
 const overview=d.description||`${type} completed while studying ${courseTitle()} in CS & AI Mastery.`;
 const lines=d.code?d.code.split(/\r?\n/).filter(x=>x.trim()).length:0;
 return `# ${d.title}\n\n**Course:** ${courseTitle()}  \n**Type:** ${type}  \n**Language:** ${languageName(d.extension)}\n\n## Overview\n\n${overview}\n\n## What this demonstrates\n\n- Applies the concepts practiced in **${courseTitle()}**.\n- Keeps the submitted solution in a focused, reviewable file.\n- Can be rerun and checked against the learning task in CS & AI Mastery.\n\n## Implementation\n\n- **Main file:** \`${d.filename}\`\n- **Non-empty code lines:** ${lines}\n- **Saved from:** ${type.toLowerCase()} workspace\n\n## How to run\n\n\`${runLine(d.extension,d.filename)}\`\n\n## Validation\n\nUse the course **Run / Check** controls to verify the solution before publishing. For assessment exercises, compare the result with the visible and hidden checks provided by the course.\n\n## Learning note\n\nThis item was completed as part of **CS & AI Mastery** and saved separately so the GitHub portfolio stays readable when lessons are revisited.\n`;
}
async function status(){if(!statusPromise)statusPromise=fetch(STATUS_URL,{credentials:'same-origin'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'GitHub status failed');return d}).catch(e=>{statusPromise=null;throw e});return statusPromise}
function selectedRepo(s){const preferred=localStorage.getItem(STORE_KEY);return s.repositories?.find(r=>r.full_name===preferred)?.full_name||s.repositories?.find(r=>r.full_name==='Ahmed200444/CS-and-AI-Mastery')?.full_name||s.repositories?.[0]?.full_name||''}
function statusNode(button){const root=containerFor(button);let el=root?.querySelector('[data-final-publish-status]');if(!el&&root){el=document.createElement('span');el.className='csai-final-publish-status';el.setAttribute('data-final-publish-status','');el.setAttribute('aria-live','polite');const toolbar=button.closest('.oa-toolbar,.evergreen-toolbar,.csai-example-actions,.lesson-run-toolbar')||button.parentElement;toolbar?.appendChild(el)}return el}
function setMessage(button,text,kind=''){const el=statusNode(button);if(el){el.textContent=text;el.className=`csai-final-publish-status ${kind}`}}
async function publish(button,isReadme){
 const d=details(button);if(!d.code){setMessage(button,'Add your solution first','is-error');return}
 const old=button.textContent;button.disabled=true;button.textContent=isReadme?'Adding README…':'Publishing…';setMessage(button,isReadme?'Creating README from this item…':`Publishing ${d.filename}…`);
 try{
  const s=await status();if(!s.connected)throw new Error('Connect GitHub first.');const repository=selectedRepo(s);if(!repository)throw new Error('Choose a GitHub repository first.');
  const path=isReadme?d.readmePath:d.codePath,content=isReadme?readme(d):d.code;
  const response=await fetch(FILE_URL,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSAI-CSRF':s.csrf},body:JSON.stringify({repository,path,content,createOnly:true,requirePath:isReadme?d.codePath:undefined,message:isReadme?`Add README for ${d.title}`:`Add ${d.title} from CS & AI Mastery`})}),data=await response.json();
  if(!response.ok)throw new Error(data.error||'GitHub publish failed');
  const done=data.alreadyExists?(isReadme?'README already added ✓':'Already published ✓'):(isReadme?'README added ✓':'Published ✓');setMessage(button,done,'is-ok');button.textContent=done;setTimeout(()=>{button.textContent=old;button.disabled=false},1700);
 }catch(error){button.textContent=old;button.disabled=false;setMessage(button,error.message,'is-error')}
}
function toolbarFor(root){return root?.querySelector('.oa-toolbar,.evergreen-toolbar,.csai-example-actions,.lesson-run-toolbar')||null}
function dedupePublish(root,keep){if(!root)return;Array.from(root.querySelectorAll('[data-publish],[data-final-publish]')).filter(b=>!b.closest('.project-card,.project-workspace,[data-project-card]')&&b!==keep).forEach(b=>b.remove())}
function attach(root,existing,kind){
 if(!root||!existing||root.closest('.project-card,.project-workspace,[data-project-card]'))return;
 const toolbar=toolbarFor(root)||existing.parentElement;if(!toolbar)return;
 existing.dataset.finalPublishReady='1';existing.dataset.finalKind=kind;existing.setAttribute('data-final-publish','');existing.removeAttribute('data-publish');existing.type='button';existing.textContent='Publish to GitHub';existing.classList.add('csai-clean-publish');
 if(existing.parentElement!==toolbar)toolbar.appendChild(existing);dedupePublish(root,existing);
 let readmeBtn=root.querySelector('[data-final-readme]');if(!readmeBtn){readmeBtn=document.createElement('button');readmeBtn.type='button';readmeBtn.textContent='Add a README';readmeBtn.setAttribute('data-final-readme','');readmeBtn.dataset.finalKind=kind;readmeBtn.className='csai-clean-readme';existing.insertAdjacentElement('afterend',readmeBtn)}else{readmeBtn.textContent='Add a README';readmeBtn.classList.add('csai-clean-readme');if(readmeBtn.parentElement!==toolbar)existing.insertAdjacentElement('afterend',readmeBtn)}
 statusNode(existing);
}
function ensureExample(root){if(!root.querySelector('textarea[data-evergreen-code],textarea[data-editor],pre code,pre'))return;const toolbar=toolbarFor(root);if(!toolbar)return;let publish=root.querySelector('[data-final-publish],[data-publish]');if(!publish){publish=document.createElement('button');publish.type='button';toolbar.appendChild(publish)}attach(root,publish,'example')}
function ensurePractice(root){if(root.closest('.project-card,.project-workspace,[data-project-card]'))return;const toolbar=toolbarFor(root);if(!toolbar)return;let publish=root.querySelector('[data-final-publish],[data-publish]');if(!publish){publish=document.createElement('button');publish.type='button';toolbar.appendChild(publish)}attach(root,publish,'practice')}
function enhance(){
 document.querySelectorAll('.evergreen-example,.csai-example-card,.csai-example').forEach(ensureExample);
 document.querySelectorAll('.assessment-stack .oa-task,[data-exercise],[data-practice]').forEach(ensurePractice);
}
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-final-publish],[data-final-readme]');if(!button||button.closest('.project-card,.project-workspace,[data-project-card]'))return;event.preventDefault();event.stopImmediatePropagation();publish(button,button.hasAttribute('data-final-readme'))},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
setTimeout(enhance,180);setTimeout(enhance,700);setTimeout(enhance,1400);
new MutationObserver(()=>enhance()).observe(document.documentElement,{childList:true,subtree:true});
})();
