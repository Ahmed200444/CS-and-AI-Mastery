
(function(){
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
  var PFLS = 'portfolio_v1';
  var _pfCur = null;

  function getCourses(){ try{ return (window.__CSAI_COURSES__||(window.__CSAI_COURSES__=JSON.parse(document.getElementById('coursedata').textContent))); }catch(e){ return []; } }
  function byId(courses, id){ return courses.find(function(c){ return c.id===id; }); }

  function loadPortfolio(){
    try{
      var raw = JSON.parse(localStorage.getItem(PFLS));
      if(raw && raw.entries) return raw;
    }catch(e){}
    return {entries:{}, evidence:{}, reflection:{}};
  }
  function savePortfolio(pf){ try{ localStorage.setItem(PFLS, JSON.stringify(pf)); }catch(e){} }

  function genId(){ return 'pf_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8); }

  var MILESTONE_KEYS = ['planned','building','testing','deployed','documented'];
  function blankMilestones(){
    var m = {};
    MILESTONE_KEYS.forEach(function(k){ m[k] = {done:false, notApplicable:false, reason:''}; });
    return m;
  }

  // source: {type: 'course-project'|'course-capstone'|'custom', courseId, projectId}
  // projectId links to a project's STABLE id (never array index) -- courses now
  // carry real project ids (python-proj-1, etc.), so this survives renaming,
  // reordering, or rewriting descriptions, unlike matching on title.
  window.pfCreateEntry = function(title, source){
    var pf = loadPortfolio();
    var id = genId();
    var now = Date.now();
    pf.entries[id] = {id: id, title: title, source: source || {type:'custom'}, milestones: blankMilestones(), createdAt: now, updatedAt: now};
    pf.evidence[id] = {repoUrl:'', demoUrl:'', screenshots:false, presentation:false, readme:false};
    pf.reflection[id] = {notes:'', achievementSummary:''};
    savePortfolio(pf);
    return id;
  };

  window.pfDeleteEntry = function(id){
    if(!confirm('Delete this portfolio entry? This cannot be undone.')) return;
    var pf = loadPortfolio();
    delete pf.entries[id]; delete pf.evidence[id]; delete pf.reflection[id];
    savePortfolio(pf);
    window.pfRender();
  };

  // Recomputes readiness and updates ONLY the banner element -- never touches
  // the rest of the DOM, so focus/scroll position for whatever the user is
  // doing elsewhere on the page is completely undisturbed.
  function pfUpdateReadyBanner(id){
    var pf = loadPortfolio();
    var banner = document.getElementById('pfReadyBanner_'+id);
    if(!banner) return;
    var ready = isPortfolioReady(id, pf);
    banner.className = 'pf-ready-banner' + (ready ? ' pf-ready-yes' : '');
    banner.innerHTML = ready ? '<span class="pf-ready-trophy" aria-hidden="true">&#127942;</span> Portfolio Ready' : 'Not yet Portfolio Ready -- complete all milestones, add a repo link, and write your reflection + achievement summary below.';
  }

  window.pfSetMilestone = function(id, key, field, elId){
    var el = document.getElementById(elId); if(!el) return;
    var value = (el.type==='checkbox') ? el.checked : el.value;
    var pf = loadPortfolio();
    var e = pf.entries[id]; if(!e) return;
    e.milestones[key][field] = value;
    e.updatedAt = Date.now();
    savePortfolio(pf);

    if(field === 'notApplicable'){
      // Toggling N/A adds or removes the reason input -- a real structural
      // change, so this specific case gets a partial refresh of just this
      // row, with focus moved INTENTIONALLY to wherever it now makes sense
      // (the newly-revealed reason field, or back to the checkbox once the
      // reason field disappears) rather than left to fall wherever the
      // browser's default happens to land.
      var row = document.getElementById('pfMilestoneRow_'+id+'_'+key);
      if(row){
        row.outerHTML = milestoneRowHTML(id, key, e.milestones[key]);
        if(value){
          var reasonEl = document.getElementById('pfm_'+id+'_'+key+'_reason');
          if(reasonEl) reasonEl.focus();
        } else {
          var naEl = document.getElementById('pfm_'+id+'_'+key+'_na');
          if(naEl) naEl.focus();
        }
      }
    }
    pfUpdateReadyBanner(id);
  };

  window.pfSetEvidenceField = function(id, field, elId){
    var el = document.getElementById(elId); if(!el) return;
    var value = (el.type==='checkbox') ? el.checked : el.value;
    var pf = loadPortfolio();
    if(!pf.evidence[id]) return;
    pf.evidence[id][field] = value;
    if(pf.entries[id]) pf.entries[id].updatedAt = Date.now();
    savePortfolio(pf);
    pfUpdateReadyBanner(id);
  };

  window.pfSetReflectionField = function(id, field, elId){
    var el = document.getElementById(elId); if(!el) return;
    var pf = loadPortfolio();
    if(!pf.reflection[id]) return;
    pf.reflection[id][field] = el.value;
    if(pf.entries[id]) pf.entries[id].updatedAt = Date.now();
    savePortfolio(pf);
    pfUpdateReadyBanner(id);
  };

  // "Portfolio Ready" is COMPUTED, never a button the user clicks -- true only
  // when every milestone is resolved (done, or explicitly marked not-applicable
  // WITH a reason -- so N/A can't be used to silently skip a field) and the
  // baseline evidence (a repo link, and genuine reflection/summary text) is
  // present. Nothing here is verified by the platform -- it only reflects
  // that the user has filled in what they said they'd fill in.
  function isPortfolioReady(id, pf){
    var entry = pf.entries[id]; if(!entry) return false;
    var milestonesOk = MILESTONE_KEYS.every(function(k){
      var m = entry.milestones[k];
      return m.done || (m.notApplicable && m.reason && m.reason.trim().length>0);
    });
    var evidence = pf.evidence[id] || {};
    var reflection = pf.reflection[id] || {};
    var hasRepo = evidence.repoUrl && evidence.repoUrl.trim().length>0;
    var hasReflection = reflection.notes && reflection.notes.trim().length>0;
    var hasSummary = reflection.achievementSummary && reflection.achievementSummary.trim().length>0;
    return milestonesOk && hasRepo && hasReflection && hasSummary;
  }

  function statusChip(entry, pf){
    if(isPortfolioReady(entry.id, pf)) return '<span class="pf-status-chip pf-status-ready">&#127942; Portfolio Ready</span>';
    var doneCount = MILESTONE_KEYS.filter(function(k){ return entry.milestones[k].done || entry.milestones[k].notApplicable; }).length;
    return '<span class="pf-status-chip">'+doneCount+'/'+MILESTONE_KEYS.length+' milestones</span>';
  }

  // Pure display formatting of the existing entry.updatedAt timestamp -- no
  // new data is stored or computed beyond what's already saved per entry.
  function relativeTime(ts){
    if(!ts) return '';
    var diffMs = Date.now() - ts;
    var mins = Math.floor(diffMs/60000);
    if(mins < 1) return 'just now';
    if(mins < 60) return mins+'m ago';
    var hrs = Math.floor(mins/60);
    if(hrs < 24) return hrs+'h ago';
    var days = Math.floor(hrs/24);
    if(days < 30) return days+'d ago';
    var months = Math.floor(days/30);
    return months+'mo ago';
  }

  var MILESTONE_ICONS = {planned:'&#128203;', building:'&#128296;', testing:'&#129514;', deployed:'&#128640;', documented:'&#128221;'};

  function sourceLine(entry, courses){
    if(entry.source.type==='custom') return '<span class="pf-source-tag">Custom project</span>';
    var c = byId(courses, entry.source.courseId);
    if(!c) return '<span class="pf-source-tag">Linked course unavailable</span>';
    if(entry.source.type==='course-capstone') return '<span class="pf-source-tag">Capstone &middot; '+esc(c.title)+'</span>';
    return '<span class="pf-source-tag">Project &middot; '+esc(c.title)+'</span>';
  }

  window.pfRender = function(){
    _pfCur = null;
    var pf = loadPortfolio(), courses = getCourses();
    var ids = Object.keys(pf.entries).sort(function(a,b){ return pf.entries[b].updatedAt - pf.entries[a].updatedAt; });

    // Dashboard stats -- pure aggregation over already-stored entries, nothing new saved.
    var totalCount = ids.length;
    var readyCount = ids.filter(function(id){ return isPortfolioReady(id, pf); }).length;
    var inProgressCount = ids.filter(function(id){
      if(isPortfolioReady(id, pf)) return false;
      var e = pf.entries[id];
      return MILESTONE_KEYS.some(function(k){ return e.milestones[k].done || e.milestones[k].notApplicable; });
    }).length;
    var customCount = ids.filter(function(id){ return pf.entries[id].source.type==='custom'; }).length;

    var statsHtml =
      '<div class="pf-stats-row">'
      + '<div class="pf-stat-card"><b>'+totalCount+'</b><span>Total Projects</span></div>'
      + '<div class="pf-stat-card pf-stat-ready"><b>'+readyCount+'</b><span>Portfolio Ready</span></div>'
      + '<div class="pf-stat-card"><b>'+inProgressCount+'</b><span>In Progress</span></div>'
      + '<div class="pf-stat-card"><b>'+customCount+'</b><span>Custom Projects</span></div>'
      + '</div>';

    var cards = ids.map(function(id){
      var e = pf.entries[id];
      var doneCount = MILESTONE_KEYS.filter(function(k){ return e.milestones[k].done || e.milestones[k].notApplicable; }).length;
      var pct = Math.round(doneCount/MILESTONE_KEYS.length*100);
      var ready = isPortfolioReady(id, pf);
      return '<div class="pf-card'+(ready?' pf-card-ready':'')+'" data-act="pfOpenEntry(\''+id+'\')" tabindex="0" role="button" aria-label="Open '+esc(e.title)+'">'
        + '<div class="pf-card-top">'
          + '<h3>'+esc(e.title)+'</h3>'
          + statusChip(e, pf)
        + '</div>'
        + sourceLine(e, courses)
        + '<div class="pf-card-progress"><div class="pf-card-progress-track"><div class="pf-card-progress-fill" style="width:'+pct+'%"></div></div><span>'+doneCount+'/'+MILESTONE_KEYS.length+' milestones</span></div>'
        + '<div class="pf-card-foot"><span class="pf-card-updated">Updated '+relativeTime(e.updatedAt)+'</span><span class="pf-card-open">Open &rarr;</span></div>'
        + '</div>';
    }).join('');

    var emptyState = ids.length ? '' : (
      '<div class="pf-empty-state">'
      + '<div class="pf-empty-icon" aria-hidden="true">&#127942;</div>'
      + '<h2>Your portfolio starts here</h2>'
      + '<p>Build projects from courses or your own ideas &mdash; milestones, evidence, and reflections, all self-reported and all yours.</p>'
      + '<button class="pf-empty-cta" data-act="pfFocusNewInput()"><span aria-hidden="true">&#10133;</span> Create Your First Project</button>'
      + '</div>'
    );

    document.getElementById('pfView').innerHTML =
      '<div class="cx-top"><button class="cx-back" data-act="showTrack(\'hub\')">&larr; Home</button></div>'
      + '<div class="pf-header"><div class="pf-header-icon" aria-hidden="true">&#127942;</div>'
        + '<div><h1>Portfolio</h1><p class="pf-header-sub">From first commit to portfolio-ready</p></div></div>'
      + '<div class="pf-honesty-card"><span class="pf-honesty-icon" aria-hidden="true">&#8505;</span><div><b>Self-reported evidence</b><p>Portfolio tracks what you say you\'ve built. GitHub links and deployments are never fetched or verified by the platform.</p></div></div>'
      + statsHtml
      + '<div class="pf-new-card"><label class="pf-new-label" for="pfNewTitle">Start a custom project</label>'
        + '<div class="pf-new-row"><input type="text" id="pfNewTitle" class="pf-new-input" placeholder="New custom project title...">'
        + '<button class="pf-new-btn" data-act="pfAddCustom()"><span aria-hidden="true">&#10133;</span> Add Project</button></div></div>'
      + (ids.length ? '<div class="pf-card-list">' + cards + '</div>' : emptyState);
  };

  window.pfFocusNewInput = function(){
    var el = document.getElementById('pfNewTitle');
    if(el) el.focus();
  };

  window.pfAddCustom = function(){
    var input = document.getElementById('pfNewTitle');
    var title = input ? input.value.trim() : '';
    if(!title) return;
    var id = window.pfCreateEntry(title, {type:'custom'});
    window.pfOpenEntry(id);
  };

  window.pfAddFromCourseProject = function(courseId, projectId){
    var courses = getCourses();
    var c = byId(courses, courseId);
    if(!c) return;
    var p = (c.projects||[]).find(function(x){ return x.id===projectId; });
    if(!p) return;
    var id = window.pfCreateEntry(p.title, {type:'course-project', courseId: courseId, projectId: projectId});
    showTrack('portfolio');
    window.pfOpenEntry(id);
  };

  window.pfAddFromCapstone = function(courseId){
    var courses = getCourses();
    var c = byId(courses, courseId);
    if(!c || !c.capstone) return;
    var id = window.pfCreateEntry(c.capstone.title, {type:'course-capstone', courseId: courseId, projectId: null});
    showTrack('portfolio');
    window.pfOpenEntry(id);
  };

  var MILESTONE_LABELS = {planned:'Planned', building:'Building', testing:'Testing', deployed:'Deployed', documented:'Documented'};

  function milestoneRowHTML(id, key, m){
    var label = MILESTONE_LABELS[key];
    var icon = MILESTONE_ICONS[key];
    var doneElId = 'pfm_'+id+'_'+key+'_done';
    var naElId = 'pfm_'+id+'_'+key+'_na';
    var reasonElId = 'pfm_'+id+'_'+key+'_reason';
    var state = m.done ? 'pf-ms-done' : (m.notApplicable ? 'pf-ms-na' : 'pf-ms-open');
    return '<div class="pf-ms-item '+state+'" id="pfMilestoneRow_'+id+'_'+key+'">'
      + '<div class="pf-ms-icon" aria-hidden="true">'+icon+'</div>'
      + '<div class="pf-ms-body">'
        + '<div class="pf-ms-title-row">'
          + '<label class="pf-milestone-check"><input type="checkbox" id="'+doneElId+'" '+(m.done?'checked':'')+' '+(m.notApplicable?'disabled':'')+' data-change="pfSetMilestone(\''+id+'\',\''+key+'\',\'done\',\''+doneElId+'\')"> <span>'+label+'</span></label>'
          + '<label class="pf-milestone-na"><input type="checkbox" id="'+naElId+'" '+(m.notApplicable?'checked':'')+' data-change="pfSetMilestone(\''+id+'\',\''+key+'\',\'notApplicable\',\''+naElId+'\')"> N/A</label>'
        + '</div>'
        + (m.notApplicable ? '<input type="text" id="'+reasonElId+'" aria-label="Reason this milestone does not apply" class="pf-na-reason" placeholder="Why doesn\'t this apply?" value="'+esc(m.reason)+'" data-change="pfSetMilestone(\''+id+'\',\''+key+'\',\'reason\',\''+reasonElId+'\')">' : '')
      + '</div>'
      + '</div>';
  }

  window.pfOpenEntry = function(id){
    _pfCur = id;
    var pf = loadPortfolio(), courses = getCourses();
    var entry = pf.entries[id];
    if(!entry){ window.pfRender(); return; }
    var evidence = pf.evidence[id] || {repoUrl:'',demoUrl:'',screenshots:false,presentation:false,readme:false};
    var reflection = pf.reflection[id] || {notes:'',achievementSummary:''};
    var ready = isPortfolioReady(id, pf);

    var milestonesHtml = MILESTONE_KEYS.map(function(k){ return milestoneRowHTML(id, k, entry.milestones[k]); }).join('');

    document.getElementById('pfView').innerHTML =
      '<div class="cx-top"><button class="cx-back" data-act="showTrack(\'portfolio\')">&larr; Portfolio</button></div>'
      + '<div class="cx-hero"><div>' + sourceLine(entry, courses)
      + '<h1>'+esc(entry.title)+'</h1></div></div>'
      + '<div id="pfReadyBanner_'+id+'" class="pf-ready-banner'+(ready?' pf-ready-yes':'')+'">'+(ready ? '<span class="pf-ready-trophy" aria-hidden="true">&#127942;</span> Portfolio Ready' : 'Not yet Portfolio Ready -- complete all milestones, add a repo link, and write your reflection + achievement summary below.')+'</div>'

      + '<div class="pf-section-card"><div class="pf-section-head"><span class="pf-section-icon" aria-hidden="true">&#128506;</span><h3>Milestones</h3></div>'
        + '<div class="pf-ms-list">' + milestonesHtml + '</div></div>'

      + '<div class="pf-section-card"><div class="pf-section-head"><span class="pf-section-icon" aria-hidden="true">&#128274;</span><h3>Evidence</h3></div>'
        + '<label class="pf-field-label">Repository URL</label><input type="text" id="pfEvRepo_'+id+'" aria-label="Repository URL" class="pf-text-input" value="'+esc(evidence.repoUrl)+'" placeholder="https://github.com/you/project" data-change="pfSetEvidenceField(\''+id+'\',\'repoUrl\',\'pfEvRepo_'+id+'\')">'
        + '<label class="pf-field-label">Live Demo URL</label><input type="text" id="pfEvDemo_'+id+'" aria-label="Live Demo URL" class="pf-text-input" value="'+esc(evidence.demoUrl)+'" placeholder="https://your-demo.example.com" data-change="pfSetEvidenceField(\''+id+'\',\'demoUrl\',\'pfEvDemo_'+id+'\')">'        + '<div class="pf-check-group">'
          + '<label class="pf-check-label"><input type="checkbox" id="pfEvShots_'+id+'" '+(evidence.screenshots?'checked':'')+' data-change="pfSetEvidenceField(\''+id+'\',\'screenshots\',\'pfEvShots_'+id+'\')"> Screenshots captured</label>'
          + '<label class="pf-check-label"><input type="checkbox" id="pfEvPres_'+id+'" '+(evidence.presentation?'checked':'')+' data-change="pfSetEvidenceField(\''+id+'\',\'presentation\',\'pfEvPres_'+id+'\')"> Presentation / demo recording ready</label>'
          + '<label class="pf-check-label"><input type="checkbox" id="pfEvReadme_'+id+'" '+(evidence.readme?'checked':'')+' data-change="pfSetEvidenceField(\''+id+'\',\'readme\',\'pfEvReadme_'+id+'\')"> README written</label>'
        + '</div>'
        + '<div class="pf-info-box"><span aria-hidden="true">&#8505;</span> Self-reported -- the platform can\'t fetch or verify these links or files, only record what you say is true.</div>'
      + '</div>'

      + '<div class="pf-section-card"><div class="pf-section-head"><span class="pf-section-icon" aria-hidden="true">&#128221;</span><h3>Reflection</h3></div>'
        + '<label class="pf-field-label">What did you learn? What would you do differently?</label><textarea id="pfRefNotes_'+id+'" aria-label="What did you learn? What would you do differently?" class="pf-textarea" placeholder="What did you learn? What would you do differently?" data-change="pfSetReflectionField(\''+id+'\',\'notes\',\'pfRefNotes_'+id+'\')">'+esc(reflection.notes)+'</textarea>'
      + '</div>'

      + '<div class="pf-section-card"><div class="pf-section-head"><span class="pf-section-icon" aria-hidden="true">&#11088;</span><h3>Achievement Summary</h3></div>'
        + '<label class="pf-field-label">One or two sentences you could reuse on a resume, LinkedIn, or in an interview</label><textarea id="pfRefSummary_'+id+'" aria-label="Achievement summary for resume or interview" class="pf-textarea" placeholder="Built a full-stack app deployed to Kubernetes with autoscaling and a tested rollback procedure." data-change="pfSetReflectionField(\''+id+'\',\'achievementSummary\',\'pfRefSummary_'+id+'\')">'+esc(reflection.achievementSummary)+'</textarea>'
      + '</div>'

      + '<button class="pf-delete-btn" data-act="pfDeleteEntry(\''+id+'\')">Delete this entry</button>';
  };
})();
