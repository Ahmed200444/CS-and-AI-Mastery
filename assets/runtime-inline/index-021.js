
(function(){
  // ---- Reusable "API request/response lab" component -----------------------
  // SIMULATED throughout: no real network calls are ever made. Each task
  // defines a mock endpoint's behavior; the learner builds a request (method,
  // headers, body) and the simulator returns a deterministic, realistic
  // response based on what was actually submitted -- so choices like a wrong
  // method, a missing header, or bad JSON produce a genuinely different,
  // correct result rather than a canned response.

  var API_LESSONS = [
    { id:'api-methods', title:'Choosing the right HTTP method',
      explain:'A mock endpoint /orders/42 behaves differently depending on which HTTP method you send. Try GET (read), then PATCH (partial update), then DELETE -- notice how each returns a different, correct response.',
      endpoint:'/orders/42', defaultMethod:'GET', showHeaders:false, showBody:false,
      responder:function(req){
        if(req.method==='GET') return {status:200, body:{id:42,item:'Wireless Mouse',status:'shipped'}};
        if(req.method==='PATCH') return {status:200, body:{id:42,status:'shipped',note:'partial update applied'}};
        if(req.method==='DELETE') return {status:204, body:null};
        if(req.method==='PUT') return {status:200, body:{id:42,item:'Wireless Mouse',status:'shipped',note:'FULL resource replaced -- any fields you omitted are now gone'}};
        return {status:405, body:{error:'Method Not Allowed'}};
      },
      hints:['GET only reads -- it should never change data.','PATCH updates part of a resource; PUT replaces the whole thing.','Try DELETE and notice the response has no body (204 No Content).'],
      solution:'Send GET to read the order, PATCH to update just one field (like status), and DELETE to remove it -- compare how PUT (full replace) differs from PATCH (partial update) in the response.' },
    { id:'api-headers', title:'Authentication headers',
      explain:'This mock endpoint requires an Authorization header. Try sending the request with no headers first, then add "Authorization: Bearer secrettoken123" and compare the results.',
      endpoint:'/account/profile', defaultMethod:'GET', showHeaders:true, showBody:false,
      responder:function(req){
        var auth = (req.headers||{}).Authorization || (req.headers||{}).authorization;
        if(!auth) return {status:401, body:{error:'Missing Authorization header'}};
        if(auth !== 'Bearer secrettoken123') return {status:401, body:{error:'Invalid token'}};
        return {status:200, body:{username:'ahmed_dev', plan:'pro'}};
      },
      hints:['This endpoint checks for a header literally named "Authorization".','The expected format is "Bearer <token>" -- a space between the word Bearer and the token.','Try: Authorization: Bearer secrettoken123'],
      solution:'Add a header line exactly as: Authorization: Bearer secrettoken123 -- without it, or with the wrong token, the server correctly returns 401 Unauthorized.' },
    { id:'api-json-body', title:'Sending a JSON request body',
      explain:'POST to /orders to create a new order. The body must be valid JSON with an "item" field. Try sending invalid JSON, then valid JSON missing "item", then a fully correct body.',
      endpoint:'/orders', defaultMethod:'POST', showHeaders:false, showBody:true,
      responder:function(req){
        var parsed;
        try{ parsed = JSON.parse(req.body || ''); }
        catch(e){ return {status:400, body:{error:'Invalid JSON: '+e.message}}; }
        if(!parsed || typeof parsed.item !== 'string' || !parsed.item){
          return {status:400, body:{error:'Missing required field: item'}};
        }
        return {status:201, body:{id:99, item:parsed.item, status:'created'}};
      },
      hints:['The body box expects valid JSON -- check for matching braces and quotes.','A minimal valid body looks like: {"item": "Keyboard"}','Try: {"item": "Keyboard"} -- valid JSON with the required field present.'],
      solution:'{"item": "Keyboard"} -- valid JSON syntax, with the required "item" field present, correctly returns 201 Created.' },
    { id:'api-status-codes', title:'Reading status codes',
      explain:'This mock endpoint /search returns a different status depending on the query you send. Try an empty query, a query for "widget" (found), and a query for "zzz" (not found).',
      endpoint:'/search?q=', defaultMethod:'GET', showHeaders:false, showBody:false,
      responder:function(req){
        var m = (req.url||'').match(/[?&]q=([^&]*)/);
        var q = m ? decodeURIComponent(m[1]) : '';
        if(!q) return {status:400, body:{error:'Query parameter "q" is required'}};
        if(q.toLowerCase()==='widget') return {status:200, body:{results:[{id:1,name:'Blue Widget'},{id:2,name:'Red Widget'}]}};
        return {status:404, body:{error:'No results found for: '+q}};
      },
      hints:['The URL field supports query parameters like ?q=something.','Try /search?q=widget for a result that exists in this mock dataset.','Try /search?q=zzz for a query with no matches -- notice the status code.'],
      solution:'/search?q=widget returns 200 with results; /search?q=zzz returns 404 (no results); /search?q= (empty) returns 400 (bad request) -- three different status codes for three different situations.' },
    { id:'api-rate-limit', title:'Handling rate limits',
      explain:'This mock endpoint simulates rate limiting: your first 3 requests in this task succeed, then you get rate-limited. Click "Send" repeatedly and watch what happens after request 3.',
      endpoint:'/api/data', defaultMethod:'GET', showHeaders:false, showBody:false,
      statefulCounter:0,
      responder:function(req, state){
        state.count = (state.count||0) + 1;
        if(state.count > 3) return {status:429, body:{error:'Too Many Requests'}, extraHeaders:'Retry-After: 30'};
        return {status:200, body:{request_number:state.count, data:'ok'}};
      },
      hints:['Click Send multiple times in a row and watch the request_number in the response.','After 3 successful requests, the mock server starts returning 429.','A well-behaved client would wait (per Retry-After) before retrying after a 429, not hammer the endpoint.'],
      solution:'After 3 successful 200 responses, the endpoint returns 429 Too Many Requests with a Retry-After header -- the correct response is to wait before retrying, not immediately resend.' },
    { id:'api-debug-500', title:'Debugging scenario: unexpected 500',
      explain:'This mock endpoint /checkout expects a JSON body with a numeric "amount" field. Try sending it as a string ("amount": "20") instead of a number, and see how the server responds -- then fix it.',
      endpoint:'/checkout', defaultMethod:'POST', showHeaders:false, showBody:true,
      responder:function(req){
        var parsed;
        try{ parsed = JSON.parse(req.body || ''); }
        catch(e){ return {status:400, body:{error:'Invalid JSON'}}; }
        if(typeof parsed.amount === 'string'){
          return {status:500, body:{error:'Internal Server Error: amount must be a number, got a string'}};
        }
        if(typeof parsed.amount !== 'number'){
          return {status:400, body:{error:'Missing or invalid "amount" field'}};
        }
        return {status:200, body:{charged:parsed.amount, status:'success'}};
      },
      hints:['JSON distinguishes numbers from strings -- "20" (with quotes) is a string, 20 (no quotes) is a number.','A well-designed API should return 400 for this, not 500 -- 500 here represents a real, common backend bug.','Fix it by sending {"amount": 20} with amount as a genuine JSON number, no quotes.'],
      solution:'{"amount": 20} -- amount as an actual JSON number (no quotes) succeeds. This task deliberately shows a 500 for a client mistake, illustrating a real, common backend bug: the server should validate and return 400, not crash with 500, when given the wrong type.' }
  ];

  function apiKey(id, field){ return 'apitrack:'+id+':'+field; }
  function apiSave(id, field, val){ try{ localStorage.setItem(apiKey(id,field), val); }catch(e){} }
  function apiLoad(id, field, fallback){ try{ var v=localStorage.getItem(apiKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function apiDoneKey(id){ return 'apitrack:'+id+':done'; }
  function apiIsDone(id){ try{ return localStorage.getItem(apiDoneKey(id))==='1'; }catch(e){ return false; } }
  function apiEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var apiCurIdx = 0;
  var API_STATE = {}; // per-lesson mutable state (e.g. rate-limit counters), reset on Reset

  window.apiOpen = function(idx){
    apiCurIdx = idx;
    renderApiNav();
    renderApiLesson();
    window.scrollTo(0,0);
  };
  window.apiNext = function(){ if(apiCurIdx < API_LESSONS.length-1) window.apiOpen(apiCurIdx+1); };
  window.apiPrev = function(){ if(apiCurIdx > 0) window.apiOpen(apiCurIdx-1); };
  window.apiMarkDone = function(idx){
    try{ localStorage.setItem(apiDoneKey(API_LESSONS[idx].id), '1'); }catch(e){}
    renderApiNav();
  };

  function renderApiNav(){
    var nav = document.getElementById('apiLessonNav');
    if(!nav) return;
    nav.innerHTML = API_LESSONS.map(function(l, i){
      var done = apiIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===apiCurIdx?'active':'')+'" data-act="apiOpen('+i+')">'+(i+1)+'. '+apiEsc(l.title)+done+'</button>';
    }).join('');
  }

  function renderApiLesson(){
    var body = document.getElementById('apiLessonBody');
    if(!body) return;
    var l = API_LESSONS[apiCurIdx];
    if(!API_STATE[l.id]) API_STATE[l.id] = {};
    var idBase = 'apipm_'+l.id;
    var methodId=idBase+'_method', urlId=idBase+'_url', headersId=idBase+'_headers', bodyId=idBase+'_body', outId=idBase+'_out';
    var savedMethod = apiLoad(l.id, 'method', l.defaultMethod);
    var savedUrl = apiLoad(l.id, 'url', l.endpoint);
    var savedHeaders = apiLoad(l.id, 'headers', '');
    var savedBody = apiLoad(l.id, 'body', '');

    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="apiRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="apiRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="apihint_'+l.id+'_'+(i+1)+'">'+apiEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="apihint_'+l.id+'_99"><b>Solution:</b><pre>'+apiEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(apiCurIdx+1)+apiEsc(l.title)+'</h2></div>'
      + trackMentalModel(apiEsc(l.explain))
      + '<div class="card">'
      + '<div class="api-field-row">'
        + '<select class="api-method-select" id="'+methodId+'" aria-label="HTTP method">'
          + ['GET','POST','PUT','PATCH','DELETE'].map(function(m){
              return '<option value="'+m+'"'+(m===savedMethod?' selected':'')+'>'+m+'</option>';
            }).join('')
        + '</select>'
        + '<input class="api-url-input" id="'+urlId+'" aria-label="API endpoint URL" value="'+apiEsc(savedUrl)+'" spellcheck="false">'
      + '</div>'
      + (l.showHeaders ? '<p style="font-size:.78rem;color:var(--sub);margin:10px 0 4px">Headers (one per line, Name: Value):</p>' + trackEditorShell('headers.txt', '<textarea class="wd-edit" id="'+headersId+'" aria-label="Code editor" spellcheck="false" style="min-height:50px">'+apiEsc(savedHeaders)+'</textarea>') : '')
      + (l.showBody ? '<p style="font-size:.78rem;color:var(--sub);margin:10px 0 4px">JSON Body:</p>' + trackEditorShell('body.json', '<textarea class="wd-edit" id="'+bodyId+'" aria-label="Code editor" spellcheck="false" style="min-height:60px">'+apiEsc(savedBody)+'</textarea>') : '')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="apiSend(\''+l.id+'\',\''+methodId+'\',\''+urlId+'\',\''+(l.showHeaders?headersId:'')+'\',\''+(l.showBody?bodyId:'')+'\',\''+outId+'\')">&#9654; Send</button>'
        + '<button class="wd-btn-ghost" data-act="apiReset(\''+l.id+'\',\''+methodId+'\',\''+urlId+'\',\''+headersId+'\',\''+bodyId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="apiMarkDone('+apiCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div id="'+outId+'">(build a request above and click Send)</div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>'
      + hintBoxes
      + '<div class="wd-navrow">'
        + (apiCurIdx>0 ? '<button class="wd-btn-ghost" data-act="apiPrev()">&larr; Previous</button>' : '<span></span>')
        + (apiCurIdx<API_LESSONS.length-1 ? '<button class="wd-btn" data-act="apiNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  window.apiSend = function(lessonId, methodId, urlId, headersId, bodyId, outId){
    var l = API_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var method = (document.getElementById(methodId)||{}).value || 'GET';
    var url = (document.getElementById(urlId)||{}).value || '';
    var headersRaw = headersId ? ((document.getElementById(headersId)||{}).value || '') : '';
    var bodyRaw = bodyId ? ((document.getElementById(bodyId)||{}).value || '') : '';
    apiSave(lessonId, 'method', method); apiSave(lessonId, 'url', url);
    if(headersId) apiSave(lessonId, 'headers', headersRaw);
    if(bodyId) apiSave(lessonId, 'body', bodyRaw);

    var headers = {};
    headersRaw.split('\n').forEach(function(line){
      var idx = line.indexOf(':');
      if(idx > 0){ headers[line.slice(0,idx).trim()] = line.slice(idx+1).trim(); }
    });

    var req = {method:method, url:url, headers:headers, body:bodyRaw};
    var resp = l.responder(req, API_STATE[l.id]);
    var out = document.getElementById(outId);
    if(!out) return;
    var statusClass = resp.status < 300 ? 'ok' : 'err';
    var bodyStr = resp.body === null ? '(no body)' : JSON.stringify(resp.body, null, 2);
    out.innerHTML = '<div class="api-response-box '+statusClass+'">'
      + '<span class="api-status-badge">'+resp.status+'</span>'
      + apiEsc(method)+' '+apiEsc(url)
      + (resp.extraHeaders ? '\n'+apiEsc(resp.extraHeaders) : '')
      + '\n\n' + apiEsc(bodyStr)
      + '</div>';
  };

  window.apiReset = function(lessonId, methodId, urlId, headersId, bodyId){
    var l = API_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var m=document.getElementById(methodId), u=document.getElementById(urlId), h=document.getElementById(headersId), b=document.getElementById(bodyId);
    if(m) m.value = l.defaultMethod; if(u) u.value = l.endpoint; if(h) h.value = ''; if(b) b.value = '';
    apiSave(lessonId, 'method', l.defaultMethod); apiSave(lessonId, 'url', l.endpoint);
    apiSave(lessonId, 'headers', ''); apiSave(lessonId, 'body', '');
    API_STATE[lessonId] = {}; // reset stateful counters (e.g. rate limit) too
  };

  window.apiRevealHint = function(lessonId, tier){
    var l = API_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('apihint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  var apiBooted = false;
  window._apiBoot = function(){
    if(apiBooted) return;
    apiBooted = true;
    window.apiOpen(0);
  };
})();
