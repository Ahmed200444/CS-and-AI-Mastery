(()=>{'use strict';
function sync(target){
  const task=target?.closest?.('.oa-task');if(!task||task.getAttribute('data-csai-active-language')!=='dual')return;
  const select=task.querySelector('[data-lang]'),lang=task.getAttribute('data-csai-editor-language');
  if(select&&(lang==='python'||lang==='cpp'))select.value=lang;
}
for(const type of ['pointerdown','mousedown','touchstart'])document.addEventListener(type,event=>{if(event.target.closest?.('[data-run],[data-universal-run],[data-submit]'))sync(event.target);},true);
})();