
(function(){
  // ---------- Reusable interactive visualization registry (Phase 3A) ----------
  // Keyed by lesson id. Genuinely interactive (real sliders driving real computation),
  // not decorative -- these compute live in the browser, no fake/pretend numbers.
  window.CX_VIZ = {};

  window.CX_VIZ['dl-neurons'] = function(containerId){
    var w1=0.5, w2=-0.2, b=1.0;
    function relu(x){ return Math.max(0, x); }
    function render(){
      var x1 = parseFloat(document.getElementById(containerId+'_x1').value);
      var x2 = parseFloat(document.getElementById(containerId+'_x2').value);
      var z = w1*x1 + w2*x2 + b;
      var a = relu(z);
      document.getElementById(containerId+'_x1val').textContent = x1.toFixed(1);
      document.getElementById(containerId+'_x2val').textContent = x2.toFixed(1);
      document.getElementById(containerId+'_z').textContent = z.toFixed(2);
      document.getElementById(containerId+'_a').textContent = a.toFixed(2);
      var svg = document.getElementById(containerId+'_svg');
      if(svg){
        var nodeA = svg.querySelector('.viz-node-output');
        if(nodeA) nodeA.setAttribute('fill', a>0 ? '#4fd1c5' : '#3a4152');
        var e1 = svg.querySelector('.viz-edge-1'), e2 = svg.querySelector('.viz-edge-2');
        if(e1) e1.setAttribute('stroke-width', Math.min(6, 1+Math.abs(x1*w1)*3));
        if(e2) e2.setAttribute('stroke-width', Math.min(6, 1+Math.abs(x2*w2)*3));
      }
    }
    window['_cxVizInit_'+containerId] = render;
    document.getElementById(containerId+'_x1').addEventListener('input', render);
    document.getElementById(containerId+'_x2').addEventListener('input', render);
    render();
  };

  window.CX_VIZ['tf-selfattention'] = function(containerId){
    var tokens = ['The','bank','by','the','river'];
    // toy, deliberately simplified query/key vectors purely for illustrating the MECHANISM,
    // not a real trained model -- matches the lesson's own worked example.
    var vecs = { 'The':[0.1,0.2], 'bank':[0.9,0.1], 'by':[0.1,0.1], 'the':[0.1,0.2], 'river':[0.8,0.3] };
    function dot(a,b){ return a[0]*b[0]+a[1]*b[1]; }
    function softmax(arr){
      var m = Math.max.apply(null, arr);
      var ex = arr.map(function(v){ return Math.exp(v-m); });
      var s = ex.reduce(function(a,b){return a+b;},0);
      return ex.map(function(v){ return v/s; });
    }
    function render(qIdx){
      var q = vecs[tokens[qIdx]];
      var scores = tokens.map(function(t){ return dot(q, vecs[t]); });
      var weights = softmax(scores);
      var barsEl = document.getElementById(containerId+'_bars');
      barsEl.innerHTML = tokens.map(function(t,i){
        var pct = Math.round(weights[i]*100);
        return '<div class="viz-attn-row"><span class="viz-attn-label">'+t+'</span>'
          + '<div class="viz-attn-bar-bg"><div class="viz-attn-bar" style="width:'+pct+'%"></div></div>'
          + '<span class="viz-attn-pct">'+pct+'%</span></div>';
      }).join('');
      document.querySelectorAll('#'+containerId+' .viz-attn-token').forEach(function(btn,i){
        btn.classList.toggle('active', i===qIdx);
      });
    }
    window['_cxVizInit_'+containerId] = function(){ render(1); }; // default: "bank" as query
    document.querySelectorAll('#'+containerId+' .viz-attn-token').forEach(function(btn,i){
      btn.addEventListener('click', function(){ render(i); });
    });
    render(1);
  };

  // Called by the course renderer after inserting a viz container into the DOM
  window.cxInitViz = function(lessonId, containerId){
    if(window.CX_VIZ[lessonId]){
      try{ window.CX_VIZ[lessonId](containerId); }catch(e){ console.error('viz init failed', e); }
    }
  };
})();

