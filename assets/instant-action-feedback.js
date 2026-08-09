(()=>{'use strict';
const RUN='[data-run],[data-universal-run],[data-project-run],[data-run-language-example],[data-run-example],[data-evergreen-run]';
function outputFor(button){
  const root=button.closest('.oa-task,.project-card,[data-lang-variant],.lesson-run-card,.evergreen-example,.csai-example,.csai-example-card,article,section')||button.parentElement;
  return root?.querySelector('[data-output],[data-project-output],[data-csai-example-output],[data-example-output],.lesson-run-output,.evergreen-output,.csai-example-output,[data-universal-output]')||null;
}
function language(button){
  const root=button.closest('.oa-task,.project-card,[data-lang-variant],.lesson-run-card,.evergreen-example,.csai-example,.csai-example-card,article,section');
  const editor=root?.querySelector('textarea[data-editor],textarea[data-project-editor],textarea[data-dual-editor],textarea');
  const hint=[root?.getAttribute('data-csai-editor-language'),root?.dataset?.projectLanguage,root?.getAttribute('data-lang-variant'),root?.querySelector('[data-lang],[data-project-lang]')?.value,editor?.dataset?.language].filter(Boolean).join(' ').toLowerCase();
  const code=String(editor?.value||root?.querySelector('pre code,pre')?.textContent||'');
  if(/cpp|c\+\+/.test(hint)||/#include\s*[<"]|\bint\s+main\s*\(/.test(code))return'C++';
  if(/python|\bpy\b/.test(hint)||/(^|\n)\s*(def |class |from |import |print\s*\()/.test(code))return'Python';
  if(/sql/.test(hint))return'SQL';
  if(/javascript|\bjs\b/.test(hint))return'JavaScript';
  return'';
}
function show(button){
  const out=outputFor(button);if(!out)return;
  const lang=language(button),tests=/test|check/i.test(button.textContent||'');
  const text=tests?'Running checks…':lang?`Preparing ${lang}…`:'Running…';
  if(out.dataset.csaiInstantFeedback===text&&out.textContent===text)return;
  out.dataset.csaiInstantFeedback=text;out.textContent=text;
}
for(const type of ['pointerdown','mousedown','touchstart'])document.addEventListener(type,event=>{const b=event.target.closest?.(RUN);if(b&&!b.disabled)show(b);},true);
document.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const b=event.target.closest?.(RUN);if(b&&!b.disabled)show(b);},true);
})();
