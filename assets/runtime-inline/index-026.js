
(function(){
  function dhwEsc(s){ return escapeHtml(s); }
  function dhwDoneKey(id){ return 'dhw_done_'+id; }
  function dhwIsDone(id){ try{ return localStorage.getItem(dhwDoneKey(id))==='1'; }catch(e){ return false; } }
  window.dhwMarkDone = function(idx){
    try{ localStorage.setItem(dhwDoneKey(DHW_TASKS[idx].id), '1'); }catch(e){}
    renderDhwNav(); renderDhwTask();
  };

  var DHW_TASKS = [
    { id:'dhw-transistor', title:'Transistor Switch Demonstration',
      explain:'A transistor acts as an electronically controlled switch. Toggle the control input below and watch whether the output component (a simulated lamp) receives current. This is a simplified behavioral model, not real semiconductor physics.',
      render: function(bodyId){
        return '<div class="card"><div class="wd-row" style="align-items:center;gap:16px">'
          + '<button class="wd-btn" id="dhwTransCtrl" aria-pressed="false" data-act="dhwToggleTransistor()">Control input: OFF</button>'
          + '<div id="dhwTransLamp" role="status" aria-live="polite" style="width:60px;height:60px;border-radius:50%;background:var(--panel2);border:2px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:.7rem;color:var(--sub)">OFF</div>'
          + '</div><p class="wd-lesson-explain" style="margin-top:12px;font-size:.85rem">Model: the transistor connects the lamp to power only while the control input is ON -- exactly the on/off switch behavior described in the lesson.</p></div>';
      }},
    { id:'dhw-gate-playground', title:'Digital Component Playground',
      explain:'Select a gate, toggle its inputs, and observe the output update immediately. This shows each gate\'s behavior directly rather than a formal truth table.',
      render: function(){
        return '<div class="card">'
          + '<label for="dhwGateSelect" style="display:block;margin-bottom:6px;font-size:.85rem">Gate:</label>'
          + '<select id="dhwGateSelect" class="api-method-select" data-change="dhwUpdateGate()" style="margin-bottom:14px">'
            + ['NOT','AND','OR','XOR','NAND','NOR'].map(function(g){ return '<option value="'+g+'">'+g+'</option>'; }).join('')
          + '</select>'
          + '<div class="wd-row" style="align-items:center;gap:14px">'
            + '<button class="wd-btn-ghost" id="dhwGateA" aria-pressed="false" data-act="dhwToggleGateInput(0)">Input A: 0</button>'
            + '<button class="wd-btn-ghost" id="dhwGateB" aria-pressed="false" data-act="dhwToggleGateInput(1)">Input B: 0</button>'
            + '<div id="dhwGateOutput" role="status" aria-live="polite" style="font-weight:800;font-size:1.1rem;color:var(--teal)">Output: 1</div>'
          + '</div></div>';
      }},
    { id:'dhw-mux', title:'Multiplexer Signal Router',
      explain:'A multiplexer selects one of several data inputs to pass through, based on a select value. Change the select value and watch which input reaches the output.',
      render: function(){
        return '<div class="card">'
          + '<div class="wd-row" style="gap:10px;flex-wrap:wrap;margin-bottom:12px">'
            + [0,1,2,3].map(function(i){ return '<label style="font-size:.82rem">Input '+i+': <input type="number" class="wd-edit" style="width:70px;display:inline-block;min-height:0;padding:4px 8px" id="dhwMuxIn'+i+'" value="'+((i+1)*10)+'" data-change="dhwUpdateMux()"></label>'; }).join('')
          + '</div>'
          + '<label for="dhwMuxSelect" style="display:block;margin-bottom:6px;font-size:.85rem">Select:</label>'
          + '<select id="dhwMuxSelect" class="api-method-select" data-change="dhwUpdateMux()" style="margin-bottom:12px">'
            + [0,1,2,3].map(function(i){ return '<option value="'+i+'">'+i+'</option>'; }).join('')
          + '</select>'
          + '<div id="dhwMuxOutput" role="status" aria-live="polite" style="font-weight:800;font-size:1.1rem;color:var(--teal)">Output: 10</div>'
          + '</div>';
      }},
    { id:'dhw-adder', title:'Four-Bit Adder', funcName:'add4bit',
      explain:'Adjust the two 4-bit values below and watch the binary sum, carry-out, and decimal result update -- including correct overflow when the true sum exceeds 15.',
      render: function(){
        return '<div class="card">'
          + '<label for="dhwAdderA" style="display:block;font-size:.85rem">Value A (0-15): <input type="number" min="0" max="15" class="wd-edit" style="width:80px;display:inline-block;min-height:0;padding:4px 8px" id="dhwAdderA" value="7" data-change="dhwUpdateAdder()"></label>'
          + '<label for="dhwAdderB" style="display:block;font-size:.85rem;margin-top:8px">Value B (0-15): <input type="number" min="0" max="15" class="wd-edit" style="width:80px;display:inline-block;min-height:0;padding:4px 8px" id="dhwAdderB" value="9" data-change="dhwUpdateAdder()"></label>'
          + '<div id="dhwAdderOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:1rem"></div>'
          + '</div>';
      }},
    { id:'dhw-register', title:'Register &amp; Clock Simulator',
      explain:'Set an input value, choose enable/reset, then trigger a clock edge. The register only updates on a clock edge, and only if enabled or reset -- exactly the behavior described in the Storing Bits lesson.',
      render: function(){
        return '<div class="card">'
          + '<label for="dhwRegInput" style="display:block;font-size:.85rem">Input value: <input type="number" class="wd-edit" style="width:80px;display:inline-block;min-height:0;padding:4px 8px" id="dhwRegInput" value="5"></label>'
          + '<div class="wd-row" style="gap:12px;margin-top:10px;align-items:center">'
            + '<label style="font-size:.85rem"><input type="checkbox" id="dhwRegEnable" checked> Enable</label>'
            + '<label style="font-size:.85rem"><input type="checkbox" id="dhwRegReset"> Reset</label>'
            + '<button class="wd-btn" data-act="dhwClockEdge()">&#9202; Clock edge</button>'
          + '</div>'
          + '<div id="dhwRegOutput" role="status" aria-live="polite" style="margin-top:14px;font-weight:800;font-size:1.1rem;color:var(--teal)">Register value: 0</div>'
          + '<div id="dhwRegLog" style="margin-top:8px;font-size:.78rem;color:var(--sub)"></div>'
          + '</div>';
      }},
    { id:'dhw-cpu', title:'Tiny Processor Stepper',
      explain:'Step through a small built-in program (LOAD, LOAD, ADD, SUB, HALT) one fetch-decode-execute stage at a time, watching the program counter, registers, and current instruction update.',
      render: function(){
        return '<div class="card">'
          + '<button class="wd-btn" data-act="dhwCpuStep()">&#9654; Step</button>'
          + '<button class="wd-btn-ghost" data-act="dhwCpuReset()">Reset</button>'
          + '<div id="dhwCpuOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.9rem;white-space:pre-wrap"></div>'
          + '</div>';
      }}
  ];

  var dhwCurIdx = 0;

  function renderDhwNav(){
    var nav = document.getElementById('dhwLessonNav');
    if(!nav) return;
    nav.innerHTML = DHW_TASKS.map(function(t, i){
      var done = dhwIsDone(t.id) ? ' \u2713' : '';
      return '<button class="'+(i===dhwCurIdx?'active':'')+'" data-act="dhwOpen('+i+')">'+(i+1)+'. '+dhwEsc(t.title.replace(/&amp;/g,'&'))+done+'</button>';
    }).join('');
  }
  window.dhwOpen = function(idx){ dhwCurIdx = idx; renderDhwNav(); renderDhwTask(); };
  window.dhwNext = function(){ if(dhwCurIdx < DHW_TASKS.length-1){ dhwCurIdx++; renderDhwNav(); renderDhwTask(); } };
  window.dhwPrev = function(){ if(dhwCurIdx > 0){ dhwCurIdx--; renderDhwNav(); renderDhwTask(); } };

  function renderDhwTask(){
    var body = document.getElementById('dhwLessonBody');
    if(!body) return;
    var t = DHW_TASKS[dhwCurIdx];
    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(dhwCurIdx+1)+t.title+'</h2></div>'
      + trackMentalModel(t.explain)
      + t.render()
      + '<div class="wd-row" style="margin-top:14px">'
        + '<button class="wd-btn-ghost" data-act="dhwMarkDone('+dhwCurIdx+')">Mark explored</button>'
      + '</div>'
      + '<div class="wd-navrow">'
        + (dhwCurIdx>0 ? '<button class="wd-btn-ghost" data-act="dhwPrev()">&larr; Previous</button>' : '<span></span>')
        + (dhwCurIdx<DHW_TASKS.length-1 ? '<button class="wd-btn" data-act="dhwNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
    // wire up the task-specific initial state / listeners
    if(t.id==='dhw-transistor'){ dhwTransistorState=false; dhwRenderTransistor(); }
    if(t.id==='dhw-gate-playground'){ dhwGateInputs=[0,0]; dhwUpdateGate(); }
    if(t.id==='dhw-mux'){ dhwUpdateMux(); }
    if(t.id==='dhw-adder'){ dhwUpdateAdder(); }
    if(t.id==='dhw-register'){ dhwRegValue=0; dhwRegLogLines=[]; dhwRenderRegister(); }
    if(t.id==='dhw-cpu'){ dhwCpuReset(); }
  }

  // ---- Task 1: transistor switch ----
  var dhwTransistorState = false;
  window.dhwToggleTransistor = function(){ dhwTransistorState = !dhwTransistorState; dhwRenderTransistor(); };
  function dhwRenderTransistor(){
    var btn = document.getElementById('dhwTransCtrl');
    var lamp = document.getElementById('dhwTransLamp');
    if(!btn || !lamp) return;
    btn.textContent = 'Control input: ' + (dhwTransistorState ? 'ON' : 'OFF');
    btn.setAttribute('aria-pressed', String(dhwTransistorState));
    lamp.textContent = dhwTransistorState ? 'ON' : 'OFF';
    lamp.style.background = dhwTransistorState ? 'var(--teal)' : 'var(--panel2)';
    lamp.style.color = dhwTransistorState ? '#04211d' : 'var(--sub)';
  }

  // ---- Task 2: gate playground ----
  var dhwGateInputs = [0,0];
  window.dhwToggleGateInput = function(idx){
    dhwGateInputs[idx] = dhwGateInputs[idx] ? 0 : 1;
    dhwUpdateGate();
  };
  window.dhwUpdateGate = function(){
    var sel = document.getElementById('dhwGateSelect');
    var btnA = document.getElementById('dhwGateA');
    var btnB = document.getElementById('dhwGateB');
    var out = document.getElementById('dhwGateOutput');
    if(!sel || !out) return;
    var op = sel.value;
    var a = dhwGateInputs[0], b = dhwGateInputs[1];
    if(btnA){ btnA.textContent = 'Input A: '+a; btnA.setAttribute('aria-pressed', String(!!a)); }
    if(btnB){ btnB.style.display = (op==='NOT') ? 'none' : ''; btnB.textContent = 'Input B: '+b; btnB.setAttribute('aria-pressed', String(!!b)); }
    var result;
    if(op==='NOT') result = 1-a;
    else if(op==='AND') result = a & b;
    else if(op==='OR') result = a | b;
    else if(op==='XOR') result = a ^ b;
    else if(op==='NAND') result = 1-(a & b);
    else if(op==='NOR') result = 1-(a | b);
    out.textContent = 'Output: '+result;
  };

  // ---- Task 3: multiplexer ----
  window.dhwUpdateMux = function(){
    var sel = document.getElementById('dhwMuxSelect');
    var out = document.getElementById('dhwMuxOutput');
    if(!sel || !out) return;
    var idx = Number(sel.value);
    var inputEl = document.getElementById('dhwMuxIn'+idx);
    out.textContent = 'Output: ' + (inputEl ? inputEl.value : '?');
  };

  // ---- Task 4: 4-bit adder ----
  window.dhwUpdateAdder = function(){
    var aEl = document.getElementById('dhwAdderA');
    var bEl = document.getElementById('dhwAdderB');
    var out = document.getElementById('dhwAdderOutput');
    if(!aEl || !bEl || !out) return;
    var a = Math.max(0, Math.min(15, Number(aEl.value)||0));
    var b = Math.max(0, Math.min(15, Number(bEl.value)||0));
    var total = a + b;
    var carry = total > 15 ? 1 : 0;
    var sum4 = total & 0xF;
    function toBin4(n){ return n.toString(2).padStart(4,'0'); }
    out.textContent = toBin4(a)+' + '+toBin4(b)+' = '+toBin4(sum4)+'  (carry-out: '+carry+', decimal: '+sum4+(carry?' + overflow of 16':'')+')';
  };

  // ---- Task 5: register + clock ----
  var dhwRegValue = 0;
  var dhwRegLogLines = [];
  window.dhwClockEdge = function(){
    var inputEl = document.getElementById('dhwRegInput');
    var enableEl = document.getElementById('dhwRegEnable');
    var resetEl = document.getElementById('dhwRegReset');
    var inputVal = Number(inputEl.value)||0;
    var enable = enableEl.checked;
    var reset = resetEl.checked;
    var action;
    if(reset){ dhwRegValue = 0; action = 'RESET -> 0'; }
    else if(enable){ dhwRegValue = inputVal; action = 'ENABLED, loaded '+inputVal; }
    else { action = 'not enabled, unchanged ('+dhwRegValue+')'; }
    dhwRegLogLines.unshift('Edge: '+action);
    dhwRegLogLines = dhwRegLogLines.slice(0,5);
    dhwRenderRegister();
  };
  function dhwRenderRegister(){
    var out = document.getElementById('dhwRegOutput');
    var log = document.getElementById('dhwRegLog');
    if(out) out.textContent = 'Register value: '+dhwRegValue;
    if(log) log.innerHTML = dhwRegLogLines.map(function(l){ return '<div>'+dhwEsc(l)+'</div>'; }).join('');
  }

  // ---- Task 6: tiny CPU stepper ----
  var dhwCpuProgram = [
    {op:'LOAD', rd:0, val:5}, {op:'LOAD', rd:1, val:3}, {op:'ADD', rd:2, ra:0, rb:1}, {op:'SUB', rd:3, ra:2, rb:1}, {op:'HALT'}
  ];
  var dhwCpuState = null;
  window.dhwCpuReset = function(){
    dhwCpuState = { pc:0, regs:[0,0,0,0], halted:false, log:[] };
    dhwRenderCpu();
  };
  window.dhwCpuStep = function(){
    if(!dhwCpuState || dhwCpuState.halted) return;
    var instr = dhwCpuProgram[dhwCpuState.pc];
    var line = 'FETCH pc='+dhwCpuState.pc+': '+instr.op;
    if(instr.op==='LOAD'){ dhwCpuState.regs[instr.rd] = instr.val; line += ' -> R'+instr.rd+'='+instr.val; }
    else if(instr.op==='ADD'){ dhwCpuState.regs[instr.rd] = dhwCpuState.regs[instr.ra]+dhwCpuState.regs[instr.rb]; line += ' -> R'+instr.rd+'=R'+instr.ra+'+R'+instr.rb+'='+dhwCpuState.regs[instr.rd]; }
    else if(instr.op==='SUB'){ dhwCpuState.regs[instr.rd] = dhwCpuState.regs[instr.ra]-dhwCpuState.regs[instr.rb]; line += ' -> R'+instr.rd+'=R'+instr.ra+'-R'+instr.rb+'='+dhwCpuState.regs[instr.rd]; }
    else if(instr.op==='HALT'){ dhwCpuState.halted = true; line += ' -> HALT'; }
    dhwCpuState.log.unshift(line);
    if(!dhwCpuState.halted) dhwCpuState.pc++;
    dhwRenderCpu();
  };
  function dhwRenderCpu(){
    var out = document.getElementById('dhwCpuOutput');
    if(!out || !dhwCpuState) return;
    out.textContent = 'PC: '+dhwCpuState.pc+(dhwCpuState.halted?' (HALTED)':'')
      + '\\nRegisters: R0='+dhwCpuState.regs[0]+' R1='+dhwCpuState.regs[1]+' R2='+dhwCpuState.regs[2]+' R3='+dhwCpuState.regs[3]
      + '\\n\\n'+dhwCpuState.log.join('\\n');
  }

  var dhwBooted = false;
  window._digitalHardwareBoot = function(){
    if(dhwBooted) return;
    dhwBooted = true;
    renderDhwNav();
    renderDhwTask();
  };
})();
