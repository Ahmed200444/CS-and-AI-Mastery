
(function(){
  function mlopsDoneKey(id){ return 'mlops_done_'+id; }
  function mlopsIsDone(id){ try{ return localStorage.getItem(mlopsDoneKey(id))==='1'; }catch(e){ return false; } }
  window.mlopsMarkDone = function(idx){
    try{ localStorage.setItem(mlopsDoneKey(MLOPS_TASKS[idx].id), '1'); }catch(e){}
    renderMlopsNav(); renderMlopsTask();
  };

  var MLOPS_STAGES = ['dev','staging','production'];

  var MLOPS_TASKS = [
    { id:'mlops-registry-stepper', title:'Model Registry Version Stepper',
      explain:'Promote a model through dev, staging, and production in strict order -- the registry will not allow skipping a stage or promoting past production.',
      render: function(){
        return '<div class="card">'
          + '<div id="mlopsRegistryOutput" role="status" aria-live="polite" style="font-family:ui-monospace,monospace;font-size:.9rem;margin-bottom:12px"></div>'
          + '<div class="wd-row" style="gap:10px">'
            + '<button class="wd-btn" data-act="mlopsRegistryPromote()">Promote to next stage</button>'
            + '<button class="wd-btn-ghost" data-act="mlopsRegistryReset()">Reset</button>'
          + '</div>'
          + '</div>';
      }},
    { id:'mlops-drift-detector', title:'Drift Detector',
      explain:'Compare a simulated incoming data batch against a fixed baseline using a named, transparent formula (standardized mean shift) -- not an unexplained black-box score.',
      render: function(){
        return '<div class="card">'
          + '<div class="wd-row" style="gap:10px">'
            + '<button class="wd-btn-ghost" data-act="mlopsDriftCheck(0)">Check: similar batch</button>'
            + '<button class="wd-btn-ghost" data-act="mlopsDriftCheck(1)">Check: shifted batch</button>'
          + '</div>'
          + '<div id="mlopsDriftOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'mlops-canary', title:'Model Canary Rollout',
      explain:'Set a traffic allocation, then send simulated evaluated requests to a challenger model -- traffic split, champion quality, challenger quality, sample count, and evidence status are all tracked together. A tiny sample is flagged as insufficient evidence, never a green light to promote automatically.',
      render: function(){
        return '<div class="card">'
          + '<label for="mlopsCanaryTraffic" style="display:block;font-size:.85rem">Challenger traffic allocation: <span id="mlopsCanaryTrafficLabel">10</span>%</label>'
          + '<input type="range" id="mlopsCanaryTraffic" min="5" max="50" step="5" value="10" style="width:100%" data-input="mlopsCanaryTrafficUpdate()">'
          + '<div class="wd-row" style="gap:10px;margin-top:10px">'
            + '<button class="wd-btn-ghost" data-act="mlopsCanaryAdd(10,1)">Evaluate 10 requests: healthy challenger</button>'
            + '<button class="wd-btn-ghost" data-act="mlopsCanaryAdd(50,1)">Evaluate 50 more: healthy challenger</button>'
            + '<button class="wd-btn-ghost" data-act="mlopsCanaryAdd(50,0)">Evaluate 50 more: degraded challenger</button>'
            + '<button class="wd-btn-ghost" data-act="mlopsCanaryReset()">Reset</button>'
          + '</div>'
          + '<div id="mlopsCanaryOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'mlops-eval-gate', title:'Evaluation Gate',
      explain:'Check a candidate model against both an absolute limit and the current production baseline, for both a higher-is-better and a lower-is-better metric.',
      render: function(){
        return '<div class="card">'
          + '<label for="mlopsGateAccuracy" style="display:block;font-size:.85rem">Candidate accuracy (higher is better): <input type="number" step="0.01" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="mlopsGateAccuracy" value="0.91" data-change="mlopsGateCheck()"></label>'
          + '<label for="mlopsGateLatency" style="display:block;font-size:.85rem;margin-top:8px">Candidate latency ms (lower is better): <input type="number" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="mlopsGateLatency" value="250" data-change="mlopsGateCheck()"></label>'
          + '<button class="wd-btn" style="margin-top:10px" data-act="mlopsGateCheck()">Check gate</button>'
          + '<div id="mlopsGateOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.9rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'mlops-task-latency-cost', title:'Latency vs Cost Simulator',
      explain:'Pick a batch size and instance tier and see the deterministic, clearly-labeled SIMULATED trade-off -- not real cloud-provider pricing.',
      render: function(){
        return '<div class="card">'
          + '<label for="mlopsLatBatch" style="display:block;font-size:.85rem">Batch size: <input type="number" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="mlopsLatBatch" value="1" data-change="mlopsLatUpdate()"></label>'
          + '<label for="mlopsLatTier" style="display:block;font-size:.85rem;margin-top:8px">Instance tier:</label>'
          + '<select id="mlopsLatTier" class="api-method-select" style="max-width:100%;width:100%" data-change="mlopsLatUpdate()">'
            + '<option value="small">small</option><option value="medium">medium</option><option value="large">large</option>'
          + '</select>'
          + '<div id="mlopsLatOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'mlops-rollback-compat', title:'Model Rollback Compatibility',
      explain:'Check whether rolling back to a previous model version is actually safe -- distinguishing model version, input schema, preprocessing version, and feature compatibility, not just whether the model file exists.',
      render: function(){
        return '<div class="card">'
          + '<div class="wd-row" style="gap:10px">'
            + '<button class="wd-btn-ghost" data-act="mlopsRollbackCheck(0)">Check rollback: matching schema/preprocessing</button>'
            + '<button class="wd-btn-ghost" data-act="mlopsRollbackCheck(1)">Check rollback: schema changed since</button>'
          + '</div>'
          + '<div id="mlopsRollbackOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'mlops-task-quantization-tradeoff', title:'Quantization Trade-Off Simulator',
      explain:'Compare precision formats and see illustrative memory, latency, throughput, and quality-change trade-offs -- no single precision is universally correct.',
      render: function(){
        return '<div class="card">'
          + '<label for="mlopsQuantPrecision" style="display:block;font-size:.85rem;margin-bottom:6px">Precision format:</label>'
          + '<select id="mlopsQuantPrecision" class="api-method-select" style="max-width:100%;width:100%" data-change="mlopsQuantRun()">'
            + '<option value="FP32">FP32</option><option value="FP16">FP16</option><option value="BF16">BF16</option><option value="INT8">INT8</option>'
          + '</select>'
          + '<div id="mlopsQuantOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'mlops-task-inference-regression', title:'Inference Performance Regression Analyzer',
      explain:'Compare a fixed baseline and candidate serving run across TTFT, tokens per second, p95 latency, throughput, and quality -- a regression can hide in one metric while others look fine.',
      render: function(){
        return '<div class="card">'
          + '<label for="mlopsInfRegScenario" style="display:block;font-size:.85rem;margin-bottom:6px">Candidate run:</label>'
          + '<select id="mlopsInfRegScenario" class="api-method-select" style="max-width:100%;width:100%" data-change="mlopsInfRegRun()">'
            + '<option value="ttft_regress">TTFT regressed, other metrics unchanged</option>'
            + '<option value="throughput_regress">Tokens/sec regressed, other metrics unchanged</option>'
            + '<option value="improved">All measured metrics improved</option>'
            + '<option value="stable">All metrics within normal variation</option>'
            + '<option value="quality_regress">Quality regressed, performance metrics unchanged</option>'
          + '</select>'
          + '<div id="mlopsInfRegOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }}
  ];

  var mlopsCurIdx = 0;

  function renderMlopsNav(){
    var nav = document.getElementById('mlopsLessonNav');
    if(!nav) return;
    nav.innerHTML = MLOPS_TASKS.map(function(t, i){
      var done = mlopsIsDone(t.id) ? ' \u2713' : '';
      return '<button class="'+(i===mlopsCurIdx?'active':'')+'" data-act="mlopsOpen('+i+')">'+(i+1)+'. '+t.title+done+'</button>';
    }).join('');
  }
  window.mlopsOpen = function(idx){ mlopsCurIdx = idx; renderMlopsNav(); renderMlopsTask(); };
  window.mlopsNext = function(){ if(mlopsCurIdx < MLOPS_TASKS.length-1){ mlopsCurIdx++; renderMlopsNav(); renderMlopsTask(); } };
  window.mlopsPrev = function(){ if(mlopsCurIdx > 0){ mlopsCurIdx--; renderMlopsNav(); renderMlopsTask(); } };

  function renderMlopsTask(){
    var body = document.getElementById('mlopsLessonBody');
    if(!body) return;
    var t = MLOPS_TASKS[mlopsCurIdx];
    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(mlopsCurIdx+1)+t.title+'</h2></div>'
      + trackMentalModel(t.explain)
      + t.render()
      + '<div class="wd-row" style="margin-top:14px">'
        + '<button class="wd-btn-ghost" data-act="mlopsMarkDone('+mlopsCurIdx+')">Mark explored</button>'
      + '</div>'
      + '<div class="wd-navrow">'
        + (mlopsCurIdx>0 ? '<button class="wd-btn-ghost" data-act="mlopsPrev()">&larr; Previous</button>' : '<span></span>')
        + (mlopsCurIdx<MLOPS_TASKS.length-1 ? '<button class="wd-btn" data-act="mlopsNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
    if(t.id==='mlops-registry-stepper') mlopsRegistryReset();
    if(t.id==='mlops-canary') mlopsCanaryReset();
    if(t.id==='mlops-eval-gate') mlopsGateCheck();
    if(t.id==='mlops-task-latency-cost') mlopsLatUpdate();
    if(t.id==='mlops-task-quantization-tradeoff') mlopsQuantRun();
    if(t.id==='mlops-task-inference-regression') mlopsInfRegRun();
  }

  // ---- Task 1: model registry version stepper ----
  var mlopsRegistryStage;
  window.mlopsRegistryReset = function(){
    mlopsRegistryStage = 0;
    mlopsRenderRegistry();
  };
  window.mlopsRegistryPromote = function(){
    if(mlopsRegistryStage >= MLOPS_STAGES.length - 1){
      var out = document.getElementById('mlopsRegistryOutput');
      out.textContent += '\nAlready at final stage (production) -- cannot promote further.';
      return;
    }
    mlopsRegistryStage++;
    mlopsRenderRegistry();
  };
  function mlopsRenderRegistry(){
    var out = document.getElementById('mlopsRegistryOutput');
    if(!out) return;
    out.textContent = 'Model: fraud-detector-v1.4.2\nCurrent stage: '+MLOPS_STAGES[mlopsRegistryStage]+'\nTrained on: dataset-snapshot-2026-03-01\nStage history: '+MLOPS_STAGES.slice(0, mlopsRegistryStage+1).join(' -> ');
  }

  // ---- Task 2: drift detector (named, transparent: standardized mean shift) ----
  var MLOPS_BASELINE = [50, 52, 48, 51, 49, 50, 53, 47];
  function mlopsMean(vals){ return vals.reduce(function(a,b){return a+b;},0)/vals.length; }
  function mlopsDriftScore(baseline, current){
    var bMean = mlopsMean(baseline);
    var cMean = mlopsMean(current);
    var variance = baseline.reduce(function(acc,x){ return acc + Math.pow(x-bMean,2); },0) / baseline.length;
    var bStd = Math.sqrt(variance) || 0.0001;
    return Math.abs(cMean - bMean) / bStd;
  }
  window.mlopsDriftCheck = function(shiftedArg){
    var shifted = Number(shiftedArg) === 1;
    var current = shifted ? [70,72,68,71,69,73,70,74] : [51,49,50,52,48,50,51,49];
    var score = mlopsDriftScore(MLOPS_BASELINE, current);
    var lines = [
      'Baseline mean: '+mlopsMean(MLOPS_BASELINE).toFixed(1),
      'Current batch mean: '+mlopsMean(current).toFixed(1),
      'Drift score (standardized mean shift): '+score.toFixed(2),
      'Illustrative threshold used here: score > 1.0 -> flagged as drift',
      score > 1.0 ? 'Result: DRIFT DETECTED -- a warning signal worth investigating, not proof that model quality has decreased.' : 'Result: no significant drift detected by this threshold.'
    ];
    document.getElementById('mlopsDriftOutput').textContent = lines.join('\n');
  };

  // ---- Task 3: canary rollout with insufficient-evidence handling ----
  var mlopsCanarySuccess, mlopsCanaryTotal, mlopsCanaryTrafficPct;
  var MLOPS_MIN_SAMPLE = 30;
  var MLOPS_CANARY_CHAMPION_QUALITY = 0.95; // fixed champion quality metric
  window.mlopsCanaryReset = function(){
    mlopsCanarySuccess = 0; mlopsCanaryTotal = 0; mlopsCanaryTrafficPct = 10;
    var slider = document.getElementById('mlopsCanaryTraffic');
    if(slider) slider.value = '10';
    var label = document.getElementById('mlopsCanaryTrafficLabel');
    if(label) label.textContent = '10';
    mlopsRenderCanary();
  };
  window.mlopsCanaryTrafficUpdate = function(){
    var slider = document.getElementById('mlopsCanaryTraffic');
    mlopsCanaryTrafficPct = Number(slider.value);
    var label = document.getElementById('mlopsCanaryTrafficLabel');
    if(label) label.textContent = String(mlopsCanaryTrafficPct);
    mlopsRenderCanary();
  };
  window.mlopsCanaryAdd = function(countArg, healthyArg){
    var count = Number(countArg);
    var healthy = Number(healthyArg) === 1;
    var successRate = healthy ? 0.97 : 0.85; // healthy: above champion; degraded: below champion
    mlopsCanaryTotal += count;
    mlopsCanarySuccess += Math.round(count * successRate);
    mlopsRenderCanary();
  };
  function mlopsRenderCanary(){
    var out = document.getElementById('mlopsCanaryOutput');
    if(!out) return;
    if(mlopsCanaryTrafficPct === undefined) mlopsCanaryTrafficPct = 10;
    var championPct = 100 - mlopsCanaryTrafficPct;
    var lines = [
      'Champion traffic: '+championPct+'%',
      'Challenger traffic: '+mlopsCanaryTrafficPct+'%',
      'Champion quality (fixed): '+MLOPS_CANARY_CHAMPION_QUALITY
    ];
    if(mlopsCanaryTotal === 0){
      lines.push('Challenger observed quality: n/a (no requests evaluated yet)');
      lines.push('Challenger sample count: 0');
      lines.push('Evidence status: INSUFFICIENT EVIDENCE -- no requests evaluated yet');
      out.textContent = lines.join('\n');
      return;
    }
    var rate = mlopsCanarySuccess / mlopsCanaryTotal;
    lines.push('Challenger observed quality: '+rate.toFixed(3));
    lines.push('Challenger sample count: '+mlopsCanaryTotal);
    if(mlopsCanaryTotal < MLOPS_MIN_SAMPLE){
      lines.push('Evidence status: INSUFFICIENT EVIDENCE -- need at least '+MLOPS_MIN_SAMPLE+' samples before this result can be trusted.');
      lines.push('Comparison result: not available yet -- do not promote based on this sample.');
    } else {
      lines.push('Evidence status: sufficient evidence ('+MLOPS_MIN_SAMPLE+'+ samples).');
      var diff = rate - MLOPS_CANARY_CHAMPION_QUALITY;
      if(diff > 0.01){
        lines.push('Comparison result: challenger currently outperforms champion -- eligible for human review.');
      } else if(diff < -0.01){
        lines.push('Comparison result: challenger currently underperforms champion -- hold or roll back.');
      } else {
        lines.push('Comparison result: no clear difference from champion yet.');
      }
    }
    out.textContent = lines.join('\n');
  }

  // ---- Task 4: evaluation gate (both directions, baseline + absolute) ----
  var MLOPS_ACC_BASELINE = 0.93, MLOPS_ACC_MIN = 0.85;
  var MLOPS_LAT_BASELINE = 200, MLOPS_LAT_MAX = 400;
  window.mlopsGateCheck = function(){
    var acc = Number(document.getElementById('mlopsGateAccuracy').value);
    var lat = Number(document.getElementById('mlopsGateLatency').value);
    var reasons = []; var passed = true;
    if(acc < MLOPS_ACC_BASELINE){ passed = false; reasons.push('accuracy '+acc+' is worse than production baseline '+MLOPS_ACC_BASELINE); }
    if(acc < MLOPS_ACC_MIN){ passed = false; reasons.push('accuracy '+acc+' is below the absolute minimum '+MLOPS_ACC_MIN); }
    if(lat > MLOPS_LAT_BASELINE){ passed = false; reasons.push('latency '+lat+'ms is worse than production baseline '+MLOPS_LAT_BASELINE+'ms'); }
    if(lat > MLOPS_LAT_MAX){ passed = false; reasons.push('latency '+lat+'ms exceeds the absolute maximum '+MLOPS_LAT_MAX+'ms'); }
    if(reasons.length===0) reasons.push('accuracy and latency both meet baseline and absolute limits');
    document.getElementById('mlopsGateOutput').textContent = (passed?'PASSED':'FAILED')+'\n'+reasons.join('\n');
  };

  // ---- Task 5: latency vs cost (deterministic, clearly simulated) ----
  window.mlopsLatUpdate = function(){
    var batch = Math.max(1, Number(document.getElementById('mlopsLatBatch').value)||1);
    var tier = document.getElementById('mlopsLatTier').value;
    var baseLatency = {small:200, medium:100, large:50}[tier];
    var latency = baseLatency + (batch*2);
    var baseCost = {small:0.02, medium:0.08, large:0.30}[tier];
    var cost = (baseCost * (1000/batch)).toFixed(2);
    document.getElementById('mlopsLatOutput').textContent =
      '[SIMULATED, not real cloud pricing]\nEstimated latency: '+latency+'ms\nEstimated cost per 1,000 requests: $'+cost+
      '\nTrade-off: larger batches lower cost per request but add latency waiting for the batch to fill; a bigger instance tier lowers latency but costs more per hour regardless of use.';
  };

  // ---- Task 6: model rollback compatibility ----
  window.mlopsRollbackCheck = function(schemaChangedArg){
    var schemaChanged = Number(schemaChangedArg) === 1;
    var lines = ['Target model version: v1.2'];
    var issues = [];
    if(schemaChanged){
      issues.push('input schema mismatch: current pipeline produces schema_v2, target model expects schema_v1');
      issues.push('preprocessing version mismatch: current is prep_v4, target model expects prep_v3');
    }
    lines.push('Input schema check: '+(schemaChanged?'MISMATCH':'compatible'));
    lines.push('Preprocessing version check: '+(schemaChanged?'MISMATCH':'compatible'));
    lines.push('Feature availability check: compatible');
    lines.push('');
    lines.push(issues.length===0 ? 'SAFE TO ROLL BACK -- all compatibility checks passed.' : 'NOT SAFE TO ROLL BACK:\n'+issues.join('\n'));
    document.getElementById('mlopsRollbackOutput').textContent = lines.join('\n');
  };

  // ---- New task: quantization trade-off simulator ----
  var MLOPS_PRECISION_PROFILES = {
    FP32: { memoryMultiplier: 4.0, latencyMultiplier: 1.0, throughputMultiplier: 1.0, qualityChange: 'none (reference precision)' },
    FP16: { memoryMultiplier: 2.0, latencyMultiplier: 0.6, throughputMultiplier: 1.6, qualityChange: 'negligible for most models' },
    BF16: { memoryMultiplier: 2.0, latencyMultiplier: 0.6, throughputMultiplier: 1.6, qualityChange: 'negligible, often more numerically stable than FP16' },
    INT8: { memoryMultiplier: 1.0, latencyMultiplier: 0.35, throughputMultiplier: 2.8, qualityChange: 'small but measurable accuracy loss, task-dependent' }
  };
  window.mlopsQuantRun = function(){
    var precision = document.getElementById('mlopsQuantPrecision').value;
    var p = MLOPS_PRECISION_PROFILES[precision];
    var baseMemoryGb = 28;
    var memoryGb = Math.round(baseMemoryGb * (p.memoryMultiplier/4.0) * 100) / 100;
    var lines = [
      '[Illustrative estimates, not real vendor benchmarks]',
      'Precision: '+precision,
      'Estimated memory: '+memoryGb+'GB',
      'Relative latency (vs. FP32): '+p.latencyMultiplier,
      'Relative throughput (vs. FP32): '+p.throughputMultiplier,
      'Illustrative quality change: '+p.qualityChange
    ];
    document.getElementById('mlopsQuantOutput').textContent = lines.join('\n');
  };

  // ---- New task: inference performance regression analyzer ----
  var MLOPS_INFREG_BASE = { ttft:120, p95:800, tokensPerSec:45, memory:28, quality:0.91 };
  var MLOPS_INFREG_SCENARIOS = {
    ttft_regress: { ttft:180, p95:800, tokensPerSec:45, memory:28, quality:0.91 },
    throughput_regress: { ttft:120, p95:800, tokensPerSec:30, memory:28, quality:0.91 },
    improved: { ttft:90, p95:600, tokensPerSec:60, memory:28, quality:0.91 },
    stable: { ttft:122, p95:805, tokensPerSec:44, memory:28, quality:0.91 },
    quality_regress: { ttft:120, p95:800, tokensPerSec:45, memory:28, quality:0.75 }
  };
  window.mlopsInfRegRun = function(){
    var scenarioKey = document.getElementById('mlopsInfRegScenario').value;
    var cand = MLOPS_INFREG_SCENARIOS[scenarioKey];
    var base = MLOPS_INFREG_BASE;
    var issues = [], improvements = [];
    ['ttft','p95','memory'].forEach(function(m){
      var changePct = (cand[m]-base[m])/base[m]*100;
      if(changePct > 10) issues.push(m+' regressed by '+changePct.toFixed(1)+'%');
      else if(changePct < -5) improvements.push(m+' improved by '+(-changePct).toFixed(1)+'%');
    });
    ['tokensPerSec','quality'].forEach(function(m){
      var changePct = (cand[m]-base[m])/base[m]*100;
      if(changePct < -10) issues.push(m+' regressed by '+(-changePct).toFixed(1)+'%');
      else if(changePct > 5) improvements.push(m+' improved by '+changePct.toFixed(1)+'%');
    });
    var lines = [
      'Baseline -- TTFT: '+base.ttft+'ms, p95: '+base.p95+'ms, tokens/sec: '+base.tokensPerSec+', memory: '+base.memory+'GB, quality: '+base.quality,
      'Candidate -- TTFT: '+cand.ttft+'ms, p95: '+cand.p95+'ms, tokens/sec: '+cand.tokensPerSec+', memory: '+cand.memory+'GB, quality: '+cand.quality,
      ''
    ];
    if(issues.length>0){ lines.push('REGRESSION DETECTED: '+issues.join('; ')); }
    else if(improvements.length>0){ lines.push('IMPROVEMENT: '+improvements.join('; ')); }
    else { lines.push('WITHIN TOLERANCE -- no significant change.'); }
    document.getElementById('mlopsInfRegOutput').textContent = lines.join('\n');
  };

  var mlopsBooted = false;
  window._mlopsBoot = function(){
    if(mlopsBooted) return;
    mlopsBooted = true;
    renderMlopsNav();
    renderMlopsTask();
  };
})();
