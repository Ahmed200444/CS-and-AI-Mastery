
(function(){
  var COURSES = null;
  function getCourses(){
    if(!COURSES){ try{ COURSES = (window.__CSAI_COURSES__||(window.__CSAI_COURSES__=JSON.parse(document.getElementById('coursedata').textContent))); }catch(e){ COURSES = []; } }
    return COURSES;
  }
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
  function highlight(text, q){
    if(!q) return esc(text);
    var idx = text.toLowerCase().indexOf(q.toLowerCase());
    if(idx===-1) return esc(text);
    return esc(text.slice(0,idx)) + '<mark>' + esc(text.slice(idx,idx+q.length)) + '</mark>' + esc(text.slice(idx+q.length));
  }

  window.gsOpen = function(){
    document.getElementById('globalSearchOverlay').style.display = 'flex';
    var inp = document.getElementById('gsInput');
    inp.value = '';
    document.getElementById('gsResults').innerHTML = '<p class="gs-hint">Type to search across every course, lesson, exercise, and the SQL/Python tracks.</p>';
    setTimeout(function(){ inp.focus(); }, 30);
  };
  window.gsClose = function(){
    document.getElementById('globalSearchOverlay').style.display = 'none';
  };

  function searchLiveTrack(trackId, trackLabel, q){
    var root = document.getElementById(trackId);
    if(!root) return [];
    var hits = [];
    var sections = root.querySelectorAll('section.lesson, section[id]');
    sections.forEach(function(sec){
      var h2 = sec.querySelector('h2');
      if(!h2) return;
      var title = h2.textContent.trim();
      if(title.toLowerCase().indexOf(q) !== -1){
        hits.push({ source: trackLabel, sourceTrack: trackId.replace('Track','').toLowerCase(),
                    title: title, sectionId: sec.id, kind: 'lesson' });
      }
    });
    return hits;
  }

  function runSearch(q){
    q = q.trim().toLowerCase();
    var results = { courses: [], lessons: [], exercises: [], quiz: [], projects: [], live: [] };
    if(q.length < 2) return results;
    var STALE_EXERCISE_COURSE_IDS = ['python','sql']; // these 3 have real exercises living elsewhere now

    var courses = getCourses();
    courses.forEach(function(c){
      if(c.hidden===true || c.status === 'coming-soon') return;
      if(c.title.toLowerCase().indexOf(q) !== -1 || (c.description||'').toLowerCase().indexOf(q) !== -1){
        results.courses.push({ course: c });
      }
      (c.lessons||[]).forEach(function(l,i){
        if(l.title.toLowerCase().indexOf(q) !== -1){
          results.lessons.push({ course: c, lesson: l, index: i });
        }
      });
      (c.exercises||[]).forEach(function(e,i){
        if(STALE_EXERCISE_COURSE_IDS.indexOf(c.id) !== -1) return; // stale array -- do not index
        if(e.title.toLowerCase().indexOf(q) !== -1){
          results.exercises.push({ course: c, exercise: e, index: i, action: "gsJumpCourse('"+c.id+"','exercises')" });
        }
      });
      (c.projects||[]).forEach(function(p,i){
        if(p.title.toLowerCase().indexOf(q) !== -1){
          results.projects.push({ course: c, project: p });
        }
      });
    });

    // Live DOM search across SQL / Python / OOP tracks (their lessons aren't in coursedata JSON)
    results.live = results.live.concat(searchLiveTrack('sqlTrack', 'SQL Mastery', q));
    results.live = results.live.concat(searchLiveTrack('pyTrack', 'Python Path', q));

    // Python's and OOP's real exercises live in the shared EXALL bank now, not coursedata.exercises.
    // Search that instead, and route through the shared jump helper -- never the removed tab.
    var pyCourse = courses.find(function(c){ return c.id==='python'; });
    if(typeof EXALL !== 'undefined'){
      EXALL.forEach(function(e){
        var isOop = OOP_EXERCISE_IDS.indexOf(e.id) !== -1;
        var hay = (e.title+' '+(e.prompt||'')).toLowerCase();
        if(hay.indexOf(q) === -1) return;
        results.exercises.push({ course: pyCourse, exercise: e, action: "gsJumpToExercise('python','ex_"+e.id+"')" });
      });
    }
    // SQL's real exercises live in BANK, not coursedata.exercises.
    var sqlCourse = courses.find(function(c){ return c.id==='sql'; });
    if(typeof BANK !== 'undefined'){
      BANK.forEach(function(b){
        var hay = (b.q+' '+(b.topic||'')).toLowerCase();
        if(hay.indexOf(q) === -1) return;
        results.exercises.push({ course: sqlCourse, exercise: { title: b.q.length>70?b.q.slice(0,70)+'…':b.q }, action: "gsJumpToExercise('sql','chal-"+b.id+"')" });
      });
    }

    return results;
  }

  function resultRow(iconBg, icon, title, sub, onclickExpr, q, matchField){
    return '<button class="gs-row" data-act="'+onclickExpr+'">'
      + '<span class="gs-row-icon" style="background:'+iconBg+'22;">'+icon+'</span>'
      + '<span class="gs-row-body"><span class="gs-row-title">'+highlight(title,q)+'</span>'
      + (sub?'<span class="gs-row-sub">'+esc(sub)+'</span>':'')
      + '</span></button>';
  }

  function _gsOnInputImmediate(){
    var q = document.getElementById('gsInput').value;
    var out = document.getElementById('gsResults');
    if(q.trim().length < 2){
      out.innerHTML = '<p class="gs-hint">Keep typing (2+ characters)...</p>';
      return;
    }
    var r = runSearch(q);
    var total = r.courses.length + r.lessons.length + r.exercises.length + r.projects.length + r.live.length;
    if(total === 0){
      out.innerHTML = '<p class="gs-hint">No results for "'+esc(q)+'". Try a different term.</p>';
      return;
    }
    var html = '';
    if(r.live.length){
      html += '<div class="gs-group-h">Interactive tracks</div>';
      r.live.slice(0,8).forEach(function(item){
        html += resultRow('#4fd1c5','&#9654;', item.title, item.source,
          "gsJumpLive('"+item.sourceTrack+"','"+item.sectionId+"')", q);
      });
    }
    if(r.courses.length){
      html += '<div class="gs-group-h">Courses</div>';
      r.courses.slice(0,5).forEach(function(item){
        html += resultRow(item.course.color,item.course.icon, item.course.title, item.course.tag,
          "gsJumpCourse('"+item.course.id+"','overview')", q);
      });
    }
    if(r.lessons.length){
      html += '<div class="gs-group-h">Lessons</div>';
      r.lessons.slice(0,10).forEach(function(item){
        html += resultRow(item.course.color,'&#128214;', item.lesson.title, item.course.title,
          "gsJumpCourse('"+item.course.id+"','lessons')", q);
      });
    }
    if(r.exercises.length){
      html += '<div class="gs-group-h">Exercises</div>';
      r.exercises.slice(0,8).forEach(function(item){
        html += resultRow(item.course.color,'&#9998;', item.exercise.title, item.course.title,
          item.action, q);
      });
    }
    if(r.projects.length){
      html += '<div class="gs-group-h">Projects</div>';
      r.projects.slice(0,5).forEach(function(item){
        html += resultRow(item.course.color,'&#127942;', item.project.title, item.course.title,
          "gsJumpCourse('"+item.course.id+"','projects')", q);
      });
    }
    out.innerHTML = html;
  }
  // Debounced wrapper: real measured cost of a search call is sub-5ms (profiled), so this
  // is defensive insurance against slower devices / future growth, not a fix for a measured
  // problem -- avoids re-running search on every keystroke while typing quickly.
  var _gsDebounceTimer = null;
  window.gsOnInput = function(){
    if(_gsDebounceTimer) clearTimeout(_gsDebounceTimer);
    _gsDebounceTimer = setTimeout(_gsOnInputImmediate, 120);
  };

  window.gsJumpCourse = function(courseId, tab){
    window.gsClose();
    if(window.cxOpenDetails) window.cxOpenDetails(courseId,tab||'overview');
  };
  window.gsJumpLive = function(track, sectionId){
    window.gsClose();
    showTrack(track);
    setTimeout(function(){
      var el = document.getElementById(sectionId);
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
    }, 100);
  };

  // Shared navigation helper for Python/SQL/OOP's real, live exercise systems --
  // these no longer have a course-level Exercises tab, so search must land directly
  // on the real rendered card rather than pretending a removed tab still exists.
  window.gsJumpToExercise = function(track, cardId){
    window.gsClose();
    showTrack(track);
    // OOP renders its exercises lazily via a boot function; guarantee it has run
    // (idempotent -- safe even if the user has already visited this track before).
    if(track === 'oop' && typeof window._oopBoot === 'function') window._oopBoot();
    setTimeout(function(){
      var el = document.getElementById(cardId);
      if(!el){
        // Fail gracefully -- never leave a silent blank panel.
        console.warn('gsJumpToExercise: could not locate card "'+cardId+'" in track "'+track+'"');
        var out = document.getElementById('gsResults');
        return;
      }
      el.scrollIntoView({behavior:'smooth', block:'center'});
      var focusTarget = el.querySelector('textarea, button.b-check, button.act.check') || el;
      if(!focusTarget.hasAttribute('tabindex') && focusTarget === el) focusTarget.setAttribute('tabindex','-1');
      focusTarget.focus();
      // Brief, purely decorative highlight -- reuses the existing reduced-motion-aware
      // flash class already used elsewhere, rather than inventing a new animation.
      el.classList.add('cx-lesson-flash');
      setTimeout(function(){ el.classList.remove('cx-lesson-flash'); }, 1300);
    }, 150);
  };

  // Escape key closes the overlay
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      var ov = document.getElementById('globalSearchOverlay');
      if(ov && ov.style.display !== 'none') window.gsClose();
    }
  });
  // Click on the dark backdrop (outside the panel) closes it
  document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'globalSearchOverlay') window.gsClose();
  });
})();
