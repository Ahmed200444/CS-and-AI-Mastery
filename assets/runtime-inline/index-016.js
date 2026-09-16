
(function(){
  // Agent design is largely a judgment discipline (tool scoping, memory
  // classification, when to use an agent at all) rather than something with
  // a single runnable program -- these tasks present a real scenario, the
  // learner picks an answer, and gets immediate, specific feedback checked
  // against the correct choice (not free text, so it's genuinely checkable).

  var AGENT_LESSONS = [
    { id:'agent-tool-selection', mode:'choice', title:'Choosing the right tool for a task',
      explain:'An agent can only do what its tools let it do. Given a task, pick which tool set is actually appropriate -- not more than needed, not less.',
      scenario:'A research assistant agent needs to find and summarize recent news articles on a topic. Which tool set is most appropriate?',
      choices:['Web search + a calculator', 'Web search + a document/page reader', 'File-system delete access + email sending', 'No tools -- just the LLM alone'],
      correct:1,
      feedback:['Not quite -- a calculator doesn\'t help find or read news articles.','Correct -- web search finds articles, and a page reader lets the agent actually read their content before summarizing.','This gives the agent dangerous, unrelated capabilities (delete, email) it doesn\'t need for this task -- a real security risk.','Without search or the ability to read pages, it can\'t find or access anything current.'] },
    { id:'agent-memory-classify', mode:'choice', title:'Short-term vs. long-term memory',
      explain:'Not all information an agent handles should be remembered the same way. Classify this piece of information correctly.',
      scenario:'A user tells the agent, mid-conversation, "actually, use bullet points from now on." Is this short-term or long-term memory?',
      choices:['Short-term only -- it applies just to this conversation', 'Long-term -- it should persist and be recalled in future sessions too', 'Neither -- agents can\'t remember preferences at all', 'It depends only on how long the conversation is'],
      correct:1,
      feedback:['This is a reasonable read for THIS conversation, but a stated formatting preference is usually something a well-designed agent should persist across sessions, not just remember for now.','Correct -- a stated, general preference like this is exactly the kind of fact that should be saved externally (long-term memory) so a future session can recall and apply it, not just held in the current context.','Agents absolutely can persist information via external storage, retrieved back into context later -- that\'s exactly what long-term memory means.','Conversation length isn\'t the deciding factor -- what matters is whether the fact should still matter in a LATER, separate session.'] },
    { id:'agent-planning-reflection', mode:'choice', title:'Where to add a reflection checkpoint',
      explain:'Reflection lets an agent catch its own mistakes before committing to a risky action. Pick the right point to add one.',
      scenario:'An agent\'s plan for "book me the cheapest flight under $500" is: search_flights() -> pick_cheapest() -> book_flight(). Where should a reflection checkpoint go?',
      choices:['Before search_flights(), to reflect on the goal itself', 'After search_flights() and before book_flight(), to verify the picked flight actually meets the constraints', 'After book_flight(), once the booking is already made', 'Reflection isn\'t useful for this kind of task'],
      correct:1,
      feedback:['Reflecting before you have any real information to check against isn\'t very useful yet.','Correct -- checking that the picked flight actually satisfies the constraint (under $500) BEFORE the irreversible booking action is exactly where reflection earns its cost.','By then the (possibly wrong) booking already happened -- reflection needs to happen before the irreversible step, not after.','This is exactly the kind of task where reflection matters -- an irreversible, real-money action (booking) benefits from a check first.'] },
    { id:'agent-least-privilege', mode:'choice', title:'Scoping tool access (least privilege)',
      explain:'An agent should only get the tools its actual task requires -- never broad access "just in case."',
      scenario:'An agent\'s ONLY job is answering questions about internal documentation (read-only lookup). Which tool set correctly follows least privilege?',
      choices:['Document search + document read access only', 'Document search, read access, AND the ability to edit and delete documents', 'Full admin access to the company\'s entire file system', 'Email sending, in case someone wants a copy of the answer'],
      correct:0,
      feedback:['Correct -- this agent only needs to find and read documents to answer questions; nothing more.','Edit and delete access isn\'t needed for a read-only Q&A task, and directly increases the damage a mistake or manipulated input could cause.','This is far broader than the task needs -- a classic least-privilege violation with serious blast-radius risk.','Email sending isn\'t part of this agent\'s actual job -- adding it "just in case" is exactly the anti-pattern least privilege guards against.'] },
    { id:'agent-vs-script', mode:'choice', title:'Agent or simple script?',
      explain:'Not every automation problem needs an agent. Decide based on whether the task genuinely requires dynamic, in-the-moment decisions.',
      scenario:'Every Monday at 9am, fetch a fixed report, reformat it the same way, and email it to the same distribution list -- always the exact same 3 steps, same order, no exceptions. Agent or script?',
      choices:['A full agentic system with an LLM in the loop', 'A simple deterministic script', 'A multi-agent system with a researcher and a writer agent', 'This can\'t be automated at all'],
      correct:1,
      feedback:['This is a fixed, fully predictable sequence -- an agent adds cost, latency, and unpredictability with no real benefit here.','Correct -- when every step is already known and never changes, a plain script is more reliable, cheaper, and easier to debug than an agentic system.','Multi-agent coordination is even more overhead than a single agent for a task with zero real decision-making involved.','This is a textbook case for straightforward automation -- a simple script handles it completely.'] },
    { id:'agent-loop-build', mode:'test', title:'Building the agent loop', funcName:'run_agent_loop',
      explain:'Implement the actual observe-decide-act cycle: given a scripted list of (tool_name, args) decisions (standing in for what an LLM would choose), execute each via the tools dict, and stop as soon as a "done" decision appears.',
      starter:'def run_agent_loop(decisions, tools, max_steps=10):\n    # TODO: for each (tool_name, args) in decisions (stop at max_steps):\n    # - if tool_name == "done", append "DONE" to the log and stop\n    # - otherwise call tools[tool_name](**args), append\n    #   f"{tool_name}({args}) -> {result}" to the log\n    # return the log list\n    log = []\n    pass',
      solution:'def run_agent_loop(decisions, tools, max_steps=10):\n    log = []\n    for i, (tool_name, args) in enumerate(decisions):\n        if i >= max_steps:\n            break\n        if tool_name == "done":\n            log.append("DONE")\n            break\n        result = tools[tool_name](**args)\n        log.append(f"{tool_name}({args}) -> {result}")\n    return log',
      hints:['Loop through decisions with enumerate so you can also check max_steps.','A "done" decision should append "DONE" to the log and break out of the loop.','result = tools[tool_name](**args); log.append(f"{tool_name}({args}) -> {result}")'],
      tests:[
        {argsRepr:'[("search",{"query":"flights"}),("done",{})], {"search": lambda query: f"results for {query}"}', expectedRepr:'["search({\'query\': \'flights\'}) -> results for flights", "DONE"]'},
        {argsRepr:'[("add",{"a":2,"b":3}),("add",{"a":1,"b":1}),("done",{})], {"add": lambda a,b: a+b}', expectedRepr:'["add({\'a\': 2, \'b\': 3}) -> 5", "add({\'a\': 1, \'b\': 1}) -> 2", "DONE"]'}
      ]},
    { id:'agent-tool-dispatch', mode:'test', title:'Tool-calling: dispatch to the right function', funcName:'call_tool',
      explain:'This is the mechanism underneath every "tool call" in the agent loop above: given a tools registry and a requested name, look up and invoke the matching function -- and fail safely if the name doesn\'t exist.',
      starter:'def call_tool(tools, name, args):\n    # TODO: if `name` isn\'t a key in `tools`, return None.\n    # Otherwise call tools[name] with args unpacked as keyword arguments\n    # and return its result.\n    pass',
      solution:'def call_tool(tools, name, args):\n    if name not in tools:\n        return None\n    return tools[name](**args)',
      hints:['Check membership with "name not in tools" before trying to call anything.','tools[name](**args) unpacks the args dict as keyword arguments to the function.','if name not in tools: return None\\nreturn tools[name](**args)'],
      tests:[
        {argsRepr:'{"add": lambda a,b: a+b}, "add", {"a":5,"b":7}', expectedRepr:'12'},
        {argsRepr:'{"add": lambda a,b: a+b}, "missing_tool", {}', expectedRepr:'None'}
      ]},
    { id:'agent-memory-mgmt', mode:'test', title:'Memory management: scoped storage', funcName:'memory_scenario',
      explain:'Building on the short-term-vs-long-term distinction from the earlier scenario: implement a memory store where facts are saved under a named scope, so a "long" scope fact and a "short" scope fact with the same key don\'t collide.',
      starter:'def remember(memory, scope, key, value):\n    memory.setdefault(scope, {})[key] = value\n\ndef recall(memory, scope, key):\n    # TODO: return the value stored under this scope+key,\n    # or None if it was never stored\n    pass\n\ndef memory_scenario():\n    m = {}\n    remember(m, "short", "last_query", "flights")\n    return recall(m, "short", "last_query")',
      solution:'def remember(memory, scope, key, value):\n    memory.setdefault(scope, {})[key] = value\n\ndef recall(memory, scope, key):\n    return memory.get(scope, {}).get(key)\n\ndef memory_scenario():\n    m = {}\n    remember(m, "short", "last_query", "flights")\n    return recall(m, "short", "last_query")',
      hints:['memory is a dict of dicts: {scope: {key: value}}.','Use .get() twice (once for the scope, once for the key) so a missing scope or key returns None instead of raising.','return memory.get(scope, {}).get(key)'],
      tests:[
        {argsRepr:'', expectedRepr:"'flights'"}
      ]},
    { id:'agent-debug-tool-selection', mode:'fix-code', title:'Debugging: the agent picks the wrong tool', testName:'test_select_tool',
      explain:'This test is correct and already given. The tool-selection function it checks has a real bug -- find and fix it so the test passes.',
      given:'def test_select_tool():\n    assert select_tool("what is the weather today") == "weather_api"\n    assert select_tool("add 5 and 3") == "calculator"\n    assert select_tool("find recent news") == "search"\n\n',
      starter:'# BUG: this misroutes weather queries to the wrong tool -- find and fix it\ndef select_tool(query):\n    if "weather" in query:\n        return "calculator"\n    if "add" in query or "sum" in query:\n        return "calculator"\n    return "search"',
      hints:['Run it and see exactly which assertion fails first.','A weather query is being routed to "calculator" -- that\'s clearly wrong; it should go to "weather_api".','def select_tool(query):\\n    if "add" in query or "sum" in query:\\n        return "calculator"\\n    if "weather" in query:\\n        return "weather_api"\\n    return "search"'],
      solution:'def select_tool(query):\n    if "add" in query or "sum" in query:\n        return "calculator"\n    if "weather" in query:\n        return "weather_api"\n    return "search"' },
    { id:'agent-stopping-condition', mode:'test', title:'Stopping conditions: avoid an infinite loop', funcName:'counter_scenario',
      explain:'A real agent loop needs TWO ways to stop: a real success condition, AND a hard safety cap in case that condition never becomes true (a buggy or adversarial situation) -- implement both.',
      starter:'def run_until_done(check_done, step_fn, max_steps=100):\n    # TODO: repeatedly call step_fn() until either check_done() returns True,\n    # or you\'ve run max_steps times (whichever comes first).\n    # Return the number of steps actually taken.\n    pass\n\ndef counter_scenario():\n    counter = [0]\n    def step(): counter[0] += 1\n    def done(): return counter[0] >= 5\n    return run_until_done(done, step, max_steps=100)\n\ndef capped_scenario():\n    counter = [0]\n    def step(): counter[0] += 1\n    def never_done(): return False\n    return run_until_done(never_done, step, max_steps=20)',
      solution:'def run_until_done(check_done, step_fn, max_steps=100):\n    steps = 0\n    while steps < max_steps:\n        if check_done():\n            return steps\n        step_fn()\n        steps += 1\n    return steps\n\ndef counter_scenario():\n    counter = [0]\n    def step(): counter[0] += 1\n    def done(): return counter[0] >= 5\n    return run_until_done(done, step, max_steps=100)\n\ndef capped_scenario():\n    counter = [0]\n    def step(): counter[0] += 1\n    def never_done(): return False\n    return run_until_done(never_done, step, max_steps=20)',
      hints:['A while loop bounded by max_steps is the safety cap; check_done() inside it is the real success condition.','Check check_done() BEFORE calling step_fn() each iteration, so you return the moment it\'s already true.','steps = 0\\nwhile steps < max_steps:\\n    if check_done(): return steps\\n    step_fn()\\n    steps += 1\\nreturn steps'],
      tests:[
        {argsRepr:'', expectedRepr:'5'}
      ]},
    { id:'agent-human-approval', mode:'test', title:'Human-in-the-loop approval gate', funcName:'execute_with_approval',
      explain:'Some actions (sending an email, making a purchase, deleting data) shouldn\'t execute automatically -- implement the gate that blocks an action until it\'s explicitly approved.',
      starter:'def execute_with_approval(action_name, approved):\n    # TODO: if not approved, return f"BLOCKED: \'{action_name}\' requires human approval"\n    # otherwise return f"EXECUTED: {action_name}"\n    pass',
      solution:'def execute_with_approval(action_name, approved):\n    if not approved:\n        return f"BLOCKED: \'{action_name}\' requires human approval"\n    return f"EXECUTED: {action_name}"',
      hints:['This is a one-line conditional check on the `approved` boolean.','Check "if not approved" first -- that\'s the blocking path.','if not approved: return f"BLOCKED: \'{action_name}\' requires human approval"\\nreturn f"EXECUTED: {action_name}"'],
      tests:[
        {argsRepr:'"send_email", False', expectedRepr:'"BLOCKED: \'send_email\' requires human approval"'},
        {argsRepr:'"send_email", True', expectedRepr:'"EXECUTED: send_email"'}
      ]},
    { id:'agent-prompt-experiment', mode:'test', title:'Prompt engineering: changing behavior via template', funcName:'build_prompt',
      explain:'This is the mechanism behind "the same agent, different instructions": build a function that fills a prompt template with variables, so changing the template changes the agent\'s effective instructions without touching any other code.',
      starter:'def build_prompt(template, variables):\n    # TODO: return the template with each {placeholder} filled in\n    # from the variables dict (hint: str.format does this directly)\n    pass',
      solution:'def build_prompt(template, variables):\n    return template.format(**variables)',
      hints:['Python\'s str.format() fills in {name}-style placeholders from keyword arguments.','Unpack the variables dict as keyword arguments: template.format(**variables)','return template.format(**variables)'],
      tests:[
        {argsRepr:'"Summarize this in {style}: {text}", {"style":"bullet points","text":"the article"}', expectedRepr:"'Summarize this in bullet points: the article'"}
      ]},
    { id:'agent-multi-agent-pipeline', mode:'test', title:'Multi-agent coordination: researcher hands off to writer', funcName:'run_pipeline',
      explain:'A multi-agent system splits work across specialized agents. Implement the hand-off: a research step\'s output becomes the writer step\'s input.',
      starter:'def run_pipeline(research_fn, write_fn, topic):\n    # TODO: call research_fn(topic) to get findings, then pass those\n    # findings into write_fn, and return write_fn\'s result\n    pass',
      solution:'def run_pipeline(research_fn, write_fn, topic):\n    findings = research_fn(topic)\n    return write_fn(findings)',
      hints:['This is a two-step hand-off: call one function, then feed its result into the next.','findings = research_fn(topic); return write_fn(findings)'],
      tests:[
        {argsRepr:'lambda topic: f"3 facts about {topic}", lambda findings: f"Article based on: {findings}", "agents"', expectedRepr:"'Article based on: 3 facts about agents'"}
      ]}
  ];

  function agentTKey(id, field){ return 'agenttrack:'+id+':'+field; }
  function agentTSave(id, field, val){ try{ localStorage.setItem(agentTKey(id,field), val); }catch(e){} }
  function agentTLoad(id, field, fallback){ try{ var v=localStorage.getItem(agentTKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function agentTDoneKey(id){ return 'agenttrack:'+id+':done'; }
  function agentTIsDone(id){ try{ return localStorage.getItem(agentTDoneKey(id))==='1'; }catch(e){ return false; } }
  function agentTEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var agentCurIdx = 0;

  window.agentTOpen = function(idx){
    agentCurIdx = idx;
    renderAgentTNav();
    renderAgentTLesson();
    window.scrollTo(0,0);
  };
  window.agentTNext = function(){ if(agentCurIdx < AGENT_LESSONS.length-1) window.agentTOpen(agentCurIdx+1); };
  window.agentTPrev = function(){ if(agentCurIdx > 0) window.agentTOpen(agentCurIdx-1); };
  window.agentTMarkDone = function(idx){
    try{ localStorage.setItem(agentTDoneKey(AGENT_LESSONS[idx].id), '1'); }catch(e){}
    renderAgentTNav();
  };

  function renderAgentTNav(){
    var nav = document.getElementById('agentLessonNav');
    if(!nav) return;
    nav.innerHTML = AGENT_LESSONS.map(function(l, i){
      var done = agentTIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===agentCurIdx?'active':'')+'" data-act="agentTOpen('+i+')">'+(i+1)+'. '+agentTEsc(l.title)+done+'</button>';
    }).join('');
  }

  function agentNavRow(){
    return '<div class="wd-navrow">'
      + (agentCurIdx>0 ? '<button class="wd-btn-ghost" data-act="agentTPrev()">&larr; Previous</button>' : '<span></span>')
      + (agentCurIdx<AGENT_LESSONS.length-1 ? '<button class="wd-btn" data-act="agentTNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  function renderAgentTLesson(){
    var body = document.getElementById('agentLessonBody');
    if(!body) return;
    var l = AGENT_LESSONS[agentCurIdx];

    if(l.mode === 'test' || l.mode === 'fix-code'){
      var savedCode = agentTLoad(l.id, 'code', l.starter);
      var idBase = 'agentpm_'+l.id;
      var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
      var hintHtml = l.hints.map(function(h,i){
        return '<button data-act="agentTRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
      }).join('') + '<button data-act="agentTRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
      var hintBoxes = l.hints.map(function(h,i){
        return '<div class="wd-hintbox" id="agenthint_'+l.id+'_'+(i+1)+'">'+agentTEsc(h)+'</div>';
      }).join('') + '<div class="wd-hintbox" id="agenthint_'+l.id+'_99"><b>Solution:</b><pre>'+agentTEsc(l.solution||'')+'</pre></div>';

      body.innerHTML =
        '<div class="wd-lesson-head"><h2>'+trackNumBadge(agentCurIdx+1)+agentTEsc(l.title)+'</h2></div>'
        + trackMentalModel(agentTEsc(l.explain))
        + (l.mode==='fix-code' ? '<div class="note"><b>Given, correct test</b> (do not edit -- shown for reference):<pre style="background:var(--code-bg);color:var(--code-text);border:1px solid var(--line);border-radius:8px;padding:10px;font-size:.8rem;margin-top:8px">'+agentTEsc(l.given)+'</pre></div>' : '')
        + '<div class="card">'
        + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:140px">'+agentTEsc(savedCode)+'</textarea>')
        + '<div class="wd-row">'
          + '<button class="wd-btn" data-act="agentTRun(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run '+(l.mode==='test'?'tests':'')+'</button>'
          + '<button class="wd-btn-ghost" data-act="agentTResetCode(\''+l.id+'\',\''+editId+'\')">Reset</button>'
          + '<button class="wd-btn-ghost" data-act="agentTMarkDone('+agentCurIdx+')">Mark task done</button>'
        + '</div>'
        + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
        + '<div class="wd-out" id="'+outId+'"></div>'
        + '</div>'
        + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes
        + agentNavRow();
      return;
    }

    var choicesHtml = l.choices.map(function(c, i){
      return '<button class="agent-choice-btn" id="agentchoice_'+l.id+'_'+i+'" data-act="agentTAnswer(\''+l.id+'\','+i+')">'+agentTEsc(c)+'</button>';
    }).join('');

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(agentCurIdx+1)+agentTEsc(l.title)+'</h2></div>'
        + trackMentalModel(agentTEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+agentTEsc(l.scenario)+'</p>'
      + '<div id="agentchoices_'+l.id+'">'+choicesHtml+'</div>'
      + '<div class="agent-feedback" id="agentfeedback_'+l.id+'"></div>'
      + '<div class="wd-row">'
        + '<button class="wd-btn-ghost" data-act="agentTMarkDone('+agentCurIdx+')">Mark task done</button>'
      + '</div>'
      + agentNavRow();
  }

  window.agentTResetCode = function(lessonId, editId){
    var l = AGENT_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    agentTSave(lessonId, 'code', l.starter);
  };

  window.agentTRevealHint = function(lessonId, tier){
    var l = AGENT_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l || !l.hints) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('agenthint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  // Reuses the shared Pyodide (getPy/RUN_HARNESS) exactly like DSA/RAG/
  // Testing/System Design/Backend -- no new Python runtime. 'test' tasks use
  // the standard funcName+tests harness; 'fix-code' tasks reuse the Testing
  // track's given-correct-test pattern (run it, report pass/fail).
  window.agentTRun = async function(lessonId, editId, outId, statusId){
    var l = AGENT_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    agentTSave(lessonId, 'code', code);
    var out = document.getElementById(outId);
    if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py;
    try{ py = await getPy(statusId); }
    catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }

    if(l.mode === 'fix-code'){
      var fullCode = (l.given || '') + code;
      var harness = 'try:\n    ' + l.testName + '()\n    print("TEST_PASSED")\nexcept AssertionError as _e:\n    print("TEST_FAILED: " + str(_e))\nexcept Exception as _e:\n    print("ERROR: " + str(_e))\n';
      var fullSrc0 = fullCode + '\n\n' + harness;
      try{
        py.globals.set('_SRC', fullSrc0);
        py.runPython(RUN_HARNESS);
        var result0 = py.globals.get('_RESULT');
        var iserr0 = py.globals.get('_ISERR');
        if(iserr0){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result0)+'</span>'; return; }
        if(out) out.innerHTML = result0.indexOf('TEST_PASSED') >= 0
          ? '<div class="dsa-testrow pass"><span>'+agentTEsc(l.testName)+'()</span><span>PASS</span></div>'
          : '<span class="err">'+escapeHtml(result0)+'</span>';
      }catch(e){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>'; }
      return;
    }

    var harnessLines = ['_agent_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push(
        'try:\n'+
        '    _r = '+l.funcName+'('+t.argsRepr+')\n'+
        '    _exp = ('+t.expectedRepr+')\n'+
        '    _ok = (_r == _exp)\n'+
        '    _agent_results.append(("'+i+'", _ok, repr(_r)))\n'+
        'except Exception as _e:\n'+
        '    _agent_results.append(("'+i+'", False, "Error: " + str(_e)))'
      );
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _agent_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';

    try{
      py.globals.set('_SRC', fullSrc);
      py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT');
      var iserr = py.globals.get('_ISERR');
      if(iserr){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>'; return; }
      var lines = result.split('\n').filter(function(ln){ return ln.indexOf('TESTCASE|') === 0; });
      if(!lines.length){ if(out) out.textContent = result || '(no test results -- check the function name matches exactly)'; return; }
      var rows = lines.map(function(ln){
        var parts = ln.split('|');
        return '<div class="dsa-testrow '+(parts[2]==='PASS'?'pass':'fail')+'"><span>Test '+(Number(parts[1])+1)+'</span><span>'+parts[2]+' &mdash; got '+agentTEsc(parts[3])+'</span></div>';
      }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){
      if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>';
    }
  };

  window.agentTAnswer = function(lessonId, choiceIdx){
    var l = AGENT_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('agentchoice_'+lessonId+'_'+i);
      if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('agentfeedback_'+lessonId);
    if(fb){
      fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong');
      fb.textContent = l.feedback[choiceIdx];
    }
    agentTSave(lessonId, 'answered', String(choiceIdx));
  };

  var agentTBooted = false;
  window._agentTBoot = function(){
    if(agentTBooted) return;
    agentTBooted = true;
    window.agentTOpen(0);
  };
})();
