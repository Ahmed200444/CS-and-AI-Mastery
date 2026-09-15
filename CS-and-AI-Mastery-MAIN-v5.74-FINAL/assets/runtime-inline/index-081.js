
/* ============ Phase practiceMode (v3.2.0 pilot) ============
   Reusable, additive practice-environment architecture layered on top of the
   existing per-exercise renderer. Nothing here is imported by, or required by,
   any pre-existing exercise: exerciseTypeBody() only calls into this module
   when e.runnable/e.starterCode (the legacy path) is ABSENT and a pilot config
   exists for this exact course+exercise-index. Every other exercise on the
   platform -- all 41 courses, all non-pilot exercises -- renders exactly as
   it did in v3.1.1.

   Design constraints honored throughout this file:
   - no duplicate Python or SQL runtime: browser-python widgets call the SAME
     global getPy()/runEditor()/RUN_HARNESS already shipped in v3.1.1.
   - no inline event handlers: every interactive element uses data-act, which
     the existing global _dispatch()/click-listener already wires up (any
     function referenced by data-act must exist on window -- see below).
   - iframe execution stays isolated from the parent: the HTML/CSS/JS
     playground iframe uses sandbox="allow-scripts" with NO allow-same-origin,
     so it runs in a unique opaque origin and can only talk to the parent via
     postMessage (one-way, console output only) -- it cannot reach the parent
     DOM, cookies, or localStorage.
   - saved code is namespaced per course+exercise-index (cxpm:<courseId>:<idx>:<field>),
     entirely separate from the platform's progress/quiz-history keys.
   - Reset restores starter content ONLY for the current exercise, never
     touching sibling exercises or other courses.
   - every simulation is visibly labeled "SIMULATION" in its rendered markup
     and states in its own copy what it is standing in for. No simulation
     calls any external API and none requires a key.
*/

(function(){

  function pmEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  function pmKey(courseId, idx, field){ return 'cxpm:'+courseId+':'+idx+':'+field; }
  function pmSave(courseId, idx, field, value){
    try{ localStorage.setItem(pmKey(courseId,idx,field), value); }catch(e){ /* storage unavailable -- widget still works, just won't persist */ }
  }
  function pmLoad(courseId, idx, field, fallback){
    try{ var v = localStorage.getItem(pmKey(courseId,idx,field)); return v===null ? fallback : v; }
    catch(e){ return fallback; }
  }

  // ---- Pilot configuration table -------------------------------------------------
  // Keyed by course id, then by exercise ARRAY INDEX (stable since curriculum JSON
  // is untouched by this pass). Deliberately a small, named set of pilots across
  // distinct practiceMode families -- NOT a mass conversion of all 41 courses.
  window.PRACTICE_PILOTS = {
    'data-science': { 3: { mode:'browser-python',
      starterCode: "import statistics\n\ndata = [12, 15, 14, 200, 13, 15, 16]\n\n# TODO: print both the mean and the median of `data`,\n# then print one line explaining which better represents\n# a 'typical' value here and why.\n"
    }},
    'ai-ml': { 5: { mode:'browser-python',
      starterCode: "# A binary classifier's confusion matrix on 100 test examples:\ntp, fp, fn, tn = 18, 6, 2, 74\n\n# TODO: compute precision and recall from tp/fp/fn,\n# then print both, rounded to 2 decimal places.\n"
    }},
    'frontend-dev': { 3: { mode:'browser-web',
      html: "<button id=\"toggle\">Toggle done</button>\n<p id=\"status\">Not done</p>",
      css: "body{font-family:sans-serif;padding:12px} #status{font-weight:bold}",
      js: "// TODO: wire the button so clicking it toggles the status text\n// between 'Not done' and 'Done' each time it's clicked.\ndocument.getElementById('toggle').addEventListener('click', function(){\n  console.log('button clicked -- implement the toggle here');\n});"
    }},
    'apis': { 0: { mode:'simulation-http' } },
    'rag': { 1: { mode:'simulation-rag' } },
    'git': { 0: { mode:'simulation-git' } },
    'ai-agents': { 1: { mode:'simulation-agent-loop' } },
    'docker': { 1: { mode:'external-docker' } },
    'deep-learning': { 3: { mode:'external-colab' } }
  };

  // Human-readable "where you'll practice" line per course, shown once in Overview
  // for any course that has at least one pilot exercise. Never invented for the
  // other 32 courses that have no pilot config (overviewHTML() checks for a hit
  // before rendering anything, so it silently no-ops there).
  var PRACTICE_LOCATION_TEXT = {
    'data-science': 'In your browser -- a real Python (NumPy/pandas) sandbox, no install or API key needed.',
    'ai-ml': 'In your browser -- a real Python sandbox for the metric-calculation exercise.',
    'frontend-dev': 'In your browser -- an isolated HTML/CSS/JS playground (sandboxed iframe, no network access).',
    'apis': 'As an in-app simulation of HTTP request/response cycles -- no live server or API key required.',
    'rag': 'As an in-app simulation of keyword-based retrieval ranking -- illustrative, not a real embeddings model.',
    'git': 'As an in-app simulation of core git commands against an in-memory fake repository.',
    'ai-agents': 'As an in-app, scripted simulation of one agent-loop trace -- not a live LLM.',
    'docker': 'Outside this platform, in Docker Desktop + VS Code -- this course provides setup guidance, not a live container.',
    'deep-learning': 'Outside this platform, in Google Colab (free GPU access) -- this course provides a ready-to-paste starter cell.'
  };

  window.cxPracticeLocationHTML = function(c){
    var txt = PRACTICE_LOCATION_TEXT[c.id];
    if(!txt) return '';
    return '<div class="cx-overview-block"><h3>Where you\'ll practice</h3><p>'+pmEsc(txt)+'</p></div>';
  };

  window.cxRenderPracticeMode = function(c, i, e){
    var courseCfg = window.PRACTICE_PILOTS[c.id];
    var cfg = courseCfg && courseCfg[i];
    if(!cfg) return '';
    switch(cfg.mode){
      case 'browser-python': return pmPython(c, i, cfg);
      case 'browser-web': return pmWeb(c, i, cfg);
      case 'simulation-http': return pmSimHttp(c, i, cfg);
      case 'simulation-rag': return pmSimRag(c, i, cfg);
      case 'simulation-git': return pmSimGit(c, i, cfg);
      case 'simulation-agent-loop': return pmSimAgent(c, i, cfg);
      case 'external-docker': return pmExternal(c, i, cfg,
        'Docker Desktop + VS Code (local)',
        'Build and run this exercise\'s container on your own machine. Install Docker Desktop, open this folder in VS Code, then use the snippet below as a starting Dockerfile.',
        "FROM python:3.11-slim\nWORKDIR /app\nCOPY . .\nRUN pip install -r requirements.txt\nCMD [\"python\", \"app.py\"]");
      case 'external-colab': return pmExternal(c, i, cfg,
        'Google Colab (free GPU access)',
        'Open a new notebook at colab.research.google.com, set Runtime > Change runtime type > GPU, then paste the starter cell below to begin.',
        "!pip install torch --quiet\nimport torch\nprint('GPU available:', torch.cuda.is_available())");
      default: return '';
    }
  };

  // ---- browser-python: reuses the existing shared Pyodide runner verbatim --------
  function pmPython(c, i, cfg){
    var editId='cxpmpy_'+c.id+'_'+i, outId='cxpmpyout_'+c.id+'_'+i, statusId='cxpmpystatus_'+c.id+'_'+i;
    var saved = pmLoad(c.id, i, 'code', cfg.starterCode);
    return '<div class="cx-pm">'
      + '<div class="cx-pm-label"><span class="cx-pm-badge cx-pm-badge-live">LIVE</span>Runs real Python in your browser (same sandboxed runtime used elsewhere on this platform). This runs your code and shows the output; it does not auto-grade correctness.</div>'
      + '<textarea class="cx-pm-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false">'+pmEsc(saved)+'</textarea>'
      + '<div class="cx-pm-row">'
        + '<button class="cx-pm-btn" data-act="cxPMRunPython(\''+c.id+'\','+i+',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run</button>'
        + '<button class="cx-pm-btn-ghost" data-act="cxPMResetPython(\''+c.id+'\','+i+',\''+editId+'\')">Reset</button>'
      + '</div>'
      + '<div class="cx-pm-out" id="'+outId+'"></div>'
      + '</div>';
  }
  window.cxPMRunPython = function(courseId, i, editId, outId, statusId){
    var ta = document.getElementById(editId);
    if(ta) pmSave(courseId, i, 'code', ta.value);
    // Delegates to the existing shared runner (defined earlier in the page) --
    // deliberately NOT re-implemented here, to avoid a second Python runtime.
    if(typeof runEditor === 'function') runEditor(editId, outId, statusId);
  };
  window.cxPMResetPython = function(courseId, i, editId){
    var cfg = window.PRACTICE_PILOTS[courseId] && window.PRACTICE_PILOTS[courseId][i];
    if(!cfg) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = cfg.starterCode;
    pmSave(courseId, i, 'code', cfg.starterCode);
  };

  // ---- browser-web: isolated HTML/CSS/JS playground ------------------------------
  var pmWebListenerAttached = false;
  function pmWebAttachListener(){
    if(pmWebListenerAttached) return;
    pmWebListenerAttached = true;
    window.addEventListener('message', function(ev){
      var d = ev.data;
      if(!d || !d.cxpmweb) return;
      var out = document.getElementById(d.outId);
      if(out) out.textContent += (out.textContent ? '\n' : '') + d.line;
    });
  }
  function pmWeb(c, i, cfg){
    pmWebAttachListener();
    var idBase = 'cxpmweb_'+c.id+'_'+i;
    var htmlId=idBase+'_html', cssId=idBase+'_css', jsId=idBase+'_js', frameId=idBase+'_frame', outId=idBase+'_out';
    var savedHtml = pmLoad(c.id,i,'html',cfg.html), savedCss = pmLoad(c.id,i,'css',cfg.css), savedJs = pmLoad(c.id,i,'js',cfg.js);
    return '<div class="cx-pm">'
      + '<div class="cx-pm-label"><span class="cx-pm-badge cx-pm-badge-live">LIVE</span>Runs in an isolated sandboxed iframe (no access to this page or the network). Edit any of the three panels, then Run.</div>'
      + '<div class="cx-pm-fields">'
        + '<div class="cx-pm-field-label">HTML</div><textarea class="cx-pm-edit" id="'+htmlId+'" aria-label="HTML editor" spellcheck="false" style="min-height:60px">'+pmEsc(savedHtml)+'</textarea>'
        + '<div class="cx-pm-field-label">CSS</div><textarea class="cx-pm-edit" id="'+cssId+'" aria-label="CSS editor" spellcheck="false" style="min-height:50px">'+pmEsc(savedCss)+'</textarea>'
        + '<div class="cx-pm-field-label">JavaScript</div><textarea class="cx-pm-edit" id="'+jsId+'" aria-label="JavaScript editor" spellcheck="false" style="min-height:70px">'+pmEsc(savedJs)+'</textarea>'
      + '</div>'
      + '<div class="cx-pm-row">'
        + '<button class="cx-pm-btn" data-act="cxPMRunWeb(\''+c.id+'\','+i+',\''+htmlId+'\',\''+cssId+'\',\''+jsId+'\',\''+frameId+'\',\''+outId+'\')">&#9654; Run</button>'
        + '<button class="cx-pm-btn-ghost" data-act="cxPMResetWeb(\''+c.id+'\','+i+',\''+htmlId+'\',\''+cssId+'\',\''+jsId+'\')">Reset</button>'
      + '</div>'
      + '<iframe class="cx-pm-iframe" id="'+frameId+'" sandbox="allow-scripts" title="HTML/CSS/JS playground output"></iframe>'
      + '<div class="cx-pm-field-label">console output</div>'
      + '<div class="cx-pm-out" id="'+outId+'"></div>'
      + '</div>';
  }
  window.cxPMRunWeb = function(courseId, i, htmlId, cssId, jsId, frameId, outId){
    var html = (document.getElementById(htmlId)||{}).value || '';
    var css = (document.getElementById(cssId)||{}).value || '';
    var js = (document.getElementById(jsId)||{}).value || '';
    pmSave(courseId, i, 'html', html); pmSave(courseId, i, 'css', css); pmSave(courseId, i, 'js', js);
    var out = document.getElementById(outId); if(out) out.textContent = '';
    var frame = document.getElementById(frameId);
    if(!frame) return;
    var bridgeId = frameId+'_'+Date.now();
    var srcdoc = '<!doctype html><html><head><meta charset="utf-8"><style>'+css+'</style></head><body>'
      + html
      + '<script>(function(){var OUT_ID='+JSON.stringify(outId)+';'
      + 'console.log=function(){var a=Array.prototype.slice.call(arguments).map(String).join(" ");parent.postMessage({cxpmweb:true,outId:OUT_ID,line:a},"*");};'
      + 'window.onerror=function(msg){parent.postMessage({cxpmweb:true,outId:OUT_ID,line:"Error: "+msg},"*");return true;};'
      + 'try{\n' + js + '\n}catch(e){console.log("Error: "+e.message);}'
      + '})();<\/script></body></html>';
    frame.srcdoc = srcdoc;
  };
  window.cxPMResetWeb = function(courseId, i, htmlId, cssId, jsId){
    var cfg = window.PRACTICE_PILOTS[courseId] && window.PRACTICE_PILOTS[courseId][i];
    if(!cfg) return;
    var h=document.getElementById(htmlId), c2=document.getElementById(cssId), j=document.getElementById(jsId);
    if(h) h.value = cfg.html; if(c2) c2.value = cfg.css; if(j) j.value = cfg.js;
    pmSave(courseId, i, 'html', cfg.html); pmSave(courseId, i, 'css', cfg.css); pmSave(courseId, i, 'js', cfg.js);
  };

  // ---- simulation-http: canned request/response cycles ---------------------------
  var HTTP_RESPONSES = {
    GET: {status:200, body:'{"id": 42, "item": "Wireless Mouse", "status": "shipped"}'},
    POST: {status:201, body:'{"id": 43, "item": "New Order", "status": "created"}'},
    PATCH: {status:200, body:'{"id": 42, "status": "shipped"}  // only the changed field was sent'},
    DELETE: {status:204, body:'(no body -- 204 No Content)'},
    RATE_LIMIT: {status:429, body:'{"error": "Too Many Requests"}\nRetry-After: 30'}
  };
  function pmSimHttp(c, i, cfg){
    var outId='cxpmsimhttp_'+c.id+'_'+i;
    return '<div class="cx-pm cx-pm-sim">'
      + '<div class="cx-pm-label"><span class="cx-pm-badge cx-pm-badge-sim">SIMULATION</span>This simulates an HTTP request/response cycle against a fake endpoint (<code>/api/orders/42</code>) with canned, pre-written responses -- it does not contact any real server, and needs no API key.</div>'
      + '<div class="cx-pm-row cx-pm-sim-btns">'
        + '<button class="cx-pm-btn-ghost" data-act="cxPMSimHttpCall(\''+outId+'\',\'GET\')">GET /api/orders/42</button>'
        + '<button class="cx-pm-btn-ghost" data-act="cxPMSimHttpCall(\''+outId+'\',\'POST\')">POST /api/orders</button>'
        + '<button class="cx-pm-btn-ghost" data-act="cxPMSimHttpCall(\''+outId+'\',\'PATCH\')">PATCH /api/orders/42</button>'
        + '<button class="cx-pm-btn-ghost" data-act="cxPMSimHttpCall(\''+outId+'\',\'DELETE\')">DELETE /api/orders/42</button>'
        + '<button class="cx-pm-btn-ghost" data-act="cxPMSimHttpCall(\''+outId+'\',\'RATE_LIMIT\')">Trigger rate limit</button>'
      + '</div>'
      + '<div class="cx-pm-out" id="'+outId+'">(click a method above to see its simulated response)</div>'
      + '</div>';
  }
  window.cxPMSimHttpCall = function(outId, method){
    var r = HTTP_RESPONSES[method]; if(!r) return;
    var out = document.getElementById(outId); if(!out) return;
    var label = method==='RATE_LIMIT' ? 'GET /api/orders/42 (6th request this second)' : method+' /api/orders'+(method==='POST'?'':'/42');
    out.textContent = '> '+label+'\n< HTTP/1.1 '+r.status+'\n'+r.body;
  };

  // ---- simulation-rag: naive keyword-overlap retrieval ---------------------------
  var RAG_CORPUS = [
    {id:'doc1', text:'Our return policy allows returns within 30 days of purchase with a receipt.'},
    {id:'doc2', text:'Shipping typically takes 3-5 business days within the country.'},
    {id:'doc3', text:'Refunds are processed to the original payment method within 7 business days.'},
    {id:'doc4', text:'International orders may be subject to customs fees set by the destination country.'},
    {id:'doc5', text:'Gift cards do not expire and cannot be redeemed for cash.'}
  ];
  function ragScore(query, text){
    var qWords = query.toLowerCase().match(/[a-z0-9]+/g) || [];
    var tWords = (text.toLowerCase().match(/[a-z0-9]+/g) || []);
    var tSet = {}; tWords.forEach(function(w){ tSet[w]=true; });
    var score = 0;
    qWords.forEach(function(w){ if(tSet[w]) score++; });
    return score;
  }
  function pmSimRag(c, i, cfg){
    var inId='cxpmrag_'+c.id+'_'+i+'_q', outId='cxpmrag_'+c.id+'_'+i+'_out';
    return '<div class="cx-pm cx-pm-sim">'
      + '<div class="cx-pm-label"><span class="cx-pm-badge cx-pm-badge-sim">SIMULATION</span>This simulates retrieval ranking using simple keyword overlap against a 5-document fake corpus -- a simplified stand-in for real embedding-based similarity search, not a live vector database.</div>'
      + '<textarea class="cx-pm-edit" id="'+inId+'" aria-label="Type a question" spellcheck="false" style="min-height:40px" placeholder="Type a question, e.g. how long do refunds take?"></textarea>'
      + '<div class="cx-pm-row"><button class="cx-pm-btn" data-act="cxPMSimRagSearch(\''+inId+'\',\''+outId+'\')">&#9654; Search</button></div>'
      + '<div class="cx-pm-out" id="'+outId+'">(enter a query above and click Search)</div>'
      + '</div>';
  }
  window.cxPMSimRagSearch = function(inId, outId){
    var q = (document.getElementById(inId)||{}).value || '';
    var out = document.getElementById(outId); if(!out) return;
    var ranked = RAG_CORPUS.map(function(d){ return {id:d.id, text:d.text, score:ragScore(q,d.text)}; })
      .sort(function(a,b){ return b.score-a.score; }).slice(0,3);
    out.textContent = ranked.map(function(r){ return '['+r.id+', score='+r.score+'] '+r.text; }).join('\n');
  };

  // ---- simulation-git: tiny in-memory fake repo -----------------------------------
  function freshGitRepo(){ return {branches:{main:['(initial state, no commits yet)']}, current:'main', staged:[]}; }
  var GIT_STATE = {};
  function pmSimGit(c, i, cfg){
    var key = c.id+'_'+i;
    GIT_STATE[key] = freshGitRepo();
    var inId='cxpmgit_'+key+'_in', outId='cxpmgit_'+key+'_out';
    return '<div class="cx-pm cx-pm-sim">'
      + '<div class="cx-pm-label"><span class="cx-pm-badge cx-pm-badge-sim">SIMULATION</span>This simulates a small set of git commands (<code>init</code>, <code>add</code>, <code>commit -m "msg"</code>, <code>branch</code>, <code>checkout</code>, <code>merge</code>, <code>log</code>) against an in-memory fake repository -- it is not a real git repo and makes no changes on disk.</div>'
      + '<textarea class="cx-pm-edit" id="'+inId+'" aria-label="Git command" spellcheck="false" style="min-height:34px" placeholder="e.g. commit -m &quot;first commit&quot;"></textarea>'
      + '<div class="cx-pm-row">'
        + '<button class="cx-pm-btn" data-act="cxPMSimGitRun(\''+key+'\',\''+inId+'\',\''+outId+'\')">&#9654; Run command</button>'
        + '<button class="cx-pm-btn-ghost" data-act="cxPMSimGitReset(\''+key+'\',\''+outId+'\')">Reset repo</button>'
      + '</div>'
      + '<div class="cx-pm-out cx-pm-sim-log" id="'+outId+'">(fake repo initialized on branch \'main\', no commits yet)</div>'
      + '</div>';
  }
  function gitLog(out, line){ out.textContent += (out.textContent ? '\n' : '') + line; }
  window.cxPMSimGitRun = function(key, inId, outId){
    var repo = GIT_STATE[key]; if(!repo) return;
    var cmd = ((document.getElementById(inId)||{}).value || '').trim();
    var out = document.getElementById(outId); if(!out) return;
    if(!cmd) return;
    gitLog(out, '$ '+cmd);
    var m;
    if(cmd==='init'){ GIT_STATE[key]=freshGitRepo(); gitLog(out,'Reinitialized empty fake repository.'); }
    else if((m=/^add\s+(.+)$/.exec(cmd))){ repo.staged.push(m[1]); gitLog(out,'staged: '+m[1]); }
    else if((m=/^commit\s+-m\s+"(.*)"$/.exec(cmd))){
      if(!repo.staged.length){ gitLog(out,'nothing to commit -- stage a file first with add <file>'); }
      else{ repo.branches[repo.current].push(m[1]+' ('+repo.staged.join(', ')+')'); repo.staged=[]; gitLog(out,'[' +repo.current+'] '+m[1]); }
    }
    else if((m=/^branch\s+(\S+)$/.exec(cmd))){
      if(repo.branches[m[1]]) gitLog(out,'branch \''+m[1]+'\' already exists');
      else { repo.branches[m[1]] = repo.branches[repo.current].slice(); gitLog(out,'created branch \''+m[1]+'\' from \''+repo.current+'\''); }
    }
    else if((m=/^checkout\s+(\S+)$/.exec(cmd))){
      if(!repo.branches[m[1]]) gitLog(out,'error: branch \''+m[1]+'\' does not exist');
      else { repo.current = m[1]; gitLog(out,'switched to branch \''+m[1]+'\''); }
    }
    else if((m=/^merge\s+(\S+)$/.exec(cmd))){
      if(!repo.branches[m[1]]) gitLog(out,'error: branch \''+m[1]+'\' does not exist');
      else { repo.branches[repo.current] = repo.branches[repo.current].concat(repo.branches[m[1]].slice(repo.branches[repo.current].length)); gitLog(out,'merged \''+m[1]+'\' into \''+repo.current+'\''); }
    }
    else if(cmd==='log'){ gitLog(out, repo.branches[repo.current].join('\n')); }
    else { gitLog(out, 'unrecognized simulated command: '+cmd); }
    var input = document.getElementById(inId); if(input) input.value='';
  };
  window.cxPMSimGitReset = function(key, outId){
    GIT_STATE[key] = freshGitRepo();
    var out = document.getElementById(outId); if(out) out.textContent = '(fake repo reset -- branch \'main\', no commits yet)';
  };

  // ---- simulation-agent-loop: scripted step-through trace -------------------------
  var AGENT_TRACE = [
    {step:'Observe', detail:'Goal received: "book me the cheapest flight under $500."'},
    {step:'Decide', detail:'Model decides to call tool: search_flights(max_price=500)'},
    {step:'Act', detail:'Your code executes search_flights(500) -> returns 3 candidate flights.'},
    {step:'Observe', detail:'Results: [$430 (1 stop), $475 (nonstop), $610 (nonstop)]'},
    {step:'Reflect', detail:'Model checks: does $610 fit the constraint? No -- discard it.'},
    {step:'Decide', detail:'Model decides to call tool: confirm_with_user(flight="$430, 1 stop")'},
    {step:'Act', detail:'Your code surfaces the choice to the user for final approval (irreversible booking action -- gated).'},
    {step:'Done', detail:'Loop ends once the user approves or rejects the booking.'}
  ];
  function pmSimAgent(c, i, cfg){
    var key = c.id+'_'+i;
    var outId='cxpmagent_'+key+'_out';
    return '<div class="cx-pm cx-pm-sim" data-agent-step="0" id="cxpmagentwrap_'+key+'">'
      + '<div class="cx-pm-label"><span class="cx-pm-badge cx-pm-badge-sim">SIMULATION</span>This steps through one pre-scripted agent-loop trace for "book the cheapest flight under $500" -- it is not a live LLM call, just a fixed illustration of the observe-decide-act-reflect cycle.</div>'
      + '<div class="cx-pm-row"><button class="cx-pm-btn" data-act="cxPMSimAgentNext(\''+key+'\',\''+outId+'\')">&#9654; Next step</button>'
      + '<button class="cx-pm-btn-ghost" data-act="cxPMSimAgentReset(\''+key+'\',\''+outId+'\')">Reset</button></div>'
      + '<div class="cx-pm-out" id="'+outId+'">(click Next step to begin the trace)</div>'
      + '</div>';
  }
  var AGENT_STEP_IDX = {}, AGENT_STEP_LINES = {};
  window.cxPMSimAgentNext = function(key, outId){
    var idx = AGENT_STEP_IDX[key] || 0;
    var out = document.getElementById(outId); if(!out) return;
    if(!AGENT_STEP_LINES[key]) AGENT_STEP_LINES[key] = [];
    if(idx >= AGENT_TRACE.length){
      AGENT_STEP_LINES[key].push('(trace complete -- click Reset to run again)');
      out.textContent = AGENT_STEP_LINES[key].join('\n');
      return;
    }
    var s = AGENT_TRACE[idx];
    AGENT_STEP_LINES[key].push('['+(idx+1)+'/'+AGENT_TRACE.length+'] '+s.step+': '+s.detail);
    out.textContent = AGENT_STEP_LINES[key].join('\n');
    AGENT_STEP_IDX[key] = idx+1;
  };
  window.cxPMSimAgentReset = function(key, outId){
    AGENT_STEP_IDX[key] = 0;
    AGENT_STEP_LINES[key] = [];
    var out = document.getElementById(outId); if(out) out.textContent = '(click Next step to begin the trace)';
  };

  // ---- external-*: static guidance cards, no network access from this app --------
  function pmExternal(c, i, cfg, title, desc, snippet){
    return '<div class="cx-pm cx-pm-guidance">'
      + '<div class="cx-pm-label"><span class="cx-pm-badge cx-pm-badge-ext">EXTERNAL</span>This exercise is practiced outside this platform -- no API key or paid service required.</div>'
      + '<h4 style="margin:4px 0">'+pmEsc(title)+'</h4>'
      + '<p style="margin:4px 0 8px;font-size:.85rem">'+pmEsc(desc)+'</p>'
      + '<pre>'+pmEsc(snippet)+'</pre>'
      + '</div>';
  }

})();

