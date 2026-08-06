(() => {
  'use strict';

  const TRACKS = [
    ['machine-learning',['machine learning','machine-learning','machinelearning','ml']],['deep-learning',['deep learning','deep-learning','deeplearning']],['generative-ai',['generative ai','generative-ai','generativeai','genai']],['ai-agents',['ai agents','ai-agents','aiagents','agents']],['model-deployment',['model deployment','model-deployment','modeldeployment']],['system-design',['system design','system-design','systemdesign']],['computer-networks',['computer networks','networking','networks']],['backend-development',['backend development','backend']],['web-development',['web development','web dev','frontend']],['problem-solving',['problem solving']],['software-engineering',['software engineering','swe fundamentals','swe']],['hugging-face',['hugging face','huggingface']],['transformers',['transformers','transformer']],['databases',['databases','database']],['debugging',['debugging']],['testing',['testing']],['docker',['docker']],['cloud',['cloud']],['llms',['llms','large language models','llm']],['rag',['retrieval augmented generation','rag']],['apis',['apis','api request lab','api development','rest api']],['linux',['linux']],['oop',['object oriented programming','oop']],['dsa',['data structures and algorithms','dsa']],['git-github',['git and github','git & github','github']],['sql',['sql']],['python',['python']]
  ];
  const clean=v=>String(v||'').toLowerCase().replace(/[_/]+/g,' ').replace(/[^a-z0-9+#& -]+/g,' ').replace(/\s+/g,' ').trim();
  function detectTrack(){
    const values=[location.hash,document.title];
    ['[data-course-id].active','[data-course].active','[data-track].active','[aria-current="page"]','.course-card.active','.track-card.active','.lesson-sidebar .active','.course-title','main h1','main h2','aside h2','aside h3'].forEach(s=>document.querySelectorAll(s).forEach(n=>values.push(n.dataset.courseId,n.dataset.course,n.dataset.track,n.textContent)));
    const c=values.filter(Boolean).map(clean);
    for(const [slug,a] of TRACKS) if(c.some(x=>a.some(y=>x.includes(clean(y))))) return slug;
    return null;
  }
  function routePath(path){
    if(typeof path!=='string')return path;const n=path.replace(/\\/g,'/');if(!n.startsWith('student-code/practice/'))return path;const t=detectTrack();if(!t)return path;const p=n.split('/');if(p.length>=4)p[2]=t;return p.join('/');
  }
  function rewrite(v){if(!v||typeof v!=='object')return v;const c=Array.isArray(v)?[...v]:{...v};Object.keys(c).forEach(k=>{if(['path','filePath','file_path','targetPath','target_path'].includes(k))c[k]=routePath(c[k]);else if(c[k]&&typeof c[k]==='object')c[k]=rewrite(c[k]);});return c;}
  const realFetch=window.fetch.bind(window);window.fetch=(input,init)=>{const url=typeof input==='string'?input:(input&&input.url)||'',next=init?{...init}:{};if(/\/api\/github\/(?:file|sync)(?:[/?#]|$)/i.test(url)&&typeof next.body==='string'){try{next.body=JSON.stringify(rewrite(JSON.parse(next.body)));}catch(_){}}return realFetch(input,next);};

  const KEY='cs-ai-mastery-theme';
  const css=document.createElement('style');css.textContent=`html[data-theme="dark"],html[data-theme="dark"] body{color-scheme:dark;background:#0f1720!important;color:#edf3f8!important}html[data-theme="dark"] body,html[data-theme="dark"] #app,html[data-theme="dark"] main,html[data-theme="dark"] aside,html[data-theme="dark"] nav,html[data-theme="dark"] header,html[data-theme="dark"] footer,html[data-theme="dark"] section,html[data-theme="dark"] article{background-color:#0f1720!important;color:#edf3f8!important}.theme-force-surface{background-color:#17212c!important;background-image:none!important;color:#edf3f8!important;border-color:#344352!important}.theme-force-page{background-color:#0f1720!important;background-image:none!important;color:#edf3f8!important}.theme-force-text{color:#edf3f8!important}.theme-force-muted{color:#c8d3dc!important}html[data-theme="dark"] input,html[data-theme="dark"] textarea,html[data-theme="dark"] select{background:#111b25!important;color:#edf3f8!important;border-color:#455464!important}`;document.head.appendChild(css);
  const rgb=v=>{const m=String(v||'').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);return m?m.slice(1,4).map(Number):null},lum=r=>r?(r[0]*299+r[1]*587+r[2]*114)/1000:null;
  function scan(){if(!document.body||document.documentElement.dataset.theme!=='dark')return;document.querySelectorAll('body,main,aside,nav,header,footer,section,article,div,form,fieldset').forEach(e=>{e.classList.remove('theme-force-surface','theme-force-page');if(e.closest('pre,code,.code-editor,[class*="editor"],[class*="terminal"]'))return;const l=lum(rgb(getComputedStyle(e).backgroundColor));if(l!==null&&l>205)e.classList.add(e===document.body||e.matches('main,aside,nav,header,footer')||e.clientWidth>innerWidth*.75?'theme-force-page':'theme-force-surface');});document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,li,label,strong,small').forEach(e=>{e.classList.remove('theme-force-text','theme-force-muted');if(e.closest('pre,code,.code-editor,[class*="editor"],[class*="terminal"]'))return;const l=lum(rgb(getComputedStyle(e).color));if(l!==null&&l<125)e.classList.add('theme-force-text');else if(l!==null&&l<175)e.classList.add('theme-force-muted');});}
  function buttons(d){document.querySelectorAll('button,[role="button"]').forEach(b=>{const t=clean(b.textContent);if(t==='dark'||t==='light'||t.includes('dark mode')||t.includes('light mode')){b.textContent=d?'☀️ Light':'🌙 Dark';b.setAttribute('aria-label',d?'Switch to light mode':'Switch to dark mode');}});}
  function apply(theme){const d=theme==='dark',r=document.documentElement;r.dataset.theme=theme;r.classList.toggle('dark',d);r.classList.toggle('light',!d);if(document.body){document.body.dataset.theme=theme;document.body.classList.toggle('dark',d);document.body.classList.toggle('light',!d);}localStorage.setItem(KEY,theme);localStorage.setItem('theme',theme);buttons(d);setTimeout(scan,30);setTimeout(scan,300);}
  const current=()=>localStorage.getItem(KEY)||localStorage.getItem('theme')||'light';
  document.addEventListener('click',e=>{const b=e.target.closest?.('button,[role="button"]');if(!b)return;const t=clean(`${b.textContent} ${b.getAttribute('aria-label')} ${b.id} ${b.className}`);if(!t.includes('dark')&&!t.includes('light')&&!t.includes('theme'))return;e.preventDefault();e.stopImmediatePropagation();apply(current()==='dark'?'light':'dark');},true);
  function load(name){return import(name).catch(error=>console.error(`[CS AI Mastery] Failed to load ${name}`,error));}
  function start(){apply(current());new MutationObserver(()=>document.documentElement.dataset.theme==='dark'&&setTimeout(scan,40)).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});load('./full-track-lessons.js');load('./dsa-complete-course.js');load('./course-knowledge-checks.js');load('./internship-focus.js');load('./course-learning-tools.js');load('./course-metadata-panel.js');load('./github-integration.js');}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();window.addEventListener('hashchange',()=>setTimeout(()=>apply(current()),80));
  window.CSAIMasteryPracticeFolder={currentTrack:detectTrack,routePath};window.CSAIMasteryTheme={apply,current};
})();

(() => {
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let courseData=null;
  function courses(){
    if(courseData)return courseData;
    try{courseData=JSON.parse(document.getElementById('coursedata')?.textContent||'[]')}catch(error){courseData=[];console.error('[CS AI Mastery] Extended lesson data failed',error)}
    return courseData;
  }
  function activeCourse(){
    const route=location.hash.replace(/^#/,'');
    return courses().find(course=>course.linked===route)||null;
  }
  function currentLesson(course,card){
    const title=(card.querySelector('h2')?.textContent||'').trim();
    return (course?.lessons||[]).find(lesson=>(lesson.title||'').trim()===title)||null;
  }
  function list(value){return Array.isArray(value)?value.filter(Boolean):value?[value]:[]}
  function challenge(course,lesson){
    const exercise=(course.exercises||[]).find(item=>item.lessonId===lesson.id)||(course.exercises||[])[0];
    return exercise?.prompt||`Build a small example that uses ${lesson.title}, test one normal case and one edge case, then explain the result.`;
  }
  function interview(course,lesson){
    const concepts=list(lesson.concepts);
    const first=concepts[0]||lesson.title;
    const second=concepts[1]||'the main trade-off';
    return [
      `Explain ${first} in simple words and give one practical example.`,
      `What mistake is most likely when applying ${lesson.title}, and how would you detect it?`,
      `How would you compare two approaches using ${second}, correctness, readability and performance?`
    ];
  }
  function addStyles(){
    if(document.getElementById('cr-depth-style'))return;
    const style=document.createElement('style');
    style.id='cr-depth-style';
    style.textContent=`.cr-depth{margin-top:22px;display:grid;gap:14px}.cr-depth-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cr-depth-box{padding:15px;border:1px solid var(--border,#d7dee7);border-radius:12px;background:rgba(127,127,127,.07)}.cr-depth-box h3{margin:0 0 9px}.cr-depth-box p,.cr-depth-box li{line-height:1.65}.cr-depth-callout{border-left:4px solid #6d7ff2}.cr-depth-check{list-style:none;padding:0}.cr-depth-check li{padding:7px 0 7px 27px;position:relative}.cr-depth-check li:before{content:'□';position:absolute;left:0;font-weight:900;color:#168a67}.cr-depth details{border:1px solid var(--border,#d7dee7);border-radius:12px;padding:13px 15px;background:rgba(127,127,127,.05)}.cr-depth summary{font-weight:850;cursor:pointer}.cr-depth textarea{width:100%;min-height:90px;margin-top:10px;padding:10px;border:1px solid var(--border,#c8d1dc);border-radius:9px;background:transparent;color:inherit;font:inherit;box-sizing:border-box}html[data-theme=dark] .cr-depth-box,html[data-theme=dark] .cr-depth details{background:#111b25!important;border-color:#344352!important}@media(max-width:760px){.cr-depth-grid{grid-template-columns:1fr}.cr-depth-box{padding:13px}.cr-depth-box p,.cr-depth-box li{font-size:.92rem}}`;
    document.head.appendChild(style);
  }
  function enhance(card){
    if(card.dataset.depthExpanded==='true')return;
    const course=activeCourse();
    const lesson=course&&currentLesson(course,card);
    if(!course||!lesson)return;
    card.dataset.depthExpanded='true';
    const concepts=list(lesson.concepts);
    const objectives=list(lesson.objectives);
    const mistakes=list(lesson.commonMistakes||lesson.commonMistake);
    const industry=list(course.industryUsage).map(item=>typeof item==='string'?item:`${item.company?item.company+': ':''}${item.usage||''}`);
    const checks=[
      `I can explain ${lesson.title} without reading the lesson.`,
      concepts[0]?`I can identify when ${concepts[0]} should be used.`:'I can identify when this technique should be used.',
      'I can predict one likely failure or edge case.',
      'I can complete the guided task without revealing the solution.',
      'I can explain the trade-off in an interview answer.'
    ];
    const reasoning=[
      objectives[0]||`State the exact result ${lesson.title} should produce.`,
      concepts[0]?`Identify the role of ${concepts[0]} in the solution.`:'Identify the important inputs, rules and constraints.',
      concepts[1]?`Connect ${concepts[1]} to the first concept and trace the flow.`:'Trace the process from input to output.',
      mistakes[0]?`Test specifically for this failure: ${mistakes[0]}`:'Test a normal case, an edge case and an invalid case.',
      'Explain why the final approach is correct and what it costs.'
    ];
    const section=document.createElement('section');
    section.className='cr-depth';
    section.innerHTML=`<div class="cr-depth-grid"><div class="cr-depth-box"><h3>Deep dive: how the parts connect</h3><ol>${reasoning.map(item=>`<li>${esc(item)}</li>`).join('')}</ol></div><div class="cr-depth-box cr-depth-callout"><h3>Decision checklist</h3><ul><li>What is the required input and output?</li><li>Which constraint changes the best approach?</li><li>What state or data must be tracked?</li><li>What can fail, and how should failure be handled?</li><li>How will you prove the result is correct?</li></ul></div></div><div class="cr-depth-grid"><div class="cr-depth-box"><h3>Debugging scenario</h3><p>Assume your solution works for the example but fails on a larger or unusual input. Reproduce the smallest failing case, inspect the first incorrect value, check each assumption, and add a regression test before changing the code.</p>${mistakes.length?`<p><b>Start by checking:</b> ${esc(mistakes.join(' • '))}</p>`:''}</div><div class="cr-depth-box"><h3>Independent challenge</h3><p>${esc(challenge(course,lesson))}</p><p><b>Extension:</b> improve readability, handle one extra edge case, and describe time or resource cost.</p></div></div><details><summary>Interview practice</summary><ol>${interview(course,lesson).map(item=>`<li>${esc(item)}</li>`).join('')}</ol><textarea aria-label="Interview answer notes" placeholder="Write your answer in your own words..."></textarea></details><details><summary>Real-world connection</summary><p>${esc(industry[0]||course.careerApplications||`${lesson.title} supports practical work in ${course.title}.`)}</p><p>Describe what could go wrong in production and what logging, validation, testing or monitoring would make the system safer.</p></details><div class="cr-depth-box"><h3>Mastery checklist</h3><ul class="cr-depth-check">${checks.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></div>`;
    const footer=card.querySelector('.cr-foot');
    footer?card.insertBefore(section,footer):card.appendChild(section);
  }
  function scan(){addStyles();document.querySelectorAll('.cr-card').forEach(enhance)}
  function start(){scan();new MutationObserver(()=>requestAnimationFrame(scan)).observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',()=>setTimeout(scan,100))}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();