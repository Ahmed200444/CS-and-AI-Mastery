
(function(){
  function dengDoneKey(id){ return 'deng_done_'+id; }
  function dengIsDone(id){ try{ return localStorage.getItem(dengDoneKey(id))==='1'; }catch(e){ return false; } }
  window.dengMarkDone = function(idx){
    try{ localStorage.setItem(dengDoneKey(DENG_TASKS[idx].id), '1'); }catch(e){}
    renderDengNav(); renderDengTask();
  };

  var DENG_TASKS = [
    { id:'deng-task-etl-elt-builder', title:'ETL / ELT Pipeline Builder',
      explain:'Choose ETL or ELT for a fixed scenario, then build the correct step order. ELT loads raw data before transforming it -- extract does not always precede every other step.',
      render: function(){
        return '<div class="card">'
          + '<label for="dengArchSelect" style="display:block;font-size:.85rem;margin-bottom:6px">Scenario:</label>'
          + '<select id="dengArchSelect" class="api-method-select" style="max-width:100%;width:100%" data-change="dengEtlRenderSteps()">'
            + '<option value="0">Strict governance: only validated data may ever enter the shared warehouse</option>'
            + '<option value="1">Flexible reprocessing: raw data should be preserved, warehouse compute is cheap</option>'
          + '</select>'
          + '<div style="margin-top:12px;font-size:.85rem">Architecture: <select id="dengArchChoice" class="api-method-select" style="max-width:200px;display:inline-block" data-change="dengEtlCheck()">'
            + '<option value="">-- choose --</option><option value="ETL">ETL</option><option value="ELT">ELT</option></select></div>'
          + '<div style="margin-top:12px;font-size:.85rem">Step order: '
            + '<select id="dengStep1" class="api-method-select" style="max-width:150px;display:inline-block" data-change="dengEtlCheck()"><option value="">1st</option><option value="extract">extract</option><option value="transform">transform</option><option value="load">load</option></select> '
            + '<select id="dengStep2" class="api-method-select" style="max-width:150px;display:inline-block" data-change="dengEtlCheck()"><option value="">2nd</option><option value="extract">extract</option><option value="transform">transform</option><option value="load">load</option></select> '
            + '<select id="dengStep3" class="api-method-select" style="max-width:150px;display:inline-block" data-change="dengEtlCheck()"><option value="">3rd</option><option value="extract">extract</option><option value="transform">transform</option><option value="load">load</option></select>'
          + '</div>'
          + '<button class="wd-btn-ghost" style="margin-top:10px" data-act="dengEtlReset()">Reset</button>'
          + '<div id="dengEtlOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'deng-task-batch-streaming', title:'Batch vs. Streaming Decision Simulator',
      explain:'Given a fixed scenario\'s latency tolerance, choose the processing approach that actually fits -- there is no single universal answer across all scenarios.',
      render: function(){
        return '<div class="card">'
          + '<label for="dengBSScenario" style="display:block;font-size:.85rem;margin-bottom:6px">Scenario:</label>'
          + '<select id="dengBSScenario" class="api-method-select" style="max-width:100%;width:100%" data-change="dengBSReset()">'
            + '<option value="0">Nightly recommendation-model training data (24h tolerance)</option>'
            + '<option value="1">Real-time fraud-detection feature (sub-second tolerance)</option>'
            + '<option value="2">Analytics dashboard (5-minute tolerance)</option>'
            + '<option value="3">Ambiguous scenario with conflicting requirements</option>'
          + '</select>'
          + '<label for="dengBSChoice" style="display:block;font-size:.85rem;margin-top:10px">Best approach:</label>'
          + '<select id="dengBSChoice" class="api-method-select" style="max-width:100%;width:100%" data-change="dengBSCheck()">'
            + '<option value="">-- choose --</option><option value="scheduled batch">scheduled batch</option><option value="micro-batch">micro-batch</option><option value="continuous streaming">continuous streaming</option><option value="insufficient information">insufficient information / several designs reasonable</option>'
          + '</select>'
          + '<button class="wd-btn-ghost" style="margin-top:10px" data-act="dengBSReset()">Reset</button>'
          + '<div id="dengBSOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'deng-task-dag-orchestration', title:'DAG / Orchestration Dependency Simulator',
      explain:'A fixed pipeline: ingest -> validate -> transform -> feature_build -> publish, plus an independent audit_log task. Fail a step and see exactly which downstream tasks get skipped -- not every dependent always retries automatically.',
      render: function(){
        return '<div class="card">'
          + '<div class="wd-row" style="gap:10px;flex-wrap:wrap">'
            + '<button class="wd-btn" data-act="dengDagRun(-1)">Run: all succeed</button>'
            + '<button class="wd-btn-ghost" data-act="dengDagRun(0)">Fail: ingest</button>'
            + '<button class="wd-btn-ghost" data-act="dengDagRun(1)">Fail: validate</button>'
            + '<button class="wd-btn-ghost" data-act="dengDagRun(2)">Fail: transform</button>'
          + '</div>'
          + '<div id="dengDagOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'deng-task-quality-validator', title:'Data-Quality Validation Tool',
      explain:'A fixed 6-record sample contains a null, a wrong type, an out-of-range value, a duplicate key, a referential-integrity failure, and one valid record. Toggle rules on and off to see exactly what each one catches.',
      render: function(){
        return '<div class="card">'
          + ['null:Null check','type:Type check','range:Range check','unique:Uniqueness check','referential:Referential integrity check'].map(function(spec){
              var parts = spec.split(':');
              return '<label style="display:block;font-size:.85rem;margin-top:4px"><input type="checkbox" id="dengRule_'+parts[0]+'" checked data-change="dengQualityRun()"> '+parts[1]+'</label>';
            }).join('')
          + '<button class="wd-btn-ghost" style="margin-top:10px" data-act="dengQualityReset()">Reset</button>'
          + '<div id="dengQualityOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.82rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'deng-task-partitioning', title:'Partitioning / Query-Efficiency Simulator',
      explain:'Choose a partitioning key and a query filter -- see exactly how many partitions get scanned. A high-cardinality key like customer_id is not automatically better.',
      render: function(){
        return '<div class="card">'
          + '<label for="dengPartKey" style="display:block;font-size:.85rem">Partitioning key:</label>'
          + '<select id="dengPartKey" class="api-method-select" style="max-width:100%;width:100%" data-change="dengPartRun()">'
            + '<option value="event_date">event_date (365 partitions)</option><option value="region">region (5 partitions)</option><option value="customer_id">customer_id (5,000,000 partitions)</option>'
          + '</select>'
          + '<label for="dengPartQuery" style="display:block;font-size:.85rem;margin-top:8px">Query filters on:</label>'
          + '<select id="dengPartQuery" class="api-method-select" style="max-width:100%;width:100%" data-change="dengPartRun()">'
            + '<option value="event_date">event_date</option><option value="region">region</option><option value="customer_id">customer_id</option>'
          + '</select>'
          + '<div id="dengPartOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'deng-task-feature-consistency', title:'Feature Pipeline Consistency Simulator',
      explain:'Compare a fixed offline and online feature definition across formula, source, transformation version, freshness, and point-in-time correctness -- a matching displayed value is not proof of true consistency.',
      render: function(){
        return '<div class="card">'
          + '<label for="dengFeatScenario" style="display:block;font-size:.85rem;margin-bottom:6px">Scenario:</label>'
          + '<select id="dengFeatScenario" class="api-method-select" style="max-width:100%;width:100%" data-change="dengFeatCheck()">'
            + '<option value="0">Fully consistent definitions</option>'
            + '<option value="1">Formula mismatch (30-day vs 30-hour average)</option>'
            + '<option value="2">Transformation-version mismatch</option>'
            + '<option value="3">Stale online feature (exceeds freshness SLA)</option>'
            + '<option value="4">Point-in-time leakage in offline feature</option>'
            + '<option value="5">Missing online feature value</option>'
          + '</select>'
          + '<div id="dengFeatOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }}
  ];

  var dengCurIdx = 0;

  function renderDengNav(){
    var nav = document.getElementById('dengLessonNav');
    if(!nav) return;
    nav.innerHTML = DENG_TASKS.map(function(t, i){
      var done = dengIsDone(t.id) ? ' \u2713' : '';
      return '<button class="'+(i===dengCurIdx?'active':'')+'" data-act="dengOpen('+i+')">'+(i+1)+'. '+t.title+done+'</button>';
    }).join('');
  }
  window.dengOpen = function(idx){ dengCurIdx = idx; renderDengNav(); renderDengTask(); };
  window.dengNext = function(){ if(dengCurIdx < DENG_TASKS.length-1){ dengCurIdx++; renderDengNav(); renderDengTask(); } };
  window.dengPrev = function(){ if(dengCurIdx > 0){ dengCurIdx--; renderDengNav(); renderDengTask(); } };

  function renderDengTask(){
    var body = document.getElementById('dengLessonBody');
    if(!body) return;
    var t = DENG_TASKS[dengCurIdx];
    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(dengCurIdx+1)+t.title+'</h2></div>'
      + trackMentalModel(t.explain)
      + t.render()
      + '<div class="wd-row" style="margin-top:14px">'
        + '<button class="wd-btn-ghost" data-act="dengMarkDone('+dengCurIdx+')">Mark explored</button>'
      + '</div>'
      + '<div class="wd-navrow">'
        + (dengCurIdx>0 ? '<button class="wd-btn-ghost" data-act="dengPrev()">&larr; Previous</button>' : '<span></span>')
        + (dengCurIdx<DENG_TASKS.length-1 ? '<button class="wd-btn" data-act="dengNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
    if(t.id==='deng-task-etl-elt-builder') dengEtlReset();
    if(t.id==='deng-task-batch-streaming') dengBSReset();
    if(t.id==='deng-task-quality-validator') dengQualityRun();
    if(t.id==='deng-task-partitioning') dengPartRun();
    if(t.id==='deng-task-feature-consistency') dengFeatCheck();
  }

  // ---- Task 1: ETL/ELT pipeline builder ----
  var DENG_ARCH_SCENARIOS = ['ETL','ELT'];
  window.dengEtlReset = function(){
    document.getElementById('dengArchChoice').value = '';
    ['dengStep1','dengStep2','dengStep3'].forEach(function(id){ document.getElementById(id).value = ''; });
    document.getElementById('dengEtlOutput').textContent = '';
  };
  window.dengEtlRenderSteps = function(){ dengEtlReset(); };
  window.dengEtlCheck = function(){
    var scenario = Number(document.getElementById('dengArchSelect').value);
    var expectedArch = DENG_ARCH_SCENARIOS[scenario];
    var chosenArch = document.getElementById('dengArchChoice').value;
    var steps = [document.getElementById('dengStep1').value, document.getElementById('dengStep2').value, document.getElementById('dengStep3').value];
    var out = document.getElementById('dengEtlOutput');
    if(!chosenArch || steps.some(function(s){return !s;})){ out.textContent = ''; return; }
    var expectedOrder = chosenArch==='ETL' ? ['extract','transform','load'] : ['extract','load','transform'];
    var orderCorrect = JSON.stringify(steps) === JSON.stringify(expectedOrder);
    var archCorrect = chosenArch === expectedArch;
    var lines = [];
    if(archCorrect){
      lines.push('Architecture choice: correct -- '+chosenArch+' fits this scenario.');
    } else {
      lines.push('Architecture choice: reconsider -- this scenario fits '+expectedArch+' better ('+(expectedArch==='ETL'?'strict governance requires only validated data ever landing in storage':'flexible reprocessing benefits from preserving raw data and pushing transformation into the warehouse')+').');
    }
    if(orderCorrect){
      lines.push('Step order: correct for '+chosenArch+' ('+expectedOrder.join(' -> ')+').');
    } else {
      lines.push('Step order: incorrect -- '+chosenArch+' requires '+expectedOrder.join(' -> ')+'. Note: ELT loads raw data BEFORE transforming it -- extract does not always precede every other step in a fixed sense.');
    }
    out.textContent = lines.join('\n');
  };

  // ---- Task 2: batch vs streaming decision ----
  var DENG_BS_ANSWERS = ['scheduled batch','continuous streaming','micro-batch','insufficient information'];
  window.dengBSReset = function(){
    document.getElementById('dengBSChoice').value = '';
    document.getElementById('dengBSOutput').textContent = '';
  };
  window.dengBSCheck = function(){
    var scenario = Number(document.getElementById('dengBSScenario').value);
    var choice = document.getElementById('dengBSChoice').value;
    var out = document.getElementById('dengBSOutput');
    if(!choice){ out.textContent = ''; return; }
    var expected = DENG_BS_ANSWERS[scenario];
    if(scenario === 3){
      out.textContent = choice === 'insufficient information' ? 'Correct -- this scenario has conflicting requirements; several designs could reasonably fit, and claiming one universal answer would be dishonest.' : 'Reconsider -- this scenario\'s requirements genuinely conflict; no single approach is clearly correct here without more information.';
      return;
    }
    if(choice === expected){
      out.textContent = 'Correct -- '+expected+' fits this scenario\'s latency tolerance and operational trade-offs.';
    } else {
      out.textContent = 'Reconsider -- '+expected+' fits better here, based on this scenario\'s specific latency tolerance. This is not a universal ranking; a different scenario could favor a different approach.';
    }
  };

  // ---- Task 3: DAG orchestration ----
  var DENG_DAG_STEPS = ['ingest','validate','transform','feature_build','publish'];
  window.dengDagRun = function(failIdxArg){
    var failIdx = Number(failIdxArg);
    var lines = [];
    var failed = false;
    DENG_DAG_STEPS.forEach(function(step, i){
      if(i === failIdx){ lines.push(step+': FAILED'); failed = true; }
      else if(failed){ lines.push(step+': SKIPPED (upstream dependency failed)'); }
      else{ lines.push(step+': SUCCESS'); }
    });
    lines.push('audit_log: SUCCESS (independent task -- no dependency on the main chain, unaffected by any failure above)');
    document.getElementById('dengDagOutput').textContent = lines.join('\n');
  };

  // ---- Task 4: data quality validator ----
  var DENG_QUALITY_RECORDS = [
    {id:1, age:30, region:'US'}, {id:2, age:null, region:'EU'}, {id:3, age:'thirty', region:'US'},
    {id:4, age:250, region:'US'}, {id:1, age:22, region:'US'}, {id:6, age:40, region:'MARS'}
  ];
  var DENG_VALID_REGIONS = ['US','EU','APAC'];
  window.dengQualityReset = function(){
    ['null','type','range','unique','referential'].forEach(function(r){ document.getElementById('dengRule_'+r).checked = true; });
    dengQualityRun();
  };
  window.dengQualityRun = function(){
    var rules = {};
    ['null','type','range','unique','referential'].forEach(function(r){ rules[r] = document.getElementById('dengRule_'+r).checked; });
    var issues = [];
    var seenIds = {};
    DENG_QUALITY_RECORDS.forEach(function(r){
      if(rules.null && r.age===null) issues.push('record id='+r.id+': null age (would be MISSED if null check disabled)');
      if(rules.type && typeof r.age !== 'number' && r.age !== null) issues.push('record id='+r.id+': wrong type for age ("'+r.age+'")');
      if(rules.range && typeof r.age === 'number' && (r.age < 0 || r.age > 120)) issues.push('record id='+r.id+': age out of range ('+r.age+')');
      if(rules.unique){ if(seenIds[r.id]) issues.push('record id='+r.id+': duplicate primary key'); seenIds[r.id] = true; }
      if(rules.referential && DENG_VALID_REGIONS.indexOf(r.region)===-1) issues.push('record id='+r.id+': invalid region "'+r.region+'" (referential integrity failure)');
    });
    var lines = ['Dataset-level: 6 records, 1 fully valid record (id=1 first occurrence, before duplicate)', '', 'Row-level issues detected with current rules:'];
    if(issues.length===0) lines.push('(none -- all rules disabled or no issues match enabled rules)');
    else issues.forEach(function(i){ lines.push('- '+i); });
    document.getElementById('dengQualityOutput').textContent = lines.join('\n');
  };

  // ---- Task 5: partitioning simulator ----
  var DENG_PARTITION_COUNTS = { event_date: 365, region: 5, customer_id: 5000000 };
  window.dengPartRun = function(){
    var key = document.getElementById('dengPartKey').value;
    var queryFilter = document.getElementById('dengPartQuery').value;
    var total = DENG_PARTITION_COUNTS[key];
    var scanned = key === queryFilter ? 1 : total;
    var pct = (scanned/total*100).toFixed(2);
    var lines = [
      'Partitioning key: '+key+' ('+total.toLocaleString()+' partitions)',
      'Query filters on: '+queryFilter,
      'Partitions scanned: '+scanned.toLocaleString()+' of '+total.toLocaleString()+' ('+pct+'%)',
      key === queryFilter ? 'Partition pruning: ACTIVE -- the query key matches the partition key, so irrelevant partitions are skipped entirely.' : 'Partition pruning: NOT possible -- the query filters on a different field than the partition key, so the full scan is required.',
      '[Illustrative estimate, not real vendor pricing]'
    ];
    if(key === 'customer_id'){
      lines.push('WARNING: over-partitioning risk -- 5,000,000 partitions on an extremely high-cardinality key can cause the small-file problem, hurting performance rather than helping it.');
    }
    document.getElementById('dengPartOutput').textContent = lines.join('\n');
  };

  // ---- Task 6: feature pipeline consistency ----
  window.dengFeatCheck = function(){
    var scenario = Number(document.getElementById('dengFeatScenario').value);
    var explanations = [
      'CONSISTENT -- formula, source, transformation version, freshness, and point-in-time correctness all match between offline and online paths.',
      'MISMATCH: formula -- offline computes a 30-day average, online computes a 30-hour average under the same feature name. This is training/serving skew: the model was trained on one definition and served a different one, likely degrading production performance.',
      'MISMATCH: transformation version -- offline uses transformation v2, online still uses v1. Even with the same nominal formula, a version drift like this can silently produce different values.',
      'MISMATCH: freshness -- the online feature\'s staleness exceeds its freshness SLA, meaning inference may be acting on outdated data even though the feature technically exists.',
      'MISMATCH: point-in-time leakage -- the offline feature uses data that would not have existed yet at the training example\'s actual point in time, artificially inflating apparent training performance that will not hold in production.',
      'MISMATCH: missing online feature -- the online path has no value for this feature at serving time, meaning inference cannot use it even though it was present during training.'
    ];
    document.getElementById('dengFeatOutput').textContent = explanations[scenario];
  };

  var dengBooted = false;
  window._dataEngineeringBoot = function(){
    if(dengBooted) return;
    dengBooted = true;
    renderDengNav();
    renderDengTask();
  };
})();
