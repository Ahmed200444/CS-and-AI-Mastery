
(function(){
  // Reuses the SAME sandboxed iframe playground pattern as the Web Development
  // track (sandbox="allow-scripts", no allow-same-origin) -- separate function
  // namespace (feXxx) so both tracks can coexist, but identical execution model.

  var FE_LESSONS = [
    { id:'fe-component', title:'Building a reusable component',
      explain:'A "component" in vanilla JS is just a function that returns/creates markup you can call multiple times with different data. Build a small card-rendering function and call it 3 times with different content.',
      html:'<div id="cards"></div>',
      css:'.card{border:1px solid #ccc;border-radius:8px;padding:12px;margin:8px 0}',
      js:'// TODO: write a function renderCard(title, body) that creates a\n// .card div with the title and body, and appends it to #cards.\n// Call it 3 times with different data.\nfunction renderCard(title, body){\n  console.log("implement renderCard here");\n}\n',
      hints:['A component function should create a new element, set its content, and append it -- then you can call it as many times as you need.','document.createElement("div") makes a new div; set its className and innerHTML, then appendChild it to #cards.','function renderCard(title, body){\n  var el = document.createElement("div");\n  el.className = "card";\n  el.innerHTML = "<h3>"+title+"</h3><p>"+body+"</p>";\n  document.getElementById("cards").appendChild(el);\n}\nrenderCard("One", "First card");\nrenderCard("Two", "Second card");\nrenderCard("Three", "Third card");'],
      solution:'function renderCard(title, body){\n  var el = document.createElement("div");\n  el.className = "card";\n  el.innerHTML = "<h3>"+title+"</h3><p>"+body+"</p>";\n  document.getElementById("cards").appendChild(el);\n}\nrenderCard("One", "First card");\nrenderCard("Two", "Second card");\nrenderCard("Three", "Third card");' },
    { id:'fe-responsive', title:'Responsive layout with Flexbox + media query',
      explain:'Combine what you already know: Flexbox for the row layout, and a media query so it collapses to one column on narrow screens. Test by resizing your browser after running.',
      html:'<div class="row"><div class="box">A</div><div class="box">B</div><div class="box">C</div></div>',
      css:'/* TODO: .row should be a flex row with a gap;\n   under 480px wide, it should stack into a single column */\n.box{background:#8ec1f0;padding:16px;border-radius:6px;text-align:center;font-weight:bold}',
      js:'',
      hints:['display:flex on .row lays the boxes out in a row; gap adds space between them.','@media (max-width: 480px){ ... } applies rules only below that width.','.row{display:flex;gap:10px}\n@media (max-width:480px){.row{flex-direction:column}}'],
      solution:'.row{display:flex;gap:10px}\n@media (max-width:480px){\n  .row{flex-direction:column}\n}' },
    { id:'fe-dom-state', title:'DOM updates & simple state',
      explain:'"State" just means data your UI depends on, stored in a variable. When state changes, you re-render the affected part of the DOM. Build a simple counter: a number in state, a button that increments it, and the DOM text that reflects it.',
      html:'<p id="count">0</p>\n<button id="inc">+1</button>',
      css:'body{font-family:sans-serif;padding:16px}',
      js:'// TODO: keep a `count` variable (state), increment it on click,\n// and update #count\'s text to match every time\nvar count = 0;\ndocument.getElementById("inc").addEventListener("click", function(){\n  console.log("implement the counter here");\n});',
      hints:['Increment the count variable first, then write it into the DOM.','document.getElementById("count").textContent = count; updates the displayed number.','var count = 0;\ndocument.getElementById("inc").addEventListener("click", function(){\n  count++;\n  document.getElementById("count").textContent = count;\n});'],
      solution:'var count = 0;\ndocument.getElementById("inc").addEventListener("click", function(){\n  count++;\n  document.getElementById("count").textContent = count;\n});' },
    { id:'fe-forms-validation', title:'Form validation with live feedback',
      explain:'Good form UX validates as the user types (an "input" event), not only on submit -- so they see the problem immediately, not after clicking a button.',
      html:'<input type="text" id="username" placeholder="username">\n<p id="feedback"></p>',
      css:'body{font-family:sans-serif;padding:16px} #feedback{color:#e05a5a}',
      js:'// TODO: on every keystroke, show a message in #feedback if the\n// username is shorter than 3 characters, otherwise clear the message\ndocument.getElementById("username").addEventListener("input", function(e){\n  console.log("implement live validation here");\n});',
      hints:['e.target.value gives you the input\'s current text inside the event handler.','Check e.target.value.length < 3 to decide whether to show the message.','document.getElementById("username").addEventListener("input", function(e){\n  var msg = e.target.value.length < 3 ? "Username too short" : "";\n  document.getElementById("feedback").textContent = msg;\n});'],
      solution:'document.getElementById("username").addEventListener("input", function(e){\n  var msg = e.target.value.length < 3 ? "Username too short" : "";\n  document.getElementById("feedback").textContent = msg;\n});' },
    { id:'fe-accessibility', title:'Accessibility: labels & keyboard access',
      explain:'A button made from a <div> is invisible to screen readers and unreachable by keyboard by default. Real buttons (<button>) and proper <label for="..."> connections come for free with accessibility built in -- prefer them over div-based fakes.',
      html:'<!-- TODO: fix the accessibility problems below:\n     1. this "button" is a div, not reachable by keyboard/screen reader\n     2. this input has no associated label -->\n<div class="fake-btn" onclick="alert(\'hi\')">Click me</div>\n<input type="text" id="search">',
      css:'.fake-btn{display:inline-block;padding:8px 14px;background:#4fd1c5;border-radius:6px;cursor:pointer}',
      js:'',
      hints:['Replace the <div> with a real <button> element -- keyboard and screen-reader support come for free.','Add a <label for="search"> that matches the input\'s id.','<button class="fake-btn">Click me</button>\n<label for="search">Search</label>\n<input type="text" id="search">'],
      solution:'<button class="fake-btn">Click me</button>\n<label for="search">Search</label>\n<input type="text" id="search">' },
    { id:'fe-debug-listener', title:'Debugging: event listener not firing',
      explain:'This button click does nothing. Open the console output below after clicking -- the error message names exactly what\'s wrong.',
      html:'<button id="save-btn">Save</button>\n<p id="status"></p>',
      css:'body{font-family:sans-serif;padding:16px}',
      js:'// BUG: this ID doesn\'t match the button in the HTML above -- find and fix it\ndocument.getElementById("saveButton").addEventListener("click", function(){\n  document.getElementById("status").textContent = "Saved!";\n});',
      hints:['Compare the id in the HTML ("save-btn") to the id used in the JS ("saveButton") letter by letter.','getElementById returns null for a non-existent id, and calling .addEventListener on null throws exactly this kind of error.','document.getElementById("save-btn").addEventListener("click", function(){\n  document.getElementById("status").textContent = "Saved!";\n});'],
      solution:'document.getElementById("save-btn").addEventListener("click", function(){\n  document.getElementById("status").textContent = "Saved!";\n});' }
  ];

  function feKey(id, field){ return 'fetrack:'+id+':'+field; }
  function feSave(id, field, val){ try{ localStorage.setItem(feKey(id,field), val); }catch(e){} }
  function feLoad(id, field, fallback){ try{ var v=localStorage.getItem(feKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function feDoneKey(id){ return 'fetrack:'+id+':done'; }
  function feIsDone(id){ try{ return localStorage.getItem(feDoneKey(id))==='1'; }catch(e){ return false; } }
  function feEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var feCurIdx = 0;

  window.feOpen = function(idx){
    feCurIdx = idx;
    renderFeNav();
    renderFeLesson();
    window.scrollTo(0,0);
  };
  window.feNext = function(){ if(feCurIdx < FE_LESSONS.length-1) window.feOpen(feCurIdx+1); };
  window.fePrev = function(){ if(feCurIdx > 0) window.feOpen(feCurIdx-1); };
  window.feMarkDone = function(idx){
    try{ localStorage.setItem(feDoneKey(FE_LESSONS[idx].id), '1'); }catch(e){}
    renderFeNav();
  };

  function renderFeNav(){
    var nav = document.getElementById('feLessonNav');
    if(!nav) return;
    nav.innerHTML = FE_LESSONS.map(function(l, i){
      var done = feIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===feCurIdx?'active':'')+'" data-act="feOpen('+i+')">'+(i+1)+'. '+feEsc(l.title)+done+'</button>';
    }).join('');
  }

  function renderFeLesson(){
    var body = document.getElementById('feLessonBody');
    if(!body) return;
    var l = FE_LESSONS[feCurIdx];
    var savedHtml = feLoad(l.id, 'html', l.html);
    var savedCss = feLoad(l.id, 'css', l.css);
    var savedJs = feLoad(l.id, 'js', l.js);
    var idBase = 'fepm_'+l.id;
    var htmlId=idBase+'_html', cssId=idBase+'_css', jsId=idBase+'_js', frameId=idBase+'_frame', outId=idBase+'_out';

    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="feRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="feRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="fehint_'+l.id+'_'+(i+1)+'">'+feEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="fehint_'+l.id+'_99"><b>Solution:</b><pre>'+feEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(feCurIdx+1)+feEsc(l.title)+'</h2></div>'
      + trackMentalModel(feEsc(l.explain))
      + '<div class="wd-pm-fields">'
        + trackEditorShell('index.html', '<textarea class="wd-edit" id="'+htmlId+'" aria-label="Code editor" spellcheck="false" style="min-height:70px">'+feEsc(savedHtml)+'</textarea>')
        + trackEditorShell('style.css', '<textarea class="wd-edit" id="'+cssId+'" aria-label="Code editor" spellcheck="false" style="min-height:60px">'+feEsc(savedCss)+'</textarea>')
        + trackEditorShell('script.js', '<textarea class="wd-edit" id="'+jsId+'" aria-label="Code editor" spellcheck="false" style="min-height:80px">'+feEsc(savedJs)+'</textarea>')
      + '</div>'
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="feRun(\''+l.id+'\',\''+htmlId+'\',\''+cssId+'\',\''+jsId+'\',\''+frameId+'\',\''+outId+'\')">&#9654; Run</button>'
        + '<button class="wd-btn-ghost" data-act="feReset(\''+l.id+'\',\''+htmlId+'\',\''+cssId+'\',\''+jsId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="feMarkDone('+feCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<iframe class="wd-iframe" id="'+frameId+'" sandbox="allow-scripts" title="Live preview"></iframe>'
      + '<div class="wd-field-label">console output</div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>'
      + hintBoxes
      + '<div class="wd-navrow">'
        + (feCurIdx>0 ? '<button class="wd-btn-ghost" data-act="fePrev()">&larr; Previous</button>' : '<span></span>')
        + (feCurIdx<FE_LESSONS.length-1 ? '<button class="wd-btn" data-act="feNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';

    window.feRun(l.id, htmlId, cssId, jsId, frameId, outId);
  }

  var feMsgListenerAttached = false;
  function feAttachMsgListener(){
    if(feMsgListenerAttached) return;
    feMsgListenerAttached = true;
    window.addEventListener('message', function(ev){
      var d = ev.data;
      if(!d || !d.feweb) return;
      var out = document.getElementById(d.outId);
      if(out) out.textContent += (out.textContent ? '\n' : '') + d.line;
    });
  }
  feAttachMsgListener();

  window.feRun = function(lessonId, htmlId, cssId, jsId, frameId, outId){
    var html = (document.getElementById(htmlId)||{}).value || '';
    var css = (document.getElementById(cssId)||{}).value || '';
    var js = (document.getElementById(jsId)||{}).value || '';
    feSave(lessonId, 'html', html); feSave(lessonId, 'css', css); feSave(lessonId, 'js', js);
    var out = document.getElementById(outId); if(out) out.textContent = '';
    var frame = document.getElementById(frameId);
    if(!frame) return;
    var srcdoc = '<!doctype html><html><head><meta charset="utf-8"><style>'+css+'</style></head><body>'
      + html
      + '<script>(function(){var OUT_ID='+JSON.stringify(outId)+';'
      + 'console.log=function(){var a=Array.prototype.slice.call(arguments).map(String).join(" ");parent.postMessage({feweb:true,outId:OUT_ID,line:a},"*");};'
      + 'window.onerror=function(msg){parent.postMessage({feweb:true,outId:OUT_ID,line:"Error: "+msg},"*");return true;};'
      + 'try{\n' + js + '\n}catch(e){console.log("Error: "+e.message);}'
      + '})();<\/script></body></html>';
    frame.srcdoc = srcdoc;
  };

  window.feReset = function(lessonId, htmlId, cssId, jsId){
    var l = FE_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var h=document.getElementById(htmlId), c=document.getElementById(cssId), j=document.getElementById(jsId);
    if(h) h.value = l.html; if(c) c.value = l.css; if(j) j.value = l.js;
    feSave(lessonId, 'html', l.html); feSave(lessonId, 'css', l.css); feSave(lessonId, 'js', l.js);
  };

  window.feRevealHint = function(lessonId, tier){
    var l = FE_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('fehint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  var feBooted = false;
  window._feBoot = function(){
    if(feBooted) return;
    feBooted = true;
    window.feOpen(0);
  };
})();
