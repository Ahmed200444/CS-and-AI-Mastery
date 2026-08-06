(() => {
  'use strict';

  let courseCache = null;
  let routeCourse = null;

  function courses(){
    if(courseCache) return courseCache;
    try {
      const node = document.getElementById('coursedata');
      courseCache = node ? (JSON.parse(node.textContent) || []) : [];
    } catch (error) {
      console.error('[CS AI Mastery] Could not parse course lesson data', error);
      courseCache = [];
    }
    return courseCache;
  }

  function courseForRoute(route){
    if(!routeCourse){
      routeCourse = {};
      courses().forEach(course => { if(course.linked) routeCourse[course.linked] = course; });
    }
    return routeCourse[route] || null;
  }

  function canonicalLessonEscape(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function canonicalLessonList(value){
    if(Array.isArray(value))return value.filter(Boolean);
    return value ? [String(value)] : [];
  }
  function canonicalLessonProgress(courseId){
    var key='courses_progress_v1',all={};
    try{all=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(e){all={};}
    if(!all[courseId])all[courseId]={lessons:{},exercises:{},quiz:{},projects:{}};
    if(!all[courseId].lessons)all[courseId].lessons={};
    return {key:key,all:all,course:all[courseId]};
  }
  function canonicalLessonSave(state){
    try{localStorage.setItem(state.key,JSON.stringify(state.all));}catch(e){}
  }
  function ensureCanonicalLessonStyles(){
    if(document.getElementById('canonicalTrackLessonsStyle'))return;
    var style=document.createElement('style');
    style.id='canonicalTrackLessonsStyle';
    style.textContent=`
      .canonical-track-switch{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:12px 0 10px}
      .canonical-track-switch button{border:1px solid var(--border,#344052);background:transparent;color:inherit;border-radius:9px;padding:9px 8px;font:inherit;font-weight:800;cursor:pointer}
      .canonical-track-switch button.active{background:var(--accent,#3b82f6);color:#fff;border-color:transparent}
      .canonical-lesson-side-nav{display:grid;gap:5px;max-height:46vh;overflow:auto;padding-right:3px}
      .canonical-lesson-side-nav button{display:flex;align-items:flex-start;gap:8px;width:100%;text-align:left;border:0;background:transparent;color:inherit;border-radius:8px;padding:8px;font:inherit;cursor:pointer}
      .canonical-lesson-side-nav button:hover,.canonical-lesson-side-nav button.active{background:rgba(127,127,127,.13)}
      .canonical-lesson-side-nav button.done .canonical-lesson-side-number{background:#168a67;color:#fff}
      .canonical-lesson-side-number{display:inline-grid;place-items:center;flex:0 0 28px;height:24px;border-radius:7px;background:rgba(127,127,127,.16);font-size:.76rem;font-weight:900}
      .canonical-practice-nav-hidden,.canonical-practice-main-hidden,.canonical-lessons-hidden{display:none!important}
      .canonical-course-lessons{display:block;max-width:1000px;margin:0 auto;padding:4px 0 32px}
      .canonical-lessons-hero{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:22px;border:1px solid var(--border,#d7dee7);border-radius:16px;background:var(--panel,#fff);margin-bottom:16px}
      .canonical-lessons-kicker{font-size:.76rem;font-weight:900;letter-spacing:.1em;color:var(--accent,#187b63)}
      .canonical-lessons-hero h1{margin:5px 0 7px;font-size:clamp(1.45rem,2.8vw,2.15rem)}
      .canonical-lessons-hero p{margin:0;line-height:1.6;color:var(--sub,#687487)}
      .canonical-lessons-progress{min-width:132px;text-align:center;padding:12px;border-radius:12px;background:rgba(22,138,103,.1)}
      .canonical-lessons-progress strong{display:block;font-size:1.35rem;color:#168a67}
      .canonical-lessons-progress span{font-size:.8rem}
      .canonical-lesson-card{border:1px solid var(--border,#d7dee7);border-radius:16px;background:var(--panel,#fff);padding:22px}
      .canonical-lesson-card-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;border-bottom:1px solid var(--border,#d7dee7);padding-bottom:14px;margin-bottom:16px}
      .canonical-lesson-number{font-size:.78rem;font-weight:900;letter-spacing:.08em;color:var(--accent,#187b63)}
      .canonical-lesson-card h2{margin:4px 0 0;font-size:1.55rem}
      .canonical-lesson-done{border:1px solid var(--border,#c8d1dc);background:transparent;color:inherit;border-radius:10px;padding:9px 12px;font:inherit;font-weight:800;cursor:pointer;white-space:nowrap}
      .canonical-lesson-done.done{background:#168a67;color:#fff;border-color:#168a67}
      .canonical-lesson-section{margin-top:18px}
      .canonical-lesson-section h3{font-size:1rem;margin:0 0 8px}
      .canonical-lesson-section p,.canonical-lesson-section li{line-height:1.7}
      .canonical-lesson-section ul{margin:0;padding-left:20px}
      .canonical-lesson-example{margin:9px 0 0;padding:15px;border-radius:11px;background:#111827;color:#f5f7fb;overflow:auto;white-space:pre-wrap;font:500 .9rem/1.55 ui-monospace,SFMono-Regular,Menlo,monospace}
      .canonical-lesson-note{padding:13px 15px;border-radius:11px;background:rgba(127,127,127,.1)}
      .canonical-lesson-concepts{display:flex;flex-wrap:wrap;gap:7px}
      .canonical-lesson-concepts span{padding:6px 9px;border-radius:999px;background:rgba(59,130,246,.12);font-size:.82rem;font-weight:750}
      .canonical-lesson-footer{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:22px;padding-top:15px;border-top:1px solid var(--border,#d7dee7)}
      .canonical-lesson-footer button{border:1px solid var(--border,#c8d1dc);background:transparent;color:inherit;border-radius:10px;padding:9px 12px;font:inherit;font-weight:800;cursor:pointer}
      .canonical-lesson-footer .primary{background:var(--accent,#3b82f6);color:#fff;border-color:transparent}
      html[data-theme="dark"] .canonical-lessons-hero,html[data-theme="dark"] .canonical-lesson-card{background:#17212c!important;color:#edf3f8!important;border-color:#344352!important}
      @media(max-width:760px){.canonical-lessons-hero{display:block}.canonical-lessons-progress{margin-top:12px}.canonical-lesson-card-head{display:block}.canonical-lesson-done{margin-top:12px}.canonical-lesson-footer{flex-wrap:wrap}}
    `;
    document.head.appendChild(style);
  }
  function canonicalTrackHasNativeLessons(course,side){
    if(['python','sql','oop','dsa'].indexOf(course.id)!==-1)return true;
    return Array.prototype.some.call(side.querySelectorAll('h4'),function(h){
      return /^lessons?$/i.test((h.textContent||'').trim());
    });
  }
  window.ensureCanonicalTrackLessons=function(route,containerId){
    var course=courseForRoute(route),container=document.getElementById(containerId);
    if(!course||!container||!course.lessons||!course.lessons.length)return;
    var side=container.querySelector('.side,.sidebar'),main=container.querySelector('main,.main');
    if(!side||!main||canonicalTrackHasNativeLessons(course,side))return;

    ensureCanonicalLessonStyles();

    var existing=container.querySelector('[data-canonical-course-lessons="'+course.id+'"]');
    if(existing)return;

    var sorted=course.lessons.map(function(l,i){return {lesson:l,originalIndex:i};})
      .sort(function(a,b){
        var av=a.lesson.displayOrder!=null?a.lesson.displayOrder:a.originalIndex;
        var bv=b.lesson.displayOrder!=null?b.lesson.displayOrder:b.originalIndex;
        return av-bv;
      });
    var state=canonicalLessonProgress(course.id);
    var viewKey='canonical_course_surface_v1',viewState={};
    try{viewState=JSON.parse(localStorage.getItem(viewKey)||'{}')||{};}catch(e){viewState={};}
    var currentIndex=0;

    var switcher=document.createElement('div');
    switcher.className='canonical-track-switch';
    switcher.innerHTML='<button type="button" data-canonical-view="lessons">Lessons</button><button type="button" data-canonical-view="practice">Practice Lab</button>';

    var lessonNav=document.createElement('div');
    lessonNav.className='canonical-lesson-side-nav';
    lessonNav.setAttribute('aria-label',course.title+' lesson list');

    var brand=side.querySelector('.brand');
    if(brand&&brand.parentNode){
      brand.parentNode.insertBefore(switcher,brand.nextSibling);
      switcher.parentNode.insertBefore(lessonNav,switcher.nextSibling);
    }else{
      side.appendChild(switcher);
      side.appendChild(lessonNav);
    }

    var sideChildren=Array.prototype.slice.call(side.children);
    var practiceStart=sideChildren.findIndex(function(el){return el.tagName==='H4';});
    var practiceNavNodes=practiceStart>=0?sideChildren.slice(practiceStart).filter(function(el){return el!==switcher&&el!==lessonNav;}):[];

    var practiceMainNodes=Array.prototype.slice.call(main.children);
    var lessonPanel=document.createElement('section');
    lessonPanel.className='canonical-course-lessons';
    lessonPanel.setAttribute('data-canonical-course-lessons',course.id);
    main.insertBefore(lessonPanel,main.firstChild);

    function isDone(lesson){
      return !!(state.course.lessons&&state.course.lessons[lesson.id]);
    }
    function completedCount(){
      return sorted.filter(function(item){return isDone(item.lesson);}).length;
    }
    function renderNav(){
      lessonNav.innerHTML=sorted.map(function(item,index){
        var lesson=item.lesson,done=isDone(lesson);
        return '<button type="button" class="'+(done?'done ':'')+(index===currentIndex?'active':'')+'" data-canonical-lesson-index="'+index+'">'
          +'<span class="canonical-lesson-side-number">'+(done?'✓':String(index+1).padStart(2,'0'))+'</span>'
          +'<span>'+canonicalLessonEscape(lesson.title||('Lesson '+(index+1)))+'</span></button>';
      }).join('');
    }
    function renderLesson(index){
      currentIndex=Math.max(0,Math.min(sorted.length-1,index));
      var lesson=sorted[currentIndex].lesson;
      var explanation=lesson.explain||lesson.explanation||'This lesson is ready for study, but its explanation has not been added yet.';
      var examples=canonicalLessonList(lesson.example||lesson.examples);
      var objectives=canonicalLessonList(lesson.objectives);
      var concepts=canonicalLessonList(lesson.concepts);
      var mistakes=canonicalLessonList(lesson.commonMistakes||lesson.commonMistake);
      var relevance=lesson.careerRelevance||lesson.whyItMatters||'This topic supports the practical work and interview questions in this course.';
      var done=isDone(lesson);
      var details='';
      if(objectives.length)details+='<div class="canonical-lesson-section"><h3>What you will learn</h3><ul>'+objectives.map(function(x){return '<li>'+canonicalLessonEscape(x)+'</li>';}).join('')+'</ul></div>';
      details+='<div class="canonical-lesson-section"><h3>Explanation</h3><p>'+canonicalLessonEscape(explanation).replace(/\n/g,'<br>')+'</p></div>';
      if(examples.length)details+='<div class="canonical-lesson-section"><h3>Example</h3>'+examples.map(function(x){return '<pre class="canonical-lesson-example">'+canonicalLessonEscape(x)+'</pre>';}).join('')+'</div>';
      if(concepts.length)details+='<div class="canonical-lesson-section"><h3>Key concepts</h3><div class="canonical-lesson-concepts">'+concepts.map(function(x){return '<span>'+canonicalLessonEscape(x)+'</span>';}).join('')+'</div></div>';
      if(mistakes.length)details+='<div class="canonical-lesson-section canonical-lesson-note"><h3>Common mistake</h3><p>'+mistakes.map(canonicalLessonEscape).join('<br>')+'</p></div>';
      details+='<div class="canonical-lesson-section canonical-lesson-note"><h3>Why it matters</h3><p>'+canonicalLessonEscape(relevance)+'</p></div>';

      lessonPanel.innerHTML='<div class="canonical-lessons-hero"><div><div class="canonical-lessons-kicker">LESSONS</div><h1>'+canonicalLessonEscape(course.title)+'</h1><p>Study the concepts first, then open the existing practice lab.</p></div><div class="canonical-lessons-progress"><strong>'+completedCount()+'/'+sorted.length+'</strong><span>lessons complete</span></div></div>'
        +'<article class="canonical-lesson-card"><div class="canonical-lesson-card-head"><div><div class="canonical-lesson-number">LESSON '+String(currentIndex+1).padStart(2,'0')+' OF '+String(sorted.length).padStart(2,'0')+'</div><h2>'+canonicalLessonEscape(lesson.title||('Lesson '+(currentIndex+1)))+'</h2></div><button type="button" class="canonical-lesson-done '+(done?'done':'')+'" data-canonical-mark-done>'+(done?'✓ Completed':'Mark lesson complete')+'</button></div>'
        +details
        +'<div class="canonical-lesson-footer"><button type="button" data-canonical-prev '+(currentIndex===0?'disabled':'')+'>← Previous</button><button type="button" class="primary" data-canonical-practice>Open Practice Lab</button><button type="button" data-canonical-next '+(currentIndex===sorted.length-1?'disabled':'')+'>Next →</button></div></article>';
      renderNav();
    }
    function saveView(mode){
      viewState[course.id]=mode;
      try{localStorage.setItem(viewKey,JSON.stringify(viewState));}catch(e){}
    }
    function showMode(mode){
      mode=mode==='practice'?'practice':'lessons';
      lessonPanel.hidden=mode!=='lessons';
      lessonNav.hidden=mode!=='lessons';
      lessonPanel.classList.toggle('canonical-lessons-hidden',mode!=='lessons');
      lessonNav.classList.toggle('canonical-lessons-hidden',mode!=='lessons');
      practiceNavNodes.forEach(function(node){node.classList.toggle('canonical-practice-nav-hidden',mode==='lessons');});
      practiceMainNodes.forEach(function(node){node.classList.toggle('canonical-practice-main-hidden',mode==='lessons');});
      Array.prototype.forEach.call(switcher.querySelectorAll('[data-canonical-view]'),function(btn){
        btn.classList.toggle('active',btn.getAttribute('data-canonical-view')===mode);
        btn.setAttribute('aria-pressed',btn.getAttribute('data-canonical-view')===mode?'true':'false');
      });
      saveView(mode);
    }

    switcher.addEventListener('click',function(event){
      var button=event.target.closest('[data-canonical-view]');
      if(button)showMode(button.getAttribute('data-canonical-view'));
    });
    lessonNav.addEventListener('click',function(event){
      var button=event.target.closest('[data-canonical-lesson-index]');
      if(!button)return;
      renderLesson(Number(button.getAttribute('data-canonical-lesson-index')));
      try{main.scrollTo({top:0,behavior:'smooth'});}catch(e){}
    });
    lessonPanel.addEventListener('click',function(event){
      if(event.target.closest('[data-canonical-prev]'))renderLesson(currentIndex-1);
      if(event.target.closest('[data-canonical-next]'))renderLesson(currentIndex+1);
      if(event.target.closest('[data-canonical-practice]'))showMode('practice');
      if(event.target.closest('[data-canonical-mark-done]')){
        var lesson=sorted[currentIndex].lesson;
        var wasDone=isDone(lesson);
        if(wasDone)delete state.course.lessons[lesson.id];
        else state.course.lessons[lesson.id]=true;
        canonicalLessonSave(state);
        if(!wasDone&&window.cxLogActivity)window.cxLogActivity('lessons',1);
        renderLesson(currentIndex);
      }
    });

    renderLesson(0);
    showMode(viewState[course.id]||'lessons');
  };

  function installForRoute(route){
    const registry = window.TRACK_REGISTRY;
    const entry = registry && registry[route];
    if(!entry) return;
    window.ensureCanonicalTrackLessons(route, entry.containerId);
  }

  function activeRoute(){
    const registry = window.TRACK_REGISTRY;
    if(!registry) return null;
    for(const route in registry){
      const entry = registry[route];
      const element = document.getElementById(entry.containerId);
      if(element && getComputedStyle(element).display !== 'none') return route;
    }
    return null;
  }

  function hookRouter(){
    if(typeof window.showTrack === 'function' && !window.showTrack.__canonicalLessonsHooked){
      const original = window.showTrack;
      const hooked = function(name){
        const result = original.apply(this, arguments);
        setTimeout(() => installForRoute(name), 0);
        return result;
      };
      hooked.__canonicalLessonsHooked = true;
      window.showTrack = hooked;
    }
    const route = activeRoute();
    if(route) installForRoute(route);
  }

  function start(){
    hookRouter();
    window.addEventListener('hashchange', () => setTimeout(hookRouter, 0));
    new MutationObserver(() => {
      clearTimeout(start.timer);
      start.timer = setTimeout(hookRouter, 20);
    }).observe(document.body, {childList:true, subtree:true});
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
