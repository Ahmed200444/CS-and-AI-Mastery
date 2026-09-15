
(function(){
  function dsEsc(s){ return escapeHtml(s); }
  function dsDoneKey(id){ return 'ds_done_'+id; }
  function dsIsDone(id){ try{ return localStorage.getItem(dsDoneKey(id))==='1'; }catch(e){ return false; } }
  window.dsMarkDone = function(idx){
    try{ localStorage.setItem(dsDoneKey(DS_TASKS[idx].id), '1'); }catch(e){}
    renderDsNav(); renderDsTask();
  };

  var DS_TASKS = [
    { id:'ds-retry', title:'Retry with Exponential Backoff',
      explain:'Trigger retries against a simulated flaky operation and watch the wait time double between attempts -- the same deterministic doubling covered in the lesson.',
      render: function(){
        return '<div class="card">'
          + '<label for="dsRetryFailCount" style="display:block;font-size:.85rem">Operation fails this many times before succeeding: <input type="number" min="0" max="6" class="wd-edit" style="width:80px;display:inline-block;min-height:0;padding:4px 8px" id="dsRetryFailCount" value="2"></label>'
          + '<button class="wd-btn" style="margin-top:10px" data-act="dsRunRetry()">&#9654; Run with backoff</button>'
          + '<div id="dsRetryOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.88rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'ds-circuitbreaker', title:'Circuit Breaker State Machine',
      explain:'Send simulated calls through a circuit breaker and watch it move between CLOSED, OPEN, and HALF-OPEN based on consecutive failures and a cooldown timer.',
      render: function(){
        return '<div class="card">'
          + '<div class="wd-row" style="gap:10px">'
            + '<button class="wd-btn-ghost" data-act="dsCbCall(\'false\')">Send failing call</button>'
            + '<button class="wd-btn-ghost" data-act="dsCbCall(\'true\')">Send succeeding call</button>'
            + '<button class="wd-btn-ghost" data-act="dsCbAdvanceTime()">&#9202; Advance time by 3s</button>'
            + '<button class="wd-btn-ghost" data-act="dsCbReset()">Reset</button>'
          + '</div>'
          + '<div id="dsCbState" role="status" aria-live="polite" style="margin-top:14px;font-weight:800;font-size:1.05rem;color:var(--teal)"></div>'
          + '<div id="dsCbLog" style="margin-top:8px;font-size:.8rem;color:var(--sub)"></div>'
          + '</div>';
      }},
    { id:'ds-consistenthash', title:'Consistent Hash Ring',
      explain:'Add or remove nodes on a hash ring and see exactly which keys reassign -- confirming that only a minority of keys move, not nearly all of them.',
      render: function(){
        return '<div class="card">'
          + '<div class="wd-row" style="gap:10px;margin-bottom:10px">'
            + '<button class="wd-btn-ghost" data-act="dsHashAddNode()">+ Add node</button>'
            + '<button class="wd-btn-ghost" data-act="dsHashRemoveNode()">&minus; Remove last node</button>'
            + '<button class="wd-btn-ghost" data-act="dsHashReset()">Reset</button>'
          + '</div>'
          + '<div id="dsHashOutput" role="status" aria-live="polite" style="font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'ds-idempotency', title:'Idempotency Key Deduplication',
      explain:'Send the same request ID multiple times (simulating a client retrying after a lost response) and confirm it only ever processes once.',
      render: function(){
        return '<div class="card">'
          + '<label for="dsIdemReqId" style="display:block;font-size:.85rem">Request ID: <input type="text" class="wd-edit" style="width:140px;display:inline-block;min-height:0;padding:4px 8px" id="dsIdemReqId" value="req-abc"></label>'
          + '<button class="wd-btn" style="margin-top:10px" data-act="dsIdemSend()">Send request</button>'
          + '<button class="wd-btn-ghost" data-act="dsIdemReset()">Reset</button>'
          + '<div id="dsIdemOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'ds-leaderelection', title:'Leader Election (Bully Algorithm)',
      explain:'Fail nodes and trigger an election to see which node becomes leader -- the highest-priority node that is still alive.',
      render: function(){
        return '<div class="card">'
          + '<div id="dsLeaderNodes" style="margin-bottom:10px;font-family:ui-monospace,monospace"></div>'
          + '<div class="wd-row" style="gap:10px">'
            + '<button class="wd-btn-ghost" data-act="dsLeaderToggleFail(1)">Toggle node 1</button>'
            + '<button class="wd-btn-ghost" data-act="dsLeaderToggleFail(2)">Toggle node 2</button>'
            + '<button class="wd-btn-ghost" data-act="dsLeaderToggleFail(3)">Toggle node 3</button>'
            + '<button class="wd-btn-ghost" data-act="dsLeaderToggleFail(4)">Toggle node 4</button>'
            + '<button class="wd-btn-ghost" data-act="dsLeaderToggleFail(5)">Toggle node 5</button>'
          + '</div>'
          + '<button class="wd-btn" style="margin-top:10px" data-act="dsLeaderElect()">Trigger election</button>'
          + '<div id="dsLeaderOutput" role="status" aria-live="polite" style="margin-top:14px;font-weight:700"></div>'
          + '</div>';
      }},
    { id:'ds-tracediagnose', title:'Network Failure Diagnostic',
      explain:'Given simulated signals from a multi-service request, decide the most likely failure mode -- the same layered reasoning used throughout this course.',
      render: function(){
        return '<div class="card">'
          + '<label for="dsDiagSelect" style="display:block;font-size:.85rem;margin-bottom:6px">Choose a scenario:</label>'
          + '<select id="dsDiagSelect" class="api-method-select" style="max-width:100%;width:100%" data-change="dsDiagUpdate()">'
            + '<option value="0">Downstream service times out repeatedly</option>'
            + '<option value="1">Duplicate charge appears after a client retry</option>'
            + '<option value="2">Two nodes both act as leader at once</option>'
          + '</select>'
          + '<div id="dsDiagOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.9rem"></div>'
          + '</div>';
      }}
  ];

  var dsCurIdx = 0;

  function renderDsNav(){
    var nav = document.getElementById('dsLessonNav');
    if(!nav) return;
    nav.innerHTML = DS_TASKS.map(function(t, i){
      var done = dsIsDone(t.id) ? ' \u2713' : '';
      return '<button class="'+(i===dsCurIdx?'active':'')+'" data-act="dsOpen('+i+')">'+(i+1)+'. '+dsEsc(t.title)+done+'</button>';
    }).join('');
  }
  window.dsOpen = function(idx){ dsCurIdx = idx; renderDsNav(); renderDsTask(); };
  window.dsNext = function(){ if(dsCurIdx < DS_TASKS.length-1){ dsCurIdx++; renderDsNav(); renderDsTask(); } };
  window.dsPrev = function(){ if(dsCurIdx > 0){ dsCurIdx--; renderDsNav(); renderDsTask(); } };

  function renderDsTask(){
    var body = document.getElementById('dsLessonBody');
    if(!body) return;
    var t = DS_TASKS[dsCurIdx];
    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(dsCurIdx+1)+dsEsc(t.title)+'</h2></div>'
      + trackMentalModel(t.explain)
      + t.render()
      + '<div class="wd-row" style="margin-top:14px">'
        + '<button class="wd-btn-ghost" data-act="dsMarkDone('+dsCurIdx+')">Mark explored</button>'
      + '</div>'
      + '<div class="wd-navrow">'
        + (dsCurIdx>0 ? '<button class="wd-btn-ghost" data-act="dsPrev()">&larr; Previous</button>' : '<span></span>')
        + (dsCurIdx<DS_TASKS.length-1 ? '<button class="wd-btn" data-act="dsNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
    if(t.id==='ds-retry') dsRetryLog=[];
    if(t.id==='ds-circuitbreaker') dsCbReset();
    if(t.id==='ds-consistenthash') dsHashReset();
    if(t.id==='ds-idempotency') dsIdemReset();
    if(t.id==='ds-leaderelection'){ dsLeaderFailed={}; dsRenderLeaderNodes(); }
    if(t.id==='ds-tracediagnose') dsDiagUpdate();
  }

  // ---- Task 1: retry with exponential backoff ----
  var dsRetryLog = [];
  window.dsRunRetry = function(){
    var failCount = Number(document.getElementById('dsRetryFailCount').value)||0;
    var log = [];
    for(var attempt=1; attempt<=6; attempt++){
      var wait = attempt===1 ? 0 : Math.pow(2, attempt-2);
      var success = attempt > failCount;
      log.push('Attempt '+attempt+' (waited '+wait+'s before this attempt): '+(success?'SUCCESS':'failed'));
      if(success) break;
    }
    document.getElementById('dsRetryOutput').textContent = log.join('\n');
  };

  // ---- Task 2: circuit breaker ----
  var dsCbState, dsCbFailCount, dsCbTime, dsCbOpenedAt, dsCbLog;
  window.dsCbReset = function(){
    dsCbState='CLOSED'; dsCbFailCount=0; dsCbTime=0; dsCbOpenedAt=null; dsCbLog=[];
    dsRenderCb();
  };
  window.dsCbCall = function(willSucceedArg){
    var willSucceed = (willSucceedArg === true || willSucceedArg === 'true');
    var result;
    if(dsCbState==='OPEN'){
      if(dsCbTime - dsCbOpenedAt >= 5){ dsCbState='HALF_OPEN'; } else { result='REJECTED (circuit open)'; }
    }
    if(!result){
      if(willSucceed){
        dsCbFailCount=0;
        if(dsCbState==='HALF_OPEN'){ dsCbState='CLOSED'; }
        result='SUCCESS';
      } else {
        dsCbFailCount++;
        if(dsCbState==='HALF_OPEN'){ dsCbState='OPEN'; dsCbOpenedAt=dsCbTime; result='FAILURE (reopened circuit)'; }
        else if(dsCbFailCount>=3){ dsCbState='OPEN'; dsCbOpenedAt=dsCbTime; result='FAILURE (circuit now open)'; }
        else { result='FAILURE'; }
      }
    }
    dsCbLog.unshift('t='+dsCbTime+': '+result+' (state: '+dsCbState+')');
    dsCbLog = dsCbLog.slice(0,6);
    dsRenderCb();
  };
  window.dsCbAdvanceTime = function(){ dsCbTime += 3; dsRenderCb(); };
  function dsRenderCb(){
    var stateEl = document.getElementById('dsCbState');
    var logEl = document.getElementById('dsCbLog');
    if(stateEl) stateEl.textContent = 'State: '+dsCbState+' (t='+dsCbTime+', consecutive failures: '+dsCbFailCount+')';
    if(logEl) logEl.innerHTML = dsCbLog.map(function(l){ return '<div>'+dsEsc(l)+'</div>'; }).join('');
  }

  // ---- Task 3: consistent hashing ----
  var dsHashNodes, dsHashKeys;
  // Real 32-bit FNV-1a hash, using Math.imul for correct wraparound arithmetic
  // (naive JS multiplication here would silently lose precision above 2^53 and
  // diverge from a genuine FNV-1a implementation -- verified against a Python
  // reference implementation using equivalent 32-bit arithmetic).
  function dsSimpleHash(s){
    var h = 2166136261;
    for(var i=0;i<s.length;i++){ h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; }
    return h % 360;
  }
  window.dsHashReset = function(){
    dsHashNodes = ['node-A','node-B','node-C'];
    dsHashKeys = [];
    for(var i=0;i<100;i++){ dsHashKeys.push('key:'+i); }
    dsRenderHash();
  };
  var DS_VIRTUAL_NODES = 15;
  function dsBuildRing(nodes){
    var ring = [];
    nodes.forEach(function(node){
      for(var v=0; v<DS_VIRTUAL_NODES; v++){
        ring.push({p: dsSimpleHash(node+'#'+v), n: node});
      }
    });
    ring.sort(function(a,b){ return a.p-b.p; });
    return ring;
  }
  function dsAssign(ring, key){
    var pos = dsSimpleHash(key);
    for(var i=0;i<ring.length;i++){ if(pos <= ring[i].p) return ring[i].n; }
    return ring[0].n;
  }
  window.dsHashAddNode = function(){
    var ringBefore = dsBuildRing(dsHashNodes);
    var before = {}; dsHashKeys.forEach(function(k){ before[k]=dsAssign(ringBefore,k); });
    var prevCount = dsHashNodes.length;
    dsHashNodes.push('node-'+String.fromCharCode(65+dsHashNodes.length));
    dsRenderHash(before, prevCount);
  };
  window.dsHashRemoveNode = function(){
    if(dsHashNodes.length<=1) return;
    var ringBefore = dsBuildRing(dsHashNodes);
    var before = {}; dsHashKeys.forEach(function(k){ before[k]=dsAssign(ringBefore,k); });
    var prevCount = dsHashNodes.length;
    dsHashNodes.pop();
    dsRenderHash(before, prevCount);
  };
  function dsClassifyMovement(moved, total){
    if(moved===0) return 'no keys moved';
    if(moved===total) return 'all keys moved';
    if(moved < total/2) return 'a minority moved';
    if(moved === total/2) return 'half moved';
    return 'a majority moved';
  }
  function dsRenderHash(before, prevCount){
    var out = document.getElementById('dsHashOutput');
    if(!out) return;
    var ringNow = dsBuildRing(dsHashNodes);
    var lines = ['Nodes: '+dsHashNodes.join(', ')+'  ('+DS_VIRTUAL_NODES+' virtual positions each, '+dsHashKeys.length+' keys total)', ''];
    // show a small, readable sample of individual assignments
    dsHashKeys.slice(0,8).forEach(function(k){
      var now = dsAssign(ringNow, k);
      var prev = before ? before[k] : null;
      var movedFlag = prev && prev !== now;
      lines.push(k+' -> '+now+(movedFlag ? '  (moved from '+prev+')' : ''));
    });
    lines.push('...('+(dsHashKeys.length-8)+' more keys not shown individually)');
    if(before){
      var moved = 0;
      dsHashKeys.forEach(function(k){ if(before[k] !== dsAssign(ringNow,k)) moved++; });
      var pct = Math.round(moved/dsHashKeys.length*100);
      lines.push('', 'Previous node count: '+prevCount+' | New node count: '+dsHashNodes.length);
      lines.push(moved+' of '+dsHashKeys.length+' keys moved ('+pct+'%) -- '+dsClassifyMovement(moved, dsHashKeys.length)+'.');
      lines.push('Expected approximate share for this change: ~'+Math.round(100/dsHashNodes.length)+'% (a rough approximation, not a guarantee -- small samples can deviate substantially from this estimate).');
      lines.push('Teaching point: consistent hashing limits reassignment to a section of the ring; naive modulo-based partitioning (hash(key) % N) can remap most or all of the keyspace when the node count changes.');
    }
    out.textContent = lines.join('\n');
  }

  // ---- Task 4: idempotency ----
  var dsIdemStore;
  window.dsIdemReset = function(){ dsIdemStore = {}; document.getElementById('dsIdemOutput') && (document.getElementById('dsIdemOutput').textContent=''); };
  window.dsIdemSend = function(){
    var id = document.getElementById('dsIdemReqId').value;
    var out = document.getElementById('dsIdemOutput');
    var line;
    if(dsIdemStore[id] !== undefined){
      line = 'Request "'+id+'": DUPLICATE (ignored) -- original result: '+dsIdemStore[id];
    } else {
      dsIdemStore[id] = 'processed at call #'+(Object.keys(dsIdemStore).length+1);
      line = 'Request "'+id+'": PROCESSED -- '+dsIdemStore[id];
    }
    out.textContent = (out.textContent ? out.textContent+'\n' : '') + line;
  };

  // ---- Task 5: leader election ----
  var dsLeaderFailed = {};
  window.dsLeaderToggleFail = function(n){
    dsLeaderFailed[n] = !dsLeaderFailed[n];
    dsRenderLeaderNodes();
  };
  function dsRenderLeaderNodes(){
    var el = document.getElementById('dsLeaderNodes');
    if(!el) return;
    el.textContent = [1,2,3,4,5].map(function(n){ return 'Node '+n+': '+(dsLeaderFailed[n]?'DOWN':'alive'); }).join('  |  ');
  }
  window.dsLeaderElect = function(){
    var alive = [1,2,3,4,5].filter(function(n){ return !dsLeaderFailed[n]; });
    var out = document.getElementById('dsLeaderOutput');
    out.textContent = alive.length ? ('New leader: Node '+Math.max.apply(null, alive)+' (highest-priority node still alive)') : 'No nodes alive -- no leader can be elected.';
  };

  // ---- Task 6: network failure diagnostic ----
  window.dsDiagUpdate = function(){
    var sel = document.getElementById('dsDiagSelect');
    var out = document.getElementById('dsDiagOutput');
    if(!sel || !out) return;
    var answers = [
      'Likely cause: the downstream service is overloaded or down. Correct response: exponential backoff on retries, and a circuit breaker to stop adding load once failures exceed a threshold.',
      'Likely cause: a lost response caused a client retry with no idempotency key, so the server processed the same request twice. Fix: require an idempotency key on the write, and check it before processing.',
      'Likely cause: a split-brain leader election -- the old leader resumed after being presumed dead. Fix: the resuming node should check for a newer leader term/epoch before acting as leader again.'
    ];
    out.textContent = answers[Number(sel.value)];
  };

  var dsBooted = false;
  window._distSysBoot = function(){
    if(dsBooted) return;
    dsBooted = true;
    renderDsNav();
    renderDsTask();
  };
})();
