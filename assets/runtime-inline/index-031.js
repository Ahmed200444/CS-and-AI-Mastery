
(function(){
  function obsDoneKey(id){ return 'obs_done_'+id; }
  function obsIsDone(id){ try{ return localStorage.getItem(obsDoneKey(id))==='1'; }catch(e){ return false; } }
  window.obsMarkDone = function(idx){
    try{ localStorage.setItem(obsDoneKey(OBS_TASKS[idx].id), '1'); }catch(e){}
    renderObsNav(); renderObsTask();
  };

  var OBS_EVENT_STREAM = [5, 3, 8, 2, 9, 1, 6, 4, 7, 3]; // deterministic, fixed
  var OBS_BUCKET_EDGES = [2, 4, 6, 8, 10];

  var OBS_TASKS = [
    { id:'obs-task-metric-types', title:'Metric Type Simulator',
      explain:'The same fixed event stream feeds a counter, a gauge, and a histogram -- watch how each represents it completely differently.',
      render: function(){
        return '<div class="card">'
          + '<div style="font-family:ui-monospace,monospace;font-size:.82rem;margin-bottom:10px">Event stream: '+OBS_EVENT_STREAM.join(', ')+'</div>'
          + '<button class="wd-btn" data-act="obsMetricRun()">Run stream through all three</button>'
          + '<button class="wd-btn-ghost" data-act="obsMetricReset()">Reset</button>'
          + '<div id="obsMetricOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'obs-task-trace-waterfall', title:'Trace Waterfall Visualizer',
      explain:'A fixed, simulated request passes through 4 spans -- inspect the waterfall to find the actual bottleneck, not just the root wrapper span.',
      render: function(){
        return '<div class="card">'
          + '<button class="wd-btn" data-act="obsTraceShow()">Show trace waterfall</button>'
          + '<div id="obsTraceOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.82rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'obs-task-slo-budget', title:'SLO / Error Budget Calculator',
      explain:'Enter an SLO target, total events, and failures -- see the allowed budget, consumption, and burn rate computed transparently, including the safe 100% SLO edge case.',
      render: function(){
        return '<div class="card">'
          + '<label for="obsSloTarget" style="display:block;font-size:.85rem">SLO target %: <input type="number" step="0.1" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="obsSloTarget" value="99.9" data-change="obsSloCalc()"></label>'
          + '<label for="obsSloTotal" style="display:block;font-size:.85rem;margin-top:8px">Total events: <input type="number" class="wd-edit" style="width:120px;display:inline-block;min-height:0;padding:4px 8px" id="obsSloTotal" value="100000" data-change="obsSloCalc()"></label>'
          + '<label for="obsSloFailed" style="display:block;font-size:.85rem;margin-top:8px">Failed events: <input type="number" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="obsSloFailed" value="50" data-change="obsSloCalc()"></label>'
          + '<button class="wd-btn" style="margin-top:10px" data-act="obsSloCalc()">Calculate</button>'
          + '<div id="obsSloOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'obs-task-alert-design', title:'Alert Design Tool',
      explain:'A fixed time series contains a real incident. Move the threshold and see the true/false positive/negative trade-off change -- there is no single universally correct threshold.',
      render: function(){
        return '<div class="card">'
          + '<label for="obsAlertThreshold" style="display:block;font-size:.85rem">Alert threshold: <span id="obsAlertThresholdLabel">10</span></label>'
          + '<input type="range" id="obsAlertThreshold" min="2" max="25" step="1" value="10" style="width:100%" data-input="obsAlertUpdate()">'
          + '<button class="wd-btn-ghost" style="margin-top:10px" data-act="obsAlertReset()">Reset</button>'
          + '<div id="obsAlertOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'obs-task-cardinality', title:'Metric Cardinality Cost Simulator',
      explain:'Toggle which labels are active on a metric and watch the time-series count multiply -- especially once a high-cardinality label like user_id is added. Figures shown are illustrative, not real vendor pricing.',
      render: function(){
        return '<div class="card">'
          + ['service','endpoint','status','user_id'].map(function(l){
              var checked = l !== 'user_id' ? 'checked' : '';
              return '<label style="display:inline-block;margin-right:14px;font-size:.85rem"><input type="checkbox" id="obsCardLabel_'+l+'" '+checked+' data-change="obsCardUpdate()"> '+l+'</label>';
            }).join('')
          + '<div id="obsCardOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'obs-task-incident-diagnosis', title:'Incident Diagnosis Tool',
      explain:'Inspect fixed evidence from all three pillars, then choose the root cause that is actually consistent with every signal -- not just plausible on its own.',
      render: function(){
        return '<div class="card">'
          + '<div style="font-family:ui-monospace,monospace;font-size:.8rem;white-space:pre-wrap;margin-bottom:10px">'
            + 'LOG: "Database connection pool exhausted" errors spiking at 14:32\\n'
            + 'METRIC: Database query p99 latency jumped from 20ms to 4000ms at 14:32\\n'
            + 'TRACE: Waterfall shows requests blocked waiting on the database span for 3.9s'
          + '</div>'
          + '<label for="obsDiagSelect" style="display:block;font-size:.85rem;margin-bottom:6px">Choose the root cause consistent with ALL three signals:</label>'
          + '<select id="obsDiagSelect" class="api-method-select" style="max-width:100%;width:100%" data-change="obsDiagCheck()">'
            + '<option value="-1">-- choose one --</option>'
            + '<option value="0">Network outage</option>'
            + '<option value="1">Database connection pool exhaustion</option>'
            + '<option value="2">Memory leak in app server</option>'
            + '<option value="3">DNS misconfiguration</option>'
          + '</select>'
          + '<div id="obsDiagOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.9rem;white-space:pre-wrap"></div>'
          + '</div>';
      }}
  ];

  var obsCurIdx = 0;

  function renderObsNav(){
    var nav = document.getElementById('obsLessonNav');
    if(!nav) return;
    nav.innerHTML = OBS_TASKS.map(function(t, i){
      var done = obsIsDone(t.id) ? ' \u2713' : '';
      return '<button class="'+(i===obsCurIdx?'active':'')+'" data-act="obsOpen('+i+')">'+(i+1)+'. '+t.title+done+'</button>';
    }).join('');
  }
  window.obsOpen = function(idx){ obsCurIdx = idx; renderObsNav(); renderObsTask(); };
  window.obsNext = function(){ if(obsCurIdx < OBS_TASKS.length-1){ obsCurIdx++; renderObsNav(); renderObsTask(); } };
  window.obsPrev = function(){ if(obsCurIdx > 0){ obsCurIdx--; renderObsNav(); renderObsTask(); } };

  function renderObsTask(){
    var body = document.getElementById('obsLessonBody');
    if(!body) return;
    var t = OBS_TASKS[obsCurIdx];
    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(obsCurIdx+1)+t.title+'</h2></div>'
      + trackMentalModel(t.explain)
      + t.render()
      + '<div class="wd-row" style="margin-top:14px">'
        + '<button class="wd-btn-ghost" data-act="obsMarkDone('+obsCurIdx+')">Mark explored</button>'
      + '</div>'
      + '<div class="wd-navrow">'
        + (obsCurIdx>0 ? '<button class="wd-btn-ghost" data-act="obsPrev()">&larr; Previous</button>' : '<span></span>')
        + (obsCurIdx<OBS_TASKS.length-1 ? '<button class="wd-btn" data-act="obsNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
    if(t.id==='obs-task-slo-budget') obsSloCalc();
    if(t.id==='obs-task-alert-design') obsAlertReset();
    if(t.id==='obs-task-cardinality') obsCardUpdate();
  }

  // ---- Task 1: metric types ----
  window.obsMetricReset = function(){ document.getElementById('obsMetricOutput').textContent = ''; };
  window.obsMetricRun = function(){
    var events = OBS_EVENT_STREAM;
    var counter = events.length;
    var gauge = events[events.length-1];
    var buckets = OBS_BUCKET_EDGES.map(function(){ return 0; });
    events.forEach(function(e){
      for(var i=0;i<OBS_BUCKET_EDGES.length;i++){
        if(e <= OBS_BUCKET_EDGES[i]){ buckets[i]++; break; }
      }
    });
    var bucketLabels = OBS_BUCKET_EDGES.map(function(edge,i){ return '<='+edge+': '+buckets[i]; }).join('  ');
    var lines = [
      'Counter (total events, only increases): '+counter,
      'Gauge (last observed value, can rise or fall): '+gauge,
      'Histogram buckets ('+bucketLabels+')',
      'Bucket total: '+buckets.reduce(function(a,b){return a+b;},0)+' (matches event count -- buckets summarize the distribution, they do not preserve every raw value individually)'
    ];
    document.getElementById('obsMetricOutput').textContent = lines.join('\n');
  };

  // ---- Task 2: trace waterfall ----
  var OBS_SPANS = [
    { id:'s1', parent:null, service:'gateway', start:0, duration:120 },
    { id:'s2', parent:'s1', service:'auth', start:5, duration:15 },
    { id:'s3', parent:'s1', service:'database', start:25, duration:80 },
    { id:'s4', parent:'s1', service:'cache', start:108, duration:8 }
  ];
  window.obsTraceShow = function(){
    var root = OBS_SPANS.filter(function(s){ return s.parent===null; })[0];
    var children = OBS_SPANS.filter(function(s){ return s.parent!==null; });
    var slowest = children.reduce(function(a,b){ return b.duration>a.duration?b:a; });
    var lines = ['Trace ID: trace-abc123', 'Total request duration (root span): '+root.duration+'ms', ''];
    OBS_SPANS.forEach(function(s){
      var isRoot = s.parent===null;
      var isSlowest = s.id===slowest.id;
      lines.push((isRoot?'[root] ':'  [child] ')+s.service+' -- start='+s.start+'ms, duration='+s.duration+'ms'+(isSlowest?'  <-- SLOWEST CHILD SPAN (bottleneck)':''));
    });
    lines.push('');
    lines.push('Slowest child span accounts for '+Math.round(slowest.duration/root.duration*100)+'% of total request duration.');
    lines.push('Note: trace ID + span IDs are specific to distributed tracing; a correlation ID used in logs is a related but not universally identical concept.');
    document.getElementById('obsTraceOutput').textContent = lines.join('\n');
  };

  // ---- Task 3: SLO / error budget ----
  window.obsSloCalc = function(){
    var target = Number(document.getElementById('obsSloTarget').value);
    var total = Number(document.getElementById('obsSloTotal').value);
    var failed = Number(document.getElementById('obsSloFailed').value);
    var allowedErrorRate = 1 - (target/100);
    var allowedBad = total * allowedErrorRate;
    var observedErrorRate = total > 0 ? failed/total : 0;
    var remaining = allowedBad - failed;
    var pctConsumed = allowedBad > 0 ? (failed/allowedBad*100) : (failed>0 ? 100 : 0);
    var burnRate;
    if(allowedErrorRate > 0){
      burnRate = (observedErrorRate/allowedErrorRate).toFixed(2);
    } else {
      burnRate = failed>0 ? 'N/A (100% SLO -- any failure exceeds it)' : '0 (no failures, 100% SLO safely met)';
    }
    var lines = [
      'SLI (observed): '+(observedErrorRate*100).toFixed(3)+'% error rate ('+failed+' of '+total+' events)',
      'SLO target: '+target+'%',
      'Allowed bad events: '+allowedBad.toFixed(2),
      'Consumed budget: '+failed+' events',
      'Remaining budget: '+remaining.toFixed(2)+' events',
      'Percent of budget consumed: '+pctConsumed.toFixed(1)+'%',
      'Burn rate (observed error rate / allowed error rate): '+burnRate,
      remaining < 0 ? 'Status: BUDGET EXCEEDED' : 'Status: within budget'
    ];
    document.getElementById('obsSloOutput').textContent = lines.join('\n');
  };

  // ---- Task 4: alert threshold trade-off ----
  var OBS_ALERT_SERIES = [1, 2, 1, 2, 3, 15, 18, 20, 2, 1, 2, 1];
  var OBS_ALERT_ACTUAL  = [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0]; // 1 = real incident bucket
  window.obsAlertReset = function(){
    var slider = document.getElementById('obsAlertThreshold');
    if(slider) slider.value = '10';
    var label = document.getElementById('obsAlertThresholdLabel');
    if(label) label.textContent = '10';
    obsAlertRender();
  };
  window.obsAlertUpdate = function(){
    var slider = document.getElementById('obsAlertThreshold');
    var label = document.getElementById('obsAlertThresholdLabel');
    if(label) label.textContent = slider.value;
    obsAlertRender();
  };
  function obsAlertRender(){
    var out = document.getElementById('obsAlertOutput');
    if(!out) return;
    var slider = document.getElementById('obsAlertThreshold');
    var threshold = Number(slider ? slider.value : 10);
    var tp=0, fp=0, tn=0, fn=0;
    for(var i=0;i<OBS_ALERT_SERIES.length;i++){
      var alerted = OBS_ALERT_SERIES[i] >= threshold;
      var isIncident = OBS_ALERT_ACTUAL[i]===1;
      if(alerted && isIncident) tp++;
      else if(alerted && !isIncident) fp++;
      else if(!alerted && isIncident) fn++;
      else tn++;
    }
    var lines = [
      'Threshold: '+threshold,
      'Time series: '+OBS_ALERT_SERIES.join(', '),
      'True positives: '+tp+'  |  False positives: '+fp,
      'True negatives: '+tn+'  |  False negatives (missed incidents): '+fn,
    ];
    if(fp>3) lines.push('At this threshold: high false-positive rate -- risk of alert fatigue.');
    if(fn>0) lines.push('At this threshold: real incident time buckets were missed.');
    if(fp<=3 && fn===0) lines.push('This threshold catches the incident with a manageable false-positive rate -- but no single threshold is universally correct for every system.');
    document.getElementById('obsAlertOutput').textContent = lines.join('\n');
  }

  // ---- Task 5: metric cardinality ----
  var OBS_LABEL_VALUES = { service: 4, endpoint: 12, status: 5, user_id: 20000 };
  window.obsCardUpdate = function(){
    var active = ['service','endpoint','status','user_id'].filter(function(l){
      var box = document.getElementById('obsCardLabel_'+l);
      return box && box.checked;
    });
    var product = 1;
    active.forEach(function(l){ product *= OBS_LABEL_VALUES[l]; });
    var formula = active.map(function(l){ return l+'('+OBS_LABEL_VALUES[l]+')'; }).join(' x ') || '(no labels active)';
    var lines = [
      'Active labels: '+(active.join(', ')||'none'),
      'Formula: '+formula+' = '+product+' time series',
      'Time-series count: '+product,
      '[Illustrative simulated cost, not real vendor pricing] Estimated storage cost: $'+(product*0.0001).toFixed(2)+'/month',
      active.indexOf('user_id')!==-1
        ? 'user_id is active -- a high-cardinality label like this can multiply time-series count by orders of magnitude.'
        : 'This is a safe, low-cardinality configuration (no unbounded label like user_id active).',
      'Note: this simulates METRIC time-series cost specifically. High-cardinality LOG fields can separately increase log indexing cost, through a different mechanism.'
    ];
    document.getElementById('obsCardOutput').textContent = lines.join('\n');
  };

  // ---- Task 6: incident diagnosis ----
  window.obsDiagCheck = function(){
    var val = document.getElementById('obsDiagSelect').value;
    var out = document.getElementById('obsDiagOutput');
    var explanations = [
      'INCORRECT -- a network outage would typically show connectivity failures across many services, not a database-specific connection pool error with matching trace/log evidence at the exact same time.',
      'CORRECT -- this is consistent with all three signals: the log names the exact mechanism (connection pool exhausted), the metric shows the exact latency jump at the same timestamp, and the trace confirms requests were specifically blocked on the database span for nearly the full request duration.',
      'INCORRECT -- a memory leak in the app server would typically show gradually rising app-server memory metrics, not a sudden latency spike isolated to the database span specifically.',
      'INCORRECT -- a DNS misconfiguration would typically cause connection failures or timeouts reaching a service entirely, not requests successfully reaching the database but waiting on its connection pool.'
    ];
    if(val === '-1'){ out.textContent = 'Choose a root cause to see the evaluation.'; return; }
    out.textContent = explanations[Number(val)];
  };

  var obsBooted = false;
  window._observabilityBoot = function(){
    if(obsBooted) return;
    obsBooted = true;
    renderObsNav();
    renderObsTask();
  };
})();
