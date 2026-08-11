(function(){
'use strict';

function decorateHero(){
  var hero=document.querySelector('#hub .av4-hero');
  if(!hero)return false;
  var row=hero.querySelector('.av4-hero-row');
  if(row&&row.firstElementChild)row.firstElementChild.classList.add('av4-hero-copy');
  var art=hero.querySelector('.av4-hero-art');
  if(!art)return false;
  if(art.querySelector('.av4-code-visual'))return true;
  art.setAttribute('aria-hidden','true');
  art.innerHTML=''+
    '<div class="av4-code-visual">'+
      '<div class="av4-code-head">'+
        '<span class="av4-code-dots"><i></i><i></i><i></i></span>'+
        '<span class="av4-code-file">practice.py</span>'+
        '<span class="av4-code-lang">PY</span>'+
      '</div>'+
      '<div class="av4-code-body">'+
        '<span class="av4-code-line"><span class="av4-code-kw">def</span> <span class="av4-code-fn">solve</span>(<span class="av4-code-name">problem</span>):</span>'+
        '<span class="av4-code-line av4-code-indent"><span class="av4-code-name">result</span> = <span class="av4-code-call">practice</span>(problem)</span>'+
        '<span class="av4-code-line av4-code-indent"><span class="av4-code-kw">return</span> result</span>'+
        '<span class="av4-code-line"><span class="av4-code-comment"># learn · test · build</span></span>'+
      '</div>'+
      '<span class="av4-code-cpp">PYTHON READY</span>'+
      '<div class="av4-code-status"><span class="av4-code-ready"></span><b>Python ready</b><span>•</span><span>Runner cached</span><span class="av4-code-run">Run ↵</span></div>'+
    '</div>';
  return true;
}

function boot(){
  decorateHero();
  var tries=0;
  var timer=setInterval(function(){tries++;if(decorateHero()||tries>20)clearInterval(timer);},100);
  var observer=new MutationObserver(function(records){if(records.some(function(r){return r.addedNodes&&r.addedNodes.length;}))decorateHero();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
