(() => {
  'use strict';

  const TRACKS = [
    ['machine-learning', ['machine learning', 'machine-learning', 'machinelearning', 'ml']],
    ['deep-learning', ['deep learning', 'deep-learning', 'deeplearning']],
    ['generative-ai', ['generative ai', 'generative-ai', 'generativeai', 'genai']],
    ['ai-agents', ['ai agents', 'ai-agents', 'aiagents', 'agents']],
    ['model-deployment', ['model deployment', 'model-deployment', 'modeldeployment']],
    ['system-design', ['system design', 'system-design', 'systemdesign']],
    ['computer-networks', ['computer networks', 'networking', 'networks']],
    ['backend-development', ['backend development', 'backend']],
    ['web-development', ['web development', 'web dev', 'frontend']],
    ['problem-solving', ['problem solving']],
    ['software-engineering', ['software engineering', 'swe fundamentals', 'swe']],
    ['hugging-face', ['hugging face', 'huggingface']],
    ['transformers', ['transformers', 'transformer']],
    ['databases', ['databases', 'database']],
    ['debugging', ['debugging']], ['testing', ['testing']],
    ['docker', ['docker']], ['cloud', ['cloud']],
    ['llms', ['llms', 'large language models', 'llm']],
    ['rag', ['retrieval augmented generation', 'rag']],
    ['apis', ['apis', 'api development', 'rest api']],
    ['linux', ['linux']],
    ['oop', ['object oriented programming', 'oop']],
    ['dsa', ['data structures and algorithms', 'dsa']],
    ['git-github', ['git and github', 'git & github', 'github']],
    ['sql', ['sql']], ['python', ['python']]
  ];

  const clean = value => String(value || '').toLowerCase().replace(/[_/]+/g, ' ').replace(/[^a-z0-9+#& -]+/g, ' ').replace(/\s+/g, ' ').trim();

  function detectTrack() {
    const selectors = ['[data-course-id].active','[data-course].active','[data-track].active','[aria-current="page"]','.course-card.active','.track-card.active','.lesson-sidebar .active','.course-title','main h1','main h2'];
    const values = [location.hash, document.title];
    selectors.forEach(selector => document.querySelectorAll(selector).forEach(node => values.push(node.dataset.courseId, node.dataset.course, node.dataset.track, node.textContent)));
    const candidates = values.filter(Boolean).map(clean);
    for (const [slug, aliases] of TRACKS) {
      if (candidates.some(candidate => aliases.some(alias => candidate.includes(clean(alias))))) return slug;
    }
    return null;
  }

  function routePath(path) {
    if (typeof path !== 'string') return path;
    const normalized = path.replace(/\\/g, '/');
    if (!normalized.startsWith('student-code/practice/')) return path;
    const track = detectTrack();
    if (!track) return path;
    const parts = normalized.split('/');
    if (parts.length >= 4) parts[2] = track;
    return parts.join('/');
  }

  function rewritePayload(value) {
    if (!value || typeof value !== 'object') return value;
    const copy = Array.isArray(value) ? [...value] : { ...value };
    Object.keys(copy).forEach(key => {
      if (['path','filePath','file_path','targetPath','target_path'].includes(key)) copy[key] = routePath(copy[key]);
      else if (copy[key] && typeof copy[key] === 'object') copy[key] = rewritePayload(copy[key]);
    });
    return copy;
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = function courseAwareFetch(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const nextInit = init ? { ...init } : {};
    if (/\/api\/github\/(?:file|sync)(?:[/?#]|$)/i.test(url) && typeof nextInit.body === 'string') {
      try { nextInit.body = JSON.stringify(rewritePayload(JSON.parse(nextInit.body))); } catch (_) {}
    }
    return originalFetch(input, nextInit);
  };

  const THEME_KEY = 'cs-ai-mastery-theme';

  const themeStyles = document.createElement('style');
  themeStyles.textContent = `
    html[data-theme="dark"], html[data-theme="dark"] body { color-scheme:dark; background:#0f1720 !important; color:#edf3f8 !important; }
    html[data-theme="dark"] body,
    html[data-theme="dark"] #app,
    html[data-theme="dark"] main,
    html[data-theme="dark"] aside,
    html[data-theme="dark"] nav,
    html[data-theme="dark"] header,
    html[data-theme="dark"] footer,
    html[data-theme="dark"] section,
    html[data-theme="dark"] article { background-color:#0f1720 !important; color:#edf3f8 !important; }
    html[data-theme="dark"] .theme-force-surface { background-color:#17212c !important; background-image:none !important; color:#edf3f8 !important; border-color:#344352 !important; }
    html[data-theme="dark"] .theme-force-page { background-color:#0f1720 !important; background-image:none !important; color:#edf3f8 !important; }
    html[data-theme="dark"] .theme-force-text { color:#edf3f8 !important; }
    html[data-theme="dark"] .theme-force-muted { color:#c8d3dc !important; }
    html[data-theme="dark"] input,
    html[data-theme="dark"] textarea,
    html[data-theme="dark"] select { background:#111b25 !important; color:#edf3f8 !important; border-color:#455464 !important; }
    html[data-theme="dark"] table,
    html[data-theme="dark"] th,
    html[data-theme="dark"] td { color:#edf3f8 !important; border-color:#344352 !important; }
    html[data-theme="light"], html[data-theme="light"] body { color-scheme:light; }
  `;
  document.head.appendChild(themeStyles);

  function rgbParts(value) {
    const match = String(value || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    return match ? match.slice(1, 4).map(Number) : null;
  }

  function luminance(rgb) {
    if (!rgb) return null;
    return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  }

  function scanThemeTargets() {
    if (!document.body) return;
    const dark = document.documentElement.dataset.theme === 'dark';
    const structural = document.querySelectorAll('body, main, aside, nav, header, footer, section, article, div, form, fieldset');
    structural.forEach(element => {
      element.classList.remove('theme-force-surface', 'theme-force-page');
      if (!dark) return;
      if (element.closest('pre, code, .code-editor, [class*="editor"], [class*="terminal"]')) return;
      const style = getComputedStyle(element);
      const lum = luminance(rgbParts(style.backgroundColor));
      if (lum !== null && lum > 205) {
        const isPageLike = element === document.body || element.matches('main, aside, nav, header, footer') || element.clientWidth > innerWidth * 0.75;
        element.classList.add(isPageLike ? 'theme-force-page' : 'theme-force-surface');
      }
    });

    document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,li,label,strong,small').forEach(element => {
      element.classList.remove('theme-force-text', 'theme-force-muted');
      if (!dark || element.closest('pre, code, .code-editor, [class*="editor"], [class*="terminal"]')) return;
      const style = getComputedStyle(element);
      const lum = luminance(rgbParts(style.color));
      if (lum !== null && lum < 125) element.classList.add('theme-force-text');
      else if (lum !== null && lum < 175) element.classList.add('theme-force-muted');
    });
  }

  let scanTimer;
  function scheduleThemeScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scanThemeTargets, 40);
  }

  function updateThemeButtons(dark) {
    document.querySelectorAll('button, [role="button"]').forEach(button => {
      const text = clean(button.textContent);
      if (text === 'dark' || text === 'light' || text.includes('dark mode') || text.includes('light mode')) {
        button.textContent = dark ? '☀️ Light' : '🌙 Dark';
        button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        button.setAttribute('aria-pressed', String(dark));
      }
    });
  }

  function applyTheme(theme) {
    const dark = theme === 'dark';
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', dark);
    root.classList.toggle('light', !dark);
    if (document.body) {
      document.body.dataset.theme = theme;
      document.body.classList.toggle('dark', dark);
      document.body.classList.toggle('light', !dark);
    }
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem('theme', theme);
    updateThemeButtons(dark);
    scheduleThemeScan();
    setTimeout(scanThemeTargets, 250);
    setTimeout(scanThemeTargets, 1000);
  }

  function currentTheme() {
    return localStorage.getItem(THEME_KEY) || localStorage.getItem('theme') || document.documentElement.dataset.theme || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }

  function isThemeButton(target) {
    const button = target.closest && target.closest('button, [role="button"]');
    if (!button) return null;
    const text = clean(button.textContent);
    const label = clean(button.getAttribute('aria-label'));
    const idClass = clean(`${button.id} ${button.className}`);
    return (text === 'dark' || text === 'light' || text.includes('dark mode') || text.includes('light mode') || label.includes('dark') || label.includes('light mode') || idClass.includes('theme')) ? button : null;
  }

  document.addEventListener('click', event => {
    const button = isThemeButton(event.target);
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  }, true);

  const observer = new MutationObserver(() => {
    if (document.documentElement.dataset.theme === 'dark') scheduleThemeScan();
  });

  function start() {
    applyTheme(localStorage.getItem(THEME_KEY) || localStorage.getItem('theme') || 'light');
    observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.addEventListener('hashchange', () => {
    setTimeout(() => applyTheme(currentTheme()), 60);
  });

  window.CSAIMasteryPracticeFolder = { currentTrack: detectTrack, routePath };
  window.CSAIMasteryTheme = { apply: applyTheme, current: currentTheme };
})();
