
(function(){
  var FORMAT = 'learning-platform-progress';
  var CURRENT_SCHEMA_VERSION = 1;
  var APP_VERSION = (window.PLATFORM_META && window.PLATFORM_META.version) || '5.19.1';
  var PLATFORM_KEYS = {
    progress: ['courses_progress_v1','roadmap_progress_v1','pp_solved','pp_attempts','sqlmastery_all_v1','learning_activity_v1','portfolio_v1','ai_path_resume_v1'],
    quizAnswers: ['adaptive_quiz_log_v1'],
    preferences: ['pp_theme','courses_recent_v1','learning_planner_v1']
  };
  var PRE_IMPORT_BACKUP_KEY = 'platform_pre_import_backup_v1';

  function safeGetJSON(key, fallback){
    try{ var r = localStorage.getItem(key); return r != null ? JSON.parse(r) : fallback; }catch(e){ return fallback; }
  }
  function safeGetRaw(key){ try{ return localStorage.getItem(key); }catch(e){ return null; } }
  function safeSetJSON(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); return true; }catch(e){ return false; } }

  function getCourses(){
    try{ return (window.__CSAI_COURSES__||(window.__CSAI_COURSES__=JSON.parse(document.getElementById('coursedata').textContent))); }catch(e){ return []; }
  }

  // ---------- achievement snapshot (informational only -- achievements are always
  // recomputed live from progress, never restored as stored state) ----------
  function computeEarnedSnapshot(){
    try{
      if(window.cxComputeAchievements) return window.cxComputeAchievements().filter(function(a){return a.earned;}).map(function(a){return a.id;});
    }catch(e){}
    return [];
  }

  // ============ EXPORT ============
  window.cxExportProgress = function(){
    var progress = {};
    PLATFORM_KEYS.progress.forEach(function(k){ progress[k] = safeGetJSON(k, k==='learning_activity_v1'||k==='courses_progress_v1'||k==='sqlmastery_all_v1'||k==='pp_solved'||k==='pp_attempts'||k==='roadmap_progress_v1'||k==='portfolio_v1'||k==='ai_path_resume_v1' ? {} : null); });
    var quizAnswers = {};
    PLATFORM_KEYS.quizAnswers.forEach(function(k){ quizAnswers[k] = safeGetJSON(k, []); });
    var preferences = {};
    PLATFORM_KEYS.preferences.forEach(function(k){
      preferences[k] = k === 'pp_theme' ? safeGetRaw(k) : safeGetJSON(k, k==='courses_recent_v1' ? [] : {});
    });

    var payload = {
      format: FORMAT,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      progress: progress,
      quizAnswers: quizAnswers,
      achievements: { earnedSnapshot: computeEarnedSnapshot() },
      preferences: preferences
    };

    var blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var stamp = payload.exportedAt.slice(0,10);
    a.href = url; a.download = 'learning-platform-backup-'+stamp+'.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    try{ localStorage.setItem('platform_last_export_v1', payload.exportedAt); }catch(e){}
    return payload;
  };

  // ============ VALIDATION (pure function -- never touches localStorage) ============
  window.cxValidateImport = function(rawText){
    var errors = [], warnings = [], unknownCourseIds = [];
    var parsed;
    try{ parsed = JSON.parse(rawText); }
    catch(e){ return {ok:false, errors:['This file is not valid JSON ('+e.message+').'], warnings:[]}; }

    if(typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)){
      return {ok:false, errors:['This file does not contain a JSON object at the top level.'], warnings:[]};
    }
    if(parsed.format !== FORMAT){
      return {ok:false, errors:['This file is not a learning-platform-progress export (found format: '+JSON.stringify(parsed.format)+').'], warnings:[]};
    }
    if(typeof parsed.schemaVersion !== 'number'){
      return {ok:false, errors:['Missing or invalid schemaVersion field.'], warnings:[]};
    }
    if(parsed.schemaVersion > CURRENT_SCHEMA_VERSION){
      return {ok:false, errors:['This file uses schema version '+parsed.schemaVersion+', which is newer than this platform supports (v'+CURRENT_SCHEMA_VERSION+'). Update the platform, or use an export made with an older version.'], warnings:[]};
    }

    var knownIds = new Set(getCourses().map(function(c){return c.id;}));
    var progress = (parsed.progress && typeof parsed.progress === 'object') ? JSON.parse(JSON.stringify(parsed.progress)) : {};
    if(parsed.progress !== undefined && (typeof parsed.progress !== 'object' || parsed.progress === null)){
      warnings.push('The "progress" section was present but malformed -- ignored.');
      progress = {};
    }

    // validate courses_progress_v1 entries individually; a bad ENTRY is dropped and
    // reported, not treated as fatal for the whole import.
    var cp = progress.courses_progress_v1;
    if(cp && typeof cp === 'object'){
      Object.keys(cp).forEach(function(cid){
        var entry = cp[cid];
        if(typeof entry !== 'object' || entry === null || Array.isArray(entry)){
          warnings.push('Course "'+cid+'": progress entry was malformed and was skipped.');
          delete cp[cid];
          return;
        }
        ['lessons','exercises','quiz','projects'].forEach(function(sub){
          if(entry[sub] !== undefined && (typeof entry[sub] !== 'object' || entry[sub] === null || Array.isArray(entry[sub]))){
            warnings.push('Course "'+cid+'": "'+sub+'" data was malformed and was skipped.');
            delete entry[sub];
          }
        });
        if(!knownIds.has(cid)) unknownCourseIds.push(cid);
      });
    } else if(cp !== undefined){
      warnings.push('"courses_progress_v1" was present but not an object -- ignored.');
      if(progress.courses_progress_v1) delete progress.courses_progress_v1;
    }

    // validate adaptive_quiz_log_v1 is an array of well-formed entries
    var quizAnswers = (parsed.quizAnswers && typeof parsed.quizAnswers === 'object') ? JSON.parse(JSON.stringify(parsed.quizAnswers)) : {};
    if(quizAnswers.adaptive_quiz_log_v1 !== undefined){
      if(!Array.isArray(quizAnswers.adaptive_quiz_log_v1)){
        warnings.push('"adaptive_quiz_log_v1" was present but not an array -- ignored.');
        quizAnswers.adaptive_quiz_log_v1 = [];
      } else {
        var before = quizAnswers.adaptive_quiz_log_v1.length;
        quizAnswers.adaptive_quiz_log_v1 = quizAnswers.adaptive_quiz_log_v1.filter(function(e){
          return e && typeof e === 'object' && typeof e.concept === 'string' && typeof e.correct === 'boolean' && typeof e.ts === 'number';
        });
        var dropped = before - quizAnswers.adaptive_quiz_log_v1.length;
        if(dropped > 0) warnings.push(dropped+' malformed quiz-history entr'+(dropped===1?'y':'ies')+' skipped.');
      }
    }

    var preferences = (parsed.preferences && typeof parsed.preferences === 'object') ? JSON.parse(JSON.stringify(parsed.preferences)) : {};
    var achievements = (parsed.achievements && typeof parsed.achievements === 'object') ? parsed.achievements : {earnedSnapshot:[]};

    // build a human-readable preview
    var lessonsCompleted = 0, exercisesCompleted = 0, quizAnswered = 0, coursesWithProgress = 0;
    if(cp){
      Object.keys(cp).forEach(function(cid){
        var e = cp[cid]; if(!e) return;
        var any = false;
        if(e.lessons){ var n=Object.keys(e.lessons).filter(function(k){return e.lessons[k];}).length; lessonsCompleted+=n; if(n)any=true; }
        if(e.exercises){ var n2=Object.keys(e.exercises).filter(function(k){return e.exercises[k];}).length; exercisesCompleted+=n2; if(n2)any=true; }
        if(e.quiz){ var n3=Object.keys(e.quiz).length; quizAnswered+=n3; if(n3)any=true; }
        if(any) coursesWithProgress++;
      });
    }

    return {
      ok: true,
      errors: errors,
      warnings: warnings,
      unknownCourseIds: unknownCourseIds,
      appVersion: parsed.appVersion || 'unknown',
      exportedAt: parsed.exportedAt || null,
      data: { progress: progress, quizAnswers: quizAnswers, preferences: preferences, achievements: achievements },
      preview: {
        coursesWithProgress: coursesWithProgress,
        lessonsCompleted: lessonsCompleted,
        exercisesCompleted: exercisesCompleted,
        quizAnswered: quizAnswered,
        earnedAchievements: (achievements.earnedSnapshot||[]).length,
        quizHistoryEntries: (quizAnswers.adaptive_quiz_log_v1||[]).length,
        hasRoadmap: !!(progress.roadmap_progress_v1 && Object.keys(progress.roadmap_progress_v1).length),
        hasSql: !!(progress.sqlmastery_all_v1 && Object.keys(progress.sqlmastery_all_v1).length),
        hasPython: !!(progress.pp_solved && Object.keys(progress.pp_solved).length)
      }
    };
  };

  // ============ MERGE LOGIC ============
  function mergeCoursesProgress(current, imported){
    var out = JSON.parse(JSON.stringify(current || {}));
    Object.keys(imported || {}).forEach(function(cid){
      var imp = imported[cid], cur = out[cid];
      if(!cur){ out[cid] = imp; return; }
      ['lessons','exercises','projects'].forEach(function(sub){
        cur[sub] = cur[sub] || {}; imp[sub] = imp[sub] || {};
        Object.keys(imp[sub]).forEach(function(k){ if(imp[sub][k]) cur[sub][k] = true; }); // completion is monotonic -- union
      });
      // quiz: fill gaps only (non-conflicting) -- never overwrite an existing answer in merge mode
      cur.quiz = cur.quiz || {}; imp.quiz = imp.quiz || {};
      Object.keys(imp.quiz).forEach(function(k){ if(cur.quiz[k] === undefined) cur.quiz[k] = imp.quiz[k]; });
    });
    return out;
  }
  function replaceCoursesProgress(current, imported){
    var out = JSON.parse(JSON.stringify(current || {}));
    Object.keys(imported || {}).forEach(function(cid){ out[cid] = imported[cid]; }); // imported entry wins wholesale where present
    return out;
  }
  function mergeSimpleDoneMap(current, imported){
    // for pp_solved-style {id: true} maps -- union, completion is monotonic
    var out = Object.assign({}, current || {});
    Object.keys(imported || {}).forEach(function(k){ if(imported[k]) out[k] = imported[k]; });
    return out;
  }
  var ROADMAP_ORDER = {todo:0, doing:1, done:2};
  function mergeRoadmap(current, imported){
    var out = Object.assign({}, current || {});
    Object.keys(imported || {}).forEach(function(k){
      var curVal = out[k], impVal = imported[k];
      if(curVal === undefined || (ROADMAP_ORDER[impVal]||0) > (ROADMAP_ORDER[curVal]||0)) out[k] = impVal;
    });
    return out;
  }
  function mergeActivityLog(current, imported){
    // date-keyed per-day counters -- take the MAX per counter per day, never sum (avoids
    // double-counting) and never compare a derived "streak number" directly (none is ever
    // stored; the streak is always recomputed fresh from this raw log after merge).
    var out = JSON.parse(JSON.stringify(current || {}));
    Object.keys(imported || {}).forEach(function(date){
      var imp = imported[date], cur = out[date];
      if(!cur){ out[date] = imp; return; }
      ['lessons','exercises','quiz','quizCorrect','projects','minutes'].forEach(function(k){
        cur[k] = Math.max(cur[k]||0, imp[k]||0);
      });
    });
    return out;
  }
  function mergeAdaptiveLog(current, imported){
    var seen = {};
    var combined = (current||[]).concat(imported||[]);
    var out = [];
    combined.forEach(function(e){
      var key = e.concept+'|'+e.correct+'|'+e.ts;
      if(!seen[key]){ seen[key]=true; out.push(e); }
    });
    out.sort(function(a,b){ return a.ts - b.ts; });
    if(out.length > 500) out = out.slice(-500);
    return out;
  }

  // ============ APPLY (atomic: fully computed in memory first, written last) ============
  window.cxApplyImport = function(validated, mode, importPreferences){
    // Step 1: automatic pre-import backup (in-browser safety net, no user action needed)
    var backup = {};
    PLATFORM_KEYS.progress.concat(PLATFORM_KEYS.quizAnswers).concat(PLATFORM_KEYS.preferences).forEach(function(k){
      backup[k] = safeGetRaw(k);
    });
    safeSetJSON(PRE_IMPORT_BACKUP_KEY, { backedUpAt: new Date().toISOString(), keys: backup });

    // Step 2: compute the FULL new state in memory (nothing written yet)
    var d = validated.data;
    var newState = {};

    var curCP = safeGetJSON('courses_progress_v1', {});
    newState.courses_progress_v1 = mode === 'replace'
      ? replaceCoursesProgress(curCP, d.progress.courses_progress_v1 || {})
      : mergeCoursesProgress(curCP, d.progress.courses_progress_v1 || {});

    newState.roadmap_progress_v1 = mode === 'replace'
      ? Object.assign({}, safeGetJSON('roadmap_progress_v1', {}), d.progress.roadmap_progress_v1 || {})
      : mergeRoadmap(safeGetJSON('roadmap_progress_v1', {}), d.progress.roadmap_progress_v1 || {});

    newState.pp_solved = mode === 'replace'
      ? Object.assign({}, safeGetJSON('pp_solved', {}), d.progress.pp_solved || {})
      : mergeSimpleDoneMap(safeGetJSON('pp_solved', {}), d.progress.pp_solved || {});

    // pp_attempts: informational counters, not completion -- safe to just take the max per id
    var curAttempts = safeGetJSON('pp_attempts', {});
    var impAttempts = d.progress.pp_attempts || {};
    newState.pp_attempts = Object.assign({}, curAttempts);
    Object.keys(impAttempts).forEach(function(k){ newState.pp_attempts[k] = Math.max(curAttempts[k]||0, impAttempts[k]||0); });

    // sqlmastery_all_v1 has its own {stats, solved} shape -- solved is a done-map (union),
    // stats are informational attempt counters (max per topic per field, same reasoning as pp_attempts)
    var curSql = safeGetJSON('sqlmastery_all_v1', {stats:{},solved:{}});
    var impSql = d.progress.sqlmastery_all_v1 || {stats:{},solved:{}};
    var mergedSolved = mode === 'replace'
      ? Object.assign({}, curSql.solved||{}, impSql.solved||{})
      : mergeSimpleDoneMap(curSql.solved||{}, impSql.solved||{});
    var mergedStats = Object.assign({}, curSql.stats||{});
    Object.keys(impSql.stats||{}).forEach(function(topic){
      var c = mergedStats[topic] || {att:0,correct:0,recent:[]};
      var i = impSql.stats[topic] || {att:0,correct:0,recent:[]};
      mergedStats[topic] = { att: Math.max(c.att||0,i.att||0), correct: Math.max(c.correct||0,i.correct||0), recent: c.recent||[] };
    });
    newState.sqlmastery_all_v1 = { stats: mergedStats, solved: mergedSolved };

    newState.learning_activity_v1 = mergeActivityLog(safeGetJSON('learning_activity_v1', {}), d.progress.learning_activity_v1 || {});
    var curAIPath = safeGetJSON('ai_path_resume_v1', {courses:{},milestones:{}});
    var impAIPath = d.progress.ai_path_resume_v1 || {courses:{},milestones:{}};
    newState.ai_path_resume_v1 = mode === 'replace'
      ? Object.assign({courses:{},milestones:{}}, impAIPath)
      : { lastCourseId: impAIPath.lastCourseId || curAIPath.lastCourseId || null,
          courses: Object.assign({}, curAIPath.courses||{}, impAIPath.courses||{}),
          milestones: Object.assign({}, curAIPath.milestones||{}, impAIPath.milestones||{}) };
    newState.adaptive_quiz_log_v1 = mergeAdaptiveLog(safeGetJSON('adaptive_quiz_log_v1', []), d.quizAnswers.adaptive_quiz_log_v1 || []);

    if(importPreferences){
      newState.pp_theme = d.preferences.pp_theme || safeGetRaw('pp_theme');
      newState.courses_recent_v1 = d.preferences.courses_recent_v1 || safeGetJSON('courses_recent_v1', []);
      newState.learning_planner_v1 = mode === 'replace'
        ? (d.preferences.learning_planner_v1 || safeGetJSON('learning_planner_v1', {}))
        : Object.assign({}, safeGetJSON('learning_planner_v1', {}), d.preferences.learning_planner_v1 || {});
    }

    // Step 3: write everything (no async gaps between validation/compute and write --
    // the risky window where a partial write could occur is minimized to these
    // synchronous calls only)
    safeSetJSON('courses_progress_v1', newState.courses_progress_v1);
    safeSetJSON('roadmap_progress_v1', newState.roadmap_progress_v1);
    safeSetJSON('pp_solved', newState.pp_solved);
    safeSetJSON('pp_attempts', newState.pp_attempts);
    safeSetJSON('sqlmastery_all_v1', newState.sqlmastery_all_v1);
    safeSetJSON('learning_activity_v1', newState.learning_activity_v1);
    safeSetJSON('ai_path_resume_v1', newState.ai_path_resume_v1);
    safeSetJSON('adaptive_quiz_log_v1', newState.adaptive_quiz_log_v1);
    if(importPreferences){
      if(newState.pp_theme != null) localStorage.setItem('pp_theme', newState.pp_theme);
      safeSetJSON('courses_recent_v1', newState.courses_recent_v1);
      safeSetJSON('learning_planner_v1', newState.learning_planner_v1);
    }
    try{ localStorage.setItem('platform_last_import_v1', new Date().toISOString()); }catch(e){}

    return true;
  };

  // ============ RESET (platform-owned keys only) ============
  window.cxResetAllProgress = function(makeBackup){
    if(makeBackup){
      var backup = {};
      PLATFORM_KEYS.progress.concat(PLATFORM_KEYS.quizAnswers).concat(PLATFORM_KEYS.preferences).forEach(function(k){
        backup[k] = safeGetRaw(k);
      });
      safeSetJSON(PRE_IMPORT_BACKUP_KEY, { backedUpAt: new Date().toISOString(), keys: backup, reason: 'reset' });
    }
    PLATFORM_KEYS.progress.concat(PLATFORM_KEYS.quizAnswers).forEach(function(k){
      try{ localStorage.removeItem(k); }catch(e){}
    });
    // preferences (theme, recent list, planner) are intentionally NOT cleared by a
    // progress reset -- they're settings, not progress being reset.
    return true;
  };

  window.cxRestorePreImportBackup = function(){
    var backup = safeGetJSON(PRE_IMPORT_BACKUP_KEY, null);
    if(!backup) return false;
    Object.keys(backup.keys).forEach(function(k){
      if(backup.keys[k] == null) { try{ localStorage.removeItem(k); }catch(e){} }
      else { try{ localStorage.setItem(k, backup.keys[k]); }catch(e){} }
    });
    return true;
  };
})();
