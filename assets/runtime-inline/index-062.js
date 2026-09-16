
(function(){
  // ---- Reusable "web coding lab" component ---------------------------------
  // Deliberately generic: any course with HTML/CSS/JS-style lessons can reuse
  // this same engine by defining its own lesson array and calling wdInit().
  // Reuses the exact same sandboxed-iframe pattern as the practiceMode pilot
  // (sandbox="allow-scripts", no allow-same-origin) -- no new execution model.

  var WD_LESSONS = [
    { id:'wd-semantic', showJs:false, title:'Semantic HTML & document structure',
      explain:'Semantic tags (<header>, <nav>, <main>, <article>, <footer>) describe what content IS, not just how it looks -- this helps accessibility, SEO, and anyone reading your markup later. Headings (h1-h6), paragraphs, lists, links, and images are the raw building blocks every page is made of.',
      html:'<!-- TODO: wrap this in <header>/<main>/<footer> using semantic tags -->\n<h1>My Page</h1>\n<p>Welcome to my site.</p>\n<a href="#">A link</a>',
      css:'body{font-family:sans-serif;padding:16px}',
      js:'// no JS needed for this lesson',
      hints:['Semantic tags describe MEANING, not appearance -- <header> for intro content, <main> for the primary content, <footer> for closing content.','Wrap the h1+intro text in <header>, the core content in <main>, and any closing text in <footer>.','<header><h1>My Page</h1></header><main><p>Welcome to my site.</p><a href="#">A link</a></main>'],
      solution:'<header>\n  <h1>My Page</h1>\n</header>\n<main>\n  <p>Welcome to my site.</p>\n  <a href="#">A link</a>\n</main>' },
    { id:'wd-forms', showJs:false, title:'Forms',
      explain:'A <form> collects user input via <input>, <textarea>, and <select> elements, each needing a matching <label> for accessibility. The name attribute on each field is what gets submitted; ids link labels to fields via the label\'s for attribute.',
      html:'<!-- TODO: add a label linked to this input via for/id -->\n<form>\n  <input type="text" name="username">\n  <button type="submit">Submit</button>\n</form>',
      css:'body{font-family:sans-serif;padding:16px} label{display:block;margin-bottom:4px}',
      js:'',
      hints:['A <label> needs a "for" attribute matching the input\'s "id" to be properly linked.','Add id="username" to the input, then <label for="username">Username</label> before it.','<label for="username">Username</label><input type="text" id="username" name="username">'],
      solution:'<form>\n  <label for="username">Username</label>\n  <input type="text" id="username" name="username">\n  <button type="submit">Submit</button>\n</form>' },
    { id:'wd-css-selectors', showJs:false, title:'CSS selectors, colors, spacing, borders & typography',
      explain:'CSS selectors target elements by tag, class (.name), or id (#name). The box model (margin, border, padding, content) controls spacing; color and font properties control typography. Classes are reusable across many elements; ids should be unique per page.',
      html:'<div class="card">\n  <h2>Card title</h2>\n  <p>Some card text.</p>\n</div>',
      css:'/* TODO: style .card with padding, a border, rounded corners, and a background color */\nbody{font-family:sans-serif;padding:16px}',
      js:'',
      hints:['Target the class with .card{...} -- padding adds inner space, border adds an edge, border-radius rounds corners.','padding: 16px; border: 1px solid #ccc; border-radius: 8px;','.card{padding:16px;border:1px solid #ccc;border-radius:8px;background:#f5f5f5}'],
      solution:'.card{\n  padding: 16px;\n  border: 1px solid #ccc;\n  border-radius: 8px;\n  background: #f5f5f5;\n}' },
    { id:'wd-flexbox', showJs:false, title:'Flexbox',
      explain:'display:flex turns a container into a flex container, laying children out in a row (or column with flex-direction:column) automatically. justify-content controls spacing along the main axis; align-items controls alignment along the cross axis -- this replaces most old float-based layout tricks.',
      html:'<div class="row">\n  <div class="box">1</div>\n  <div class="box">2</div>\n  <div class="box">3</div>\n</div>',
      css:'/* TODO: make .row a flex container that centers its children horizontally with a gap */\n.box{background:#4fd1c5;color:#08221f;padding:20px;border-radius:6px;font-weight:bold}',
      js:'',
      hints:['display:flex on the parent turns its children into flex items automatically.','justify-content:center centers items along the row; gap adds space between them.','.row{display:flex;justify-content:center;gap:12px}'],
      solution:'.row{\n  display: flex;\n  justify-content: center;\n  gap: 12px;\n}' },
    { id:'wd-grid', showJs:false, title:'CSS Grid',
      explain:'display:grid lays children out in a true 2D grid. grid-template-columns defines column widths (e.g. repeat(3, 1fr) for three equal columns); gap adds space between cells. Grid is better than flexbox specifically when you need both rows AND columns to align.',
      html:'<div class="grid">\n  <div class="box">A</div>\n  <div class="box">B</div>\n  <div class="box">C</div>\n  <div class="box">D</div>\n</div>',
      css:'/* TODO: make .grid a 2-column grid with a gap */\n.box{background:#8ec1f0;color:#08221f;padding:20px;border-radius:6px;text-align:center;font-weight:bold}',
      js:'',
      hints:['display:grid enables grid layout; grid-template-columns sets the column widths.','repeat(2, 1fr) creates two equal-width columns.','.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}'],
      solution:'.grid{\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 10px;\n}' },
    { id:'wd-responsive', showJs:false, title:'Responsive design',
      explain:'A media query (@media (max-width: ...px){...}) applies CSS rules only below a given viewport width, letting a layout adapt from desktop to mobile. A common pattern: multiple columns on wide screens, one column on narrow ones.',
      html:'<div class="grid">\n  <div class="box">A</div>\n  <div class="box">B</div>\n</div>',
      css:'.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}\n.box{background:#f0b878;padding:20px;border-radius:6px;text-align:center;font-weight:bold}\n/* TODO: add a media query so .grid becomes a single column under 480px wide */',
      js:'',
      hints:['@media (max-width: 480px){ ... } applies its rules only when the viewport is 480px or narrower.','Inside the media query, override grid-template-columns to a single column.','@media (max-width:480px){.grid{grid-template-columns:1fr}}'],
      solution:'@media (max-width: 480px) {\n  .grid {\n    grid-template-columns: 1fr;\n  }\n}' },
    { id:'wd-js-dom', title:'JavaScript basics & DOM selection',
      explain:'document.querySelector(selector) finds the first matching element using CSS-selector syntax; document.querySelectorAll finds all matches. Once selected, you can read/change an element\'s .textContent, .value, or style directly from JavaScript.',
      html:'<p id="msg">Original text</p>',
      css:'body{font-family:sans-serif;padding:16px}',
      js:'// TODO: select #msg and change its textContent to "Changed by JavaScript!"\nconsole.log("edit the JS panel to select and change the paragraph");',
      hints:['document.querySelector("#msg") finds the element with id="msg".','.textContent lets you read or overwrite the text inside an element.','document.querySelector("#msg").textContent = "Changed by JavaScript!";'],
      solution:'document.querySelector("#msg").textContent = "Changed by JavaScript!";' },
    { id:'wd-events', title:'Events & DOM updates',
      explain:'addEventListener(\'click\', handler) runs a function whenever that element is clicked (or any other event: \'input\', \'submit\', \'mouseover\'). Inside the handler, you typically update the DOM in response -- this is how pages become interactive rather than static.',
      html:'<button id="toggle">Toggle status</button>\n<p id="status">Off</p>',
      css:'body{font-family:sans-serif;padding:16px}',
      js:'// TODO: make clicking the button toggle #status text between "Off" and "On"\ndocument.getElementById("toggle").addEventListener("click", function(){\n  console.log("clicked -- implement the toggle here");\n});',
      hints:['Read the current text first, then decide what to set it to based on that.','var el = document.getElementById("status"); el.textContent = el.textContent === "Off" ? "On" : "Off";','document.getElementById("toggle").addEventListener("click", function(){\n  var el = document.getElementById("status");\n  el.textContent = el.textContent === "Off" ? "On" : "Off";\n});'],
      solution:'document.getElementById("toggle").addEventListener("click", function(){\n  var el = document.getElementById("status");\n  el.textContent = el.textContent === "Off" ? "On" : "Off";\n});' },
    { id:'wd-validation', title:'Form validation',
      explain:'Client-side validation checks input BEFORE submitting, giving immediate feedback (e.g. "email is required") rather than round-tripping to a server first. It\'s a UX improvement, never a security boundary by itself -- the server must always re-validate too.',
      html:'<form id="f">\n  <input type="text" id="email" aria-label="Email address" placeholder="email">\n  <button type="submit">Submit</button>\n</form>\n<p id="err"></p>',
      css:'body{font-family:sans-serif;padding:16px} #err{color:#e05a5a}',
      js:'// TODO: on submit, if #email is empty, prevent submission and show an error in #err\ndocument.getElementById("f").addEventListener("submit", function(e){\n  console.log("implement validation here");\n});',
      hints:['e.preventDefault() stops the form from actually submitting/reloading the page.','Check document.getElementById("email").value.trim() === "" to detect an empty field.','document.getElementById("f").addEventListener("submit", function(e){\n  var val = document.getElementById("email").value.trim();\n  if(!val){ e.preventDefault(); document.getElementById("err").textContent = "Email is required"; }\n});'],
      solution:'document.getElementById("f").addEventListener("submit", function(e){\n  var val = document.getElementById("email").value.trim();\n  if(!val){\n    e.preventDefault();\n    document.getElementById("err").textContent = "Email is required";\n  }\n});' },
    { id:'wd-debugging', title:'Debugging in the browser',
      explain:'console.log() prints values so you can see what your code is actually doing, without guessing. A bug here (calling a method on the wrong thing, a typo\'d selector) fails the same way real bugs do -- read the browser console\'s error message and fix the actual cause.',
      html:'<p id="count">0</p>\n<button id="inc">+1</button>',
      css:'body{font-family:sans-serif;padding:16px}',
      js:'// BUG: this throws an error -- open the console output below to see it, then fix it\nvar n = 0;\ndocument.getElementById("inc").addEventListner("click", function(){\n  n++;\n  document.getElementById("count").textContent = n;\n});',
      hints:['Read the error message in the console output panel below -- it names exactly what went wrong.','"addEventListner" is misspelled -- compare it letter by letter to "addEventListener".','document.getElementById("inc").addEventListener("click", function(){\n  n++;\n  document.getElementById("count").textContent = n;\n});'],
      solution:'var n = 0;\ndocument.getElementById("inc").addEventListener("click", function(){\n  n++;\n  document.getElementById("count").textContent = n;\n});' }
  ];

  function wdKey(id, field){ return 'wdtrack:'+id+':'+field; }
  function wdSave(id, field, val){ try{ localStorage.setItem(wdKey(id,field), val); }catch(e){} }
  function wdLoad(id, field, fallback){ try{ var v=localStorage.getItem(wdKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function wdDoneKey(id){ return 'wdtrack:'+id+':done'; }
  function wdIsDone(id){ try{ return localStorage.getItem(wdDoneKey(id))==='1'; }catch(e){ return false; } }
  function wdEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var wdCurIdx = 0;
  window._wdCur = 0;

  window.wdOpen = function(idx){
    wdCurIdx = idx; window._wdCur = idx;
    renderWdNav();
    renderWdLesson();
    window.scrollTo(0,0);
  };
  window.wdNext = function(){ if(wdCurIdx < WD_LESSONS.length-1) window.wdOpen(wdCurIdx+1); };
  window.wdPrev = function(){ if(wdCurIdx > 0) window.wdOpen(wdCurIdx-1); };
  window.wdMarkDone = function(idx){
    try{ localStorage.setItem(wdDoneKey(WD_LESSONS[idx].id), '1'); }catch(e){}
    renderWdNav();
  };

  function renderWdNav(){
    var nav = document.getElementById('wdLessonNav');
    if(!nav) return;
    nav.innerHTML = WD_LESSONS.map(function(l, i){
      var done = wdIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===wdCurIdx?'active':'')+'" data-act="wdOpen('+i+')">'+(i+1)+'. '+wdEsc(l.title)+done+'</button>';
    }).join('');
  }

  function renderWdLesson(){
    var body = document.getElementById('wdLessonBody');
    if(!body) return;
    var l = WD_LESSONS[wdCurIdx];
    var savedHtml = wdLoad(l.id, 'html', l.html);
    var savedCss = wdLoad(l.id, 'css', l.css);
    var savedJs = wdLoad(l.id, 'js', l.js);
    var idBase = 'wdpm_'+l.id;
    var htmlId=idBase+'_html', cssId=idBase+'_css', jsId=idBase+'_js', frameId=idBase+'_frame', outId=idBase+'_out';
    var showJs = l.showJs !== false; // hidden for lessons 1-6 (HTML/CSS only) -- shown from "JS basics" onward
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="wdRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="wdRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="wdhint_'+l.id+'_'+(i+1)+'">'+wdEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="wdhint_'+l.id+'_99"><b>Solution:</b><pre>'+wdEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(wdCurIdx+1)+wdEsc(l.title)+'</h2></div>'
      + trackMentalModel(wdEsc(l.explain))
      + '<div class="wd-pm-fields">'
        + trackEditorShell('index.html', '<textarea class="wd-edit" id="'+htmlId+'" aria-label="Code editor" spellcheck="false" style="min-height:70px">'+wdEsc(savedHtml)+'</textarea>')
        + trackEditorShell('style.css', '<textarea class="wd-edit" id="'+cssId+'" aria-label="Code editor" spellcheck="false" style="min-height:60px">'+wdEsc(savedCss)+'</textarea>')
        + (showJs ? trackEditorShell('script.js', '<textarea class="wd-edit" id="'+jsId+'" aria-label="Code editor" spellcheck="false" style="min-height:70px">'+wdEsc(savedJs)+'</textarea>') : '')
      + '</div>'
      + '<div class="wd-row">' 
        + '<button class="wd-btn" data-act="wdRun(\''+l.id+'\',\''+htmlId+'\',\''+cssId+'\',\''+jsId+'\',\''+frameId+'\',\''+outId+'\')">&#9654; Run</button>'
        + '<button class="wd-btn-ghost" data-act="wdReset(\''+l.id+'\',\''+htmlId+'\',\''+cssId+'\',\''+jsId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="wdMarkDone('+wdCurIdx+')">Mark lesson done</button>'
      + '</div>'
      + '<iframe class="wd-iframe" id="'+frameId+'" sandbox="allow-scripts" title="Live preview"></iframe>'
      + '<div class="wd-field-label">console output</div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>'
      + hintBoxes
      + '<div class="wd-navrow">'
        + (wdCurIdx>0 ? '<button class="wd-btn-ghost" data-act="wdPrev()">&larr; Previous</button>' : '<span></span>')
        + (wdCurIdx<WD_LESSONS.length-1 ? '<button class="wd-btn" data-act="wdNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';

    // auto-run once so the preview isn't blank on first load
    window.wdRun(l.id, htmlId, cssId, jsId, frameId, outId);
  }

  var wdMsgListenerAttached = false;
  function wdAttachMsgListener(){
    if(wdMsgListenerAttached) return;
    wdMsgListenerAttached = true;
    window.addEventListener('message', function(ev){
      var d = ev.data;
      if(!d || !d.wdweb) return;
      var out = document.getElementById(d.outId);
      if(out) out.textContent += (out.textContent ? '\n' : '') + d.line;
    });
  }
  wdAttachMsgListener();

  window.wdRun = function(lessonId, htmlId, cssId, jsId, frameId, outId){
    var html = (document.getElementById(htmlId)||{}).value || '';
    var css = (document.getElementById(cssId)||{}).value || '';
    var js = (document.getElementById(jsId)||{}).value || '';
    wdSave(lessonId, 'html', html); wdSave(lessonId, 'css', css); wdSave(lessonId, 'js', js);
    var out = document.getElementById(outId); if(out) out.textContent = '';
    var frame = document.getElementById(frameId);
    if(!frame) return;
    var srcdoc = '<!doctype html><html><head><meta charset="utf-8"><style>'+css+'</style></head><body>'
      + html
      + '<script>(function(){var OUT_ID='+JSON.stringify(outId)+';'
      + 'console.log=function(){var a=Array.prototype.slice.call(arguments).map(String).join(" ");parent.postMessage({wdweb:true,outId:OUT_ID,line:a},"*");};'
      + 'window.onerror=function(msg){parent.postMessage({wdweb:true,outId:OUT_ID,line:"Error: "+msg},"*");return true;};'
      + 'try{\n' + js + '\n}catch(e){console.log("Error: "+e.message);}'
      + '})();<\/script></body></html>';
    frame.srcdoc = srcdoc;
  };

  window.wdReset = function(lessonId, htmlId, cssId, jsId){
    var l = WD_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var h=document.getElementById(htmlId), c=document.getElementById(cssId), j=document.getElementById(jsId);
    if(h) h.value = l.html; if(c) c.value = l.css; if(j) j.value = l.js;
    wdSave(lessonId, 'html', l.html); wdSave(lessonId, 'css', l.css); wdSave(lessonId, 'js', l.js);
  };

  window.wdRevealHint = function(lessonId, tier){
    var l = WD_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('wdhint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  // Boot hook: called directly from the real showTrack() function (wired below),
  // not by monkey-patching showTrack -- that function is declared LATER in the
  // document than this module, so a wrapper defined here would just get
  // silently overwritten when the real function declaration is hoisted/run.
  var wdBooted = false;
  window._wdBoot = function(){
    if(wdBooted) return;
    wdBooted = true;
    window.wdOpen(0);
  };
})();
