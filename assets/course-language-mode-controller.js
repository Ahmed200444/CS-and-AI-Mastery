(function(){
'use strict';

var MODE_PREFIX='csai-course-language-v2:';
var FLEXIBLE_IDS=['dsa','problem-solving','oop','algorithms','data-structures'];
var applyTimer=0;

function meta(){try{var n=document.getElementById('course-page-meta');return n?JSON.parse(n.textContent||'{}'):{};}catch(e){return{};}}
function courseId(){var m=meta();return String(m.id||location.pathname.split('/').pop()||'').replace(/\.html$/,'').toLowerCase();}
function courseTitle(){var m=meta(),h=document.querySelector('.hero h1');return String(m.title||(h&&h.textContent)||'').toLowerCase();}
function flexible(){var id=courseId(),title=courseTitle(),all=id+' '+title;if(/python|javascript|typescript|sql|html|css|react|node|java\b|c\+\+/.test(all))return false;return FLEXIBLE_IDS.some(function(x){return id===x||id.indexOf(x)>=0;})||/data structures|algorithms|problem solving|object[ -]oriented/.test(title);}
function modeKey(){return MODE_PREFIX+courseId();}
function mode(){try{var m=localStorage.getItem(modeKey());return m==='cpp'||m==='dual'||m==='python'?m:'python';}catch(e){return'python';}}
function saveMode(m){if(m!=='python'&&m!=='cpp'&&m!=='dual')return;try{localStorage.setItem(modeKey(),m);}catch(e){}}
function slug(v){return String(v||'exercise').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'exercise';}
function taskKey(task){return String(task.getAttribute('data-task')||slug(task.getAttribute('data-title')||'exercise'));}
function draftKey(task,lang){return'csai-language-draft-v3:'+courseId()+':'+taskKey(task)+':'+lang;}
function getDraft(task,lang){try{return localStorage.getItem(draftKey(task,lang))||'';}catch(e){return'';}}
function setDraft(task,lang,code){try{localStorage.setItem(draftKey(task,lang),String(code||''));}catch(e){}}
function editor(task){return task.querySelector('textarea[data-editor]:not(.oa-answer)');}
function looksCpp(code){code=String(code||'');return /#include\s*[<"]|\bstd::|\bcout\s*<<|\bcin\s*>>|\bvector\s*</.test(code)||/\bint\s+main\s*\(/.test(code);}
function looksPython(code){code=String(code||'');return /(^|\n)\s*(def\s+|class\s+|from\s+|import\s+|for\s+\w+\s+in\s+|while\s+.+:|if\s+.+:|elif\s+.+:|print\s*\()/.test(code)||/\brange\s*\(|\blen\s*\(/.test(code);}
function infer(code,fallback){if(looksCpp(code)&&!looksPython(code))return'cpp';if(looksPython(code)&&!looksCpp(code))return'python';return fallback==='cpp'?'cpp':'python';}
function cppStarter(task){var title=String(task.getAttribute('data-title')||'Exercise').replace(/\s+/g,' ').trim();return '#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\n// '+title+'\nint main() {\n    // Write your C++ solution here.\n\n    return 0;\n}\n';}
function pythonStarter(){return'# Write your Python solution here\n';}
function currentEditorLanguage(task,code){var tagged=task.getAttribute('data-csai-editor-language');return infer(code,tagged||'python');}
function ensureCppOption(select){if(!select)return;if(!Array.from(select.options).some(function(o){return String(o.value).toLowerCase()==='cpp'||String(o.value).toLowerCase()==='c++';})){var o=document.createElement('option');o.value='cpp';o.textContent='C++';select.appendChild(o);}}
function setSelect(task,lang){var select=task.querySelector('[data-lang]');if(!select)return;ensureCppOption(select);select.value=lang==='cpp'?'cpp':'python';}
function setFileLabel(task,m,activeLang){var label=task.querySelector('[data-file-label]');if(!label)return;var base=slug(task.getAttribute('data-title')||'exercise'),next=m==='dual'?base+'.py / '+base+'.cpp':base+(activeLang==='cpp'?'.cpp':'.py');if(label.textContent!==next)label.textContent=next;}
function removeSecondEditor(task){task.querySelectorAll('[data-dual-cpp-pane],[data-dual-cpp-editor]').forEach(function(n){n.remove();});}
function loadLanguage(task,lang){var ed=editor(task);if(!ed)return;var current=String(ed.value||''),before=currentEditorLanguage(task,current);if(current)setDraft(task,before,current);var saved=getDraft(task,lang);if(!saved){if(before===lang&&current)saved=current;else saved=lang==='cpp'?cppStarter(task):pythonStarter();}if(ed.value!==saved)ed.value=saved;task.setAttribute('data-csai-editor-language',lang);setDraft(task,lang,saved);}
function applyTask(task,m){var ed=editor(task);if(!ed)return;removeSecondEditor(task);var before=currentEditorLanguage(task,String(ed.value||''));if(m==='python'||m==='cpp')loadLanguage(task,m);else{if(ed.value)setDraft(task,before,ed.value);task.setAttribute('data-csai-editor-language',before);}task.setAttribute('data-csai-active-language',m);if(m!=='dual')setSelect(task,m);setFileLabel(task,m,m==='dual'?before:m);var out=task.querySelector('[data-output]'),next=m==='cpp'?'C++ workspace ready.':m==='dual'?'Dual mode: one editor; choose the Python or C++ publish button.':'Ready.';if(out&&/workspace ready|^Ready\.$|^Dual mode:/.test(out.textContent||'')&&out.textContent!==next)out.textContent=next;}
function activeButtons(m){document.querySelectorAll('[data-lang-mode]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-lang-mode')===m);});}
function applyAll(){if(!flexible())return;var m=mode();document.querySelectorAll('.assessment-stack .oa-task').forEach(function(task){applyTask(task,m);});activeButtons(m);window.dispatchEvent(new CustomEvent('csai-language-controller-applied',{detail:{mode:m,courseId:courseId()}}));}
function queue(){clearTimeout(applyTimer);applyTimer=setTimeout(applyAll,30);}

if(!document.getElementById('course-page-meta')||!flexible())return;

document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-lang-mode]');if(!b)return;var m=b.getAttribute('data-lang-mode');saveMode(m);setTimeout(applyAll,0);setTimeout(applyAll,80);setTimeout(applyAll,350);},true);
document.addEventListener('input',function(e){if(!e.target.matches||!e.target.matches('textarea[data-editor]:not(.oa-answer)'))return;var task=e.target.closest('.oa-task');if(!task)return;var m=mode(),lang=m==='dual'?infer(e.target.value,task.getAttribute('data-csai-editor-language')||'python'):m;task.setAttribute('data-csai-editor-language',lang);setDraft(task,lang,e.target.value);},true);
window.addEventListener('csai-language-mode-change',function(){setTimeout(applyAll,0);setTimeout(applyAll,100);});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){applyAll();setTimeout(applyAll,180);setTimeout(applyAll,700);},{once:true});else{applyAll();setTimeout(applyAll,180);setTimeout(applyAll,700);}
var observer=new MutationObserver(function(records){if(records.some(function(r){return r.addedNodes&&r.addedNodes.length;}))queue();});
observer.observe(document.documentElement,{childList:true,subtree:true});
})();
