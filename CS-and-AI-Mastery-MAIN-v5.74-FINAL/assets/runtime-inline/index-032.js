
(function(){
  function iwaDoneKey(id){ return 'iwa_done_'+id; }
  function iwaIsDone(id){ try{ return localStorage.getItem(iwaDoneKey(id))==='1'; }catch(e){ return false; } }
  window.iwaMarkDone = function(idx){
    try{ localStorage.setItem(iwaDoneKey(IWA_TASKS[idx].id), '1'); }catch(e){}
    renderIwaNav(); renderIwaTask();
  };

  var IWA_STAKEHOLDERS = [
    { name:'Tech Lead (owns this decision)', correctRole:'decision owner', correctEngagement:'collaborate', correctStance:'neutral or uncertain' },
    { name:'Staff Engineer (your closest ally)', correctRole:'advisor or contributor', correctEngagement:'collaborate', correctStance:'supporter' },
    { name:'VP of Engineering', correctRole:'no formal decision right', correctEngagement:'inform', correctStance:'supporter' },
    { name:'Security Reviewer', correctRole:'advisor or contributor', correctEngagement:'consult', correctStance:'resistant' },
    { name:'Adjacent Team Lead', correctRole:'no formal decision right', correctEngagement:'consult', correctStance:'resistant' },
    { name:'Downstream Consumer Team', correctRole:'no formal decision right', correctEngagement:'inform', correctStance:'neutral or uncertain' }
  ];

  var IWA_FRAMING_AUDIENCES = {
    engineer: { correct:1, options:[
      'This change is risky and we should probably not do it.',
      'This requires a schema lock, so expect a brief write-unavailability window during migration -- here is the rollback plan if the migration fails partway.',
      'This will make everything faster and safer with basically no downside.'
    ]},
    'product manager': { correct:0, options:[
      'This requires a 4-hour maintenance window; users will see a "temporarily unavailable" message during that time, and we are not yet certain if weekend timing is feasible.',
      'This is a purely technical, low-level detail that will not affect the product at all.',
      'This will definitely be done with zero user impact.'
    ]},
    executive: { correct:0, options:[
      'This requires 4 hours of planned downtime; the alternative is roughly 3x the timeline to avoid downtime entirely. Recommend accepting the downtime given the cost difference.',
      'This is purely a backend detail not worth executive attention.',
      'This carries no real risk and will definitely finish on schedule.'
    ]},
    'customer or user': { correct:2, options:[
      'We are performing a schema migration using a write-lock strategy during the maintenance window.',
      'Nothing will change for you, ever, in any way.',
      'The service will be briefly unavailable during a scheduled maintenance window on [date]; no action is needed on your part.'
    ]}
  };

  var IWA_EVIDENCE_CLAIMS = [
    { claim:'Renaming a confusing internal variable name', best:'anecdote', explain:'a low-risk, easily-reversible local change -- a brief explanation of the confusion is proportionate; a controlled experiment here would be real overkill.' },
    { claim:'Claiming a new caching layer improves response time', best:'logs or metrics', explain:'a measurable performance claim is best supported by actual metrics or a controlled experiment, not opinion or anecdote alone.' },
    { claim:'Claiming a redesigned signup flow improves user completion', best:'user research', explain:'a user-experience claim about how real users behave is best supported by direct user research, not internal engineering opinion.' },
    { claim:'Arguing a legacy service needs a reliability rewrite', best:'incident history', explain:'a reliability concern is strongly supported by documented incident history showing a real, recurring pattern of failures.' }
  ];
  var IWA_EVIDENCE_OPTIONS = ['personal opinion','anecdote','logs or metrics','prototype','controlled experiment','user research','incident history'];

  var IWA_OBJECTIONS = [
    { text:'"This is too risky."', responses:[
      {text:'"No it is not -- I have already tested this myself."', ok:false, why:'dismisses the concern outright without acknowledging it -- defensive.'},
      {text:'"That is a fair concern given our last incident -- here is what is different this time, and here is the rollback plan."', ok:true, why:'acknowledges the concern, clarifies the assumption, and offers evidence and a mitigation.'},
      {text:'"I understand you are worried, but we really do not have time to discuss this further."', ok:false, why:'acknowledges but offers no real next step -- and pressures for urgency.'},
      {text:'"Risk is just part of engineering, everyone should accept that."', ok:false, why:'dismissive of the specific concern raised.'}
    ]},
    { text:'"We do not have time."', responses:[
      {text:'"We will find the time somehow, do not worry about it."', ok:false, why:'acknowledges but provides no concrete next step.'},
      {text:'"Understood -- given the timeline, would a smaller first phase fit, with the rest deferred?"', ok:true, why:'acknowledges the constraint and offers a concrete option.'},
      {text:'"This is more important than whatever else is on your plate."', ok:false, why:'dismisses their competing priority.'},
      {text:'"Then let us just skip proper review and ship it fast."', ok:false, why:'suggests cutting corners rather than addressing the actual constraint.'}
    ]},
    { text:'"The current system works."', responses:[
      {text:'"It does not, you are wrong."', ok:false, why:'defensive and dismissive.'},
      {text:'"It works for now -- here is the incident history showing where it has started to strain, and why that trend is likely to continue."', ok:true, why:'acknowledges the current state while offering evidence for the underlying problem.'},
      {text:'"Everyone knows the current system is outdated."', ok:false, why:'dismissive, no real evidence offered.'},
      {text:'"I hear you, but let us move on."', ok:false, why:'acknowledges but gives no actionable next step.'}
    ]},
    { text:'"This is not a priority."', responses:[
      {text:'"It should be your top priority."', ok:false, why:'dismisses their actual prioritization without engaging with it.'},
      {text:'"Understood -- can you help me understand what is currently ahead of it, so I can see if there is a smaller version that fits?"', ok:true, why:'acknowledges their priorities and seeks a concrete path forward.'},
      {text:'"Fine, I will just do it without your team then."', ok:false, why:'signals going around them rather than working with the constraint.'},
      {text:'"I will just wait indefinitely and hope it becomes a priority."', ok:false, why:'acknowledges but takes no constructive next step.'}
    ]},
    { text:'"Your proposal creates work for my team."', responses:[
      {text:'"That is not my problem, my team needs this."', ok:false, why:'dismisses their concern entirely.'},
      {text:'"You are right that this adds work -- what would make that cost more acceptable, or is there a way I can help absorb some of it?"', ok:true, why:'acknowledges the real cost and offers to problem-solve together.'},
      {text:'"It is a small amount of work, you are overreacting."', ok:false, why:'dismissive of their stated concern.'},
      {text:'"I understand, but this is happening regardless."', ok:false, why:'acknowledges but signals disregard for their input.'}
    ]}
  ];

  var IWA_ETHICAL_SCENARIOS = [
    { text:'You have a hunch a change would help, but no real evidence yet.', best:'gather more evidence' },
    { text:'Two teams have equally legitimate but conflicting priorities for the same quarter.', best:'compromise' },
    { text:'You are not sure who actually owns this specific technical decision.', best:'involve the decision owner' },
    { text:'You have discovered a real security vulnerability that needs immediate attention.', best:'escalate through the proper channel' },
    { text:'The decision owner heard your full case and made a final, legitimate decision you disagree with.', best:'accept the final decision' },
    { text:'A colleague asks you to leave a known risk out of a stakeholder-facing report.', best:'refuse an unethical request' },
    { text:'You have solid evidence and a receptive audience for a proposal.', best:'persuade' }
  ];

  var IWA_TASKS = [
    { id:'iwa-task-stakeholder-map', title:'Stakeholder Map Builder',
      explain:'For each of 6 fixed stakeholders in a real migration scenario, classify decision role, engagement requirement, and current stance as three independent fields -- someone can have no formal decision right and still be an influential supporter.',
      render: function(){
        var roleOpts = ['-- select --','decision owner','advisor or contributor','no formal decision right'];
        var engageOpts = ['-- select --','collaborate','consult','inform'];
        var stanceOpts = ['-- select --','supporter','neutral or uncertain','resistant'];
        function selectHtml(id, opts){
          return '<select id="'+id+'" class="api-method-select" style="max-width:100%;width:100%;margin-top:4px" data-change="iwaStakeholderCheck()">'
            + opts.map(function(o){ return '<option value="'+o+'">'+o+'</option>'; }).join('') + '</select>';
        }
        return '<div class="card">'
          + IWA_STAKEHOLDERS.map(function(s,i){
              return '<div style="margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--line)">'
                + '<b>'+s.name+'</b>'
                + '<label style="display:block;font-size:.8rem;margin-top:6px">Decision role:'+selectHtml('iwaRole_'+i, roleOpts)+'</label>'
                + '<label style="display:block;font-size:.8rem;margin-top:6px">Engagement requirement:'+selectHtml('iwaEngage_'+i, engageOpts)+'</label>'
                + '<label style="display:block;font-size:.8rem;margin-top:6px">Current stance:'+selectHtml('iwaStance_'+i, stanceOpts)+'</label>'
              + '</div>';
            }).join('')
          + '<button class="wd-btn-ghost" data-act="iwaStakeholderReset()">Reset</button>'
          + '<div id="iwaStakeholderOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'iwa-task-audience-framing', title:'Audience Framing Tool',
      explain:'One technical fact, four audiences. For each audience, choose the framing that keeps the fact unchanged, addresses that audience\'s actual concern, and never hides a material risk.',
      render: function(){
        return '<div class="card">'
          + '<div style="font-family:ui-monospace,monospace;font-size:.82rem;margin-bottom:10px">Fact: this migration requires a 4-hour maintenance window.</div>'
          + '<label for="iwaAudienceSelect" style="display:block;font-size:.85rem;margin-bottom:6px">Audience:</label>'
          + '<select id="iwaAudienceSelect" class="api-method-select" style="max-width:100%;width:100%" data-change="iwaFramingRender()">'
            + '<option value="engineer">engineer</option><option value="product manager">product manager</option><option value="executive">executive</option><option value="customer or user">customer or user</option>'
          + '</select>'
          + '<div id="iwaFramingOptions" style="margin-top:12px"></div>'
          + '<div id="iwaFramingOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'iwa-task-evidence-strength', title:'Evidence Strength Evaluator',
      explain:'Four claims, each needing a different kind of evidence. Choose the evidence type proportionate to THIS claim -- no single evidence type is universally strongest.',
      render: function(){
        return '<div class="card">'
          + '<label for="iwaEvidenceClaimSelect" style="display:block;font-size:.85rem;margin-bottom:6px">Claim:</label>'
          + '<select id="iwaEvidenceClaimSelect" class="api-method-select" style="max-width:100%;width:100%" data-change="iwaEvidenceRenderClaim()">'
            + IWA_EVIDENCE_CLAIMS.map(function(c,i){ return '<option value="'+i+'">'+c.claim+'</option>'; }).join('')
          + '</select>'
          + '<label for="iwaEvidenceChoice" style="display:block;font-size:.85rem;margin-top:10px">Best next evidence-gathering action:</label>'
          + '<select id="iwaEvidenceChoice" class="api-method-select" style="max-width:100%;width:100%" data-change="iwaEvidenceCheck()">'
            + '<option value="">-- select --</option>'
            + IWA_EVIDENCE_OPTIONS.map(function(o){ return '<option value="'+o+'">'+o+'</option>'; }).join('')
          + '</select>'
          + '<button class="wd-btn-ghost" style="margin-top:10px" data-act="iwaEvidenceReset()">Reset</button>'
          + '<div id="iwaEvidenceOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'iwa-task-objection-handling', title:'Objection-Handling Scenario',
      explain:'Five fixed objections, four candidate responses each. Choose the response that acknowledges the concern, clarifies assumptions, and offers evidence or options -- not the defensive or dismissive one.',
      render: function(){
        return '<div class="card">'
          + '<label for="iwaObjectionSelect" style="display:block;font-size:.85rem;margin-bottom:6px">Objection:</label>'
          + '<select id="iwaObjectionSelect" class="api-method-select" style="max-width:100%;width:100%" data-change="iwaObjectionRender()">'
            + IWA_OBJECTIONS.map(function(o,i){ return '<option value="'+i+'">'+o.text+'</option>'; }).join('')
          + '</select>'
          + '<div id="iwaObjectionOptions" style="margin-top:12px"></div>'
          + '<div id="iwaObjectionOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'iwa-task-scope-negotiator', title:'Scope and Trade-off Negotiator',
      explain:'A transparent capacity model -- required effort vs. available capacity. Adjust scope, reliability, debt, schedule extension, staffing, and phasing to find a feasible plan. Not every combination is achievable, and sometimes pausing is the right call.',
      render: function(){
        return '<div class="card">'
          + ['scopeEffort:Feature scope effort:0:100:60','reliabilityEffort:Reliability investment effort:0:60:20','debtEffort:Technical-debt effort:0:60:10',
             'scheduleExt:Schedule-extension capacity:0:60:0','staffingCap:Staffing capacity:0:60:0','phasedCap:Phased-delivery capacity:0:60:0'].map(function(spec){
              var parts = spec.split(':'); var id=parts[0], label=parts[1], min=parts[2], max=parts[3], val=parts[4];
              return '<label style="display:block;font-size:.82rem;margin-top:8px">'+label+': <span id="iwaVal_'+id+'">'+val+'</span>'
                + '<input type="range" id="iwa_'+id+'" min="'+min+'" max="'+max+'" step="5" value="'+val+'" style="width:100%" data-input="iwaScopeUpdate()"></label>';
            }).join('')
          + '<label style="display:block;font-size:.82rem;margin-top:10px"><input type="checkbox" id="iwaReliabilityFloor" checked data-change="iwaScopeUpdate()"> reliability floor is safely met</label>'
          + '<button class="wd-btn-ghost" style="margin-top:10px" data-act="iwaScopeReset()">Reset</button>'
          + '<div id="iwaScopeOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.82rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'iwa-task-ethical-decision', title:'Ethical Influence Decision Tool',
      explain:'Given a workplace scenario, choose the best next action -- persuade, gather more evidence, compromise, involve the decision owner, escalate, accept, or refuse. For a request to hide a material risk, only refusal is correct.',
      render: function(){
        return '<div class="card">'
          + '<label for="iwaEthicalSelect" style="display:block;font-size:.85rem;margin-bottom:6px">Scenario:</label>'
          + '<select id="iwaEthicalSelect" class="api-method-select" style="max-width:100%;width:100%" data-change="iwaEthicalRenderScenario()">'
            + IWA_ETHICAL_SCENARIOS.map(function(s,i){ return '<option value="'+i+'">'+s.text+'</option>'; }).join('')
          + '</select>'
          + '<label for="iwaEthicalAction" style="display:block;font-size:.85rem;margin-top:10px">Best next action:</label>'
          + '<select id="iwaEthicalAction" class="api-method-select" style="max-width:100%;width:100%" data-change="iwaEthicalCheck()">'
            + '<option value="">-- select --</option>'
            + ['persuade','gather more evidence','compromise','involve the decision owner','escalate through the proper channel','accept the final decision','refuse an unethical request'].map(function(o){ return '<option value="'+o+'">'+o+'</option>'; }).join('')
          + '</select>'
          + '<button class="wd-btn-ghost" style="margin-top:10px" data-act="iwaEthicalReset()">Reset</button>'
          + '<div id="iwaEthicalOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }}
  ];

  var iwaCurIdx = 0;

  function renderIwaNav(){
    var nav = document.getElementById('iwaLessonNav');
    if(!nav) return;
    nav.innerHTML = IWA_TASKS.map(function(t, i){
      var done = iwaIsDone(t.id) ? ' \u2713' : '';
      return '<button class="'+(i===iwaCurIdx?'active':'')+'" data-act="iwaOpen('+i+')">'+(i+1)+'. '+t.title+done+'</button>';
    }).join('');
  }
  window.iwaOpen = function(idx){ iwaCurIdx = idx; renderIwaNav(); renderIwaTask(); };
  window.iwaNext = function(){ if(iwaCurIdx < IWA_TASKS.length-1){ iwaCurIdx++; renderIwaNav(); renderIwaTask(); } };
  window.iwaPrev = function(){ if(iwaCurIdx > 0){ iwaCurIdx--; renderIwaNav(); renderIwaTask(); } };

  function renderIwaTask(){
    var body = document.getElementById('iwaLessonBody');
    if(!body) return;
    var t = IWA_TASKS[iwaCurIdx];
    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(iwaCurIdx+1)+t.title+'</h2></div>'
      + trackMentalModel(t.explain)
      + t.render()
      + '<div class="wd-row" style="margin-top:14px">'
        + '<button class="wd-btn-ghost" data-act="iwaMarkDone('+iwaCurIdx+')">Mark explored</button>'
      + '</div>'
      + '<div class="wd-navrow">'
        + (iwaCurIdx>0 ? '<button class="wd-btn-ghost" data-act="iwaPrev()">&larr; Previous</button>' : '<span></span>')
        + (iwaCurIdx<IWA_TASKS.length-1 ? '<button class="wd-btn" data-act="iwaNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
    if(t.id==='iwa-task-stakeholder-map') iwaStakeholderReset();
    if(t.id==='iwa-task-audience-framing') iwaFramingRender();
    if(t.id==='iwa-task-evidence-strength') iwaEvidenceRenderClaim();
    if(t.id==='iwa-task-objection-handling') iwaObjectionRender();
    if(t.id==='iwa-task-scope-negotiator') iwaScopeUpdate();
    if(t.id==='iwa-task-ethical-decision') iwaEthicalRenderScenario();
  }

  // ---- Task 1: stakeholder map ----
  window.iwaStakeholderReset = function(){
    IWA_STAKEHOLDERS.forEach(function(s,i){
      ['iwaRole_','iwaEngage_','iwaStance_'].forEach(function(p){
        var el = document.getElementById(p+i); if(el) el.value = el.options[0].value;
      });
    });
    document.getElementById('iwaStakeholderOutput').textContent = '';
  };
  window.iwaStakeholderCheck = function(){
    var lines = [];
    var allCorrect = true;
    IWA_STAKEHOLDERS.forEach(function(s,i){
      var role = document.getElementById('iwaRole_'+i).value;
      var engage = document.getElementById('iwaEngage_'+i).value;
      var stance = document.getElementById('iwaStance_'+i).value;
      var roleOk = role===s.correctRole, engageOk = engage===s.correctEngagement, stanceOk = stance===s.correctStance;
      if(!roleOk || !engageOk || !stanceOk) allCorrect = false;
      lines.push(s.name+': role '+(roleOk?'\u2713':'\u2717 (expected: '+s.correctRole+')')+', engagement '+(engageOk?'\u2713':'\u2717 (expected: '+s.correctEngagement+')')+', stance '+(stanceOk?'\u2713':'\u2717 (expected: '+s.correctStance+')'));
    });
    lines.push('', 'Note: formal decision role and informal influence (stance) are independent -- the VP has no formal right here but is a supporter, while the actual owner may be neutral.');
    document.getElementById('iwaStakeholderOutput').textContent = lines.join('\n');
  };

  // ---- Task 2: audience framing ----
  window.iwaFramingRender = function(){
    var audience = document.getElementById('iwaAudienceSelect').value;
    var data = IWA_FRAMING_AUDIENCES[audience];
    var optsHtml = data.options.map(function(opt,i){
      return '<label style="display:block;margin-top:8px;font-size:.85rem"><input type="radio" name="iwaFramingRadio" value="'+i+'" data-change="iwaFramingCheck()"> '+opt+'</label>';
    }).join('');
    document.getElementById('iwaFramingOptions').innerHTML = optsHtml;
    document.getElementById('iwaFramingOutput').textContent = '';
  };
  window.iwaFramingCheck = function(){
    var audience = document.getElementById('iwaAudienceSelect').value;
    var data = IWA_FRAMING_AUDIENCES[audience];
    var checked = document.querySelector('input[name="iwaFramingRadio"]:checked');
    if(!checked) return;
    var val = Number(checked.value);
    var out = document.getElementById('iwaFramingOutput');
    if(val === data.correct){
      out.textContent = 'CORRECT -- this framing preserves the material fact, addresses '+audience+'\'s actual concern, and does not hide risk or cost.';
    } else {
      var isHidingRisk = data.options[val].toLowerCase().indexOf('no real downside') !== -1 || data.options[val].toLowerCase().indexOf('zero') !== -1 || data.options[val].toLowerCase().indexOf('definitely') !== -1 || data.options[val].toLowerCase().indexOf('no action') !== -1 && val !== data.correct;
      out.textContent = 'REJECTED -- this option either misses '+audience+'\'s actual concern, includes unnecessary technical depth for this audience, or -- if it claims zero risk/impact -- misleadingly hides a real, material fact. Framing must never hide material risk.';
    }
  };

  // ---- Task 3: evidence strength ----
  window.iwaEvidenceRenderClaim = function(){
    document.getElementById('iwaEvidenceChoice').value = '';
    document.getElementById('iwaEvidenceOutput').textContent = '';
  };
  window.iwaEvidenceReset = function(){
    document.getElementById('iwaEvidenceClaimSelect').value = '0';
    iwaEvidenceRenderClaim();
  };
  window.iwaEvidenceCheck = function(){
    var claimIdx = Number(document.getElementById('iwaEvidenceClaimSelect').value);
    var claim = IWA_EVIDENCE_CLAIMS[claimIdx];
    var choice = document.getElementById('iwaEvidenceChoice').value;
    var out = document.getElementById('iwaEvidenceOutput');
    if(!choice){ out.textContent = ''; return; }
    if(choice === claim.best){
      out.textContent = 'PROPORTIONATE -- '+claim.explain;
    } else {
      out.textContent = 'Consider instead: "'+claim.best+'" -- '+claim.explain+' (this does not mean '+choice+' is always useless -- it depends on the specific claim.)';
    }
  };

  // ---- Task 4: objection handling ----
  window.iwaObjectionRender = function(){
    var idx = Number(document.getElementById('iwaObjectionSelect').value);
    var obj = IWA_OBJECTIONS[idx];
    var html = obj.responses.map(function(r,i){
      return '<label style="display:block;margin-top:8px;font-size:.85rem"><input type="radio" name="iwaObjectionRadio" value="'+i+'" data-change="iwaObjectionCheck()"> '+r.text+'</label>';
    }).join('');
    document.getElementById('iwaObjectionOptions').innerHTML = html;
    document.getElementById('iwaObjectionOutput').textContent = '';
  };
  window.iwaObjectionCheck = function(){
    var idx = Number(document.getElementById('iwaObjectionSelect').value);
    var obj = IWA_OBJECTIONS[idx];
    var checked = document.querySelector('input[name="iwaObjectionRadio"]:checked');
    if(!checked) return;
    var r = obj.responses[Number(checked.value)];
    document.getElementById('iwaObjectionOutput').textContent = (r.ok?'GOOD RESPONSE -- ':'NOT IDEAL -- ')+r.why;
  };

  // ---- Task 5: scope/trade-off negotiator ----
  window.iwaScopeReset = function(){
    var defaults = {scopeEffort:60, reliabilityEffort:20, debtEffort:10, scheduleExt:0, staffingCap:0, phasedCap:0};
    Object.keys(defaults).forEach(function(k){
      var el = document.getElementById('iwa_'+k); if(el) el.value = defaults[k];
      var lbl = document.getElementById('iwaVal_'+k); if(lbl) lbl.textContent = defaults[k];
    });
    document.getElementById('iwaReliabilityFloor').checked = true;
    iwaScopeUpdate();
  };
  window.iwaScopeUpdate = function(){
    var keys = ['scopeEffort','reliabilityEffort','debtEffort','scheduleExt','staffingCap','phasedCap'];
    var v = {};
    keys.forEach(function(k){
      var el = document.getElementById('iwa_'+k);
      v[k] = Number(el.value);
      var lbl = document.getElementById('iwaVal_'+k); if(lbl) lbl.textContent = v[k];
    });
    var floorMet = document.getElementById('iwaReliabilityFloor').checked;
    var required = v.scopeEffort + v.reliabilityEffort + v.debtEffort;
    var baseCapacity = 100;
    var available = baseCapacity + v.scheduleExt + v.staffingCap + v.phasedCap;
    var overcommitment = Math.max(0, required - available);
    var lines = [
      'required effort = scope('+v.scopeEffort+') + reliability('+v.reliabilityEffort+') + debt('+v.debtEffort+') = '+required,
      'available capacity = base(100) + schedule('+v.scheduleExt+') + staffing('+v.staffingCap+') + phased('+v.phasedCap+') = '+available,
      'overcommitment = max(0, required - available) = '+overcommitment
    ];
    var actions = [];
    if(!floorMet){
      lines.push('Risk level: UNSAFE -- reliability floor not met.');
      lines.push('Recommended: pause or decline this plan until reliability is addressed -- capacity math alone cannot override an unsafe reliability floor.');
    } else if(overcommitment === 0){
      lines.push('Risk level: feasible.');
      lines.push('This combination is achievable with the current constraints.');
    } else {
      lines.push('Risk level: '+(overcommitment<=20?'moderate risk':'high risk')+' -- overcommitted by '+overcommitment+' units.');
      actions = ['reduce scope','extend the schedule','add staffing','phase delivery','accept documented debt','decline or pause'];
      lines.push('Possible actions to restore feasibility (more than one may work): '+actions.join(', ')+'.');
    }
    document.getElementById('iwaScopeOutput').textContent = lines.join('\n');
  };

  // ---- Task 6: ethical influence decision ----
  window.iwaEthicalRenderScenario = function(){
    document.getElementById('iwaEthicalAction').value = '';
    document.getElementById('iwaEthicalOutput').textContent = '';
  };
  window.iwaEthicalReset = function(){
    document.getElementById('iwaEthicalSelect').value = '0';
    iwaEthicalRenderScenario();
  };
  window.iwaEthicalCheck = function(){
    var idx = Number(document.getElementById('iwaEthicalSelect').value);
    var scenario = IWA_ETHICAL_SCENARIOS[idx];
    var choice = document.getElementById('iwaEthicalAction').value;
    var out = document.getElementById('iwaEthicalOutput');
    if(!choice){ out.textContent = ''; return; }
    if(choice === scenario.best){
      out.textContent = 'Best next action in this scenario: "'+scenario.best+'". '+(scenario.best==='refuse an unethical request' ? 'This is the only acceptable response here -- hiding a material risk is not a legitimate influence tactic, regardless of who is asking.' : 'This is not a universal rule for every scenario -- it fits the specific facts given here.');
    } else {
      out.textContent = 'Reconsider -- in this specific scenario, "'+scenario.best+'" fits best. This is not a universal ranking of actions; it depends on the specific facts of this scenario.';
    }
  };

  var iwaBooted = false;
  window._influenceBoot = function(){
    if(iwaBooted) return;
    iwaBooted = true;
    renderIwaNav();
    renderIwaTask();
  };
})();
