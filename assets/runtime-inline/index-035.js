
(function(){
  function saiDoneKey(id){ return 'sai_done_'+id; }
  function saiIsDone(id){ try{ return localStorage.getItem(saiDoneKey(id))==='1'; }catch(e){ return false; } }
  window.saiMarkDone = function(idx){
    try{ localStorage.setItem(saiDoneKey(SAI_TASKS[idx].id), '1'); }catch(e){}
    renderSaiNav(); renderSaiTask();
  };

  var SAI_TASKS = [
    { id:'sai-task-injection-defense-lab', title:'Prompt-Injection Defense Lab',
      explain:'Enable defenses one at a time and see the architecture evaluation change -- structure alone (delimiters) is not enough without enforcement (authorization, least privilege).',
      render: function(){
        return '<div class="card">'
          + ['sourceLabeling:Source labeling (mark where content came from)','instructionIsolation:Instruction isolation (separate instructions from data)',
             'outputValidation:Output validation (schema check proposed actions)','authorizationGate:Authorization gate (independent permission check)',
             'toolAllowlist:Tool allowlist (least privilege)'].map(function(spec){
              var parts = spec.split(':');
              return '<label style="display:block;font-size:.85rem;margin-top:4px"><input type="checkbox" id="saiDef_'+parts[0]+'" data-change="saiDefenseRun()"> '+parts[1]+'</label>';
            }).join('')
          + '<button class="wd-btn-ghost" style="margin-top:10px" data-act="saiDefenseReset()">Reset</button>'
          + '<div id="saiDefenseOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'sai-task-least-privilege', title:'Agent Permission / Least-Privilege Simulator',
      explain:'Task: update a customer shipping address. Select the minimum toolset that completes the task without unnecessary or dangerous capability.',
      render: function(){
        return '<div class="card">'
          + '<div style="font-size:.85rem;margin-bottom:8px">Task: update a customer shipping address.</div>'
          + ['read_customer_record:read customer record','update_allowed_field:update allowed field (shipping address)',
             'issue_refund:issue refund','delete_account:delete account','run_shell_command:run shell command',
             'query_unrestricted_database:query unrestricted database','send_external_email:send external email'].map(function(spec){
              var parts = spec.split(':');
              return '<label style="display:block;font-size:.85rem;margin-top:4px"><input type="checkbox" id="saiTool_'+parts[0]+'" data-change="saiToolCheck()"> '+parts[1]+'</label>';
            }).join('')
          + '<button class="wd-btn-ghost" style="margin-top:10px" data-act="saiToolReset()">Reset</button>'
          + '<div id="saiToolOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'sai-task-trust-boundary-mapper', title:'AI Trust-Boundary Mapper',
      explain:'For a fixed data-flow edge, mark every property that applies -- untrusted, privileged, requires validation, requires authorization, contains sensitive data are independent, not exclusive.',
      render: function(){
        return '<div class="card">'
          + '<label for="saiEdgeSelect" style="display:block;font-size:.85rem;margin-bottom:6px">Data-flow edge:</label>'
          + '<select id="saiEdgeSelect" class="api-method-select" style="max-width:100%;width:100%" data-change="saiEdgeRenderChecks()">'
            + '<option value="user_to_application">user input -&gt; application</option>'
            + '<option value="retriever_to_context">retrieved document -&gt; model context</option>'
            + '<option value="model_output_to_action">model output -&gt; proposed action</option>'
            + '<option value="gateway_to_internal_api">application -&gt; internal admin API</option>'
            + '<option value="application_to_logs">application -&gt; logs</option>'
          + '</select>'
          + '<div id="saiEdgeChecks" style="margin-top:10px"></div>'
          + '<button class="wd-btn-ghost" style="margin-top:10px" data-act="saiEdgeCheck()">Check labels</button>'
          + '<div id="saiEdgeOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'sai-task-output-validation-gate', title:'Output Validation / Action Gate',
      explain:'A fixed model-proposed action passes through parse, schema/allowlist, range, ownership, and authorization checks in order -- toggle any check off to see exactly what would slip through.',
      render: function(){
        return '<div class="card">'
          + '<label for="saiGateScenario" style="display:block;font-size:.85rem;margin-bottom:6px">Proposed action:</label>'
          + '<select id="saiGateScenario" class="api-method-select" style="max-width:100%;width:100%" data-change="saiGateRun()">'
            + '<option value="malformed">Malformed output (invalid JSON)</option>'
            + '<option value="unknown_action">Unknown action (delete_account)</option>'
            + '<option value="out_of_range">Refund amount out of range ($9,999)</option>'
            + '<option value="not_owned">Refund on a resource the caller does not own</option>'
            + '<option value="sensitive_valid">Valid refund above the human-approval threshold</option>'
            + '<option value="valid">Valid, authorized, low-value refund</option>'
          + '</select>'
          + ['parse:Parse check','schema:Schema/allowlist check','range:Range check','ownership:Ownership check','authz:Authorization check'].map(function(spec){
              var parts = spec.split(':');
              return '<label style="display:inline-block;margin-right:12px;font-size:.8rem"><input type="checkbox" id="saiGate_'+parts[0]+'" checked data-change="saiGateRun()"> '+parts[1]+'</label>';
            }).join('')
          + '<div id="saiGateOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'sai-task-leakage-simulator', title:'Sensitive-Data Leakage Simulator',
      explain:'Two independent policy dimensions, context content and logging policy, each with their own leakage risk -- fixing one does not fix the other.',
      render: function(){
        return '<div class="card">'
          + '<label for="saiContextPolicy" style="display:block;font-size:.85rem">Context policy:</label>'
          + '<select id="saiContextPolicy" class="api-method-select" style="max-width:100%;width:100%" data-change="saiLeakUpdate()">'
            + '<option value="full_profile">Full customer profile (name, email, account, payment details)</option>'
            + '<option value="secret_included">Support text plus an internal API secret</option>'
            + '<option value="task_minimized">Account ID plus the current support question only</option>'
          + '</select>'
          + '<label for="saiLogPolicy" style="display:block;font-size:.85rem;margin-top:10px">Logging policy:</label>'
          + '<select id="saiLogPolicy" class="api-method-select" style="max-width:100%;width:100%" data-change="saiLeakUpdate()">'
            + '<option value="full">Full prompt/response bodies</option>'
            + '<option value="none">No logging at all</option>'
            + '<option value="redacted_structured">Redacted, structured security events</option>'
          + '</select>'
          + '<div id="saiLeakOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'sai-task-incident-diagnosis', title:'AI Security Incident Diagnosis',
      explain:'Inspect fixed evidence and choose the one root cause consistent with every signal -- not just plausible on its own.',
      render: function(){
        return '<div class="card">'
          + '<div style="font-family:ui-monospace,monospace;font-size:.8rem;white-space:pre-wrap;margin-bottom:10px">'
            + 'EVIDENCE: retrieved document from an unusual, unverified source contained embedded instructions.\\nAn action was attempted immediately after that retrieval step.\\nNo direct user override attempt was present in the conversation.'
          + '</div>'
          + '<label for="saiDiagSelect" style="display:block;font-size:.85rem;margin-bottom:6px">Choose the root cause consistent with ALL the evidence:</label>'
          + '<select id="saiDiagSelect" class="api-method-select" style="max-width:100%;width:100%" data-change="saiDiagCheck()">'
            + '<option value="-1">-- choose one --</option>'
            + '<option value="direct_injection">Direct prompt injection</option>'
            + '<option value="indirect_injection">Indirect prompt injection</option>'
            + '<option value="over_permissioned_agent">Over-permissioned agent, unrelated to injection</option>'
            + '<option value="sensitive_output_leakage">Sensitive-data output leakage, unrelated to injection</option>'
          + '</select>'
          + '<div id="saiDiagOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.9rem;white-space:pre-wrap"></div>'
          + '</div>';
      }}
  ];

  var saiCurIdx = 0;

  function renderSaiNav(){
    var nav = document.getElementById('saiLessonNav');
    if(!nav) return;
    nav.innerHTML = SAI_TASKS.map(function(t, i){
      var done = saiIsDone(t.id) ? ' \u2713' : '';
      return '<button class="'+(i===saiCurIdx?'active':'')+'" data-act="saiOpen('+i+')">'+(i+1)+'. '+t.title+done+'</button>';
    }).join('');
  }
  window.saiOpen = function(idx){ saiCurIdx = idx; renderSaiNav(); renderSaiTask(); };
  window.saiNext = function(){ if(saiCurIdx < SAI_TASKS.length-1){ saiCurIdx++; renderSaiNav(); renderSaiTask(); } };
  window.saiPrev = function(){ if(saiCurIdx > 0){ saiCurIdx--; renderSaiNav(); renderSaiTask(); } };

  function renderSaiTask(){
    var body = document.getElementById('saiLessonBody');
    if(!body) return;
    var t = SAI_TASKS[saiCurIdx];
    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(saiCurIdx+1)+t.title+'</h2></div>'
      + trackMentalModel(t.explain)
      + t.render()
      + '<div class="wd-row" style="margin-top:14px">'
        + '<button class="wd-btn-ghost" data-act="saiMarkDone('+saiCurIdx+')">Mark explored</button>'
      + '</div>'
      + '<div class="wd-navrow">'
        + (saiCurIdx>0 ? '<button class="wd-btn-ghost" data-act="saiPrev()">&larr; Previous</button>' : '<span></span>')
        + (saiCurIdx<SAI_TASKS.length-1 ? '<button class="wd-btn" data-act="saiNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
    if(t.id==='sai-task-injection-defense-lab') saiDefenseReset();
    if(t.id==='sai-task-least-privilege') saiToolReset();
    if(t.id==='sai-task-trust-boundary-mapper') saiEdgeRenderChecks();
    if(t.id==='sai-task-output-validation-gate') saiGateRun();
    if(t.id==='sai-task-leakage-simulator') saiLeakUpdate();
    if(t.id==='sai-task-incident-diagnosis') saiDiagCheck();
  }

  // ---- Task 1: prompt-injection defense lab ----
  window.saiDefenseReset = function(){
    ['sourceLabeling','instructionIsolation','outputValidation','authorizationGate','toolAllowlist'].forEach(function(k){
      document.getElementById('saiDef_'+k).checked = false;
    });
    saiDefenseRun();
  };
  window.saiDefenseRun = function(){
    var sourceLabeling = document.getElementById('saiDef_sourceLabeling').checked;
    var instructionIsolation = document.getElementById('saiDef_instructionIsolation').checked;
    var outputValidation = document.getElementById('saiDef_outputValidation').checked;
    var authorizationGate = document.getElementById('saiDef_authorizationGate').checked;
    var toolAllowlist = document.getElementById('saiDef_toolAllowlist').checked;
    var result;
    if(!sourceLabeling && !instructionIsolation && !authorizationGate){
      result = 'UNSAFE: untrusted content can influence privileged execution. Structure and enforcement are both missing.';
    } else if(authorizationGate && toolAllowlist){
      result = 'DEFENDED: untrusted content remains data and cannot authorize actions. Enforcement (authorization + least privilege) is in place.';
    } else {
      result = 'PARTIALLY DEFENDED: structure improved (labeling/isolation and/or validation), but enforcement (an authorization gate combined with a tool allowlist) is still missing.';
    }
    document.getElementById('saiDefenseOutput').textContent = result;
  };

  // ---- Task 2: least-privilege simulator ----
  var SAI_REQUIRED = ['read_customer_record','update_allowed_field'];
  var SAI_DANGEROUS = ['run_shell_command','query_unrestricted_database'];
  window.saiToolReset = function(){
    ['read_customer_record','update_allowed_field','issue_refund','delete_account','run_shell_command','query_unrestricted_database','send_external_email'].forEach(function(k){
      document.getElementById('saiTool_'+k).checked = false;
    });
    saiToolCheck();
  };
  window.saiToolCheck = function(){
    var all = ['read_customer_record','update_allowed_field','issue_refund','delete_account','run_shell_command','query_unrestricted_database','send_external_email'];
    var selected = all.filter(function(k){ return document.getElementById('saiTool_'+k).checked; });
    var missing = SAI_REQUIRED.filter(function(r){ return selected.indexOf(r)===-1; });
    var dangerous = selected.filter(function(s){ return SAI_DANGEROUS.indexOf(s)!==-1; });
    var unnecessary = selected.filter(function(s){ return SAI_REQUIRED.indexOf(s)===-1 && SAI_DANGEROUS.indexOf(s)===-1; });
    var out = document.getElementById('saiToolOutput');
    if(selected.length===0){ out.textContent = 'No capabilities selected yet.'; return; }
    if(missing.length>0){ out.textContent = 'MISSING required capability: '+missing.join(', '); return; }
    if(dangerous.length>0){ out.textContent = 'DANGEROUS general-purpose capability included: '+dangerous.join(', ')+' -- this expands blast radius far beyond the task.'; return; }
    if(unnecessary.length>0){ out.textContent = 'UNNECESSARY capability included: '+unnecessary.join(', ')+' -- not required for this task.'; return; }
    out.textContent = 'VALID least-privilege configuration -- exactly the minimum needed for this task.';
  };

  // ---- Task 3: trust-boundary mapper ----
  var SAI_EDGES = {
    user_to_application: {untrusted:true, requires_validation:true},
    retriever_to_context: {untrusted:true, requires_validation:true},
    model_output_to_action: {requires_validation:true, requires_authorization:true},
    gateway_to_internal_api: {privileged:true, requires_authorization:true},
    application_to_logs: {contains_sensitive_data:true}
  };
  var SAI_PROPS = ['untrusted','privileged','requires_validation','requires_authorization','contains_sensitive_data'];
  window.saiEdgeRenderChecks = function(){
    var html = SAI_PROPS.map(function(p){
      return '<label style="display:block;font-size:.8rem;margin-top:4px"><input type="checkbox" id="saiProp_'+p+'"> '+p.replace(/_/g,' ')+'</label>';
    }).join('');
    document.getElementById('saiEdgeChecks').innerHTML = html;
    document.getElementById('saiEdgeOutput').textContent = '';
  };
  window.saiEdgeCheck = function(){
    var edge = document.getElementById('saiEdgeSelect').value;
    var correct = SAI_EDGES[edge];
    var lines = [];
    var allCorrect = true;
    SAI_PROPS.forEach(function(p){
      var expected = !!correct[p];
      var got = document.getElementById('saiProp_'+p).checked;
      var ok = expected===got;
      if(!ok) allCorrect = false;
      lines.push(p.replace(/_/g,' ')+': '+(ok?'correct':'incorrect (expected '+(expected?'checked':'unchecked')+')'));
    });
    lines.unshift(allCorrect ? 'All properties correctly identified for this edge.' : 'Some properties are mismatched -- review below.');
    document.getElementById('saiEdgeOutput').textContent = lines.join('\n');
  };

  // ---- Task 4: output validation / action gate ----
  window.saiGateRun = function(){
    var scenario = document.getElementById('saiGateScenario').value;
    var gParse = document.getElementById('saiGate_parse').checked;
    var gSchema = document.getElementById('saiGate_schema').checked;
    var gRange = document.getElementById('saiGate_range').checked;
    var gOwnership = document.getElementById('saiGate_ownership').checked;
    var gAuthz = document.getElementById('saiGate_authz').checked;
    var rawValid = scenario !== 'malformed';
    var action = scenario === 'unknown_action' ? 'delete_account' : 'issue_refund';
    var amount = scenario === 'out_of_range' ? 9999 : (scenario === 'sensitive_valid' ? 200 : 50);
    var ownsResource = scenario !== 'not_owned';
    var isAuthorized = true;
    var result;
    if(gParse && !rawValid){ result = 'REJECTED at parse check -- malformed output (fail-closed).'; }
    else if(gSchema && action !== 'issue_refund' && action !== 'update_address'){ result = 'REJECTED at schema/allowlist check -- unknown action.'; }
    else if(gRange && action==='issue_refund' && (amount>500 || amount<0)){ result = 'REJECTED at range check -- amount out of allowed range.'; }
    else if(gOwnership && !ownsResource){ result = 'REJECTED at ownership check -- caller does not own this resource.'; }
    else if(gAuthz && !isAuthorized){ result = 'REJECTED at authorization check.'; }
    else if(action==='issue_refund' && amount>100){ result = 'VALID but sensitive -- held for human approval before execution.'; }
    else { result = 'APPROVED -- executes normally.'; }
    document.getElementById('saiGateOutput').textContent = result;
  };

  // ---- Task 5: sensitive-data leakage simulator ----
  window.saiLeakUpdate = function(){
    var contextPolicy = document.getElementById('saiContextPolicy').value;
    var logPolicy = document.getElementById('saiLogPolicy').value;
    var contextResult = {
      full_profile: 'Context risk: unnecessary sensitive data (payment details) placed in model context beyond what the task needs.',
      secret_included: 'Context risk: CRITICAL -- an internal API secret is exposed to the model in context.',
      task_minimized: 'Context risk: minimized -- only the account ID and current question are included.'
    }[contextPolicy];
    var logResult = {
      full: 'Logging risk: full prompt/response bodies stored -- PII and secrets exposed in logs.',
      none: 'Logging risk: over-redaction -- no useful security audit data is retained for incident review.',
      redacted_structured: 'Logging risk: minimized -- redacted, structured security events retained without exposing full content.'
    }[logPolicy];
    document.getElementById('saiLeakOutput').textContent = contextResult+'\n'+logResult+'\n\nThese are two independent leakage paths -- fixing one does not fix the other.';
  };

  // ---- Task 6: incident diagnosis ----
  window.saiDiagCheck = function(){
    var val = document.getElementById('saiDiagSelect').value;
    var out = document.getElementById('saiDiagOutput');
    var explanations = {
      direct_injection: 'INCORRECT -- the evidence explicitly states no direct user override attempt was present; direct injection requires the malicious instruction to come from the user directly.',
      indirect_injection: 'CORRECT -- this matches all three signals: an unusual, unverified retrieval source, embedded instructions in that retrieved content, and an action attempted immediately after retrieval -- exactly the indirect prompt-injection pattern.',
      over_permissioned_agent: 'INCORRECT -- this evidence centers on the retrieved document and its instructions, not on the agent having excessive tool access unrelated to any injected content.',
      sensitive_output_leakage: 'INCORRECT -- the evidence describes an attempted action following suspicious retrieval, not sensitive data appearing in a response with no authorization failure.'
    };
    if(val==='-1'){ out.textContent = 'Choose a root cause to see the evaluation.'; return; }
    out.textContent = explanations[val];
  };

  var saiBooted = false;
  window._secureAIBoot = function(){
    if(saiBooted) return;
    saiBooted = true;
    renderSaiNav();
    renderSaiTask();
  };
})();
