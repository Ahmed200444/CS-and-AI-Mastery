(function(){
'use strict';

var dataNode=document.getElementById('csai-project-data');
if(!dataNode)return;
var DATA={};
try{DATA=JSON.parse(dataNode.textContent||'{}')}catch(error){console.error('[CS AI Mastery] Project data failed to parse',error);return}
var courseId=String(DATA.courseId||'course');
var projects=Array.isArray(DATA.projects)?DATA.projects:[];
var DRAFT='csai-project-draft-v1:'+courseId+':';
var STATUS_URL='/api/github/status';
var FILE_URL='/api/github/file';
var STORE_KEY='csai-github-preferred-repo';
var pyInstance=null,pyPromise=null,sqlInstance=null,sqlPromise=null;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function slug(v){return String(v||'project').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'project'}
function arr(v){return Array.isArray(v)?v:(v?[v]:[])}
function ext(lang){return{python:'py',javascript:'js',sql:'sql',html:'html',json:'json',shell:'sh',text:'txt'}[lang]||'txt'}
function label(lang){return{python:'Python',javascript:'JavaScript',sql:'SQL',html:'HTML',json:'JSON',shell:'Shell / config',text:'Project notes'}[lang]||lang}
function starter(lang,title){
 if(lang==='python')return '# '+title+'\n\n# Build your project here.\n\nprint("Project workspace ready")\n';
 if(lang==='javascript')return '// '+title+'\n\n// Build your project here.\nconsole.log("Project workspace ready");\n';
 if(lang==='sql')return '-- '+title+'\n\n-- Write your project queries here.\nSELECT "Project workspace ready" AS status;\n';
 if(lang==='html')return '<!doctype html>\n<html>\n<head><meta charset="utf-8"><title>'+title+'</title></head>\n<body>\n  <h1>'+title+'</h1>\n  <p>Build your project here.</p>\n</body>\n</html>\n';
 if(lang==='json')return '{\n  "project": '+JSON.stringify(title)+',\n  "status": "in progress"\n}\n';
 if(lang==='shell')return '# '+title+'\n# Write the commands/configuration you would use for this project.\n';
 return title+'\n\nProject notes:\n';
}
function projectKey(p,i){return String(p.id||slug(p.title||('project-'+(i+1))))}
function getDraft(key){try{return localStorage.getItem(DRAFT+key)||''}catch(e){return''}}
function setDraft(key,value){try{localStorage.setItem(DRAFT+key,value)}catch(e){}}
function clearDraft(key){try{localStorage.removeItem(DRAFT+key)}catch(e){}}

function addStyle(){
 if(document.getElementById('csai-project-workspace-style'))return;
 var s=document.createElement('style');s.id='csai-project-workspace-style';s.textContent=`
 .evergreen-location{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);border-radius:999px;background:var(--pill);color:var(--pilltext);padding:5px 9px;font:850 .76rem/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}.evergreen-location:hover{filter:brightness(.97)}
 .project-section{margin-top:14px}.project-intro{margin:-2px 0 14px;color:var(--muted)}.project-stack{display:grid;gap:18px}.project-card{overflow:hidden;border:1px solid var(--border);border-radius:15px;background:var(--panel)}.project-head{padding:16px 18px;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--panel) 90%,var(--bg))}.project-head-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.project-head h3{margin:0;font-size:1.12rem}.project-badge{padding:4px 8px;border-radius:999px;background:var(--pill);color:var(--pilltext);font-size:.72rem;font-weight:900}.project-head p{margin:8px 0 0;line-height:1.65}.project-requirements{margin:11px 0 0;padding-left:20px}.project-requirements li{margin:4px 0}.project-workspace{display:grid;grid-template-columns:minmax(0,1fr);background:var(--panel)}.project-editorbar{display:flex;align-items:center;gap:10px;padding:9px 11px;border-bottom:1px solid var(--border);background:var(--code);color:#dce7f4;font:700 12px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace}.project-dots{display:flex;gap:5px}.project-dots i{width:8px;height:8px;border-radius:50%;background:#667386}.project-file{flex:1}.project-lang{border:1px solid #48586a;border-radius:6px;background:#111a26;color:#e7eef7;padding:4px 6px;font:inherit}.project-editor{display:block;width:100%;min-height:310px;resize:vertical;border:0;border-bottom:1px solid var(--border);outline:0;padding:15px;background:#0d1520;color:#e8eef6;font:500 14px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;tab-size:4}.project-editor:focus{box-shadow:inset 0 0 0 2px #357fc0}.project-toolbar{display:flex;align-items:center;gap:8px;padding:10px;overflow-x:auto;white-space:nowrap;border-bottom:1px solid var(--border);scrollbar-width:thin}.project-btn{flex:0 0 auto;border:1px solid var(--border);border-radius:8px;padding:8px 11px;background:var(--panel);color:var(--text);font:800 13px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}.project-btn.run{background:#17649a;color:#fff;border-color:#17649a}.project-btn.publish{background:#16805b;color:#fff;border-color:#16805b}.project-btn:disabled{opacity:.55;cursor:wait}.project-output-wrap{background:color-mix(in srgb,var(--bg) 82%,var(--panel))}.project-output-label{display:flex;justify-content:space-between;gap:10px;padding:9px 13px 0;color:var(--muted);font-size:.7rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.project-output{min-height:88px;padding:12px 14px;white-space:pre-wrap;overflow:auto;font:500 13px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}.project-output .ok{color:#16805b;font-weight:850}.project-output .bad{color:#c44152;font-weight:850}.project-status{padding:0 12px 10px;color:var(--muted);font-size:.76rem;min-height:20px}.project-preview{width:100%;height:300px;border:0;background:#fff}.project-note{padding:10px 14px;border-top:1px solid var(--border);color:var(--muted);font-size:.82rem;line-height:1.55}
 @media(max-width:720px){.project-editor{min-height:240px}.project-output-label{flex-direction:column;gap:2px}.evergreen-location{white-space:normal;text-align:left}}
 `;document.head.appendChild(s)
}

function languageOptions(current){return['python','javascript','sql','html','json','shell','text'].map(function(x){return'<option value="'+x+'" '+(x===current?'selected':'')+'>'+esc(label(x))+'</option>'}).join('')}
function renderProject(p,i){
 var key=projectKey(p,i),lang=p.language||DATA.defaultLanguage||'text',initial=p.starter||starter(lang,p.title||('Project '+(i+1))),saved=getDraft(key),code=saved||initial,req=arr(p.requirements);
 return '<article class="project-card" data-project="'+esc(key)+'" data-project-index="'+i+'"><div class="project-head"><div class="project-head-top"><h3>'+esc(p.title||('Project '+(i+1)))+'</h3><span class="project-badge">Project '+String(i+1).padStart(2,'0')+'</span></div><p>'+esc(p.description||'Build the project using the concepts from this course.')+'</p>'+(req.length?'<ul class="project-requirements">'+req.map(function(r){return'<li>'+esc(r)+'</li>'}).join('')+'</ul>':'')+'</div><div class="project-workspace"><div class="project-editorbar"><span class="project-dots"><i></i><i></i><i></i></span><span class="project-file" data-project-file>'+esc(slug(p.title||key)+'.'+ext(lang))+'</span><select class="project-lang" data-project-lang>'+languageOptions(lang)+'</select></div><textarea class="project-editor" spellcheck="false" data-project-editor>'+esc(code)+'</textarea><div class="project-toolbar"><button type="button" class="project-btn run" data-project-run>▶ Run / Check</button><button type="button" class="project-btn" data-project-reset>Reset</button><button type="button" class="project-btn publish" data-project-publish>Publish to GitHub</button></div><div class="project-output-wrap"><div class="project-output-label"><span>Output</span><span>Run the project to see results here</span></div><div class="project-output" data-project-output>Ready.</div></div><div class="project-status" data-project-status></div><div class="project-note">Browser-safe code runs directly here. Shell, Docker, cloud, networking, and infrastructure projects use validation mode because a web page cannot safely create real machines, containers, or cloud resources.</div></div></article>';
}

function findProjectSection(){return Array.from(document.querySelectorAll('section.card')).find(function(section){var h=section.querySelector('h2');return h&&/^projects$/i.test(h.textContent.trim())})}
function render(){
 addStyle();
 var hero=document.querySelector('.hero'),meta=hero&&hero.querySelector('.meta');
 if(meta&&!meta.querySelector('.evergreen-location')){var b=document.createElement('button');b.type='button';b.className='evergreen-location';b.innerHTML='🌱 Evergreen Learning: Active — inside every lesson → Evergreen Mastery Lab';b.addEventListener('click',function(){var lab=document.querySelector('[data-evergreen-lab]');if(lab){var lesson=lab.closest('.lesson');if(lesson)lesson.open=true;lab.scrollIntoView({behavior:'smooth',block:'start'})}});meta.appendChild(b)}
 var section=findProjectSection();if(!section||section.dataset.projectWorkspace==='1')return;section.dataset.projectWorkspace='1';section.classList.add('project-section');section.innerHTML='<h2>Projects</h2><p class="project-intro">Build, run/check, review the output, and publish your project without leaving the course.</p><div class="project-stack">'+(projects.length?projects.map(renderProject).join(''):'<p class="muted">No separate projects are listed.</p>')+'</div>';bind(section)
}

function loadScript(src,test){return new Promise(function(resolve,reject){if(test&&test())return resolve();var s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=function(){reject(new Error('Could not load browser runner.'))};document.head.appendChild(s)})}
var PY=`
import sys,io,traceback
_b=io.StringIO();_old=sys.stdout;sys.stdout=_b;_err=None
try: exec(compile(_SRC,'<course-project>','exec'),{'__name__':'__main__'})
except Exception: _err=traceback.format_exc()
finally: sys.stdout=_old
_RESULT=_b.getvalue() if _err is None else _b.getvalue()+'\\n'+_err
_ISERR=_err is not None
`;
async function getPy(){if(pyInstance)return pyInstance;if(!pyPromise){pyPromise=(async function(){await loadScript('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js',function(){return typeof window.loadPyodide==='function'});pyInstance=await window.loadPyodide();return pyInstance})()}return pyPromise}
async function runPython(code){var py=await getPy();try{await py.loadPackagesFromImports(code)}catch(e){}py.globals.set('_SRC',code);py.runPython(PY);return{error:!!py.globals.get('_ISERR'),text:String(py.globals.get('_RESULT')||'')}}
function runJS(code){return new Promise(function(resolve){var blob=new Blob([`self.console={log:(...a)=>self.postMessage({t:'log',v:a.map(String).join(' ')})};try{new Function(${JSON.stringify(code)})();self.postMessage({t:'done'})}catch(e){self.postMessage({t:'err',v:e.stack||String(e)})}`],{type:'text/javascript'}),url=URL.createObjectURL(blob),w=new Worker(url),lines=[],done=false,t=setTimeout(function(){if(done)return;done=true;w.terminate();URL.revokeObjectURL(url);resolve({error:true,text:'Execution stopped after 2 seconds.'})},2500);w.onmessage=function(e){if(done)return;var d=e.data||{};if(d.t==='log')lines.push(d.v);if(d.t==='err'){done=true;clearTimeout(t);w.terminate();URL.revokeObjectURL(url);resolve({error:true,text:lines.concat([d.v]).join('\n')})}else if(d.t==='done'){done=true;clearTimeout(t);w.terminate();URL.revokeObjectURL(url);resolve({error:false,text:lines.join('\n')})}}})}
async function getSql(){if(sqlInstance)return sqlInstance;if(!sqlPromise){sqlPromise=(async function(){await loadScript('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js',function(){return typeof window.initSqlJs==='function'});var SQL=await window.initSqlJs({locateFile:function(f){return'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/'+f}}),db=new SQL.Database();db.run("CREATE TABLE Customers (customer_id INTEGER, name TEXT, age INTEGER, country TEXT); INSERT INTO Customers VALUES (1,'Ada',31,'UAE'),(2,'Linus',22,'USA'),(3,'Grace',28,'UK'),(4,'Alan',25,'UAE'); CREATE TABLE Orders (order_id INTEGER, item TEXT, amount INTEGER, customer_id INTEGER); INSERT INTO Orders VALUES (1,'Keyboard',400,1),(2,'Mouse',300,1),(3,'Monitor',1200,3),(4,'Keyboard',400,4);");sqlInstance=db;return db})()}return sqlPromise}
async function runSQL(code){try{var db=await getSql(),r=db.exec(code);if(!r.length)return{error:false,text:'Query ran successfully. 0 result rows.'};var cols=r[0].columns,rows=r[0].values.slice(0,30),out=[cols.join(' | '),cols.map(function(){return'---'}).join(' | ')];rows.forEach(function(row){out.push(row.map(function(v){return v===null?'NULL':String(v)}).join(' | '))});return{error:false,text:out.join('\n')}}catch(e){return{error:true,text:e.message||String(e)}}}
function validation(code,lang,p){
 var text=String(code||'').trim();if(!text)return{error:true,text:'Nothing to check yet. Add your project work first.'};
 if(lang==='json'){try{var obj=JSON.parse(text);return{error:false,text:'JSON is valid.\nTop-level type: '+(Array.isArray(obj)?'array':typeof obj)+'\nProject check passed.'}}catch(e){return{error:true,text:'JSON error: '+e.message}}
 if(lang==='shell'){var commands=text.split(/\r?\n/).map(function(x){return x.trim()}).filter(function(x){return x&&!x.startsWith('#')});return{error:false,text:'Validation complete.\n'+commands.length+' command/config line(s) found.\n\nFor safety, system commands are not executed by the browser. Review the commands, expected result, and course requirements before running them in a real development environment.'}}
 var words=text.split(/\s+/).filter(Boolean).length,req=arr(p.requirements),matched=req.filter(function(r){var ks=String(r).toLowerCase().split(/[^a-z0-9]+/).filter(function(x){return x.length>4});return ks.some(function(k){return text.toLowerCase().includes(k)})}).length;
 return{error:false,text:'Project response captured.\nWords/tokens: '+words+(req.length?'\nRequirement signals found: '+matched+' of '+req.length:'')+'\n\nUse this Output as a completeness check; compare your work with the project requirements above.'};
}
async function execute(lang,code,out,p){
 if(lang==='python'){out.textContent='Loading Python runner…';var r=await runPython(code);out.innerHTML='<span class="'+(r.error?'bad':'ok')+'">'+(r.error?'Run error':'Output')+'</span>\n'+esc(r.text||'(no printed output)');return}
 if(lang==='javascript'){var j=await runJS(code);out.innerHTML='<span class="'+(j.error?'bad':'ok')+'">'+(j.error?'Run error':'Output')+'</span>\n'+esc(j.text||'(no console output)');return}
 if(lang==='sql'){var q=await runSQL(code);out.innerHTML='<span class="'+(q.error?'bad':'ok')+'">'+(q.error?'SQL error':'Output')+'</span>\n'+esc(q.text);return}
 if(lang==='html'){out.innerHTML='';var f=document.createElement('iframe');f.className='project-preview';f.setAttribute('sandbox','allow-scripts');f.srcdoc=code;out.appendChild(f);return}
 var v=validation(code,lang,p);out.innerHTML='<span class="'+(v.error?'bad':'ok')+'">'+(v.error?'Check failed':'Check complete')+'</span>\n'+esc(v.text)
}

async function githubStatus(){var r=await fetch(STATUS_URL,{credentials:'same-origin',cache:'no-store'}),d=await r.json().catch(function(){return{}});if(!r.ok)throw new Error(d.error||'Could not check GitHub connection');if(!d.connected)throw new Error('GitHub is not connected');return d}
function chooseRepo(d){var repos=Array.isArray(d.repositories)?d.repositories:[],preferred='';try{preferred=localStorage.getItem(STORE_KEY)||''}catch(e){}var found=repos.find(function(r){return r.full_name===preferred})||repos.find(function(r){return r.full_name==='Ahmed200444/CS-and-AI-Mastery'})||repos[0];return found&&found.full_name}
async function publish(card,p,button){var editor=card.querySelector('[data-project-editor]'),lang=card.querySelector('[data-project-lang]').value,content=String(editor.value||'').trimEnd(),status=card.querySelector('[data-project-status]');if(!content){status.textContent='Add your project work before publishing.';return}var path='student-code/projects/'+slug(courseId)+'/'+slug(p.title||'project')+'.'+ext(lang),old=button.textContent;button.disabled=true;button.textContent='Publishing…';status.textContent='Publishing '+path+'…';try{var d=await githubStatus(),repo=chooseRepo(d);if(!repo)throw new Error('No GitHub repository is available');var r=await fetch(FILE_URL,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSAI-CSRF':d.csrf},body:JSON.stringify({repository:repo,path:path,content:content+'\n',message:'Update '+path.split('/').pop()+' project from CS & AI Mastery'})}),result=await r.json().catch(function(){return{}});if(!r.ok)throw new Error(result.error||'GitHub publish failed');button.textContent='Published ✓';status.textContent='Published ✓  '+path;setTimeout(function(){button.textContent=old;button.disabled=false},1800)}catch(error){button.textContent=old;button.disabled=false;status.textContent=error.message||String(error)}}

function bind(section){var timers={};section.addEventListener('input',function(e){if(!e.target.matches('[data-project-editor]'))return;var card=e.target.closest('[data-project]'),key=card.getAttribute('data-project');clearTimeout(timers[key]);timers[key]=setTimeout(function(){setDraft(key,e.target.value)},180)});section.addEventListener('change',function(e){if(!e.target.matches('[data-project-lang]'))return;var card=e.target.closest('[data-project]'),i=Number(card.getAttribute('data-project-index')),p=projects[i]||{},lang=e.target.value,file=card.querySelector('[data-project-file]'),editor=card.querySelector('[data-project-editor]');if(file)file.textContent=slug(p.title||'project')+'.'+ext(lang);var current=String(editor.value||'').trim();if(!current||current===String(p.starter||'').trim()){editor.value=starter(lang,p.title||'Project');setDraft(card.getAttribute('data-project'),editor.value)}});section.addEventListener('click',async function(e){var card=e.target.closest('[data-project]');if(!card)return;var i=Number(card.getAttribute('data-project-index')),p=projects[i]||{},editor=card.querySelector('[data-project-editor]'),lang=card.querySelector('[data-project-lang]').value,out=card.querySelector('[data-project-output]');if(e.target.closest('[data-project-reset]')){editor.value=p.starter||starter(lang,p.title||'Project');clearDraft(card.getAttribute('data-project'));out.textContent='Reset.';return}var run=e.target.closest('[data-project-run]');if(run){run.disabled=true;out.textContent='Running / checking project…';try{await execute(lang,editor.value,out,p)}catch(error){out.innerHTML='<span class="bad">Runner error</span>\n'+esc(error.message||String(error))}finally{run.disabled=false}return}var pub=e.target.closest('[data-project-publish]');if(pub){e.preventDefault();await publish(card,p,pub)}})}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
setTimeout(render,350);
})();
