
(function(){
  function aisdDoneKey(id){ return 'aisd_done_'+id; }
  function aisdIsDone(id){ try{ return localStorage.getItem(aisdDoneKey(id))==='1'; }catch(e){ return false; } }
  window.aisdMarkDone = function(idx){
    try{ localStorage.setItem(aisdDoneKey(AISD_TASKS[idx].id), '1'); }catch(e){}
    renderAisdNav(); renderAisdTask();
  };

  var AISD_TASKS = [
    { id:'aisd-task-architecture-builder', title:'AI Architecture Builder',
      explain:'Given a fixed requirement, choose the approach that actually fits -- prompting, RAG, fine-tuning, or traditional ML -- based on stated criteria, not preference.',
      render: function(){
        return '<div class="card">'
          + '<label for="aisdArchScenario" style="display:block;font-size:.85rem;margin-bottom:6px">Requirement:</label>'
          + '<select id="aisdArchScenario" class="api-method-select" style="max-width:100%;width:100%" data-change="aisdArchReset()">'
            + '<option value="0">Needs current, frequently-changing facts; model behavior itself is fine as-is</option>'
            + '<option value="1">Needs the model behavior itself changed (tone/format); large labeled dataset exists</option>'
            + '<option value="2">Neither current facts nor behavior change needed; general capability is enough</option>'
            + '<option value="3">Narrow, well-defined prediction task; huge labeled dataset; strict latency requirement</option>'
          + '</select>'
          + '<label for="aisdArchChoice" style="display:block;font-size:.85rem;margin-top:10px">Best approach:</label>'
          + '<select id="aisdArchChoice" class="api-method-select" style="max-width:100%;width:100%" data-change="aisdArchCheck()">'
            + '<option value="">-- choose --</option><option value="prompting">prompting</option><option value="RAG">RAG</option><option value="fine-tuning">fine-tuning</option><option value="traditional ML">traditional ML</option>'
          + '</select>'
          + '<div id="aisdArchOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'aisd-task-hosted-vs-selfhosted', title:'Hosted vs Self-Hosted Trade-off Simulator',
      explain:'Adjust four factors and see a transparent score for hosted vs self-hosted -- no single factor decides this alone.',
      render: function(){
        return '<div class="card">'
          + '<label style="display:block;font-size:.85rem"><input type="checkbox" id="aisdHostSensitive" data-change="aisdHostUpdate()"> High data sensitivity</label>'
          + '<label style="display:block;font-size:.85rem;margin-top:6px"><input type="checkbox" id="aisdHostHighVolume" data-change="aisdHostUpdate()"> Very high sustained request volume</label>'
          + '<label style="display:block;font-size:.85rem;margin-top:6px"><input type="checkbox" id="aisdHostMlopsTeam" checked data-change="aisdHostUpdate()"> Dedicated MLOps team available</label>'
          + '<label style="display:block;font-size:.85rem;margin-top:6px"><input type="checkbox" id="aisdHostTightLatency" data-change="aisdHostUpdate()"> Very tight latency requirement (under 50ms)</label>'
          + '<div id="aisdHostOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'aisd-task-token-budget', title:'Token/Context-Budget Simulator',
      explain:'Allocate a fixed token budget across the system prompt, conversation history, retrieved context, and the query -- see exactly what gets truncated when it does not fit.',
      render: function(){
        return '<div class="card">'
          + '<label for="aisdBudgetTotal" style="display:block;font-size:.85rem">Total budget (tokens): <input type="number" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="aisdBudgetTotal" value="4000" data-change="aisdBudgetUpdate()"></label>'
          + '<label for="aisdBudgetHistory" style="display:block;font-size:.85rem;margin-top:8px">Conversation history (tokens): <input type="number" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="aisdBudgetHistory" value="1000" data-input="aisdBudgetUpdate()"></label>'
          + '<label for="aisdBudgetRetrieved" style="display:block;font-size:.85rem;margin-top:8px">Retrieved context (tokens): <input type="number" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="aisdBudgetRetrieved" value="2000" data-input="aisdBudgetUpdate()"></label>'
          + '<div id="aisdBudgetOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'aisd-task-failure-fallback', title:'AI-Specific Failure &amp; Fallback Simulator',
      explain:'Pick an AI-specific failure mode and see the appropriate fallback -- deliberately different from a generic circuit breaker, since some of these produce no error signal at all.',
      render: function(){
        return '<div class="card">'
          + '<label for="aisdFailureSelect" style="display:block;font-size:.85rem;margin-bottom:6px">Failure mode:</label>'
          + '<select id="aisdFailureSelect" class="api-method-select" style="max-width:100%;width:100%" data-change="aisdFailureCheck()">'
            + '<option value="malformed_output">Model returns malformed output</option>'
            + '<option value="timeout">Model call times out</option>'
            + '<option value="rate_limited">Provider rate-limits the request</option>'
            + '<option value="silent_quality_degradation">Model returns successfully but content quality has silently degraded</option>'
            + '<option value="provider_outage">Provider is completely unavailable</option>'
          + '</select>'
          + '<div id="aisdFailureOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'aisd-task-human-in-loop', title:'Human-in-the-Loop Decision Tool',
      explain:'Given stakes, reversibility, and model confidence, decide whether full automation, mandatory human review, or confidence-based routing is appropriate.',
      render: function(){
        return '<div class="card">'
          + '<label for="aisdHitlStakes" style="display:block;font-size:.85rem">Stakes:</label>'
          + '<select id="aisdHitlStakes" class="api-method-select" style="max-width:100%;width:100%" data-change="aisdHitlCheck()"><option value="high">high</option><option value="low">low</option><option value="medium">medium</option></select>'
          + '<label for="aisdHitlReversibility" style="display:block;font-size:.85rem;margin-top:8px">Reversibility:</label>'
          + '<select id="aisdHitlReversibility" class="api-method-select" style="max-width:100%;width:100%" data-change="aisdHitlCheck()"><option value="irreversible">irreversible</option><option value="reversible">reversible</option></select>'
          + '<label for="aisdHitlConfidence" style="display:block;font-size:.85rem;margin-top:8px">Model confidence:</label>'
          + '<select id="aisdHitlConfidence" class="api-method-select" style="max-width:100%;width:100%" data-change="aisdHitlCheck()"><option value="high">high</option><option value="low">low</option></select>'
          + '<div id="aisdHitlOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'aisd-task-scaling-capacity', title:'Scaling/Capacity Simulator for AI Workloads',
      explain:'Adjust request volume, batch size, and instance count -- see how batching economics and queueing interact specifically for expensive AI inference.',
      render: function(){
        return '<div class="card">'
          + '<label for="aisdScaleRps" style="display:block;font-size:.85rem">Requests per second: <input type="number" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="aisdScaleRps" value="50" data-input="aisdScaleUpdate()"></label>'
          + '<label for="aisdScaleBatch" style="display:block;font-size:.85rem;margin-top:8px">Batch size: <input type="number" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="aisdScaleBatch" value="4" data-input="aisdScaleUpdate()"></label>'
          + '<label for="aisdScaleInstances" style="display:block;font-size:.85rem;margin-top:8px">Instance count: <input type="number" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="aisdScaleInstances" value="1" data-input="aisdScaleUpdate()"></label>'
          + '<div id="aisdScaleOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }}
  ];

  var aisdCurIdx = 0;

  function renderAisdNav(){
    var nav = document.getElementById('aisdLessonNav');
    if(!nav) return;
    nav.innerHTML = AISD_TASKS.map(function(t, i){
      var done = aisdIsDone(t.id) ? ' \u2713' : '';
      return '<button class="'+(i===aisdCurIdx?'active':'')+'" data-act="aisdOpen('+i+')">'+(i+1)+'. '+t.title+done+'</button>';
    }).join('');
  }
  window.aisdOpen = function(idx){ aisdCurIdx = idx; renderAisdNav(); renderAisdTask(); };
  window.aisdNext = function(){ if(aisdCurIdx < AISD_TASKS.length-1){ aisdCurIdx++; renderAisdNav(); renderAisdTask(); } };
  window.aisdPrev = function(){ if(aisdCurIdx > 0){ aisdCurIdx--; renderAisdNav(); renderAisdTask(); } };

  function renderAisdTask(){
    var body = document.getElementById('aisdLessonBody');
    if(!body) return;
    var t = AISD_TASKS[aisdCurIdx];
    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(aisdCurIdx+1)+t.title+'</h2></div>'
      + trackMentalModel(t.explain)
      + t.render()
      + '<div class="wd-row" style="margin-top:14px">'
        + '<button class="wd-btn-ghost" data-act="aisdMarkDone('+aisdCurIdx+')">Mark explored</button>'
      + '</div>'
      + '<div class="wd-navrow">'
        + (aisdCurIdx>0 ? '<button class="wd-btn-ghost" data-act="aisdPrev()">&larr; Previous</button>' : '<span></span>')
        + (aisdCurIdx<AISD_TASKS.length-1 ? '<button class="wd-btn" data-act="aisdNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
    if(t.id==='aisd-task-architecture-builder') aisdArchReset();
    if(t.id==='aisd-task-hosted-vs-selfhosted') aisdHostUpdate();
    if(t.id==='aisd-task-token-budget') aisdBudgetUpdate();
    if(t.id==='aisd-task-failure-fallback') aisdFailureCheck();
    if(t.id==='aisd-task-human-in-loop') aisdHitlCheck();
    if(t.id==='aisd-task-scaling-capacity') aisdScaleUpdate();
  }

  // ---- Task 1: AI architecture builder ----
  window.aisdArchReset = function(){
    document.getElementById('aisdArchChoice').value = '';
    document.getElementById('aisdArchOutput').textContent = '';
  };
  window.aisdArchCheck = function(){
    var scenario = Number(document.getElementById('aisdArchScenario').value);
    var choice = document.getElementById('aisdArchChoice').value;
    var out = document.getElementById('aisdArchOutput');
    if(!choice){ out.textContent = ''; return; }
    var expected = ['RAG', 'fine-tuning', 'prompting', 'traditional ML'][scenario];
    if(choice === expected){
      out.textContent = 'Correct -- '+expected+' fits this requirement based on the stated criteria.';
    } else {
      out.textContent = 'Reconsider -- '+expected+' fits this specific requirement better, based on the stated criteria. This is not a fixed preference ranking; a different requirement could favor a different approach.';
    }
  };

  // ---- Task 2: hosted vs self-hosted ----
  window.aisdHostUpdate = function(){
    var sensitive = document.getElementById('aisdHostSensitive').checked;
    var highVolume = document.getElementById('aisdHostHighVolume').checked;
    var mlopsTeam = document.getElementById('aisdHostMlopsTeam').checked;
    var tightLatency = document.getElementById('aisdHostTightLatency').checked;
    var scoreHosted = 0, scoreSelf = 0;
    var reasons = [];
    if(sensitive){ scoreSelf += 2; reasons.push('high data sensitivity favors self-hosting'); }
    else { scoreHosted += 1; reasons.push('lower data sensitivity makes a hosted API acceptable'); }
    if(highVolume){ scoreSelf += 1; reasons.push('very high sustained volume can favor self-hosting cost-wise'); }
    else { scoreHosted += 1; reasons.push('lower volume favors hosted (no idle infrastructure cost)'); }
    if(!mlopsTeam){ scoreHosted += 2; reasons.push('no dedicated MLOps team makes self-hosting operationally risky'); }
    if(tightLatency){ scoreSelf += 1; reasons.push('very tight latency favors self-hosted (no network hop to a third party)'); }
    var recommendation = scoreSelf > scoreHosted ? 'self-hosted' : 'hosted API';
    var lines = ['Recommendation: '+recommendation, 'Score -- hosted: '+scoreHosted+', self-hosted: '+scoreSelf, '', 'Reasoning:'].concat(reasons.map(function(r){ return '- '+r; }));
    document.getElementById('aisdHostOutput').textContent = lines.join('\n');
  };

  // ---- Task 3: token/context budget ----
  window.aisdBudgetUpdate = function(){
    var total = Number(document.getElementById('aisdBudgetTotal').value);
    var history = Number(document.getElementById('aisdBudgetHistory').value);
    var retrieved = Number(document.getElementById('aisdBudgetRetrieved').value);
    var systemPrompt = 200, query = 100; // protected, fixed
    var used = systemPrompt + history + retrieved + query;
    var overflow = Math.max(0, used - total);
    var lines = [
      'System prompt (protected): '+systemPrompt+' tokens',
      'Query (protected): '+query+' tokens',
      'Conversation history: '+history+' tokens',
      'Retrieved context: '+retrieved+' tokens',
      'Total used: '+used+' of '+total+' budget'
    ];
    if(overflow > 0){
      var remaining = overflow;
      var historyCut = Math.min(history, remaining);
      remaining -= historyCut;
      var retrievedCut = Math.min(retrieved, remaining);
      lines.push('', 'OVERFLOW by '+overflow+' tokens -- truncation applied (history first, then retrieved context; system prompt and query protected):');
      if(historyCut > 0) lines.push('- conversation history truncated by '+historyCut+' tokens');
      if(retrievedCut > 0) lines.push('- retrieved context truncated by '+retrievedCut+' tokens');
    } else {
      lines.push('', 'Fits within budget -- no truncation needed.');
    }
    document.getElementById('aisdBudgetOutput').textContent = lines.join('\n');
  };

  // ---- Task 4: AI-specific failure and fallback ----
  window.aisdFailureCheck = function(){
    var failure = document.getElementById('aisdFailureSelect').value;
    var map = {
      malformed_output: 'Fallback: retry once with a stricter output-format instruction, then fall back to a simpler deterministic response if it still fails.',
      timeout: 'Fallback: retry with backoff, then fall back to a cached or simpler response if retries are exhausted.',
      rate_limited: 'Fallback: back off per the providers rate-limit signal and queue the request rather than dropping it.',
      silent_quality_degradation: 'Fallback: this produces no error or timeout signal at all -- requires a dedicated evaluation/quality-check layer, not a generic circuit breaker, to detect and then route to a simpler model or human review.',
      provider_outage: 'Fallback: fail over to a secondary provider or a cached response; never silently return an empty result.'
    };
    document.getElementById('aisdFailureOutput').textContent = map[failure];
  };

  // ---- Task 5: human-in-the-loop ----
  window.aisdHitlCheck = function(){
    var stakes = document.getElementById('aisdHitlStakes').value;
    var reversibility = document.getElementById('aisdHitlReversibility').value;
    var confidence = document.getElementById('aisdHitlConfidence').value;
    var out = document.getElementById('aisdHitlOutput');
    var decision;
    if(stakes === 'high' && reversibility === 'irreversible'){
      decision = 'Human review required before action -- high stakes and irreversible, regardless of model confidence.';
    } else if(stakes === 'high' && confidence === 'low'){
      decision = 'Human review required before action -- high stakes combined with low model confidence.';
    } else if(stakes === 'low' && reversibility === 'reversible'){
      decision = 'Full automation acceptable -- low stakes and easily reversible.';
    } else if(confidence === 'low'){
      decision = 'Human review only on low-confidence output -- automate the rest.';
    } else {
      decision = 'Full automation acceptable given these specific stakes, reversibility, and confidence.';
    }
    out.textContent = decision;
  };

  // ---- Task 6: scaling/capacity for AI workloads ----
  window.aisdScaleUpdate = function(){
    var rps = Number(document.getElementById('aisdScaleRps').value) || 0.001;
    var batch = Number(document.getElementById('aisdScaleBatch').value) || 1;
    var instances = Number(document.getElementById('aisdScaleInstances').value) || 1;
    var perInstanceCapacity = 20; // fixed illustrative batches/sec per instance
    var batchesNeeded = rps / batch;
    var totalCapacity = perInstanceCapacity * instances;
    var utilization = Math.min(100, Math.round(batchesNeeded / totalCapacity * 100 * 10) / 10);
    var queueForming = batchesNeeded > totalCapacity;
    var addedLatency = Math.round((batch / rps) * 1000 * 10) / 10;
    var lines = [
      '[Illustrative simulated values, not real infrastructure benchmarks]',
      'Batches needed per second: '+Math.round(batchesNeeded*100)/100,
      'Total capacity (batches/sec): '+totalCapacity,
      'Utilization: '+utilization+'%',
      'Added latency from batching: ~'+addedLatency+'ms (time waiting for a batch to fill)',
      queueForming ? 'Queue is FORMING -- demand exceeds current capacity. Options: add instances, accept longer queue wait, or shed load.' : 'No queue forming -- current capacity meets demand.'
    ];
    document.getElementById('aisdScaleOutput').textContent = lines.join('\n');
  };

  var aisdBooted = false;
  window._aiSystemDesignBoot = function(){
    if(aisdBooted) return;
    aisdBooted = true;
    renderAisdNav();
    renderAisdTask();
  };
})();
