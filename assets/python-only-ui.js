(function(){
'use strict';
var busy=false;
function cleanText(text){return String(text||'')
 .replace(/Python\s*(?:&|\+)\s*C\+\+/gi,'Python and C++')
 .replace(/Python\s*\/\s*C\+\+/gi,'Python and C++')
 .replace(/C\s*\/\s*C\+\+/gi,'C++')
 .replace(/\bboth languages\b/gi,'both supported languages')
 .replace(/\bDual\b/g,'Language');}
function within(root,selector){root=root||document;var nodes=[];if(root.nodeType===1&&root.matches&&root.matches(selector))nodes.push(root);if(root.querySelectorAll)nodes=nodes.concat(Array.from(root.querySelectorAll(selector)));return nodes;}
function isCppCourse(){var n=document.getElementById('course-page-meta');try{return !!(n&&JSON.parse(n.textContent||'{}').id==='cpp-dsa')}catch(e){return /cpp-dsa\.html$/i.test(location.pathname)}}
function removeLanguageControls(root){if(isCppCourse())return;
 within(root,'[data-lang-mode="cpp"],[data-lang-mode="dual"],[data-adaptive-mode="cpp"],[data-adaptive-mode="dual"],[data-csai-oa-cpp-run],[data-dual-cpp-pane],[data-cpp-loop-panel],.cpp-companion,.csai-cpp-note').forEach(function(node){node.remove();});
 within(root,'option').forEach(function(opt){var value=String(opt.value||'').toLowerCase();if(value==='cpp'||value==='c++'||value==='dual')opt.remove();});
 within(root,'select[data-project-lang],[data-lang]').forEach(function(sel){var value=String(sel.value||'').toLowerCase();if(value==='cpp'||value==='c++'||value==='dual'){var py=Array.from(sel.options).find(function(o){return String(o.value).toLowerCase()==='python';});if(py){sel.value=py.value;sel.dispatchEvent(new Event('change',{bubbles:true}));}}});
 within(root,'.course-lang-mode').forEach(function(box){var buttons=box.querySelectorAll('.lang-mode-btn');if(buttons.length<=1)box.remove();});
}
function cleanAttributes(root){if(isCppCourse())return;
 within(root,'[data-csai-active-language]').forEach(function(n){n.setAttribute('data-csai-active-language','python');});
 within(root,'[data-project-file],[data-file-label],.project-file').forEach(function(n){n.textContent=cleanText(n.textContent).replace(/\.cpp\b/gi,'.py');});
}
function cleanTextNodes(root){
 var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){var p=node.parentElement;if(!p||/^(SCRIPT|STYLE|TEXTAREA|CODE|PRE)$/.test(p.tagName))return NodeFilter.FILTER_REJECT;return /Python\s*(?:&|\+|\/)\s*C\+\+|\bDual\b|both languages/i.test(node.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}}),nodes=[],n;while((n=walker.nextNode()))nodes.push(n);nodes.forEach(function(node){node.nodeValue=cleanText(node.nodeValue);});
}
function cleanCodeEditors(root){if(isCppCourse())return;
 within(root,'textarea').forEach(function(area){var value=String(area.value||area.textContent||'');if(/#include\s*[<"]|\bstd::|\bcout\s*<<|\bcin\s*>>|\busing\s+namespace\s+std\b/.test(value)){var title=area.closest('[data-title]')&&area.closest('[data-title]').getAttribute('data-title')||'Python exercise';var py='# '+title+'\n# Write your Python solution here.\n\nprint("Start your solution")\n';area.value=py;area.textContent=py;}});
}
function apply(root){if(busy)return;busy=true;root=root||document;try{removeLanguageControls(root);cleanAttributes(root);cleanTextNodes(root);cleanCodeEditors(root);document.documentElement.setAttribute('data-csai-language',isCppCourse()?'cpp-course':'python-primary');}finally{busy=false;}}
function boot(){apply(document);var pending=new Set(),timer=0;var observer=new MutationObserver(function(records){records.forEach(function(r){if(r.type==='characterData'){if(r.target&&r.target.parentElement)pending.add(r.target.parentElement);return;}Array.from(r.addedNodes||[]).forEach(function(n){if(!n)return;if(n.nodeType===1)pending.add(n);else if(n.parentElement)pending.add(n.parentElement);});});if(!pending.size)return;clearTimeout(timer);timer=setTimeout(function(){var batch=Array.from(pending);pending.clear();batch.forEach(apply);},60);});observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
