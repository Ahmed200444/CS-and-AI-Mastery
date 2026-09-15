
(function(){
  // Real, append-only daily activity log. Every entry here corresponds to an
  // actual user action (marking a lesson done, a correct exercise/quiz answer,
  // a completed project) or actual measured time on the page -- nothing here
  // is simulated or backfilled.
  var ALS = 'learning_activity_v1';
  var today = function(){ return new Date().toISOString().slice(0,10); };
  var log = {};
  function load(){ try{ var r = localStorage.getItem(ALS); if(r) log = JSON.parse(r)||{}; }catch(e){ log = {}; } }
  function save(){ try{ localStorage.setItem(ALS, JSON.stringify(log)); }catch(e){} }
  function todayEntry(){
    var d = today();
    if(!log[d]) log[d] = {lessons:0, exercises:0, quiz:0, quizCorrect:0, projects:0, minutes:0};
    return log[d];
  }
  window.cxLogActivity = function(kind, delta, correct){
    var e = todayEntry();
    if(kind === 'lessons') e.lessons += delta;
    else if(kind === 'exercises') e.exercises += delta;
    else if(kind === 'projects') e.projects += delta;
    else if(kind === 'quiz'){ e.quiz += delta; if(correct) e.quizCorrect += delta; }
    save();
  };
  window.cxGetActivityLog = function(){ return log; };

  // Real time-on-page tracking: a heartbeat every 30s, only counted while the
  // tab is actually visible/focused (paused when backgrounded), and only while
  // a learning surface (not the bare hub) is open.
  var LEARNING_TRACKS = ['sqlTrack','pyTrack','oopTrack','coursesTrack','roadmapTrack'];
  function isLearning(){
    return LEARNING_TRACKS.some(function(id){
      var el = document.getElementById(id);
      return el && getComputedStyle(el).display !== 'none';
    });
  }
  setInterval(function(){
    if(document.visibilityState === 'visible' && isLearning()){
      todayEntry().minutes += 0.5;
      save();
    }
  }, 30000);

  load();
})();
