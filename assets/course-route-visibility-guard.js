(function(){
  'use strict';

  var lastRoute = null;
  var repairing = false;
  var timer = 0;

  function registry(){ return window.TRACK_REGISTRY || null; }

  function currentHashRoute(){
    var reg = registry();
    if(!reg) return null;
    var hash = '';
    try{ hash = String(location.hash || '').replace(/^#/, ''); }catch(e){}
    return reg[hash] ? hash : null;
  }

  function targetFor(route){
    var reg = registry();
    var entry = reg && reg[route];
    return entry ? document.getElementById(entry.containerId) : null;
  }

  function preferredDisplay(el){
    if(!el) return 'block';
    if(el.classList && el.classList.contains('app')){
      var hasSide = !!el.querySelector('.side,.sidebar');
      var hasMain = !!el.querySelector('main,.main,[role="main"]');
      if(hasSide && hasMain) return 'flex';
    }
    return 'block';
  }

  function recover(route){
    if(repairing) return;
    var reg = registry();
    if(!reg) return;
    route = reg[route] ? route : (currentHashRoute() || lastRoute);
    if(!route || !reg[route]) return;
    var target = targetFor(route);
    if(!target) return;

    repairing = true;
    try{
      var computed = getComputedStyle(target);
      var rect = target.getBoundingClientRect();
      var hidden = target.hidden || computed.display === 'none' || computed.visibility === 'hidden';
      var collapsed = target.childElementCount > 0 && rect.height < 8;
      if(hidden || collapsed){
        target.hidden = false;
        target.style.setProperty('display', preferredDisplay(target), 'important');
        target.style.setProperty('visibility', 'visible', 'important');
        if(collapsed) target.style.setProperty('min-height', '100vh', 'important');
        console.warn('[CS AI Mastery] Restored hidden course route:', route);
      }
    }finally{
      repairing = false;
    }
  }

  function schedule(route){
    if(route) lastRoute = route;
    clearTimeout(timer);
    recover(route || lastRoute || currentHashRoute());
    requestAnimationFrame(function(){ recover(route || lastRoute || currentHashRoute()); });
    timer = setTimeout(function(){ recover(route || lastRoute || currentHashRoute()); }, 120);
    setTimeout(function(){ recover(route || lastRoute || currentHashRoute()); }, 500);
  }

  function install(){
    var original = window.showTrack;
    if(typeof original === 'function' && !original.__routeVisibilityGuard){
      var guarded = function(name){
        lastRoute = name;
        var result;
        try{
          result = original.apply(this, arguments);
        }catch(error){
          console.error('[CS AI Mastery] Course route failed; attempting recovery.', error);
        }
        schedule(name);
        return result;
      };
      guarded.__routeVisibilityGuard = true;
      guarded.__originalShowTrack = original;
      window.showTrack = guarded;
    }

    lastRoute = currentHashRoute() || lastRoute;
    schedule(lastRoute);

    var reg = registry();
    if(reg && document.body){
      var observed = Object.keys(reg).map(function(route){ return targetFor(route); }).filter(Boolean);
      if(observed.length){
        var observer = new MutationObserver(function(mutations){
          var route = lastRoute || currentHashRoute();
          var target = targetFor(route);
          if(!target) return;
          for(var i=0;i<mutations.length;i++){
            if(mutations[i].target === target){ schedule(route); break; }
          }
        });
        observed.forEach(function(el){ observer.observe(el,{attributes:true,attributeFilter:['style','class','hidden']}); });
      }
    }
  }

  document.addEventListener('click', function(){ setTimeout(function(){ schedule(lastRoute || currentHashRoute()); }, 0); }, false);
  window.addEventListener('hashchange', function(){ lastRoute = currentHashRoute() || lastRoute; schedule(lastRoute); });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
