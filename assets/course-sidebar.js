(function(){
'use strict';
// Left "Course contents" navigation for static course pages: a fixed-width column on desktop, a
// collapsed disclosure on mobile. It only reads the lessons already on the page.
var PROGRESS='courses_progress_v1';
function read(){try{return JSON.parse(localStorage.getItem(PROGRESS)||'{}')||{}}catch(e){return{}}}
function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
function esc(v){return String(v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
var CSS='main.wrap.csai-has-nav{max-width:1360px;display:grid;grid-template-columns:292px minmax(0,1fr);column-gap:28px;align-items:start}'+
'.csai-cm{min-width:0;grid-column:2}'+
'.csai-cn{grid-column:1;grid-row:1;position:sticky;top:14px;max-height:calc(100vh - 28px);overflow:auto;margin-top:8px;border:1px solid var(--border);border-radius:15px;background:var(--panel);color:var(--text)}'+
'.csai-cn summary{list-style:none;cursor:default;pointer-events:none;padding:16px 16px 6px}.csai-cn summary::-webkit-details-marker{display:none}'+
'.csai-cn-title{display:block;font-weight:850;font-size:1rem;line-height:1.3}.csai-cn-kicker{display:block;font-size:.68rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:3px}'+
'.csai-cn-prog{padding:0 16px 10px}.csai-cn-bar{height:6px;border-radius:99px;background:var(--border);overflow:hidden;margin:8px 0 4px}.csai-cn-bar i{display:block;height:100%;background:#16805b;border-radius:99px}.csai-cn-count{font-size:.76rem;color:var(--muted)}'+
'.csai-cn ol{list-style:none;margin:0;padding:4px 8px 12px}.csai-cn li{margin:0}'+
'.csai-cn a{display:flex;gap:9px;align-items:flex-start;padding:8px 9px;border-radius:10px;color:var(--text);text-decoration:none;font-size:.86rem;line-height:1.35;border-left:3px solid transparent}'+
'.csai-cn a:hover{background:var(--pill)}.csai-cn a.active{background:var(--pill);border-left-color:var(--accent);font-weight:800}'+
'.csai-cn a .n{flex:0 0 auto;min-width:24px;text-align:center;font-size:.72rem;font-weight:800;border-radius:7px;background:var(--pill);color:var(--pilltext);padding:2px 4px}'+
'.csai-cn a.done .n{background:#16805b;color:#fff}.csai-cn a .t{min-width:0;overflow-wrap:anywhere}'+
'@media(max-width:1023px){main.wrap.csai-has-nav{display:block}.csai-cm{display:block}.csai-cn{position:static;max-height:none;margin:8px 0 12px}.csai-cn summary{cursor:pointer;pointer-events:auto;padding:13px 16px}.csai-cn summary:after{content:"Show";float:right;font-size:.78rem;font-weight:800;color:var(--accent)}.csai-cn[open] summary:after{content:"Hide"}.csai-cn-prog{display:none}.csai-cn[open] .csai-cn-prog{display:block}.csai-cn ol{max-height:55vh;overflow:auto}}';
function build(){
  var main=document.querySelector('main.wrap');if(!main||main.classList.contains('csai-has-nav'))return;
  var rows=[].slice.call(document.querySelectorAll('details.lesson[data-lesson]'));if(rows.length<2)return;
  var meta={};try{meta=JSON.parse((document.getElementById('course-page-meta')||{}).textContent||'{}')||{}}catch(e){}
  var h1=document.querySelector('.hero h1'),title=clean(h1?h1.textContent:document.title);
  var st=document.createElement('style');st.id='csai-course-nav-style';st.textContent=CSS;document.head.appendChild(st);
  var cm=document.createElement('div');cm.className='csai-cm';
  while(main.firstChild)cm.appendChild(main.firstChild);
  var nav=document.createElement('details');nav.className='csai-cn';nav.setAttribute('aria-label','Course contents');
  var items=rows.map(function(el,i){var t=el.querySelector('.title'),n=el.querySelector('.num');return{el:el,id:el.getAttribute('data-lesson'),anchor:el.id||('lesson-'+el.getAttribute('data-lesson')),n:clean(n?n.textContent:String(i+1)),t:clean(t?t.textContent:'Lesson '+(i+1))};});
  nav.innerHTML='<summary><span class="csai-cn-kicker">Course contents</span><span class="csai-cn-title">'+esc(title)+'</span></summary><div class="csai-cn-prog"><div class="csai-cn-bar"><i></i></div><div class="csai-cn-count"></div></div><ol>'+items.map(function(x){return'<li><a href="#'+esc(x.anchor)+'" data-cn="'+esc(x.id)+'"><span class="n">'+esc(x.n)+'</span><span class="t">'+esc(x.t)+'</span></a></li>';}).join('')+'</ol>';
  main.classList.add('csai-has-nav');main.appendChild(nav);main.appendChild(cm);
  var mq=window.matchMedia('(min-width:1024px)');
  function sync(){nav.open=mq.matches;}sync();if(mq.addEventListener)mq.addEventListener('change',sync);else if(mq.addListener)mq.addListener(sync);
  function progress(){var done=((read()[meta.id]||{}).lessons)||{},n=0;items.forEach(function(x){var a=nav.querySelector('[data-cn="'+x.id.replace(/"/g,'')+'"]');var d=done[x.id]===true;if(a){a.classList.toggle('done',d);}if(d)n++;});
    nav.querySelector('.csai-cn-bar i').style.width=Math.round(n/items.length*100)+'%';nav.querySelector('.csai-cn-count').textContent=n+' of '+items.length+' lessons complete';}
  progress();document.addEventListener('change',function(e){if(e.target&&e.target.matches&&e.target.matches('[data-complete]'))setTimeout(progress,60);});window.addEventListener('storage',progress);
  nav.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-cn]');if(!a)return;e.preventDefault();var it=items.filter(function(x){return x.id===a.getAttribute('data-cn');})[0];if(!it)return;it.el.open=true;it.el.scrollIntoView({block:'start',behavior:'smooth'});try{history.replaceState(null,'','#'+it.anchor)}catch(_){}if(!mq.matches)nav.open=false;});
  if('IntersectionObserver' in window){var visible={};var io=new IntersectionObserver(function(es){es.forEach(function(en){visible[en.target.getAttribute('data-lesson')]=en.isIntersecting;});var first=items.filter(function(x){return visible[x.id];})[0];if(first){[].forEach.call(nav.querySelectorAll('a.active'),function(a){a.classList.remove('active');});var a=nav.querySelector('[data-cn="'+first.id.replace(/"/g,'')+'"]');if(a){a.classList.add('active');if(mq.matches){var r=a.getBoundingClientRect(),c=nav.getBoundingClientRect();if(r.top<c.top+70||r.bottom>c.bottom-10)a.scrollIntoView({block:'nearest'});}}}},{rootMargin:'-10% 0px -70% 0px'});items.forEach(function(x){io.observe(x.el);});}
}
function boot(){build();setTimeout(build,800);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
