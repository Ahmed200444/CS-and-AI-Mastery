(() => {
  'use strict';

  const STATUS_URL = '/api/github/status';
  const FILE_URL = '/api/github/file';
  const AUTHORIZE_URL = '/api/github/authorize';
  const STORE_KEY = 'csai-github-preferred-repo';
  let state = { connected:false, csrf:null, repositories:[], selected:null, user:null };

  const clean = value => String(value || '').trim();
  const slug = value => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'practice';

  function activeTrack(){
    if (window.CSAIMasteryPracticeFolder?.currentTrack) {
      const found = window.CSAIMasteryPracticeFolder.currentTrack();
      if (found) return found;
    }
    const hash = location.hash.toLowerCase();
    const title = document.querySelector('.cx-hero h1, main h1, .course-title')?.textContent || document.title;
    return slug(hash.replace(/^#/, '') || title || 'general');
  }

  function activeEditor(){
    const focused = document.activeElement;
    if (focused && focused.matches?.('textarea, [contenteditable="true"]')) return focused;
    const candidates = [...document.querySelectorAll('textarea, [contenteditable="true"]')]
      .filter(el => el.offsetParent !== null && clean(el.value ?? el.textContent));
    return candidates.at(-1) || null;
  }

  function editorContent(editor){ return clean(editor?.value ?? editor?.textContent); }

  function extensionFor(content){
    if (/\b(def|class|import|from)\b/.test(content)) return 'py';
    if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)\b/i.test(content)) return 'sql';
    if (/^\s*[{[]/.test(content)) return 'json';
    if (/<[a-z][\s\S]*>/i.test(content)) return 'html';
    if (/\b(const|let|function|=>)\b/.test(content)) return 'js';
    return 'txt';
  }

  function suggestedPath(content){
    const track = activeTrack();
    const heading = document.querySelector('.cx-panel.active h2, .cx-panel.active h3, main h2, main h3')?.textContent || 'practice';
    return `student-code/practice/${track}/${slug(heading)}.${extensionFor(content)}`;
  }

  function style(){
    if (document.getElementById('csai-gh-style')) return;
    const s = document.createElement('style');
    s.id = 'csai-gh-style';
    s.textContent = `
      .csai-ghbar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9998;display:flex;align-items:center;gap:8px;max-width:calc(100vw - 24px);padding:9px 10px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(15,20,32,.96);box-shadow:0 10px 35px rgba(0,0,0,.35);color:#e8ecf3;font:600 12px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;backdrop-filter:blur(10px)}
      .csai-ghbar select,.csai-ghbar input{min-width:0;border:1px solid rgba(255,255,255,.15);border-radius:8px;background:#0a0e15;color:#e8ecf3;padding:7px 8px;font:inherit}.csai-ghbar select{max-width:210px}.csai-ghbar input{width:250px;max-width:27vw}
      .csai-ghbar button,.csai-ghbar a{border:1px solid rgba(255,255,255,.16);border-radius:8px;background:none;color:#d8e0eb;padding:7px 10px;font:inherit;text-decoration:none;cursor:pointer;white-space:nowrap}.csai-ghbar .primary{background:#4fd1c5;color:#08221f;border-color:#4fd1c5}.csai-ghbar .status{white-space:nowrap;color:#8b96a6}.csai-ghbar .ok{color:#7ee0a0}.csai-ghbar .err{color:#f0879a}
      body[data-theme="light"] .csai-ghbar{background:rgba(255,255,255,.97);color:#211f2b;border-color:rgba(0,0,0,.14)}body[data-theme="light"] .csai-ghbar select,body[data-theme="light"] .csai-ghbar input{background:#fff;color:#211f2b;border-color:rgba(0,0,0,.18)}body[data-theme="light"] .csai-ghbar button,body[data-theme="light"] .csai-ghbar a{color:#211f2b;border-color:rgba(0,0,0,.18)}
      @media(max-width:700px){.csai-ghbar{left:10px;right:10px;bottom:8px;transform:none;flex-wrap:wrap}.csai-ghbar input{order:5;width:100%;max-width:none}.csai-ghbar select{max-width:46vw}}
    `;
    document.head.appendChild(s);
  }

  function render(){
    style();
    let bar = document.getElementById('csai-ghbar');
    if (!bar) { bar = document.createElement('div'); bar.id='csai-ghbar'; bar.className='csai-ghbar'; document.body.appendChild(bar); }
    if (!state.connected) {
      bar.innerHTML = `<span class="status">GitHub not connected</span><a class="primary" href="${AUTHORIZE_URL}">Connect GitHub</a>`;
      return;
    }
    const preferred = state.selected || localStorage.getItem(STORE_KEY) || state.repositories.find(r=>r.full_name==='Ahmed200444/CS-and-AI-Mastery')?.full_name || state.repositories[0]?.full_name || '';
    state.selected = preferred;
    const options = state.repositories.map(r=>`<option value="${r.full_name.replace(/"/g,'&quot;')}" ${r.full_name===preferred?'selected':''}>${r.full_name}</option>`).join('');
    bar.innerHTML = `<span class="status ok">GitHub ✓</span><select aria-label="GitHub repository">${options}</select><input aria-label="Repository file path" placeholder="student-code/practice/..."><button data-gh-download>Download</button><button class="primary" data-gh-publish>Publish to GitHub</button><span class="status" data-gh-msg></span>`;
    const select = bar.querySelector('select');
    const path = bar.querySelector('input');
    const editor = activeEditor();
    const content = editorContent(editor);
    path.value = content ? suggestedPath(content) : `student-code/practice/${activeTrack()}/practice.txt`;
    select.addEventListener('change',()=>{state.selected=select.value;localStorage.setItem(STORE_KEY,select.value);});
    bar.querySelector('[data-gh-download]').addEventListener('click',downloadActive);
    bar.querySelector('[data-gh-publish]').addEventListener('click',()=>publishActive(path.value));
  }

  function message(text, kind=''){
    const el=document.querySelector('[data-gh-msg]'); if(!el)return; el.textContent=text; el.className=`status ${kind}`;
  }

  function downloadActive(){
    const editor=activeEditor(), content=editorContent(editor);
    if(!content){ message('Open or type code first','err'); return; }
    const path=document.querySelector('#csai-ghbar input')?.value || suggestedPath(content);
    const blob=new Blob([content],{type:'text/plain;charset=utf-8'}), a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=path.split('/').pop(); a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); message('Downloaded','ok');
  }

  async function publishActive(path){
    const editor=activeEditor(), content=editorContent(editor);
    if(!content){ message('Open or type code first','err'); return; }
    if(!state.selected){ message('Choose a repository','err'); return; }
    message('Publishing…');
    try{
      const response=await fetch(FILE_URL,{method:'POST',headers:{'Content-Type':'application/json','X-CSAI-CSRF':state.csrf},body:JSON.stringify({repository:state.selected,path,content,message:`Add ${path.split('/').pop()} from CS & AI Mastery`})});
      const data=await response.json(); if(!response.ok) throw new Error(data.error || 'GitHub publish failed');
      message('Published ✓','ok');
      if(data.url) window.open(data.url,'_blank','noopener');
    }catch(error){ message(error.message,'err'); }
  }

  async function load(){
    try{
      const response=await fetch(STATUS_URL,{credentials:'same-origin'}), data=await response.json();
      if(!response.ok) throw new Error(data.error || 'Status check failed');
      state={...state,...data,selected:localStorage.getItem(STORE_KEY)};
    }catch(error){ state.connected=false; }
    render();
  }

  document.addEventListener('focusin',e=>{ if(e.target.matches?.('textarea,[contenteditable="true"]')) setTimeout(render,0); });
  window.addEventListener('hashchange',()=>setTimeout(render,100));
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',load); else load();
  window.CSAIMasteryGitHub={reload:load,publish:publishActive};
})();
