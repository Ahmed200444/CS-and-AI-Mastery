(function(){
'use strict';

function practical(code,lang){
  var out=String(code||'');
  if(lang==='python'||lang==='javascript'||lang==='cpp'){
    var list=out.match(/\[(\s*-?\d+(?:\s*,\s*-?\d+){1,})\]/);
    if(list)return out.replace(list[0],'[-3, 0, 3, 3, 10, 25]');
    var str=out.match(/(['"])([^'"\n]{1,30})\1/);
    if(str)return out.replace(str[0],str[1]+'Practical input 123'+str[1]);
    var n=out.match(/\b(\d{1,4})\b/);
    if(n)return out.slice(0,n.index)+String(Number(n[1])*2+1)+out.slice(n.index+n[1].length);
  }
  if(lang==='sql'){
    if(/ORDER BY/i.test(out))return out.replace(/ORDER BY/i,'WHERE 1 = 1\nORDER BY');
    if(/;\s*$/.test(out))return out.replace(/;\s*$/,'\nORDER BY 1;');
  }
  if(lang==='html')return out.replace(/>([^<]{2,40})</,function(_,text){return'>Practical: '+text.trim()+'<';});
  return out;
}
function edge(code,lang){
  var out=String(code||'');
  if(lang==='python'||lang==='javascript'||lang==='cpp'){
    var list=out.match(/\[(\s*-?\d+(?:\s*,\s*-?\d+){1,})\]/);
    if(list)return out.replace(list[0],'[]');
    var str=out.match(/(['"])([^'"\n]{1,30})\1/);
    if(str)return out.replace(str[0],str[1]+str[1]);
    var n=out.match(/\b(\d{1,4})\b/);
    if(n)return out.slice(0,n.index)+'0'+out.slice(n.index+n[1].length);
  }
  if(lang==='sql'){
    if(/WHERE\b/i.test(out))return out.replace(/WHERE\s+/i,'WHERE 1 = 0 AND ');
    if(/;\s*$/.test(out))return out.replace(/;\s*$/,'\nWHERE 1 = 0;');
  }
  if(lang==='html')return out.replace(/>([^<]{1,40})</,'><');
  return out;
}
function addNote(card,text){
  if(card.querySelector('[data-evergreen-case-note]'))return;
  var note=document.createElement('div');note.setAttribute('data-evergreen-case-note','');note.className='evergreen-case-note';note.textContent=text;
  var head=card.querySelector('.evergreen-example-head');if(head)head.insertAdjacentElement('afterend',note);else card.insertBefore(note,card.firstChild);
}
function upgrade(lab){
  if(lab.dataset.csaiDiversity==='1')return;
  var cards=Array.from(lab.querySelectorAll('.evergreen-example'));if(cards.length<3)return;
  lab.dataset.csaiDiversity='1';
  var base=cards[0].querySelector('[data-evergreen-code]'),two=cards[1].querySelector('[data-evergreen-code]'),three=cards[2].querySelector('[data-evergreen-code]');
  addNote(cards[0],'Guided case: trace the normal flow and identify the input, transformation, and output.');
  addNote(cards[1],'Practical variation: use a meaningfully different input shape or context. Compare what stays the same and what changes.');
  addNote(cards[2],'Edge / failure case: test a boundary, empty value, duplicate, zero, or invalid assumption. Predict what can fail before you run it.');
  var h2=cards[1].querySelector('.evergreen-example-head b'),h3=cards[2].querySelector('.evergreen-example-head b');if(h2)h2.textContent='Example 2 — Practical variation';if(h3)h3.textContent='Example 3 — Edge / failure case';
  if(base&&two&&three){
    var lang=String(cards[0].getAttribute('data-lang')||'text'),src=base.defaultValue||base.value||'';
    var p=practical(src,lang),e=edge(src,lang);
    if(p!==src){two.value=p;two.defaultValue=p;}
    if(e!==src){three.value=e;three.defaultValue=e;}
  }
}
function addStyle(){if(document.getElementById('csai-evergreen-diversity-style'))return;var s=document.createElement('style');s.id='csai-evergreen-diversity-style';s.textContent='.evergreen-case-note{padding:9px 11px;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--panel) 94%,var(--bg));color:var(--muted);font-size:.8rem;line-height:1.5;font-weight:650}';document.head.appendChild(s);}
function scan(){addStyle();document.querySelectorAll('[data-evergreen-lab]').forEach(upgrade);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});else scan();setTimeout(scan,500);setTimeout(scan,1200);new MutationObserver(function(records){if(records.some(function(r){return r.addedNodes&&r.addedNodes.length;}))setTimeout(scan,40);}).observe(document.documentElement,{childList:true,subtree:true});
})();
