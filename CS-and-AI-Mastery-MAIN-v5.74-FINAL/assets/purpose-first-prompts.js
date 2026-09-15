(function(){
'use strict';
/* v5.64: Example cards intentionally stay concise. The old purpose/company framing is
   no longer rendered on examples; the platform now shows only what the program does. */
function clean(root){
  root=root||document;
  if(root.querySelectorAll)root.querySelectorAll('.csai-purpose-first').forEach(function(n){n.remove()});
}
function blank(){return''}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){clean(document)},{once:true});else clean(document);
window.CSAIPurposeFirstPrompts={
  refresh:clean,
  questionForExample:blank,
  companyTicketForExample:blank,
  firstMoveForCourse:blank,
  definitionOfDoneForCourse:blank
};
})();
