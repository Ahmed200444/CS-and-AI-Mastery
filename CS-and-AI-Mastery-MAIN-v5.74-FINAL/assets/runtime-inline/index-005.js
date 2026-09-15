
/* ===== Phase 1: storage version + migration (Task 10) ===== */
(function(){
  var VKEY = 'platform_storage_version';
  var CURRENT_VERSION = 2;
  function safeGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function safeSet(k,v){ try{ localStorage.setItem(k,v); return true; }catch(e){ return false; } }
  var v = safeGet(VKEY);
  var ver = v ? parseInt(v,10) : 1;
  if(isNaN(ver)) ver = 1;
  if(ver < 2){
    // v1 -> v2: no key renames, no data transformation needed --
    // all four existing progress keys (pp_solved, pp_attempts, pp_theme,
    // sqlmastery_all_v1, roadmap_progress_v1, courses_progress_v1) keep
    // their existing shape and are read identically by v2 code.
    // We only stamp the version so future migrations have a reliable base.
    safeSet(VKEY, String(CURRENT_VERSION));
    window._platformMigratedFrom = ver;
  } else {
    window._platformMigratedFrom = null;
  }
  window.PLATFORM_STORAGE_VERSION = CURRENT_VERSION;
})();
