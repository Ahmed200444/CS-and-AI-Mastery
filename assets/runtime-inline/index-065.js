
/* ============ theme ============ */
/* ============ Global platform-wide theme toggle. Per explicit decision:
   synchronized with the legacy .py-app-only toggle (not left independent) --
   there is exactly one source of truth (g_theme in localStorage), and both
   the floating global button and the Python track's own sidebar button
   drive the SAME state, so they can never show a contradictory theme on
   the same screen. Sets data-theme on <body> (driving .web-app/.cx-app via
   CSS already added) AND on .py-app (driving its own pre-existing
   light/dark CSS), in one call. ============ */
window.toggleGlobalTheme = function(){
  var isLight = document.body.getAttribute('data-theme') === 'light';
  var next = isLight ? 'dark' : 'light';
  document.body.setAttribute('data-theme', next);
  var pyApp = document.querySelector('.py-app');
  if(pyApp) pyApp.setAttribute('data-theme', next);
  try{ localStorage.setItem('g_theme', next); }catch(e){}
  var btn = document.getElementById('g-theme-toggle');
  if(btn) btn.innerHTML = next === 'light' ? '\u2600\ufe0f Light' : '\ud83c\udf19 Dark';
  var icon = document.getElementById('themeicon'), txt = document.getElementById('themetxt');
  if(icon) icon.textContent = next === 'light' ? '\ud83c\udf19' : '\u2600\ufe0f';
  if(txt) txt.textContent = next === 'light' ? 'Dark mode' : 'Light mode';
};
// Legacy function name kept as a thin alias (in case anything else still
// calls it by name) -- both now drive the exact same synchronized state.
function toggleTheme(){ window.toggleGlobalTheme(); }
(function(){
  // Single source of truth for the STARTING theme: prefer the new g_theme
  // key; fall back to the older pp_theme key only if g_theme was never set,
  // so anyone who'd already chosen a preference under the old Python-only
  // system keeps that choice as their platform-wide default.
  var saved = null;
  try{ saved = localStorage.getItem('g_theme'); }catch(e){}
  if(saved === null){
    try{ saved = localStorage.getItem('pp_theme') === 'dark' ? 'dark' : null; }catch(e){}
  }
  if(saved === 'light'){ document.body.setAttribute('data-theme', 'light'); }
  var btn = document.createElement('button');
  btn.id = 'g-theme-toggle';
  btn.setAttribute('aria-label', 'Toggle light and dark mode');
  btn.setAttribute('data-act', 'toggleGlobalTheme()');
  btn.innerHTML = saved === 'light' ? '\u2600\ufe0f Light' : '\ud83c\udf19 Dark';
  document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(btn); });
  if(document.readyState === 'complete' || document.readyState === 'interactive'){ document.body.appendChild(btn); }
  // Apply the SAME resolved starting theme to .py-app once it exists (it's
  // rendered later in the document than this script runs).
  document.addEventListener('DOMContentLoaded', function(){
    var pyApp = document.querySelector('.py-app');
    if(pyApp && saved !== 'light'){ pyApp.setAttribute('data-theme', 'dark'); }
    var icon = document.getElementById('themeicon'), txt = document.getElementById('themetxt');
    if(icon) icon.textContent = saved === 'light' ? '\ud83c\udf19' : '\u2600\ufe0f';
    if(txt) txt.textContent = saved === 'light' ? 'Dark mode' : 'Light mode';
  });
})();

/* ============ Pyodide loader (lazy, shared) ============ */
let _py=null, _pyLoading=null;
window.dmPyodideStatus = function(){ return _py ? 'loaded' : (_pyLoading ? 'loading' : 'not loaded yet'); };
function setStatus(id,msg){const e=document.getElementById(id);if(e)e.innerHTML=msg;}
async function getPy(statusId){
  if(_py) return _py;
  if(!_pyLoading){
    _pyLoading=(async()=>{
      if(statusId)setStatus(statusId,'<span class="spinner"></span>Loading Python (one-time, ~10s)…');
      const pill=document.getElementById('pypill');if(pill)pill.textContent='Loading Python…';
      const s=document.createElement('script');
      s.src='/runtime/pyodide/pyodide.js';
      await new Promise((res,rej)=>{s.onload=res;s.onerror=()=>rej(new Error('load'));document.head.appendChild(s);});
      const py=await loadPyodide({indexURL:'/runtime/pyodide/'});
      _py=py;
      if(pill)pill.textContent='✓ Python ready — runs entirely in your browser';
      return py;
    })();
  }
  try{ return await _pyLoading; }
  catch(e){ if(statusId)setStatus(statusId,'⚠ Could not load Python (needs internet the first time). On Netlify it works.'); throw e; }
}

/* ============ run code, capture stdout ============ */
const RUN_HARNESS=`
import sys, io, traceback
_out = io.StringIO(); _old = sys.stdout; sys.stdout = _out; _err = None
# Infinite-loop guard (ported from the step visualizer's settrace pattern):
# counts line events in the learner's own code only ('<code>' frames), so
# library internals aren't traced and normal exercises are unaffected.
_steps = [0]; _LIMIT = 5000000
def _guard(frame, event, arg):
    if frame.f_code.co_filename != '<code>':
        return None
    if event == 'line':
        _steps[0] += 1
        if _steps[0] > _LIMIT:
            raise RuntimeError('Stopped after %d steps - this looks like an infinite loop. Check your loop condition.' % _LIMIT)
    return _guard
try:
    sys.settrace(_guard)
    exec(compile(_SRC, '<code>', 'exec'), {'__name__':'__main__'})
except Exception:
    _err = traceback.format_exc()
finally:
    sys.settrace(None)
    sys.stdout = _old
_RESULT = _out.getvalue() if _err is None else _out.getvalue() + '\\n' + _err
_ISERR = _err is not None
`;
async function runEditor(inId,outId,statusId){
  const box=document.getElementById(outId);
  const code=document.getElementById(inId).value;
  box.className='out show'; box.textContent='Running…';
  let py;
  try{
    py=await getPy(statusId||(inId+'status'));
  }catch(e){ box.className='out show'; box.innerHTML='<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }
  try{
    // Lazy per-exercise package loading (numpy, pandas, ...): a no-op when the
    // code has no importable packages or they're already loaded, so repeat runs
    // don't refetch anything. Never preloads globally.
    box.textContent='Loading required Python packages…';
    await py.loadPackagesFromImports(code);
  }catch(e){
    // Package fetch failed (offline, or a package Pyodide doesn't ship):
    // fall through and run anyway — the resulting ImportError/ModuleNotFoundError
    // traceback below is the readable explanation of what's missing.
  }
  box.textContent='Running…';
  try{
    py.globals.set('_SRC', code);
    py.runPython(RUN_HARNESS);
    const out=py.globals.get('_RESULT'); const iserr=py.globals.get('_ISERR');
    box.className='out show';
    if(iserr){ box.innerHTML='<span class="err">'+escapeHtml(out)+'</span>'; }
    else { box.textContent = out===''? '(no output — add a print())' : out; }
  }catch(e){ box.className='out show'; box.innerHTML='<span class="err">'+escapeHtml('Run failed: '+String(e))+'</span>'; }
}
function escapeHtml(s){return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}

/* ============ Shared track design-system helpers (Python/SQL visual
   standard, generalized). Any track's existing render function can call
   these instead of building this markup inline -- true component reuse,
   not per-track duplication. Purely presentational: none of these change
   event wiring, they only produce HTML around the same functional classes
   (.wd-edit, .wd-out, .wd-btn) every track already uses. ============ */
window.trackNumBadge = function(n){
  return '<span class="lesson-numbadge">'+String(n).padStart(2,'0')+'</span>';
};
window.trackMentalModel = function(html){
  return '<div class="why"><span class="t">The mental model</span>'+html+'</div>';
};
window.trackDiffBadge = function(level){
  var labels = {1:'Beginner', 2:'Intermediate', 3:'Advanced'};
  var lvl = level >= 3 ? 3 : (level === 2 ? 2 : 1);
  return '<span class="diff-badge diff-'+lvl+'">'+(labels[lvl])+'</span>';
};
window.trackNote = function(html){
  return '<div class="note">'+html+'</div>';
};
// Wraps an existing editor textarea's OUTER html (already containing the
// real .wd-edit element with its real id/data-act wiring) with the
// mac-dot header shell. filename is purely decorative (e.g. "linux.sh").
window.trackEditorShell = function(filename, editorHtml){
  return '<div class="editor-shell"><div class="editor-bar"><span class="dots"><i></i><i></i><i></i></span>'
    + '<span class="name">'+escapeHtml(filename)+'</span></div>'+editorHtml+'</div>';
};
window.trackCrumb = function(trackLabel, stepLabel){
  return '<div class="track-crumb">'+escapeHtml(trackLabel)+'<span class="sep">/</span>'+escapeHtml(stepLabel)+'</div>';
};
window.trackProgressBar = function(done, total){
  var pct = total > 0 ? Math.round((done/total)*100) : 0;
  return '<div class="track-progress-row"><div class="track-progress-bar"><div class="track-progress-fill" style="width:'+pct+'%"></div></div>'
    + '<div class="track-progress-label">'+done+' / '+total+'</div></div>';
};

/* ============ step visualizer ============ */
const TRACE_HARNESS=`
import sys, io, json, traceback
_T=[]; _stack=[]; _steps=[0]; _MAX=500
def _fmt(v):
    try: r=repr(v)
    except Exception: r='<unshowable>'
    return r if len(r)<=90 else r[:87]+'...'
def _tr(frame,event,arg):
    if frame.f_code.co_filename!='<vis>': return _tr
    if event=='call':
        _stack.append(frame.f_code.co_name)
    elif event=='line':
        _steps[0]+=1
        if _steps[0]>_MAX: raise RuntimeError('Too many steps to visualize (over %d). Try smaller inputs.'%_MAX)
        loc={k:_fmt(v) for k,v in frame.f_locals.items() if not k.startswith('__')}
        _T.append({'line':frame.f_lineno,'locals':loc,'stack':list(_stack)})
    elif event=='return':
        if _stack: _stack.pop()
    return _tr
_buf=io.StringIO(); _old=sys.stdout; sys.stdout=_buf; _err=None
try:
    _code=compile(_SRC,'<vis>','exec')
    sys.settrace(_tr)
    exec(_code,{'__name__':'__main__'})
except Exception:
    _err=traceback.format_exc()
finally:
    sys.settrace(None); sys.stdout=_old
_RESULT=json.dumps({'trace':_T,'out':_buf.getvalue(),'err':_err})
`;
const _visState={};
async function visualize(inId,visId){
  const host=document.getElementById(visId);
  const code=document.getElementById(inId).value;
  host.className='vis show';
  host.innerHTML='<div style="padding:14px;color:var(--sub);font-size:.85rem"><span class="spinner"></span>Tracing…</div>';
  let data;
  try{
    const py=await getPy(inId+'status');
    py.globals.set('_SRC', code);
    py.runPython(TRACE_HARNESS);
    data=JSON.parse(py.globals.get('_RESULT'));
  }catch(e){ host.innerHTML='<div style="padding:14px;color:var(--bad)">Could not run the tracer. Python needs internet the first time; on Netlify it works.</div>'; return; }
  if(data.err && (!data.trace || !data.trace.length)){
    host.innerHTML='<div style="padding:14px;color:var(--bad);font-family:ui-monospace,monospace;font-size:.82rem;white-space:pre-wrap">'+escapeHtml(data.err)+'</div>'; return;
  }
  _visState[visId]={trace:data.trace, out:data.out, err:data.err, i:0, lines:code.split('\n'), inId};
  renderVis(visId);
}
function renderVis(visId){
  const st=_visState[visId]; const step=st.trace[st.i]; const prev=st.i>0?st.trace[st.i-1]:null;
  const codeHtml=st.lines.map((ln,idx)=>{
    const n=idx+1; const active=step && step.line===n;
    return '<span class="ln'+(active?' active':'')+'"><span class="num">'+n+'</span>'+escapeHtml(ln||' ')+'</span>';
  }).join('');
  const locals=step? step.locals:{};
  const prevLoc=prev? prev.locals:{};
  let rows=Object.keys(locals).map(k=>{
    const changed = prevLoc[k]!==locals[k];
    return '<tr class="'+(changed?'changed':'')+'"><td class="k">'+escapeHtml(k)+'</td><td class="v">'+escapeHtml(locals[k])+'</td></tr>';
  }).join('');
  if(!rows) rows='<tr><td colspan="2" style="color:var(--sub)">no variables yet</td></tr>';
  const stack=(step&&step.stack&&step.stack.length)? step.stack.filter(f=>f!=='<module>'):[];
  const chips=stack.map((f,idx)=>'<span class="chip'+(idx===stack.length-1?' top':'')+'">'+escapeHtml(f)+'()</span>').join('');
  const atEnd=st.i>=st.trace.length-1;
  document.getElementById(visId).innerHTML=
    '<div class="vis-top">'
     +'<button class="b b-ghost" data-act="visStep(\''+visId+'\',-1)">◀ Prev</button>'
     +'<button class="b b-ghost" data-act="visStep(\''+visId+'\',1)">Next ▶</button>'
     +'<span class="stepn">step '+(st.i+1)+' / '+st.trace.length+'</span>'
     +'<button class="b b-ghost" data-act="visStep(\''+visId+'\',0)" style="margin-left:auto">⟲ Restart</button>'
    +'</div>'
    +'<div class="vis-body"><div class="vis-code">'+codeHtml+'</div>'
     +'<div class="vis-state"><h5>Variables</h5><table class="vtable">'+rows+'</table>'
       +(chips?'<h5 style="margin-top:12px">Call stack</h5><div class="stack-chips">'+chips+'</div>':'')
       +(atEnd&&st.out?'<h5 style="margin-top:12px">Output</h5><div style="font-family:ui-monospace,monospace;font-size:.8rem;white-space:pre-wrap;color:var(--ink)">'+escapeHtml(st.out)+'</div>':'')
     +'</div></div>';
}
function visStep(visId,d){
  const st=_visState[visId]; if(!st)return;
  if(d===0) st.i=0; else st.i=Math.max(0,Math.min(st.trace.length-1, st.i+d));
  renderVis(visId);
}
document.addEventListener('keydown',e=>{
  const ids=Object.keys(_visState); if(!ids.length)return;
  const active=ids[ids.length-1];
  if(e.key==='ArrowRight'){visStep(active,1);} else if(e.key==='ArrowLeft'){visStep(active,-1);}
});

/* ============ editor niceties: tab + auto-indent ============ */
document.addEventListener('keydown',function(e){
  const t=e.target;
  if(t.tagName!=='TEXTAREA'||!t.classList.contains('py'))return;
  if(e.key==='Tab'){
    e.preventDefault();
    const s=t.selectionStart,en=t.selectionEnd;
    t.value=t.value.slice(0,s)+'    '+t.value.slice(en);
    t.selectionStart=t.selectionEnd=s+4;
  } else if(e.key==='Enter'){
    const s=t.selectionStart, line=t.value.slice(0,s).split('\n').pop();
    const indent=(line.match(/^\s*/)||[''])[0];
    const extra=/[:]\s*$/.test(line)?'    ':'';
    e.preventDefault();
    const ins='\n'+indent+extra;
    t.value=t.value.slice(0,s)+ins+t.value.slice(t.selectionEnd);
    t.selectionStart=t.selectionEnd=s+ins.length;
  }
});

/* ============ list viz ============ */
let _list=[3,1,4];
function renderList(){
  document.getElementById('listBoxes').innerHTML=_list.map((v,i)=>
    '<div class="cell pop"><span class="idx">'+i+'</span>'+escapeHtml(String(v))+'</div>').join('')||'<span style="color:var(--sub)">empty list []</span>';
  document.getElementById('listRepr').textContent='nums = ['+_list.map(v=>JSON.stringify(v)).join(', ')+']';
}
function listAppend(){let v=document.getElementById('listInput').value.trim();if(v==='')return;let n=Number(v);_list.push(isNaN(n)?v:n);renderList();}
function listPop(){_list.pop();renderList();}
function listReset(){_list=[3,1,4];renderList();}
renderList();

/* ============ dict viz ============ */
let _dict={apple:3,pear:1};
function renderDict(){
  const keys=Object.keys(_dict);
  document.getElementById('dictView').innerHTML=keys.length?keys.map(k=>
    '<div class="kv"><span class="key">'+escapeHtml(k)+'</span><span class="arrow">→</span><span class="val">'+escapeHtml(String(_dict[k]))+'</span></div>').join(''):'<span style="color:var(--sub)">empty dict {}</span>';
  document.getElementById('dictRepr').textContent='d = {'+keys.map(k=>JSON.stringify(k)+': '+JSON.stringify(_dict[k])).join(', ')+'}';
}
function dictSet(){const k=document.getElementById('dkey').value.trim();let v=document.getElementById('dval').value.trim();if(k==='')return;let n=Number(v);_dict[k]=(v!==''&&!isNaN(n))?n:v;renderDict();}
function dictReset(){_dict={apple:3,pear:1};renderDict();}
renderDict();

/* ============ reference/memory viz ============ */
function memMode(mode){
  const svg=document.getElementById('memSvg');
  const shared = mode==='assign';
  const objY=shared?80:50;
  let s='';
  // name a
  s+='<rect x="20" y="40" width="70" height="34" rx="7" fill="var(--accent-soft)" stroke="var(--accent)"/>';
  s+='<text x="55" y="62" text-anchor="middle" font-family="ui-monospace" font-size="15" fill="var(--accent-ink)">a</text>';
  // name b
  s+='<rect x="20" y="100" width="70" height="34" rx="7" fill="var(--amber-soft)" stroke="var(--amber)"/>';
  s+='<text x="55" y="122" text-anchor="middle" font-family="ui-monospace" font-size="15" fill="var(--amber)">b</text>';
  if(shared){
    // one object
    s+='<rect x="270" y="62" width="150" height="40" rx="8" fill="var(--panel)" stroke="var(--ink)"/>';
    s+='<text x="345" y="87" text-anchor="middle" font-family="ui-monospace" font-size="14" fill="var(--ink)">[1, 2, 3, 4]</text>';
    s+='<line x1="90" y1="57" x2="270" y2="80" stroke="var(--accent)" stroke-width="2" marker-end="url(#ar)"/>';
    s+='<line x1="90" y1="117" x2="270" y2="86" stroke="var(--amber)" stroke-width="2" marker-end="url(#ar)"/>';
  }else{
    // two objects
    s+='<rect x="270" y="30" width="150" height="38" rx="8" fill="var(--panel)" stroke="var(--ink)"/>';
    s+='<text x="345" y="54" text-anchor="middle" font-family="ui-monospace" font-size="14" fill="var(--ink)">[1, 2, 3]</text>';
    s+='<rect x="270" y="104" width="150" height="38" rx="8" fill="var(--panel)" stroke="var(--ink)"/>';
    s+='<text x="345" y="128" text-anchor="middle" font-family="ui-monospace" font-size="14" fill="var(--ink)">[1, 2, 3, 99]</text>';
    s+='<line x1="90" y1="57" x2="270" y2="49" stroke="var(--accent)" stroke-width="2" marker-end="url(#ar)"/>';
    s+='<line x1="90" y1="117" x2="270" y2="123" stroke="var(--amber)" stroke-width="2" marker-end="url(#ar)"/>';
  }
  s+='<defs><marker id="ar" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 z" fill="var(--sub)"/></marker></defs>';
  svg.innerHTML=s;
  document.getElementById('memCaption').textContent = shared
    ? 'b = a  →  one object, two names. b.append(4) changes what a sees too.'
    : 'b = a.copy()  →  two separate objects. Changing one leaves the other alone.';
}
memMode('assign');

/* ============ exercise engine ============ */
const EXALL=JSON.parse(document.getElementById('exdata').textContent);
const CHECK_HARNESS=`
import io, sys, json, ast, traceback
_spec=json.loads(_SPEC)
_res={'passed':False}
_ns={}
_buf=io.StringIO(); _old=sys.stdout; sys.stdout=_buf
try:
    exec(compile(_SRC,'<code>','exec'), _ns); _e=None
except Exception:
    _e=traceback.format_exc()
finally:
    sys.stdout=_old
if _e:
    _res.update(passed=False, error=_e, stage='compile')
else:
    _INJ={'__inc__':(lambda x:x+1),'__double__':(lambda x:x*2)}
    m=_spec['mode']
    try:
        if m=='stdout':
            got=_buf.getvalue().rstrip('\\n'); exp=_spec['expected'].rstrip('\\n')
            _res.update(passed=(got==exp), got=got, expected=exp, stage='stdout')
        elif _spec.get('fname')=='__counter__':
            cls=_ns.get('Counter')
            if cls is None: raise NameError('Define a class named Counter')
            tests=ast.literal_eval(_TESTS_PY)
            ok=True; detail=None
            for args,exp in tests:
                c=cls()
                for _ in range(args[0]): c.tick()
                g=c.value()
                if g!=exp: ok=False; detail={'args':args,'got':repr(g),'expected':repr(exp)}; break
            _res.update(passed=ok, detail=detail, stage='func')
        elif _spec.get('fname')=='__collect_gen__':
            fn=_ns.get('even_gen')
            if fn is None: raise NameError('Define a generator function named even_gen')
            tests=ast.literal_eval(_TESTS_PY)
            ok=True; detail=None
            for args,exp in tests:
                g=list(fn(args[0]))
                if g!=exp: ok=False; detail={'args':args,'got':repr(g),'expected':repr(exp)}; break
            _res.update(passed=ok, detail=detail, stage='func')
        elif _spec.get('fname')=='__repeat_counter__':
            tests=ast.literal_eval(_TESTS_PY)
            ok=True; detail=None
            for args,exp in tests:
                bump=_ns.get('bump'); counter=_ns.get('counter')
                if bump is None or counter is None: raise NameError('Define repeat, counter, and the decorated bump function')
                bump()
                g=counter['calls']
                if g!=exp: ok=False; detail={'args':args,'got':repr(g),'expected':repr(exp)}; break
            _res.update(passed=ok, detail=detail, stage='func')
        elif _spec.get('fname')=='__stack_ops__':
            cls=_ns.get('Stack')
            if cls is None: raise NameError('Define a class named Stack')
            tests=ast.literal_eval(_TESTS_PY)
            ok=True; detail=None
            for args,exp in tests:
                s=cls()
                for v in args[0]: s.push(v)
                g=s.pop()
                if g!=exp: ok=False; detail={'args':args,'got':repr(g),'expected':repr(exp)}; break
            _res.update(passed=ok, detail=detail, stage='func')
        elif _spec.get('fname')=='__call_counter__':
            ping=_ns.get('ping')
            if ping is None: raise NameError('Define a decorated function named ping')
            tests=ast.literal_eval(_TESTS_PY)
            ok=True; detail=None
            for args,exp in tests:
                for _i in range(args[0]): ping()
                g=ping.calls
                if g!=exp: ok=False; detail={'args':args,'got':repr(g),'expected':repr(exp)}; break
            _res.update(passed=ok, detail=detail, stage='func')
        elif _spec.get('fname')=='__queue_ops__':
            cls=_ns.get('Queue')
            if cls is None: raise NameError('Define a class named Queue')
            tests=ast.literal_eval(_TESTS_PY)
            ok=True; detail=None
            for args,exp in tests:
                q=cls()
                for v in args[0]: q.enqueue(v)
                g=q.dequeue()
                if g!=exp: ok=False; detail={'args':args,'got':repr(g),'expected':repr(exp)}; break
            _res.update(passed=ok, detail=detail, stage='func')
        elif _spec.get('fname')=='__oop_total_area__':
            make=_ns.get('make_shape'); tot=_ns.get('total_area')
            if make is None or tot is None: raise NameError('Define make_shape and total_area')
            tests=ast.literal_eval(_TESTS_PY)
            ok=True; detail=None
            for args,exp in tests:
                shapes=[make(k,s) for k,s in args[0]]
                g=tot(shapes)
                if abs(g-exp)>1e-4: ok=False; detail={'args':args,'got':repr(g),'expected':repr(exp)}; break
            _res.update(passed=ok, detail=detail, stage='func')
        elif _spec.get('fname')=='__oop_money__':
            comb=_ns.get('combine'); same=_ns.get('same_money')
            if comb is None or same is None: raise NameError('Define combine and same_money')
            tests=ast.literal_eval(_TESTS_PY)
            ok=True; detail=None
            for args,exp in tests:
                (a,b),(x,y)=args
                g=[comb(a,b), same(x,y)]
                if g!=exp: ok=False; detail={'args':args,'got':repr(g),'expected':repr(exp)}; break
            _res.update(passed=ok, detail=detail, stage='func')
        elif _spec.get('kwargs'):
            fn=_ns.get(_spec['fname'])
            if fn is None: raise NameError('Define a function named '+_spec['fname'])
            tests=ast.literal_eval(_TESTS_PY)
            ok=True; detail=None
            for args,exp in tests:
                g=fn(**args)
                if g!=exp: ok=False; detail={'args':args,'got':repr(g),'expected':repr(exp)}; break
            _res.update(passed=ok, detail=detail, stage='func')
        else:
            fn=_ns.get(_spec['fname'])
            if fn is None: raise NameError('Define a function named '+_spec['fname'])
            tests=ast.literal_eval(_TESTS_PY)
            ok=True; detail=None
            for args,exp in tests:
                ra=[_INJ[a] if isinstance(a,str) and a in _INJ else a for a in args]
                g=fn(*ra)
                if g!=exp: ok=False; detail={'args':args,'got':repr(g),'expected':repr(exp)}; break
            _res.update(passed=ok, detail=detail, stage='func')
    except Exception:
        _res.update(passed=False, error=traceback.format_exc(), stage='run')
_RESULT=json.dumps(_res)
`;
let _solved={};
try{_solved=JSON.parse(localStorage.getItem('pp_solved')||'{}');}catch(e){}
function saveSolved(){try{localStorage.setItem('pp_solved',JSON.stringify(_solved));}catch(e){}updateProgress();pyRenderCheckpoints();pyRenderAllConceptReviews();}
function updateProgress(){
  const total=EXALL.length, done=Object.keys(_solved).filter(k=>_solved[k]).length;
  document.getElementById('progn').textContent=done+' / '+total;
  document.getElementById('progbar').style.width=(total?done/total*100:0)+'%';
}
let _pyHintLevel={};
function exWidget(ex){
  const lvl=ex.level===1?'🟢':ex.level===2?'🟡':'🔴';
  const solvedMark=_solved[ex.id]?' <span style="color:var(--ok)">✓ solved</span>':'';
  const hints = ex.hints || (ex.hint ? [ex.hint] : []);
  const nHints = hints.length;
  if(ex.type==='reasoning'){
    return '<div class="card" id="ex_'+ex.id+'">'
      +'<div style="font-size:.72rem;color:var(--sub);margin-bottom:2px">'+lvl+' '+escapeHtml(ex.section)+solvedMark+'</div>'
      +'<div style="font-weight:700;margin-bottom:3px">'+escapeHtml(ex.title)+'</div>'
      +'<div style="font-size:.9rem;color:var(--sub);margin-bottom:9px;white-space:pre-line">'+escapeHtml(ex.prompt)+'</div>'
      +'<textarea class="py" id="edit_'+ex.id+'" aria-label="Write your reasoning" spellcheck="false" placeholder="Write your reasoning here, then reveal to compare…" style="min-height:90px"></textarea>'
      +'<div class="runbar">'
        +'<button class="b b-check" data-act="checkReasoningEx(\''+ex.id+'\')" aria-label="Reveal the explanation and mark this understood">✓ Reveal &amp; mark understood</button>'
        +'<button class="b b-ghost" data-act="pyNextHint(\''+ex.id+'\')" id="hintbtn_'+ex.id+'" aria-label="Show the next hint">💡 Hint (0/'+nHints+')</button>'
      +'</div>'
      +'<div class="verdict" id="verd_'+ex.id+'" aria-live="polite"></div>'
      +'<div class="hintbox" id="hint_'+ex.id+'"></div>'
      +'</div>';
  }
  return '<div class="card" id="ex_'+ex.id+'">'
    +'<div style="font-size:.72rem;color:var(--sub);margin-bottom:2px">'+lvl+' '+escapeHtml(ex.section)+solvedMark+'</div>'
    +'<div style="font-weight:700;margin-bottom:3px">'+escapeHtml(ex.title)+'</div>'
    +'<div style="font-size:.9rem;color:var(--sub);margin-bottom:9px;white-space:pre-line">'+escapeHtml(ex.prompt)+'</div>'
    +'<div class="editor-shell"><div class="editor-bar"><span class="dots"><i></i><i></i><i></i></span><span class="name">'+escapeHtml(ex.id)+'.py</span></div>'
    +'<textarea class="py" id="edit_'+ex.id+'" aria-label="Code editor" spellcheck="false">'+escapeHtml(ex.starter)+'</textarea></div>'
    +'<div class="runbar">'
      +'<button class="b b-check" id="checkbtn_'+ex.id+'" data-act="checkEx(\''+ex.id+'\')" aria-label="Check your solution against the hidden tests">✓ Check</button>'
      +'<button class="b b-run" data-act="runEditor(\'edit_'+ex.id+'\',\'exout_'+ex.id+'\')" aria-label="Run your code and show its output">▶ Run</button>'
      +'<button class="b b-ghost" data-act="pyNextHint(\''+ex.id+'\')" id="hintbtn_'+ex.id+'" aria-label="Show the next hint">💡 Hint (0/'+nHints+')</button>'
      +'<button class="b b-ghost" data-act="revealSol(\''+ex.id+'\')" aria-label="Reveal the model solution">Reveal</button>'
      +'<button class="cr-review-btn" id="crbtn_crout_'+ex.id+'" data-act="cxReviewPython(\'edit_'+ex.id+'\',\'crout_'+ex.id+'\')" aria-label="Get a structured code review">🔍 Review my code</button>'
    +'</div>'
    +'<div class="verdict" id="verd_'+ex.id+'" aria-live="polite"></div>'
    +'<div class="out" aria-live="polite" id="exout_'+ex.id+'"></div>'
    +'<div id="crout_'+ex.id+'" aria-live="polite"></div>'
    +'<div class="hintbox" id="hint_'+ex.id+'"></div>'
    +'<div class="solbox" id="sol_'+ex.id+'"><div class="editor-shell"><div class="editor-bar"><span class="dots"><i></i><i></i><i></i></span><span class="name">solution</span></div><textarea class="py" readonly>'+escapeHtml(ex.solution)+'</textarea></div></div>'
    +'</div>';
}
function checkReasoningEx(id){
  const ex = EXALL.find(e=>e.id===id);
  const verd = document.getElementById('verd_'+id);
  if(!_solved[id]){
    _solved[id]=true;
    saveSolved();
  }
  verd.innerHTML = '<span style="color:var(--ok)">✓ Marked understood.</span><div style="margin-top:8px;font-size:.87rem"><b>Reasoning:</b> '+escapeHtml(ex.solution)+'</div>';
}
function pyNextHint(id){
  const ex = EXALL.find(e=>e.id===id);
  const hints = ex.hints || (ex.hint ? [ex.hint] : []);
  const cur = _pyHintLevel[id]||0;
  if(cur>=hints.length) return;
  const next = cur+1;
  _pyHintLevel[id]=next;
  const box = document.getElementById('hint_'+id);
  box.classList.add('show');
  box.innerHTML = hints.slice(0,next).map((h,i)=>'<div style="margin-bottom:6px"><b>Hint '+(i+1)+':</b> '+escapeHtml(h)+'</div>').join('');
  const btn = document.getElementById('hintbtn_'+id);
  if(btn) btn.textContent = '💡 Hint ('+next+'/'+hints.length+')'+(next>=hints.length?' — all shown':'');
}
function revealSol(id){document.getElementById('sol_'+id).classList.add('show');}

/* ============ Concept-level mastery tracking + spaced repetition ============
   Separate from per-lesson checkpoints: a concept (e.g. "loops") can appear
   across MANY lessons. This tracks practice history per concept (not per
   lesson) and resurfaces a fresh practice problem in LATER lessons if a
   concept hasn't been touched in a while or accuracy on it has been shaky. */
let _pyAttempts={};
try{_pyAttempts=JSON.parse(localStorage.getItem('pp_attempts')||'{}');}catch(e){}
function pyLogAttempt(exId, passed){
  const list = _pyAttempts[exId] = _pyAttempts[exId] || [];
  list.push({date: new Date().toISOString(), passed});
  if(list.length>20) list.shift();
  try{ localStorage.setItem('pp_attempts', JSON.stringify(_pyAttempts)); }catch(e){}
  if(passed && window.cxLogActivity) window.cxLogActivity('exercises', 1);
}
function pyConceptStats(){
  const stats={};
  EXALL.forEach(ex=>{
    (ex.concepts||[]).forEach(c=>{
      const s = stats[c] = stats[c] || {total:0, solved:0, lastAttempt:null, recentWrong:0};
      s.total++;
      if(_solved[ex.id]) s.solved++;
      const attempts = _pyAttempts[ex.id]||[];
      attempts.forEach(a=>{ if(!s.lastAttempt || a.date>s.lastAttempt) s.lastAttempt=a.date; });
      const lastTwo = attempts.slice(-2);
      if(lastTwo.length===2 && lastTwo.every(a=>!a.passed)) s.recentWrong++;
    });
  });
  return stats;
}
function pyDaysSince(isoDate){
  if(!isoDate) return null;
  return Math.floor((Date.now()-new Date(isoDate).getTime())/(1000*60*60*24));
}
function pyConceptDue(concept){
  const s = pyConceptStats()[concept];
  if(!s || !s.lastAttempt) return null; // never practiced yet -- nothing to "review"
  const days = pyDaysSince(s.lastAttempt);
  if(days>=5) return {reason:'stale', days};
  if(s.recentWrong>0) return {reason:'struggle', days};
  return null;
}
function pyReviewWidget(ex, hostSuffix){
  const uid = 'review_'+hostSuffix+'_'+ex.id;
  const hints = ex.hints || (ex.hint ? [ex.hint] : []);
  return '<div class="card" id="'+uid+'">'
    +'<div style="font-size:.72rem;color:var(--sub);margin-bottom:2px">'+escapeHtml(ex.section)+'</div>'
    +'<div style="font-weight:700;margin-bottom:3px">'+escapeHtml(ex.title)+'</div>'
    +'<div style="font-size:.9rem;color:var(--sub);margin-bottom:9px">'+escapeHtml(ex.prompt)+'</div>'
    +'<div class="editor-shell"><div class="editor-bar"><span class="dots"><i></i><i></i><i></i></span><span class="name">'+escapeHtml(ex.id)+'.py</span></div>'
    +'<textarea class="py" id="edit_'+uid+'" aria-label="Code editor" spellcheck="false">'+escapeHtml(ex.starter)+'</textarea></div>'
    +'<div class="runbar">'
      +'<button class="b b-check" data-act="pyCheckReview(\''+ex.id+'\',\''+uid+'\')">✓ Check</button>'
      +'<button class="b b-run" data-act="runEditor(\'edit_'+uid+'\',\'out_'+uid+'\')">▶ Run</button>'
    +'</div>'
    +'<div class="verdict" id="verd_'+uid+'" aria-live="polite"></div>'
    +'<div class="out" aria-live="polite" id="out_'+uid+'"></div>'
    +'</div>';
}
async function pyCheckReview(exId, uid){
  const ex = EXALL.find(e=>e.id===exId);
  const verd = document.getElementById('verd_'+uid);
  verd.className='verdict show'; verd.innerHTML='<span class="spinner"></span>Checking…';
  const code = document.getElementById('edit_'+uid).value;
  const spec={mode:ex.mode, fname:ex.fname||null, expected:ex.expected||null, kwargs:ex.kwargs||false};
  try{
    const py=await getPy();
    py.globals.set('_SRC', code); py.globals.set('_SPEC', JSON.stringify(spec));
    py.globals.set('_TESTS_PY', ex.tests_py||'[]');
    py.runPython(CHECK_HARNESS);
    const r=JSON.parse(py.globals.get('_RESULT'));
    pyLogAttempt(exId, !!r.passed);
    if(r.passed){
      verd.className='verdict show v-ok'; verd.innerHTML='✓ Correct — concept review complete.';
      _solved[exId]=true; saveSolved();
    }else{
      const d=r.detail||{};
      verd.className='verdict show v-bad';
      verd.innerHTML='Not quite yet.'+(d.got!==undefined?'<div class="diff">you got: '+escapeHtml(String(d.got))+'\nexpected: '+escapeHtml(String(d.expected))+'</div>':'');
    }
  }catch(e){ verd.className='verdict show v-bad'; verd.innerHTML='Python needs internet the first time to load; on Netlify this works.'; }
}
function pyRenderConceptReview(hostLessonId){
  const host = document.getElementById('pyConceptReview_'+hostLessonId);
  if(!host) return;
  const concepts = [...new Set(EXALL.flatMap(e=>e.concepts||[]))];
  let due=null, dueConcept=null;
  for(const c of concepts){
    const d = pyConceptDue(c);
    if(d){ due=d; dueConcept=c; break; }
  }
  if(!due){ host.innerHTML=''; return; }
  const pool = EXALL.filter(e=>(e.concepts||[]).includes(dueConcept));
  const pick = pool[Math.floor(Math.random()*pool.length)];
  const reasonText = due.reason==='stale'
    ? `It's been ${due.days} day${due.days===1?'':'s'} since you practiced <b>${escapeHtml(dueConcept)}</b> — here's a fresh one.`
    : `You've missed a couple of recent <b>${escapeHtml(dueConcept)}</b> problems — one more rep.`;
  host.innerHTML = '<div class="reminder-box"><div class="reminder-item">'+reasonText+'</div></div>'
    + pyReviewWidget(pick, hostLessonId);
}
async function checkEx(id){
  const ex=EXALL.find(e=>e.id===id);
  const btn=document.getElementById('checkbtn_'+id);
  if(btn){ if(btn.disabled) return; btn.disabled=true; }
  const verd=document.getElementById('verd_'+id);
  verd.className='verdict show'; verd.innerHTML='<span class="spinner"></span>Checking…';
  const code=document.getElementById('edit_'+id).value;
  const spec={mode:ex.mode, fname:ex.fname||null, expected:ex.expected||null, kwargs:ex.kwargs||false};
  try{
    const py=await getPy();
    py.globals.set('_SRC', code); py.globals.set('_SPEC', JSON.stringify(spec));
    py.globals.set('_TESTS_PY', ex.tests_py||'[]');
    py.runPython(CHECK_HARNESS);
    const r=JSON.parse(py.globals.get('_RESULT'));
    pyLogAttempt(id, !!r.passed);
    const firstHint = (ex.hints&&ex.hints[0]) || ex.hint || '';
    if(r.passed){
      const why = ex.whyItWorks ? '<div style="margin-top:8px;font-size:.87rem"><b>Why this works:</b> '+escapeHtml(ex.whyItWorks)+'</div>' : '';
      let reviewHtml='';
      if(ex.review){
        const rv=ex.review;
        reviewHtml='<div class="interviewer-review"><div class="ir-title">🧑‍💼 Interviewer review</div>'
          +'<div class="ir-row"><b>Alternative approaches:</b> '+escapeHtml(rv.approaches)+'</div>'
          +'<div class="ir-row"><b>Time / space complexity:</b> '+escapeHtml(rv.complexity)+'</div>'
          +'<div class="ir-row"><b>Edge cases they\'ll probe:</b> '+escapeHtml(rv.edge)+'</div>'
          +'<div class="ir-row"><b>Follow-up you\'d get:</b> '+escapeHtml(rv.followup)+'</div>'
          +'</div>';
      }
      verd.className='verdict show v-ok'; verd.innerHTML='✓ Correct — all tests pass. Nicely done.'+why+reviewHtml;
      _solved[id]=true; saveSolved();
    }else if(r.error){
      verd.className='verdict show v-bad';
      verd.innerHTML='Your code raised an error:<div class="diff">'+escapeHtml(r.error.split('\n').slice(-4).join('\n'))+'</div><div style="margin-top:6px;font-size:.85rem">💡 '+escapeHtml(firstHint)+'</div>';
    }else if(r.stage==='stdout'){
      verd.className='verdict show v-bad';
      verd.innerHTML='Not quite — the output differs.<div class="diff">your output:  '+escapeHtml(r.got||'(nothing)')+'\nexpected:     '+escapeHtml(r.expected)+'</div>';
    }else{
      const d=r.detail||{};
      verd.className='verdict show v-bad';
      verd.innerHTML='Not quite yet.<div class="diff">input:     '+escapeHtml(JSON.stringify(d.args))+'\nyou got:   '+escapeHtml(String(d.got))+'\nexpected:  '+escapeHtml(String(d.expected))+'</div><div style="margin-top:6px;font-size:.85rem">💡 '+escapeHtml(firstHint)+'</div>';
    }
  }catch(e){ verd.className='verdict show v-bad'; verd.innerHTML='Python needs internet the first time to load; on Netlify this works.'; }
  finally{ if(btn) btn.disabled=false; }
}

/* render exercises (non-debug) and debugging (debug). Exercises that used to be
   embedded inline within lessons (inlineIn) are now included here too, since
   the Lessons content is study-only and all practice lives in this section. */
function renderExercises(){
  let main=EXALL.filter(e=>!e.debug && !OOP_EXERCISE_IDS.includes(e.id)), dbg=EXALL.filter(e=>e.debug);
  // Real Assessment Practice first, then everything else. Within each, Easy -> Medium -> Hard.
  const isReal = e => e.section==='Real Assessment Practice';
  main = main.slice().sort((a,b)=>{
    if(isReal(a)!==isReal(b)) return isReal(a)?-1:1;   // real-assessment block first
    if(a.level!==b.level) return a.level-b.level;        // easy -> medium -> hard
    return 0;
  });
  // build HTML with difficulty dividers inside the real-assessment block
  const levelName = {1:'Easy',2:'Medium',3:'Hard'};
  let htmlOut='';
  let prevReal=null, prevLevel=null, realIntroShown=false;
  main.forEach(e=>{
    const realNow=isReal(e);
    if(realNow && !realIntroShown){
      htmlOut+='<div class="ex-band"><div class="ex-band-t">🎯 Realistic Interview Questions</div>'
        +'<div class="ex-band-d">Written in real online-assessment style — a full worded spec, examples, and constraints. Organized Easy → Medium → Hard. After you solve one, an interviewer-style review appears: alternative approaches, complexity, edge cases, and the follow-up an interviewer would ask next.</div></div>';
      realIntroShown=true;
    }
    if(realNow && e.level!==prevLevel){
      htmlOut+='<div class="ex-divider">'+(levelName[e.level]||'More')+'</div>';
      prevLevel=e.level;
    }
    if(!realNow && prevReal){
      htmlOut+='<div class="ex-band" style="margin-top:26px"><div class="ex-band-t">📚 Topic Practice</div>'
        +'<div class="ex-band-d">Shorter, focused drills by concept — strings, loops, dictionaries, recursion, and more. Good for warming up or shoring up a specific weak spot.</div></div>';
    }
    htmlOut+=exWidget(e);
    prevReal=realNow;
  });
  document.getElementById('exContainer').innerHTML=htmlOut;
  document.getElementById('debugContainer').innerHTML=dbg.map(exWidget).join('');
  document.getElementById('excount').textContent=main.length+dbg.length;
  pyRenderCheckpoints();
}

// OOP's own exercises, filtered from the same shared bank Python uses -- these
// used to be embedded inline within OOP's lessons (removed in a prior release
// to keep lessons study-only); this is their real home now.
var OOP_EXERCISE_IDS = ['oop_point','oop_counter_state','oop_shape_area_poly','oop_super_init','oop_composition_car',
  'oop_abstract_shape','reason_encapsulation_violation','reason_composition_or_inheritance','reason_srp_violation',
  'reason_liskov_violation','reason_missing_super_init'];
function renderOopExercises(){
  var container = document.getElementById('oopExContainer');
  if(!container) return;
  var items = OOP_EXERCISE_IDS.map(function(id){ return EXALL.find(function(e){ return e.id===id; }); }).filter(Boolean);
  container.innerHTML = items.map(exWidget).join('');
}
var oopBooted = false;
window._oopBoot = function(){
  if(oopBooted) return;
  oopBooted = true;
  renderOopExercises();
};
function pyRenderCheckpoints(){
  document.querySelectorAll('.py-checkpoint').forEach(box=>{
    const lessonId = box.getAttribute('data-lesson');
    const items = EXALL.filter(e=>e.lessonId===lessonId);
    if(!items.length) return;
    const solved = items.filter(e=>_solved[e.id]).length;
    const need = Math.min(items.length, Math.ceil(items.length*0.7)) || items.length;
    const met = solved>=need;
    box.innerHTML = met
      ? '<div class="checkpoint-met">🏆 Mastery checkpoint reached — '+solved+'/'+items.length+' solved. Move on whenever you\'re ready.</div>'
      : '<div class="checkpoint-pending">Mastery checkpoint: solve '+need+' of '+items.length+' exercises above to mark this lesson mastered — you\'ve got '+solved+'/'+need+'.<div class="checkpoint-bar"><div class="checkpoint-fill" style="width:'+Math.min(100,Math.round(solved/need*100))+'%"></div></div></div>';
  });
}
function pyRenderAllConceptReviews(){
  ['fund-functions','comp','recursion'].forEach(pyRenderConceptReview);
}
renderExercises();
pyRenderAllConceptReviews();

/* ============ projects (reuse the exercise engine with inline specs) ============ */
const PROJECTS=[
 {host:'proj_slug', id:'p_slug', section:'Project', level:2, title:'slugify(title)',
  prompt:'Return the slug: lowercase, spaces to hyphens, keep only a-z, 0-9 and hyphens.',
  starter:'def slugify(title):\n    pass',
  mode:'func', fname:'slugify',
  tests_py:'[[["Hello, World!"],"hello-world"],[["  Python  Rules  "],"python-rules"],[["A.B.C"],"abc"]]',
  solution:'def slugify(title):\n    out=[]\n    for c in title.lower():\n        if c.isalnum(): out.append(c)\n        elif c==" ": out.append("-")\n    s="-".join(w for w in "".join(out).split("-") if w)\n    return s',
  hint:'Lowercase, walk each char: keep letters/digits, turn spaces into hyphens, then collapse repeats and trim.'},
 {host:'proj_tally', id:'p_tally', section:'Project', level:2, title:'tally(votes)',
  prompt:'Given a list of vote strings, return a dict of option -> count.',
  starter:'def tally(votes):\n    pass',
  mode:'func', fname:'tally',
  tests_py:'[[[["a","b","a","c","a"]],{"a":3,"b":1,"c":1}],[[[]],{}],[[["x"]],{"x":1}]]',
  solution:'def tally(votes):\n    d={}\n    for v in votes:\n        d[v]=d.get(v,0)+1\n    return d',
  hint:'The d.get(v, 0) + 1 counting pattern from the dictionaries section.'},
 {host:'proj_csv', id:'p_csv', section:'Project', level:3, title:'average_score(rows)',
  prompt:'Each row is "name,score". Return the average score as a float. Empty list -> 0.',
  starter:'def average_score(rows):\n    pass',
  mode:'func', fname:'average_score',
  tests_py:'[[[["ana,10","ben,20"]],15.0],[[["x,5"]],5.0],[[[]],0]]',
  solution:'def average_score(rows):\n    if not rows: return 0\n    total=0\n    for r in rows:\n        name,score=r.split(",")\n        total+=int(score)\n    return total/len(rows)',
  hint:'Split each row on the comma, int() the second part, sum, divide by len. Guard the empty case.'},
 {host:'proj_todo', id:'p_todo', section:'Project', level:2, title:'toggle_done(tasks, i)',
  prompt:'tasks is a list of dicts like {"text":"buy milk","done":False}. Flip task i\'s done flag and return the list.',
  starter:'def toggle_done(tasks, i):\n    pass',
  mode:'func', fname:'toggle_done',
  tests_py:'[[[[{"text":"a","done":False}],0],[{"text":"a","done":True}]],[[[{"text":"a","done":True},{"text":"b","done":False}],1],[{"text":"a","done":True},{"text":"b","done":True}]]]',
  solution:'def toggle_done(tasks, i):\n    tasks[i]["done"]=not tasks[i]["done"]\n    return tasks',
  hint:'Reach into tasks[i]["done"] and set it to "not" itself, then return tasks.'},
];
PROJECTS.forEach(p=>{ EXALL.push(p); document.getElementById(p.host).innerHTML=exWidget(p); });

updateProgress();
