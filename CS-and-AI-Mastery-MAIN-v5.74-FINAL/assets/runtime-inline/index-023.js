
(function(){
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };

  // Two available stages, referencing REAL existing course IDs -- no new course objects.
  var CE_AVAILABLE = [
    { courseId: 'comparch-os', stageNum: 1, why: 'Learn how processors, memory, processes, threads, and operating systems work -- the foundation everything else in this path builds on.' },
    { courseId: 'networking', stageNum: 2, why: 'Learn how systems communicate through TCP/IP, DNS, HTTP, sockets, routing, and network infrastructure -- how the machines from stage 1 actually talk to each other.' },
    { courseId: 'digital-hardware', stageNum: 3, why: 'See how the physical building blocks -- transistors, gates, registers, memory -- combine into the processors and systems described in stages 1 and 2. Practical and simulation-based, not a Linear Circuits course.' },
    { courseId: 'distributed-systems', stageNum: 4, why: 'See how the single machines from stages 1-3 combine into systems spanning many machines -- replication, partitioning, consensus, and designing for failure, once a single machine is no longer the whole picture.' }
  ];

  // Three planned stages -- METADATA ONLY, never written to coursedata, never counted in the course total.
  var CE_PLANNED = [
    { stageNum: 5, title: 'Embedded Systems & Microcontrollers', blurb: 'Microcontrollers, GPIO, sensors, and firmware -- how software meets physical hardware.' },
    { stageNum: 6, title: 'Systems Programming', blurb: 'Python systems programming, pointers, processes, threads, and low-level resource management.' },
    { stageNum: 7, title: 'Advanced Computer Organization', blurb: 'CPU pipelines, cache coherence, and hardware performance -- deeper than the Computer Architecture foundation.' }
  ];

  function getCourses(){ try{ return (window.__CSAI_COURSES__||(window.__CSAI_COURSES__=JSON.parse(document.getElementById('coursedata').textContent))); }catch(e){ return []; } }
  function byId(courses, id){ return courses.find(function(c){ return c.id===id; }); }
  function courseProgressCE(){ try{ return JSON.parse(localStorage.getItem('courses_progress_v1')) || {}; }catch(e){ return {}; } }
  function countsCE(c, cp){
    var st = cp[c.id] || {lessons:{},exercises:{},quiz:{},projects:{}};
    var lDone = (c.lessons||[]).filter(function(l){return st.lessons && st.lessons[l.id];}).length;
    var eDone = (c.exercises||[]).filter(function(_,i){return st.exercises && st.exercises[i];}).length;
    var qDone = (c.quiz||[]).filter(function(_,i){return st.quiz && st.quiz[i]!==undefined;}).length;
    var pDone = (c.projects||[]).filter(function(p){return st.projects && st.projects[p.id];}).length;
    var total = (c.linked ? 0 : (c.lessons||[]).length)+(c.exercises||[]).length+(c.quiz||[]).length+(c.projects||[]).length;
    var done = (c.linked ? 0 : lDone)+eDone+qDone+pDone;
    return {total:total, done:done, pct: total?Math.round(done/total*100):0};
  }

  window.cePathOpenCourse = function(courseId){ if(window.cxOpen) window.cxOpen(courseId); };

  window.cePathPlannedNotice = function(){
    var el = document.getElementById('cePlannedNotice');
    if(el){ el.focus(); el.scrollIntoView({behavior: 'reduce-motion' in document.documentElement.style ? 'auto' : 'smooth', block:'center'}); }
  };

  function renderCePath(){
    var view = document.getElementById('ceView');
    if(!view) return;
    var courses = getCourses();
    var cp = courseProgressCE();

    var availableCompleteCount = 0;
    var availableCards = CE_AVAILABLE.map(function(stage){
      var c = byId(courses, stage.courseId);
      if(!c) return '';
      var k = countsCE(c, cp);
      if(k.total > 0 && k.done === k.total) availableCompleteCount++;
      var pctLabel = k.total ? k.pct + '% complete (' + k.done + '/' + k.total + ' items)' : 'Not started';
      return '<div class="cx-card" style="margin-bottom:14px">'
        + '<div class="cx-hero" style="align-items:flex-start">'
        + '<div style="font-weight:800;font-size:1.3rem;color:var(--teal);flex-shrink:0">'+stage.stageNum+'</div>'
        + '<div style="flex:1">'
          + '<h3 style="margin:0 0 4px">'+esc(c.title)+'</h3>'
          + '<p style="margin:0 0 8px;color:var(--sub);font-size:.9rem">'+esc(c.description||c.blurb||'')+'</p>'
          + '<p style="margin:0 0 8px;font-size:.85rem">'+esc(stage.why)+'</p>'
          + '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;font-size:.82rem;color:var(--sub)">'
            + '<span>&#9202; '+esc(String(c.estimatedHours||'?'))+'h estimated</span>'
            + '<span>'+esc(pctLabel)+'</span>'
          + '</div>'
          + '<div class="cx-bar" style="margin-top:8px"><span style="width:'+k.pct+'%"></span></div>'
          + '<button class="wd-btn" style="margin-top:10px" data-act="cePathOpenCourse(\''+stage.courseId+'\')">Open '+esc(c.title)+'</button>'
        + '</div></div></div>';
    }).join('');

    var plannedCards = CE_PLANNED.map(function(stage){
      return '<div class="cx-card" style="margin-bottom:14px;opacity:.72;border-style:dashed">'
        + '<div class="cx-hero" style="align-items:flex-start">'
        + '<div style="font-weight:800;font-size:1.3rem;color:var(--sub);flex-shrink:0">'+stage.stageNum+'</div>'
        + '<div style="flex:1">'
          + '<h3 style="margin:0 0 4px;display:flex;align-items:center;gap:8px">'+esc(stage.title)+' <span class="cx-flag cx-flag-soon">Planned</span></h3>'
          + '<p style="margin:0 0 8px;color:var(--sub);font-size:.9rem">'+esc(stage.blurb)+'</p>'
          + '<div class="cx-bar cx-bar-soon"><span style="width:0%"></span></div>'
          + '<button class="wd-btn-ghost" style="margin-top:10px" disabled aria-disabled="true" title="This stage is planned and has no course content yet.">Planned — not available yet</button>'
        + '</div></div></div>';
    }).join('');

    view.innerHTML =
      '<div class="cx-top"><button class="cx-back" data-act="showTrack(\'hub\')">&larr; Home</button></div>'
      + '<div class="cx-hero">'
        + '<div style="font-size:2rem">&#128421;&#65039;</div>'
        + '<div><h1 style="margin:0 0 4px">Computer Engineering &amp; Systems Path</h1>'
        + '<p style="margin:0;color:var(--sub)">A dedicated path through systems fundamentals -- separate from the 20-step AI/ML roadmap, for anyone focused on computer engineering and systems depth specifically.</p></div>'
      + '</div>'
      + '<div class="cx-card" style="margin:16px 0">'
        + '<b>Available courses completed: '+availableCompleteCount+' of '+CE_AVAILABLE.length+'</b>'
        + '<div style="color:var(--sub);font-size:.85rem;margin-top:4px">'+CE_PLANNED.length+' additional stage'+(CE_PLANNED.length===1?'':'s')+' planned (not yet available)</div>'
      + '</div>'
      + '<h2 style="margin:20px 0 4px">Available now</h2>'
      + availableCards
      + '<h2 style="margin:20px 0 4px" id="cePlannedNotice" tabindex="-1">Planned</h2>'
      + '<p style="color:var(--sub);font-size:.85rem;margin:0 0 12px">These five stages are planned but not yet built -- no lessons, exercises, or progress exist for them yet.</p>'
      + plannedCards;
  }

  var cePathBooted = false;
  window._cePathBoot = function(){
    cePathBooted = false; // always re-render so progress reflects the latest completion state
    renderCePath();
  };
})();
