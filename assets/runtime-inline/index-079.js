
(function(){
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
  var _cpCur = null; // currently open path id, or null for the list view

  function getCourses(){ try{ return (window.__CSAI_COURSES__||(window.__CSAI_COURSES__=JSON.parse(document.getElementById('coursedata').textContent))); }catch(e){ return []; } }
  function getPaths(){ try{ return JSON.parse(document.getElementById('companypathsdata').textContent); }catch(e){ return []; } }
  function byId(courses, id){ return courses.find(function(c){ return c.id===id; }); }
  function getProgress(){ try{ return JSON.parse(localStorage.getItem('courses_progress_v1')) || {}; }catch(e){ return {}; } }

  // Self-contained progress calculation -- mirrors the same real logic used
  // elsewhere on the platform (lessons keyed by ID post-v3.2 migration; exercises/
  // quiz/projects keyed by index), so Company Paths reads the SAME real saved
  // progress, not a separate or approximated source.
  function courseCompletionPct(course, progress){
    if(!course) return 0;
    var st = progress[course.id] || {lessons:{},exercises:{},quiz:{},projects:{}};
    var lDone = (course.lessons||[]).filter(function(l){ return st.lessons && st.lessons[l.id]; }).length;
    var eDone = (course.exercises||[]).filter(function(_,i){ return st.exercises && st.exercises[i]!==undefined; }).length;
    var qDone = (course.quiz||[]).filter(function(_,i){ return st.quiz && st.quiz[i]!==undefined; }).length;
    var pDone = (course.projects||[]).filter(function(p){ return st.projects && st.projects[p.id]; }).length;
    // Courses with a full interactive track no longer have a Lessons tab/checkbox UI
    // (the track itself is the study material) -- lesson completion is informational
    // only for those, and excluded from the completion total so 100% stays reachable.
    // Python's course-level exercises tab was also removed (migrated into the shared bank).
    var total = (course.linked ? 0 : (course.lessons||[]).length) + ((course.id==='python'||course.id==='sql'||course.id==='oop') ? 0 : (course.exercises||[]).length) + (course.quiz||[]).length + (course.projects||[]).length;
    var done = (course.linked ? 0 : lDone) + ((course.id==='python'||course.id==='sql'||course.id==='oop') ? 0 : eDone) + qDone + pDone;
    return total ? Math.round(done/total*100) : 0;
  }

  function pathProgress(path, courses, progress){
    var required = path.requiredCourses.map(function(rc){ return byId(courses, rc.id); }).filter(Boolean);
    var totalHours = 0, doneHours = 0;
    required.forEach(function(c){
      var h = c.estimatedHours || 0;
      totalHours += h;
      doneHours += h * (courseCompletionPct(c, progress) / 100);
    });
    return totalHours ? Math.round(doneHours/totalHours*100) : 0;
  }

  // A course is locked if any of its OWN real prerequisites (validated elsewhere
  // on the platform) aren't yet complete -- not based on curated path position,
  // which is just our suggested order, not a real dependency.
  function isLocked(course, courses, progress){
    // Prerequisite-based locking was removed as a permanent platform policy
    // (v5.15.1): no course may ever be locked because another course is
    // incomplete. Always returns false, independent of any prerequisites
    // data a course object might still carry.
    return false;
  }

  function courseStatus(course, courses, progress){
    var pct = courseCompletionPct(course, progress);
    if(pct >= 100) return 'completed';
    if(isLocked(course, courses, progress)) return 'locked';
    if(pct > 0) return 'in-progress';
    return 'not-started';
  }

  // Simple, explainable heuristic: first course in the curated required order
  // that isn't yet complete and isn't locked; falls back to optional courses
  // once every required course is done. Not a black-box recommendation --
  // just "the next thing in the sequence you can actually start right now."
  function nextRecommendedCourseId(path, courses, progress){
    for(var i=0;i<path.requiredCourses.length;i++){
      var c = byId(courses, path.requiredCourses[i].id);
      if(!c) continue;
      var status = courseStatus(c, courses, progress);
      if(status==='in-progress' || status==='not-started') return c.id;
    }
    for(var j=0;j<(path.optionalCourses||[]).length;j++){
      var oc = byId(courses, path.optionalCourses[j].id);
      if(!oc) continue;
      var oStatus = courseStatus(oc, courses, progress);
      if(oStatus==='in-progress' || oStatus==='not-started') return oc.id;
    }
    return null;
  }

  function skillCovered(skillEntry, courses, progress){
    var backing = (skillEntry.courseIds||[]).map(function(id){ return byId(courses, id); }).filter(Boolean);
    return backing.length>0 && backing.every(function(c){ return courseCompletionPct(c, progress) >= 100; });
  }

  // Hours-weighted completion across a specific set of courses -- the same
  // real calculation pathProgress uses, generalized so it can be applied to
  // different course subsets (required-only, interview-prep-relevant, etc.)
  function weightedCompletion(courseIds, courses, progress){
    var list = courseIds.map(function(id){ return byId(courses, id); }).filter(Boolean);
    var totalHours = 0, doneHours = 0;
    list.forEach(function(c){
      var h = c.estimatedHours || 0;
      totalHours += h;
      doneHours += h * (courseCompletionPct(c, progress) / 100);
    });
    return totalHours ? Math.round(doneHours/totalHours*100) : 0;
  }

  // Item-count-based completion across lessons+exercises+quiz ONLY (deliberately
  // excluding projects, unlike courseCompletionPct's blended figure) so this is
  // orthogonal to the Projects bar below -- "have you learned the material" as
  // a genuinely separate signal from "have you built the projects."
  function technicalFoundationsCompletion(path, courses, progress){
    var required = path.requiredCourses.map(function(rc){ return byId(courses, rc.id); }).filter(Boolean);
    var total = 0, done = 0;
    required.forEach(function(c){
      var st = progress[c.id] || {};
      var lessons = c.lessons || [], exercises = c.exercises || [], quiz = c.quiz || [];
      total += lessons.length + exercises.length + quiz.length;
      done += lessons.filter(function(l){ return st.lessons && st.lessons[l.id]; }).length;
      done += exercises.filter(function(_,i){ return st.exercises && st.exercises[i]!==undefined; }).length;
      done += quiz.filter(function(_,i){ return st.quiz && st.quiz[i]!==undefined; }).length;
    });
    return total ? Math.round(done/total*100) : 0;
  }

  // Real, distinct completion percentage of just the PROJECT checkboxes
  // (cxToggleProject) across required courses -- separate from lessons/
  // exercises/quiz, since "have you built the projects" is a genuinely
  // different signal than "have you read the lessons."
  function projectsCompletion(path, courses, progress){
    var required = path.requiredCourses.map(function(rc){ return byId(courses, rc.id); }).filter(Boolean);
    var total = 0, done = 0;
    required.forEach(function(c){
      var st = progress[c.id] || {};
      var projects = c.projects || [];
      total += projects.length;
      done += projects.filter(function(p){ return st.projects && st.projects[p.id]; }).length;
    });
    return total ? Math.round(done/total*100) : 0;
  }

  // A single percentage can hide real gaps (amazing projects, weak DSA --
  // or the reverse). This breaks readiness into distinct, honestly-computed
  // dimensions instead of collapsing everything into one number:
  // - Technical Foundations: lessons/exercises/quiz completion, required courses
  // - Projects: real project-checkbox completion, required courses
  // - Interview Preparation: completion of this path's curated interview-relevant
  //   courses (often includes courses outside the required list, like
  //   interview-prep/company-prep, so this is a genuinely different signal)
  // - Overall: the existing composite (70% required-course completion +
  //   30% skill-checklist coverage) -- unchanged, just now shown alongside
  //   the breakdown rather than standing alone.
  function readinessBreakdown(path, courses, progress){
    var requiredPct = pathProgress(path, courses, progress);
    var checklist = path.skillChecklist || [];
    var coveredCount = checklist.filter(function(s){ return skillCovered(s, courses, progress); }).length;
    var skillPct = checklist.length ? Math.round(coveredCount/checklist.length*100) : 0;
    var overall = Math.round(requiredPct*0.7 + skillPct*0.3);
    var technical = technicalFoundationsCompletion(path, courses, progress);
    var projects = projectsCompletion(path, courses, progress);
    var interview = weightedCompletion(path.interviewPrepCourseIds||[], courses, progress);
    return {technical: technical, projects: projects, interview: interview, overall: overall,
      requiredPct: requiredPct, skillPct: skillPct, coveredCount: coveredCount, totalSkills: checklist.length};
  }

  // Grounded in the real, user-set weekly lesson goal from the Planner
  // (learning_planner_v1) -- defaults to its own stored default (5/week) if
  // the user never touched it. Counts remaining LESSONS specifically (not
  // exercises/quiz/projects) since that's the unit the weekly goal is stated in.
  function estimatedCompletion(path, courses, progress){
    var required = path.requiredCourses.map(function(rc){ return byId(courses, rc.id); }).filter(Boolean);
    var remainingLessons = 0;
    required.forEach(function(c){
      var st = progress[c.id] || {lessons:{}};
      var doneCount = (c.lessons||[]).filter(function(l){ return st.lessons && st.lessons[l.id]; }).length;
      remainingLessons += Math.max(0, (c.lessons||[]).length - doneCount);
    });
    if(remainingLessons === 0) return null;
    var weeklyGoal = 5;
    try{ var stored = JSON.parse(localStorage.getItem('learning_planner_v1')); if(stored && stored.weeklyGoal) weeklyGoal = stored.weeklyGoal; }catch(e){}
    var weeksRemaining = Math.ceil(remainingLessons / weeklyGoal);
    var d = new Date(); d.setDate(d.getDate() + weeksRemaining*7);
    return {remainingLessons: remainingLessons, weeklyGoal: weeklyGoal, weeksRemaining: weeksRemaining, estimatedDate: d};
  }

  function ring(pct){
    var r=26, c=2*Math.PI*r, off=c*(1-pct/100);
    return '<svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="'+r+'" fill="none" stroke="var(--cline)" stroke-width="6"/>'
      + '<circle cx="32" cy="32" r="'+r+'" fill="none" stroke="var(--cteal)" stroke-width="6" stroke-dasharray="'+c+'" stroke-dashoffset="'+off+'" transform="rotate(-90 32 32)" stroke-linecap="round"/>'
      + '<text x="32" y="37" text-anchor="middle" font-size="15" font-weight="700" fill="var(--cink)">'+pct+'%</text></svg>';
  }

  var STATUS_BADGE = {
    'completed': '<span class="cp-status-badge cp-status-done">&#9989; Completed</span>',
    'in-progress': '<span class="cp-status-badge cp-status-progress">&#128993; In Progress</span>',
    'locked': '<span class="cp-status-badge cp-status-locked">&#128274; Locked</span>',
    'not-started': '<span class="cp-status-badge cp-status-notstarted">Not started</span>'
  };

  function courseRowHTML(courses, progress, entry, isOptional, isNextRecommended){
    var c = byId(courses, entry.id);
    if(!c) return '';
    var pct = courseCompletionPct(c, progress);
    var status = courseStatus(c, courses, progress);
    var badge = isNextRecommended ? '<span class="cp-status-badge cp-status-next">&#11088; Next recommended</span>' : STATUS_BADGE[status];
    var lockNote = status==='locked' ? '<p class="cp-lock-note">Locked until: '+(c.prerequisites||[]).map(function(pid){var pc=byId(courses,pid); return pc?esc(pc.title):pid;}).join(', ')+'</p>' : '';
    return '<div class="cp-course-row'+(isOptional?' cp-optional':'')+(isNextRecommended?' cp-next-row':'')+'">'
      + '<div class="cp-course-main">'
        + '<button class="cp-course-title" data-act="cpGoToCourse(\''+c.id+'\')">'+esc(c.title)+'</button>'
        + '<p class="cp-course-why">'+esc(entry.why)+'</p>'
        + lockNote
      + '</div>'
      + '<div class="cp-course-meta">'+badge+'<span class="cp-pct-badge">'+pct+'%</span>'+(c.estimatedHours?'<span class="cp-hours">~'+c.estimatedHours+'h</span>':'')+'</div>'
      + '</div>';
  }

  function pathCardHTML(path, courses, progress){
    var pct = pathProgress(path, courses, progress);
    var totalHours = path.requiredCourses.reduce(function(sum, rc){ var c=byId(courses, rc.id); return sum + (c && c.estimatedHours || 0); }, 0);
    var nextId = nextRecommendedCourseId(path, courses, progress);
    var nextCourse = nextId ? byId(courses, nextId) : null;
    var nextLine = nextCourse ? '<p class="cp-path-next">&#11088; Next: '+esc(nextCourse.title)+'</p>' : '<p class="cp-path-next cp-path-done">&#9989; Path complete</p>';
    return '<div class="cp-path-card" data-act="cpOpenPath(\''+path.id+'\')" tabindex="0" role="button">'
      + '<div class="cp-path-ring">'+ring(pct)+'</div>'
      + '<div class="cp-path-body"><h3>'+esc(path.title)+'</h3>'
      + '<p class="cp-path-role">'+esc(path.targetRole)+'</p>'
      + '<p class="cp-path-meta">'+path.requiredCourses.length+' required courses &middot; ~'+Math.round(totalHours)+'h estimated</p>'
      + nextLine
      + '</div></div>';
  }

  window.cpGoToCourse = function(courseId){ if(window.cxOpen) window.cxOpen(courseId); };

  window.cpGoToInterviewPrep = function(courseId){
    if(window.cxOpenDetails) window.cxOpenDetails(courseId,'interview');
  };

  window.cpRender = function(){
    _cpCur = null;
    var courses = getCourses(), paths = getPaths(), progress = getProgress();
    var cards = paths.map(function(p){ return pathCardHTML(p, courses, progress); }).join('');
    document.getElementById('cpView').innerHTML =
      '<div class="cx-top"><button class="cx-back" data-act="showTrack(\'hub\')">&larr; Home</button></div>'
      + '<div class="cx-hero"><div><h1>Company Paths</h1>'
      + '<p class="cx-hero-blurb">Curated navigation over the existing course catalog, ordered and explained for a specific target role. No new content -- just a focused way through what\'s already here.</p></div></div>'
      + '<div class="cp-path-list">' + cards + '</div>';
  };

  window.cpOpenPath = function(pathId){
    _cpCur = pathId;
    var courses = getCourses(), paths = getPaths(), progress = getProgress();
    var path = paths.find(function(p){ return p.id===pathId; });
    if(!path){ window.cpRender(); return; }
    var pct = pathProgress(path, courses, progress);
    var totalHours = path.requiredCourses.reduce(function(sum, rc){ var c=byId(courses, rc.id); return sum + (c && c.estimatedHours || 0); }, 0);
    var nextId = nextRecommendedCourseId(path, courses, progress);
    var nextCourse = nextId ? byId(courses, nextId) : null;
    var readiness = readinessBreakdown(path, courses, progress);
    var completion = estimatedCompletion(path, courses, progress);

    var nextBanner = nextCourse
      ? '<div class="cp-next-banner">&#11088; Based on your current progress, your next highest-impact course is <b>'+esc(nextCourse.title)+'</b>.'
        + (completion ? ' At your current weekly goal of '+completion.weeklyGoal+' lesson'+(completion.weeklyGoal===1?'':'s')+'/week, you\'re on pace to finish this path\'s required courses around <b>'+completion.estimatedDate.toLocaleDateString(undefined,{month:'long',year:'numeric'})+'</b> ('+completion.remainingLessons+' lessons remaining).' : '')
        + '</div>'
      : '<div class="cp-next-banner cp-next-done">&#9989; You\'ve completed every required course in this path.</div>';

    function readinessBar(label, pct){
      return '<div class="cp-readiness-bar-row"><span class="cp-readiness-bar-lbl">'+label+'</span>'
        + '<div class="cp-readiness-bar-track"><div class="cp-readiness-bar-fill" style="width:'+pct+'%"></div></div>'
        + '<span class="cp-readiness-bar-pct">'+pct+'%</span></div>';
    }
    var readinessSection = '<div class="cx-overview-block"><h3>Ready to apply</h3>'
      + readinessBar('Technical Foundations', readiness.technical)
      + readinessBar('Projects', readiness.projects)
      + readinessBar('Interview Preparation', readiness.interview)
      + '<div class="cp-readiness-overall">'+readinessBar('Overall', readiness.overall)+'</div>'
      + '<p class="cp-readiness-breakdown">Skill checklist covered: <b>'+readiness.coveredCount+'/'+readiness.totalSkills+'</b></p>'
      + '<p class="cp-readiness-disclaimer">Each bar reflects real completion in a different area -- lessons/exercises/quiz, project checkboxes, and this path\'s interview-relevant courses -- so a strong project record doesn\'t hide a weak spot elsewhere. This is a completion indicator, not a prediction of interview or hiring outcomes.</p></div>';

    var requiredRows = path.requiredCourses.map(function(rc){ return courseRowHTML(courses, progress, rc, false, rc.id===nextId); }).join('');
    var optionalRows = (path.optionalCourses||[]).map(function(rc){ return courseRowHTML(courses, progress, rc, true, rc.id===nextId); }).join('');

    var checklist = (path.skillChecklist||[]).map(function(s){
      var covered = skillCovered(s, courses, progress);
      return '<li class="'+(covered?'cp-skill-covered':'cp-skill-missing')+'">'+(covered?'&#9989; ':'&#11036; ')+esc(s.skill)+'</li>';
    }).join('');

    var projects = (path.recommendedProjects||[]).map(function(rp){
      var c = byId(courses, rp.courseId);
      if(!c) return '';
      return '<div class="cp-rec-project"><button class="cp-course-title" data-act="cpGoToCourse(\''+c.id+'\')">'+esc(c.title)+'</button>'
        + '<p class="cp-course-why">'+esc(rp.label)+'</p></div>';
    }).join('');

    var interviewChips = (path.interviewPrepCourseIds||[]).map(function(cid){
      var c = byId(courses, cid);
      if(!c) return '';
      return '<span class="cx-prereq-chip" data-act="cpGoToInterviewPrep(\''+c.id+'\')" tabindex="0" role="button">'+esc(c.title)+'</span>';
    }).join('');

    document.getElementById('cpView').innerHTML =
      '<div class="cx-top"><button class="cx-back" data-act="showTrack(\'companypaths\')">&larr; Company Paths</button></div>'
      + '<div class="cx-hero"><div><div class="cx-hero-tag">'+esc(path.targetRole)+'</div><h1>'+esc(path.title)+'</h1>'
      + '<p class="cx-hero-blurb">'+esc(path.description)+'</p></div></div>'
      + '<div class="cx-detail-prog"><div class="road-progress-ring">'+ring(pct)+'</div>'
      + '<div class="cx-progress-txt"><b>'+pct+'% complete</b><div class="cx-progress-sub">'
      + path.requiredCourses.length+' required courses &middot; ~'+Math.round(totalHours)+'h estimated (real progress, from your saved course completion)</div></div></div>'
      + nextBanner
      + readinessSection
      + '<div class="cx-overview-block"><h3>Required courses, in order</h3>' + requiredRows + '</div>'
      + (optionalRows ? '<div class="cx-overview-block"><h3>Optional / advanced courses</h3>' + optionalRows + '</div>' : '')
      + '<div class="cx-overview-block"><h3>Skill checklist</h3><ul class="cp-checklist">' + checklist + '</ul></div>'
      + (projects ? '<div class="cx-overview-block"><h3>Recommended projects &amp; capstones</h3>' + projects + '</div>' : '')
      + (interviewChips ? '<div class="cx-overview-block"><h3>Interview preparation</h3><div class="cx-prereqs">' + interviewChips + '</div></div>' : '');
  };
})();
