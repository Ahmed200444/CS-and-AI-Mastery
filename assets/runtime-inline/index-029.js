
(function(){
  function cicdDoneKey(id){ return 'cicd_done_'+id; }
  function cicdIsDone(id){ try{ return localStorage.getItem(cicdDoneKey(id))==='1'; }catch(e){ return false; } }
  window.cicdMarkDone = function(idx){
    try{ localStorage.setItem(cicdDoneKey(CICD_TASKS[idx].id), '1'); }catch(e){}
    renderCicdNav(); renderCicdTask();
  };

  var CICD_TASKS = [
    { id:'cicd-pipeline-runner', title:'Pipeline Stage Runner',
      explain:'Toggle whether each stage passes, then run the pipeline and watch fail-fast stop everything at the first failure -- exactly as covered in the lesson.',
      render: function(){
        return '<div class="card">'
          + ['lint','build','test','deploy'].map(function(s){
              return '<label style="display:inline-block;margin-right:14px;font-size:.85rem"><input type="checkbox" id="cicdStage_'+s+'" checked> '+s+' passes</label>';
            }).join('')
          + '<div class="wd-row" style="margin-top:12px">'
            + '<button class="wd-btn" data-act="cicdRunPipeline()">&#9654; Run pipeline</button>'
          + '</div>'
          + '<div id="cicdPipelineOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.88rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'cicd-deploy-strategy', title:'Deployment Strategy Simulator',
      explain:'Pick a strategy and step through it, watching exactly which servers run the new version at each point -- the core distinction the lesson covers.',
      render: function(){
        return '<div class="card">'
          + '<label for="cicdStrategySelect" style="display:block;font-size:.85rem;margin-bottom:6px">Strategy:</label>'
          + '<select id="cicdStrategySelect" class="api-method-select" style="max-width:100%;width:100%" data-change="cicdStrategyReset()">'
            + '<option value="rolling">Rolling</option>'
            + '<option value="bluegreen">Blue-green</option>'
            + '<option value="canary">Canary</option>'
          + '</select>'
          + '<div class="wd-row" style="margin-top:10px">'
            + '<button class="wd-btn" data-act="cicdStrategyStep()">Step forward</button>'
            + '<button class="wd-btn-ghost" data-act="cicdStrategyReset()">Reset</button>'
          + '</div>'
          + '<div id="cicdStrategyOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'cicd-cache-speedup', title:'Build Cache Speedup',
      explain:'Toggle whether the dependency cache is warm or cold, and see the real difference in build time.',
      render: function(){
        return '<div class="card">'
          + '<button class="wd-btn" data-act="cicdCacheRun(0)">Run build (cold cache)</button>'
          + '<button class="wd-btn-ghost" data-act="cicdCacheRun(1)">Run build (warm cache)</button>'
          + '<div id="cicdCacheOutput" role="status" aria-live="polite" style="margin-top:14px;font-weight:700"></div>'
          + '</div>';
      }},
    { id:'cicd-rollback-sim', title:'Rollback Simulator',
      explain:'Deploy a sequence of versions, then roll back to the previous one -- and see why a schema-changing deploy needs more care than a code-only one.',
      render: function(){
        return '<div class="card">'
          + '<div class="wd-row" style="gap:10px">'
            + '<button class="wd-btn-ghost" data-act="cicdDeployVersion(0)">Deploy next version (code only)</button>'
            + '<button class="wd-btn-ghost" data-act="cicdDeployVersion(1)">Deploy next version (with schema change)</button>'
            + '<button class="wd-btn" data-act="cicdRollback()">Roll back to previous</button>'
            + '<button class="wd-btn-ghost" data-act="cicdRollbackReset()">Reset</button>'
          + '</div>'
          + '<div id="cicdRollbackOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'cicd-secrets-diagnostic', title:'Secrets Leak Diagnostic',
      explain:'Review a short pipeline snippet and decide whether it handles a secret safely.',
      render: function(){
        return '<div class="card">'
          + '<label for="cicdSecretsSelect" style="display:block;font-size:.85rem;margin-bottom:6px">Snippet:</label>'
          + '<select id="cicdSecretsSelect" class="api-method-select" style="max-width:100%;width:100%" data-change="cicdSecretsUpdate()">'
            + '<option value="0">api_key: \'sk_live_abc123\' written directly in the pipeline YAML</option>'
            + '<option value="1">api_key: ${{ secrets.API_KEY }} referencing the CI secrets store</option>'
            + '<option value="2">A debug step that prints the full environment object to the log</option>'
          + '</select>'
          + '<div id="cicdSecretsOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.9rem"></div>'
          + '</div>';
      }},
    { id:'cicd-failure-diagnostic', title:'Pipeline Failure Diagnostic',
      explain:'Given a failure symptom, decide which category it falls into -- real bug, flaky test, environment mismatch, or infrastructure.',
      render: function(){
        return '<div class="card">'
          + '<label for="cicdFailSelect" style="display:block;font-size:.85rem;margin-bottom:6px">Symptom:</label>'
          + '<select id="cicdFailSelect" class="api-method-select" style="max-width:100%;width:100%" data-change="cicdFailUpdate()">'
            + '<option value="0">Fails every single run, with the exact same error message</option>'
            + '<option value="1">Passes locally, fails in CI, no code changed</option>'
            + '<option value="2">Fails intermittently, different error each time, no code changed</option>'
            + '<option value="3">CI won\'t even start the job, times out with no output</option>'
          + '</select>'
          + '<div id="cicdFailOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.9rem"></div>'
          + '</div>';
      }}
  ];

  var cicdCurIdx = 0;

  function renderCicdNav(){
    var nav = document.getElementById('cicdLessonNav');
    if(!nav) return;
    nav.innerHTML = CICD_TASKS.map(function(t, i){
      var done = cicdIsDone(t.id) ? ' \u2713' : '';
      return '<button class="'+(i===cicdCurIdx?'active':'')+'" data-act="cicdOpen('+i+')">'+(i+1)+'. '+t.title+done+'</button>';
    }).join('');
  }
  window.cicdOpen = function(idx){ cicdCurIdx = idx; renderCicdNav(); renderCicdTask(); };
  window.cicdNext = function(){ if(cicdCurIdx < CICD_TASKS.length-1){ cicdCurIdx++; renderCicdNav(); renderCicdTask(); } };
  window.cicdPrev = function(){ if(cicdCurIdx > 0){ cicdCurIdx--; renderCicdNav(); renderCicdTask(); } };

  function renderCicdTask(){
    var body = document.getElementById('cicdLessonBody');
    if(!body) return;
    var t = CICD_TASKS[cicdCurIdx];
    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(cicdCurIdx+1)+t.title+'</h2></div>'
      + trackMentalModel(t.explain)
      + t.render()
      + '<div class="wd-row" style="margin-top:14px">'
        + '<button class="wd-btn-ghost" data-act="cicdMarkDone('+cicdCurIdx+')">Mark explored</button>'
      + '</div>'
      + '<div class="wd-navrow">'
        + (cicdCurIdx>0 ? '<button class="wd-btn-ghost" data-act="cicdPrev()">&larr; Previous</button>' : '<span></span>')
        + (cicdCurIdx<CICD_TASKS.length-1 ? '<button class="wd-btn" data-act="cicdNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
    if(t.id==='cicd-deploy-strategy') cicdStrategyReset();
    if(t.id==='cicd-rollback-sim') cicdRollbackReset();
    if(t.id==='cicd-secrets-diagnostic') cicdSecretsUpdate();
    if(t.id==='cicd-failure-diagnostic') cicdFailUpdate();
  }

  // ---- Task 1: pipeline runner (fail-fast) ----
  window.cicdRunPipeline = function(){
    var stages = ['lint','build','test','deploy'];
    var log = [];
    for(var i=0;i<stages.length;i++){
      var el = document.getElementById('cicdStage_'+stages[i]);
      var passes = el ? el.checked : true;
      if(!passes){
        log.push(stages[i]+': FAILED');
        log.push('PIPELINE STOPPED (fail-fast) -- '+stages.slice(i+1).join(', ')+' never ran');
        document.getElementById('cicdPipelineOutput').textContent = log.join('\n');
        return;
      }
      log.push(stages[i]+': passed');
    }
    log.push('PIPELINE: SUCCESS');
    document.getElementById('cicdPipelineOutput').textContent = log.join('\n');
  };

  // ---- Task 2: deployment strategy stepper ----
  var cicdStrategyState;
  window.cicdStrategyReset = function(){
    var strat = document.getElementById('cicdStrategySelect').value;
    if(strat==='rolling') cicdStrategyState = { strat:strat, servers:[0,0,0,0], step:0 };
    else if(strat==='bluegreen') cicdStrategyState = { strat:strat, blue:{v:'v1',traffic:true}, green:{v:'v2',traffic:false}, switched:false };
    else cicdStrategyState = { strat:strat, pct:0 };
    cicdRenderStrategy();
  };
  window.cicdStrategyStep = function(){
    var s = cicdStrategyState;
    if(s.strat==='rolling'){
      if(s.step < s.servers.length){ s.servers[s.step]=1; s.step++; }
    } else if(s.strat==='bluegreen'){
      if(!s.switched){ s.blue.traffic=false; s.green.traffic=true; s.switched=true; }
    } else {
      s.pct = s.pct===0?10 : s.pct===10?50 : 100;
    }
    cicdRenderStrategy();
  };
  function cicdRenderStrategy(){
    var out = document.getElementById('cicdStrategyOutput');
    if(!out) return;
    var s = cicdStrategyState;
    if(s.strat==='rolling'){
      out.textContent = 'Servers: '+s.servers.map(function(v,i){return 'server-'+i+'='+(v?'v2':'v1');}).join('  ');
    } else if(s.strat==='bluegreen'){
      out.textContent = 'blue(v1): traffic='+s.blue.traffic+'  |  green(v2): traffic='+s.green.traffic;
    } else {
      out.textContent = 'Canary traffic on new version: '+s.pct+'%  (stable: '+(100-s.pct)+'%)';
    }
  }

  // ---- Task 3: cache speedup ----
  window.cicdCacheRun = function(warmArg){
    var warm = Number(warmArg) === 1;
    var time = warm ? 5 : 120;
    document.getElementById('cicdCacheOutput').textContent = (warm?'Warm cache':'Cold cache')+' build time: '+time+' seconds';
  };

  // ---- Task 4: rollback simulator ----
  var cicdHistory, cicdSchemaChanged;
  window.cicdRollbackReset = function(){
    cicdHistory = ['v1']; cicdSchemaChanged = [false];
    cicdRenderRollback();
  };
  window.cicdDeployVersion = function(schemaArg){
    var withSchemaChange = Number(schemaArg) === 1;
    var next = 'v'+(cicdHistory.length+1);
    cicdHistory.push(next);
    cicdSchemaChanged.push(withSchemaChange);
    cicdRenderRollback();
  };
  window.cicdRollback = function(){
    var out = document.getElementById('cicdRollbackOutput');
    if(cicdHistory.length < 2){ out.textContent = 'Nothing to roll back to.'; return; }
    var rolledBackFrom = cicdHistory.pop();
    var schemaChangedOnThatDeploy = cicdSchemaChanged.pop();
    var current = cicdHistory[cicdHistory.length-1];
    var warning = schemaChangedOnThatDeploy
      ? '\nWARNING: that deploy included a schema change -- rolling back the CODE only is not automatically safe unless the migration was backward-compatible.'
      : '\nSafe: that deploy was code-only, so rolling back is straightforward.';
    out.textContent = 'Rolled back from '+rolledBackFrom+' to '+current+'.'+warning;
  };
  function cicdRenderRollback(){
    var out = document.getElementById('cicdRollbackOutput');
    if(out) out.textContent = 'Deploy history: '+cicdHistory.map(function(v,i){return v+(cicdSchemaChanged[i]?'(schema change)':'');}).join(' -> ');
  }

  // ---- Task 5: secrets diagnostic ----
  window.cicdSecretsUpdate = function(){
    var idx = Number(document.getElementById('cicdSecretsSelect').value);
    var answers = [
      'UNSAFE -- this hard-codes the secret directly in a version-controlled file, permanently visible in git history to anyone with repo access.',
      'SAFE -- this references the CI platform\'s secrets store, injected at runtime and masked in logs.',
      'UNSAFE -- even if secrets are stored correctly elsewhere, printing the full environment object can leak them into log output.'
    ];
    document.getElementById('cicdSecretsOutput').textContent = answers[idx];
  };

  // ---- Task 6: failure category diagnostic ----
  window.cicdFailUpdate = function(){
    var idx = Number(document.getElementById('cicdFailSelect').value);
    var answers = [
      'Likely a genuine code/test failure -- read the actual error message first; the pipeline is probably correctly catching a real problem.',
      'Likely an environment mismatch -- check for a missing dependency or different tool/language version between local and CI.',
      'Likely a flaky test -- check for timing assumptions or shared state between tests, rather than assuming the code itself is broken.',
      'Likely an infrastructure issue -- the CI service, network access, or a third-party dependency may be unavailable, rather than anything in the code.'
    ];
    document.getElementById('cicdFailOutput').textContent = answers[idx];
  };

  var cicdBooted = false;
  window._cicdBoot = function(){
    if(cicdBooted) return;
    cicdBooted = true;
    renderCicdNav();
    renderCicdTask();
  };
})();
