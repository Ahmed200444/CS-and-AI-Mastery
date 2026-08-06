(() => {
  'use strict';

  const META = {
    python:['Beginner','18–24 hours','None'], sql:['Beginner','14–18 hours','Basic computer skills'], oop:['Intermediate','8–12 hours','Python fundamentals'],
    'git-github':['Beginner','8–10 hours','None'], linux:['Beginner','12–16 hours','None'], apis:['Intermediate','14–18 hours','Python fundamentals'],
    dsa:['Intermediate','35–45 hours','Python fundamentals'], 'problem-solving':['Intermediate','18–24 hours','Python fundamentals'],
    'software-engineering':['Intermediate','12–16 hours','Git and programming basics'], testing:['Intermediate','12–16 hours','Python and OOP'],
    debugging:['Intermediate','10–14 hours','Python fundamentals'], databases:['Intermediate','14–18 hours','SQL fundamentals'],
    'computer-networks':['Intermediate','12–16 hours','Basic computing concepts'], 'backend-development':['Intermediate','20–28 hours','Python, APIs, SQL'],
    'web-development':['Optional','18–24 hours','Not required for your internship path'], docker:['Intermediate','10–14 hours','Linux and backend basics'],
    cloud:['Intermediate','12–16 hours','Linux, networking, backend basics'], 'system-design':['Advanced','18–24 hours','Backend, databases, networking'],
    'machine-learning':['Intermediate','24–32 hours','Python, NumPy, basic statistics'], 'deep-learning':['Advanced','24–32 hours','Machine learning and Python'],
    transformers:['Advanced','18–24 hours','Deep learning basics'], 'hugging-face':['Advanced','14–18 hours','Transformers and Python'],
    'generative-ai':['Advanced','20–28 hours','Deep learning fundamentals'], llms:['Advanced','20–28 hours','Python and transformer basics'],
    rag:['Advanced','20–28 hours','LLMs, APIs, databases'], 'ai-agents':['Advanced','24–32 hours','LLMs, RAG, APIs'],
    'model-deployment':['Advanced','18–24 hours','Python, APIs, Docker']
  };

  const active=()=>window.CSAIMasteryPracticeFolder?.currentTrack?.();
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function render(){
    const slug=active(), info=META[slug];
    const track=document.getElementById('full-study-track');
    if(!track||!info)return;
    const head=track.querySelector('.fst-head');
    if(!head||track.querySelector('.course-meta-panel'))return;
    const panel=document.createElement('div');
    panel.className='course-meta-panel';
    panel.setAttribute('aria-label','Course information');
    panel.innerHTML=`<span><strong>Level</strong>${esc(info[0])}</span><span><strong>Estimated time</strong>${esc(info[1])}</span><span><strong>Recommended first</strong>${esc(info[2])}</span>`;
    head.insertAdjacentElement('afterend',panel);
  }

  const style=document.createElement('style');
  style.textContent=`.course-meta-panel{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0 0 18px}.course-meta-panel span{display:flex;flex-direction:column;gap:4px;padding:12px 14px;border:1px solid #d7dee7;border-radius:11px;background:#fff;line-height:1.4}.course-meta-panel strong{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:#17649a}html[data-theme="dark"] .course-meta-panel span{background:#17212c!important;border-color:#344352!important;color:#edf3f8!important}@media(max-width:720px){.course-meta-panel{grid-template-columns:1fr}}`;
  document.head.appendChild(style);
  const start=()=>{render();new MutationObserver(()=>setTimeout(render,30)).observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',()=>setTimeout(render,100));};
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();