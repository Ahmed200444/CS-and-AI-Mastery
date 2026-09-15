
var TRACK_REGISTRY = {
  agenttrack: { containerId: 'agentTrack', boot: '_agentTBoot' },
  aiml: { containerId: 'aimlTrack', boot: '_aimlBoot' },
  aipath: { containerId: 'aiPathTrack', boot: '_aiPathBoot' },
  apis: { containerId: 'apisTrack', boot: '_apiBoot' },
  backendtrack: { containerId: 'backendTrack', boot: '_beBoot' },
  capstonetrack: { containerId: 'capstoneTrack', boot: '_capBoot' },
  cloudtrack: { containerId: 'cloudTrack', boot: '_cloudBoot' },
  companypaths: { containerId: 'companyPathsTrack', boot: 'cpRender' },
  companytrack: { containerId: 'companyTrack', boot: '_companyBoot' },
  cepath: { containerId: 'cePathTrack', boot: '_cePathBoot' },
  digitalhardware: { containerId: 'digitalHardwareTrack', boot: '_digitalHardwareBoot' },
  distsys: { containerId: 'distSysTrack', boot: '_distSysBoot' },
  softarch: { containerId: 'softArchTrack', boot: '_softArchBoot' },
  cicdtrack: { containerId: 'cicdTrack', boot: '_cicdBoot' },
  mlopstrack: { containerId: 'mlopsTrack', boot: '_mlopsBoot' },
  observabilitytrack: { containerId: 'observabilityTrack', boot: '_observabilityBoot' },
  influencetrack: { containerId: 'influenceTrack', boot: '_influenceBoot' },
  dataengineeringtrack: { containerId: 'dataEngineeringTrack', boot: '_dataEngineeringBoot' },
  aisystemdesigntrack: { containerId: 'aiSystemDesignTrack', boot: '_aiSystemDesignBoot' },
  secureaitrack: { containerId: 'secureAITrack', boot: '_secureAIBoot' },
  llmevaluationtrack: { containerId: 'llmEvaluationTrack', boot: '_llmEvaluationBoot' },
  comparch: { containerId: 'comparchTrack', boot: '_comparchBoot' },
  courses: { containerId: 'coursesTrack', boot: '_coursesBoot' },
  cvtrack: { containerId: 'cvTrack', boot: '_cvBoot' },
  dbtrack: { containerId: 'dbTrack', boot: '_dbBoot' },
  debugtrack: { containerId: 'debugTrack', boot: '_debugBoot' },
  deploytrack: { containerId: 'deployTrack', boot: '_deployBoot' },
  devmode: { containerId: 'devModeTrack', boot: 'dmRender' },
  difftrack: { containerId: 'diffTrack', boot: '_diffBoot' },
  dltrack: { containerId: 'dlTrack', boot: '_dlBoot' },
  dockertrack: { containerId: 'dockerTrack', boot: '_dockBoot' },
  dsa: { containerId: 'dsaTrack', boot: '_dsaBoot' },
  dsci: { containerId: 'dsciTrack', boot: '_dsciBoot' },
  fedev: { containerId: 'fedevTrack', boot: '_feBoot' },
  fspath: { containerId: 'fsPathTrack', boot: '_fsPathBoot' },
  ganstrack: { containerId: 'gansTrack', boot: '_gansBoot' },
  genaitrack: { containerId: 'genaiTrack', boot: '_genaiBoot' },
  gitlab: { containerId: 'gitTrack', boot: '_gitTBoot' },
  githubsync: { containerId: 'githubSyncTrack', boot: '_githubSyncBoot' },
  hftrack: { containerId: 'hfTrack', boot: '_hfBoot' },
  hub: { containerId: 'hub' },
  interviewtrack: { containerId: 'interviewTrack', boot: '_interviewBoot' },
  k8strack: { containerId: 'k8sTrack', boot: '_k8sBoot' },
  linuxtrack: { containerId: 'linuxTrack', boot: '_linuxBoot' },
  llmstrack: { containerId: 'llmsTrack', boot: '_llmsBoot' },
  mylearning: { containerId: 'myLearningTrack', boot: 'mlRender' },
  network: { containerId: 'networkTrack', boot: '_networkBoot' },
  nlptrack: { containerId: 'nlpTrack', boot: '_nlpBoot' },
  oop: { containerId: 'oopTrack', boot: '_oopBoot' },
  portfolio: { containerId: 'portfolioTrack', boot: 'pfRender' },
  prompttrack: { containerId: 'promptTrack', boot: '_promptBoot' },
  pstrack: { containerId: 'psTrack', boot: '_psBoot' },
  python: { containerId: 'pyTrack' },
  pytorchtrack: { containerId: 'pytorchTrack', boot: '_pytorchBoot' },
  ragtrack: { containerId: 'ragTrack', boot: '_ragBoot' },
  resumetrack: { containerId: 'resumeTrack', boot: '_resumeBoot' },
  roadmap: { containerId: 'roadmapTrack' },
  sectrack: { containerId: 'secTrack', boot: '_secBoot' },
  sql: { containerId: 'sqlTrack' },
  sysdtrack: { containerId: 'sysdTrack', boot: '_sysdBoot' },
  testtrack: { containerId: 'testTrack', boot: '_testBoot' },
  tftrack: { containerId: 'tfTrack', boot: '_tfBoot' },
  transtrack: { containerId: 'transTrack', boot: '_transBoot' },
  vaestrack: { containerId: 'vaesTrack', boot: '_vaesBoot' },
  webdev: { containerId: 'webdevTrack', boot: '_wdBoot' }
};

// Preserves the exact pre-refactor "courses" route logic (resume current
// catalog position if one exists, else render the catalog fresh) as a normal
// registry-compatible boot function.
window._coursesBoot = function(){
  if(window.cxRenderCatalog) window.cxRenderCatalog();
};

// v5.18.2: one canonical study surface for every course.
(function(){
  var courseCache=null, routeCourse=null;
  function courses(){
    if(courseCache)return courseCache;
    try{courseCache=(window.__CSAI_COURSES__||(window.__CSAI_COURSES__=JSON.parse(document.getElementById('coursedata').textContent)))||[];}catch(e){courseCache=[];}
    return courseCache;
  }
  function courseForRoute(route){
    if(!routeCourse){routeCourse={};courses().forEach(function(c){if(c.linked)routeCourse[c.linked]=c;});}
    return routeCourse[route]||null;
  }
  function savedProgress(c){
    try{
      var raw=localStorage.getItem('ai_path_resume_v1'),state=raw?JSON.parse(raw):{},saved=state&&state.courses?state.courses[c.id]:null;
      var total=saved?Number(saved.trackTotal)||0:0,done=saved&&Array.isArray(saved.trackCompleted)?Math.min(total,saved.trackCompleted.length):0;
      return {total:total,done:done,pct:total?Math.round(done/total*100):0,title:saved&&saved.trackTitle?saved.trackTitle:'Start the first section'};
    }catch(e){return {total:0,done:0,pct:0,title:'Start the first section'};}
  }
  function activeRoute(){
    if(!window.TRACK_REGISTRY)return null;
    for(var r in window.TRACK_REGISTRY){var e=window.TRACK_REGISTRY[r],el=document.getElementById(e.containerId);if(el&&getComputedStyle(el).display!=='none')return r;}
    return null;
  }
  window.ensureSingleCourseTrackPanel=function(route,containerId){
    var c=courseForRoute(route),container=document.getElementById(containerId);
    if(!c||!container)return;
    var side=container.querySelector('.side,.sidebar');if(!side)return;
    var panel=side.querySelector('.single-track-panel');
    if(!panel){
      panel=document.createElement('div');panel.className='single-track-panel';panel.setAttribute('data-course-id',c.id);
      var back=side.querySelector('a[data-act*="showTrack"],button[data-act*="showTrack"]');
      if(back&&back.nextSibling)side.insertBefore(panel,back.nextSibling);else side.insertBefore(panel,side.firstChild);
    }
    var p=savedProgress(c);
    panel.innerHTML='<div class="single-track-panel-top"><span class="single-track-panel-title">Course progress</span><span class="single-track-panel-pct">'+p.pct+'%</span></div>'
      +'<div class="single-track-panel-bar"><span style="width:'+p.pct+'%"></span></div>'
      +'<div class="single-track-panel-sub">'+(p.total?(p.done+' of '+p.total+' study sections complete · '+p.title):'Progress begins when you open the first section.')+'</div>'
      +'<button type="button" class="single-track-panel-btn" data-act="cxOpenDetails(\''+c.id+'\')">Course info, quizzes &amp; projects</button>';
  };
  window.updateSingleCourseTrackPanel=function(route){
    route=route||activeRoute();if(!route||!window.TRACK_REGISTRY||!window.TRACK_REGISTRY[route])return;
    window.ensureSingleCourseTrackPanel(route,window.TRACK_REGISTRY[route].containerId);
  };
})();

function ensureWebTrackMobileToggle(containerId){
  var container = document.getElementById(containerId);
  if(!container || !container.classList.contains('web-track')) return;
  var side = container.querySelector('.side, .sidebar');
  if(!side) return;
  // Idempotent: never insert a second toggle if one already exists for this container.
  var prev = side.previousElementSibling;
  if(prev && prev.classList && prev.classList.contains('web-track-toggle')) return;
  if(!side.id) side.id = containerId+'_wtSide';
  var btn = document.createElement('button');
  btn.className = 'web-track-toggle';
  btn.type = 'button';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', side.id);
  btn.innerHTML = '<span>Course contents</span><span class="wt-caret" aria-hidden="true">&#9662;</span>';
  btn.addEventListener('click', function(){
    var expanded = side.classList.toggle('wt-expanded');
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  });
  side.parentElement.insertBefore(btn, side);
  // Collapse the disclosure automatically once a real navigation item inside it is
  // activated (a link or button), so selecting a lesson doesn't leave the mobile
  // panel awkwardly open over the content it just navigated to.
  side.addEventListener('click', function(ev){
    var target = ev.target.closest('a, button');
    if(target && side.classList.contains('wt-expanded') && window.innerWidth <= 920){
      side.classList.remove('wt-expanded');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

function showTrack(name){
  if(name==='oop'){ try{ location.href='courses/python.html#aptech-oop-module'; }catch(e){} return; }
  var entry = TRACK_REGISTRY[name];
  if(!entry){
    console.warn('showTrack: unknown route "'+name+'", falling back to hub');
    name = 'hub';
    entry = TRACK_REGISTRY.hub;
  }
  // Hide every registered screen, show exactly the target one.
  for(var route in TRACK_REGISTRY){
    var el = document.getElementById(TRACK_REGISTRY[route].containerId);
    if(el) el.style.display = (route === name) ? '' : 'none';
  }
  // Boot the target route if it has one.
  if(entry.boot && typeof window[entry.boot] === 'function'){
    window[entry.boot]();
  }
  // Ensure a mobile "Course contents" disclosure exists for dedicated interactive
  // tracks -- idempotent, and a no-op for any container that isn't a web-track.
  ensureWebTrackMobileToggle(entry.containerId);
  if(window.aiPathCaptureActiveTrackPosition) setTimeout(function(){ window.aiPathCaptureActiveTrackPosition(name); if(window.updateSingleCourseTrackPanel)window.updateSingleCourseTrackPanel(name); },0);
  if(window.ensureSingleCourseTrackPanel) window.ensureSingleCourseTrackPanel(name,entry.containerId);
  // Update the hash safely -- history APIs can throw in sandboxed previews.
  try{
    var newHash = '#'+name;
    if(location.hash !== newHash){
      history.replaceState ? history.replaceState(null, '', newHash) : (location.hash = newHash);
    }
  }catch(e){ /* sandboxed preview -- hash update is best-effort, navigation still works */ }
  // Scroll to the top of the newly-shown view.
  try{ window.scrollTo(0, 0); }catch(e){}
}
window.showTrack = showTrack;
window.TRACK_REGISTRY = TRACK_REGISTRY;

window.addEventListener('hashchange', function(){
  var h = location.hash.replace('#','');
  if(h === '' ){ showTrack('hub'); return; }
  if(TRACK_REGISTRY[h]){ showTrack(h); }
  // any other hash (e.g. #c0, #playground) is an internal anchor within the
  // currently active track -- leave track visibility alone, let the browser scroll.
});
(function(){
  var h = '';
  try{ h = location.hash.replace('#',''); }catch(e){}
  var target = TRACK_REGISTRY[h] ? h : 'hub';
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ showTrack(target); });
  } else {
    showTrack(target);
  }
})();
