(function(){
'use strict';
var busy=false;
function cleanText(text){return String(text||'')
 .replace(/Python\s*(?:&|\+)\s*C\+\+/gi,'Python')
 .replace(/Python\s*\/\s*C\+\+/gi,'Python')
 .replace(/C\s*\/\s*C\+\+/gi,'Python')
 .replace(/C\+\+/g,'Python')
 .replace(/\bboth languages\b/gi,'Python')
 .replace(/\bDual\b/g,'Python');}
function removeLanguageControls(root){
 root.querySelectorAll('[data-lang-mode="cpp"],[data-lang-mode="dual"],[data-adaptive-mode="cpp"],[data-adaptive-mode="dual"],[data-csai-oa-cpp-run],[data-dual-cpp-pane],[data-cpp-loop-panel],.cpp-companion,.csai-cpp-note').forEach(function(node){node.remove();});
 root.querySelectorAll('option').forEach(function(opt){var value=String(opt.value||'').toLowerCase();if(value==='cpp'||value==='c++'||value==='dual')opt.remove();});
 root.querySelectorAll('select[data-project-lang],[data-lang]').forEach(function(sel){var value=String(sel.value||'').toLowerCase();if(value==='cpp'||value==='c++'||value==='dual'){var py=Array.from(sel.options).find(function(o){return String(o.value).toLowerCase()==='python';});if(py){sel.value=py.value;sel.dispatchEvent(new Event('change',{bubbles:true}));}}});
 root.querySelectorAll('.course-lang-mode').forEach(function(box){var buttons=box.querySelectorAll('.lang-mode-btn');if(buttons.length<=1)box.remove();});
}
function cleanAttributes(root){
 root.querySelectorAll('[data-csai-active-language]').forEach(function(n){n.setAttribute('data-csai-active-language','python');});
 root.querySelectorAll('[data-project-file],[data-file-label],.project-file').forEach(function(n){n.textContent=cleanText(n.textContent).replace(/\.cpp\b/gi,'.py');});
}
function cleanTextNodes(root){
 var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){var p=node.parentElement;if(!p||/^(SCRIPT|STYLE|TEXTAREA|CODE|PRE)$/.test(p.tagName))return NodeFilter.FILTER_REJECT;return /C\+\+|Python\s*(?:&|\+|\/)\s*C\+\+|\bDual\b|both languages/i.test(node.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}}),nodes=[],n;while((n=walker.nextNode()))nodes.push(n);nodes.forEach(function(node){node.nodeValue=cleanText(node.nodeValue);});
}
function cleanCodeEditors(root){
 root.querySelectorAll('textarea').forEach(function(area){var value=String(area.value||area.textContent||'');if(/#include\s*[<"]|\bstd::|\bcout\s*<<|\bcin\s*>>|\busing\s+namespace\s+std\b/.test(value)){var title=area.closest('[data-title]')&&area.closest('[data-title]').getAttribute('data-title')||'Python exercise';var py='# '+title+'\n# Write your Python solution here.\n\nprint("Start your solution")\n';area.value=py;area.textContent=py;}});
}
function apply(){if(busy)return;busy=true;try{removeLanguageControls(document);cleanAttributes(document);cleanTextNodes(document);cleanCodeEditors(document);document.documentElement.setAttribute('data-csai-language','python-only');}finally{busy=false;}}
function boot(){apply();var observer=new MutationObserver(function(){clearTimeout(boot.t);boot.t=setTimeout(apply,20);});observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
