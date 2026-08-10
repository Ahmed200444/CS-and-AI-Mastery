(function(){
  'use strict';

  var observer = null;
  var scheduled = false;

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>\"]/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];
    });
  }

  function text(el){ return el ? String(el.textContent || '').replace(/\s+/g,' ').trim() : ''; }
  function norm(s){ return String(s || '').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,''); }
  function slug(s){ return String(s || '').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }

  function getCourses(){
    try{
      var el = document.getElementById('coursedata');
      return el ? JSON.parse(el.textContent || '[]') : [];
    }catch(e){ return []; }
  }

  function courseLookup(){
    var courses = getCourses(), byId = {}, byNorm = {}, byTitle = {};
    courses.forEach(function(c){
      if(!c || !c.id) return;
      byId[c.id] = c;
      byNorm[norm(c.id)] = c;
      byTitle[norm(c.title)] = c;
      byTitle[norm(slug(c.title))] = c;
    });
    return { courses:courses, byId:byId, byNorm:byNorm, byTitle:byTitle };
  }

  function findCourse(ref, lookup){
    var key = String(ref || '').trim();
    if(!key) return null;
    return lookup.byId[key] || lookup.byNorm[norm(key)] || lookup.byTitle[norm(key)] || null;
  }

  function addKicker(track, label){
    var hero = track.querySelector('.cx-hero, .hero');
    if(!hero || hero.querySelector('.ul-path-kicker')) return;
    var heading = hero.querySelector('h1,h2');
    if(!heading) return;
    var kicker = document.createElement('div');
    kicker.className = 'ul-path-kicker';
    kicker.textContent = label || 'Learning path';
    heading.parentNode.insertBefore(kicker, heading);
  }

  function parseFraction(s){
    var m = String(s || '').match(/(\d+)\s+(?:of|\/)\s+(\d+)/i);
    return m ? {done:Number(m[1]), total:Number(m[2])} : null;
  }

  function stat(label, value){ return { label:label, value:String(value == null ? '—' : value) }; }

  function addStats(track, kind){
    if(track.querySelector('.ul-path-stats')) return;
    var hero = track.querySelector('.cx-hero, .hero');
    if(!hero) return;

    var stats = [];
    if(kind === 'ai'){
      var summary = text(track.querySelector('.ai-path-summary'));
      var f = parseFraction(summary);
      var phases = track.querySelectorAll('.ai-path-phase').length;
      var cards = track.querySelectorAll('.ai-path-course-card').length;
      var checkpoints = (summary.match(/(\d+)\s+project checkpoint/i)||[])[1];
      stats = [
        stat('Progress', f ? (f.done + ' of ' + f.total) : 'Not started'),
        stat('Phases', phases || 6),
        stat('Courses', cards || (f && f.total) || '—'),
        stat('Project checkpoints', checkpoints || 5)
      ];
    }else if(kind === 'ce'){
      var allCards = Array.prototype.slice.call(track.querySelectorAll('.cx-card'));
      var planned = allCards.filter(function(c){ return !!c.querySelector('.cx-flag-soon,[disabled][aria-disabled="true"]'); }).length;
      var available = Math.max(0, allCards.length - planned - 1);
      var sum = allCards.length ? text(allCards[0]) : '';
      var cf = parseFraction(sum);
      stats = [
        stat('Progress', cf ? (cf.done + ' of ' + cf.total) : 'Not started'),
        stat('Available now', available || (cf && cf.total) || '—'),
        stat('Future stages', planned),
        stat('Status', planned ? 'Growing path' : 'All stages available')
      ];
    }else if(kind === 'fs'){
      var stageSelectors = '.fs-stage,.path-stage,.roadmap-stage,.cx-card,.card';
      var stages = track.querySelectorAll(stageSelectors).length;
      var done = Array.prototype.filter.call(track.querySelectorAll(stageSelectors),function(el){
        return /complete|completed|✓/i.test(text(el));
      }).length;
      stats = [
        stat('Progress', stages ? (done + ' of ' + stages) : 'Not started'),
        stat('Stages', stages || 'Guided'),
        stat('Sequence', 'Beginner → deploy'),
        stat('Capstone', 'Built along the way')
      ];
    }else{
      var pathCards = track.querySelectorAll('.cp-card,.cx-card,.card').length;
      stats = [
        stat('Paths', pathCards || 'Role-based'),
        stat('Focus', 'Career readiness'),
        stat('Courses', 'Existing catalog'),
        stat('Progress', 'Saved locally')
      ];
    }

    var wrap = document.createElement('div');
    wrap.className = 'ul-path-stats';
    wrap.setAttribute('aria-label','Path summary');
    wrap.innerHTML = stats.map(function(s){
      return '<div class="ul-path-stat"><strong>'+esc(s.value)+'</strong><span>'+esc(s.label)+'</span></div>';
    }).join('');
    hero.insertAdjacentElement('afterend', wrap);
  }

  function repairMissingAI(track, lookup){
    Array.prototype.forEach.call(track.querySelectorAll('.ai-path-course-card'),function(card){
      var raw = text(card);
      var m = raw.match(/Missing course reference:\s*([^\s]+)/i);
      if(!m || card.getAttribute('data-ul-repaired')) return;
      var requested = m[1], c = findCourse(requested, lookup);
      card.setAttribute('data-ul-repaired','1');
      if(c){
        var desc = c.description || c.blurb || 'This course is available in the catalog.';
        card.innerHTML = '<div class="ai-path-course-row"><div class="ai-path-step">✓</div><div class="ai-path-course-main">'
          + '<div class="ai-path-course-head"><h3>'+esc(c.title)+'</h3><span class="ai-path-priority">Available</span></div>'
          + '<p class="ai-path-reason">'+esc(desc)+'</p>'
          + '<div class="ai-path-actions"><button type="button" class="wd-btn" data-act="aiPathResumeCourse(\''+esc(c.id)+'\',\'\')">Open '+esc(c.title)+'</button></div>'
          + '</div></div>';
      }else{
        card.classList.add('ul-path-warning');
        card.innerHTML = '<div class="ul-path-warning-title">Path item needs a catalog match</div>'
          + '<div class="ul-path-warning-sub">The saved path refers to <code>'+esc(requested)+'</code>, but that course is not currently in the 54-course catalog. No raw reference is used as a fake course.</div>';
      }
    });
  }

  function repairCEPlanned(track, lookup){
    Array.prototype.forEach.call(track.querySelectorAll('.cx-card'),function(card){
      var badge = card.querySelector('.cx-flag-soon');
      var disabled = card.querySelector('button[disabled][aria-disabled="true"]');
      if(!badge && !disabled) return;
      var heading = card.querySelector('h3,h2');
      var title = text(heading).replace(/\bPlanned\b/ig,'').trim();
      var c = findCourse(title, lookup);
      if(c){
        if(badge){ badge.textContent = 'Available'; badge.classList.remove('cx-flag-soon'); }
        if(disabled){
          disabled.disabled = false;
          disabled.removeAttribute('aria-disabled');
          disabled.removeAttribute('title');
          disabled.className = 'wd-btn';
          disabled.textContent = 'Open ' + c.title;
          disabled.setAttribute('data-act', "cePathOpenCourse('"+c.id.replace(/'/g,"\\'")+"')");
        }
        card.style.opacity = '';
        card.style.borderStyle = '';
      }else if(disabled){
        if(text(disabled) !== 'Planned — not available yet') disabled.textContent = 'Planned — not available yet';
        if(disabled.getAttribute('title') !== 'This stage is planned and has no course content yet.') disabled.setAttribute('title','This stage is planned and has no course content yet.');
      }
    });

    var notice = track.querySelector('#cePlannedNotice');
    if(notice){
      var p = notice.nextElementSibling;
      if(p && /planned/i.test(text(p))){
        var remaining = track.querySelectorAll('.cx-flag-soon,button[disabled][aria-disabled="true"]').length;
        var msg = remaining
          ? 'These future stages are shown only because no matching course exists in the current catalog yet.'
          : 'Every stage in this path is now available in the course catalog.';
        if(text(p) !== msg) p.textContent = msg;
      }
    }
  }

  function polishHub(){
    Array.prototype.forEach.call(document.querySelectorAll('.hub-courses-banner'),function(btn){
      var title = text(btn.querySelector('.hcb-title'));
      var sub = btn.querySelector('.hcb-sub');
      if(!sub) return;
      var next = '';
      if(/Computer Engineering/i.test(title)){
        next = 'A structured systems path using the courses available now, with future stages separated clearly until real course content exists.';
      }else if(/AI Engineer/i.test(title)){
        next = 'A guided route from engineering foundations through modern AI, deployment, and advanced systems — with progress preserved.';
      }else if(/Full-Stack/i.test(title)){
        next = 'One guided sequence from front-end foundations through backend and deployment, with hands-on practice at every stage.';
      }
      if(next && text(sub) !== next) sub.textContent = next;
    });
  }

  function polishEditors(root){
    Array.prototype.forEach.call((root || document).querySelectorAll('.editor-shell'),function(shell){
      shell.classList.add('ul-editor-shell');
    });
  }

  function enhancePath(track, kind, lookup){
    if(!track) return;
    track.classList.add('ul-learning-path','ul-learning-path-'+kind);
    addKicker(track, kind === 'ai' ? 'AI engineering roadmap' : kind === 'ce' ? 'Computer engineering roadmap' : kind === 'fs' ? 'Developer roadmap' : 'Career paths');
    addStats(track, kind);
    if(kind === 'ai') repairMissingAI(track, lookup);
    if(kind === 'ce') repairCEPlanned(track, lookup);
    polishEditors(track);
  }

  function run(){
    scheduled = false;
    document.documentElement.classList.add('csai-unified-design');
    var lookup = courseLookup();
    polishHub();
    polishEditors(document);
    enhancePath(document.getElementById('aiPathTrack'),'ai',lookup);
    enhancePath(document.getElementById('cePathTrack'),'ce',lookup);
    enhancePath(document.getElementById('fsPathTrack'),'fs',lookup);
    enhancePath(document.getElementById('companyPathsTrack'),'company',lookup);
  }

  function schedule(){
    if(scheduled) return;
    scheduled = true;
    setTimeout(run, 0);
  }

  function boot(){
    run();
    observer = new MutationObserver(schedule);
    observer.observe(document.body,{subtree:true,childList:true});
    window.addEventListener('hashchange',function(){ setTimeout(schedule,30); });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
