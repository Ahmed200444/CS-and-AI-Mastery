
(function(){
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
  var APP_VERSION = (window.PLATFORM_META && window.PLATFORM_META.version) || '5.19.1'; // canonical source: window.PLATFORM_META (see top of file)
  var SCHEMA_VERSION = 1;
  var REGRESSION_SUITE_VERSION = '1.6.0'; // manually synced with regression_check.py's own constant
  var PLATFORM_KEYS = ['courses_progress_v1','roadmap_progress_v1','pp_solved','pp_attempts',
    'sqlmastery_all_v1','learning_activity_v1','adaptive_quiz_log_v1','pp_theme','courses_recent_v1',
    'learning_planner_v1','platform_storage_version','platform_last_export_v1','platform_last_import_v1',
    'platform_pre_import_backup_v1','platform_lesson_migration_v1','platform_project_migration_v1','portfolio_v1','ai_path_resume_v1'];

  function getCourses(){ try{ return (window.__CSAI_COURSES__||(window.__CSAI_COURSES__=JSON.parse(document.getElementById('coursedata').textContent))); }catch(e){ return []; } }
  function bytesOf(key){ try{ var v = localStorage.getItem(key); return v ? new Blob([v]).size : 0; }catch(e){ return 0; } }

  function computeTotals(){
    var courses = getCourses();
    var t = { courses: courses.length, available: 0, comingSoon: 0, lessons:0, exercises:0, quiz:0, projects:0 };
    courses.forEach(function(c){
      if(c.status === 'available') t.available++; else t.comingSoon++;
      t.lessons += (c.lessons||[]).length;
      t.exercises += (c.exercises||[]).length;
      t.quiz += (c.quiz||[]).length;
      t.projects += (c.projects||[]).length;
    });
    return t;
  }

  // ---------- diagnostics ----------
  function validateReferences(){
    var courses = getCourses();
    var ids = {}; courses.forEach(function(c){ ids[c.id] = true; });
    var brokenPrereqs = [], brokenRelated = [], brokenNext = [], dupeCourseIds = [];
    var seen = {};
    courses.forEach(function(c){
      if(seen[c.id]) dupeCourseIds.push(c.id); seen[c.id] = true;
      (c.prerequisites||[]).forEach(function(p){ if(!ids[p]) brokenPrereqs.push(c.id+' -> '+p); });
      (c.relatedTracks||[]).forEach(function(r){ if(!ids[r]) brokenRelated.push(c.id+' -> '+r); });
      if(c.suggestedNext && !ids[c.suggestedNext]) brokenNext.push(c.id+' -> '+c.suggestedNext);
    });
    return { brokenPrereqs:brokenPrereqs, brokenRelated:brokenRelated, brokenNext:brokenNext, dupeCourseIds:dupeCourseIds };
  }

  function detectDuplicateLessonIds(){
    var courses = getCourses();
    var dupes = [];
    courses.forEach(function(c){
      var seen = {};
      (c.lessons||[]).forEach(function(l){
        if(!l.id) return;
        if(seen[l.id]) dupes.push(c.id+': '+l.id);
        seen[l.id] = true;
      });
    });
    return dupes;
  }

  function progressIdCoverage(){
    var courses = getCourses();
    var known = {}; courses.forEach(function(c){ known[c.id] = true; });
    var cp = {};
    try{ cp = JSON.parse(localStorage.getItem('courses_progress_v1'))||{}; }catch(e){}
    var recognized = [], unknown = [];
    Object.keys(cp).forEach(function(cid){ (known[cid] ? recognized : unknown).push(cid); });
    return { recognized: recognized, unknown: unknown };
  }

  function localStorageReport(){
    return PLATFORM_KEYS.map(function(k){
      var exists = localStorage.getItem(k) !== null;
      return { key: k, present: exists, bytes: exists ? bytesOf(k) : 0 };
    });
  }

  window.dmRender = function(){
    var totals = computeTotals();
    var refs = validateReferences();
    var dupeLessons = detectDuplicateLessonIds();
    var idCoverage = progressIdCoverage();
    var lsReport = localStorageReport();
    var totalBytes = lsReport.reduce(function(s,r){ return s+r.bytes; }, 0);
    var lastExport = localStorage.getItem('platform_last_export_v1');
    var lastImport = localStorage.getItem('platform_last_import_v1');

    var html = '<div class="ml-top"><button class="ml-back" data-act="showTrack(\'hub\')">&larr; Home</button></div>'
      + '<div class="ml-head"><div class="ml-eyebrow">Not part of normal navigation &mdash; maintenance only</div>'
      + '<h1 class="ml-h1">Developer Mode</h1></div>';

    html += '<div class="cx-tutor-section"><h3>Build &amp; schema</h3><ul class="cx-tutor-list">'
      + '<li>App version: <b>'+esc(APP_VERSION)+'</b></li>'
      + '<li>Data schema version: <b>'+SCHEMA_VERSION+'</b></li>'
      + '<li>Regression suite version: <b>'+esc(REGRESSION_SUITE_VERSION)+'</b> (manually synced with regression_check.py)</li>'
      + '</ul></div>';

    html += '<div class="cx-tutor-section"><h3>Content totals</h3><ul class="cx-tutor-list">'
      + '<li>'+totals.courses+' courses total ('+totals.available+' available, '+totals.comingSoon+' coming soon)</li>'
      + '<li>'+totals.lessons+' lessons &middot; '+totals.exercises+' exercises &middot; '+totals.quiz+' quiz questions &middot; '+totals.projects+' projects</li>'
      + '</ul></div>';

    html += '<div class="cx-tutor-section"><h3>Engine status</h3><ul class="cx-tutor-list">'
      + '<li>Python (Pyodide): <b>'+(window.dmPyodideStatus ? esc(window.dmPyodideStatus()) : 'unknown')+'</b></li>'
      + '<li>SQL (sql.js): <b>'+(window.dmSqlStatus ? esc(window.dmSqlStatus()) : 'unknown')+'</b></li>'
      + '<li>Search index: built lazily on first search, cached in memory for the session &mdash; no persistent index to inspect</li>'
      + '<li>Offline/CDN dependency: course content, lessons, and progress work fully offline once the page has loaded; only the Python and SQL engines need a one-time internet connection to fetch from their CDN (this is not a service-worker cache)</li>'
      + '</ul></div>';

    html += '<div class="cx-tutor-section"><h3>Backup activity</h3><ul class="cx-tutor-list">'
      + '<li>Last export: '+(lastExport ? esc(new Date(lastExport).toLocaleString()) : 'never')+'</li>'
      + '<li>Last import: '+(lastImport ? esc(new Date(lastImport).toLocaleString()) : 'never')+'</li>'
      + '</ul></div>';

    html += '<div class="cx-tutor-section"><h3>Reference integrity</h3><ul class="cx-tutor-list">'
      + '<li>Duplicate course IDs: '+(refs.dupeCourseIds.length ? esc(refs.dupeCourseIds.join(', ')) : '<span style="color:#7ee0a0">none</span>')+'</li>'
      + '<li>Duplicate lesson IDs (within a course): '+(dupeLessons.length ? esc(dupeLessons.join(', ')) : '<span style="color:#7ee0a0">none</span>')+'</li>'
      + '<li>Broken prerequisite references: '+(refs.brokenPrereqs.length ? esc(refs.brokenPrereqs.join(', ')) : '<span style="color:#7ee0a0">none</span>')+'</li>'
      + '<li>Broken related-track references: '+(refs.brokenRelated.length ? esc(refs.brokenRelated.join(', ')) : '<span style="color:#7ee0a0">none</span>')+'</li>'
      + '<li>Broken suggested-next references: '+(refs.brokenNext.length ? esc(refs.brokenNext.join(', ')) : '<span style="color:#7ee0a0">none</span>')+'</li>'
      + '</ul></div>';

    html += '<div class="cx-tutor-section"><h3>Progress IDs</h3><ul class="cx-tutor-list">'
      + '<li>Recognized course IDs with saved progress: '+idCoverage.recognized.length+'</li>'
      + '<li>Unknown course IDs with saved progress (kept, not shown in normal UI): '+(idCoverage.unknown.length ? esc(idCoverage.unknown.join(', ')) : 'none')+'</li>'
      + '</ul></div>';

    html += '<div class="cx-tutor-section"><h3>LocalStorage (platform-owned keys only)</h3>'
      + '<ul class="cx-tutor-list">'
      + lsReport.map(function(r){ return '<li>'+esc(r.key)+': '+(r.present ? r.bytes+' bytes' : '<span style="color:#6b7684">not set</span>')+'</li>'; }).join('')
      + '<li><b>Total: '+totalBytes+' bytes ('+(totalBytes/1024).toFixed(1)+' KB)</b></li>'
      + '</ul>'
      + '<p class="ml-lead" style="font-size:.78rem">Raw answer content and user-entered code are not shown here. Use the diagnostic report download for a structured export, or open a specific course/exercise directly to inspect its actual content.</p>'
      + '</div>';

    html += '<div class="cx-tutor-section"><h3>Actions</h3>'
      + '<button class="cx-tutor-action-btn" data-act="dmDownloadReport()">Download diagnostic report (.json)</button> '
      + '<button class="ml-reset" data-act="dmClearTempData()">Clear temporary data (pre-import backup only)</button>'
      + '<p class="ml-lead" style="font-size:.78rem;margin-top:8px">"Clear temporary data" removes only the automatic pre-import/reset backup safety net &mdash; it never touches real progress, quiz history, or preferences.</p>'
      + '</div>';

    document.getElementById('dmView').innerHTML = html;
  };

  window.dmDownloadReport = function(){
    var report = {
      generatedAt: new Date().toISOString(),
      appVersion: APP_VERSION, schemaVersion: SCHEMA_VERSION, regressionSuiteVersion: REGRESSION_SUITE_VERSION,
      totals: computeTotals(),
      referenceIntegrity: validateReferences(),
      duplicateLessonIds: detectDuplicateLessonIds(),
      progressIdCoverage: progressIdCoverage(),
      localStorage: localStorageReport(),
      engineStatus: {
        pyodide: window.dmPyodideStatus ? window.dmPyodideStatus() : 'unknown',
        sql: window.dmSqlStatus ? window.dmSqlStatus() : 'unknown'
      },
      lastExport: localStorage.getItem('platform_last_export_v1'),
      lastImport: localStorage.getItem('platform_last_import_v1')
    };
    var blob = new Blob([JSON.stringify(report, null, 2)], {type:'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'platform-diagnostic-'+report.generatedAt.slice(0,10)+'.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  };

  window.dmClearTempData = function(){
    if(!confirm('Clear the automatic pre-import/reset backup? This does not affect real progress.')) return;
    try{ localStorage.removeItem('platform_pre_import_backup_v1'); }catch(e){}
    window.dmRender();
  };
})();
