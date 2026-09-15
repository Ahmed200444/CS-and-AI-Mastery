(function(){
'use strict';
var root=document.documentElement;root.classList.add('csai-scroll-performance');
function txt(el){return String((el&&el.textContent)||'').replace(/\s+/g,' ').trim()}
function labelFor(el,fallback){
  var h=el&&el.querySelector&&el.querySelector(':scope > h1,:scope > h2,:scope > h3,:scope > h4,h2,h3,h4');
  return (h&&txt(h))||fallback||'Practice section';
}
function lazyItem(item){
  if(!item||item.dataset.csaiLazyItem==='1'||item.closest('.csai-lazy-item'))return;
  item.dataset.csaiLazyItem='1';
  var label='Open item',b=item.querySelector('b,h3,h4,label');if(b)label=txt(b).slice(0,150)||label;
  var d=document.createElement('details');d.className='csai-lazy-item';d.setAttribute('data-csai-lazy-item-shell','1');
  var s=document.createElement('summary');s.textContent=label;d.appendChild(s);
  var parent=item.parentNode;if(!parent)return;parent.replaceChild(d,item);
  var t=document.createElement('template');t.setAttribute('data-csai-lazy-template','');t.content.appendChild(item);d.appendChild(t);
  var body=document.createElement('div');body.className='csai-lazy-item-body';body.setAttribute('data-csai-lazy-body','');d.appendChild(body);
}
function prepareNested(container){
  if(!container||!container.querySelectorAll)return;
  var nodes=Array.from(container.querySelectorAll('.item,.dcv-item,.oa-task,.project-card'));
  nodes.forEach(function(n){
    if(n.closest('.lesson')||n.closest('.csai-study-example'))return;
    lazyItem(n);
  });
}
function fold(el,label){
  if(!el||el.dataset.csaiHeavyFold==='1'||el.closest('.csai-heavy-fold'))return;
  el.dataset.csaiHeavyFold='1';prepareNested(el);
  var d=document.createElement('details');d.className='csai-heavy-fold';d.setAttribute('data-csai-heavy-fold','1');
  var s=document.createElement('summary');s.textContent=labelFor(el,label);d.appendChild(s);
  var t=document.createElement('template');t.setAttribute('data-csai-heavy-template','');
  var parent=el.parentNode;if(!parent)return;parent.replaceChild(d,el);t.content.appendChild(el);d.appendChild(t);
  var body=document.createElement('div');body.className='csai-heavy-fold-body';body.setAttribute('data-csai-heavy-body','');d.appendChild(body);
}
function shouldFoldCard(el){
  if(!el||el.closest('.lesson')||el.closest('.csai-heavy-fold'))return false;
  var h=labelFor(el,'').toLowerCase();
  return /assessment|knowledge check|exercise|practice|checkpoint|project/.test(h);
}
function boot(){
  document.querySelectorAll('.assessment-fullwidth-grid').forEach(function(el){fold(el,'Practice & assessments')});
  document.querySelectorAll('.project-section').forEach(function(el){fold(el,'Projects')});
  document.querySelectorAll('main .assessment-section,.wrap>.assessment-section,.main>.assessment-section').forEach(function(el){fold(el,'Assessment')});
  document.querySelectorAll('main>.card,.wrap>.card,.grid>.card').forEach(function(el){if(shouldFoldCard(el))fold(el)});
}
function hydrate(d,templateSelector,bodySelector){
  if(!d||d.dataset.csaiHydrated==='1')return;
  var t=d.querySelector(':scope > '+templateSelector),body=d.querySelector(':scope > '+bodySelector);if(!t||!body)return;
  body.appendChild(t.content);t.remove();d.dataset.csaiHydrated='1';
}
document.addEventListener('toggle',function(e){
  var d=e.target;if(!d||!d.open)return;
  if(d.matches('.csai-heavy-fold'))hydrate(d,'template[data-csai-heavy-template]','[data-csai-heavy-body]');
  if(d.matches('.csai-lazy-item'))hydrate(d,'template[data-csai-lazy-template]','[data-csai-lazy-body]');
},true);
boot();
})();
