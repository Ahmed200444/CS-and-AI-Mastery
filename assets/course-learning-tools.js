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