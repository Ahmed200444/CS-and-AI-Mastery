(() => {
  'use strict';

  const PRIORITY = [
    ['Python','python'],['SQL','sql'],['APIs','apis'],['Linux','linux'],['DSA in Python','dsa'],
    ['Backend','backend-development'],['Machine Learning','machine-learning'],['LLMs','llms'],['RAG','rag'],['AI Agents','ai-agents']
  ];

  const style = document.createElement('style');
  style.textContent = `
    #internship-focus{margin:22px 0;padding:20px;border:1px solid #cfd9e5;border-radius:16px;background:#f7fbff;color:#15202b}
    .if-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.if-head h2{margin:4px 0 6px}.if-head p{margin:0;line-height:1.55}
    .if-badge{white-space:nowrap;padding:7px 10px;border-radius:999px;background:#163a5f;color:#fff;font-size:12px;font-weight:800}
    .if-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:16px}.if-item{padding:11px 12px;border-radius:11px;background:#eaf3fb;font-weight:750}
    .if-note{margin-top:14px;padding:12px 14px;border-left:4px solid #6b7280;background:#eef1f4;border-radius:8px;line-height:1.5}
    html[data-theme="dark"] #internship-focus{background:#111b25!important;color:#edf3f8!important;border-color:#344352!important}
    html[data-theme="dark"] .if-item{background:#17293a!important;color:#edf3f8!important}html[data-theme="dark"] .if-note{background:#202a34!important;color:#dce6ee!important}
    @media(max-width:640px){.if-head{display:block}.if-badge{display:inline-block;margin-top:12px}}
  `;
  document.head.appendChild(style);

  function render(){
    if(document.getElementById('internship-focus')) return;
    const text = `${location.hash} ${document.title}`.toLowerCase();
    const isHub = /hub|roadmap|dashboard|career|home/.test(text) || !location.hash || location.hash === '#';
    if(!isHub) return;
    const root = document.querySelector('main') || document.querySelector('[role="main"]');
    if(!root) return;
    const section = document.createElement('section');
    section.id = 'internship-focus';
    section.innerHTML = `<div class="if-head"><div><div style="font-size:12px;font-weight:800;letter-spacing:.12em;color:#17649a">AI APPLICATION ENGINEERING PATH</div><h2>Your internship-focused study path</h2><p>Prioritize Python-based software engineering and AI application skills. JavaScript is not required for this path.</p></div><span class="if-badge">Python-first</span></div><div class="if-grid">${PRIORITY.map(([name])=>`<div class="if-item">${name}</div>`).join('')}</div><div class="if-note"><strong>Optional:</strong> Web Development remains available as an extra course, but it is not part of your required internship roadmap and does not block progress.</div>`;
    const first = root.firstElementChild;
    first ? first.insertAdjacentElement('afterend',section) : root.appendChild(section);
  }

  function markWebOptional(){
    document.querySelectorAll('a,button,.course-card,.track-card,[data-course-id],[data-course],[data-track]').forEach(el=>{
      const t=(el.textContent||'').toLowerCase();
      if(!t.includes('web development') || el.querySelector('.if-optional')) return;
      const badge=document.createElement('span'); badge.className='if-optional'; badge.textContent=' Optional';
      badge.style.cssText='font-size:11px;font-weight:800;opacity:.75;margin-left:6px';
      el.appendChild(badge);
    });
  }

  const refresh=()=>{render();markWebOptional();};
  const start=()=>{refresh();new MutationObserver(()=>setTimeout(refresh,40)).observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',()=>setTimeout(refresh,80));};
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();