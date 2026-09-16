
(function(){
  var NET_LESSONS = [
    { id:'net-dns-resolve', title:'Resolve a DNS Chain', funcName:'resolve_dns',
      explain:'Given a starting hostname and a dict of DNS records (each either a CNAME pointing to another name, or an A record with a final IP), follow the chain until you reach an A record. Return the final IP address.',
      starter:'def resolve_dns(hostname, records):\n    # records: {name: ("CNAME", target_name)} or {name: ("A", ip)}\n    # TODO: follow the chain starting at hostname until you hit an A record,\n    # then return that IP address (or None if the chain breaks)\n    pass',
      solution:'def resolve_dns(hostname, records):\n    current = hostname\n    for _ in range(10):\n        if current not in records:\n            return None\n        rtype, value = records[current]\n        if rtype == "A":\n            return value\n        current = value\n    return None',
      hints:['A record means "this is the final IP" -- stop and return it. A CNAME means "look up this OTHER name instead" -- keep following the chain.','Use a loop that keeps looking up the current name in records, until you hit an A record.','Guard against an infinite loop (a broken or circular chain) with a maximum number of hops, like a for loop with a fixed range.'],
      complexity:'Time: O(chain length) -- typically very short in practice. Space: O(1).',
      tests:[
        {argsRepr:'\'shop.example.com\', {"shop.example.com": ("CNAME", "cdn.example.com"), "cdn.example.com": ("A", "93.184.216.34")}', expectedRepr:"'93.184.216.34'"},
        {argsRepr:'\'api.example.com\', {"api.example.com": ("A", "10.0.0.5")}', expectedRepr:"'10.0.0.5'"}
      ]},
    { id:'net-tcp-handshake', title:'TCP Handshake State Machine', funcName:'tcp_handshake',
      explain:'Given a sequence of handshake events (SYN, SYN-ACK, ACK), simulate the TCP connection state machine. Return the final state -- "ESTABLISHED" if the sequence is correct and complete, or an error describing what went wrong.',
      starter:'def tcp_handshake(events):\n    # TODO: simulate the 3-way handshake state machine.\n    # Valid sequence: CLOSED -> SYN -> SYN_SENT -> SYN-ACK -> (pending ACK) -> ACK -> ESTABLISHED\n    # Return "ESTABLISHED" on success, or "ERROR: unexpected X in state Y" otherwise.\n    pass',
      solution:'def tcp_handshake(events):\n    state = "CLOSED"\n    for e in events:\n        if state == "CLOSED" and e == "SYN":\n            state = "SYN_SENT"\n        elif state == "SYN_SENT" and e == "SYN-ACK":\n            state = "ESTABLISHED_PENDING_ACK"\n        elif state == "ESTABLISHED_PENDING_ACK" and e == "ACK":\n            state = "ESTABLISHED"\n        else:\n            return "ERROR: unexpected " + e + " in state " + state\n    return state',
      hints:['Track a "current state" variable, starting at "CLOSED".','Each event is only valid in ONE specific state -- SYN only from CLOSED, SYN-ACK only from SYN_SENT, ACK only from the pending-ACK state.','If an event doesn\'t match what\'s valid for the current state, that\'s an error -- return a message describing it instead of silently continuing.'],
      complexity:'Time: O(n) -- one pass through the events. Space: O(1).',
      tests:[
        {argsRepr:"['SYN','SYN-ACK','ACK']", expectedRepr:"'ESTABLISHED'"},
        {argsRepr:"['SYN','ACK']", expectedRepr:"'ERROR: unexpected ACK in state SYN_SENT'"}
      ]},
    { id:'net-classify-ip', title:'Classify an IP Address', funcName:'classify_ip',
      explain:'Given an IPv4 address as a string, classify it as "private", "loopback", or "public" -- WITHOUT any subnet-mask arithmetic, just checking against the well-known reserved ranges.',
      starter:'def classify_ip(ip):\n    # ip is a string like "192.168.1.1". TODO: split into 4 integer parts\n    # and classify as "private" (10.x, 172.16-31.x, 192.168.x), "loopback" (127.x), or "public"\n    pass',
      solution:'def classify_ip(ip):\n    parts = [int(p) for p in ip.split(".")]\n    a, b = parts[0], parts[1]\n    if a == 10:\n        return "private"\n    if a == 172 and 16 <= b <= 31:\n        return "private"\n    if a == 192 and b == 168:\n        return "private"\n    if a == 127:\n        return "loopback"\n    return "public"',
      hints:['Split the string on "." and convert each part to an integer -- you only need the first two parts to classify.','The three private ranges are: 10.x.x.x, 172.16.x.x through 172.31.x.x, and 192.168.x.x -- check each explicitly.','127.x.x.x is a special case (loopback/localhost), not really "private" in the same sense -- check for it separately.'],
      complexity:'Time: O(1) -- fixed number of comparisons. Space: O(1).',
      tests:[
        {argsRepr:"'10.0.0.5'", expectedRepr:"'private'"},
        {argsRepr:"'172.20.5.1'", expectedRepr:"'private'"},
        {argsRepr:"'8.8.8.8'", expectedRepr:"'public'"},
        {argsRepr:"'127.0.0.1'", expectedRepr:"'loopback'"}
      ]},
    { id:'net-identify-service', title:'Identify a Service by Port', funcName:'identify_service',
      explain:'Given a port number, identify the well-known service that typically runs on it (HTTP, HTTPS, SSH, DNS, etc.), or report it as unknown if it\'s outside the well-known ports this task covers.',
      starter:'def identify_service(port):\n    # TODO: return the service name for well-known ports (80, 443, 22, 21, 25, 53,\n    # 3306, 5432, 6379, 8080), or "unknown/ephemeral" for anything else\n    pass',
      solution:'def identify_service(port):\n    known = {80:"HTTP", 443:"HTTPS", 22:"SSH", 21:"FTP", 25:"SMTP", 53:"DNS", 3306:"MySQL", 5432:"PostgreSQL", 6379:"Redis", 8080:"HTTP-alt"}\n    return known.get(port, "unknown/ephemeral")',
      hints:['A dictionary mapping port numbers to service names is the simplest way to store this lookup.','Use the dict\'s .get() method with a default value, instead of an if/elif chain, to handle unknown ports cleanly.','Double-check the exact spelling expected for each service name in the test cases.'],
      complexity:'Time: O(1) -- a single dictionary lookup. Space: O(1).',
      tests:[
        {argsRepr:'80', expectedRepr:"'HTTP'"},
        {argsRepr:'443', expectedRepr:"'HTTPS'"},
        {argsRepr:'5432', expectedRepr:"'PostgreSQL'"},
        {argsRepr:'9999', expectedRepr:"'unknown/ephemeral'"}
      ]},
    { id:'net-diagnose', title:'Network Diagnostic Tool', funcName:'diagnose',
      explain:'Given a dict of observed signals (dns_resolved, tcp_connected, http_status, latency_ms), determine the most likely root cause of a connectivity problem -- the core logic behind this course\'s capstone.',
      starter:'def diagnose(symptoms):\n    # symptoms may include: dns_resolved (bool), tcp_connected (bool),\n    # http_status (int), latency_ms (int). TODO: return the most likely\n    # cause as a descriptive string, checking DNS first, then TCP, then HTTP status, then latency\n    pass',
      solution:'def diagnose(symptoms):\n    if not symptoms.get("dns_resolved", True):\n        return "DNS resolution failure -- hostname could not be resolved"\n    if not symptoms.get("tcp_connected", True):\n        return "TCP connection failure -- port likely closed or firewall blocking"\n    if symptoms.get("http_status") == 504:\n        return "Gateway timeout -- upstream server too slow or unreachable"\n    if symptoms.get("latency_ms", 0) > 1000:\n        return "High latency -- network congestion or routing issue"\n    if symptoms.get("http_status") == 200:\n        return "No issue detected -- request succeeded normally"\n    return "Unclear -- insufficient diagnostic signal"',
      hints:['Check symptoms in LAYER ORDER: DNS first (nothing works without it), then TCP, then HTTP status, then latency -- an earlier-layer failure explains everything after it.','Use .get() with a sensible default for each key, since not every symptom dict will include every field.','A 504 status code specifically means gateway timeout -- check for that exact value before falling through to a generic latency check.'],
      complexity:'Time: O(1) -- a fixed sequence of checks. Space: O(1).',
      tests:[
        {argsRepr:"{'dns_resolved': False}", expectedRepr:"'DNS resolution failure -- hostname could not be resolved'"},
        {argsRepr:"{'dns_resolved': True, 'tcp_connected': False}", expectedRepr:"'TCP connection failure -- port likely closed or firewall blocking'"},
        {argsRepr:"{'dns_resolved': True, 'tcp_connected': True, 'http_status': 504}", expectedRepr:"'Gateway timeout -- upstream server too slow or unreachable'"},
        {argsRepr:"{'dns_resolved': True, 'tcp_connected': True, 'http_status': 200, 'latency_ms': 50}", expectedRepr:"'No issue detected -- request succeeded normally'"}
      ]}
  ];

  var netCurIdx = 0;
  function netEsc(s){ return escapeHtml(s); }
  function netDoneKey(id){ return 'net_done_'+id; }
  function netSaveKey(id){ return 'net_code_'+id; }

  function netLoad(id, fallback){
    try { var v = localStorage.getItem(netSaveKey(id)); return v!==null ? v : fallback; } catch(e){ return fallback; }
  }
  function netSave(id, code){ try { localStorage.setItem(netSaveKey(id), code); } catch(e){} }
  function netIsDone(id){ try { return localStorage.getItem(netDoneKey(id))==='1'; } catch(e){ return false; } }

  window.netMarkDone = function(idx){
    try { localStorage.setItem(netDoneKey(NET_LESSONS[idx].id), '1'); } catch(e){}
    renderNetNav(); renderNetLesson();
  };

  function renderNetNav(){
    var nav = document.getElementById('networkLessonNav');
    if(!nav) return;
    nav.innerHTML = NET_LESSONS.map(function(l, i){
      var done = netIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===netCurIdx?'active':'')+'" data-act="netOpen('+i+')">'+(i+1)+'. '+netEsc(l.title)+done+'</button>';
    }).join('');
  }

  window.netOpen = function(idx){ netCurIdx = idx; renderNetNav(); renderNetLesson(); };
  window.netNext = function(){ if(netCurIdx < NET_LESSONS.length-1){ netCurIdx++; renderNetNav(); renderNetLesson(); } };
  window.netPrev = function(){ if(netCurIdx > 0){ netCurIdx--; renderNetNav(); renderNetLesson(); } };

  window.netReset = function(id, editId){
    var l = NET_LESSONS.find(function(x){ return x.id === id; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    netSave(id, l.starter);
  };

  window.netRevealHint = function(lessonId, tier){
    var l = NET_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('nethint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  window.netRunTests = async function(id, editId, outId, statusId){
    var l = NET_LESSONS.find(function(x){ return x.id === id; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    netSave(id, code);
    var out = document.getElementById(outId);
    if(out){ out.className = 'wd-out'; out.textContent = 'Running…'; }
    var py;
    try{ py = await getPy(statusId); }
    catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }

    var harnessLines = ['_net_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push(
        'try:\n'+
        '    _r = '+l.funcName+'('+t.argsRepr+')\n'+
        '    _net_results.append(("'+i+'", _r == ('+t.expectedRepr+'), repr(_r)))\n'+
        'except Exception as _e:\n'+
        '    _net_results.append(("'+i+'", False, "Error: " + str(_e)))'
      );
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _net_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';

    try{
      try{ await py.loadPackagesFromImports(fullSrc); }catch(e){ /* offline or unneeded -- fall through */ }
      py.globals.set('_SRC', fullSrc);
      py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT');
      var iserr = py.globals.get('_ISERR');
      if(iserr){
        if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>';
        return;
      }
      var lines = result.split('\n').filter(function(ln){ return ln.indexOf('TESTCASE|') === 0; });
      if(!lines.length){
        if(out) out.textContent = result || '(no test results -- did you rename the function? it must be called "'+l.funcName+'")';
        return;
      }
      var rows = lines.map(function(ln){
        var parts = ln.split('|');
        var idx = parts[1], status = parts[2], detail = parts[3];
        var t = l.tests[Number(idx)];
        return '<div class="dsa-testrow '+(status==='PASS'?'pass':'fail')+'">'
          + '<span>Test '+(Number(idx)+1)+': '+netEsc(l.funcName)+'('+netEsc(t.argsRepr)+')</span>'
          + '<span>'+status+' &mdash; got '+netEsc(detail)+'</span></div>';
      }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){
      if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>';
    }
  };

  function renderNetLesson(){
    var body = document.getElementById('networkLessonBody');
    if(!body) return;
    var l = NET_LESSONS[netCurIdx];
    var editId = 'netEd_'+l.id;
    var outId = 'netOut_'+l.id;
    var statusId = 'netStatus_'+l.id;
    var savedCode = netLoad(l.id, l.starter);
    var hintHtml = l.hints.map(function(h, i){
      return '<button class="wd-btn-ghost" data-act="netRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button class="wd-btn-ghost" data-act="netRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h, i){
      return '<div class="wd-hintbox" id="nethint_'+l.id+'_'+(i+1)+'">'+netEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="nethint_'+l.id+'_99"><pre style="white-space:pre-wrap;margin:0">'+netEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(netCurIdx+1)+netEsc(l.title)+'</h2></div>'
      + trackMentalModel(netEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:130px">'+netEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="netRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
        + '<button class="wd-btn-ghost" data-act="netReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="netMarkDone('+netCurIdx+')">Mark solved</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="dsa-complexity"><b>Complexity:</b> '+netEsc(l.complexity)+'</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>'
      + hintBoxes
      + '<div class="wd-navrow">'
        + (netCurIdx>0 ? '<button class="wd-btn-ghost" data-act="netPrev()">&larr; Previous</button>' : '<span></span>')
        + (netCurIdx<NET_LESSONS.length-1 ? '<button class="wd-btn" data-act="netNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  var netBooted = false;
  window._networkBoot = function(){
    if(netBooted) return;
    netBooted = true;
    renderNetNav();
    renderNetLesson();
  };
})();
