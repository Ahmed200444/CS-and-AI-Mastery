(function(){
'use strict';

var VERSION='20260822-v567-clear-lessons';
var MAX_QUICK_WORDS=55;
var MAX_WHY_WORDS=18;

function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function words(v){var m=clean(v).match(/\b[\w’'\-]+\b/g);return m?m.length:0;}
function directChildren(el,tag){return Array.from(el.children).filter(function(n){return n.tagName&&n.tagName.toLowerCase()===tag;});}
function headingByText(root,label){return Array.from(root.querySelectorAll(':scope > h2,:scope > h3,:scope > h4')).find(function(h){return clean(h.textContent).toLowerCase()===label.toLowerCase();})||null;}
function sentenceParts(text){var t=clean(text);if(!t)return[];var matches=t.match(/[^.!?]+(?:[.!?]+|$)/g);return(matches||[t]).map(clean).filter(Boolean);}
function firstWords(text,maxWords){var list=clean(text).split(/\s+/).filter(Boolean);return list.length<=maxWords?clean(text):list.slice(0,maxWords).join(' ').replace(/[,:;\-]+$/,'')+'…';}
function splitQuick(text,maxWords){
 var parts=sentenceParts(text),kept=[],rest=[],count=0;
 parts.forEach(function(s){var w=words(s);if((count===0||count+w<=maxWords)&&count<maxWords){kept.push(s);count+=w;}else rest.push(s);});
 if(!kept.length&&text){var ws=clean(text).split(' ');kept=[ws.slice(0,maxWords).join(' ')];rest=[ws.slice(maxWords).join(' ')].filter(Boolean);}
 return{quick:clean(kept.join(' ')),rest:clean(rest.join(' '))};
}
function plainify(text){
 var t=clean(text);
 var replacements=[
  [/\basymptotic(?:ally)?\b/gi,'growth for large inputs'],
  [/\binstantiate\b/gi,'create'],
  [/\biterable\b/gi,'something you can loop through'],
  [/\bconcatenate\b/gi,'join together'],
  [/\bimmutable\b/gi,'cannot be changed in place'],
  [/\bmutable\b/gi,'can be changed'],
  [/\bserialization\b/gi,'converting data into a format that can be saved or sent'],
  [/\blatency\b/gi,'delay'],
  [/\bthroughput\b/gi,'how much work is handled over time'],
  [/\bidempotent\b/gi,'safe to repeat without changing the final result after the first successful run'],
  [/\bconcurrency\b/gi,'multiple tasks making progress around the same time'],
  [/\babstraction\b/gi,'a simpler interface that hides unnecessary details'],
  [/\bencapsulation\b/gi,'keeping related data and behavior together']
 ];
 replacements.forEach(function(pair){t=t.replace(pair[0],pair[1]);});
 return clean(t);
}
function simpleExplanation(text){var first=sentenceParts(text)[0]||text;return firstWords(plainify(first),28);}
function objectiveFrom(body){
 var h=Array.from(body.children).find(function(n){return /^H[234]$/.test(n.tagName||'')&&clean(n.textContent).toLowerCase()==='what you will learn';});
 if(!h)return{items:[],nodes:[]};
 var next=h.nextElementSibling,items=[];
 if(next&&(next.tagName==='UL'||next.tagName==='OL'))items=Array.from(next.querySelectorAll(':scope > li')).map(function(li){return clean(li.textContent);}).filter(Boolean).slice(0,1);
 return{items:items,nodes:next?[h,next]:[h]};
}
function whyFrom(section){
 var h=headingByText(section,'Why this matters');if(!h)return{text:'',nodes:[]};
 var n=h.nextElementSibling,text='';
 if(n&&n.tagName==='P')text=firstWords(n.textContent,MAX_WHY_WORDS);
 return{text:text,nodes:n?[h,n]:[h]};
}
function addStyles(){
 if(document.getElementById('csai-progressive-lesson-style'))return;
 var s=document.createElement('style');s.id='csai-progressive-lesson-style';s.textContent='\
[data-csai-quick-moved="1"]{display:none!important}.lesson-main-explanation[data-csai-progressive="1"]{margin-top:14px}.csai-quick-explanation{padding:16px 18px;border:1px solid var(--border);border-radius:15px;background:var(--panel);box-shadow:0 6px 18px rgba(0,0,0,.035)}.csai-today{margin:0 0 10px;padding:9px 11px;border-radius:10px;background:color-mix(in srgb,var(--panel) 88%,var(--bg));font-size:.88rem;line-height:1.5}.csai-today b{color:var(--muted)}.csai-quick-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px}.csai-quick-kicker{margin:0;font-size:.7rem;font-weight:950;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}.csai-simpler-btn{border:1px solid var(--border);border-radius:999px;background:var(--bg);color:var(--muted);padding:5px 9px;font:800 11px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}.csai-quick-explanation h3{margin:0 0 9px!important;font-size:1.04rem}.csai-quick-core{max-width:820px;margin:0;color:var(--text);font-size:.94rem;line-height:1.68}.csai-quick-why{margin:10px 0 0;color:var(--muted);font-size:.84rem;line-height:1.5}.csai-deep-dive{margin-top:10px;border:1px solid var(--border);border-radius:13px;background:var(--panel);overflow:hidden}.csai-deep-dive>summary{cursor:pointer;padding:11px 14px;font-weight:900;list-style-position:inside}.csai-deep-dive>summary::after{content:" — optional details";font-weight:600;font-size:.77rem;color:var(--muted)}.csai-deep-dive[open]>summary{border-bottom:1px solid var(--border)}.csai-deep-dive-inner{padding:6px 17px 17px}.csai-deep-dive-inner>h3{margin-top:18px!important}.csai-deep-dive-inner>p,.csai-deep-dive-inner li{line-height:1.66}.csai-deep-remainder{padding:11px 13px;border-left:3px solid var(--border);background:var(--bg);border-radius:8px}.csai-deep-remainder b{display:block;margin-bottom:5px}.lesson .body{line-height:1.62}\
@media(max-width:720px){.csai-quick-explanation{padding:14px}.csai-quick-head{align-items:flex-start}.csai-deep-dive>summary::after{display:none}}';
 document.head.appendChild(s);
}
function transform(section){
 if(!section||section.getAttribute('data-csai-progressive')==='1')return;
 var body=section.closest('.body')||section.parentElement;if(!body)return;
 var expHeading=headingByText(section,'Explanation');
 var firstP=directChildren(section,'p')[0]||null;
 if(!firstP)return;
 var split=splitQuick(firstP.textContent,MAX_QUICK_WORDS);
 var obj=objectiveFrom(body),why=whyFrom(section);
 var simple=simpleExplanation(split.quick);
 var quick=document.createElement('div');quick.className='csai-quick-explanation';quick.setAttribute('data-csai-quick-explanation','');
 quick.innerHTML=(obj.items.length?'<p class="csai-today"><b>Today you will learn:</b> '+esc(obj.items[0])+'</p>':'')+
  '<div class="csai-quick-head"><p class="csai-quick-kicker">Start here</p><button type="button" class="csai-simpler-btn" data-csai-simpler>Explain more simply</button></div><h3>Quick explanation</h3><p class="csai-quick-core" data-normal="'+esc(split.quick)+'" data-simple="'+esc(simple)+'">'+esc(split.quick)+'</p>'+
  (why.text?'<p class="csai-quick-why"><b>Why it matters:</b> '+esc(why.text)+'</p>':'');
 obj.nodes.forEach(function(n){n.setAttribute('data-csai-quick-moved','1');});
 why.nodes.forEach(function(n){if(n.parentElement===section)n.remove();});
 if(expHeading&&expHeading.parentElement===section)expHeading.remove();
 if(firstP.parentElement===section)firstP.remove();
 var details=document.createElement('details');details.className='csai-deep-dive';details.setAttribute('data-csai-deep-dive','');
 var summary=document.createElement('summary');summary.textContent='Learn deeper';details.appendChild(summary);
 var inner=document.createElement('div');inner.className='csai-deep-dive-inner';
 if(split.rest){var rem=document.createElement('p');rem.className='csai-deep-remainder';rem.innerHTML='<b>More detail</b>'+esc(split.rest);inner.appendChild(rem);}
 while(section.firstChild)inner.appendChild(section.firstChild);
 details.appendChild(inner);
 section.appendChild(quick);section.appendChild(details);section.setAttribute('data-csai-progressive','1');
}
function enhance(root){addStyles();root=root||document;if(root.matches&&root.matches('.lesson-main-explanation[data-main-explanation]'))transform(root);if(root.querySelectorAll)root.querySelectorAll('.lesson-main-explanation[data-main-explanation]').forEach(transform);}
function boot(){
 enhance(document);
 document.addEventListener('click',function(e){var btn=e.target.closest&&e.target.closest('[data-csai-simpler]');if(!btn)return;var box=btn.closest('.csai-quick-explanation'),p=box&&box.querySelector('.csai-quick-core');if(!p)return;var simple=btn.getAttribute('aria-pressed')!=='true';btn.setAttribute('aria-pressed',simple?'true':'false');p.textContent=simple?p.getAttribute('data-simple'):p.getAttribute('data-normal');btn.textContent=simple?'Show normal explanation':'Explain more simply';});
 var pending=new Set(),timer=0;new MutationObserver(function(records){records.forEach(function(r){Array.from(r.addedNodes||[]).forEach(function(n){if(n&&n.nodeType===1)pending.add(n);});});if(!pending.size)return;clearTimeout(timer);timer=setTimeout(function(){var batch=Array.from(pending);pending.clear();batch.forEach(enhance);},50);}).observe(document.documentElement,{childList:true,subtree:true});
}
window.CSAIProgressiveLessons={version:VERSION,enhance:enhance,splitQuick:splitQuick};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
