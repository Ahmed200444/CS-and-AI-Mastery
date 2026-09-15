(function(){
'use strict';

var PRIMARY_TRACKS={
  hub:'dashboard',
  coursesTrack:'courses',
  aiPathTrack:'ai',
  cePathTrack:'ce',
  fsPathTrack:'fs',
  companyPathsTrack:'career'
};
var observer=null;

function visible(el){
  if(!el) return false;
  var s=window.getComputedStyle ? getComputedStyle(el) : null;
  return (!s || s.display!=='none') && !el.hidden;
}
function esc(s){return String(s==null?'':s).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}
function action(route){
  try{ if(typeof window.showTrack==='function'){ window.showTrack(route); return true; } }catch(e){}
  return false;
}
function go(key){
  if(key==='dashboard') action('hub');
  else if(key==='courses') action('courses');
  else if(key==='ai') action('aipath');
  else if(key==='ce') action('cepath');
  else if(key==='fs') action('fspath');
  else if(key==='career'){
    action('hub');
    setTimeout(function(){
      var sec=document.querySelector('#hub .hub-career-section');
      if(sec) sec.scrollIntoView({behavior:'smooth',block:'start'});
    },60);
  }
  setTimeout(syncShell,80);
}

function ensureNav(){
  if(!document.getElementById('hub') || document.querySelector('.ulv2-product-nav')) return;
  var nav=document.createElement('aside');
  nav.className='ulv2-product-nav';
  nav.setAttribute('aria-label','Primary navigation');
  nav.innerHTML=''
    +'<div class="ulv2-brand"><div class="ulv2-brand-mark">⌘</div><div>CS &amp; AI<br>Mastery</div></div>'
    +'<nav class="ulv2-nav-list">'
      +'<button class="ulv2-nav-btn" data-ulv2-nav="dashboard"><span class="ulv2-nav-ico">⌂</span>Dashboard</button>'
      +'<button class="ulv2-nav-btn" data-ulv2-nav="courses"><span class="ulv2-nav-ico">▦</span>All Courses</button>'
      +'<button class="ulv2-nav-btn" data-ulv2-nav="ai"><span class="ulv2-nav-ico">🤖</span>AI Engineer Path</button>'
      +'<button class="ulv2-nav-btn" data-ulv2-nav="ce"><span class="ulv2-nav-ico">🖥️</span>Computer Engineer Path</button>'
      +'<button class="ulv2-nav-btn" data-ulv2-nav="fs"><span class="ulv2-nav-ico">🗺️</span>Full-Stack Path</button>'
      +'<button class="ulv2-nav-btn" data-ulv2-nav="career"><span class="ulv2-nav-ico">🎯</span>Career Prep</button>'
    +'</nav>'
    +'<div class="ulv2-nav-foot"><b style="color:var(--ulv2-ink)">Learning-first workspace</b><br>Courses, paths, practice, projects and progress in one product shell.</div>';
  document.body.appendChild(nav);
  Array.prototype.forEach.call(nav.querySelectorAll('[data-ulv2-nav]'),function(btn){
    btn.addEventListener('click',function(){go(btn.getAttribute('data-ulv2-nav'));});
  });
  document.body.classList.add('ulv2-product-shell');
}

function getCourseCount(){
  var h=document.querySelector('#coursesTrack .cx-cat-h1');
  var m=h && h.textContent.match(/(\d+)/);
  if(m) return Number(m[1]);
  var t=document.querySelector('#hub [data-platform-course-count]');
  if(t){ var n=Number(t.getAttribute('data-platform-course-count')); if(n) return n; }
  return 57;
}

function redesignHome(){
  var hub=document.getElementById('hub');
  if(!hub) return;
  var wrap=hub.querySelector('.hub-wrap');
  if(!wrap) return;

  if(!wrap.querySelector('.ulv2-dashboard-hero')){
    var eyebrow=wrap.querySelector('.hub-eyebrow');
    var h1=wrap.querySelector('.hub-h1');
    var lead=wrap.querySelector('.hub-lead');
    if(eyebrow&&h1&&lead){
      var hero=document.createElement('section');
      hero.className='ulv2-dashboard-hero';
      wrap.insertBefore(hero,wrap.firstChild);
      hero.appendChild(eyebrow); hero.appendChild(h1); hero.appendChild(lead);
      var tools=hero.nextElementSibling;
      if(tools && tools.querySelector && tools.querySelector('.gs-trigger')){
        tools.classList.add('ulv2-hero-tools');
        hero.appendChild(tools);
      }
      eyebrow.textContent='CS & AI Mastery';
      h1.innerHTML='Learn deeply. Practice it.<br><span class="hub-h1-sub">Build work worth showing.</span>';
      lead.textContent='Move from foundations to software engineering, computer systems and modern AI with real code runners, adaptive practice, guided paths, portfolio projects and saved progress.';
    }
  }

  if(!wrap.querySelector('.ulv2-stat-grid')){
    var heroNow=wrap.querySelector('.ulv2-dashboard-hero');
    if(heroNow){
      var stats=document.createElement('div');
      stats.className='ulv2-stat-grid';
      stats.innerHTML=''
        +'<div class="ulv2-stat"><strong>'+getCourseCount()+'</strong><span>Courses across CS, engineering & AI</span></div>'
        +'<div class="ulv2-stat"><strong>Python + C++</strong><span>Side-by-side practice where useful</span></div>'
        +'<div class="ulv2-stat"><strong>Adaptive practice</strong><span>Examples scale with lesson concepts</span></div>'
        +'<div class="ulv2-stat"><strong>Portfolio projects</strong><span>README + GitHub publishing workflow</span></div>';
      heroNow.insertAdjacentElement('afterend',stats);
    }
  }

  if(!wrap.querySelector('.ulv2-path-section')){
    var banners=Array.prototype.slice.call(wrap.querySelectorAll('.hub-courses-banner'));
    var selected=banners.filter(function(b){
      var title=b.querySelector('.hcb-title');
      var s=title?title.textContent:'';
      return /Explore all courses|AI Engineer Path|Computer Engineering|Full-Stack Developer Path/i.test(s);
    });
    if(selected.length){
      var section=document.createElement('section');
      section.className='ulv2-section ulv2-path-section';
      section.innerHTML='<div class="ulv2-section-head"><div><h2>Choose your learning path</h2><p>Use a guided route, or browse the entire catalog whenever you want.</p></div></div><div class="ulv2-path-grid"></div>';
      var statsNode=wrap.querySelector('.ulv2-stat-grid');
      if(statsNode) statsNode.insertAdjacentElement('afterend',section); else wrap.insertBefore(section,wrap.firstChild);
      var grid=section.querySelector('.ulv2-path-grid');
      selected.forEach(function(b){grid.appendChild(b);});
    }
  }
}

function decorateCatalog(){
  var track=document.getElementById('coursesTrack');
  if(!track) return;
  var view=track.querySelector('#cxView')||track;
  var head=view.querySelector('.cx-cat-head');
  if(head){
    var eye=head.querySelector('.cx-cat-eyebrow');
    if(eye) eye.textContent='Course Catalog';
    var title=head.querySelector('.cx-cat-h1');
    if(title && !/\d+/.test(title.textContent)) title.textContent='All '+getCourseCount()+' courses';
  }
  var grid=view.querySelector('.cx-grid');
  if(!grid) return;
  var cards=Array.prototype.slice.call(grid.children).filter(function(x){return x.classList&&x.classList.contains('cx-card');});
  cards.forEach(function(card,i){
    card.setAttribute('data-ulv2-index',String(i+1).padStart(2,'0'));
    if(!card.classList.contains('cx-card-soon')&&!card.querySelector('.ulv2-open-hint')){
      var hint=document.createElement('div');
      hint.className='ulv2-open-hint';
      hint.innerHTML='<span>Open course</span><span>→</span>';
      card.appendChild(hint);
    }
  });
}

function activeKey(){
  var found='';
  Object.keys(PRIMARY_TRACKS).some(function(id){
    var el=document.getElementById(id);
    if(visible(el)){found=PRIMARY_TRACKS[id];return true;}
    return false;
  });
  return found;
}
function syncShell(){
  ensureNav();
  redesignHome();
  decorateCatalog();
  var key=activeKey();
  var isPrimary=!!key;
  document.body.classList.toggle('ulv2-course-focus',!isPrimary);
  Array.prototype.forEach.call(document.querySelectorAll('.ulv2-nav-btn'),function(btn){
    btn.classList.toggle('is-active',btn.getAttribute('data-ulv2-nav')===key);
  });
}

function boot(){
  document.documentElement.classList.add('ulv2-product-redesign');
  syncShell();
  var targets=['hub','coursesTrack','aiPathTrack','cePathTrack','fsPathTrack','companyPathsTrack'];
  observer=new MutationObserver(function(){setTimeout(syncShell,0);});
  targets.forEach(function(id){var el=document.getElementById(id);if(el) observer.observe(el,{attributes:true,attributeFilter:['style','class'],childList:true,subtree:id==='coursesTrack'});});
  window.addEventListener('hashchange',function(){setTimeout(syncShell,40);});
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
