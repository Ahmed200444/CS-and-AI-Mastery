
(function(){
  function llevalDoneKey(id){ return 'lleval_done_'+id; }
  function llevalIsDone(id){ try{ return localStorage.getItem(llevalDoneKey(id))==='1'; }catch(e){ return false; } }
  window.llevalMarkDone = function(idx){
    try{ localStorage.setItem(llevalDoneKey(LLEVAL_TASKS[idx].id), '1'); }catch(e){}
    renderLlevalNav(); renderLlevalTask();
  };

  var LLEVAL_CASES = [
    { id:'c1', category:'refund', difficulty:'easy', slice:'new_user', edge:false, adversarial:false },
    { id:'c2', category:'refund', difficulty:'easy', slice:'new_user', edge:false, adversarial:false },
    { id:'c3', category:'refund', difficulty:'hard', slice:'enterprise', edge:true, adversarial:false },
    { id:'c4', category:'billing', difficulty:'medium', slice:'new_user', edge:false, adversarial:true },
    { id:'c5', category:'billing', difficulty:'hard', slice:'enterprise', edge:true, adversarial:true },
    { id:'c6', category:'security', difficulty:'hard', slice:'enterprise', edge:true, adversarial:true }
  ];

  var LLEVAL_TASKS = [
    { id:'lleval-task-evaluation-set-builder', title:'Evaluation-Set Builder',
      explain:'Select a limited set of cases for your evaluation budget. Selecting every case is not rewarded -- coverage across categories, difficulty, edge, and adversarial cases is what matters.',
      render: function(){
        return '<div class="card">'
          + LLEVAL_CASES.map(function(c){
              return '<label style="display:block;font-size:.82rem;margin-top:4px"><input type="checkbox" id="llevalCase_'+c.id+'" data-change="llevalSetCheck()"> '+c.id+': '+c.category+' / '+c.difficulty+' / '+c.slice+(c.edge?' / edge':'')+(c.adversarial?' / adversarial':'')+'</label>';
            }).join('')
          + '<button class="wd-btn-ghost" style="margin-top:10px" data-act="llevalSetReset()">Reset</button>'
          + '<div id="llevalSetOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'lleval-task-metric-selection', title:'Metric-Selection Simulator',
      explain:'For a fixed evaluation claim, choose which metric or combination of metrics provides appropriate evidence -- some claims genuinely need more than one.',
      render: function(){
        return '<div class="card">'
          + '<label for="llevalClaimSelect" style="display:block;font-size:.85rem;margin-bottom:6px">Claim:</label>'
          + '<select id="llevalClaimSelect" class="api-method-select" style="max-width:100%;width:100%" data-change="llevalMetricReset()">'
            + '<option value="json_valid">Output must be valid JSON</option>'
            + '<option value="cites_evidence">Answer must cite supplied evidence</option>'
            + '<option value="preserve_meaning_paraphrase">Answer should preserve meaning under paraphrase</option>'
            + '<option value="tool_call_allowed">Tool call must use an allowed action</option>'
            + '<option value="subjective_helpfulness">Response should satisfy a subjective helpfulness rubric</option>'
          + '</select>'
          + ['schema_validation:Schema validation','exact_match:Exact match','rule_based:Rule-based check','semantic_similarity:Semantic similarity','human_rubric:Human rubric','automated_judge:Automated judge','action_validator:Action/tool validator'].map(function(spec){
              var p = spec.split(':');
              return '<label style="display:block;font-size:.82rem;margin-top:4px"><input type="checkbox" id="llevalMetric_'+p[0]+'" data-change="llevalMetricCheck()"> '+p[1]+'</label>';
            }).join('')
          + '<div id="llevalMetricOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'lleval-task-judge-bias-lab', title:'LLM-Judge Bias Lab',
      explain:'Toggle presentation order, rubric precision, and calibration on a fixed scenario to see exactly how each choice affects (or fails to fully fix) judge reliability.',
      render: function(){
        return '<div class="card">'
          + '<label style="display:block;font-size:.85rem"><input type="checkbox" id="llevalJudgeOrder" data-change="llevalJudgeRun()"> Swap presentation order</label>'
          + '<label style="display:block;font-size:.85rem;margin-top:6px"><input type="checkbox" id="llevalJudgeVerbose" data-change="llevalJudgeRun()"> Candidate answer is longer but factually worse</label>'
          + '<label style="display:block;font-size:.85rem;margin-top:6px"><input type="checkbox" id="llevalJudgeRubric" data-change="llevalJudgeRun()"> Use a precise, anchored rubric (unchecked = vague rubric)</label>'
          + '<label style="display:block;font-size:.85rem;margin-top:6px"><input type="checkbox" id="llevalJudgeCalibrated" data-change="llevalJudgeRun()"> Enable human-audited calibration examples</label>'
          + '<div id="llevalJudgeOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'lleval-task-pairwise-comparison', title:'Pairwise Comparison Tool',
      explain:'Record wins, ties, and cannot-judge outcomes across a fixed set of comparisons -- see how counterbalancing and sample size affect confidence in the result.',
      render: function(){
        return '<div class="card">'
          + '<div class="wd-row" style="gap:10px;flex-wrap:wrap">'
            + '<button class="wd-btn-ghost" data-act="llevalPairRecord(0)">Record: A wins</button>'
            + '<button class="wd-btn-ghost" data-act="llevalPairRecord(1)">Record: B wins</button>'
            + '<button class="wd-btn-ghost" data-act="llevalPairRecord(2)">Record: tie</button>'
            + '<button class="wd-btn-ghost" data-act="llevalPairRecord(3)">Record: cannot judge</button>'
          + '</div>'
          + '<label style="display:block;font-size:.85rem;margin-top:10px"><input type="checkbox" id="llevalPairBalanced" checked data-change="llevalPairRender()"> Presentation order was counterbalanced</label>'
          + '<button class="wd-btn-ghost" style="margin-top:10px" data-act="llevalPairReset()">Reset</button>'
          + '<div id="llevalPairOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'lleval-task-regression-detector', title:'Prompt and Model Regression Detector',
      explain:'Compare fixed baseline and candidate results across the overall score and per-slice scores -- an improved aggregate can hide a critical-slice regression.',
      render: function(){
        return '<div class="card">'
          + '<label for="llevalRegScenario" style="display:block;font-size:.85rem;margin-bottom:6px">Scenario:</label>'
          + '<select id="llevalRegScenario" class="api-method-select" style="max-width:100%;width:100%" data-change="llevalRegRun()">'
            + '<option value="hidden">Aggregate improves, security slice regresses</option>'
            + '<option value="clear_pass">Candidate improves everywhere</option>'
            + '<option value="latency_tradeoff">Quality improves, latency exceeds threshold</option>'
            + '<option value="within_tolerance">Change is within tolerance</option>'
            + '<option value="missing_data">Missing candidate data</option>'
          + '</select>'
          + '<div id="llevalRegOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'lleval-task-eval-dashboard', title:'Evaluation Dashboard and Trade-Off Explorer',
      explain:'Set hard constraints for quality, latency, and cost across 3 fixed candidate systems -- see which remain eligible, and why there is not always one universal winner.',
      render: function(){
        return '<div class="card">'
          + '<label for="llevalDashMinQuality" style="display:block;font-size:.85rem">Minimum quality: <input type="number" step="0.05" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="llevalDashMinQuality" value="0.70" data-input="llevalDashRun()"></label>'
          + '<label for="llevalDashMaxLatency" style="display:block;font-size:.85rem;margin-top:8px">Maximum latency (ms): <input type="number" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="llevalDashMaxLatency" value="1000" data-input="llevalDashRun()"></label>'
          + '<label for="llevalDashMaxCost" style="display:block;font-size:.85rem;margin-top:8px">Maximum illustrative cost (per 1k requests): <input type="number" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="llevalDashMaxCost" value="100" data-input="llevalDashRun()"></label>'
          + '<div id="llevalDashOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.82rem;white-space:pre-wrap"></div>'
          + '</div>';
      }}
  ];

  var llevalCurIdx = 0;

  function renderLlevalNav(){
    var nav = document.getElementById('llevalLessonNav');
    if(!nav) return;
    nav.innerHTML = LLEVAL_TASKS.map(function(t, i){
      var done = llevalIsDone(t.id) ? ' \u2713' : '';
      return '<button class="'+(i===llevalCurIdx?'active':'')+'" data-act="llevalOpen('+i+')">'+(i+1)+'. '+t.title+done+'</button>';
    }).join('');
  }
  window.llevalOpen = function(idx){ llevalCurIdx = idx; renderLlevalNav(); renderLlevalTask(); };
  window.llevalNext = function(){ if(llevalCurIdx < LLEVAL_TASKS.length-1){ llevalCurIdx++; renderLlevalNav(); renderLlevalTask(); } };
  window.llevalPrev = function(){ if(llevalCurIdx > 0){ llevalCurIdx--; renderLlevalNav(); renderLlevalTask(); } };

  function renderLlevalTask(){
    var body = document.getElementById('llevalLessonBody');
    if(!body) return;
    var t = LLEVAL_TASKS[llevalCurIdx];
    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(llevalCurIdx+1)+t.title+'</h2></div>'
      + trackMentalModel(t.explain)
      + t.render()
      + '<div class="wd-row" style="margin-top:14px">'
        + '<button class="wd-btn-ghost" data-act="llevalMarkDone('+llevalCurIdx+')">Mark explored</button>'
      + '</div>'
      + '<div class="wd-navrow">'
        + (llevalCurIdx>0 ? '<button class="wd-btn-ghost" data-act="llevalPrev()">&larr; Previous</button>' : '<span></span>')
        + (llevalCurIdx<LLEVAL_TASKS.length-1 ? '<button class="wd-btn" data-act="llevalNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
    if(t.id==='lleval-task-evaluation-set-builder') llevalSetReset();
    if(t.id==='lleval-task-metric-selection') llevalMetricReset();
    if(t.id==='lleval-task-judge-bias-lab') llevalJudgeRun();
    if(t.id==='lleval-task-pairwise-comparison') llevalPairReset();
    if(t.id==='lleval-task-regression-detector') llevalRegRun();
    if(t.id==='lleval-task-eval-dashboard') llevalDashRun();
  }

  // ---- Task 1: evaluation-set builder ----
  window.llevalSetReset = function(){
    LLEVAL_CASES.forEach(function(c){ document.getElementById('llevalCase_'+c.id).checked = false; });
    llevalSetCheck();
  };
  window.llevalSetCheck = function(){
    var selected = LLEVAL_CASES.filter(function(c){ return document.getElementById('llevalCase_'+c.id).checked; });
    var out = document.getElementById('llevalSetOutput');
    if(selected.length===0){ out.textContent = 'No cases selected yet.'; return; }
    var cats = {}; selected.forEach(function(c){ cats[c.category]=true; });
    var edges = selected.filter(function(c){return c.edge;}).length;
    var adversarial = selected.filter(function(c){return c.adversarial;}).length;
    var seen = {}; var dup = 0;
    selected.forEach(function(c){ var k = c.category+'|'+c.difficulty+'|'+c.slice; if(seen[k]) dup++; seen[k]=true; });
    var missingCritical = !cats['security'];
    var issues = [];
    if(edges===0) issues.push('missing edge-case coverage');
    if(adversarial===0) issues.push('missing adversarial coverage');
    if(dup>0) issues.push('duplicate/redundant cases: '+dup);
    if(missingCritical) issues.push('missing critical slice: security');
    out.textContent = issues.length===0 ? 'PASS: balanced set with good coverage.' : 'ISSUES: '+issues.join('; ');
  };

  // ---- Task 2: metric selection ----
  var LLEVAL_CLAIMS = {
    json_valid: { appropriate:['schema_validation'], insufficient:['exact_match'] },
    cites_evidence: { appropriate:['rule_based','semantic_similarity'], insufficient:[] },
    preserve_meaning_paraphrase: { appropriate:['semantic_similarity'], insufficient:['exact_match'] },
    tool_call_allowed: { appropriate:['action_validator'], insufficient:['semantic_similarity'] },
    subjective_helpfulness: { appropriate:['human_rubric','automated_judge'], insufficient:['exact_match'] }
  };
  var LLEVAL_ALL_METRICS = ['schema_validation','exact_match','rule_based','semantic_similarity','human_rubric','automated_judge','action_validator'];
  window.llevalMetricReset = function(){
    LLEVAL_ALL_METRICS.forEach(function(m){ document.getElementById('llevalMetric_'+m).checked = false; });
    document.getElementById('llevalMetricOutput').textContent = '';
  };
  window.llevalMetricCheck = function(){
    var claim = document.getElementById('llevalClaimSelect').value;
    var chosen = LLEVAL_ALL_METRICS.filter(function(m){ return document.getElementById('llevalMetric_'+m).checked; });
    var out = document.getElementById('llevalMetricOutput');
    if(chosen.length===0){ out.textContent = ''; return; }
    var spec = LLEVAL_CLAIMS[claim];
    var hasInsufficient = chosen.some(function(m){ return spec.insufficient.indexOf(m)!==-1; });
    var hasAppropriate = chosen.some(function(m){ return spec.appropriate.indexOf(m)!==-1; });
    if(hasInsufficient && !hasAppropriate){ out.textContent = 'MISMATCHED METRIC -- insufficient evidence for this claim.'; return; }
    if(hasAppropriate){
      var allAppropriate = chosen.every(function(m){ return spec.appropriate.indexOf(m)!==-1; });
      if(chosen.length>1 && allAppropriate){ out.textContent = 'SEVERAL COMPLEMENTARY METRICS ACCEPTED -- this claim benefits from combined evidence.'; return; }
      out.textContent = 'APPROPRIATE EVIDENCE for this claim.';
      return;
    }
    out.textContent = 'INSUFFICIENT EVIDENCE for this claim.';
  };

  // ---- Task 3: judge bias lab ----
  window.llevalJudgeRun = function(){
    var order = document.getElementById('llevalJudgeOrder').checked;
    var verbose = document.getElementById('llevalJudgeVerbose').checked;
    var precise = document.getElementById('llevalJudgeRubric').checked;
    var calibrated = document.getElementById('llevalJudgeCalibrated').checked;
    var result;
    if(order){ result = 'ORDER-SENSITIVE: swapping presentation order changed the judges preferred answer, even though the answers themselves did not change.'; }
    else if(verbose){ result = 'VERBOSITY-SENSITIVE: the longer but factually worse answer was preferred -- length itself biased the grade.'; }
    else if(!precise){ result = 'RUBRIC-DRIVEN INCONSISTENCY: a vague rubric produced inconsistent grading on equivalent answers.'; }
    else if(precise && !calibrated){ result = 'STABLE for this scenario, but not yet calibrated against human review.'; }
    else { result = 'PARTIALLY CALIBRATED: matches human-reviewed examples in this scenario -- this does not prove the judge is objective in every scenario.'; }
    document.getElementById('llevalJudgeOutput').textContent = result;
  };

  // ---- Task 4: pairwise comparison ----
  var llevalPairResults = [];
  window.llevalPairReset = function(){
    llevalPairResults = [];
    document.getElementById('llevalPairBalanced').checked = true;
    llevalPairRender();
  };
  window.llevalPairRecord = function(choiceArg){
    var choice = Number(choiceArg);
    var labels = ['A','B','tie','cannot_judge'];
    llevalPairResults.push(labels[choice]);
    llevalPairRender();
  };
  window.llevalPairRender = function(){
    var balanced = document.getElementById('llevalPairBalanced').checked;
    var aWins = llevalPairResults.filter(function(r){return r==='A';}).length;
    var bWins = llevalPairResults.filter(function(r){return r==='B';}).length;
    var ties = llevalPairResults.filter(function(r){return r==='tie';}).length;
    var cannot = llevalPairResults.filter(function(r){return r==='cannot_judge';}).length;
    var valid = aWins + bWins + ties;
    var lines = ['Total recorded: '+llevalPairResults.length, 'Valid comparisons: '+valid, 'Ties: '+ties, 'Cannot judge: '+cannot];
    if(valid>0) lines.push('Win rate A: '+(aWins/valid*100).toFixed(1)+'%');
    if(valid < 5) lines.push('WARNING: insufficient evidence -- too few valid comparisons to declare a winner.');
    if(!balanced) lines.push('WARNING: ordering imbalance -- presentation order was not counterbalanced.');
    document.getElementById('llevalPairOutput').textContent = lines.join('\n');
  };

  // ---- Task 5: regression detector ----
  var LLEVAL_REG_BASE = { overall:0.80, slices:{general:0.80, security:0.85}, latency:200 };
  var LLEVAL_REG_SCENARIOS = {
    hidden: { overall:0.83, slices:{general:0.90, security:0.60}, latency:200 },
    clear_pass: { overall:0.90, slices:{general:0.90, security:0.90}, latency:200 },
    latency_tradeoff: { overall:0.90, slices:{general:0.90, security:0.90}, latency:400, latencyThreshold:300 },
    within_tolerance: { overall:0.81, slices:{general:0.81, security:0.84}, latency:200 },
    missing_data: { overall:null, slices:{general:0.8, security:0.8}, latency:200 }
  };
  window.llevalRegRun = function(){
    var scenario = document.getElementById('llevalRegScenario').value;
    var cand = LLEVAL_REG_SCENARIOS[scenario];
    var base = LLEVAL_REG_BASE;
    var threshold = 0.05;
    var out = document.getElementById('llevalRegOutput');
    if(cand.overall===null){ out.textContent = 'INSUFFICIENT EVIDENCE -- candidate data is missing.'; return; }
    var overallChange = cand.overall - base.overall;
    var securityChange = cand.slices.security - base.slices.security;
    var latExceeds = cand.latencyThreshold !== undefined && cand.latency > cand.latencyThreshold;
    var lines = ['Baseline overall: '+base.overall+' | Candidate overall: '+cand.overall+' (change: '+overallChange.toFixed(2)+')',
                 'Baseline security slice: '+base.slices.security+' | Candidate security slice: '+cand.slices.security+' (change: '+securityChange.toFixed(2)+')'];
    if(securityChange < -threshold){
      lines.push('RESULT: HIDDEN CRITICAL-SLICE REGRESSION -- the security slice regressed despite the aggregate looking fine or improved.');
    } else if(overallChange < -threshold){
      lines.push('RESULT: CLEAR REGRESSION.');
    } else if(overallChange > threshold && latExceeds){
      lines.push('RESULT: TRADE-OFF REQUIRING REVIEW -- quality improved but latency exceeds the approved threshold.');
    } else if(overallChange > threshold){
      lines.push('RESULT: CLEAR PASS -- improves across the board.');
    } else {
      lines.push('RESULT: WITHIN TOLERANCE.');
    }
    out.textContent = lines.join('\n');
  };

  // ---- Task 6: evaluation dashboard / trade-off explorer ----
  var LLEVAL_DASH_CANDIDATES = [
    { name:'HighQuality', quality:0.95, latency:800, cost:50 },
    { name:'Cheap', quality:0.65, latency:150, cost:5 },
    { name:'Balanced', quality:0.85, latency:300, cost:20 }
  ];
  window.llevalDashRun = function(){
    var minQ = Number(document.getElementById('llevalDashMinQuality').value);
    var maxLat = Number(document.getElementById('llevalDashMaxLatency').value);
    var maxCost = Number(document.getElementById('llevalDashMaxCost').value);
    var lines = ['[Illustrative figures, not real vendor pricing]'];
    var eligible = [];
    LLEVAL_DASH_CANDIDATES.forEach(function(c){
      var violations = [];
      if(c.quality < minQ) violations.push('quality');
      if(c.latency > maxLat) violations.push('latency');
      if(c.cost > maxCost) violations.push('cost');
      if(violations.length>0){
        lines.push(c.name+': VIOLATES hard constraint(s): '+violations.join(', '));
      } else {
        eligible.push(c.name);
        lines.push(c.name+': eligible (quality='+c.quality+', latency='+c.latency+'ms, cost=$'+c.cost+')');
      }
    });
    if(eligible.length===0){
      lines.push('', 'No eligible candidate under these constraints -- reported honestly rather than forcing a winner.');
    } else {
      lines.push('', 'Eligible: '+eligible.join(', ')+' -- there is not always one single universal winner.');
    }
    document.getElementById('llevalDashOutput').textContent = lines.join('\n');
  };

  var llevalBooted = false;
  window._llmEvaluationBoot = function(){
    if(llevalBooted) return;
    llevalBooted = true;
    renderLlevalNav();
    renderLlevalTask();
  };
})();
