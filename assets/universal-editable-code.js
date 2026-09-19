(function(){
'use strict';
if(window.CSAIEditableCode)return;

var originals=new WeakMap(), toolbars=new WeakMap(), indentGuard=new WeakSet();
var COMMENTABLE_LANGS=new Set(['python','javascript','typescript','cpp','c','java','sql','html','css','shell','yaml']);
var INDENT_UNIT='    ';
var PRE_FALLBACK=[
 '.lesson pre.code',
 '.lesson [data-csai-language-generated]',
 '.lesson .csai-language-code',
 '.lesson .csai-study-example pre',
 '.lesson .evergreen-example pre.code',
 '.lesson .adaptive-panel pre.code',
 'pre[data-example-audit="candidate"]'
].join(',');

function addStyle(){
 if(document.getElementById('csai-universal-editable-style'))return;
 var s=document.createElement('style');
 s.id='csai-universal-editable-style';
 s.textContent=`
 [data-csai-editable-code="1"]{cursor:text;outline:none;caret-color:#fff;transition:border-color .12s ease,box-shadow .12s ease,background .12s ease}
 [data-csai-editable-code="1"]:focus{box-shadow:inset 0 0 0 1px rgba(64,170,255,.72),0 0 0 2px rgba(64,170,255,.10);background-color:#0b121d!important}
 .csai-editable-codebar{display:flex;align-items:center;justify-content:flex-end;gap:7px;padding:6px 9px;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--panel) 94%,var(--bg));font:700 11px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
 .csai-editable-badge{margin-right:auto;color:var(--muted);font-weight:800}.csai-editable-badge:before{content:"✎";margin-right:5px;color:#64b5f6}[data-csai-inline-comments="1"]{tab-size:4}
 .csai-editable-reset{border:1px solid var(--border);border-radius:7px;background:transparent;color:var(--text);padding:5px 8px;font:800 11px/1.2 inherit;cursor:pointer}.csai-editable-reset:hover{background:var(--pill)}
 textarea[data-csai-editable-code="1"]{resize:vertical}
 `;
 document.head.appendChild(s);
}
function setCode(node,value){
 if(!node)return;
 if('value' in node)node.value=value;
 else node.textContent=value;
 node.dispatchEvent(new Event('input',{bubbles:true}));
}
function isOutput(node){
 if(!node||!node.matches)return true;
 return node.matches('[data-study-output],[data-project-output],[data-output],[data-adaptive-output],[data-csai-example-output],[data-example-output],.run-output,.output,.csai-example-output,.lesson-run-output,.csai-simulation-output');
}
function isCodeNode(node){
 if(!node||!node.matches||isOutput(node))return false;
 if(node.getAttribute&&node.getAttribute('data-reference-only')==='true')return false;
 if(window.CSAILineExplainer&&typeof window.CSAILineExplainer.isCodeWorkspace==='function'){
   try{if(window.CSAILineExplainer.isCodeWorkspace(node))return true;}catch(_){}
 }
 if(node.matches('textarea[data-project-editor],textarea[data-dual-editor],textarea.csai-code-editor,textarea.csai-study-code,textarea.adaptive-code,textarea.evergreen-editor,textarea.oa-editor,textarea[data-evergreen-code]'))return true;
 if(node.tagName==='PRE'&&node.matches(PRE_FALLBACK))return true;
 return false;
}
function codeText(node){return node&&('value' in node)?String(node.value||''):String(node&&node.textContent||'');}
function normalizeLang(v){v=String(v||'').toLowerCase();if(/^(c\+\+|cpp)$/.test(v))return'cpp';if(/^(py|python)$/.test(v))return'python';if(/^(js|javascript|node|nodejs)$/.test(v))return'javascript';if(/^(ts|typescript)$/.test(v))return'typescript';if(/^(html|htm)$/.test(v))return'html';if(v==='css')return'css';if(/^(sql|sqlite|postgres|postgresql|mysql)$/.test(v))return'sql';if(/^(yaml|yml)$/.test(v))return'yaml';return v;}
function languageFor(node){
 var explicit=String(node&&((node.dataset&&node.dataset.language)||node.getAttribute&&node.getAttribute('data-language'))||'');
 var wrap=node&&node.closest&&node.closest('[data-language],[data-adaptive-lang],[data-project]');
 if(!explicit&&wrap){explicit=String(wrap.getAttribute('data-language')||wrap.getAttribute('data-adaptive-lang')||'');var sel=wrap.querySelector&&wrap.querySelector('[data-project-lang]');if(!explicit&&sel)explicit=String(sel.value||'');}
 if(window.CSAILineExplainer&&typeof window.CSAILineExplainer.inferLanguage==='function'){try{explicit=window.CSAILineExplainer.inferLanguage(codeText(node),explicit,node)||explicit;}catch(_){}}
 return normalizeLang(explicit);
}
function explainedCode(raw,lang){
 if(!COMMENTABLE_LANGS.has(lang))return String(raw||'');
 var api=window.CSAILineExplainer;
 if(!api||typeof api.commentedCode!=='function')return String(raw||'');
 return api.commentedCode(String(raw||''),lang);
}
function applyInlineComments(node){
 if(!node||node.dataset.csaiInlineComments==='1')return false;
 var api=window.CSAILineExplainer;
 if(!api||typeof api.commentedCode!=='function')return false;
 var raw=originals.get(node);
 if(raw==null){raw=codeText(node);originals.set(node,raw);}
 var lang=languageFor(node);
 if(!COMMENTABLE_LANGS.has(lang))return false;
 var shown=explainedCode(raw,lang);
 if('value' in node)node.value=shown;else node.textContent=shown;
 node.dataset.csaiInlineComments='1';
 node.setAttribute('data-csai-inline-comments','1');
 return true;
}
function resetShownCode(node){
 var raw=originals.get(node);
 if(raw==null)return;
 node.dataset.csaiInlineComments='';
 node.removeAttribute('data-csai-inline-comments');
 var shown=explainedCode(raw,languageFor(node));
 if('value' in node)node.value=shown;else node.textContent=shown;
 if(shown!==raw){node.dataset.csaiInlineComments='1';node.setAttribute('data-csai-inline-comments','1');}
 node.dispatchEvent(new Event('input',{bubbles:true}));
}
function selectionOffsets(node){
 if(node&&'selectionStart' in node)return{start:node.selectionStart||0,end:node.selectionEnd||0};
 var sel=window.getSelection&&window.getSelection();if(!sel||!sel.rangeCount)return{start:codeText(node).length,end:codeText(node).length};
 try{var range=sel.getRangeAt(0),pre=range.cloneRange();pre.selectNodeContents(node);pre.setEnd(range.startContainer,range.startOffset);var start=pre.toString().length;var pre2=range.cloneRange();pre2.selectNodeContents(node);pre2.setEnd(range.endContainer,range.endOffset);return{start:start,end:pre2.toString().length};}catch(_){return{start:codeText(node).length,end:codeText(node).length};}
}
function setCaretOffset(node,pos){
 pos=Math.max(0,Math.min(codeText(node).length,pos));
 if(node&&'setSelectionRange' in node){node.setSelectionRange(pos,pos);return;}
 var sel=window.getSelection&&window.getSelection();if(!sel)return;var range=document.createRange(),left=pos,found=false;
 (function walk(n){if(found)return;for(var c=n.firstChild;c;c=c.nextSibling){if(c.nodeType===3){var len=c.nodeValue.length;if(left<=len){range.setStart(c,left);found=true;return}left-=len}else walk(c);if(found)return}})(node);
 if(!found){range.selectNodeContents(node);range.collapse(false)}else range.collapse(true);sel.removeAllRanges();sel.addRange(range);
}
function replaceRange(node,start,end,replacement,caret){
 var text=codeText(node),next=text.slice(0,start)+replacement+text.slice(end);indentGuard.add(node);
 if('value' in node)node.value=next;else node.textContent=next;
 setCaretOffset(node,caret==null?start+replacement.length:caret);
 node.dispatchEvent(new Event('input',{bubbles:true}));
 Promise.resolve().then(function(){indentGuard.delete(node)});
}
function lineBounds(text,pos){var start=text.lastIndexOf('\n',Math.max(0,pos-1))+1,end=text.indexOf('\n',pos);if(end<0)end=text.length;return{start:start,end:end};}
function isBraceLang(lang){return/^(cpp|c|java|javascript|typescript|css|csharp|go|rust|php|swift|kotlin)$/.test(lang);}
function htmlNeedsIndent(trim){if(!/^<[^!/?][^>]*>\s*$/.test(trim)||/\/\>\s*$/.test(trim))return false;var m=trim.match(/^<\s*([A-Za-z][\w:-]*)\b/);if(!m)return false;return !/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(m[1]);}
function computeEnterPlan(text,start,end,lang){
 text=String(text||'');start=Math.max(0,Math.min(text.length,start||0));end=Math.max(start,Math.min(text.length,end==null?start:end));lang=normalizeLang(lang);
 var b=lineBounds(text,start),before=text.slice(b.start,start),afterLine=text.slice(end,b.end),base=(before.match(/^[ \t]*/)||[''])[0],trim=before.trim(),next=base;
 var opener='',closer='';if(/[\{\[\(]\s*$/.test(trim)){opener=(trim.match(/([\{\[\(])\s*$/)||[])[1]||'';closer=opener==='{'?'}':opener==='['?']':opener==='('?')':'';}
 var opensBlock=(lang==='python'&&/:\s*$/.test(trim))||(isBraceLang(lang)&&/\{\s*$/.test(trim))||(lang==='html'&&htmlNeedsIndent(trim))||(lang==='yaml'&&/:\s*$/.test(trim)&&!/^\s*#/.test(trim))||(lang==='sql'&&/\b(?:begin|case)\s*$/i.test(trim));
 if(opener||opensBlock)next=base+INDENT_UNIT;
 if(opener&&closer&&String(afterLine||'').trimStart().startsWith(closer)){
   var first='\n'+next,second='\n'+base;return{insert:first+second,caret:start+first.length,indent:next,paired:true};
 }
 return{insert:'\n'+next,caret:start+1+next.length,indent:next,paired:false};
}
function dedentUnit(indent){if(indent.endsWith('\t'))return indent.slice(0,-1);if(indent.length>=INDENT_UNIT.length)return indent.slice(0,-INDENT_UNIT.length);return'';}
function handleAutoIndentKeydown(e){
 var raw=e.target;if(raw&&raw.nodeType===1&&isCodeNode(raw)&&raw.dataset.csaiEditableCode!=='1')enhanceNode(raw);
 var node=raw&&raw.closest&&raw.closest('[data-csai-editable-code="1"]');if(!node||indentGuard.has(node)||e.defaultPrevented||e.isComposing||e.ctrlKey||e.metaKey||e.altKey)return;
 var text=codeText(node),sel=selectionOffsets(node),lang=languageFor(node);
 if(e.key==='Enter'){
   e.preventDefault();var p=computeEnterPlan(text,sel.start,sel.end,lang);replaceRange(node,sel.start,sel.end,p.insert,p.caret);return;
 }
 if(sel.start!==sel.end)return;
 var b=lineBounds(text,sel.start),prefix=text.slice(b.start,sel.start),indent=(prefix.match(/^[ \t]*/)||[''])[0];
 if(/^[}\])]$/.test(e.key)&&/^\s*$/.test(prefix)&&indent){
   e.preventDefault();var d=dedentUnit(indent);replaceRange(node,b.start,sel.start,d+e.key,b.start+d.length+1);return;
 }
 if(e.key==='>'&&lang==='html'&&indent&&/^<\/[A-Za-z][\w:-]*$/.test(prefix.trim())){
   e.preventDefault();var dhtml=dedentUnit(indent),tag=prefix.trim();replaceRange(node,b.start,sel.start,dhtml+tag+'>',b.start+dhtml.length+tag.length+1);return;
 }
 if(e.key===':'&&lang==='python'&&indent){
   var t=prefix.trim();if(/^(?:elif\b.+|else|except(?:\b.*)?|finally|case\b.+)$/.test(t)){e.preventDefault();var d2=dedentUnit(indent);replaceRange(node,b.start,sel.start,d2+t+':',b.start+d2.length+t.length+1);return;}
 }
}
function toolbarFor(node){
 if(toolbars.has(node)&&toolbars.get(node).isConnected)return toolbars.get(node);
 var bar=document.createElement('div');
 bar.className='csai-editable-codebar';
 bar.setAttribute('data-csai-editable-toolbar','');
 bar.innerHTML='<span class="csai-editable-badge">Editable code · comments beside each line</span><button type="button" class="csai-editable-reset" data-csai-reset-code>Reset code</button>';
 var anchor=node;
 var shell=node.closest&&node.closest('.csai-vscode-shell');
 if(shell)anchor=shell;
 anchor.insertAdjacentElement('beforebegin',bar);
 bar.querySelector('[data-csai-reset-code]').addEventListener('click',function(){
   var original=originals.get(node);
   if(original==null)return;
   resetShownCode(node);
   if(window.CSAILineExplainer&&typeof window.CSAILineExplainer.refresh==='function')window.CSAILineExplainer.refresh(node);
   if(window.CSAIDiagnostics&&typeof window.CSAIDiagnostics.runLiveLint==='function'&&'value' in node)window.CSAIDiagnostics.runLiveLint(node);
   node.focus();
 });
 toolbars.set(node,bar);
 return bar;
}
function insertPlainText(text){
 var sel=window.getSelection&&window.getSelection();
 if(!sel||!sel.rangeCount)return;
 var range=sel.getRangeAt(0);
 range.deleteContents();
 var n=document.createTextNode(String(text||''));
 range.insertNode(n);
 range.setStartAfter(n);range.collapse(true);
 sel.removeAllRanges();sel.addRange(range);
}
function enhancePre(pre){
 if(pre.dataset.csaiEditableCode==='1')return;
 originals.set(pre,pre.textContent||'');
 pre.dataset.csaiEditableCode='1';
 pre.dataset.csaiAutoIndent='1';
 pre.setAttribute('contenteditable','plaintext-only');
 pre.setAttribute('spellcheck','false');
 pre.setAttribute('role','textbox');
 pre.setAttribute('aria-multiline','true');
 if(!pre.getAttribute('aria-label'))pre.setAttribute('aria-label','Editable code example');
 if(!pre.getAttribute('data-language')&&window.CSAILineExplainer&&typeof window.CSAILineExplainer.inferLanguage==='function'){try{pre.setAttribute('data-language',window.CSAILineExplainer.inferLanguage(pre.textContent||'','',pre));}catch(_){}}
 pre.setAttribute('tabindex','0');
 applyInlineComments(pre);
 toolbarFor(pre);
 pre.addEventListener('paste',function(e){
   e.preventDefault();
   insertPlainText((e.clipboardData||window.clipboardData).getData('text/plain'));
   pre.dispatchEvent(new Event('input',{bubbles:true}));
 });
 pre.addEventListener('keydown',function(e){
   if(e.key==='Tab'){
     e.preventDefault();
     insertPlainText('    ');
     pre.dispatchEvent(new Event('input',{bubbles:true}));
   }
 });
}
function enhanceTextarea(area){
 if(area.dataset.csaiEditableCode==='1')return;
 originals.set(area,area.value||'');
 area.dataset.csaiEditableCode='1';
 area.dataset.csaiAutoIndent='1';
 if(area.hasAttribute('readonly'))area.removeAttribute('readonly');
 if(area.disabled&&isCodeNode(area))area.disabled=false;
 area.spellcheck=false;
 if(!area.getAttribute('aria-label'))area.setAttribute('aria-label','Editable code');
 applyInlineComments(area);
}
function enhanceNode(node){
 if(!isCodeNode(node))return;
 if(node.dataset.csaiEditableCode==='1'){applyInlineComments(node);return;}
 if(node.tagName==='PRE')enhancePre(node);
 else if(node.tagName==='TEXTAREA')enhanceTextarea(node);
}
function targets(root){
 var nodes=[];
 if(root&&root.nodeType===1&&isCodeNode(root))nodes.push(root);
 if(window.CSAILineExplainer&&typeof window.CSAILineExplainer.targetNodes==='function'){
   try{nodes=nodes.concat(window.CSAILineExplainer.targetNodes(root||document));}catch(_){}
 }
 if(root&&root.querySelectorAll)nodes=nodes.concat(Array.from(root.querySelectorAll(PRE_FALLBACK+',textarea[data-project-editor],textarea[data-dual-editor],textarea.csai-code-editor,textarea.csai-study-code,textarea.adaptive-code,textarea.evergreen-editor,textarea.oa-editor,textarea[data-evergreen-code]')));
 return Array.from(new Set(nodes)).filter(isCodeNode);
}
function enhance(root){addStyle();targets(root||document).forEach(enhanceNode);}
function boot(){
 enhance(document);
 document.addEventListener('keydown',handleAutoIndentKeydown,true);
 var pending=new Set(),flush=0;
 new MutationObserver(function(records){
   records.forEach(function(r){Array.from(r.addedNodes||[]).forEach(function(n){if(n&&n.nodeType===1)pending.add(n);});});
   if(!pending.size)return;
   clearTimeout(flush);
   flush=setTimeout(function(){var batch=Array.from(pending);pending.clear();batch.forEach(enhance);},20);
 }).observe(document.documentElement,{childList:true,subtree:true});
 setTimeout(function(){enhance(document);},180);
 setTimeout(function(){enhance(document);},700);
}
window.CSAIEditableCode={enhance:enhance,isCodeNode:isCodeNode,computeEnterPlan:computeEnterPlan,languageFor:languageFor,applyInlineComments:applyInlineComments,version:'1.2-inline-comments'};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
