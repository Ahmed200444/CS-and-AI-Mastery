(function(){
'use strict';

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function codeFrom(node){
  var holder=node.closest('[data-lang-variant],.lesson-run-card,.evergreen-example,.project-card,.lesson');
  var code=holder&&holder.querySelector('[data-csai-language-generated],.csai-language-code,pre.code,[data-evergreen-code],[data-project-editor]');
  return String(code&&(code.value!=null?code.value:code.textContent)||'').trim();
}
function contextText(node){var holder=node.closest('[data-lang-variant],.lesson-run-card,.evergreen-example,.project-card,.lesson');return String(holder&&holder.textContent||'').toLowerCase();}
function kind(code,context){
  var text=(code+'\n'+context).toLowerCase();
  if(/(^|\n)\s*git\s+|\bgit (clone|status|add|commit|push|pull|branch|checkout|switch|merge|rebase)\b/m.test(text))return'Git';
  if(/\bdocker(file|\s+(build|run|compose|ps|images|exec|pull|push))\b|\bfrom\s+[a-z0-9_.:\/-]+\s*$/mi.test(text))return'Docker';
  if(/\b(kubectl|terraform|aws\s+|gcloud\s+|az\s+)\b/.test(text))return'Cloud / infrastructure';
  if(/\b(ping|traceroute|tracert|nslookup|dig|netstat|ifconfig|ipconfig|ip\s+addr|ss\s+-)\b/.test(text))return'Networking';
  if(/(^|\n)\s*(sudo\s+|apt\s+|apt-get\s+|yum\s+|dnf\s+|chmod\s+|chown\s+|grep\s+|awk\s+|sed\s+|ls\b|cd\s+|pwd\b|mkdir\s+|rm\s+|cp\s+|mv\s+|ssh\s+|curl\s+|export\s+)/m.test(text)||/^#!\/bin\/(ba)?sh/m.test(text))return'Shell / Linux';
  return'';
}
function summaryFor(type,code){
  var first=String(code||'').split(/\r?\n/).map(function(x){return x.trim();}).find(function(x){return x&&!/^#/.test(x);})||'(configuration or command sequence)';
  var intent='Review what each step changes and confirm the expected state before running it on a real system.';
  if(type==='Git')intent='This changes or inspects repository state. Check the current branch, working tree, and remote before any write command.';
  if(type==='Docker')intent='This describes or controls containers/images. Check the image, ports, volumes, environment variables, and build context first.';
  if(type==='Cloud / infrastructure')intent='This can create or change remote infrastructure. Confirm account/project, region, credentials, plan/diff, and cost impact before applying.';
  if(type==='Networking')intent='This inspects connectivity, name resolution, routes, interfaces, or listening sockets. Interpret the result layer by layer rather than treating one command as the whole diagnosis.';
  if(type==='Shell / Linux')intent='This operates on the local system. Check paths, permissions, current directory, and whether the command is read-only or destructive.';
  return{first:first,intent:intent};
}
function simulation(type,code){
  var s=summaryFor(type,code),lines=String(code||'').split(/\r?\n/).filter(function(x){return x.trim()&&!/^\s*#/.test(x);}).length;
  return '<span class="ok">Simulation / validation</span>\n'+
    esc('Environment: '+type)+'\n'+
    esc('First step: '+s.first)+'\n'+
    esc('Steps detected: '+lines)+'\n\n'+
    esc('What should happen: '+s.intent)+'\n\n'+
    esc('Before running it for real: verify inputs, permissions/credentials, target environment, expected output, and a rollback or recovery path.')+'\n\n'+
    esc('Common failure checks: wrong path/context, missing dependency, permissions, authentication, network/DNS, incompatible version, or an unexpected current state.')+'\n\n'+
    esc('Safety note: the browser did not execute this system-level command. This output is a learning simulation/validation, not a claim that the real environment changed.');
}
function outputNode(button){
  var holder=button.closest('[data-lang-variant],.lesson-run-card,.evergreen-example,.project-card,.lesson');
  if(!holder)return null;
  return holder.querySelector('[data-csai-example-output],[data-evergreen-output],[data-project-output],.lesson-run-output,.csai-example-output,.evergreen-output,.project-output');
}
function intercept(button,event){
  var code=codeFrom(button),type=kind(code,contextText(button));
  if(!type)return false;
  var out=outputNode(button);if(!out)return false;
  event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation();
  out.innerHTML=simulation(type,code);return true;
}
function enhancePre(pre,index){
  if(pre.dataset.csaiSafeOutput==='1')return;
  var code=String(pre.textContent||''),type=kind(code,String(pre.closest('.lesson')&&pre.closest('.lesson').textContent||''));
  if(!type)return;
  if(pre.closest('[data-lang-variant],.lesson-run-card,.evergreen-example,.project-card'))return;
  pre.dataset.csaiSafeOutput='1';
  var wrap=document.createElement('div');wrap.className='csai-safe-output-tools';
  wrap.innerHTML='<button type="button" class="csai-safe-output-btn">▶ Simulate / validate</button><pre class="csai-safe-output-result">Ready for safe '+esc(type)+' validation.</pre>';
  pre.insertAdjacentElement('afterend',wrap);
  wrap.querySelector('button').addEventListener('click',function(){wrap.querySelector('pre').innerHTML=simulation(type,code);});
}
function addStyle(){
  if(document.getElementById('csai-safe-output-style'))return;
  var s=document.createElement('style');s.id='csai-safe-output-style';s.textContent=`
.csai-safe-output-tools{border:1px solid var(--border);border-top:0;border-radius:0 0 10px 10px;overflow:hidden;background:var(--panel);margin-top:-1px;margin-bottom:12px}.csai-safe-output-btn{margin:9px;border:1px solid #17649a;border-radius:8px;background:#17649a;color:#fff;padding:7px 10px;font-weight:800;cursor:pointer}.csai-safe-output-result{margin:0;border:0!important;border-top:1px solid var(--border)!important;border-radius:0!important;white-space:pre-wrap;min-height:54px;padding:10px 12px;background:var(--bg)!important;color:var(--text)!important}.csai-safe-output-result .ok{color:#16805b;font-weight:850}
`;
  document.head.appendChild(s);
}
function scan(){addStyle();document.querySelectorAll('pre.code').forEach(enhancePre);}

document.addEventListener('click',function(event){
  var button=event.target.closest&&event.target.closest('[data-run-language-example],[data-evergreen-run],[data-evergreen-walk],[data-project-run]');
  if(button)intercept(button,event);
},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});else scan();
setTimeout(scan,350);setTimeout(scan,1000);
new MutationObserver(function(records){if(records.some(function(r){return r.addedNodes&&r.addedNodes.length;}))setTimeout(scan,40);}).observe(document.documentElement,{childList:true,subtree:true});
})();
