(function(){
  'use strict';

  var lastRoute = null;
  var lastCourseId = null;
  var verifyToken = 0;
  var fallbackId = 'csai-safe-course-view';
  var fallbackStyleId = 'csai-safe-course-style';
  var progressKey = 'csai_safe_course_progress_v1';

  function registry(){ return window.TRACK_REGISTRY || null; }
  function esc(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g,function(char){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
    });
  }
  function list(value){ return Array.isArray(value) ? value.filter(Boolean) : (value ? [value] : []); }
  function getCourses(){
    try{
      var node = document.getElementById('coursedata');
      return node ? (JSON.parse(node.textContent || '[]') || []) : [];
    }catch(error){
      console.error('[CS AI Mastery] Could not read course data for blank-screen recovery.', error);
      return [];
    }
  }
  function courseById(id){
    var courses = getCourses();
    for(var i=0;i<courses.length;i++) if(courses[i].id === id) return courses[i];
    return null;
  }
  function courseForRoute(route){
    var courses = getCourses();
    for(var i=0;i<courses.length;i++) if(courses[i].linked === route) return courses[i];
    return null;
  }
  function currentHashRoute(){
    var reg = registry();
    if(!reg) return null;
    var hash = '';
    try{ hash = String(location.hash || '').replace(/^#/, ''); }catch(error){}
    return reg[hash] ? hash : null;
  }
  function targetFor(route){
    var reg = registry();
    var entry = reg && reg[route];
    return entry ? document.getElementById(entry.containerId) : null;
  }
  function preferredDisplay(element){
    if(!element) return 'block';
    if(element.classList && element.classList.contains('app')){
      if(element.querySelector('.side,.sidebar') && element.querySelector('main,.main,[role="main"]')) return 'flex';
    }
    return 'block';
  }
  function forceRouteVisible(route){
    var target = targetFor(route);
    if(!target) return null;
    target.hidden = false;
    target.style.setProperty('display', preferredDisplay(target), 'important');
    target.style.setProperty('visibility', 'visible', 'important');
    target.style.setProperty('opacity', '1', 'important');
    target.style.setProperty('min-height', '100vh', 'important');
    var main = target.querySelector('main,.main,[role="main"]');
    if(main){
      main.hidden = false;
      main.style.setProperty('visibility','visible','important');
      main.style.setProperty('opacity','1','important');
      try{ main.scrollTop = 0; }catch(error){}
    }
    try{
      window.scrollTo(0,0);
      target.scrollTop = 0;
      var heading = target.querySelector('h1,h2,h3');
      if(heading && typeof heading.scrollIntoView === 'function') heading.scrollIntoView({block:'start'});
    }catch(error){}
    return target;
  }
  function isRendered(route){
    var target = targetFor(route);
    if(!target) return false;
    var targetStyle = getComputedStyle(target);
    var targetRect = target.getBoundingClientRect();
    if(target.hidden || targetStyle.display === 'none' || targetStyle.visibility === 'hidden' || Number(targetStyle.opacity || 1) === 0) return false;
    if(targetRect.width < 80 || targetRect.height < 80) return false;
    var main = target.querySelector('main,.main,[role="main"]') || target;
    var mainStyle = getComputedStyle(main);
    var mainRect = main.getBoundingClientRect();
    if(main.hidden || mainStyle.display === 'none' || mainStyle.visibility === 'hidden' || Number(mainStyle.opacity || 1) === 0) return false;
    if(mainRect.width < 80 || mainRect.height < 80) return false;

    var candidates = main.querySelectorAll('h1,h2,h3,p,li,pre,textarea,button,a,summary');
    var meaningful = 0;
    for(var i=0;i<candidates.length && i<160;i++){
      var node = candidates[i];
      var style = getComputedStyle(node);
      if(style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) === 0) continue;
      var rect = node.getBoundingClientRect();
      if(rect.width < 2 || rect.height < 2) continue;
      if(rect.bottom < -50 || rect.top > Math.max(window.innerHeight * 1.5, 1200)) continue;
      var text = String(node.value || node.textContent || '').replace(/\s+/g,' ').trim();
      if(text.length >= 2) meaningful++;
      if(meaningful >= 2) return true;
    }
    return false;
  }
  function loadProgress(){
    try{ return JSON.parse(localStorage.getItem(progressKey) || '{}') || {}; }catch(error){ return {}; }
  }
  function saveProgress(progress){
    try{ localStorage.setItem(progressKey, JSON.stringify(progress)); }catch(error){}
  }
  function sortedLessons(course){
    return (course.lessons || []).map(function(lesson,index){ return {lesson:lesson,index:index}; }).sort(function(a,b){
      var ao = Number.isFinite(Number(a.lesson.displayOrder)) ? Number(a.lesson.displayOrder) : a.index;
      var bo = Number.isFinite(Number(b.lesson.displayOrder)) ? Number(b.lesson.displayOrder) : b.index;
      return ao - bo;
    });
  }
  function addFallbackStyle(){
    if(document.getElementById(fallbackStyleId)) return;
    var style = document.createElement('style');
    style.id = fallbackStyleId;
    style.textContent = '\n#'+fallbackId+'{position:fixed;inset:0;z-index:2147483000;overflow:auto;background:#f4f7fb;color:#172231;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}\n#'+fallbackId+' *{box-sizing:border-box}\n.csai-safe-wrap{max-width:1040px;margin:auto;padding:22px 22px 100px}.csai-safe-top{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 0;background:#f4f7fb}.csai-safe-btn{border:1px solid #b9c7d5;border-radius:9px;padding:9px 13px;background:#fff;color:#17304b;font:inherit;font-weight:800;cursor:pointer}.csai-safe-hero,.csai-safe-card{background:#fff;border:1px solid #d8e1ea;border-radius:16px;padding:20px}.csai-safe-hero{margin:8px 0 16px}.csai-safe-kicker{font-size:.75rem;letter-spacing:.1em;font-weight:900;color:#17649a}.csai-safe-hero h1{margin:5px 0 8px;font-size:clamp(1.8rem,4vw,3rem);line-height:1.12}.csai-safe-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}.csai-safe-meta span{padding:5px 9px;border-radius:999px;background:#e8f1f8;font-size:.8rem;font-weight:750}.csai-safe-list{display:grid;gap:12px}.csai-safe-lesson{border:1px solid #d8e1ea;border-radius:13px;background:#fff;overflow:hidden}.csai-safe-lesson summary{display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;font-weight:850}.csai-safe-num{display:grid;place-items:center;min-width:34px;height:28px;border-radius:8px;background:#e8f1f8;color:#17649a}.csai-safe-title{flex:1}.csai-safe-complete{display:flex;align-items:center;gap:6px;font-size:.82rem}.csai-safe-body{padding:0 16px 18px}.csai-safe-body h3{margin:18px 0 7px}.csai-safe-body p{margin:7px 0}.csai-safe-code{overflow:auto;white-space:pre-wrap;padding:13px;border-radius:10px;background:#101827;color:#f4f7fb;font:500 .86rem/1.55 ui-monospace,SFMono-Regular,Consolas,monospace}.csai-safe-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}.csai-safe-card h2{margin:0 0 10px}.csai-safe-item{padding:12px;border-radius:10px;background:#f4f7fb;margin:9px 0}.csai-safe-note{padding:12px;border-left:4px solid #d28b23;background:#fff7e7;border-radius:8px;margin-top:12px}.csai-safe-status{font-weight:800;color:#167554}.csai-safe-error{color:#8f2d2d}.csai-safe-empty{padding:18px;border:1px dashed #b9c7d5;border-radius:12px;background:#fff}.csai-safe-retry{background:#17649a;color:#fff;border-color:#17649a}\nhtml[data-theme="dark"] #'+fallbackId+',body[data-theme="dark"] #'+fallbackId+'{background:#0f1720;color:#edf3f8}html[data-theme="dark"] #'+fallbackId+' .csai-safe-top,body[data-theme="dark"] #'+fallbackId+' .csai-safe-top{background:#0f1720}html[data-theme="dark"] #'+fallbackId+' .csai-safe-hero,html[data-theme="dark"] #'+fallbackId+' .csai-safe-card,html[data-theme="dark"] #'+fallbackId+' .csai-safe-lesson,html[data-theme="dark"] #'+fallbackId+' .csai-safe-empty,body[data-theme="dark"] #'+fallbackId+' .csai-safe-hero,body[data-theme="dark"] #'+fallbackId+' .csai-safe-card,body[data-theme="dark"] #'+fallbackId+' .csai-safe-lesson,body[data-theme="dark"] #'+fallbackId+' .csai-safe-empty{background:#17212c;border-color:#344352;color:#edf3f8}html[data-theme="dark"] #'+fallbackId+' .csai-safe-item,body[data-theme="dark"] #'+fallbackId+' .csai-safe-item{background:#111b25}html[data-theme="dark"] #'+fallbackId+' .csai-safe-btn,body[data-theme="dark"] #'+fallbackId+' .csai-safe-btn{background:#17212c;color:#edf3f8;border-color:#455464}html[data-theme="dark"] #'+fallbackId+' .csai-safe-note,body[data-theme="dark"] #'+fallbackId+' .csai-safe-note{background:#2b2417;color:#edf3f8}\n@media(max-width:700px){.csai-safe-wrap{padding:12px 12px 90px}.csai-safe-grid{grid-template-columns:1fr}.csai-safe-top{align-items:stretch}.csai-safe-top .csai-safe-btn{flex:1}.csai-safe-lesson summary{align-items:flex-start;flex-wrap:wrap}.csai-safe-complete{width:100%;padding-left:44px}}\n';
    document.head.appendChild(style);
  }
  function lessonExplanation(lesson){ return lesson.explanation || lesson.explain || lesson.description || 'This lesson introduces an important course concept.'; }
  function lessonExamples(lesson){ return list(lesson.examples || lesson.example); }
  function renderFallback(course, reason){
    if(!course) return;
    addFallbackStyle();
    var old = document.getElementById(fallbackId);
    if(old) old.remove();
    var progress = loadProgress();
    var courseProgress = progress[course.id] || {};
    var lessons = sortedLessons(course);
    var completed = lessons.filter(function(item){ return !!courseProgress[item.lesson.id]; }).length;
    var routeLabel = course.linked ? 'Interactive route: '+course.linked : 'Catalog course';
    var overlay = document.createElement('div');
    overlay.id = fallbackId;
    overlay.setAttribute('role','main');
    overlay.setAttribute('aria-label',course.title+' course');
    var lessonHtml = lessons.length ? lessons.map(function(item,index){
      var lesson = item.lesson;
      var examples = lessonExamples(lesson);
      var objectives = list(lesson.objectives);
      var concepts = list(lesson.concepts);
      var mistakes = list(lesson.commonMistakes || lesson.commonMistake);
      return '<details class="csai-safe-lesson" '+(index===0?'open':'')+' data-lesson-id="'+esc(lesson.id || ('lesson-'+index))+'"><summary><span class="csai-safe-num">'+String(index+1).padStart(2,'0')+'</span><span class="csai-safe-title">'+esc(lesson.title || ('Lesson '+(index+1)))+'</span><label class="csai-safe-complete"><input type="checkbox" data-safe-complete '+(courseProgress[lesson.id || ('lesson-'+index)]?'checked':'')+'> Complete</label></summary><div class="csai-safe-body">'+
        (objectives.length?'<h3>What you will learn</h3><ul>'+objectives.map(function(value){return '<li>'+esc(value)+'</li>';}).join('')+'</ul>':'')+
        '<h3>Explanation</h3><p>'+esc(lessonExplanation(lesson))+'</p>'+
        (concepts.length?'<h3>Key concepts</h3><div class="csai-safe-meta">'+concepts.map(function(value){return '<span>'+esc(value)+'</span>';}).join('')+'</div>':'')+
        (examples.length?'<h3>Example</h3>'+examples.map(function(value){return '<pre class="csai-safe-code">'+esc(value)+'</pre>';}).join(''):'')+
        (mistakes.length?'<div class="csai-safe-note"><b>Common mistake:</b> '+esc(mistakes.join(' • '))+'</div>':'')+
        '</div></details>';
    }).join('') : '<div class="csai-safe-empty">This course does not have lesson data in the catalog yet. Use the course overview, exercises, and projects below.</div>';
    var exercises = list(course.exercises);
    var quiz = list(course.quiz);
    var projects = list(course.projects).concat(course.capstone ? [course.capstone] : []);
    overlay.innerHTML = '<div class="csai-safe-wrap"><div class="csai-safe-top"><button type="button" class="csai-safe-btn" data-safe-back>← All courses</button><button type="button" class="csai-safe-btn csai-safe-retry" data-safe-retry>Retry interactive course</button></div><section class="csai-safe-hero"><div class="csai-safe-kicker">COURSE RECOVERY MODE</div><h1>'+esc(course.icon || '')+' '+esc(course.title)+'</h1><p>'+esc(course.blurb || course.description || 'Complete the lessons in order, then practise and build a project.')+'</p><div class="csai-safe-meta"><span>'+esc(routeLabel)+'</span><span data-safe-progress>'+completed+' of '+lessons.length+' lessons complete</span></div><p class="csai-safe-error">The normal course screen was blank, so this reliable course view opened automatically. Your lesson checks are saved on this device.</p></section><section class="csai-safe-list">'+lessonHtml+'</section><div class="csai-safe-grid">'+
      '<section class="csai-safe-card"><h2>Exercises</h2>'+(exercises.length?exercises.map(function(item,index){return '<div class="csai-safe-item"><b>'+esc(item.title || ('Exercise '+(index+1)))+'</b><p>'+esc(item.prompt || item.description || '')+'</p>'+(item.hint?'<details><summary>Hint</summary><p>'+esc(item.hint)+'</p></details>':'')+'<textarea aria-label="Answer for '+esc(item.title || ('Exercise '+(index+1)))+'" style="width:100%;min-height:110px;padding:10px;border:1px solid #9fb0c0;border-radius:8px;background:transparent;color:inherit" placeholder="Write your answer or code here..."></textarea></div>';}).join(''):'<p>No separate exercises are listed for this course.</p>')+'</section>'+
      '<section class="csai-safe-card"><h2>Knowledge checks</h2>'+(quiz.length?quiz.map(function(item,index){return '<div class="csai-safe-item"><b>'+esc(item.q || item.question || ('Question '+(index+1)))+'</b>'+(Array.isArray(item.options)?'<ol>'+item.options.map(function(option){return '<li>'+esc(option)+'</li>';}).join('')+'</ol>':'')+'<details><summary>Show answer</summary><p>'+(typeof item.correct==='number' && item.options ? esc(item.options[item.correct]) : esc(item.answer || item.explanation || 'Review the related lesson.'))+'</p></details></div>';}).join(''):'<p>No separate quiz questions are listed for this course.</p>')+'</section>'+
      '<section class="csai-safe-card"><h2>Projects</h2>'+(projects.length?projects.map(function(item,index){return '<div class="csai-safe-item"><b>'+esc(item.title || ('Project '+(index+1)))+'</b><p>'+esc(item.desc || item.description || item.prompt || '')+'</p></div>';}).join(''):'<p>No separate projects are listed for this course.</p>')+'</section>'+
      '<section class="csai-safe-card"><h2>What happened</h2><p>'+esc(reason || 'The selected course route did not display meaningful content after loading.')+'</p><p class="csai-safe-status">You can study here now, or use “Retry interactive course” after the next deployment.</p></section>'+
      '</div></div>';
    document.body.appendChild(overlay);
    try{ overlay.scrollTop = 0; document.documentElement.style.overflow = 'hidden'; }catch(error){}

    overlay.addEventListener('click',function(event){
      var back = event.target.closest('[data-safe-back]');
      if(back){
        overlay.remove();
        document.documentElement.style.overflow = '';
        lastCourseId = null;
        if(typeof window.showTrack === 'function') window.showTrack('courses');
        if(typeof window.cxRenderCatalog === 'function') window.cxRenderCatalog();
        return;
      }
      var retry = event.target.closest('[data-safe-retry]');
      if(retry){
        overlay.remove();
        document.documentElement.style.overflow = '';
        if(course.linked && typeof window.showTrack === 'function') window.showTrack(course.linked);
        forceRouteVisible(course.linked);
        setTimeout(function(){ verifyCourse(course.id, true); }, 700);
      }
    });
    overlay.addEventListener('change',function(event){
      if(!event.target.matches('[data-safe-complete]')) return;
      var lessonNode = event.target.closest('[data-lesson-id]');
      if(!lessonNode) return;
      var state = loadProgress();
      state[course.id] = state[course.id] || {};
      state[course.id][lessonNode.getAttribute('data-lesson-id')] = !!event.target.checked;
      saveProgress(state);
      var done = overlay.querySelectorAll('[data-safe-complete]:checked').length;
      var status = overlay.querySelector('[data-safe-progress]');
      if(status) status.textContent = done+' of '+lessons.length+' lessons complete';
    });
    console.warn('[CS AI Mastery] Opened safe course fallback for', course.id, reason || 'blank route');
  }
  function verifyCourse(courseId, afterRetry){
    var course = courseById(courseId);
    if(!course || !course.linked) return;
    var token = ++verifyToken;
    lastCourseId = course.id;
    lastRoute = course.linked;
    forceRouteVisible(course.linked);
    setTimeout(function(){
      if(token !== verifyToken || document.getElementById(fallbackId)) return;
      forceRouteVisible(course.linked);
      if(isRendered(course.linked)) return;
      setTimeout(function(){
        if(token !== verifyToken || document.getElementById(fallbackId)) return;
        forceRouteVisible(course.linked);
        if(!isRendered(course.linked)){
          renderFallback(course, afterRetry ? 'The interactive route was still blank after retrying.' : 'The interactive route did not show visible lesson content after loading.');
        }
      },700);
    },450);
  }
  function scheduleRoute(route){
    lastRoute = route || lastRoute || currentHashRoute();
    var course = courseForRoute(lastRoute);
    if(course) verifyCourse(course.id, false);
    else forceRouteVisible(lastRoute);
  }
  function install(){
    try{ if('scrollRestoration' in history) history.scrollRestoration = 'manual'; }catch(error){}

    var originalShowTrack = window.showTrack;
    if(typeof originalShowTrack === 'function' && !originalShowTrack.__safeCourseGuard){
      var guardedShowTrack = function(name){
        lastRoute = name;
        var result;
        try{ result = originalShowTrack.apply(this,arguments); }
        catch(error){
          console.error('[CS AI Mastery] Course route failed.', error);
          var failedCourse = courseForRoute(name) || courseById(lastCourseId);
          if(failedCourse) renderFallback(failedCourse,'The course route threw an error while opening.');
          return;
        }
        if(name !== 'courses' && name !== 'hub') scheduleRoute(name);
        return result;
      };
      guardedShowTrack.__safeCourseGuard = true;
      guardedShowTrack.__originalShowTrack = originalShowTrack;
      window.showTrack = guardedShowTrack;
    }

    var originalCxOpen = window.cxOpen;
    if(typeof originalCxOpen === 'function' && !originalCxOpen.__safeCourseGuard){
      var guardedCxOpen = function(id){
        lastCourseId = id;
        var course = courseById(id);
        try{
          var result = originalCxOpen.apply(this,arguments);
          if(course && course.linked) verifyCourse(id,false);
          return result;
        }catch(error){
          console.error('[CS AI Mastery] Course failed to open.', error);
          if(course) renderFallback(course,'The normal course loader threw an error.');
        }
      };
      guardedCxOpen.__safeCourseGuard = true;
      guardedCxOpen.__originalCxOpen = originalCxOpen;
      window.cxOpen = guardedCxOpen;
    }

    var initialRoute = currentHashRoute();
    if(initialRoute && initialRoute !== 'hub' && initialRoute !== 'courses') scheduleRoute(initialRoute);
  }

  window.addEventListener('hashchange',function(){
    var route = currentHashRoute();
    if(route && route !== 'hub' && route !== 'courses') scheduleRoute(route);
  });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install);
  else install();
})();
