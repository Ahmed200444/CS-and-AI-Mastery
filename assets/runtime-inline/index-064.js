
(function(){
  var COURSES = (window.__CSAI_COURSES__||(window.__CSAI_COURSES__=JSON.parse(document.getElementById('coursedata').textContent)));
  var CATEGORIES = JSON.parse(document.getElementById('categorydata').textContent);
  var CXLS = 'courses_progress_v1'; // UNCHANGED key -- Task 10: no rename, existing progress loads as before
  var RVLS = 'courses_recent_v1';   // new key, additive only
  var cxstate = {};
  var recentIds = [];
  function cxload(){ try{ var r=localStorage.getItem(CXLS); if(r) cxstate=JSON.parse(r)||{}; }catch(e){ cxstate={}; } }
  function cxsave(){ try{ localStorage.setItem(CXLS, JSON.stringify(cxstate)); }catch(e){} }
  function rvload(){ try{ var r=localStorage.getItem(RVLS); if(r) recentIds=JSON.parse(r)||[]; }catch(e){ recentIds=[]; } }
  function rvsave(){ try{ localStorage.setItem(RVLS, JSON.stringify(recentIds)); }catch(e){} }
  function cs(id){ if(!cxstate[id]) cxstate[id]={lessons:{},exercises:{},quiz:{},projects:{}}; if(!cxstate[id].projects) cxstate[id].projects={}; return cxstate[id]; }
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
  var byId = function(id){ return COURSES.find(function(c){return c.id===id;}); };
  window.byId = byId; // exposed read-only for the Full-Stack Path roadmap module (separate script) to reuse -- no behavior change

  function isAvailable(c){ return c.status !== 'coming-soon'; }

  function counts(c){
    if(!isAvailable(c)) return {lDone:0,eDone:0,qDone:0,pDone:0,total:0,done:0,pct:0};
    var st=cs(c.id);
    var lDone=c.lessons.filter(function(l){return st.lessons[l.id];}).length;
    var eDone=c.exercises.filter(function(_,i){return st.exercises[i];}).length;
    var qDone=c.quiz.filter(function(_,i){return st.quiz[i]!==undefined;}).length;
    var pDone=c.projects.filter(function(p){return st.projects && st.projects[p.id];}).length;
    // v5.18.2: every course has one canonical study track. For linked courses,
    // overall course progress is the saved progress through that dedicated track,
    // not a second calculation based on the catalog resource page. Quiz/project
    // completion remains saved and visible as supporting-resource progress.
    if(c.linked){
      try{
        var aiRaw=localStorage.getItem('ai_path_resume_v1');
        var aiState=aiRaw?JSON.parse(aiRaw):{};
        var saved=aiState&&aiState.courses?aiState.courses[c.id]:null;
        var trackTotal=saved?Number(saved.trackTotal)||0:0;
        var trackDone=saved&&Array.isArray(saved.trackCompleted)?Math.min(trackTotal,saved.trackCompleted.length):0;
        return {lDone:trackDone,eDone:0,qDone:qDone,pDone:pDone,total:trackTotal,done:trackDone,pct:trackTotal?Math.round(trackDone/trackTotal*100):0,trackTotal:trackTotal,trackDone:trackDone};
      }catch(e){
        return {lDone:0,eDone:0,qDone:qDone,pDone:pDone,total:0,done:0,pct:0,trackTotal:0,trackDone:0};
      }
    }
    var total=c.lessons.length+c.exercises.length+c.quiz.length+c.projects.length;
    var done=lDone+eDone+qDone+pDone;
    return {lDone:lDone,eDone:eDone,qDone:qDone,pDone:pDone,total:total,done:done,pct:total?Math.round(done/total*100):0};
  }
  window.counts = counts; // exposed read-only for the Full-Stack Path roadmap module (separate script) to reuse -- no behavior change

  // ---------- CATALOG STATE (filters) ----------
  var filt = { category:'all', q:'', status:'all', difficulty:'all', progress:'all', tier:'all' };

  function passesFilter(c){
    if(filt.category!=='all' && c.category!==filt.category) return false;
    if(filt.status!=='all'){
      if(filt.status==='available' && !isAvailable(c)) return false;
      if(filt.status==='coming-soon' && isAvailable(c)) return false;
    }
    if(filt.difficulty!=='all' && c.level!==filt.difficulty) return false;
    if(filt.tier!=='all' && (c.sweTier||'core')!==filt.tier) return false;
    if(filt.progress!=='all'){
      var k=counts(c);
      if(filt.progress==='not-started' && k.done>0) return false;
      if(filt.progress==='in-progress' && (k.done===0 || k.pct>=100)) return false;
      if(filt.progress==='completed' && k.pct<100) return false;
    }
    if(filt.q){
      var hay=(c.title+' '+(c.description||c.blurb||'')+' '+(c.tags||[]).join(' ')).toLowerCase();
      if(hay.indexOf(filt.q.toLowerCase())===-1) return false;
    }
    return true;
  }

  // ---------- CATALOG ----------
  window.cxRenderCatalog = function(){
    rvload();
    var available = COURSES.filter(isAvailable);
    var totalDone=0, totalAll=0;
    available.forEach(function(c){ var k=counts(c); totalDone+=k.done; totalAll+=k.total; });
    var overallPct = totalAll? Math.round(totalDone/totalAll*100):0;

    // Continue learning: available courses with 0<pct<100, most-recently-touched first (recentIds order)
    var inProgress = available.filter(function(c){ var k=counts(c); return k.done>0 && k.pct<100; });
    inProgress.sort(function(a,b){ return recentIds.indexOf(a.id) - recentIds.indexOf(b.id); });
    var continueHtml = '';
    if(inProgress.length){
      continueHtml = '<div class="cx-section-h">Continue learning</div><div class="cx-grid cx-grid-strip">'
        + inProgress.slice(0,3).map(cardHTML).join('') + '</div>';
    }

    // Recently viewed (excluding ones already in continue-learning strip)
    var recentCourses = recentIds.map(byId).filter(Boolean).filter(function(c){ return isAvailable(c) && inProgress.indexOf(c)===-1; }).slice(0,3);
    var recentHtml = recentCourses.length ? ('<div class="cx-section-h">Recently viewed</div><div class="cx-grid cx-grid-strip">'
      + recentCourses.map(cardHTML).join('') + '</div>') : '';

    // Recommended next: first not-started course whose prerequisites are all completed
    var notStarted = available.filter(function(c){ return counts(c).done===0; });
    var recommended = notStarted.find(function(c){
      return (c.prerequisites||[]).every(function(p){ var pc=byId(p); return pc && counts(pc).pct>=100; });
    });
    var recHtml = recommended ? ('<div class="cx-section-h">Recommended next</div><div class="cx-grid cx-grid-strip">'+cardHTML(recommended)+'</div>') : '';

    var catOptions = '<option value="all">All categories</option>' + CATEGORIES.map(function(cat){
      return '<option value="'+cat.id+'"'+(filt.category===cat.id?' selected':'')+'>'+cat.icon+' '+esc(cat.title)+'</option>';
    }).join('');

    var filtered = COURSES.filter(passesFilter);
    var availCount = filtered.filter(isAvailable).length;
    var soonCount = filtered.filter(function(c){return !isAvailable(c);}).length;

    var cardsHtml = filtered.length
      ? '<div class="cx-grid">'+filtered.map(cardHTML).join('')+'</div>'
      : '<p class="cx-empty">No courses match these filters. <button class="cx-ghost" data-act="cxClearFilters()">Clear filters</button></p>';

    var html = '<div class="cx-top"><button class="cx-back" data-act="showTrack(\'hub\')">&larr; Home</button></div>'
      +'<div class="cx-cat-head"><div class="cx-cat-eyebrow">Complete Learning Platform</div>'
      +'<h1 class="cx-cat-h1">All Courses</h1>'
      +'<p class="cx-cat-lead">Engineering and AI skills taught through lessons, practice, projects and interview preparation. '+available.length+' available now, '+(COURSES.length-available.length)+' more mapped out and coming soon.</p></div>'
      +'<div class="cx-overall"><div class="road-progress-ring">'+ring(overallPct)+'</div>'
      +'<div class="cx-progress-txt"><b>'+available.length+' courses available &middot; '+overallPct+'% overall</b>'
      +'<div class="cx-progress-sub">'+totalDone+' of '+totalAll+' items completed across all available courses</div></div></div>'
      + continueHtml + recentHtml + recHtml
      +'<div class="cx-toolbar">'
        +'<input class="cx-search" id="cxSearchInput" type="search" placeholder="Search courses..." value="'+esc(filt.q)+'" '
          +'data-input="cxFilterFromInput(\'q\',\'cxSearchInput\')" aria-label="Search courses">'
        +'<select class="cx-select" id="cxCategorySelect" aria-label="Filter by category" data-change="cxFilterFromInput(\'category\',\'cxCategorySelect\')">'+catOptions+'</select>'
        +'<select class="cx-select" id="cxTierSelect" aria-label="Filter by SWE/AI path relevance" data-change="cxFilterFromInput(\'tier\',\'cxTierSelect\')">'
          +'<option value="all"'+(filt.tier==='all'?' selected':'')+'>All courses</option>'
          +'<option value="core"'+(filt.tier==='core'?' selected':'')+'>&#11088; Core (SWE/AI path)</option>'
          +'<option value="optional"'+(filt.tier==='optional'?' selected':'')+'>Optional</option>'
          +'<option value="specialization"'+(filt.tier==='specialization'?' selected':'')+'>Specialization</option>'
        +'</select>'
        +'<select class="cx-select" id="cxStatusSelect" aria-label="Filter by status" data-change="cxFilterFromInput(\'status\',\'cxStatusSelect\')">'
          +'<option value="all"'+(filt.status==='all'?' selected':'')+'>All statuses</option>'
          +'<option value="available"'+(filt.status==='available'?' selected':'')+'>Available</option>'
          +'<option value="coming-soon"'+(filt.status==='coming-soon'?' selected':'')+'>Coming soon</option>'
        +'</select>'
        +'<select class="cx-select" id="cxDifficultySelect" aria-label="Filter by difficulty" data-change="cxFilterFromInput(\'difficulty\',\'cxDifficultySelect\')">'
          +'<option value="all"'+(filt.difficulty==='all'?' selected':'')+'>Any level</option>'
          +'<option value="mixed"'+(filt.difficulty==='mixed'?' selected':'')+'>Beginner\u2192Advanced</option>'
        +'</select>'
        +'<select class="cx-select" id="cxProgressSelect" aria-label="Filter by progress" data-change="cxFilterFromInput(\'progress\',\'cxProgressSelect\')">'
          +'<option value="all"'+(filt.progress==='all'?' selected':'')+'>Any progress</option>'
          +'<option value="not-started"'+(filt.progress==='not-started'?' selected':'')+'>Not started</option>'
          +'<option value="in-progress"'+(filt.progress==='in-progress'?' selected':'')+'>In progress</option>'
          +'<option value="completed"'+(filt.progress==='completed'?' selected':'')+'>Completed</option>'
        +'</select>'
        +(filt.category!=='all'||filt.q||filt.status!=='all'||filt.difficulty!=='all'||filt.progress!=='all' ? '<button class="cx-ghost" data-act="cxClearFilters()">Clear</button>' : '')
      +'</div>'
      +'<div class="cx-result-sub">'+availCount+' available'+(soonCount?', '+soonCount+' coming soon':'')+' match'+(filtered.length===1?'':'')+'</div>'
      + cardsHtml;
    document.getElementById('cxView').innerHTML = html;
  };

  window.cxFilterFromInput = function(key, elId){
    var el = document.getElementById(elId);
    if(!el) return;
    var val = el.value;
    var caret = (el.selectionStart!=null) ? el.selectionStart : null;
    filt[key]=val;
    window.cxRenderCatalog();
    // for the search box, restore focus + caret so typing isn't interrupted by the re-render
    if(key==='q'){
      var el2 = document.getElementById('cxSearchInput');
      if(el2){ el2.focus(); if(caret!=null) el2.setSelectionRange(caret,caret); }
    }
  };
  window.cxClearFilters = function(){ filt={category:'all',q:'',status:'all',difficulty:'all',progress:'all',tier:'all'}; window.cxRenderCatalog(); };

  function cardHTML(c){
    var soon = !isAvailable(c);
    var k = counts(c);
    var flag = c.linked ? '<span class="cx-flag">Study track</span>' : '';
    var soonFlag = soon ? '<span class="cx-flag cx-flag-soon">Coming soon</span>' : '';
    var tierFlag = c.sweTier==='optional' ? '<span class="cx-flag" style="background:var(--panel2);color:var(--sub)">Optional</span>'
      : c.sweTier==='specialization' ? '<span class="cx-flag" style="background:var(--panel2);color:var(--sub)">Specialization</span>' : '';
    var clickAct = soon ? '' : ' data-act="cxOpen(\''+c.id+'\')"';
    var bar = soon ? '<div class="cx-bar cx-bar-soon"><span style="width:0%"></span></div><div class="cx-bar-pct">&mdash;</div>'
      : '<div class="cx-bar"><span style="width:'+k.pct+'%"></span></div><div class="cx-bar-pct">'+k.pct+'%</div>';
    return '<div class="cx-card'+(soon?' cx-card-soon':'')+'"'+clickAct+(soon?'':' tabindex="0" role="button"')+'>'
      +'<div class="cx-card-top">'
        +'<div class="cx-card-icon" style="background:'+c.color+'22;">'+c.icon+'</div>'
        +'<div><div class="cx-card-tag">'+esc(c.tag)+'</div><h3>'+esc(c.title)+'</h3></div>'
      +'</div>'
      +'<p class="cx-card-blurb">'+esc(c.description||c.blurb||'')+'</p>'
      +'<div class="cx-card-foot">'+flag+tierFlag+soonFlag+bar+'</div>'
    +'</div>';
  }

  function ring(pct){
    var r=24,c=2*Math.PI*r,off=c*(1-pct/100);
    return '<svg width="58" height="58" viewBox="0 0 58 58" role="img" aria-label="'+pct+'% complete"><circle cx="29" cy="29" r="'+r+'" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="5"/>'
      +'<circle cx="29" cy="29" r="'+r+'" fill="none" stroke="url(#cxgrad)" stroke-width="5" stroke-linecap="round" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" transform="rotate(-90 29 29)"/>'
      +'<defs><linearGradient id="cxgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4fd1c5"/><stop offset="1" stop-color="#b48ef0"/></linearGradient></defs>'
      +'<text x="29" y="34" text-anchor="middle" font-size="14" font-weight="800" fill="#e8ecf3">'+pct+'%</text></svg>';
  }

  // ---------- DETAIL ----------
  var curTab = 'overview';
  // Canonical course entry: open the one dedicated study track directly.
  window.cxOpen = function(id){
    var c = byId(id);
    if(!c || !isAvailable(c)) return;
    window._cxCur=id;
    if(window.aiPathRememberCourse) window.aiPathRememberCourse(id,'track');
    rvload();
    recentIds=[id].concat(recentIds.filter(function(x){return x!==id;})).slice(0,8);
    rvsave();
    if(c.linked && window.TRACK_REGISTRY && window.TRACK_REGISTRY[c.linked]){
      window.showTrack(c.linked);
      return;
    }
    window.cxOpenDetails(id);
  };

  // Secondary resource page: overview, roadmap, quizzes, projects, interview prep.
  // It is deliberately not presented as another study track.
  window.cxOpenDetails = function(id,tab){
    var c=byId(id);
    if(!c || !isAvailable(c)) return;
    curTab=tab||'overview'; window._cxCur=id;
    if(window.aiPathRememberCourse) window.aiPathRememberCourse(id,curTab);
    rvload();
    recentIds=[id].concat(recentIds.filter(function(x){return x!==id;})).slice(0,8);
    rvsave();
    if(window.showTrack) window.showTrack('courses');
    renderDetail(id); window.scrollTo(0,0);
  };

  // ---------- Python Full-Stack Developer Path: course-unlock gating ----------
  // Scoped ONLY to courses carrying an "fsPathOrder" field (python, web-dev,
  // apis, backend, databases, git, docker, testing, deployment) -- every
  // other one of the 41 courses has no such field and is completely
  // unaffected, opening exactly as it always has.
  // "Complete" reuses the EXACT SAME definition already used elsewhere for
  // prerequisite chips (counts(course).pct >= 100), for consistency rather
  // than inventing a second notion of "done" -- this is intentionally a soft,
  // pedagogical gate (calling cxOpen directly from the console still works,
  // same as every other client-side check on this platform), not a security
  // boundary.
  function fsPathLockedReason(c){
    // Path-stage locking removed as part of the same v5.15.1 policy: curated
    // path order remains guidance only and must never block opening a course.
    return null;
  }

  function renderLockedStage(id, prev){
    var c = byId(id);
    var view = document.getElementById('cxView');
    if(!c || !view) return;
    var pk = counts(prev);
    view.innerHTML = '<div class="cx-top"><button class="cx-back" data-act="cxBackToCatalog()">&larr; All courses</button></div>'
      + '<div class="cx-locked-stage">'
      + '<div class="cx-locked-icon">&#128274;</div>'
      + '<h2>'+esc(c.title)+' is locked</h2>'
      + '<p>This is stage '+c.fsPathOrder+' of the Python Full-Stack Developer Path. Finish <b>'+esc(prev.title)+'</b> ('+pk.pct+'% complete) to unlock it.</p>'
      + '<button class="cx-open-btn" data-act="cxOpen(\''+prev.id+'\')">Go to '+esc(prev.title)+' &rarr;</button>'
      + '</div>';
  }

  function renderDetail(id){
    var c=byId(id); if(!c) return;
    var k=counts(c);
    var prereqHtml = '';
    if(c.prerequisites && c.prerequisites.length){
      var chips = c.prerequisites.map(function(p){
        var pc=byId(p); if(!pc) return '';
        var done = counts(pc).pct>=100;
        return '<span class="cx-prereq-chip'+(done?' done':'')+'" data-act="cxOpen(\''+p+'\')" tabindex="0" role="button">'+(done?'&#10003; ':'')+esc(pc.title)+'</span>';
      }).join('');
      prereqHtml = '<div class="cx-prereqs"><span class="cx-prereqs-lbl">Prerequisites:</span>'+chips+'</div>';
    }
    var tierNote = c.sweTier==='optional' ? '<div style="font-size:.78rem;color:var(--sub);margin-top:2px">Optional for the SWE/AI internship path -- useful, not required</div>'
      : c.sweTier==='specialization' ? '<div style="font-size:.78rem;color:var(--sub);margin-top:2px">Specialization track -- not part of the core SWE/AI internship path</div>' : '';
    var html = '<div class="cx-top"><button class="cx-back" data-act="cxBackToCatalog()">&larr; All courses</button>'
      +(c.linked?'<button class="cx-back" data-act="showTrack(\''+c.linked+'\')">Return to study track &rarr;</button>':'')+'</div>'
      +'<div class="cx-hero"><div class="cx-hero-icon" style="background:'+c.color+'22;">'+c.icon+'</div>'
      +'<div><div class="cx-hero-tag">'+esc(c.tag)+'</div><h1>'+esc(c.title)+'</h1>'+tierNote
      +'<p class="cx-hero-blurb">'+esc(c.description||c.blurb||'')+'</p>'+prereqHtml+'</div></div>'
      +'<div class="cx-detail-prog"><div class="road-progress-ring">'+ring(k.pct)+'</div>'
      +'<div class="cx-progress-txt"><b>'+k.pct+'% study-track progress</b><div class="cx-progress-sub">'
      +(c.linked ? ((k.trackDone||0)+'/'+(k.trackTotal||0)+' study sections &middot; '+k.qDone+'/'+c.quiz.length+' optional checkpoints &middot; '+k.pDone+'/'+c.projects.length+' optional projects') : (k.lDone+'/'+c.lessons.length+' lessons &middot; '+k.eDone+'/'+c.exercises.length+' exercises &middot; '+k.qDone+'/'+c.quiz.length+' checkpoints &middot; '+k.pDone+'/'+c.projects.length+' projects'))
      +(c.estimatedHours?' &middot; ~'+c.estimatedHours+'h estimated':'')+'</div></div></div>'
      +'<div class="cx-tabs" role="tablist">'
        +tabBtn('overview','Overview')+tabBtn('roadmap','Roadmap')+(c.linked ? '' : tabBtn('lessons','Lessons'))+(c.id==='python' || c.id==='sql' || c.id==='oop' ? '' : tabBtn('exercises','Exercises'))
        +tabBtn('quiz','Checkpoints')+tabBtn('projects','Projects')+tabBtn('interview','Interview Prep')+tabBtn('progress','Progress')+tabBtn('tutor','Tutor')
      +'</div>'
      +'<div id="cxPanels">'
        +panel('overview', overviewHTML(c))
        +panel('roadmap', roadmapHTML(c))
        +(c.linked ? '' : panel('lessons', lessonsHTML(c)))
        +(c.id==='python' || c.id==='sql' || c.id==='oop' ? '' : panel('exercises', exercisesHTML(c)))
        +panel('quiz', quizHTML(c))
        +panel('projects', projectsHTML(c))
        +panel('interview', interviewHTML(c))
        +panel('tutor', cxTutorHTML(c))
        +panel('progress', progressHTML(c))
      +'</div>';
    document.getElementById('cxView').innerHTML = html;
    cxTab(curTab);
    // Initialize any interactive visualizations attached to lessons in this course
    document.querySelectorAll('#cxView [data-viz]').forEach(function(el){
      if(window.cxInitViz) window.cxInitViz(el.getAttribute('data-viz'), el.id);
    });
  }
  function tabBtn(t,label){ return '<button class="cx-tab" role="tab" aria-selected="false" data-act="cxTab(\''+t+'\')" id="cxtab_'+t+'">'+label+'</button>'; }
  function panel(t,inner){ return '<div class="cx-panel" role="tabpanel" id="cxpanel_'+t+'">'+inner+'</div>'; }

  window.cxTab = function(t){
    var TAB_NAMES = ['overview','roadmap','lessons','exercises','quiz','projects','interview','progress','tutor'];
    // Defensive: if the requested tab has no rendered panel at all in the current
    // course (e.g. a stale reference to a removed tab), don't zero out every panel --
    // fall back to whatever tab is currently active, or Overview as a last resort.
    if(!document.getElementById('cxpanel_'+t)){
      var stillValid = curTab && document.getElementById('cxpanel_'+curTab);
      t = stillValid ? curTab : 'overview';
    }
    curTab=t;
    if(window._cxCur && window.aiPathRememberTab) window.aiPathRememberTab(window._cxCur,t);
    TAB_NAMES.forEach(function(x){
      var tab=document.getElementById('cxtab_'+x), pan=document.getElementById('cxpanel_'+x);
      if(tab){ tab.classList.toggle('active', x===t); tab.setAttribute('aria-selected', x===t?'true':'false'); }
      if(pan) pan.classList.toggle('active', x===t);
    });
  };
  window.cxBackToCatalog = function(){ window._cxCur=null; window.cxRenderCatalog(); window.scrollTo(0,0); };

  function overviewHTML(c){
    var lvlLbl = {beginner:'Beginner',intermediate:'Intermediate',advanced:'Advanced',mixed:'Beginner \u2192 Advanced'}[c.level] || 'Beginner \u2192 Advanced';
    var career = c.careerApplications ? '<div class="cx-overview-block"><h3>Why this matters</h3><p>'+esc(c.careerApplications)+'</p></div>' : '';
    var counts_ = c.lessons.length+' lessons &middot; '+c.exercises.length+' exercises &middot; '+c.quiz.length+' checkpoints &middot; '+c.projects.length+' projects';
    var related = '';
    if(c.relatedTracks && c.relatedTracks.length){
      var chips = c.relatedTracks.filter(function(id){return id!==c.id;}).map(function(id){
        var rc=byId(id); if(!rc) return '';
        return '<span class="cx-prereq-chip" data-act="cxOpen(\''+id+'\')" tabindex="0" role="button">'+esc(rc.title)+(isAvailable(rc)?'':' (soon)')+'</span>';
      }).join('');
      if(chips) related = '<div class="cx-overview-block"><h3>Related tracks</h3><div class="cx-prereqs">'+chips+'</div></div>';
    }
    var nextTrack = '';
    if(c.suggestedNext){
      var nc = byId(c.suggestedNext);
      if(nc) nextTrack = '<div class="cx-overview-block"><h3>Suggested next track</h3><div class="cx-prereqs"><span class="cx-prereq-chip" data-act="cxOpen(\''+nc.id+'\')" tabindex="0" role="button">'+esc(nc.title)+(isAvailable(nc)?'':' (soon)')+'</span></div></div>';
    }
    var industry = '';
    if(c.industryUsage && c.industryUsage.length){
      var rows = c.industryUsage.map(function(u){
        return '<div class="cx-industry-row"><b>'+esc(u.company)+':</b> '+esc(u.usage)+'</div>';
      }).join('');
      industry = '<div class="cx-overview-block"><h3>How this is used in industry</h3>'+rows+'</div>';
    }
    return '<div class="cx-overview-block"><h3>What you\'ll learn</h3><p>'+esc(c.description||c.blurb||'')+'</p></div>'
      +'<div class="cx-overview-grid">'
        +'<div class="cx-overview-stat"><b>'+lvlLbl+'</b><span>Level range</span></div>'
        +'<div class="cx-overview-stat"><b>'+(c.estimatedHours?('~'+c.estimatedHours+'h'):'\u2014')+'</b><span>Estimated time</span></div>'
      +'</div>'
      +'<div class="cx-overview-block"><h3>Contents</h3><p>'+counts_+'</p></div>'
      + career + industry + related + nextTrack + (window.cxPracticeLocationHTML ? window.cxPracticeLocationHTML(c) : '');
  }

  function roadmapHTML(c){
    var tiers=[['beginner','Beginner'],['intermediate','Intermediate'],['advanced','Advanced']];
    return tiers.map(function(t){
      var steps=c.roadmap[t[0]].map(function(s){return '<li>'+esc(s)+'</li>';}).join('');
      return '<div class="cx-tier"><div class="cx-tier-h"><span class="cx-tier-badge cx-tb-'+t[0]+'">'+t[1]+'</span><h3>'+t[1]+'</h3></div><ul class="cx-steps">'+steps+'</ul></div>';
    }).join('');
  }
  function lessonsHTML(c){
    if(!c.lessons.length) return '<p class="cx-empty">Lessons for this course are still being written.</p>';
    var st=cs(c.id);
    var tierLbl={beginner:'Beginner',intermediate:'Intermediate',advanced:'Advanced'};
    // Render in displayOrder (a proper pedagogical beginner->intermediate->advanced
    // sequence), never raw array order -- but progress storage below is keyed by
    // lesson.id, not position, so this sort never touches or risks saved progress,
    // and the underlying c.lessons array itself is left completely unmodified.
    var sortedLessons = c.lessons.map(function(l,origIdx){ return {l:l, origIdx:origIdx}; })
      .sort(function(a,b){ return (a.l.displayOrder!=null?a.l.displayOrder:a.origIdx) - (b.l.displayOrder!=null?b.l.displayOrder:b.origIdx); });
    var n = sortedLessons.length;

    // Jump-to-lesson quick nav, grouped by tier
    var jumpPills = sortedLessons.map(function(o,i){
      var l = o.l;
      var done = !!st.lessons[l.id];
      return '<button class="cx-jump-pill'+(done?' done':'')+'" data-act="cxJumpToLesson(\''+c.id+'\','+i+')" title="'+esc(l.title)+'">'
        + (done?'&#10003;':(i+1)) + '</button>';
    }).join('');
    var jumpNav = '<div class="cx-jump-nav" role="navigation" aria-label="Jump to lesson">'+jumpPills+'</div>';

    var lessonsHtml = sortedLessons.map(function(o,i){
      var l = o.l;
      var done=!!st.lessons[l.id];
      var ex = l.example ? '<div class="cx-lesson-ex">'+esc(l.example)+'</div>' : '';
      var con = (l.concepts||[]).map(function(x){return '<span class="cx-concept">'+esc(x)+'</span>';}).join('');
      var tierBadge = l.tier ? '<span class="cx-tier-badge cx-tb-'+l.tier+'" style="margin-right:8px;">'+tierLbl[l.tier]+'</span>' : '';
      var savedResume = window.aiPathGetResume ? window.aiPathGetResume(c.id) : null;
      var lastViewedBadge = savedResume && savedResume.lessonId===l.id ? '<span class="ai-last-viewed">Last viewed</span>' : '';
      var prevBtn = i>0 ? '<button class="cx-lesson-nav-btn" data-act="cxJumpToLesson(\''+c.id+'\','+(i-1)+')">&larr; Previous</button>' : '<span></span>';
      var nextBtn = i<n-1 ? '<button class="cx-lesson-nav-btn cx-lesson-nav-next" data-act="cxJumpToLesson(\''+c.id+'\','+(i+1)+')">Next &rarr;</button>'
                          : '<span class="cx-lesson-nav-end">You\'ve reached the last lesson &mdash; check the Exercises tab next.</span>';
      var viz = vizHTML(l.id, c.id, o.origIdx);
      return '<div class="cx-lesson" id="cxlesson_'+c.id+'_'+i+'"><div class="cx-lesson-h"><h3>'+tierBadge+esc(l.title)+lastViewedBadge+'</h3>'
        +'<button class="cx-done-btn'+(done?' done':'')+'" aria-pressed="'+done+'" data-act="cxToggleLesson(\''+c.id+'\',\''+l.id+'\')">'+(done?'&#10003; Done':'Mark done')+'</button></div>'
        +'<p class="cx-lesson-explain">'+esc(l.explain)+'</p>'+ex+viz
        +'<div class="cx-concepts">'+con+'</div>'
        +'<div class="cx-lesson-nav">'+prevBtn+nextBtn+'</div>'
        +'</div>';
    }).join('');

    return jumpNav + lessonsHtml;
  }
  window.cxJumpToLesson = function(courseId, index){
    var st = cs(courseId);
    var course = byId(courseId);
    if(course && window.aiPathRememberLesson){
      var ordered = course.lessons.map(function(l,origIdx){return {l:l,origIdx:origIdx};}).sort(function(a,b){return (a.l.displayOrder!=null?a.l.displayOrder:a.origIdx)-(b.l.displayOrder!=null?b.l.displayOrder:b.origIdx);});
      if(ordered[index]) window.aiPathRememberLesson(courseId,ordered[index].l.id,index);
    }
    var el = document.getElementById('cxlesson_'+courseId+'_'+index);
    if(el){
      el.scrollIntoView({behavior:'smooth', block:'start'});
      el.classList.add('cx-lesson-flash');
      setTimeout(function(){ el.classList.remove('cx-lesson-flash'); }, 1200);
    }
  };

  var VIZ_REGISTRY = { 'dl-neurons': true, 'tf-selfattention': true };
  function vizHTML(lessonId, courseId, i){
    if(!VIZ_REGISTRY[lessonId]) return '';
    var containerId = 'cxviz_'+courseId+'_'+i;
    if(lessonId === 'dl-neurons'){
      return '<div class="cx-viz-block" id="'+containerId+'" data-viz="'+lessonId+'">'
        + '<div class="cx-viz-title">Try it: adjust the inputs, watch the neuron respond</div>'
        + '<div class="viz-nn-wrap">'
        + '<svg id="'+containerId+'_svg" viewBox="0 0 220 140" class="viz-nn-svg">'
        +   '<line class="viz-edge-1" x1="30" y1="35" x2="150" y2="70" stroke="#4fd1c5" stroke-width="2"/>'
        +   '<line class="viz-edge-2" x1="30" y1="105" x2="150" y2="70" stroke="#b48ef0" stroke-width="2"/>'
        +   '<circle cx="30" cy="35" r="16" fill="#1a2233" stroke="#4fd1c5" stroke-width="2"/>'
        +   '<circle cx="30" cy="105" r="16" fill="#1a2233" stroke="#b48ef0" stroke-width="2"/>'
        +   '<circle class="viz-node-output" cx="150" cy="70" r="20" fill="#3a4152" stroke="#e8ecf3" stroke-width="2"/>'
        +   '<text x="30" y="40" text-anchor="middle" font-size="10" fill="#e8ecf3">x1</text>'
        +   '<text x="30" y="110" text-anchor="middle" font-size="10" fill="#e8ecf3">x2</text>'
        +   '<text x="150" y="74" text-anchor="middle" font-size="9" fill="#e8ecf3">ReLU</text>'
        + '</svg>'
        + '<div class="viz-nn-controls">'
        +   '<label>x1 = <span id="'+containerId+'_x1val">1.0</span><input type="range" id="'+containerId+'_x1" min="-2" max="2" step="0.1" value="1"></label>'
        +   '<label>x2 = <span id="'+containerId+'_x2val">1.0</span><input type="range" id="'+containerId+'_x2" min="-2" max="2" step="0.1" value="1"></label>'
        +   '<div class="viz-nn-readout">z (weighted sum + bias) = <b id="'+containerId+'_z">-</b> &nbsp;&rarr;&nbsp; ReLU output = <b id="'+containerId+'_a">-</b></div>'
        + '</div></div></div>';
    }
    if(lessonId === 'tf-selfattention'){
      var tokens = ['The','bank','by','the','river'];
      var tokenBtns = tokens.map(function(t){ return '<button class="viz-attn-token">'+t+'</button>'; }).join('');
      return '<div class="cx-viz-block" id="'+containerId+'" data-viz="'+lessonId+'">'
        + '<div class="cx-viz-title">Try it: click a token to see what it attends to</div>'
        + '<div class="viz-attn-tokens">'+tokenBtns+'</div>'
        + '<div id="'+containerId+'_bars" class="viz-attn-bars"></div>'
        + '</div>';
    }
    return '';
  }
  function findRelatedLesson(course, exercise){
    // Matches an exercise to its most relevant lesson by concept/keyword overlap --
    // computed at render time from real lesson data, not a hand-authored link (which
    // would require re-tagging ~200 exercises by hand). Falls back to the first lesson
    // so every exercise is still lesson-aware, just less precisely for weak matches.
    if(!course.lessons || !course.lessons.length) return null;
    var text = ((exercise.title||'')+' '+(exercise.prompt||'')).toLowerCase();
    var best = null, bestScore = 0;
    course.lessons.forEach(function(l){
      var score = 0;
      (l.concepts||[]).forEach(function(c){
        if(text.indexOf(String(c).toLowerCase()) !== -1) score += 2;
      });
      String(l.title).toLowerCase().split(/\W+/).forEach(function(w){
        if(w.length>3 && text.indexOf(w)!==-1) score += 1;
      });
      if(score > bestScore){ bestScore = score; best = l; }
    });
    return best || course.lessons[0];
  }

  function exerciseTypeBody(e,c,i){
    // Honest exercise-type rendering (Task 8): only types we can genuinely check are graded;
    // everything else is self-assessed practice -- never a fake grader.
    // Phase 3C.1 (revised): five distinct steps -- try it, then hints 1-3 (nudge, strategy,
    // near-solution guidance WITHOUT code), then a separate Reveal Solution step. Keeping
    // "near-solution" and "the actual solution" as two different steps, rather than
    // collapsing them, preserves the intended productive-struggle progression.
    var type = e.type || 'practice';
    var lesson = findRelatedLesson(c, e);
    var lessonTitle = lesson ? lesson.title : null;
    var concepts = lesson ? (lesson.concepts||[]) : [];
    var topConcepts = concepts.slice(0,2).join(' and ');

    var hint1 = lessonTitle
      ? 'This connects to the lesson "'+lessonTitle+'"'+(topConcepts?' &mdash; focus on '+esc(topConcepts)+'.':'.')
      : 'Re-read the prompt carefully and identify exactly what\'s being asked before writing anything.';
    var hint2 = e.hint ? esc(e.hint) : (lesson && lesson.explain
      ? 'Strategy: '+esc(lesson.explain.split('.')[0])+'.'
      : 'Break the problem into the smallest step you\'re sure about, and start there.');
    // Hint 3: near-solution guidance -- more concrete than the strategy hint, but deliberately
    // NOT the full code (that's Reveal Solution, tier 4). Where the hint contains recognizable
    // SQL clauses, walk through WHY each clause is used, matching how a worked solution should
    // actually teach rather than just repeating tier 2's text with generic filler appended.
    var SQL_CLAUSE_WHY = {
      'SELECT': 'chooses which columns to return',
      'DISTINCT': 'removes duplicate rows from the result',
      'WHERE': 'filters individual rows before any grouping happens',
      'GROUP BY': 'collapses rows into groups so an aggregate can summarize each one',
      'HAVING': 'filters those groups AFTER aggregation, unlike WHERE which filters before',
      'ORDER BY': 'sorts the result set',
      'DESC': 'sorts highest-to-lowest instead of the default ascending order',
      'ASC': 'sorts lowest-to-highest, the default order',
      'LIMIT': 'caps how many rows come back, instead of returning everything that matches',
      'JOIN': 'combines rows from two tables based on a matching key',
      'INNER JOIN': 'keeps only rows that match in both tables',
      'LEFT JOIN': 'keeps all rows from the left table, even without a match on the right'
    };
    function buildClauseWalkthrough(hintText){
      var found = [];
      var upper = hintText.toUpperCase();
      Object.keys(SQL_CLAUSE_WHY).forEach(function(clause){
        if(upper.indexOf(clause) !== -1) found.push(clause);
      });
      // longer/more-specific clauses (e.g. "LEFT JOIN") make their shorter substring
      // (e.g. "JOIN") redundant to explain separately -- keep only the most specific match
      found = found.filter(function(c){
        return !found.some(function(other){ return other !== c && other.indexOf(c) !== -1 && other.length > c.length; });
      });
      if(!found.length) return null;
      var lines = found.map(function(c){ return '<code>'+esc(c)+'</code> '+SQL_CLAUSE_WHY[c]+'.'; });
      return 'Here\'s the shape of one approach: <code>'+esc(hintText)+'</code><br>' + lines.join('<br>');
    }
    var clauseWalkthrough = e.hint ? buildClauseWalkthrough(e.hint) : null;
    var hint3;
    if(clauseWalkthrough){
      hint3 = clauseWalkthrough;
    } else if(lesson && lesson.explain){
      // draw on MORE of the lesson's real explanation than hint2 used (hint2 only
      // takes the first sentence) -- genuinely new information, not a repeat
      var fullerExplain = esc(lesson.explain);
      hint3 = 'Here\'s the relevant idea in full: ' + fullerExplain
        + (lesson.example ? '<br><span class="cx-hint-example-note">See the worked example in the lesson above for a concrete case.</span>' : '');
    } else {
      hint3 = 'Try writing out the steps in plain language first, before any code -- then convert each step one at a time.';
    }

    var solutionBody = e.solution
      ? '<p class="cx-reveal-label">Solution:</p><pre>'+esc(e.solution)+'</pre>'
      : (lesson && lesson.example
          ? '<p class="cx-reveal-fallback-note">A full solution hasn\'t been authored for this exercise yet. Here\'s the closest lesson example instead:</p><pre>'+esc(lesson.example)+'</pre>'
          : '<p class="cx-reveal-fallback-note">A full solution hasn\'t been authored for this exercise yet.</p>');
    var solutionNote = '<p class="cx-reveal-note">Viewing this won\'t mark the exercise as completed &mdash; use "Mark completed" below once you\'re satisfied with your own attempt.</p>';

    var hintBtns = '<button class="cx-hint-btn" data-act="cxRevealHint(\''+c.id+'_'+i+'\',1)">Hint 1 &mdash; nudge</button>'
      + '<button class="cx-hint-btn" data-act="cxRevealHint(\''+c.id+'_'+i+'\',2)">Hint 2 &mdash; strategy</button>'
      + '<button class="cx-hint-btn" data-act="cxRevealHint(\''+c.id+'_'+i+'\',3)">Hint 3 &mdash; near-solution</button>'
      + '<button class="cx-hint-btn cx-reveal-sol-btn" data-act="cxRevealHint(\''+c.id+'_'+i+'\',4)">Reveal Solution</button>';
    var revBox = '<div class="cx-reveal" id="cxrev_'+c.id+'_'+i+'">'
      + '<div class="cx-hint-tier" id="cxhint1_'+c.id+'_'+i+'" style="display:none"><b>Nudge:</b> '+hint1+'</div>'
      + '<div class="cx-hint-tier" id="cxhint2_'+c.id+'_'+i+'" style="display:none"><b>Strategy:</b> '+hint2+'</div>'
      + '<div class="cx-hint-tier" id="cxhint3_'+c.id+'_'+i+'" style="display:none"><b>Near-solution:</b> '+hint3+'</div>'
      + '<div class="cx-hint-tier cx-reveal-sol" id="cxhint4_'+c.id+'_'+i+'" style="display:none">'+solutionBody+solutionNote+'</div>'
      + '</div>';

    var runBox = '';
    if(e.runnable && e.starterCode){
      var editId = 'cxrunedit_'+c.id+'_'+i, outId = 'cxrunout_'+c.id+'_'+i, crId = 'cxruncr_'+c.id+'_'+i;
      runBox = '<div class="cx-runbox">'
        + '<div class="cx-runbox-label">Try it &mdash; runs real Python in your browser. This runs your code and shows the output; it does not auto-grade correctness.</div>'
        + '<textarea class="cx-runbox-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false">'+esc(e.starterCode)+'</textarea>'
        + '<button class="cx-runbox-btn" data-act="runEditor(\''+editId+'\',\''+outId+'\')">&#9654; Run</button>'
        + '<button class="cr-review-btn" id="crbtn_'+crId+'" data-act="cxReviewPython(\''+editId+'\',\''+crId+'\',\''+c.id+'\','+i+')">&#128269; Review my code</button>'
        + '<div class="out" id="'+outId+'"></div>'
        + '<div id="'+crId+'" aria-live="polite"></div>'
        + '</div>';
    }
    var pmBox = (!runBox && window.cxRenderPracticeMode) ? window.cxRenderPracticeMode(c, i, e) : '';
    return {rev:hintBtns, revBox:revBox, runBox:runBox || pmBox};
  }
  window.cxRevealHint = function(key, tier){
    for(var t=1;t<=4;t++){
      var el = document.getElementById('cxhint'+t+'_'+key);
      if(el) el.style.display = (t<=tier) ? 'block' : 'none';
    }
    // FIX (regression found in v3.1.1, confirmed pre-existing): the outer
    // wrapper (#cxrev_<key>) defaults to display:none via its own CSS rule
    // (.cx-reveal{display:none}) and only becomes visible via a SEPARATE
    // '.show' class (.cx-reveal.show{display:block}). This function was
    // toggling the inner .cx-hint-tier divs' own inline display correctly,
    // but never added/removed '.show' on the outer wrapper itself -- so the
    // whole box stayed permanently hidden regardless of the inner divs'
    // state, on every exercise, in every course except Python/SQL's separate
    // (differently-built) interactive track.
    var wrap = document.getElementById('cxrev_'+key);
    if(wrap) wrap.classList.toggle('show', tier >= 1);
  };
  function exercisesHTML(c){
    if(!c.exercises.length) return '<p class="cx-empty">Exercises for this course are still being written.</p>';
    var st=cs(c.id);
    var sorted=c.exercises.map(function(e,i){return {e:e,i:i};}).sort(function(a,b){return a.e.difficulty-b.e.difficulty;});
    return sorted.map(function(o){
      var e=o.e,i=o.i,done=!!st.exercises[i];
      var dn={1:'Easy',2:'Medium',3:'Hard'}[e.difficulty];
      var body = exerciseTypeBody(e,c,i);
      return '<div class="cx-ex"><div class="cx-ex-h"><span class="cx-diff cx-d'+e.difficulty+'">'+dn+'</span><h3>'+esc(e.title)+'</h3></div>'
        +'<p class="cx-ex-prompt">'+esc(e.prompt)+'</p>'
        +body.runBox
        +'<div class="cx-ex-actions">'+body.rev
        +'<button class="cx-done-btn'+(done?' done':'')+'" aria-pressed="'+done+'" data-act="cxToggleEx(\''+c.id+'\','+i+')">'+(done?'&#10003; Completed':'Mark completed')+'</button></div>'
        +body.revBox+'</div>';
    }).join('');
  }
  function quizHTML(c){
    if(!c.quiz.length) return '<p class="cx-empty">Checkpoints for this course are still being written.</p>';
    var st=cs(c.id);
    return c.quiz.map(function(q,i){
      var answered = st.quiz[i]!==undefined;
      var opts=q.options.map(function(o,oi){
        var cls='cx-opt';
        if(answered){ if(oi===q.correct) cls+=' correct'; else if(st.quiz[i]===oi && oi!==q.correct) cls+=' wrong'; }
        return '<button class="'+cls+'" '+(answered?'disabled':'')+' data-act="cxAnswer(\''+c.id+'\','+i+','+oi+')">'+esc(o)+'</button>';
      }).join('');
      var fbcls = answered ? (st.quiz[i]===q.correct?'cx-quiz-fb show':'cx-quiz-fb show') : 'cx-quiz-fb';
      var fbcolor = answered ? (st.quiz[i]===q.correct?'color:var(--cteal)':'color:#f0879a') : '';
      var fbtxt = answered ? (st.quiz[i]===q.correct?'&#10003; Correct':'Not quite &mdash; the highlighted answer is right') : '';
      return '<div class="cx-quiz"><p class="cx-quiz-q">'+(i+1)+'. '+esc(q.q)+'</p><div class="cx-opts">'+opts+'</div>'
        +'<div class="'+fbcls+'" style="'+fbcolor+'" id="cxfb_'+c.id+'_'+i+'" aria-live="polite">'+fbtxt+'</div></div>';
    }).join('');
  }
  function projectsHTML(c){
    var capstoneHtml = '';
    if(c.capstone){
      var cap = c.capstone;
      var delivs = (cap.deliverables||[]).map(function(d){return '<li>'+esc(d)+'</li>';}).join('');
      capstoneHtml = '<div class="cx-capstone"><div class="cx-capstone-badge">Capstone</div>'
        + '<h3>'+esc(cap.title)+'</h3>'
        + '<p class="cx-proj-desc">'+esc(cap.description)+'</p>'
        + (delivs ? '<p class="cx-capstone-label">This project should include:</p><ul class="cx-capstone-deliverables">'+delivs+'</ul>' : '')
        + (cap.portfolioTips ? '<div class="cx-capstone-portfolio"><b>Portfolio guidance:</b> '+esc(cap.portfolioTips)+'</div>' : '')
        + '<button class="cx-tutor-action-btn pf-add-btn" data-act="pfAddFromCapstone(\''+c.id+'\')">+ Add to Portfolio</button>'
        + '</div>';
    }
    if(!c.projects.length) return capstoneHtml || '<p class="cx-empty">Projects for this course are still being written.</p>';
    var st=cs(c.id);
    var lvlName={1:'Starter',2:'Intermediate',3:'Advanced'};
    var sorted=c.projects.map(function(p,i){return {p:p,i:i};}).sort(function(a,b){return a.p.level-b.p.level;});
    return capstoneHtml + sorted.map(function(o){
      var p=o.p, i=o.i, done=!!(st.projects && st.projects[p.id]);
      var editId = 'cxprojsub_'+c.id+'_'+i, outId = 'cxprojfb_'+c.id+'_'+i;
      return '<div class="cx-proj"><div class="cx-proj-num">'+p.level+'</div><div class="cx-proj-body">'
        +'<div class="cx-proj-h"><h3>'+esc(p.title)+'</h3><span class="cx-diff cx-d'+p.level+'">'+lvlName[p.level]+'</span></div>'
        +'<p class="cx-proj-desc">'+esc(p.desc)+'</p>'
        +'<button class="cx-done-btn'+(done?' done':'')+'" aria-pressed="'+done+'" data-act="cxToggleProject(\''+c.id+'\',\''+p.id+'\')">'+(done?'&#10003; Completed':'Mark completed')+'</button>'
        +'<button class="cx-tutor-action-btn pf-add-btn" data-act="pfAddFromCourseProject(\''+c.id+'\',\''+p.id+'\')">+ Add to Portfolio</button>'
        +'<div class="cx-projfb-block">'
          +'<textarea class="cx-projfb-edit" id="'+editId+'" aria-label="Project code or description for feedback" placeholder="Paste your project code (or a short description of your approach) here for structured feedback..." spellcheck="false"></textarea>'
          +'<button class="cx-tutor-action-btn" id="pfbtn_'+outId+'" data-act="cxSubmitProjectFeedback(\''+c.id+'\','+i+',\''+editId+'\',\''+outId+'\')">Get Feedback</button>'
          +'<div id="'+outId+'" aria-live="polite"></div>'
        +'</div>'
        +'</div></div>';
    }).join('');
  }
  function interviewHTML(c){
    if(!c.interviewPreparation || !c.interviewPreparation.length){
      return '<p class="cx-empty">Interview-prep content for '+esc(c.title)+' hasn\'t been written yet &mdash; it\'s on the roadmap. '
        + 'In the meantime, the <a href="javascript:void(0)" data-act="showTrack(\'courses\')">Interview Preparation course</a> covers the general process.</p>';
    }
    return c.interviewPreparation.map(function(q){
      return '<div class="cx-ex"><h3>'+esc(q.q||q)+'</h3>'+(q.a?'<p class="cx-ex-prompt">'+esc(q.a)+'</p>':'')+'</div>';
    }).join('');
  }

  // ============ LEARNING TUTOR (Phase 3C.4) ============
  // Curated, context-aware guidance from getLessonContext() -- NOT a chat, and NOT
  // connected to any model (this platform has no backend/API key to call one safely).
  // Every section states plainly what real data it drew from.
  var _tutorState = null; // {courseId, lessonIndex, exerciseIndex} -- UI selection only, not persisted
  function findBestConceptMatch(course, text){
    var best = null, bestScore = 0;
    (course.lessons||[]).forEach(function(l){
      (l.concepts||[]).forEach(function(cpt){
        var cLower = String(cpt).toLowerCase();
        if(text.indexOf(cLower) !== -1 && cLower.length > bestScore){ bestScore = cLower.length; best = l; }
      });
    });
    return best;
  }
  function tutorConceptTag(course, quizQ){
    // same honest keyword-overlap technique as 3C.1/3C.3 -- no per-question authored
    // explanation exists in the data model, so the closest real material is the
    // concept-matched lesson's own explanation, clearly labeled as such.
    //
    // Priority 1: match using the question text + the CORRECT answer's text only.
    // Remediation should point to the lesson that teaches what the learner actually
    // got wrong, not wherever their mistaken choice happens to appear -- a wrong
    // answer's own text can coincidentally match an unrelated lesson (e.g. choosing
    // "WHERE" on a HAVING question used to match "SELECT basics" instead of
    // "Aggregation", since WHERE is a SELECT-basics concept, not because it was
    // the right remediation).
    if(typeof quizQ.correct === 'number' && quizQ.options && quizQ.options[quizQ.correct] != null){
      var correctText = (quizQ.q + ' ' + quizQ.options[quizQ.correct]).toLowerCase();
      var correctMatch = findBestConceptMatch(course, correctText);
      if(correctMatch) return correctMatch;
    }
    // Priority 2 (fallback only, if the question + correct answer alone matched no
    // concept): broaden to the full question + all options text, as before --
    // better to surface some related lesson than none.
    var fullText = (quizQ.q + ' ' + (quizQ.options||[]).join(' ')).toLowerCase();
    return findBestConceptMatch(course, fullText);
  }

  function cxTutorHTML(c){
    if(!_tutorState || _tutorState.courseId !== c.id){
      var st0 = cs(c.id);
      var sortedForDefault = c.lessons.map(function(l,i){ return {l:l, i:i}; })
        .sort(function(a,b){ return (a.l.displayOrder!=null?a.l.displayOrder:a.i) - (b.l.displayOrder!=null?b.l.displayOrder:b.i); });
      var firstIncomplete = sortedForDefault.find(function(o){ return !(st0.lessons && st0.lessons[o.l.id]); });
      var defLesson = firstIncomplete ? firstIncomplete.i : (c.lessons.length ? sortedForDefault[0].i : -1);
      var defEx = (c.id==='python' || c.id==='sql' || c.id==='oop') ? -1 : c.exercises.findIndex(function(_,i){ return !(st0.exercises&&st0.exercises[i]); });
      _tutorState = { courseId: c.id, lessonIndex: defLesson, exerciseIndex: defEx };
    }
    var lessonIdx = _tutorState.lessonIndex, exIdx = _tutorState.exerciseIndex;
    var ctx = window.getLessonContext ? window.getLessonContext(c.id, lessonIdx>=0?lessonIdx:null, exIdx>=0?exIdx:null) : null;

    var lessonOpts = '<option value="-1">Select a lesson…</option>' + c.lessons.map(function(l,i){
      return '<option value="'+i+'"'+(i===lessonIdx?' selected':'')+'>'+esc(l.title)+'</option>';
    }).join('');
    // Python/SQL/OOP's course.exercises field is stale (their real exercises live in the
    // shared exercise bank now, indexed by ID rather than array position) -- omit this
    // selector for those three rather than showing outdated or removed exercise titles.
    var showExSelector = !(c.id==='python' || c.id==='sql' || c.id==='oop');
    var exOpts = '<option value="-1">Select an exercise…</option>' + (showExSelector ? c.exercises.map(function(e,i){
      return '<option value="'+i+'"'+(i===exIdx?' selected':'')+'>'+esc(e.title)+'</option>';
    }).join('') : '');

    var html = '<div class="cx-tutor-pickers">'
      + '<label>Lesson: <select id="cxTutorLessonSel" data-change="cxTutorSelectLesson(\''+c.id+'\')">'+lessonOpts+'</select></label>'
      + (showExSelector ? '<label>Exercise: <select id="cxTutorExerciseSel" data-change="cxTutorSelectExercise(\''+c.id+'\')">'+exOpts+'</select></label>' : '')
      + '</div>';

    // ---- 1. Explain this concept ----
    html += '<div class="cx-tutor-section"><h3>Explain this concept</h3>';
    if(lessonIdx>=0 && c.lessons[lessonIdx]){
      var les = c.lessons[lessonIdx];
      html += '<p class="cx-tutor-based">Based on: the lesson "'+esc(les.title)+'".</p>'
        + '<p class="cx-lesson-explain">'+esc(les.explain)+'</p>'
        + (les.example ? '<div class="cx-lesson-ex">'+esc(les.example)+'</div>' : '');
    } else {
      html += '<p class="cx-empty">No lesson selected — pick one above to get its real explanation and example.</p>';
    }
    html += '</div>';

    // ---- 2. What should I review first? ----
    html += '<div class="cx-tutor-section"><h3>What should I review first?</h3>';
    if(ctx){
      var incompletePrereqs = (ctx.prerequisites||[]).filter(function(p){ return !p.complete; });
      var wrongConcepts = {};
      (ctx.quizHistory||[]).forEach(function(qh){ if(!qh.correct){ wrongConcepts[qh.question] = true; } });
      var wrongCount = Object.keys(wrongConcepts).length;
      if(incompletePrereqs.length){
        html += '<p class="cx-tutor-based">Based on: '+incompletePrereqs.length+' unfinished prerequisite course'+(incompletePrereqs.length>1?'s':'')+'.</p>'
          + '<ul class="cx-tutor-list">'+incompletePrereqs.map(function(p){ return '<li>Finish <b>'+esc(p.title)+'</b> first — it\'s a prerequisite for this course.</li>'; }).join('')+'</ul>';
      } else if(wrongCount){
        html += '<p class="cx-tutor-based">Based on: '+wrongCount+' incorrect quiz answer'+(wrongCount>1?'s':'')+' in this course.</p>'
          + '<ul class="cx-tutor-list">'+(ctx.quizHistory||[]).filter(function(q){return !q.correct;}).slice(0,3).map(function(q){
              return '<li>Revisit the question "'+esc(q.question)+'" — you missed this one.</li>';
            }).join('')+'</ul>';
      } else if((ctx.prerequisites||[]).length && incompletePrereqs.length===0){
        html += '<p class="cx-empty">Prerequisites already complete, and no quiz mistakes on record — you\'re clear to keep moving forward.</p>';
      } else {
        html += '<p class="cx-empty">No quiz mistakes yet, and no prerequisites are pending. Nothing specific to flag.</p>';
      }
    } else {
      html += '<p class="cx-empty">No lesson selected — pick one above.</p>';
    }
    html += '</div>';

    // ---- 3. Help with this exercise ----
    html += '<div class="cx-tutor-section"><h3>Help with this exercise</h3>';
    if(exIdx>=0 && c.exercises[exIdx]){
      html += '<p class="cx-tutor-based">Based on: the exercise "'+esc(c.exercises[exIdx].title)+'".</p>'
        + '<button class="cx-tutor-action-btn" data-act="cxTutorOpenHints(\''+c.id+'\','+exIdx+')">Open 3-tier hints for this exercise &rarr;</button>';
    } else {
      html += '<p class="cx-empty">No current exercise selected — pick one above.</p>';
    }
    html += '</div>';

    // ---- 4. Why was my answer wrong? ----
    html += '<div class="cx-tutor-section"><h3>Why was my answer wrong?</h3>';
    var wrongAnswers = ctx ? (ctx.quizHistory||[]).filter(function(q){ return !q.correct; }) : [];
    if(wrongAnswers.length){
      html += '<p class="cx-tutor-based">Based on: your actual answers to '+wrongAnswers.length+' question'+(wrongAnswers.length>1?'s':'')+' in this course.</p>';
      wrongAnswers.slice(0,3).forEach(function(qh){
        var qObj = c.quiz.find(function(q){ return q.q === qh.question; });
        var matchedLesson = qObj ? tutorConceptTag(c, qObj) : null;
        html += '<div class="cx-tutor-wronganswer">'
          + '<p class="cx-tutor-qtext">"'+esc(qh.question)+'"</p>'
          + (qObj ? '<p class="cx-tutor-answers">You chose: <i>'+esc(qObj.options[qh.chosenIndex])+'</i> &middot; Correct: <b>'+esc(qObj.options[qObj.correct])+'</b></p>' : '')
          + (matchedLesson ? '<p class="cx-tutor-answers">Closest related lesson: <b>'+esc(matchedLesson.title)+'</b> — '+esc(matchedLesson.explain.split('.')[0])+'.</p>'
                            : '<p class="cx-tutor-answers">No specific lesson explanation matched this question automatically.</p>')
          + '</div>';
      });
    } else if(ctx && (ctx.quizHistory||[]).length){
      html += '<p class="cx-empty">No quiz mistakes yet in this course — nice work.</p>';
    } else {
      html += '<p class="cx-empty">You haven\'t answered any quiz questions in this course yet.</p>';
    }
    html += '</div>';

    // ---- 5. Give me a practice plan ----
    html += '<div class="cx-tutor-section"><h3>Give me a practice plan</h3>';
    var kk = counts(c);
    if(kk.pct >= 100){
      html += '<p class="cx-tutor-based">Based on: this course is 100% complete.</p>'
        + '<p class="cx-empty">Course fully completed — nothing left to recommend here.'
        + (c.suggestedNext ? ' Consider <a href="javascript:void(0)" data-act="cxOpen(\''+c.suggestedNext+'\')">'+esc(byId(c.suggestedNext)?byId(c.suggestedNext).title:c.suggestedNext)+'</a> next.' : '')
        + '</p>';
    } else {
      var st1=cs(c.id);
      var incompleteLessons = c.lessons.slice().sort(function(a,b){ return (a.displayOrder!=null?a.displayOrder:0) - (b.displayOrder!=null?b.displayOrder:0); })
        .filter(function(l){ return !(st1.lessons&&st1.lessons[l.id]); }).slice(0,2)
        .map(function(l){ return {l:l}; });
      var planBasis = [];
      var steps = [];
      incompleteLessons.forEach(function(o){ steps.push('Finish the lesson "'+esc(o.l.title)+'".'); });
      if(incompleteLessons.length) planBasis.push(incompleteLessons.length+' unfinished lesson'+(incompleteLessons.length>1?'s':''));
      var wrongQs = ctx ? (ctx.quizHistory||[]).filter(function(q){return !q.correct;}) : [];
      if(wrongQs.length){
        var wq = c.quiz.find(function(q){ return q.q === wrongQs[0].question; });
        var ml = wq ? tutorConceptTag(c, wq) : null;
        if(ml){ steps.push('Review the concept behind "'+esc(ml.title)+'" — a recent quiz answer on this was incorrect.'); planBasis.push('your last '+wrongQs.length+' incorrect quiz answer'+(wrongQs.length>1?'s':'')); }
      }
      if(!steps.length) steps.push('Try the next exercise in the Exercises tab.');
      html += '<p class="cx-tutor-based">Based on: '+(planBasis.length?planBasis.join(' and '):'your current progress in this course')+'.</p>'
        + '<ol class="cx-tutor-list">'+steps.map(function(s){return '<li>'+s+'</li>';}).join('')+'</ol>';
    }
    html += '</div>';

    // ---- 6. Review my code ----
    html += '<div class="cx-tutor-section"><h3>Review my code</h3>';
    if(exIdx>=0 && c.exercises[exIdx] && c.exercises[exIdx].runnable){
      html += '<p class="cx-tutor-based">Based on: the exercise "'+esc(c.exercises[exIdx].title)+'" has a live code editor.</p>'
        + '<button class="cx-tutor-action-btn" data-act="cxTutorOpenReview(\''+c.id+'\','+exIdx+')">Open code review for this exercise &rarr;</button>';
    } else if(exIdx>=0 && c.exercises[exIdx]){
      html += '<p class="cx-empty">This exercise doesn\'t have a live code editor here, so there\'s no code to review. Code review is available on runnable exercises (marked "Try it"), and in the interactive Python/SQL/OOP tracks.</p>';
    } else {
      html += '<p class="cx-empty">No current exercise selected — pick one above.</p>';
    }
    html += '</div>';

    return html;
  }
  window.cxTutorSelectLesson = function(courseId){
    var sel = document.getElementById('cxTutorLessonSel');
    _tutorState = _tutorState || {courseId:courseId};
    _tutorState.courseId = courseId;
    _tutorState.lessonIndex = parseInt(sel.value, 10);
    var el = document.getElementById('cxpanel_tutor'); var c = byId(courseId);
    if(el && c) el.innerHTML = cxTutorHTML(c);
  };
  window.cxTutorSelectExercise = function(courseId){
    var sel = document.getElementById('cxTutorExerciseSel');
    _tutorState = _tutorState || {courseId:courseId};
    _tutorState.courseId = courseId;
    _tutorState.exerciseIndex = parseInt(sel.value, 10);
    var el = document.getElementById('cxpanel_tutor'); var c = byId(courseId);
    if(el && c) el.innerHTML = cxTutorHTML(c);
  };
  window.cxTutorOpenHints = function(courseId, exIdx){
    cxTab('exercises');
    setTimeout(function(){
      var key = courseId+'_'+exIdx;
      if(window.cxRevealHint) window.cxRevealHint(key, 1);
      var el = document.getElementById('cxrev_'+key);
      if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
    }, 80);
  };
  window.cxTutorOpenReview = function(courseId, exIdx){
    cxTab('exercises');
    setTimeout(function(){
      var editId = 'cxrunedit_'+courseId+'_'+exIdx, outId = 'cxruncr_'+courseId+'_'+exIdx;
      if(window.cxReviewPython) window.cxReviewPython(editId, outId, courseId, exIdx);
      var el = document.getElementById(editId);
      if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
    }, 80);
  };

  function progressHTML(c){
    var k=counts(c);
    if(c.linked){
      return '<div class="cx-prog-cards">'
        +'<div class="cx-prog-card"><div class="cx-prog-num" style="color:#7ee0a0">'+(k.trackDone||0)+'/'+(k.trackTotal||0)+'</div><div class="cx-prog-lbl">Study sections</div></div>'
        +'<div class="cx-prog-card"><div class="cx-prog-num" style="color:#8ec1f0">'+k.qDone+'/'+c.quiz.length+'</div><div class="cx-prog-lbl">Optional checkpoints</div></div>'
        +'<div class="cx-prog-card"><div class="cx-prog-num" style="color:#f0879a">'+k.pDone+'/'+c.projects.length+'</div><div class="cx-prog-lbl">Optional projects</div></div>'
        +'<div class="cx-prog-card"><div class="cx-prog-num" style="color:var(--cpurple)">'+k.pct+'%</div><div class="cx-prog-lbl">Course progress</div></div>'
        +'</div><p class="cx-progress-sub">The dedicated study track is the single source of course progress. Quizzes and projects remain optional supporting resources.</p>'
        +'<button class="cx-reset" data-act="cxResetCourse(\''+c.id+'\')">Reset this course\'s progress</button>';
    }
    return '<div class="cx-prog-cards">'
      +'<div class="cx-prog-card"><div class="cx-prog-num" style="color:#7ee0a0">'+k.lDone+'/'+c.lessons.length+'</div><div class="cx-prog-lbl">Lessons</div></div>'
      +'<div class="cx-prog-card"><div class="cx-prog-num" style="color:var(--cgold)">'+k.eDone+'/'+c.exercises.length+'</div><div class="cx-prog-lbl">Exercises</div></div>'
      +'<div class="cx-prog-card"><div class="cx-prog-num" style="color:#8ec1f0">'+k.qDone+'/'+c.quiz.length+'</div><div class="cx-prog-lbl">Checkpoints</div></div>'
      +'<div class="cx-prog-card"><div class="cx-prog-num" style="color:#f0879a">'+k.pDone+'/'+c.projects.length+'</div><div class="cx-prog-lbl">Projects</div></div>'
      +'<div class="cx-prog-card"><div class="cx-prog-num" style="color:var(--cpurple)">'+k.pct+'%</div><div class="cx-prog-lbl">Overall</div></div>'
      +'</div><button class="cx-reset" data-act="cxResetCourse(\''+c.id+'\')">Reset this course\'s progress</button>';
  }

  // ---------- actions ----------
  function refresh(){ if(window._cxCur) renderDetail(window._cxCur); }
  window.cxToggleLesson=function(courseId,lessonId){ var s=cs(courseId); s.lessons[lessonId]=!s.lessons[lessonId]; var nowDone=s.lessons[lessonId]; if(!nowDone)delete s.lessons[lessonId]; if(window.aiPathRememberLesson){ var c=byId(courseId),idx=0; if(c){ var ordered=c.lessons.map(function(l,origIdx){return {l:l,origIdx:origIdx};}).sort(function(a,b){return (a.l.displayOrder!=null?a.l.displayOrder:a.origIdx)-(b.l.displayOrder!=null?b.l.displayOrder:b.origIdx);}); for(var i=0;i<ordered.length;i++)if(ordered[i].l.id===lessonId){idx=i;break;} } window.aiPathRememberLesson(courseId,lessonId,idx); } cxsave(); refresh(); if(nowDone && window.cxLogActivity) window.cxLogActivity('lessons', 1); };
  window.cxToggleEx=function(id,i){ var s=cs(id); s.exercises[i]=!s.exercises[i]; var nowDone=s.exercises[i]; if(!nowDone)delete s.exercises[i]; cxsave(); refresh(); if(nowDone && window.cxLogActivity) window.cxLogActivity('exercises', 1); };
  window.cxAnswer=function(id,i,oi){ var s=cs(id); if(s.quiz[i]!==undefined)return; s.quiz[i]=oi; cxsave(); refresh();
    var c = byId(id); var correct = c && c.quiz[i] && c.quiz[i].correct === oi;
    if(window.cxLogActivity) window.cxLogActivity('quiz', 1, correct);
    if(window.cxTagQuizQuestion && window.cxLogQuizAttempt){
      var concept = window.cxTagQuizQuestion(id, i);
      if(concept) window.cxLogQuizAttempt(concept, correct);
    } };
  window.cxToggleProject=function(id,projectId){ var s=cs(id); s.projects[projectId]=!s.projects[projectId]; var nowDone=s.projects[projectId]; if(!nowDone)delete s.projects[projectId]; cxsave(); refresh(); if(nowDone && window.cxLogActivity) window.cxLogActivity('projects', 1); };
  window.cxReveal=function(key){ var el=document.getElementById('cxrev_'+key); if(el) el.classList.toggle('show'); };
  window.cxResetCourse=function(id){ if(confirm('Reset progress for this course?')){
    cxstate[id]={lessons:{},exercises:{},quiz:{},projects:{}}; cxsave();
    try{var raw=localStorage.getItem('ai_path_resume_v1'),state=raw?JSON.parse(raw):{};if(state&&state.courses&&state.courses[id])delete state.courses[id];if(state&&state.lastCourseId===id)state.lastCourseId=null;localStorage.setItem('ai_path_resume_v1',JSON.stringify(state));}catch(e){}
    refresh(); if(window.updateSingleCourseTrackPanel)window.updateSingleCourseTrackPanel();
  } };

  (function migrateLessonProgressToIds(){
    // v3.2: one-time migration of lesson progress from array-index keys to
    // stable lesson-ID keys. Must run BEFORE cxload() populates cxstate from
    // localStorage -- otherwise cxstate caches the pre-migration shape for the
    // rest of this session even though localStorage itself gets updated correctly,
    // which is exactly the bug this ordering fixes (caught by testing the full
    // migration path, not just checking localStorage in isolation).
    var MIGKEY = 'platform_lesson_migration_v1';
    try{
      if(localStorage.getItem(MIGKEY) === '1') return;
      var raw = localStorage.getItem(CXLS);
      var progress = raw ? JSON.parse(raw) : {};
      var migratedAny = false;
      COURSES.forEach(function(c){
        var st = progress[c.id];
        if(!st || !st.lessons) return;
        var oldLessons = st.lessons;
        var newLessons = {};
        var alreadyIdKeyed = true;
        Object.keys(oldLessons).forEach(function(key){
          if(!oldLessons[key]) return;
          if(/^\d+$/.test(key)){
            alreadyIdKeyed = false;
            var lesson = c.lessons[parseInt(key, 10)];
            if(lesson && lesson.id){ newLessons[lesson.id] = true; }
          } else {
            newLessons[key] = true;
          }
        });
        if(!alreadyIdKeyed){ st.lessons = newLessons; migratedAny = true; }
      });
      if(migratedAny){ localStorage.setItem(CXLS, JSON.stringify(progress)); }
      localStorage.setItem(MIGKEY, '1');
    }catch(e){ /* never let a migration bug block the app from loading */ }
  })();

  (function migrateProjectProgressToIds(){
    // v3.3: one-time migration of project progress from array-index keys to
    // stable project-ID keys, exactly mirroring the v3.2 lesson-ID migration --
    // same reasoning: array indices break if a project is ever reordered, and
    // this must run BEFORE cxload() populates cxstate, for the same caching
    // reason the lesson migration documents above.
    var PMIGKEY = 'platform_project_migration_v1';
    try{
      if(localStorage.getItem(PMIGKEY) === '1') return;
      var praw = localStorage.getItem(CXLS);
      var pprogress = praw ? JSON.parse(praw) : {};
      var pMigratedAny = false;
      COURSES.forEach(function(c){
        var st = pprogress[c.id];
        if(!st || !st.projects) return;
        var oldProjects = st.projects;
        var newProjects = {};
        var alreadyIdKeyed = true;
        Object.keys(oldProjects).forEach(function(key){
          if(!oldProjects[key]) return;
          if(/^\d+$/.test(key)){
            alreadyIdKeyed = false;
            var project = c.projects[parseInt(key, 10)];
            if(project && project.id){ newProjects[project.id] = true; }
          } else {
            newProjects[key] = true;
          }
        });
        if(!alreadyIdKeyed){ st.projects = newProjects; pMigratedAny = true; }
      });
      if(pMigratedAny){ localStorage.setItem(CXLS, JSON.stringify(pprogress)); }
      localStorage.setItem(PMIGKEY, '1');
    }catch(e){ /* never let a migration bug block the app from loading */ }
  })();

  cxload();
  window._cxCur=null;
})();
