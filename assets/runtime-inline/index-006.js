
/* Safe, CSP-compliant event dispatcher. Inline onclick/onchange attributes are
   stripped or blocked by some HTML preview sandboxes (a Content-Security-Policy
   without 'unsafe-inline' for script-src blocks them, along with any inline
   event-handler attribute), so every click/change is wired here instead, via
   normal addEventListener + a plain property lookup on window -- no eval(),
   no new Function(), so it works under any CSP including strict ones. */
function _parseArgs(argStr){
  if(!argStr.trim()) return [];
  const out=[]; let cur=''; let inQuote=null; let quoted=false;
  const push=()=>{ out.push(quoted ? cur : (cur.trim()!=='' && !isNaN(cur.trim()) ? Number(cur.trim()) : cur.trim())); cur=''; quoted=false; };
  for(let i=0;i<argStr.length;i++){
    const c=argStr[i];
    if(inQuote){
      if(c==='\\' && argStr[i+1]===inQuote){ cur+=inQuote; i++; }
      else if(c===inQuote){ inQuote=null; }
      else cur+=c;
    }else if(c==="'"||c==='"'){ inQuote=c; quoted=true; }
    else if(c===','){ push(); }
    else cur+=c;
  }
  push();
  return out;
}
function _dispatch(expr){
  const m = /^([a-zA-Z_$][\w$]*)\((.*)\)$/.exec(expr.trim());
  if(!m){ console.error('Could not parse action:', expr); return; }
  const fn = window[m[1]];
  if(typeof fn !== 'function'){ console.error('No such function:', m[1]); return; }
  try{ fn.apply(null, _parseArgs(m[2])); }
  catch(e){ console.error('Error running', m[1], e); }
}
window._dispatch = _dispatch;
document.addEventListener('click', function(e){
  const t = e.target.closest('[data-act]');
  if(t){
    _dispatch(t.getAttribute('data-act'));
    if(window.aiPathCaptureActiveTrackPosition) setTimeout(function(){ window.aiPathCaptureActiveTrackPosition(); },0);
  }
});
document.addEventListener('change', function(e){
  const t = e.target.closest('[data-change]');
  if(t) _dispatch(t.getAttribute('data-change'));
});
document.addEventListener('input', function(e){
  const t = e.target.closest('[data-input]');
  if(t) _dispatch(t.getAttribute('data-input'));
});
document.addEventListener('keydown', function(e){
  if(e.key !== 'Enter' && e.key !== ' ') return;
  const t = e.target.closest('[data-act][role="button"]');
  if(t){ e.preventDefault(); _dispatch(t.getAttribute('data-act')); }
});
document.addEventListener('keydown', function(e){
  if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){
    e.preventDefault();
    if(window.gsOpen) window.gsOpen();
  }
});
/* Plain in-page anchor links (fragment-only hrefs pointing at a lesson id)
   instead of left to native browser navigation. In some sandboxed preview
   contexts (notably iOS Safari when a page is loaded via srcdoc), the browser
   resolves a fragment-only href against a full external URL and prompts the
   user with a native "Open Link?" dialog instead of just scrolling -- even
   though nothing is actually navigating anywhere. Intercepting the click and
   scrolling manually sidesteps that resolution entirely. */
document.addEventListener('click', function(e){
  const link = e.target.closest('a[href^="#"]');
  if(!link) return;
  const id = link.getAttribute('href').slice(1);
  if(!id) return;
  const target = document.getElementById(id);
  if(!target) return;
  e.preventDefault();
  target.scrollIntoView({behavior:'smooth', block:'start'});
  try{ history.replaceState(null,'', '#'+id); }catch(err){ /* sandboxed preview -- scrolling still works */ }
});
