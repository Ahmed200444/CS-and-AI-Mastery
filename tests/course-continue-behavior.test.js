const fs=require('fs'), path=require('path'), vm=require('vm');
const root=process.cwd();
const source=fs.readFileSync(path.join(root,'assets/progress-resume.js'),'utf8');
function need(x,msg){if(!x) throw new Error(msg)}
function pageData(file){
  const html=fs.readFileSync(path.join(root,'courses',file),'utf8');
  const mm=html.match(/<script[^>]*id="course-page-meta"[^>]*>([\s\S]*?)<\/script>/);
  need(mm,`${file}: course meta missing`);
  const meta=JSON.parse(mm[1]);
  const ids=[...html.matchAll(/<(?:details|section|article)\b([^>]*\bdata-lesson="[^"]+"[^>]*)>/g)].map((m,i)=>{const a=m[1], dm=a.match(/data-lesson="([^"]+)"/), im=a.match(/id="([^"]+)"/); return {id:dm[1],domId:im?im[1]:dm[1],title:`Lesson ${i+1}`};});
  need(ids.length,`${file}: lessons missing`);
  const hm=html.match(/<section class="hero">[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/);
  const title=(hm?hm[1]:meta.id).replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').trim();
  return {html,meta,ids,title,hasStatus:html.includes('data-progress-status')};
}
function runState(data,progress){
  const store=new Map();
  if(progress) store.set('courses_progress_v1',JSON.stringify(progress));
  const elements=new Map();
  const listeners={};
  const hero={children:[],appendChild(el){this.children.push(el);elements.set(el.id,el);el.parentNode=this},querySelector(sel){return sel==='[data-progress-status]'&&data.hasStatus?status:null}};
  const status={parentNode:hero,insertAdjacentElement(_pos,el){hero.children.push(el);elements.set(el.id,el);el.parentNode=hero}};
  const checkboxes={};
  const rows=data.ids.map((x,i)=>{
    const cb={checked:false}; checkboxes[x.id]=cb;
    return {
      tagName:'DETAILS', id:x.domId, open:false, scrolled:false,
      getAttribute(name){return name==='data-lesson'?x.id:null},
      querySelector(sel){if(sel==='.title') return {textContent:x.title}; if(sel==='[data-complete]') return cb; if(sel==='summary') return null; return null},
      scrollIntoView(){this.scrolled=true},
      closest(){return this}
    };
  });
  const metaNode={textContent:JSON.stringify(data.meta)};
  const head={appendChild(el){if(el.id)elements.set(el.id,el)}};
  const document={
    readyState:'complete', head, body:{},
    getElementById(id){if(id==='course-page-meta')return metaNode;return elements.get(id)||null},
    querySelector(sel){if(sel==='.hero')return hero;if(sel==='.hero h1')return{textContent:data.title};return null},
    querySelectorAll(sel){if(sel==='[data-lesson]')return rows;return[]},
    createElement(tag){return {tagName:tag.toUpperCase(),id:'',className:'',innerHTML:'',textContent:'',parentNode:null,setAttribute(){},appendChild(){},insertAdjacentElement(){}}},
    addEventListener(type,fn){(listeners[type]||(listeners[type]=[])).push(fn)}
  };
  const location={pathname:'/courses/'+data.meta.id+'.html',hash:''};
  const history={replaceState(_a,_b,url){location.hash=String(url).startsWith('#')?String(url):''}};
  const localStorage={getItem(k){return store.has(k)?store.get(k):null},setItem(k,v){store.set(k,String(v))},removeItem(k){store.delete(k)}};
  function MutationObserver(cb){this.cb=cb;this.observe=function(){}}
  function CustomEvent(type,opts){this.type=type;this.detail=opts&&opts.detail}
  const window={addEventListener(){},dispatchEvent(){},location,history};
  const context={window,document,location,history,localStorage,MutationObserver,CustomEvent,console,setTimeout(fn){fn();return 1},clearTimeout(){},encodeURIComponent,decodeURIComponent,JSON,Array,Object,String,Date,Math,RegExp};
  vm.createContext(context); vm.runInContext(source,context,{filename:'progress-resume.js'});
  const box=elements.get('csai-course-continue'); need(box,'course Continue box was not rendered');
  function click(lessonId){
    const anchor={getAttribute(name){return name==='data-csai-course-continue'?lessonId:null}};
    const target={closest(sel){if(sel==='[data-csai-course-continue]')return anchor;return null}};
    let prevented=false;
    for(const fn of listeners.click||[]) fn({target,preventDefault(){prevented=true}});
    return prevented;
  }
  return {box,rows,location,click,store};
}
const files=fs.readdirSync(path.join(root,'courses')).filter(f=>f.endsWith('.html')).sort();
need(files.length===62,`expected 62 pages, got ${files.length}`);
let fresh=0,partial=0,complete=0;
for(const file of files){
  const d=pageData(file); const cid=d.meta.id;
  // Pass 1: never started.
  let r=runState(d,{});
  need(r.box.innerHTML.includes('Start → Lesson 1:'),`${file}: fresh state is not Start Lesson 1`);
  need(r.box.innerHTML.includes(`data-csai-course-continue="${d.ids[0].id}"`),`${file}: fresh target is not first lesson`);
  need(r.click(d.ids[0].id),`${file}: Start click did not intercept navigation`);
  need(r.rows[0].open&&r.rows[0].scrolled,`${file}: Start click did not open/scroll Lesson 1`); fresh++;
  // Pass 2: in progress (where a second lesson exists).
  if(d.ids.length>1){
    const p={[cid]:{lessons:{[d.ids[0].id]:true}}}; r=runState(d,p);
    need(r.box.innerHTML.includes('Continue → Lesson 2:'),`${file}: partial state is not Continue Lesson 2`);
    need(r.box.innerHTML.includes(`data-csai-course-continue="${d.ids[1].id}"`),`${file}: partial target is not second lesson`);
    r.click(d.ids[1].id); need(r.rows[1].open&&r.rows[1].scrolled,`${file}: Continue did not open/scroll Lesson 2`); partial++;
  }
  // Pass 3: complete.
  const lessons={}; for(const x of d.ids) lessons[x.id]=true;
  r=runState(d,{[cid]:{lessons}});
  need(r.box.innerHTML.includes('Course complete'),`${file}: complete state missing Course complete`);
  need(!r.box.innerHTML.includes('data-csai-course-continue='),`${file}: complete course still has misleading Continue target`); complete++;
}
// Exact user scenario: Python 7 completed -> Continue Lesson 8.
{
  const d=pageData('python.html'), lessons={}; d.ids.slice(0,7).forEach(x=>lessons[x.id]=true);
  const r=runState(d,{python:{lessons}});
  need(r.box.innerHTML.includes('Continue → Lesson 8:'),'python: 7 completed did not produce Continue Lesson 8');
  need(r.box.innerHTML.includes(`data-csai-course-continue="${d.ids[7].id}"`),'python: Continue target is not lesson 8');
  r.click(d.ids[7].id); need(r.rows[7].open&&r.rows[7].scrolled,'python: Lesson 8 click did not open/scroll exact lesson');
}
console.log(`Course Continue behavior passed: ${fresh} fresh/start states, ${partial} in-progress states, ${complete} complete states, plus Python 7→8 exact scenario.`);
