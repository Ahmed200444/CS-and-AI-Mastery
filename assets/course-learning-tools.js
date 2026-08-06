(() => {
  'use strict';

  const stateKey = slug => `cs-ai-learning-tools-${slug}`;
  const activeSlug = () => window.CSAIMasteryPracticeFolder?.currentTrack?.() || 'course';

  function lessonItems(track) {
    return [...track.querySelectorAll('.fst-lesson, details')].filter(item => item.querySelector('summary'));
  }

  function lessonTitle(item) {
    const summary = item.querySelector('summary');
    if (!summary) return '';
    const clone = summary.cloneNode(true);
    clone.querySelectorAll('label,input,button').forEach(node => node.remove());
    return clone.textContent.replace(/^\s*\d+\s*/, '').trim();
  }

  function isComplete(item) {
    const box = item.querySelector('input[type="checkbox"]');
    return Boolean(box?.checked);
  }

  function install() {
    const track = document.getElementById('full-study-track');
    if (!track || track.dataset.learningTools === 'true') return;

    const lessons = lessonItems(track);
    if (!lessons.length) return;

    track.dataset.learningTools = 'true';
    const slug = activeSlug();
    const saved = JSON.parse(localStorage.getItem(stateKey(slug)) || '{}');

    const tools = document.createElement('div');
    tools.className = 'clt-tools';
    tools.innerHTML = `
      <div class="clt-search-wrap">
        <label for="clt-search-${slug}">Find a lesson</label>
        <input id="clt-search-${slug}" class="clt-search" type="search" placeholder="Search lesson titles and explanations" autocomplete="off">
      </div>
      <div class="clt-actions">
        <button type="button" class="clt-continue">Continue learning</button>
        <button type="button" class="clt-clear">Clear search</button>
      </div>
      <p class="clt-status" aria-live="polite"></p>`;

    const lessonsContainer = track.querySelector('.fst-lessons') || lessons[0].parentElement;
    lessonsContainer.parentElement.insertBefore(tools, lessonsContainer);

    const search = tools.querySelector('.clt-search');
    const status = tools.querySelector('.clt-status');

    function updateStatus(visible = lessons.length) {
      const complete = lessons.filter(isComplete).length;
      const next = lessons.findIndex(item => !isComplete(item));
      status.textContent = `${complete}/${lessons.length} complete · ${visible} lesson${visible === 1 ? '' : 's'} shown${next >= 0 ? ` · Next: ${lessonTitle(lessons[next])}` : ' · Course lessons complete'}`;
    }

    function filter(value) {
      const query = value.trim().toLowerCase();
      let visible = 0;
      lessons.forEach(item => {
        const match = !query || item.textContent.toLowerCase().includes(query);
        item.hidden = !match;
        if (match) visible += 1;
      });
      localStorage.setItem(stateKey(slug), JSON.stringify({ search: value }));
      updateStatus(visible);
    }

    search.value = saved.search || '';
    search.addEventListener('input', () => filter(search.value));
    tools.querySelector('.clt-clear').addEventListener('click', () => {
      search.value = '';
      filter('');
      search.focus();
    });

    tools.querySelector('.clt-continue').addEventListener('click', () => {
      const next = lessons.find(item => !isComplete(item)) || lessons[0];
      if (!next) return;
      search.value = '';
      filter('');
      next.hidden = false;
      next.open = true;
      next.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const summary = next.querySelector('summary');
      if (summary) {
        summary.setAttribute('tabindex', '-1');
        setTimeout(() => summary.focus({ preventScroll: true }), 450);
      }
    });

    track.addEventListener('change', event => {
      if (event.target.matches('input[type="checkbox"]')) setTimeout(() => updateStatus(lessons.filter(item => !item.hidden).length), 0);
    });

    filter(search.value);
  }

  const style = document.createElement('style');
  style.textContent = `
    .clt-tools{display:grid;grid-template-columns:minmax(240px,1fr) auto;gap:12px 18px;align-items:end;margin:0 0 18px;padding:16px;border:1px solid #d7dee7;border-radius:14px;background:#eef5fa}
    .clt-search-wrap{display:grid;gap:6px}.clt-search-wrap label{font-size:.82rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.clt-search{width:100%;padding:11px 13px;border:1px solid #b9c7d4;border-radius:9px;background:#fff;color:#15202b;font:inherit}.clt-actions{display:flex;gap:8px;flex-wrap:wrap}.clt-actions button{padding:10px 13px;border:0;border-radius:9px;font:inherit;font-weight:800;cursor:pointer}.clt-continue{background:#17649a;color:#fff}.clt-clear{background:#dce7ef;color:#173044}.clt-status{grid-column:1/-1;margin:0;font-size:.9rem;color:#415467}
    html[data-theme="dark"] .clt-tools{background:#17212c!important;border-color:#344352!important;color:#edf3f8!important}html[data-theme="dark"] .clt-search{background:#111b25!important;color:#edf3f8!important;border-color:#455464!important}html[data-theme="dark"] .clt-clear{background:#2d3b49!important;color:#edf3f8!important}html[data-theme="dark"] .clt-status{color:#c8d3dc!important}
    @media(max-width:700px){.clt-tools{grid-template-columns:1fr}.clt-actions{width:100%}.clt-actions button{flex:1}.clt-status{grid-column:1}}
  `;
  document.head.appendChild(style);

  const start = () => {
    install();
    new MutationObserver(() => setTimeout(install, 30)).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', () => setTimeout(install, 120));
  };

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();

(() => {
  'use strict';

  const supported = new Set(['python', 'sql', 'oop', 'web-dev', 'web-development']);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let courseData;

  function courses() {
    if (courseData) return courseData;
    try {
      courseData = JSON.parse(document.getElementById('coursedata')?.textContent || '[]');
    } catch (error) {
      courseData = [];
      console.error('[CS AI Mastery] Native lesson expansion failed to read course data', error);
    }
    return courseData;
  }

  function slug() {
    return window.CSAIMasteryPracticeFolder?.currentTrack?.() || location.hash.replace(/^#/, '');
  }

  function course() {
    const current = slug();
    return courses().find(item => item.linked === current || item.id === current) || null;
  }

  function visibleMain() {
    const registry = window.TRACK_REGISTRY?.[location.hash.replace(/^#/, '')];
    const container = registry && document.getElementById(registry.containerId);
    return container?.querySelector('main,.main') || document.querySelector('main');
  }

  function currentLesson(data, main) {
    const headings = [...main.querySelectorAll('h1,h2,h3')].map(node => node.textContent.trim()).filter(Boolean);
    return (data.lessons || []).find(lesson => headings.some(text => text === lesson.title || text.includes(lesson.title))) || null;
  }

  function list(value) {
    return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
  }

  function addStyle() {
    if (document.getElementById('native-depth-style')) return;
    const style = document.createElement('style');
    style.id = 'native-depth-style';
    style.textContent = `
      .native-depth{margin:24px 0 110px;padding:20px;border:1px solid var(--border,#d7dee7);border-radius:16px;background:var(--panel,#fff);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
      .native-depth h2{margin:0 0 8px}.native-depth h3{margin:0 0 9px;font-size:1.02rem}.native-depth p,.native-depth li{line-height:1.68}.native-depth-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.native-depth-box{padding:15px;border-radius:12px;background:rgba(127,127,127,.08)}.native-depth-box.callout{border-left:4px solid #168a67}.native-depth pre{max-width:100%;overflow:auto;white-space:pre-wrap;padding:14px;border-radius:10px;background:#101827;color:#f5f7fb;font:500 .85rem/1.55 ui-monospace,monospace}.native-depth details{margin-top:12px;padding:13px;border:1px solid var(--border,#d7dee7);border-radius:11px}.native-depth summary{cursor:pointer;font-weight:850}.native-depth textarea{width:100%;min-height:90px;margin-top:10px;padding:10px;box-sizing:border-box;border:1px solid var(--border,#c8d1dc);border-radius:9px;background:transparent;color:inherit;font:inherit}.native-depth-check{list-style:none;padding:0}.native-depth-check li{position:relative;padding:6px 0 6px 26px}.native-depth-check li:before{content:'□';position:absolute;left:0;color:#168a67;font-weight:900}
      html[data-theme="dark"] .native-depth{background:#17212c!important;color:#edf3f8!important;border-color:#344352!important}html[data-theme="dark"] .native-depth-box{background:#111b25!important}html[data-theme="dark"] .native-depth details{border-color:#344352!important}
      @media(max-width:760px){.native-depth{padding:16px}.native-depth-grid{grid-template-columns:1fr}.native-depth p,.native-depth li{font-size:.93rem}}
    `;
    document.head.appendChild(style);
  }

  function enhance() {
    const current = slug();
    if (!supported.has(current)) return;
    const data = course();
    const main = visibleMain();
    if (!data || !main) return;
    const lesson = currentLesson(data, main);
    if (!lesson) return;
    const key = `${data.id}:${lesson.id}`;
    if (main.querySelector(`[data-native-depth="${CSS.escape(key)}"]`)) return;
    main.querySelectorAll('.native-depth').forEach(node => node.remove());

    const concepts = list(lesson.concepts);
    const objectives = list(lesson.objectives);
    const mistakes = list(lesson.commonMistakes || lesson.commonMistake);
    const examples = list(lesson.examples || lesson.example);
    const exercise = (data.exercises || []).find(item => item.lessonId === lesson.id) || (data.exercises || [])[0];
    const quiz = (data.quiz || []).find(item => item.lessonId === lesson.id) || (data.quiz || [])[0];
    const reasoning = [
      objectives[0] || `State exactly what ${lesson.title} should achieve.`,
      concepts[0] ? `Identify where ${concepts[0]} appears in the problem.` : 'Identify the inputs, outputs and constraints.',
      concepts[1] ? `Connect ${concepts[1]} to the first concept.` : 'Break the solution into small steps.',
      mistakes[0] ? `Test for this mistake: ${mistakes[0]}` : 'Test a normal case and an edge case.',
      'Explain why the result is correct and what trade-off it makes.'
    ];
    const interview = [
      `Explain ${lesson.title} in simple words.`,
      `Give a real example where ${concepts[0] || lesson.title} is useful.`,
      `What is the most likely mistake, and how would you debug it?`,
      'How would you improve the first working solution?'
    ];

    const panel = document.createElement('section');
    panel.className = 'native-depth';
    panel.dataset.nativeDepth = key;
    panel.innerHTML = `
      <div><small style="font-weight:900;letter-spacing:.09em;color:#168a67">DEEPER STUDY</small><h2>${esc(lesson.title)}</h2><p>Use this section after the original lesson to strengthen understanding, debugging, and interview readiness.</p></div>
      <div class="native-depth-grid">
        <div class="native-depth-box"><h3>How to reason through it</h3><ol>${reasoning.map(item => `<li>${esc(item)}</li>`).join('')}</ol></div>
        <div class="native-depth-box callout"><h3>Decision checklist</h3><ul><li>What is the exact required result?</li><li>Which constraint matters most?</li><li>What information must be stored?</li><li>What edge case could break the solution?</li><li>How will you verify correctness?</li></ul></div>
      </div>
      <div class="native-depth-grid">
        <div class="native-depth-box"><h3>Worked example</h3><pre>${esc(examples[0] || `Create a small ${lesson.title} example, trace each step, and check the final result.`)}</pre><p>After running it, change one input and predict the result before testing.</p></div>
        <div class="native-depth-box"><h3>Debugging scenario</h3><p>Assume the solution works for the example but fails for an unusual input. Reproduce the smallest failing case, inspect the first incorrect value, verify assumptions one by one, and add a regression test.</p>${mistakes.length ? `<p><b>Check first:</b> ${esc(mistakes.join(' • '))}</p>` : ''}</div>
      </div>
      <div class="native-depth-box" style="margin-top:12px"><h3>Independent challenge</h3><p>${esc(exercise?.prompt || `Build a new example using ${lesson.title}, include one edge case, and explain the result.`)}</p>${exercise?.hint ? `<p><b>Hint:</b> ${esc(exercise.hint)}</p>` : ''}<p><b>Extension:</b> improve readability, handle invalid input, and state the time or resource cost.</p></div>
      <details><summary>Interview practice</summary><ol>${interview.map(item => `<li>${esc(item)}</li>`).join('')}</ol><textarea placeholder="Write your answers in your own words..."></textarea></details>
      ${quiz?.q && Array.isArray(quiz.options) ? `<details><summary>Extra knowledge check</summary><p>${esc(quiz.q)}</p><ul>${quiz.options.map(item => `<li>${esc(item)}</li>`).join('')}</ul><p><b>Answer:</b> option ${Number(quiz.correct) + 1}</p></details>` : ''}
      <div class="native-depth-box" style="margin-top:12px"><h3>Mastery checklist</h3><ul class="native-depth-check"><li>I can explain the lesson without reading it.</li><li>I can build a new example independently.</li><li>I can identify and fix a likely mistake.</li><li>I can solve the challenge without revealing the solution.</li><li>I can answer the interview questions clearly.</li></ul></div>
    `;
    main.appendChild(panel);
  }

  function start() {
    addStyle();
    enhance();
    new MutationObserver(() => requestAnimationFrame(enhance)).observe(document.body, {childList:true, subtree:true});
    window.addEventListener('hashchange', () => setTimeout(enhance, 100));
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();