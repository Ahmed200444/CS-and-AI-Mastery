
(function(){
  var AI_PATH_RESUME_KEY = 'ai_path_resume_v1';
  var phaseOpenState = {};
  var AI_PATH_PHASES = [
    { title:'Phase 1 — Programming & engineering foundations', note:'Build the coding, problem-solving, tooling, and quality habits everything else depends on.', courses:[
      ['python','Start with Python fundamentals, then complete the integrated Aptech OOP module before moving on.'],
      ['problem-solving','Develop a repeatable approach to breaking down unfamiliar engineering problems.'],
      ['dsa','Build algorithmic thinking for interviews and efficient real-world code.'],
      ['cpp-dsa','Build lower-level C++ fluency and implement the same DSA ideas with explicit memory, STL, and performance reasoning.'],
      ['git','Use professional version control before your projects become larger and collaborative.'],
      ['linux','Become comfortable in the command-line environment used by servers, containers, and ML tooling.'],
      ['debugging','Learn to diagnose failures systematically instead of guessing.'],
      ['testing','Protect AI and software systems with repeatable automated checks.'],
      ['software-engineering-practice','Combine requirements, design, reviews, refactoring, releases, observability, and incident learning into a professional delivery workflow.']
    ]},
    { title:'Phase 2 — Data & backend foundation', note:'AI products still need data stores, APIs, backend services, and networking.', courses:[
      ['sql','Query and transform structured data confidently.'],
      ['databases','Understand storage, indexing, transactions, and database trade-offs.'],
      ['apis','Learn the interface layer through which AI capabilities are usually exposed.'],
      ['backend','Build the services that connect models to users, data, and business logic.'],
      ['networking','Understand HTTP, DNS, TCP/IP, ports, proxies, and the network beneath AI services.']
    ]},
    { title:'Phase 3 — Core AI & machine learning', note:'Build the modeling foundation before specializing in LLM applications.', courses:[
      ['classical-ai','Master search, constraint solving, logic, reasoning, planning, and decision-making before relying on learned models.'],
      ['ai-ml','Learn the core machine-learning workflow, evaluation concepts, and model families.'],
      ['deep-learning','Move from classical ML into neural networks and representation learning.'],
      ['pytorch','Turn deep-learning concepts into practical model-building skills.'],
      ['data-engineering','Learn the pipelines and data quality practices production ML depends on.']
    ]},
    { title:'Phase 4 — Modern generative AI', note:'Progress from transformer foundations to models, LLM applications, retrieval, agents, evaluation, and security.', courses:[
      ['transformers','Understand the architecture underlying modern language models.'],
      ['huggingface','Work practically with pretrained models, datasets, fine-tuning, PEFT, and inference.'],
      ['llms','Learn how large language models behave and how to build with them responsibly.'],
      ['reinforcement-learning-post-training','Learn reinforcement learning fundamentals and modern LLM post-training with SFT, preference optimization, reward modeling, PPO, DPO, and GRPO-style methods.'],
      ['prompt-engineering','Develop systematic prompting and structured interaction techniques.'],
      ['rag','Ground model responses in external knowledge with retrieval.'],
      ['ai-agents','Build tool-using and multi-step agentic workflows after mastering LLM fundamentals.'],
      ['llm-evaluation-testing','Measure AI quality, regressions, slices, and failure modes instead of relying on demos.'],
      ['secure-ai-applications','Add AI-specific security thinking before treating an application as production-ready.']
    ]},
    { title:'Phase 5 — Production AI', note:'Learn to package, deploy, operate, monitor, and design reliable AI systems.', courses:[
      ['docker','Package applications and model services reproducibly.'],
      ['cloud-computing','Understand the infrastructure where production AI workloads run.'],
      ['deployment','Ship models and applications into usable environments.'],
      ['cicd','Automate safe testing and delivery of changing software.'],
      ['mlops','Apply model-specific versioning, rollout, monitoring, drift, and lifecycle practices.'],
      ['large-scale-ai','Scale model training and inference across GPUs with sharding, parallelism, precision, batching, KV-cache management, profiling, and optimized serving.'],
      ['observability','See what production systems are doing through logs, metrics, traces, SLOs, and alerts.'],
      ['ai-system-design','Combine model, retrieval, serving, data, reliability, latency, and cost trade-offs into complete AI architectures.']
    ]},
    { title:'Phase 6 — Advanced systems engineering', note:'Strengthen the systems knowledge that becomes more valuable as AI applications grow in scale and complexity.', courses:[
      ['system-design','Learn to reason about scale, reliability, data flow, and architectural trade-offs.'],
      ['software-architecture','Structure large codebases and services with deliberate design choices.'],
      ['distributed-systems','Understand concurrency, replication, consistency, messaging, and failure across machines.'],
      ['kubernetes','Operate containerized workloads with orchestration and safe rollouts.'],
      ['cybersecurity','Strengthen general security fundamentals around the AI application stack.'],
      ['comparch-os','Deepen your understanding of processes, threads, memory, scheduling, and hardware/OS behavior.']
    ]}
  ];

  var AI_PATH_PRIORITY = {
    'python':'Core','problem-solving':'Core','dsa':'Core','cpp-dsa':'Supporting','git':'Important','linux':'Important','debugging':'Important','testing':'Important','software-engineering-practice':'Core',
    'sql':'Core','databases':'Important','apis':'Important','backend':'Important','networking':'Important',
    'classical-ai':'Core','ai-ml':'Core','deep-learning':'Core','pytorch':'Core','data-engineering':'Core',
    'transformers':'Core','huggingface':'Core','llms':'Core','reinforcement-learning-post-training':'Core','prompt-engineering':'Important','rag':'Core','ai-agents':'Core','llm-evaluation-testing':'Core','secure-ai-applications':'Important',
    'docker':'Important','cloud-computing':'Important','deployment':'Important','cicd':'Important','mlops':'Core','large-scale-ai':'Core','observability':'Important','ai-system-design':'Core',
    'system-design':'Important','software-architecture':'Important','distributed-systems':'Important','kubernetes':'Supporting','cybersecurity':'Supporting','comparch-os':'Supporting'
  };

  var AI_PATH_MILESTONES = {
    0:{id:'foundation-builder',title:'Checkpoint project — Foundation Builder',desc:'Build a Python application that uses OOP, Git, debugging, and automated tests. Keep it small enough to finish, but polished enough to explain in an interview.'},
    2:{id:'end-to-end-ml',title:'Checkpoint project — End-to-End ML System',desc:'Prepare data, train and evaluate a model, document the baseline, and explain one limitation or failure mode.'},
    3:{id:'grounded-llm',title:'Checkpoint project — Grounded LLM Assistant',desc:'Build a RAG or tool-using assistant with evaluation cases, citation/grounding checks, and one explicit security control.'},
    4:{id:'production-ai-service',title:'Checkpoint project — Production AI Service',desc:'Expose an AI capability through an API, package it with Docker, add CI checks, and define monitoring, rollback, latency, and cost expectations.'},
    5:{id:'ai-engineering-capstone',title:'Final checkpoint — AI Engineering Capstone',desc:'Combine architecture, deployment, observability, evaluation, and trade-off reasoning into one portfolio-ready system with an honest limitations section.'}
  };

  function escAI(s){ return String(s==null?'':s).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];}); }
  function getCoursesAI(){ try{return (window.__CSAI_COURSES__||(window.__CSAI_COURSES__=JSON.parse(document.getElementById('coursedata').textContent)))||[];}catch(e){return [];} }
  function loadAIState(){
    try{
      var v=JSON.parse(localStorage.getItem(AI_PATH_RESUME_KEY))||{};
      if(!v.courses||typeof v.courses!=='object')v.courses={};
      if(!v.milestones||typeof v.milestones!=='object')v.milestones={};
      return v;
    }catch(e){ return {courses:{},milestones:{}}; }
  }
  function saveAIState(v){ try{ localStorage.setItem(AI_PATH_RESUME_KEY,JSON.stringify(v)); return true; }catch(e){ return false; } }
  function courseProgressStore(){ try{return JSON.parse(localStorage.getItem('courses_progress_v1'))||{};}catch(e){return {};} }
  function sortedLessonsAI(c){
    return (c.lessons||[]).map(function(l,origIdx){return {l:l,origIdx:origIdx};})
      .sort(function(a,b){return (a.l.displayOrder!=null?a.l.displayOrder:a.origIdx)-(b.l.displayOrder!=null?b.l.displayOrder:b.origIdx);});
  }
  function linkedProgressAI(c){
    var saved=loadAIState().courses[c.id]||{};
    var total=Number(saved.trackTotal)||0;
    var completed=Array.isArray(saved.trackCompleted)?saved.trackCompleted:[];
    var visited=Array.isArray(saved.trackVisited)?saved.trackVisited:[];
    var done=Math.min(total,completed.length);
    return {linkedDone:done,linkedVisited:Math.min(total,visited.length),linkedTotal:total,linkedPct:total?Math.round(done/total*100):0};
  }
  function progressAI(c){
    try{
      var base;
      if(window.counts) base=window.counts(c);
      else{
        var cp=courseProgressStore(),st=cp[c.id]||{lessons:{},exercises:{},quiz:{},projects:{}};
        var ld=(c.lessons||[]).filter(function(l){return st.lessons&&st.lessons[l.id];}).length;
        var ed=(c.exercises||[]).filter(function(_,i){return st.exercises&&st.exercises[i];}).length;
        var qd=(c.quiz||[]).filter(function(_,i){return st.quiz&&st.quiz[i]!==undefined;}).length;
        var pd=(c.projects||[]).filter(function(p){return st.projects&&st.projects[p.id];}).length;
        var total=(c.lessons||[]).length+(c.exercises||[]).length+(c.quiz||[]).length+(c.projects||[]).length;
        var done=ld+ed+qd+pd; base={lDone:ld,eDone:ed,qDone:qd,pDone:pd,total:total,done:done,pct:total?Math.round(done/total*100):0};
      }
      if(c.linked){
        var lp=linkedProgressAI(c);
        base=Object.assign({},base,lp);
        if(lp.linkedTotal)base.pct=Math.max(Number(base.pct)||0,lp.linkedPct);
      }
      return base;
    }catch(e){ return {lDone:0,eDone:0,qDone:0,pDone:0,total:0,done:0,pct:0,linkedDone:0,linkedVisited:0,linkedTotal:0,linkedPct:0}; }
  }
  function lessonPositionAI(c){
    var lessons=sortedLessonsAI(c); if(!lessons.length)return null;
    var state=loadAIState(), saved=state.courses[c.id]||{}, cp=courseProgressStore(), st=cp[c.id]||{lessons:{}};
    var doneMap=st.lessons||{}, savedIndex=-1;
    if(saved.lessonId){
      for(var i=0;i<lessons.length;i++){if(lessons[i].l.id===saved.lessonId){savedIndex=i;break;}}
    }
    if(savedIndex>=0 && !doneMap[lessons[savedIndex].l.id]) return {kind:'Last viewed',index:savedIndex,lesson:lessons[savedIndex].l,total:lessons.length};
    if(savedIndex>=0){
      for(var j=savedIndex+1;j<lessons.length;j++) if(!doneMap[lessons[j].l.id]) return {kind:'Next lesson',index:j,lesson:lessons[j].l,total:lessons.length};
    }
    for(var k=0;k<lessons.length;k++) if(!doneMap[lessons[k].l.id]) return {kind:(Object.keys(doneMap).length?'Next lesson':'Start here'),index:k,lesson:lessons[k].l,total:lessons.length};
    return {kind:'Complete',index:lessons.length-1,lesson:lessons[lessons.length-1].l,total:lessons.length};
  }
  function linkedPositionAI(c){
    var state=loadAIState(),saved=state.courses[c.id]||{};
    if(saved.trackTitle){
      return {kind:'Last viewed',title:saved.trackTitle,index:saved.trackIndex!=null?Number(saved.trackIndex):null,total:saved.trackTotal!=null?Number(saved.trackTotal):null,action:saved.trackAction||'',hash:saved.trackHash||'',key:saved.trackKey||'',route:saved.trackRoute||c.linked};
    }
    return {kind:'Start here',title:'Open the dedicated interactive track',index:null,total:null,action:'',hash:'',key:'',route:c.linked};
  }

  function flattenedPath(){
    var out=[],n=0;
    AI_PATH_PHASES.forEach(function(ph,pi){ph.courses.forEach(function(item){n++;out.push({id:item[0],reason:item[1],phaseIndex:pi,order:n});});});
    return out;
  }

  window.aiPathGetResume=function(courseId){ var s=loadAIState(); return s.courses[courseId]||null; };
  window.aiPathRememberCourse=function(courseId,tab){
    var s=loadAIState(), old=s.courses[courseId]||{};
    s.lastCourseId=courseId;
    s.courses[courseId]=Object.assign({},old,{lessonId:old.lessonId||null,lessonIndex:old.lessonIndex!=null?old.lessonIndex:null,tab:tab||old.tab||'overview',updatedAt:Date.now()});
    saveAIState(s);
  };
  window.aiPathRememberTab=function(courseId,tab){ if(courseId)window.aiPathRememberCourse(courseId,tab); };
  window.aiPathRememberLesson=function(courseId,lessonId,lessonIndex){
    var s=loadAIState(), old=s.courses[courseId]||{};
    s.lastCourseId=courseId;
    s.courses[courseId]=Object.assign({},old,{lessonId:lessonId||old.lessonId||null,lessonIndex:lessonIndex!=null?Number(lessonIndex):(old.lessonIndex!=null?old.lessonIndex:null),tab:'lessons',updatedAt:Date.now()});
    saveAIState(s);
  };
  window.aiPathCourseResumeHTML=function(c){
    if(!c)return '';
    if(c.linked){
      var tp=linkedPositionAI(c);
      var detail=tp.index!=null&&tp.total ? (tp.hash?'Section ':'Task ')+(tp.index+1)+' of '+tp.total+' — '+tp.title : tp.title;
      return '<div class="ai-course-resume"><div class="ai-course-resume-text"><b>'+escAI(tp.kind)+': '+escAI(detail)+'</b><span>Your position inside the dedicated interactive track is saved on this device.</span></div><button type="button" class="cx-open-btn" data-act="aiPathResumeCourse(\''+escAI(c.id)+'\',\'\')">Resume interactive track</button></div>';
    }
    if(!(c.lessons||[]).length)return '';
    var p=lessonPositionAI(c); if(!p)return '';
    if(p.kind==='Complete') return '<div class="ai-course-resume"><div class="ai-course-resume-text"><b>All lessons completed</b><span>You can review any lesson or continue with exercises and checkpoints.</span></div><button type="button" class="cx-ghost" data-act="aiPathResumeCourse(\''+escAI(c.id)+'\',\''+escAI(p.lesson.id)+'\')">Review last lesson</button></div>';
    return '<div class="ai-course-resume"><div class="ai-course-resume-text"><b>'+escAI(p.kind)+': Lesson '+(p.index+1)+' of '+p.total+' — '+escAI(p.lesson.title)+'</b><span>Your exact course/lesson position is saved on this device.</span></div><button type="button" class="cx-open-btn" data-act="aiPathResumeCourse(\''+escAI(c.id)+'\',\''+escAI(p.lesson.id)+'\')">Resume lesson</button></div>';
  };
  window.aiPathOpenCourse=function(id){ if(window.cxOpen)window.cxOpen(id); };
  function cleanTrackTitleAI(v){return String(v||'').replace(/^\s*\d+\s*[.)-]?\s*/,'').replace(/✓/g,'').replace(/\s+/g,' ').trim();}
  function trackItemsAI(container){
    var side=container.querySelector('.side,.sidebar'); if(!side)return [];
    return Array.prototype.slice.call(side.querySelectorAll('button[data-act],a[href^="#"]')).filter(function(el){
      if(el.classList.contains('themebtn')||el.classList.contains('single-track-panel-btn'))return false;
      var act=el.getAttribute('data-act')||''; if(act.indexOf('showTrack(')===0)return false;
      if(el.tagName==='A'){var href=el.getAttribute('href')||'';if(!href||href==='#')return false;var target=container.querySelector(href);if(!target)return false;}
      return true;
    });
  }
  function activeTrackItemAI(container,items){
    var active=items.find(function(el){return el.getAttribute('data-ai-force-active')==='1';});
    if(!active)active=items.find(function(el){return el.classList.contains('active')||el.getAttribute('aria-current')==='true'||el.getAttribute('aria-selected')==='true';});
    if(active)return active;
    var pivot=Math.min(190,Math.max(90,window.innerHeight*.24)),best=null,bestScore=Infinity;
    items.forEach(function(el){
      if(el.tagName!=='A')return;var href=el.getAttribute('href')||'',target=href&&container.querySelector(href);if(!target)return;
      var r=target.getBoundingClientRect();if(r.bottom<70)return;
      var score=r.top<=pivot?(pivot-r.top):(10000+r.top-pivot);
      if(score<bestScore){bestScore=score;best=el;}
    });
    return best||items[0]||null;
  }
  window.aiPathCaptureActiveTrackPosition=function(route){
    try{
      var courses=getCoursesAI();
      if(!route){
        for(var r in window.TRACK_REGISTRY){var e=window.TRACK_REGISTRY[r],el=document.getElementById(e.containerId);if(el&&getComputedStyle(el).display!=='none'){route=r;break;}}
      }
      var c=courses.find(function(x){return x.linked===route;}); if(!c)return;
      var entry=window.TRACK_REGISTRY&&window.TRACK_REGISTRY[route],container=entry&&document.getElementById(entry.containerId); if(!container)return;
      var items=trackItemsAI(container),active=activeTrackItemAI(container,items);
      var idx=active?items.indexOf(active):-1,hash=active&&active.tagName==='A'?(active.getAttribute('href')||''):'',action=active&&active.tagName!=='A'?(active.getAttribute('data-act')||''):'';
      var target=hash&&container.querySelector(hash),heading=target&&target.querySelector('h1,h2,h3,h4');
      if(!heading&&active&&active.tagName!=='A'){heading=container.querySelector('.main .wd-lesson-head h2,.main .lesson-head h2,main .wd-lesson-head h2,main .lesson-head h2');}
      var title=heading?cleanTrackTitleAI(heading.textContent):(active?cleanTrackTitleAI(active.textContent):'');
      if(!title)return;
      var key=hash?('hash:'+hash):action?('act:'+action):('index:'+idx);
      var state=loadAIState(),old=state.courses[c.id]||{},visited=Array.isArray(old.trackVisited)?old.trackVisited.slice():[],completed=Array.isArray(old.trackCompleted)?old.trackCompleted.slice():[];
      if(visited.indexOf(key)<0)visited.push(key);
      var oldIndex=old.trackIndex!=null?Number(old.trackIndex):null;
      if(old.trackKey&&oldIndex!=null&&idx>=0&&idx>oldIndex&&completed.indexOf(old.trackKey)<0)completed.push(old.trackKey);
      state.lastCourseId=c.id;
      state.courses[c.id]=Object.assign({},old,{trackRoute:route,trackTitle:title,trackIndex:idx>=0?idx:null,trackTotal:items.length||null,trackAction:action,trackHash:hash,trackKey:key,trackVisited:visited,trackCompleted:completed,updatedAt:Date.now()});
      saveAIState(state);
    }catch(e){}
  };
  window.aiPathResumeCourse=function(id,lessonId){
    id=String(id||'').replace(/[^A-Za-z0-9._-]/g,'');
    if(!id)return;
    var state=loadAIState(); state.lastCourseId=id; saveAIState(state);
    var url='courses/'+encodeURIComponent(id)+'.html';
    location.assign(url);
  };
  window.aiPathTogglePhase=function(pi){
    var body=document.getElementById('aiPathPhaseBody_'+pi),btn=document.getElementById('aiPathPhaseBtn_'+pi); if(!body||!btn)return;
    var open=body.hasAttribute('hidden');
    if(open)body.removeAttribute('hidden');else body.setAttribute('hidden','');
    btn.setAttribute('aria-expanded',open?'true':'false');
    phaseOpenState[pi]=open;
  };
  window.aiPathToggleMilestone=function(id){
    var s=loadAIState(); s.milestones[id]=!s.milestones[id]; saveAIState(s); renderAIPath();
  };

  function milestoneHTML(pi,state){
    var m=AI_PATH_MILESTONES[pi]; if(!m)return '';
    var done=!!state.milestones[m.id];
    return '<div class="ai-path-milestone'+(done?' done':'')+'"><div class="ai-path-milestone-top"><div><div class="ai-path-kicker">Portfolio checkpoint</div><h3>'+escAI(m.title)+'</h3><p>'+escAI(m.desc)+'</p></div>'
      +'<button type="button" class="ai-path-milestone-btn" aria-pressed="'+(done?'true':'false')+'" data-act="aiPathToggleMilestone(\''+escAI(m.id)+'\')">'+(done?'✓ Completed':'Mark completed')+'</button></div></div>';
  }

  function renderAIPath(){
    var view=document.getElementById('aiPathView'); if(!view)return;
    var courses=getCoursesAI(),map={}; courses.forEach(function(c){map[c.id]=c;});
    var flat=flattenedPath(),state=loadAIState(),completed=0,total=flat.length;
    var firstIncomplete=flat.find(function(x){var c=map[x.id];return c&&progressAI(c).pct<100;});
    var continueItem=null;
    if(state.lastCourseId){ continueItem=flat.find(function(x){return x.id===state.lastCourseId&&map[x.id]&&progressAI(map[x.id]).pct<100;}); }
    if(!continueItem)continueItem=firstIncomplete||flat[flat.length-1];
    var currentPhase=continueItem?continueItem.phaseIndex:0;

    var phases=AI_PATH_PHASES.map(function(ph,pi){
      var phaseDone=0;
      var cards=ph.courses.map(function(item){
        var info=flat.find(function(x){return x.id===item[0];}),c=map[item[0]];
        if(!c)return '<div class="ai-path-course-card"><b>Missing course reference: '+escAI(item[0])+'</b></div>';
        var k=progressAI(c); if(k.pct>=100){completed++;phaseDone++;}
        var priority=AI_PATH_PRIORITY[c.id]||'Supporting',pos=lessonPositionAI(c),lessonLine='';
        if(c.linked){ var tp=linkedPositionAI(c); lessonLine='<div class="ai-path-lesson-line"><b>'+escAI(tp.kind)+':</b> '+(tp.index!=null&&tp.total?(tp.hash?'Section ':'Task ')+(tp.index+1)+' of '+tp.total+' — ':'')+escAI(tp.title)+'</div>'; }
        else if(pos&&pos.kind==='Complete') lessonLine='<div class="ai-path-lesson-line complete">✓ All '+pos.total+' lessons completed — continue with exercises, checkpoints, or projects.</div>';
        else if(pos) lessonLine='<div class="ai-path-lesson-line"><b>'+escAI(pos.kind)+':</b> Lesson '+(pos.index+1)+' of '+pos.total+' — '+escAI(pos.lesson.title)+'</div>';
        var hasProgress=c.linked?((k.linkedDone||0)>0||(k.linkedVisited||0)>0||!!state.courses[c.id]):(k.done>0||!!state.courses[c.id]);
        var buttonText=k.pct>=100?'Review '+c.title:(hasProgress?'Continue '+c.title:'Start '+c.title);
        var lessonId=pos&&pos.lesson&&!c.linked?pos.lesson.id:'';
        return '<article class="ai-path-course-card"><div class="ai-path-course-row"><div class="ai-path-step">'+info.order+'</div><div class="ai-path-course-main">'
          +'<div class="ai-path-course-head"><h3>'+escAI(c.title)+'</h3><span class="ai-path-priority ai-path-priority-'+priority.toLowerCase()+'">'+priority+'</span></div>'
          +'<p class="ai-path-reason">'+escAI(item[1])+'</p>'
          +'<div class="ai-path-progress-line"><span>'+k.pct+'% complete'+(c.estimatedHours?' · '+escAI(c.estimatedHours)+'h estimated':'')+'</span><span>'+(c.linked?(k.linkedTotal?((k.linkedDone||0)+' of '+k.linkedTotal+' track sections complete'):'Interactive track'):((k.lDone||0)+' of '+(c.lessons||[]).length+' lessons complete'))+'</span></div>'
          +'<div class="cx-bar" style="margin-top:7px"><span style="width:'+k.pct+'%"></span></div>'+lessonLine
          +'<div class="ai-path-actions"><button type="button" class="wd-btn" data-act="aiPathResumeCourse(\''+escAI(c.id)+'\',\''+escAI(lessonId)+'\')">'+escAI(buttonText)+'</button></div>'
          +'</div></div></article>';
      }).join('');
      var open=phaseOpenState[pi]; if(open===undefined)open=(pi===currentPhase);
      var bodyId='aiPathPhaseBody_'+pi,btnId='aiPathPhaseBtn_'+pi;
      return '<section class="ai-path-phase"><button type="button" class="ai-path-phase-toggle" id="'+btnId+'" aria-expanded="'+(open?'true':'false')+'" aria-controls="'+bodyId+'" data-act="aiPathTogglePhase('+pi+')">'
        +'<span><span class="ai-path-kicker">Phase '+(pi+1)+'</span><span class="ai-path-phase-title">'+escAI(ph.title.replace(/^Phase \d+ — /,''))+'</span></span>'
        +'<span style="display:flex;align-items:center;gap:10px"><span class="ai-path-phase-count">'+phaseDone+' of '+ph.courses.length+' courses complete</span><span class="ai-path-caret" aria-hidden="true">⌄</span></span></button>'
        +'<div class="ai-path-phase-body" id="'+bodyId+'"'+(open?'':' hidden')+'><p class="ai-path-phase-note">'+escAI(ph.note)+'</p>'+cards+milestoneHTML(pi,state)+'</div></section>';
    }).join('');

    var continueHTML='';
    if(continueItem&&map[continueItem.id]){
      var cc=map[continueItem.id],ck=progressAI(cc),lp=lessonPositionAI(cc),stop='';
      if(cc.linked){ var ctp=linkedPositionAI(cc); stop=ctp.kind+': '+(ctp.index!=null&&ctp.total?(ctp.hash?'Section ':'Task ')+(ctp.index+1)+' of '+ctp.total+' — ':'')+ctp.title; }
      else if(lp&&lp.kind==='Complete')stop='All lessons are complete; continue with practice, checkpoints, or projects.';
      else if(lp)stop=lp.kind+': Lesson '+(lp.index+1)+' of '+lp.total+' — '+lp.lesson.title;
      continueHTML='<div class="ai-path-continue"><div class="ai-path-continue-top"><div><div class="ai-path-kicker">Continue AI Path</div><h2>'+escAI(cc.title)+'</h2><div class="ai-path-meta">Course '+continueItem.order+' of '+total+' · Phase '+(continueItem.phaseIndex+1)+' · '+ck.pct+'% complete</div>'
        +'<div class="ai-path-stop">'+escAI(stop)+'</div></div><button type="button" class="cx-open-btn" data-act="aiPathResumeCourse(\''+escAI(cc.id)+'\',\''+escAI(lp&&lp.lesson&&!cc.linked?lp.lesson.id:'')+'\')">Continue course →</button></div></div>';
    }

    view.innerHTML='<div class="cx-top"><button type="button" class="cx-back" data-act="showTrack(\'hub\')">&larr; Home</button></div>'
      +'<div class="cx-hero"><div style="font-size:2rem">🤖</div><div><h1 style="margin:0 0 4px">AI Engineer Path</h1>'
      +'<p style="margin:0;color:var(--sub)">A strict recommended learning order through existing courses for becoming an AI engineer. Every course remains unlocked; the path now remembers your course and lesson position on this device.</p></div></div>'
      +continueHTML
      +'<div class="ai-path-summary"><b>'+completed+' of '+total+' path courses fully completed</b><div style="color:var(--sub);font-size:.85rem;margin-top:5px">6 phases · '+total+' ordered courses · Core/Important/Supporting priorities · 5 project checkpoints</div></div>'
      +phases;
  }
  var aiTrackCaptureTimer=null;
  function scheduleAITrackCapture(){clearTimeout(aiTrackCaptureTimer);aiTrackCaptureTimer=setTimeout(function(){if(window.aiPathCaptureActiveTrackPosition)window.aiPathCaptureActiveTrackPosition();},130);}
  document.addEventListener('click',function(e){var nav=e.target.closest('.side a[href^="#"],.sidebar a[href^="#"],.side button[data-act],.sidebar button[data-act]');if(nav){nav.setAttribute('data-ai-force-active','1');setTimeout(function(){if(window.aiPathCaptureActiveTrackPosition)window.aiPathCaptureActiveTrackPosition();if(window.updateSingleCourseTrackPanel)window.updateSingleCourseTrackPanel();nav.removeAttribute('data-ai-force-active');},70);}});
  window.addEventListener('pagehide',function(){if(window.aiPathCaptureActiveTrackPosition)window.aiPathCaptureActiveTrackPosition();},{capture:true});
  window._aiPathBoot=renderAIPath;
})();
