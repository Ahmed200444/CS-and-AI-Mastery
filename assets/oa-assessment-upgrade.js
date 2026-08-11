(function(){
'use strict';

var assessmentNode=document.getElementById('csai-assessment-data');
var projectNode=document.getElementById('csai-project-data');
if(!assessmentNode&&!projectNode)return;
var A={},P={};
try{if(assessmentNode)A=JSON.parse(assessmentNode.textContent||'{}')}catch(e){console.error('[OA upgrade] assessment data',e)}
try{if(projectNode)P=JSON.parse(projectNode.textContent||'{}')}catch(e){console.error('[OA upgrade] project data',e)}
var courseId=String(A.courseId||P.courseId||location.pathname.split('/').pop()||'course').replace(/\.html$/,'');
var exercises=Array.isArray(A.exercises)?A.exercises:[];
var structured=A.structured||{};
var projects=Array.isArray(P.projects)?P.projects:[];
var STORE='csai-oa-practice-v1:'+courseId;
var state=load();

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function arr(v){return Array.isArray(v)?v:[]}
function load(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch(e){return{}}}
function save(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch(e){}}
function exKey(item,i){return item&&item.id?String(item.id):'exercises-'+i}
function difficulty(item){var n=Number(item&&item.difficulty||item&&item.level||1);return n>=3?'Hard':n===2?'Medium':'Easy'}
function weight(item){var d=difficulty(item);return d==='Hard'?1.5:d==='Medium'?1.2:1}
function taskState(key){state.exercises=state.exercises||{};return state.exercises[key]||(state.exercises[key]={results:[],kind:'pending',submitted:false})}
function projectState(key){state.projects=state.projects||{};return state.projects[key]||(state.projects[key]={levels:{}})}
function projectKey(p,i){return String(p&&p.id||p&&p.title||('project-'+i)).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function countPyTests(text){
 text=String(text||'').trim();if(!text||text[0]!=='[')return 0;
 var depth=0,quote='',escape=false,count=0,seen=false;
 for(var i=1;i<text.length-1;i++){
  var c=text[i];
  if(quote){if(escape){escape=false;continue}if(c==='\\'){escape=true;continue}if(c===quote)quote='';continue}
  if(c==='"'||c==="'"){quote=c;continue}
  if(c==='['||c==='('||c==='{'){depth++;if(depth===1&&!seen){count++;seen=true}continue}
  if(c===']'||c===')'||c==='}'){if(depth>0)depth--;continue}
  if(c===','&&depth===0)seen=false;
  if(!/\s/.test(c)&&depth===0&&!seen){count++;seen=true}
 }
 return count;
}
function structuredCount(cfg){return Math.max(0,countPyTests(cfg&&cfg.tests_py))}
function taskIndex(task){return Array.prototype.indexOf.call(document.querySelectorAll('.oa-task'),task)}
function itemFor(task){var i=taskIndex(task);return exercises[i]||{}}
function cfgFor(task){var i=taskIndex(task),item=exercises[i]||{},key=exKey(item,i);return structured[key]||null}
function codeText(task){var ed=task.querySelector('[data-editor]');return String(ed&&ed.value||'').trim()}
function outputText(task){var out=task.querySelector('[data-output]');return String(out&&out.textContent||'').trim()}
function solved(task){var n=task.querySelector('[data-solved]');return !!(n&&/solved|complete/i.test(n.textContent||''))}
function placeholder(code){return !code||/write your (solution|answer)|build your project here|\bTODO\b|\bpass\s*$/im.test(code)}
function lines(code){return String(code||'').split(/\r?\n/).filter(function(x){return x.trim()}).length}
function hasBranch(code){return /\b(if|else|elif|switch|case|try|catch|except|throw|assert)\b/.test(code)}
function meaningfulOutput(text){return !!text&&!/^(ready\.|reset\.|running|compiling|loading)/i.test(text)&&!/no output/i.test(text)}
function actualStructured(task){
 var rows=Array.prototype.slice.call(task.querySelectorAll('[data-output] .oa-tests .oa-test'));
 if(!rows.length)return null;
 return rows.map(function(row){var pass=!!row.querySelector('.ok'),fail=!!row.querySelector('.bad');return pass?true:fail?false:null});
}
function genericChecks(task,item){
 var code=codeText(task),out=outputText(task),isResponse=!!task.querySelector('.oa-answer');
 if(isResponse){
  var words=code.split(/\s+/).filter(Boolean).length,title=String(item.title||item.prompt||'').toLowerCase(),tokens=title.split(/[^a-z0-9]+/).filter(function(x){return x.length>4}).slice(0,5),lower=code.toLowerCase();
  return[
   {name:'Response provided',pass:words>=3},
   {name:'Substantive explanation',pass:words>=25},
   {name:'Course concept addressed',pass:!tokens.length||tokens.some(function(t){return lower.indexOf(t)>=0})},
   {name:'Reasoning / evidence included',pass:words>=45||/because|therefore|example|trade.?off|reason/i.test(code)},
   {name:'Submission completed',pass:solved(task)}
  ];
 }
 var ok=!!task.querySelector('[data-output] .ok')&&!task.querySelector('[data-output] .bad');
 return[
  {name:'Solution is not starter/placeholder',pass:!placeholder(code)&&lines(code)>=2},
  {name:'Executes without a runtime error',pass:ok},
  {name:'Produces a result / valid output',pass:ok&&meaningfulOutput(out)},
  {name:'Boundary / control logic evidence',pass:hasBranch(code)||lines(code)>=8},
  {name:'Submission completed',pass:solved(task)}
 ];
}
function storeTask(task){
 var i=taskIndex(task),item=exercises[i]||{},key=exKey(item,i),cfg=structured[key]||null,ts=taskState(key),actual=actualStructured(task);
 if(actual){ts.kind='unit';ts.results=actual;ts.total=Math.max(actual.length,structuredCount(cfg));}
 else{var checks=genericChecks(task,item);ts.kind=task.querySelector('.oa-answer')?'response':'validation';ts.results=checks.map(function(x){return x.pass});ts.names=checks.map(function(x){return x.name});ts.total=checks.length;}
 ts.submitted=solved(task);save();return ts;
}
function suiteRows(task,item,cfg,ts){
 var actual=actualStructured(task),total=actual?actual.length:(ts.total||structuredCount(cfg)||5),hidden=cfg?Math.max(1,Math.floor(total*.4)):0,names=ts.names||[];
 return Array.from({length:total},function(_,j){
  var value=ts.results&&j<ts.results.length?ts.results[j]:null,isHidden=!!cfg&&j>=total-hidden,name=cfg?('Test '+(j+1)+(isHidden?' · hidden':' · visible')):(names[j]||('Validation '+(j+1))),cls=value===true?'pass':value===false?'fail':'pending',icon=value===true?'✓':value===false?'×':'•';
  return '<div class="csai-oa-test '+cls+(isHidden?' hidden':'')+'"><i>'+icon+'</i><span class="csai-oa-test-name">'+esc(name)+'</span><small>'+(cfg?(isHidden?'Hidden':'Visible'):'Validation')+'</small></div>';
 }).join('');
}
function updateTask(task){
 if(!task)return;var i=taskIndex(task),item=exercises[i]||{},key=exKey(item,i),cfg=structured[key]||null,ts=storeTask(task),suite=task.querySelector('[data-csai-oa-suite]'),summary=task.querySelector('[data-csai-oa-summary]');
 if(suite){var box=suite.querySelector('.csai-oa-tests');if(box)box.innerHTML=suiteRows(task,item,cfg,ts);var note=suite.querySelector('.csai-oa-suite-note');if(note)note.textContent=cfg?'These pass/fail results come from the real browser unit-test harness. Some cases are intentionally labeled hidden.':'This exercise does not expose a deterministic unit-test contract, so these are transparent validation checks rather than fake hidden correctness tests.';}
 var total=Number(ts.total||5),passed=arr(ts.results).filter(function(x){return x===true}).length;if(summary){summary.textContent=passed+' / '+total+' checks';summary.dataset.state=passed===total&&total?'pass':passed?'partial':'pending'}
 updateDashboard();
}
function upgradeTask(task){
 if(!task||task.dataset.csaiOaUpgraded==='1')return;task.dataset.csaiOaUpgraded='1';var i=taskIndex(task),item=exercises[i]||{},key=exKey(item,i),cfg=structured[key]||null,top=task.querySelector('.oa-task-top');
 if(top){var s=document.createElement('span');s.className='csai-oa-test-summary';s.setAttribute('data-csai-oa-summary','1');s.textContent='0 / '+(structuredCount(cfg)||5)+' checks';top.appendChild(s)}
 var work=task.querySelector('.oa-work');if(work){var suite=document.createElement('div');suite.className='csai-oa-suite';suite.setAttribute('data-csai-oa-suite','1');suite.innerHTML='<div class="csai-oa-suite-head"><span class="csai-oa-suite-title">'+(cfg?'Assessment test cases':'Assessment validation checks')+'</span><span>'+(cfg?'Visible + hidden':'Transparent checks')+'</span></div><div class="csai-oa-tests"></div><div class="csai-oa-suite-note"></div>';work.appendChild(suite)}
 var out=task.querySelector('[data-output]');if(out)new MutationObserver(function(){updateTask(task)}).observe(out,{subtree:true,childList:true,characterData:true});
 task.addEventListener('input',function(){setTimeout(function(){updateTask(task)},0)});task.addEventListener('click',function(){setTimeout(function(){updateTask(task)},40);setTimeout(function(){updateTask(task)},900)},true);updateTask(task);
}
function dashboardHost(){var section=document.querySelector('.assessment-section');if(!section)return null;var stack=section.querySelector('.assessment-stack');return stack&&stack.parentNode?{section:section,before:stack}:null}
function scoreData(){
 var earned=0,max=0,passed=0,total=0,submitted=0,tasks=document.querySelectorAll('.oa-task');
 Array.prototype.forEach.call(tasks,function(task){var i=taskIndex(task),item=exercises[i]||{},key=exKey(item,i),ts=state.exercises&&state.exercises[key]||{},w=weight(item),rs=arr(ts.results),n=Number(ts.total||rs.length||0),p=rs.filter(function(x){return x===true}).length;if(n){earned+=p*w;max+=n*w;passed+=p;total+=n}if(ts.submitted)submitted++});
 var score=max?Math.max(200,Math.min(600,Math.round(200+400*(earned/max)))):null;return{score:score,passed:passed,total:total,submitted:submitted,count:tasks.length};
}
function ensureDashboard(){var h=dashboardHost();if(!h||h.section.querySelector('[data-csai-oa-dashboard]'))return;var d=document.createElement('div');d.className='csai-oa-dashboard';d.setAttribute('data-csai-oa-dashboard','1');d.innerHTML='<div class="csai-oa-dashboard-main"><div class="csai-oa-kicker">Internship assessment practice</div><h3>Course Exercises · OA Mode</h3><p>Lessons stay educational and unscored. This section measures your independent exercise performance after learning.</p></div><div class="csai-oa-metric"><strong class="csai-oa-score" data-oa-score>— / 600</strong><small>OA Practice Score</small></div><div class="csai-oa-metric"><strong data-oa-tests>0 / 0</strong><small>Checks passed</small></div><div class="csai-oa-metric"><strong data-oa-submit>0 / 0</strong><small>Exercises submitted</small></div><div class="csai-oa-disclaimer">Training metric only — this is not an official CodeSignal score and does not reproduce CodeSignal's private scoring formula. Real unit-test results are shown only when the exercise has a machine-checkable test contract.</div>';h.section.insertBefore(d,h.before)}
function updateDashboard(){ensureDashboard();var d=document.querySelector('[data-csai-oa-dashboard]');if(!d)return;var s=scoreData(),a=d.querySelector('[data-oa-score]'),b=d.querySelector('[data-oa-tests]'),c=d.querySelector('[data-oa-submit]');if(a)a.textContent=(s.score==null?'—':s.score)+' / 600';if(b)b.textContent=s.passed+' / '+s.total;if(c)c.textContent=s.submitted+' / '+s.count}

function requirementSignals(code,p){var req=arr(p&&p.requirements),lower=String(code||'').toLowerCase(),matched=0;req.forEach(function(r){var words=String(r).toLowerCase().split(/[^a-z0-9]+/).filter(function(x){return x.length>4});if(words.some(function(w){return lower.indexOf(w)>=0}))matched++});return{matched:matched,total:req.length}}
function projectChecks(card,p,level){
 var ed=card.querySelector('[data-project-editor]'),code=String(ed&&ed.value||'').trim(),out=String(card.querySelector('[data-project-output]')&&card.querySelector('[data-project-output]').textContent||''),runtime=!/error|failed|invalid/i.test(out)&&meaningfulOutput(out),signals=requirementSignals(code,p),nonPlaceholder=!placeholder(code)&&lines(code)>=4;
 if(level===0)return[{n:'Starter replaced',p:nonPlaceholder},{n:'Substantial implementation',p:lines(code)>=6},{n:'Run / check succeeds',p:runtime}];
 if(level===1)return[{n:'Core still passes',p:nonPlaceholder&&runtime},{n:'Requirement evidence',p:signals.total===0?lines(code)>=10:signals.matched>=Math.max(1,Math.ceil(signals.total*.4))},{n:'Feature-sized implementation',p:lines(code)>=10}];
 if(level===2)return[{n:'Edge/control logic',p:hasBranch(code)},{n:'Error/test evidence',p:/\b(assert|test|try|catch|except|throw|validate|error|fault)\b/i.test(code)},{n:'Run / check succeeds',p:runtime},{n:'No TODO placeholders',p:!placeholder(code)}];
 return[{n:'Requirements represented',p:signals.total===0?lines(code)>=14:signals.matched>=Math.max(1,Math.ceil(signals.total*.6))},{n:'Non-trivial implementation',p:lines(code)>=14},{n:'Robustness evidence',p:hasBranch(code)||/\b(assert|test|validate|error|fault)\b/i.test(code)},{n:'Clean final run',p:runtime}];
}
function levelTitle(i){return['Core implementation','Feature coverage','Edge cases & robustness','Portfolio readiness'][i]}
function levelDesc(i){return['Get the essential project behavior working.','Cover more of the written project requirements.','Show defensive logic, tests, or failure handling.','Reach a stronger recruiter-facing implementation state.'][i]}
function runProjectLevel(card,pi,li){var p=projects[pi]||{},key=projectKey(p,pi),ps=projectState(key),checks=projectChecks(card,p,li);ps.levels[li]={results:checks.map(function(x){return x.p}),names:checks.map(function(x){return x.n}),at:Date.now()};save();renderProjectLevels(card,p,pi)}
function renderProjectLevels(card,p,pi){
 var key=projectKey(p,pi),ps=projectState(key),host=card.querySelector('[data-csai-project-levels]');if(!host)return;var totalPass=0,totalChecks=0;
 var levelHtml=Array.from({length:4},function(_,li){var saved=ps.levels[li]||{},live=saved.results&&saved.results.length?saved:{results:[],names:[]},pcount=arr(live.results).filter(function(x){return x===true}).length,total=arr(live.results).length;totalPass+=pcount;totalChecks+=total;var stateClass=total&&pcount===total?'pass':pcount?'partial':'',stateText=total?(pcount+' / '+total+' passed'):'Not checked';var checks=arr(live.names).map(function(n,j){return'<span class="csai-project-check '+(live.results[j]?'pass':'fail')+'">'+(live.results[j]?'✓ ':'× ')+esc(n)+'</span>'}).join('');return '<div class="csai-project-level '+(li===0?'open':'')+'" data-csai-project-level="'+li+'"><div class="csai-project-level-top"><span class="csai-project-level-num">'+(li+1)+'</span><span class="csai-project-level-copy"><b>'+esc(levelTitle(li))+'</b><small>'+esc(levelDesc(li))+'</small></span><span class="csai-project-level-state '+stateClass+'">'+stateText+'</span></div><div class="csai-project-level-body"><div class="csai-project-checks">'+(checks||'<span class="csai-project-check">Run this level to evaluate measurable checks.</span>')+'</div><button type="button" class="csai-project-check-btn" data-csai-project-run-level="'+li+'">▶ Run level checks</button></div></div>'}).join('');
 host.innerHTML='<div class="csai-project-levels-head"><b>Progressive project assessment</b><span>4 levels · real browser-safe checks</span></div>'+levelHtml+'<div class="csai-project-progress"><span style="width:'+(totalChecks?Math.round(totalPass/totalChecks*100):0)+'%"></span></div><div class="csai-project-progress-label"><span>Measured project checks</span><span>'+totalPass+' / '+totalChecks+'</span></div>';
}
function upgradeProject(card){
 if(!card||card.dataset.csaiProjectOa==='1')return;card.dataset.csaiProjectOa='1';var pi=Array.prototype.indexOf.call(document.querySelectorAll('.project-card'),card),p=projects[pi]||{},head=card.querySelector('.project-head'),host=document.createElement('div');host.className='csai-project-levels';host.setAttribute('data-csai-project-levels','1');if(head&&head.parentNode)head.parentNode.insertBefore(host,head.nextSibling);else card.insertBefore(host,card.firstChild);host.addEventListener('click',function(e){var top=e.target.closest('.csai-project-level-top');if(top){var level=top.closest('.csai-project-level');if(level)level.classList.toggle('open');return}var btn=e.target.closest('[data-csai-project-run-level]');if(btn){e.preventDefault();e.stopPropagation();runProjectLevel(card,pi,Number(btn.getAttribute('data-csai-project-run-level')))}});renderProjectLevels(card,p,pi);
}
function boot(){ensureDashboard();Array.prototype.forEach.call(document.querySelectorAll('.oa-task'),upgradeTask);Array.prototype.forEach.call(document.querySelectorAll('.project-card'),upgradeProject);updateDashboard()}
var timer=0;new MutationObserver(function(records){var relevant=false;for(var i=0;i<records.length;i++){if(records[i].addedNodes&&records[i].addedNodes.length){relevant=true;break}}if(!relevant)return;clearTimeout(timer);timer=setTimeout(boot,60)}).observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,0)},{once:true});else setTimeout(boot,0);
})();
