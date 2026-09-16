
(function(){
  function saEsc(s){ return escapeHtml(s); }
  function saDoneKey(id){ return 'sa_done_'+id; }
  function saIsDone(id){ try{ return localStorage.getItem(saDoneKey(id))==='1'; }catch(e){ return false; } }
  window.saMarkDone = function(idx){
    try{ localStorage.setItem(saDoneKey(SA_TASKS[idx].id), '1'); }catch(e){}
    renderSaNav(); renderSaTask();
  };

  var SA_TASKS = [
    { id:'sa-strategy-playground', title:'Strategy Pattern Playground',
      explain:'Pick a discount strategy and watch the total change -- the same behavior-swapping mechanism covered in the lesson, without editing any code to switch strategies.',
      render: function(){
        return '<div class="card">'
          + '<label for="saStrategySelect" style="display:block;font-size:.85rem;margin-bottom:6px">Strategy:</label>'
          + '<select id="saStrategySelect" class="api-method-select" style="max-width:100%;width:100%" data-change="saUpdateStrategy()">'
            + '<option value="none">No discount</option>'
            + '<option value="percent20">20% off</option>'
            + '<option value="bogo">Buy one get one (halves total)</option>'
          + '</select>'
          + '<label for="saStrategyPrice" style="display:block;font-size:.85rem;margin-top:10px">Price: <input type="number" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="saStrategyPrice" value="100" data-change="saUpdateStrategy()"></label>'
          + '<div id="saStrategyOutput" role="status" aria-live="polite" style="margin-top:14px;font-weight:700;font-size:1.05rem;color:var(--teal)"></div>'
          + '</div>';
      }},
    { id:'sa-factory-playground', title:'Factory Pattern Playground',
      explain:'Pick a shape name and see the Factory create the right concrete object -- the calling code never needs to know which class it actually is.',
      render: function(){
        return '<div class="card">'
          + '<label for="saFactorySelect" style="display:block;font-size:.85rem;margin-bottom:6px">Shape:</label>'
          + '<select id="saFactorySelect" class="api-method-select" style="max-width:100%;width:100%" data-change="saUpdateFactory()">'
            + '<option value="circle">circle</option>'
            + '<option value="square">square</option>'
          + '</select>'
          + '<label for="saFactorySize" style="display:block;font-size:.85rem;margin-top:10px">Size: <input type="number" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="saFactorySize" value="4" data-change="saUpdateFactory()"></label>'
          + '<div id="saFactoryOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.9rem"></div>'
          + '</div>';
      }},
    { id:'sa-smell-diagnostic', title:'Code Smell Diagnostic',
      explain:'Given a short description of real code, identify which smell or principle violation is present.',
      render: function(){
        return '<div class="card">'
          + '<label for="saSmellSelect" style="display:block;font-size:.85rem;margin-bottom:6px">Choose a scenario:</label>'
          + '<select id="saSmellSelect" class="api-method-select" style="max-width:100%;width:100%" data-change="saSmellUpdate()">'
            + '<option value="0">A class saves users, sends emails, AND generates PDF reports</option>'
            + '<option value="1">A 220-line method handles validation, saving, and logging</option>'
            + '<option value="2">A method reads 5 fields from another class, using none of its own</option>'
            + '<option value="3">The exact same 15-line block appears in four different methods</option>'
          + '</select>'
          + '<div id="saSmellOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.9rem"></div>'
          + '</div>';
      }},
    { id:'sa-di-comparison', title:'Dependency Injection: Before &amp; After',
      explain:'Toggle between a hard-coded dependency and an injected one, and see why only one of them can be tested with a fake.',
      render: function(){
        return '<div class="card">'
          + '<div class="wd-row" style="gap:10px">'
            + '<button class="wd-btn-ghost" data-act="saDiShow(\'hardcoded\')">Show hard-coded version</button>'
            + '<button class="wd-btn-ghost" data-act="saDiShow(\'injected\')">Show injected version</button>'
            + '<button class="wd-btn" data-act="saDiTryTest()">Try testing with a FakeDB</button>'
          + '</div>'
          + '<div id="saDiCode" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '<div id="saDiOutput" role="status" aria-live="polite" style="margin-top:10px;font-weight:700"></div>'
          + '</div>';
      }},
    { id:'sa-adapter-facade-sort', title:'Adapter or Facade?',
      explain:'For each scenario, decide whether it calls for an Adapter (bridging an incompatible interface) or a Facade (simplifying a complex subsystem).',
      render: function(){
        return '<div class="card">'
          + '<label for="saAFSelect" style="display:block;font-size:.85rem;margin-bottom:6px">Scenario:</label>'
          + '<select id="saAFSelect" class="api-method-select" style="max-width:100%;width:100%" data-change="saAFUpdate()">'
            + '<option value="0">Wrapping a third-party library\'s charge_customer() so it matches your own pay() interface</option>'
            + '<option value="1">One checkout() method that coordinates inventory, payment, and shipping internally</option>'
            + '<option value="2">Wrapping a legacy XML API so your code can call it like a normal JSON service</option>'
          + '</select>'
          + '<div id="saAFOutput" role="status" aria-live="polite" style="margin-top:14px;font-weight:700"></div>'
          + '</div>';
      }},
    { id:'sa-pattern-judgment', title:'Pattern or Over-Engineering?',
      explain:'For each scenario, decide whether the described pattern use is justified by real, demonstrated variation -- or is premature abstraction.',
      render: function(){
        return '<div class="card">'
          + '<label for="saJudgeSelect" style="display:block;font-size:.85rem;margin-bottom:6px">Scenario:</label>'
          + '<select id="saJudgeSelect" class="api-method-select" style="max-width:100%;width:100%" data-change="saJudgeUpdate()">'
            + '<option value="0">A Strategy interface for a discount calc that will only ever have one implementation, "just in case"</option>'
            + '<option value="1">A Factory for creating one of 6 real, actively-used payment provider integrations</option>'
            + '<option value="2">A plugin architecture added to a script that will only ever run once, by one person</option>'
          + '</select>'
          + '<div id="saJudgeOutput" role="status" aria-live="polite" style="margin-top:14px;font-weight:700"></div>'
          + '</div>';
      }}
  ];

  var saCurIdx = 0;

  function renderSaNav(){
    var nav = document.getElementById('saLessonNav');
    if(!nav) return;
    nav.innerHTML = SA_TASKS.map(function(t, i){
      var done = saIsDone(t.id) ? ' \u2713' : '';
      return '<button class="'+(i===saCurIdx?'active':'')+'" data-act="saOpen('+i+')">'+(i+1)+'. '+t.title+done+'</button>';
    }).join('');
  }
  window.saOpen = function(idx){ saCurIdx = idx; renderSaNav(); renderSaTask(); };
  window.saNext = function(){ if(saCurIdx < SA_TASKS.length-1){ saCurIdx++; renderSaNav(); renderSaTask(); } };
  window.saPrev = function(){ if(saCurIdx > 0){ saCurIdx--; renderSaNav(); renderSaTask(); } };

  function renderSaTask(){
    var body = document.getElementById('saLessonBody');
    if(!body) return;
    var t = SA_TASKS[saCurIdx];
    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(saCurIdx+1)+t.title+'</h2></div>'
      + trackMentalModel(t.explain)
      + t.render()
      + '<div class="wd-row" style="margin-top:14px">'
        + '<button class="wd-btn-ghost" data-act="saMarkDone('+saCurIdx+')">Mark explored</button>'
      + '</div>'
      + '<div class="wd-navrow">'
        + (saCurIdx>0 ? '<button class="wd-btn-ghost" data-act="saPrev()">&larr; Previous</button>' : '<span></span>')
        + (saCurIdx<SA_TASKS.length-1 ? '<button class="wd-btn" data-act="saNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
    if(t.id==='sa-strategy-playground') saUpdateStrategy();
    if(t.id==='sa-factory-playground') saUpdateFactory();
    if(t.id==='sa-smell-diagnostic') saSmellUpdate();
    if(t.id==='sa-di-comparison'){ document.getElementById('saDiCode').textContent=''; document.getElementById('saDiOutput').textContent=''; }
    if(t.id==='sa-adapter-facade-sort') saAFUpdate();
    if(t.id==='sa-pattern-judgment') saJudgeUpdate();
  }

  // ---- Task 1: Strategy playground ----
  window.saUpdateStrategy = function(){
    var strat = document.getElementById('saStrategySelect').value;
    var price = Number(document.getElementById('saStrategyPrice').value)||0;
    var total;
    if(strat==='none') total = price;
    else if(strat==='percent20') total = price*0.8;
    else if(strat==='bogo') total = price/2;
    document.getElementById('saStrategyOutput').textContent = 'Total: '+total.toFixed(2)+'  (same cart code, different strategy object)';
  };

  // ---- Task 2: Factory playground ----
  window.saUpdateFactory = function(){
    var kind = document.getElementById('saFactorySelect').value;
    var size = Number(document.getElementById('saFactorySize').value)||0;
    var area = kind==='circle' ? (3.14159*size*size).toFixed(2) : (size*size);
    document.getElementById('saFactoryOutput').textContent = 'shape_factory(\''+kind+'\', '+size+') -> '+(kind==='circle'?'Circle':'Square')+' instance, area = '+area+'\n(calling code never named the concrete class directly)';
  };

  // ---- Task 3: Smell diagnostic ----
  window.saSmellUpdate = function(){
    var idx = Number(document.getElementById('saSmellSelect').value);
    var answers = [
      'Single Responsibility Principle violation -- three unrelated reasons to change (storage, email, PDF). Split into three focused classes.',
      'Long Method smell (and likely an SRP violation) -- extract validation, saving, and logging into their own well-named methods or classes.',
      'Feature Envy -- this method cares more about the other class\'s data than its own. Consider moving it onto that other class instead.',
      'Duplicated Code smell -- extract the shared 15-line block into one function or method that all four call sites reuse.'
    ];
    document.getElementById('saSmellOutput').textContent = answers[idx];
  };

  // ---- Task 4: DI before/after ----
  window.saDiShow = function(which){
    var code = which==='hardcoded'
      ? 'class OrderService:\n    def __init__(self):\n        self.db = PostgresDB()  # hard-coded -- can\'t swap for a test\n'
      : 'class OrderService:\n    def __init__(self, db):\n        self.db = db  # injected -- tests can pass a FakeDB()\n';
    document.getElementById('saDiCode').textContent = code;
    document.getElementById('saDiOutput').textContent = '';
  };
  window.saDiTryTest = function(){
    var code = document.getElementById('saDiCode').textContent;
    var out = document.getElementById('saDiOutput');
    if(code.indexOf('self.db = PostgresDB()') !== -1){
      out.innerHTML = '<span style="color:var(--bad,#e08585)">Cannot easily test -- OrderService always creates a real PostgresDB internally, with no way to substitute a fake one.</span>';
    } else if(code.indexOf('self.db = db') !== -1){
      out.innerHTML = '<span style="color:var(--teal)">Testable -- OrderServiceTest(FakeDB()) works, since the dependency is injected from outside.</span>';
    } else {
      out.textContent = 'Show a version first, then try testing it.';
    }
  };

  // ---- Task 5: Adapter or Facade ----
  window.saAFUpdate = function(){
    var idx = Number(document.getElementById('saAFSelect').value);
    var answers = [
      'Adapter -- bridging an incompatible interface (their method names) to match yours.',
      'Facade -- simplifying a complex, multi-part subsystem behind one clean method.',
      'Adapter -- bridging an incompatible interface (legacy XML) to look like something else (JSON-style).'
    ];
    document.getElementById('saAFOutput').textContent = answers[idx];
  };

  // ---- Task 6: Pattern or over-engineering ----
  window.saJudgeUpdate = function(){
    var idx = Number(document.getElementById('saJudgeSelect').value);
    var answers = [
      'Over-engineering -- no concrete evidence of multiple real implementations; a plain function would be simpler and equally correct.',
      'Justified -- 6 real, actively-used implementations is concrete evidence of genuine variation that Factory is meant to handle.',
      'Over-engineering -- a plugin architecture for a single-run, single-user script has no real variation to justify the added complexity.'
    ];
    document.getElementById('saJudgeOutput').textContent = answers[idx];
  };

  var saBooted = false;
  window._softArchBoot = function(){
    if(saBooted) return;
    saBooted = true;
    renderSaNav();
    renderSaTask();
  };
})();
