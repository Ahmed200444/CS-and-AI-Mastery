(function(){
'use strict';
function clean(){
 document.querySelectorAll('.lesson-run-card').forEach(function(card){
   var pre=card.querySelector('pre.code');
   if(!pre||pre.dataset.referenceOnly!=='true')return;
   var button=card.querySelector('[data-run-example]');
   var lang=card.querySelector('.lesson-run-lang');
   var output=card.querySelector('[data-example-output]');
   if(button)button.remove();
   if(lang)lang.textContent='Reference example';
   if(output){
     output.innerHTML='<span class="ok">Reference only</span>\nThis block contains pseudocode or placeholders, so it is shown for explanation rather than execution.';
   }
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean);else clean();
setTimeout(clean,350);
})();
