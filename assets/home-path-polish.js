(function(){
'use strict';
function text(n){return n?String(n.textContent||'').replace(/\s+/g,' ').trim():'';}
function slug(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function catalog(){try{var n=document.getElementById('csai-inline-catalog-data');return n?JSON.parse(n.textContent||'{}'):{courses:[]};}catch(e){return{courses:[]};}}
function polishCounts(){document.querySelectorAll('h1,h2,.hcb-title,.cx-kicker').forEach(function(n){if(/All 54 courses/i.test(text(n)))n.textContent=text(n).replace(/54/g,'57');});document.querySelectorAll('*').forEach(function(n){if(n.children.length)return;var t=text(n);if(/^54 of 54 courses shown$/i.test(t))n.textContent='57 of 57 courses shown';});}
function polishPython(){document.querySelectorAll('h1,h2,h3,.hcb-title,.ai-path-course-head').forEach(function(n){if(text(n)==='Python')n.textContent='Python & C++';});}
function enableCE(){var data=catalog(),byTitle={};(data.courses||[]).forEach(function(c){byTitle[String(c.title||'').toLowerCase()]=c;});document.querySelectorAll('#cePathTrack .cx-card').forEach(function(card){var h=card.querySelector('h2,h3'),title=text(h).replace(/\bPLANNED\b/ig,'').trim(),c=byTitle[title.toLowerCase()];if(!c)return;var badge=card.querySelector('.cx-flag-soon');if(badge){badge.textContent='AVAILABLE';badge.classList.remove('cx-flag-soon');}var b=card.querySelector('button[disabled],button[aria-disabled="true"]');if(b){b.disabled=false;b.removeAttribute('aria-disabled');b.removeAttribute('title');b.textContent='Open course';b.onclick=function(){location.href='/courses/'+encodeURIComponent(c.id)+'.html';};}card.style.opacity='';card.style.borderStyle='';});}
function run(){polishCounts();polishPython();enableCE();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();setTimeout(run,300);setTimeout(run,900);var observer=new MutationObserver(function(records){if(records.some(function(r){return r.addedNodes&&r.addedNodes.length;}))setTimeout(run,40);});observer.observe(document.documentElement,{childList:true,subtree:true});
})();
