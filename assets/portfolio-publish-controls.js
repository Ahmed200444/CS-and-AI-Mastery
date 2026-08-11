(()=>{'use strict';
const STATUS_URL='/api/github/status',FILE_URL='/api/github/file',STORE_KEY='csai-github-preferred-repo';
let statusPromise=null;
const clean=v=>String(v||'').trim();
const slug=v=>clean(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item';
function courseId(){return slug(document.body.dataset.courseId||document.documentElement.dataset.courseId||location.pathname.split('/').pop()?.replace(/\.html$/,'')||document.querySelector('h1')?.textContent||'course')}
function ext(code,hint=''){
 hint=String(hint||'').toLowerCase();
 if(/python|\bpy\b/.test(hint)||/^\s*(def |from |import )/m.test(code))return'py';
 if(/sql/.test(hint)||/\b(select|insert|update|create table)\b/i.test(code))return'sql';
 if(/html/.test(hint)||/<[a-z][\s\S]*>/i.test(code))return'html';
 if(/javascript|\bjs\b/.test(hint)||/\b(const|let|function)\b|=>/.test(code))return'js';
 return'txt';
}
function containerFor(button){return button.closest('[data-exercise],[data-practice],.oa-task,.exercise,.practice,.csai-example-card,.csai-example,.evergreen-example,section,article')||button.parentElement}
function details(button){
 const root=containerFor(button),example=!!button.closest('.csai-example,.csai-example-card,.evergreen-example')||button.dataset.finalKind==='example',kind=example?'examples':'practice';
 const editor=root?.querySelector('textarea[data-editor],textarea'),pre=root?.querySelector('pre code,pre'),code=clean(editor?.value??pre?.textContent);
 const title=clean(root?.dataset.title||root?.querySelector('h2,h3,h4,.title,.exercise-title')?.textContent||button.dataset.title||(example?'Example':'Practice'));
 const hint=clean(button.dataset.language||editor?.dataset.language||root?.dataset.language||pre?.className),extension=ext(code,hint),item=slug(title),filename=kind==='examples'?`example.${extension}`:`${item}.${extension}`,base=`student-code/${kind}/${courseId()}/${item}`;
 return{root,kind,code,title,extension,codePath:`${base}/${filename}`};
}
async function status(){if(!statusPromise)statusPromise=fetch(STATUS_URL,{credentials:'same-origin'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'GitHub status failed');return d}).catch(e=>{statusPromise=null;throw e});return statusPromise}
function selectedRepo(s){const preferred=localStorage.getItem(STORE_KEY);return s.repositories?.find(r=>r.full_name===preferred)?.full_name||s.repositories?.find(r=>r.full_name==='Ahmed200444/CS-and-AI-Mastery')?.full_name||s.repositories?.[0]?.full_name||''}
function setMessage(button,text,kind=''){let row=button.closest('.csai-final-publish-row')||button.parentElement,el=row?.querySelector('.csai-final-publish-status');if(!el&&row){el=document.createElement('span');el.className='csai-final-publish-status';row.appendChild(el)}if(el){el.textContent=text;el.className=`csai-final-publish-status ${kind}`}}
async function publish(button){
 const d=details(button);if(!d.code){setMessage(button,'Add your solution first','is-error');return}
 const old=button.textContent;button.disabled=true;button.textContent='Publishing…';setMessage(button,'Publishing '+d.codePath+'…');
 try{const s=await status();if(!s.connected)throw new Error('Connect GitHub first.');const repository=selectedRepo(s);if(!repository)throw new Error('Choose a GitHub repository first.');const response=await fetch(FILE_URL,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSAI-CSRF':s.csrf},body:JSON.stringify({repository,path:d.codePath,content:d.code,createOnly:true,message:`Add ${d.title} from CS & AI Mastery`})}),data=await response.json();if(!response.ok)throw new Error(data.error||'GitHub publish failed');setMessage(button,data.alreadyExists?'Already published ✓':'Published ✓','is-ok');button.textContent=data.alreadyExists?'Already published ✓':'Published ✓';setTimeout(()=>{button.textContent=old;button.disabled=false},1600)}catch(error){button.textContent=old;button.disabled=false;setMessage(button,error.message,'is-error')}
}
function pair(existing,kind){
 if(existing.dataset.finalPublishReady)return;
 const root=containerFor(existing);if(root&&root.closest('.project-card,.project-workspace,[data-project-card]'))return;
 existing.dataset.finalPublishReady='1';existing.dataset.finalKind=kind;existing.setAttribute('data-final-publish','');existing.removeAttribute('data-publish');
 existing.textContent='Publish to GitHub';existing.classList.add('csai-clean-publish');
 let row=existing.closest('.csai-final-publish-row');if(!row){row=document.createElement('span');row.className='csai-final-publish-row';existing.parentNode?.insertBefore(row,existing);row.appendChild(existing)}
 if(!row.querySelector('.csai-final-publish-status')){const s=document.createElement('span');s.className='csai-final-publish-status';s.setAttribute('aria-live','polite');row.appendChild(s)}
}
function dedupe(root){if(!root)return;const buttons=Array.from(root.querySelectorAll('[data-publish],[data-final-publish]')).filter(b=>!b.closest('.project-card,.project-workspace,[data-project-card]'));buttons.slice(1).forEach(b=>b.remove())}
function enhance(){
 document.querySelectorAll('.oa-task,[data-exercise],[data-practice],.exercise,.practice').forEach(root=>{dedupe(root);const b=root.querySelector('[data-publish],[data-final-publish]');if(b)pair(b,'practice')});
 document.querySelectorAll('.csai-example-actions').forEach(actions=>{let publish=actions.querySelector('[data-final-publish],[data-publish]');if(!publish){publish=document.createElement('button');publish.type='button';publish.textContent='Publish to GitHub';actions.appendChild(publish)}pair(publish,'example');dedupe(actions)});
 document.querySelectorAll('[data-final-readme]').forEach(b=>b.remove());
}
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-final-publish]');if(!button||button.closest('.project-card,.project-workspace,[data-project-card]'))return;event.preventDefault();event.stopImmediatePropagation();publish(button)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
new MutationObserver(()=>enhance()).observe(document.documentElement,{childList:true,subtree:true});
})();
