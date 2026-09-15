
/* ============ Roadmap track — own namespace, own localStorage ============ */
(function(){
  var ROAD = JSON.parse(document.getElementById('roaddata').textContent);
  var RLS = 'roadmap_progress_v1';
  var rstate = {};
  function rload(){ try{ var r=localStorage.getItem(RLS); if(r) rstate=JSON.parse(r)||{}; }catch(e){ rstate={}; } }
  function rsave(){ try{ localStorage.setItem(RLS, JSON.stringify(rstate)); }catch(e){} }
  var ORDER = ['todo','doing','done'];

  function ring(done, total){
    var pct = total ? done/total : 0;
    var r=26, c=2*Math.PI*r, off=c*(1-pct);
    return '<svg width="62" height="62" viewBox="0 0 62 62">'
      + '<circle cx="31" cy="31" r="'+r+'" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="5"/>'
      + '<circle cx="31" cy="31" r="'+r+'" fill="none" stroke="url(#roadgrad)" stroke-width="5" '
      + 'stroke-linecap="round" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" '
      + 'transform="rotate(-90 31 31)"/>'
      + '<defs><linearGradient id="roadgrad" x1="0" y1="0" x2="1" y2="1">'
      + '<stop offset="0" stop-color="#4fd1c5"/><stop offset="1" stop-color="#b48ef0"/></linearGradient></defs>'
      + '<text x="31" y="36" text-anchor="middle" font-size="15" font-weight="800" fill="#e8ecf3">'+Math.round(pct*100)+'%</text>'
      + '</svg>';
  }

  function stepHTML(s){
    var st = rstate[s.id] || 'todo';
    var nodeCls = st==='done'?'st-done':(st==='doing'?'st-doing':'');
    var nodeInner = st==='done' ? '&#10003;' : s.num;
    var subs = s.subs ? '<ul class="road-subs">'+s.subs.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>' : '';
    var stepCls = st==='done' ? 'road-step done' : 'road-step';
    return '<div class="'+stepCls+'" data-sid="'+s.id+'">'
      + '<div class="road-step-rail">'
      +   '<div class="road-node '+nodeCls+'" data-act="roadCycle(\''+s.id+'\')" tabindex="0" role="button" aria-label="Cycle progress for this roadmap step">'+nodeInner+'</div>'
      +   '<div class="road-line"></div>'
      + '</div>'
      + '<div class="road-body">'
      +   '<div class="road-step-title" data-act="roadCycle(\''+s.id+'\')" tabindex="0" role="button">'+s.title+'</div>'
      +   '<p class="road-step-desc">'+s.desc+'</p>'
      +   subs
      +   '<div class="road-status">'
      +     '<button class="'+(st==='todo'?'on-todo':'')+'" data-act="roadSet(\''+s.id+'\',\'todo\')">To do</button>'
      +     '<button class="'+(st==='doing'?'on-doing':'')+'" data-act="roadSet(\''+s.id+'\',\'doing\')">In progress</button>'
      +     '<button class="'+(st==='done'?'on-done':'')+'" data-act="roadSet(\''+s.id+'\',\'done\')">Done</button>'
      +   '</div>'
      + '</div>'
      + '</div>';
  }

  function tierBlock(tier, badge, title, note){
    var items = ROAD.filter(function(s){return s.tier===tier;});
    return '<div class="road-tier road-tier-'+tier+'">'
      + '<div class="road-tier-head"><span class="road-tier-badge">'+badge+'</span><h2>'+title+'</h2></div>'
      + '<div class="road-tier-note">'+note+'</div>'
      + '<div class="road-steps">'+items.map(stepHTML).join('')+'</div>'
      + '</div>';
  }

  window.roadRender = function(){
    var coreNote = 'Steps 1&ndash;11 are the internship-core track &mdash; this is what actually gets you hired as a Dubai SWE intern. Git (3), Debugging (8), and Problem Solving (10) aren\'t really "phases" &mdash; treat them as continuous skills you build alongside everything else, starting now.';
    var aiNote = 'Steps 12&ndash;20 are the after-hired track &mdash; what turns you from "a software engineer" into "a top AI/ML engineer." Don\'t block on finishing these before applying for internships; the core above is enough to get in the door.';
    var html = tierBlock('core','Steps 1–11','Internship Core', coreNote)
             + tierBlock('ai','Steps 12–20','AI / ML Track', aiNote);
    document.getElementById('roadSteps').innerHTML = html;
    roadUpdateProgress();
  };

  window.roadUpdateProgress = function(){
    var total = ROAD.length;
    var done = ROAD.filter(function(s){return rstate[s.id]==='done';}).length;
    var doing = ROAD.filter(function(s){return rstate[s.id]==='doing';}).length;
    document.getElementById('roadRing').innerHTML = ring(done,total);
    document.getElementById('roadProgressLabel').textContent = done+' of '+total+' done';
    var sub;
    if(done===0 && doing===0){ sub='Tap a circle to start tracking.'; }
    else if(done===total){ sub='Every step complete. That\'s the whole path. 🎯'; }
    else { sub = doing+' in progress'+(done? ' · next up after your current focus':''); }
    document.getElementById('roadProgressSub').innerHTML = sub;
  };

  window.roadCycle = function(id){
    var cur = rstate[id] || 'todo';
    var idx = ORDER.indexOf(cur);
    var next = ORDER[(idx+1)%ORDER.length];
    rstate[id] = next; rsave(); window.roadRender();
  };
  window.roadSet = function(id, st){ rstate[id]=st; rsave(); window.roadRender(); };
  window.roadReset = function(){
    if(confirm('Reset all roadmap progress? This can\'t be undone.')){ rstate={}; rsave(); window.roadRender(); }
  };

  rload();
  // render once DOM is ready (script runs after the container above, so it's present)
  window.roadRender();
})();
