
(function(){
  var COURSES = null, CATEGORIES = null;
  function getCourses(){ if(!COURSES){ try{ COURSES = (window.__CSAI_COURSES__||(window.__CSAI_COURSES__=JSON.parse(document.getElementById('coursedata').textContent))); }catch(e){ COURSES=[]; } } return COURSES; }
  function getCategories(){ if(!CATEGORIES){ try{ CATEGORIES = JSON.parse(document.getElementById('categorydata').textContent); }catch(e){ CATEGORIES=[]; } } return CATEGORIES; }
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };

  // ---- shared progress reader (reuses the SAME localStorage the courses engine writes) ----
  function courseProgress(){
    try{ return JSON.parse(localStorage.getItem('courses_progress_v1')) || {}; }catch(e){ return {}; }
  }
  function courseCounts(c, cp){
    if(c.status !== 'available') return {total:0, done:0, pct:0, lDone:0,eDone:0,qDone:0,pDone:0};
    var st = cp[c.id] || {lessons:{},exercises:{},quiz:{},projects:{}};
    var lDone = c.lessons.filter(function(l){return st.lessons && st.lessons[l.id];}).length;
    var eDone = c.exercises.filter(function(_,i){return st.exercises && st.exercises[i];}).length;
    var qDone = c.quiz.filter(function(_,i){return st.quiz && st.quiz[i]!==undefined;}).length;
    var pDone = c.projects.filter(function(p){return st.projects && st.projects[p.id];}).length;
    // Courses with an interactive track no longer have a Lessons checkbox UI -- excluded
    // from the completion total so 100% stays reachable; lDone is still returned for display.
    // Python's course-level exercises tab was also removed (migrated into the shared bank).
    var total = (c.linked ? 0 : c.lessons.length)+((c.id==='python'||c.id==='sql'||c.id==='oop') ? 0 : c.exercises.length)+c.quiz.length+c.projects.length;
    var done = (c.linked ? 0 : lDone)+((c.id==='python'||c.id==='sql'||c.id==='oop') ? 0 : eDone)+qDone+pDone;
    return {total:total, done:done, pct: total?Math.round(done/total*100):0, lDone:lDone,eDone:eDone,qDone:qDone,pDone:pDone};
  }
  function quizAccuracy(c, cp){
    var st = cp[c.id]; if(!st || !st.quiz) return null;
    var answered = Object.keys(st.quiz);
    if(!answered.length) return null;
    var correct = 0;
    answered.forEach(function(i){ if(c.quiz[i] && c.quiz[i].correct === st.quiz[i]) correct++; });
    return {correct: correct, total: answered.length, pct: Math.round(correct/answered.length*100)};
  }

  function activityLog(){ return (window.cxGetActivityLog && window.cxGetActivityLog()) || {}; }
  function dateStr(d){ return d.toISOString().slice(0,10); }
  function lastNDays(n){
    var out = []; var d = new Date();
    for(var i=0;i<n;i++){ out.push(dateStr(d)); d.setDate(d.getDate()-1); }
    return out;
  }
  function computeStreak(){
    var log = activityLog();
    var streak = 0; var d = new Date();
    while(true){
      var ds = dateStr(d);
      var e = log[ds];
      var active = e && (e.lessons+e.exercises+e.quiz+e.projects) > 0;
      if(!active) break;
      streak++;
      d.setDate(d.getDate()-1);
    }
    return streak;
  }
  function totalLifetimeCounts(){
    var log = activityLog();
    var tot = {lessons:0, exercises:0, quiz:0, quizCorrect:0, projects:0, minutes:0};
    Object.keys(log).forEach(function(d){
      var e = log[d];
      tot.lessons += e.lessons||0; tot.exercises += e.exercises||0; tot.quiz += e.quiz||0;
      tot.quizCorrect += e.quizCorrect||0; tot.projects += e.projects||0; tot.minutes += e.minutes||0;
    });
    return tot;
  }

  // ============ MAIN RENDER ============
  var curSubTab = 'achievements';
  window.mlRender = function(){
    var html = '<div class="ml-top"><button class="ml-back" data-act="showTrack(\'hub\')">&larr; Home</button></div>'
      + '<div class="ml-head"><div class="ml-eyebrow">Your progress, all in one place</div>'
      + '<h1 class="ml-h1">My Learning</h1></div>'
      + '<div class="ml-tabs" role="tablist">'
        + mlTabBtn('achievements','Achievements')
        + mlTabBtn('dashboard','Dashboard')
        + mlTabBtn('skilltree','Skill Tree')
        + mlTabBtn('planner','Planner')
        + mlTabBtn('recommend','For You')
        + mlTabBtn('focusquiz','Focus Quiz')
        + mlTabBtn('backup','Backup')
      + '</div>'
      + '<div id="mlPanels">'
        + mlPanel('achievements', achievementsHTML())
        + mlPanel('dashboard', dashboardHTML())
        + mlPanel('skilltree', skillTreeHTML())
        + mlPanel('planner', plannerHTML())
        + mlPanel('recommend', recommendHTML())
        + mlPanel('focusquiz', focusQuizHTML())
        + mlPanel('backup', backupHTML())
      + '</div>';
    document.getElementById('mlView').innerHTML = html;
    window.mlTab(curSubTab);
  };
  function mlTabBtn(t,label){ return '<button class="ml-tab" role="tab" data-act="mlTab(\''+t+'\')" id="mltab_'+t+'">'+label+'</button>'; }
  function mlPanel(t,inner){ return '<div class="ml-panel" id="mlpanel_'+t+'">'+inner+'</div>'; }
  window.mlTab = function(t){
    curSubTab = t;
    ['achievements','dashboard','skilltree','planner','recommend','focusquiz','backup'].forEach(function(x){
      var tab=document.getElementById('mltab_'+x), pan=document.getElementById('mlpanel_'+x);
      if(tab) tab.classList.toggle('active', x===t);
      if(pan) pan.classList.toggle('active', x===t);
    });
  };

  // ============ MILESTONE 6: ADAPTIVE FOCUS QUIZ (Phase 3C.3) ============
  var _focusSession = null; // {questions, answered:{}} -- session state, not persisted across reload
  function focusQuizHTML(){
    var esc2 = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
    if(!window.generateAdaptiveQuiz) return '<p class="ml-empty">Focus quiz isn\'t available yet.</p>';
    var result = window.generateAdaptiveQuiz();
    _focusSession = { questions: result.questions, answered: {} };
    var lead = '<p class="ml-lead">'+esc2(result.message)+'</p>';
    if(!result.questions.length){
      return lead;
    }
    var qsHtml = result.questions.map(function(item, idx){
      var q = item.q;
      var opts = q.options.map(function(o, oi){
        return '<button class="ml-fq-opt" data-act="mlFocusAnswer('+idx+','+oi+')">'+esc2(o)+'</button>';
      }).join('');
      return '<div class="ml-fq-q" id="mlfq_'+idx+'">'
        + '<div class="ml-fq-tag">'+esc2(item.courseTitle)+' &middot; '+esc2(item.concept)+'</div>'
        + '<p class="ml-fq-text">'+(idx+1)+'. '+esc2(q.q)+'</p>'
        + '<div class="ml-fq-opts">'+opts+'</div>'
        + '<div class="ml-fq-fb" id="mlfqfb_'+idx+'" aria-live="polite"></div>'
        + '</div>';
    }).join('');
    return lead + '<div id="mlFocusQuestions">'+qsHtml+'</div>'
      + '<button class="ml-reset" data-act="mlRefreshFocusQuiz()">Get a new set</button>';
  }
  window.mlFocusAnswer = function(qIdx, optIdx){
    if(!_focusSession || _focusSession.answered[qIdx] !== undefined) return;
    var item = _focusSession.questions[qIdx];
    var q = item.q;
    var correct = optIdx === q.correct;
    _focusSession.answered[qIdx] = optIdx;
    if(window.cxLogQuizAttempt) window.cxLogQuizAttempt(item.concept, correct);
    var opts = document.querySelectorAll('#mlfq_'+qIdx+' .ml-fq-opt');
    opts.forEach(function(btn, oi){
      btn.disabled = true;
      if(oi === q.correct) btn.classList.add('correct');
      else if(oi === optIdx) btn.classList.add('wrong');
    });
    var fb = document.getElementById('mlfqfb_'+qIdx);
    if(fb) fb.textContent = correct ? '✓ Correct' : 'Not quite — the highlighted answer is right.';
  };
  window.mlRefreshFocusQuiz = function(){
    var el = document.getElementById('mlpanel_focusquiz');
    if(el) el.innerHTML = focusQuizHTML();
  };

  // ============ MILESTONE 7: DATA & BACKUP (Phase 3D.3) ============
  var _pendingImport = null;
  function backupHTML(){
    return '<div class="cx-tutor-section"><h3>Export your progress</h3>'
      + '<p class="cx-lesson-explain">Downloads a JSON file containing only your saved progress (lessons, exercises, checkpoints, projects, quiz history, and preferences) &mdash; never a full browser-storage dump.</p>'
      + '<button class="cx-tutor-action-btn" data-act="mlExportProgress()">Download backup (.json)</button>'
      + '</div>'
      + '<div class="cx-tutor-section"><h3>Import a backup</h3>'
      + '<p class="cx-lesson-explain">Select a previously exported file. Nothing is applied until you review a preview and confirm.</p>'
      + '<input type="file" id="mlImportFile" aria-label="Import progress file" accept="application/json" class="ml-import-input">'
      + '<div id="mlImportPreview"></div>'
      + '</div>'
      + '<div class="cx-tutor-section"><h3>Reset progress</h3>'
      + '<p class="cx-lesson-explain">Clears all saved lesson/exercise/quiz/project progress and quiz history on this device. Preferences (theme, planner goals) are kept. A backup is taken automatically first.</p>'
      + '<button class="ml-reset" data-act="mlConfirmReset()">Reset all progress&hellip;</button>'
      + '</div>';
  }

  window.mlExportProgress = function(){
    if(window.cxExportProgress) window.cxExportProgress();
  };

  // Wire the file input via a real 'change' listener (a plain file input isn't a
  // data-act target -- FileReader access needs the File object directly).
  document.addEventListener('change', function(e){
    if(e.target && e.target.id === 'mlImportFile'){
      var file = e.target.files && e.target.files[0];
      if(!file) return;
      var reader = new FileReader();
      reader.onload = function(){
        var validated = window.cxValidateImport(reader.result);
        _pendingImport = validated.ok ? validated : null;
        renderImportPreview(validated);
      };
      reader.onerror = function(){
        renderImportPreview({ok:false, errors:['Could not read the selected file.'], warnings:[]});
      };
      reader.readAsText(file);
    }
  });

  function renderImportPreview(v){
    var el = document.getElementById('mlImportPreview');
    if(!el) return;
    var esc3 = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
    if(!v.ok){
      el.innerHTML = '<div class="ml-import-errors"><b>This file can\'t be imported:</b><ul>'
        + v.errors.map(function(e){return '<li>'+esc3(e)+'</li>';}).join('') + '</ul></div>';
      return;
    }
    var p = v.preview;
    var html = '<div class="ml-import-summary">'
      + '<p><b>File details:</b> exported by app version '+esc3(v.appVersion)+(v.exportedAt?' on '+esc3(new Date(v.exportedAt).toLocaleString()):'')+'</p>'
      + '<ul class="cx-tutor-list">'
        + '<li>'+p.coursesWithProgress+' course'+(p.coursesWithProgress===1?'':'s')+' with saved progress</li>'
        + '<li>'+p.lessonsCompleted+' lesson'+(p.lessonsCompleted===1?'':'s')+' completed</li>'
        + '<li>'+p.exercisesCompleted+' exercise'+(p.exercisesCompleted===1?'':'s')+' completed</li>'
        + '<li>'+p.quizAnswered+' quiz answer'+(p.quizAnswered===1?'':'s')+' recorded, plus '+p.quizHistoryEntries+' history entries</li>'
        + '<li>'+p.earnedAchievements+' achievement'+(p.earnedAchievements===1?'':'s')+' earned at export time (recomputed fresh after import, not restored directly)</li>'
        + (p.hasRoadmap ? '<li>Roadmap progress included</li>' : '')
        + (p.hasSql ? '<li>SQL Mastery track progress included</li>' : '')
        + (p.hasPython ? '<li>Python Path track progress included</li>' : '')
      + '</ul>';
    if(v.unknownCourseIds && v.unknownCourseIds.length){
      html += '<p class="ml-import-warn">'+v.unknownCourseIds.length+' course ID'+(v.unknownCourseIds.length===1?'':'s')+' in this file '+(v.unknownCourseIds.length===1?"isn't":"aren't")+' recognized by this version of the platform (possibly renamed or removed): '
        + esc3(v.unknownCourseIds.join(', ')) + '. This data will be kept but not shown in the current UI.</p>';
    }
    if(v.warnings && v.warnings.length){
      html += '<p class="ml-import-warn"><b>Skipped during validation:</b></p><ul class="cx-tutor-list">'
        + v.warnings.map(function(w){return '<li>'+esc3(w)+'</li>';}).join('') + '</ul>';
    }
    html += '<div class="ml-import-actions">'
      + '<label class="ml-import-mode"><input type="radio" name="mlImportMode" value="merge" checked> Merge with current progress (keeps the more advanced state; recommended)</label>'
      + '<label class="ml-import-mode"><input type="radio" name="mlImportMode" value="replace"> Replace current progress with this file\'s values where present</label>'
      + '<label class="ml-import-mode"><input type="checkbox" id="mlImportPrefs" checked> Also import preferences (theme, recently viewed, planner goals)</label>'
      + '<div class="ml-import-buttons">'
        + '<button class="cx-tutor-action-btn" data-act="mlConfirmImportApply()">Apply import</button>'
        + '<button class="cx-ghost" data-act="mlCancelImport()">Cancel</button>'
      + '</div></div>';
    el.innerHTML = html;
  }

  window.mlCancelImport = function(){
    _pendingImport = null;
    var input = document.getElementById('mlImportFile'); if(input) input.value = '';
    var el = document.getElementById('mlImportPreview'); if(el) el.innerHTML = '';
  };

  window.mlConfirmImportApply = function(){
    if(!_pendingImport) return;
    var modeEl = document.querySelector('input[name="mlImportMode"]:checked');
    var mode = modeEl ? modeEl.value : 'merge';
    var importPrefs = document.getElementById('mlImportPrefs');
    var doPrefs = importPrefs ? importPrefs.checked : false;
    window.cxApplyImport(_pendingImport, mode, doPrefs);
    var el = document.getElementById('mlImportPreview');
    if(el) el.innerHTML = '<p class="ml-empty" style="color:#7ee0a0">Import applied. Reloading to refresh every panel with the new state&hellip;</p>';
    setTimeout(function(){ location.reload(); }, 900);
  };

  window.mlConfirmReset = function(){
    if(!confirm('Reset ALL saved progress on this device? A backup is taken automatically first, but this cannot be undone from the UI. Continue?')) return;
    window.cxResetAllProgress(true);
    alert('Progress reset. Reloading now.');
    location.reload();
  };


  // ============ MILESTONE 1: ACHIEVEMENTS ============
  function computeBadges(){
    var courses = getCourses(); var cp = courseProgress();
    var lifetime = totalLifetimeCounts();
    var streak = computeStreak();
    var totalLessonsAllTime = lifetime.lessons; // real, from the activity log

    var badges = [];
    // Course completion badges -- one per fully-completed available course
    courses.filter(function(c){ return c.status==='available'; }).forEach(function(c){
      var k = courseCounts(c, cp);
      if(k.total>0 && k.pct>=100){
        badges.push({id:'course-'+c.id, icon:'&#127942;', title:c.title+' Complete', desc:'Finished every lesson, exercise, checkpoint, and project.', earned:true});
      }
    });
    // Streak badges
    badges.push({id:'streak-7', icon:'&#128293;', title:'7-Day Streak', desc:'Learn on 7 consecutive days.', earned: streak>=7, progress: Math.min(streak,7)+'/7 days'});
    badges.push({id:'streak-30', icon:'&#128293;', title:'30-Day Streak', desc:'Learn on 30 consecutive days.', earned: streak>=30, progress: Math.min(streak,30)+'/30 days'});
    // Milestone badges (lessons)
    [10,50,100].forEach(function(n){
      badges.push({id:'lessons-'+n, icon:'&#127775;', title:n+' Lessons', desc:'Complete '+n+' lessons across the whole platform.', earned: totalLessonsAllTime>=n, progress: Math.min(totalLessonsAllTime,n)+'/'+n});
    });
    // Project completion awards
    badges.push({id:'project-first', icon:'&#128736;', title:'First Project', desc:'Complete your first project.', earned: lifetime.projects>=1});
    badges.push({id:'project-10', icon:'&#128736;', title:'Project Builder', desc:'Complete 10 projects.', earned: lifetime.projects>=10, progress: Math.min(lifetime.projects,10)+'/10'});
    // Quiz accuracy achievement
    var qAcc = lifetime.quiz>0 ? Math.round(lifetime.quizCorrect/lifetime.quiz*100) : 0;
    badges.push({id:'sharp-shooter', icon:'&#127919;', title:'Sharp Shooter', desc:'80%+ accuracy across 20+ answered checkpoints.', earned: lifetime.quiz>=20 && qAcc>=80, progress: lifetime.quiz>=20 ? qAcc+'% accuracy' : lifetime.quiz+'/20 answered'});
    return badges;
  }
  window.cxComputeAchievements = computeBadges;

  function achievementsHTML(){
    var badges = computeBadges();
    var earnedCount = badges.filter(function(b){return b.earned;}).length;
    var cards = badges.map(function(b){
      return '<div class="ml-badge'+(b.earned?' earned':'')+'">'
        + '<div class="ml-badge-icon">'+b.icon+'</div>'
        + '<div class="ml-badge-title">'+esc(b.title)+'</div>'
        + '<div class="ml-badge-desc">'+esc(b.desc)+'</div>'
        + (b.progress && !b.earned ? '<div class="ml-badge-progress">'+esc(b.progress)+'</div>' : '')
        + (b.earned ? '<div class="ml-badge-earned">&#10003; Earned</div>' : '')
        + '</div>';
    }).join('');
    return '<p class="ml-lead">'+earnedCount+' of '+badges.length+' achievements earned. Every badge here reflects real, saved progress &mdash; nothing is simulated.</p>'
      + '<div class="ml-badge-grid">'+cards+'</div>';
  }

  // ============ MILESTONE 2: DASHBOARD ============
  function dashboardHTML(){
    var courses = getCourses(); var cp = courseProgress();
    var lifetime = totalLifetimeCounts();
    var log = activityLog();
    var week = lastNDays(7);
    var lessonsThisWeek = week.reduce(function(sum,d){ return sum + (log[d] ? log[d].lessons : 0); }, 0);
    var minutesThisWeek = week.reduce(function(sum,d){ return sum + (log[d] ? log[d].minutes : 0); }, 0);

    // strongest/weakest by quiz accuracy across courses with answered quizzes
    var accByCourse = [];
    courses.filter(function(c){return c.status==='available';}).forEach(function(c){
      var a = quizAccuracy(c, cp);
      if(a && a.total>=2) accByCourse.push({course:c, acc:a});
    });
    accByCourse.sort(function(a,b){ return b.acc.pct - a.acc.pct; });
    var strongest = accByCourse[0];
    var weakest = accByCourse[accByCourse.length-1];

    // recommended next: first available, not-started course whose prereqs are all done
    var notStarted = courses.filter(function(c){ return c.status==='available' && courseCounts(c,cp).done===0; });
    var recommended = notStarted.find(function(c){
      return (c.prerequisites||[]).every(function(p){ var pc=courses.find(function(x){return x.id===p;}); return pc && courseCounts(pc,cp).pct>=100; });
    });

    var weekBars = week.slice().reverse().map(function(d){
      var e = log[d] || {lessons:0,exercises:0,quiz:0,projects:0};
      var total = e.lessons+e.exercises+e.quiz+e.projects;
      var dayLabel = new Date(d+'T00:00:00').toLocaleDateString(undefined,{weekday:'short'});
      var h = Math.min(60, total*8);
      return '<div class="ml-week-col"><div class="ml-week-bar" style="height:'+(h||2)+'px" title="'+total+' items"></div><div class="ml-week-lbl">'+dayLabel+'</div></div>';
    }).join('');

    return '<div class="ml-stat-grid">'
      + '<div class="ml-stat-card"><div class="ml-stat-num">'+Math.round(lifetime.minutes)+'</div><div class="ml-stat-lbl">Minutes learning (lifetime)</div></div>'
      + '<div class="ml-stat-card"><div class="ml-stat-num">'+lessonsThisWeek+'</div><div class="ml-stat-lbl">Lessons this week</div></div>'
      + '<div class="ml-stat-card"><div class="ml-stat-num">'+Math.round(minutesThisWeek)+'</div><div class="ml-stat-lbl">Minutes this week</div></div>'
      + '<div class="ml-stat-card"><div class="ml-stat-num">'+computeStreak()+'</div><div class="ml-stat-lbl">Day streak</div></div>'
      + '</div>'
      + '<div class="ml-section-h">This week</div>'
      + '<div class="ml-week-chart">'+weekBars+'</div>'
      + '<div class="ml-section-h">Quiz accuracy by subject</div>'
      + (accByCourse.length ? (
          '<div class="ml-strength-row"><span class="ml-strength-lbl">Strongest:</span> '+(strongest?esc(strongest.course.title)+' ('+strongest.acc.pct+'%)':'&mdash;')+'</div>'
        + '<div class="ml-strength-row"><span class="ml-strength-lbl">Could use review:</span> '+(weakest && weakest!==strongest?esc(weakest.course.title)+' ('+weakest.acc.pct+'%)':'&mdash;')+'</div>'
        ) : '<p class="ml-empty">Answer a few quiz checkpoints to see your strongest and weakest subjects here.</p>')
      + '<div class="ml-section-h">Recommended next</div>'
      + (recommended ? '<button class="ml-rec-card" data-act="mlJumpCourse(\''+recommended.id+'\')">'
          + '<span class="ml-rec-icon" style="background:'+recommended.color+'22;">'+recommended.icon+'</span>'
          + '<span><b>'+esc(recommended.title)+'</b><br><span class="ml-rec-sub">Prerequisites complete &mdash; ready when you are</span></span></button>'
        : '<p class="ml-empty">Keep going on your current courses &mdash; a recommendation will appear here once you finish one.</p>');
  }

  // ============ MILESTONE 3: SKILL TREE ============
  function skillTreeHTML(){
    var courses = getCourses(); var cp = courseProgress(); var categories = getCategories();
    var byCategory = {};
    courses.filter(function(c){return c.status==='available';}).forEach(function(c){
      byCategory[c.category] = byCategory[c.category] || [];
      byCategory[c.category].push(c);
    });
    var html = '';
    categories.forEach(function(cat){
      var list = byCategory[cat.id]; if(!list || !list.length) return;
      var rows = list.map(function(c){
        var k = courseCounts(c, cp);
        var stars = Math.round(k.pct/20); // 0-100% -> 0-5 stars
        var starHtml = '';
        for(var s=1;s<=5;s++) starHtml += '<span class="ml-star'+(s<=stars?' filled':'')+'">&#9733;</span>';
        return '<div class="ml-skill-row" data-act="mlJumpCourse(\''+c.id+'\')" tabindex="0" role="button">'
          + '<span class="ml-skill-icon" style="background:'+c.color+'22;">'+c.icon+'</span>'
          + '<span class="ml-skill-name">'+esc(c.title)+'</span>'
          + '<span class="ml-skill-stars">'+starHtml+'</span>'
          + '<span class="ml-skill-pct">'+k.pct+'%</span>'
          + '</div>';
      }).join('');
      html += '<div class="ml-skill-cat"><div class="ml-skill-cat-h">'+cat.icon+' '+esc(cat.title)+'</div>'+rows+'</div>';
    });
    return html || '<p class="ml-empty">No available courses yet.</p>';
  }

  // ============ MILESTONE 4: STUDY PLANNER ============
  var PLS = 'learning_planner_v1';
  function loadPlanner(){ try{ return JSON.parse(localStorage.getItem(PLS)) || {dailyGoal:1,weeklyGoal:5}; }catch(e){ return {dailyGoal:1,weeklyGoal:5}; } }
  function savePlanner(p){ try{ localStorage.setItem(PLS, JSON.stringify(p)); }catch(e){} }
  function plannerHTML(){
    var courses = getCourses(); var cp = courseProgress();
    var planner = loadPlanner();
    var log = activityLog();
    var todayKey = new Date().toISOString().slice(0,10);
    var todayLessons = (log[todayKey] && log[todayKey].lessons) || 0;
    var week = lastNDays(7);
    var weekLessons = week.reduce(function(sum,d){ return sum + (log[d] ? log[d].lessons : 0); }, 0);

    // continue where left off: most recently touched in-progress course
    var recentIds = []; try{ recentIds = JSON.parse(localStorage.getItem('courses_recent_v1'))||[]; }catch(e){}
    var continueCourse = recentIds.map(function(id){ return courses.find(function(c){return c.id===id;}); })
      .find(function(c){ return c && c.status==='available' && courseCounts(c,cp).pct<100; });

    // estimated time to finish every in-progress course
    var inProgress = courses.filter(function(c){ var k=courseCounts(c,cp); return c.status==='available' && k.done>0 && k.pct<100; });
    var estimates = inProgress.map(function(c){
      var k = courseCounts(c,cp);
      var remainingHours = c.estimatedHours ? Math.round(c.estimatedHours * (1 - k.pct/100) * 10)/10 : null;
      return {course:c, k:k, remainingHours:remainingHours};
    });

    return '<div class="ml-goal-row">'
      + '<div class="ml-goal-card"><div class="ml-goal-lbl">Daily goal</div>'
        + '<div class="ml-goal-val">'+todayLessons+' / <input type="number" min="1" max="20" class="ml-goal-input" id="mlDailyGoal" aria-label="Daily lesson goal" value="'+planner.dailyGoal+'" data-change="mlSetGoal(\'dailyGoal\')"> lessons</div></div>'
      + '<div class="ml-goal-card"><div class="ml-goal-lbl">Weekly goal</div>'
        + '<div class="ml-goal-val">'+weekLessons+' / <input type="number" min="1" max="100" class="ml-goal-input" id="mlWeeklyGoal" aria-label="Weekly lesson goal" value="'+planner.weeklyGoal+'" data-change="mlSetGoal(\'weeklyGoal\')"> lessons</div></div>'
      + '</div>'
      + '<div class="ml-section-h">Continue where you left off</div>'
      + (continueCourse ? '<button class="ml-rec-card" data-act="mlJumpCourse(\''+continueCourse.id+'\')">'
          + '<span class="ml-rec-icon" style="background:'+continueCourse.color+'22;">'+continueCourse.icon+'</span>'
          + '<span><b>'+esc(continueCourse.title)+'</b><br><span class="ml-rec-sub">'+courseCounts(continueCourse,cp).pct+'% complete</span></span></button>'
        : '<p class="ml-empty">Open a course to start tracking where you left off.</p>')
      + '<div class="ml-section-h">Estimated time to finish (in-progress courses)</div>'
      + (estimates.length ? estimates.map(function(o){
          return '<div class="ml-est-row"><span>'+esc(o.course.title)+'</span><span class="ml-est-hours">'+(o.remainingHours!=null?'~'+o.remainingHours+'h left':o.k.pct+'% done')+'</span></div>';
        }).join('') : '<p class="ml-empty">No courses in progress right now.</p>');
  }
  window.mlSetGoal = function(key){
    var el = document.getElementById(key==='dailyGoal'?'mlDailyGoal':'mlWeeklyGoal');
    var p = loadPlanner();
    p[key] = Math.max(1, parseInt(el.value,10) || 1);
    savePlanner(p);
  };

  // ============ MILESTONE 5: RECOMMENDATIONS (rule-based, from real data) ============
  function recommendHTML(){
    var courses = getCourses(); var cp = courseProgress();
    var recs = [];

    // Rule 1: prerequisites complete -> suggest the course they unlock
    courses.filter(function(c){return c.status==='available';}).forEach(function(c){
      var k = courseCounts(c, cp);
      if(k.done===0 && (c.prerequisites||[]).length){
        var allDone = c.prerequisites.every(function(p){ var pc=courses.find(function(x){return x.id===p;}); return pc && courseCounts(pc,cp).pct>=100; });
        if(allDone){
          var prereqTitles = c.prerequisites.map(function(p){ var pc=courses.find(function(x){return x.id===p;}); return pc?pc.title:p; }).join(' and ');
          recs.push({course:c, reason: "You've finished "+prereqTitles+" &mdash; "+c.title+" is a natural next step."});
        }
      }
    });
    // Rule 2: low quiz accuracy on a prerequisite of an in-progress course -> suggest revisiting
    courses.filter(function(c){return c.status==='available';}).forEach(function(c){
      var k = courseCounts(c, cp);
      if(k.done>0 && k.pct<100){
        (c.prerequisites||[]).forEach(function(p){
          var pc = courses.find(function(x){return x.id===p;});
          if(!pc) return;
          var acc = quizAccuracy(pc, cp);
          if(acc && acc.total>=2 && acc.pct<60){
            recs.push({course:pc, reason: "Your checkpoint scores in "+pc.title+" (used by "+c.title+") suggest revisiting it &mdash; "+acc.pct+"% accuracy so far."});
          }
        });
      }
    });
    // Rule 3: suggested-next field from an in-progress or completed course
    courses.filter(function(c){return c.status==='available';}).forEach(function(c){
      var k = courseCounts(c, cp);
      if(k.pct>=100 && c.suggestedNext){
        var nc = courses.find(function(x){return x.id===c.suggestedNext;});
        if(nc && nc.status==='available' && courseCounts(nc,cp).done===0){
          recs.push({course:nc, reason: "You completed "+c.title+" &mdash; its suggested next step is "+nc.title+"."});
        }
      }
    });

    // de-dupe by course id, keep first reason
    var seen = {}; var deduped = [];
    recs.forEach(function(r){ if(!seen[r.course.id]){ seen[r.course.id]=true; deduped.push(r); } });

    if(!deduped.length){
      return '<p class="ml-empty">Complete a course or answer a few quiz checkpoints, and personalized recommendations will appear here &mdash; based on your real prerequisite and accuracy data, not guesswork.</p>';
    }
    return deduped.slice(0,6).map(function(r){
      return '<button class="ml-rec-card ml-rec-wide" data-act="mlJumpCourse(\''+r.course.id+'\')">'
        + '<span class="ml-rec-icon" style="background:'+r.course.color+'22;">'+r.course.icon+'</span>'
        + '<span><b>'+esc(r.course.title)+'</b><br><span class="ml-rec-sub">'+r.reason+'</span></span></button>';
    }).join('');
  }

  window.mlJumpCourse = function(courseId){ if(window.cxOpen) window.cxOpen(courseId); };
})();

