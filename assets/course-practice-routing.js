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

    document.querySelectorAll('button, [role="button"]').forEach(button => {
      const text = clean(button.textContent);
      if (text === 'dark' || text === 'light' || text.includes('dark mode') || text.includes('light mode')) {
        button.textContent = dark ? '☀️ Light' : '🌙 Dark';
        button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        button.setAttribute('aria-pressed', String(dark));
      }
    });
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

  const themeStyles = document.createElement('style');
  themeStyles.textContent = `
    html[data-theme="dark"] { color-scheme: dark; background:#0d141c !important; }
    html[data-theme="dark"] body,
    html[data-theme="dark"] #app,
    html[data-theme="dark"] #root,
    html[data-theme="dark"] main,
    html[data-theme="dark"] .app,
    html[data-theme="dark"] .page,
    html[data-theme="dark"] .course-page,
    html[data-theme="dark"] .course-shell,
    html[data-theme="dark"] .course-layout,
    html[data-theme="dark"] .content,
    html[data-theme="dark"] .main-content,
    html[data-theme="dark"] .lesson-content {
      background:#0d141c !important;
      color:#edf3f8 !important;
    }

    html[data-theme="dark"] aside,
    html[data-theme="dark"] nav,
    html[data-theme="dark"] header,
    html[data-theme="dark"] footer,
    html[data-theme="dark"] .sidebar,
    html[data-theme="dark"] .course-sidebar,
    html[data-theme="dark"] [class*="sidebar"],
    html[data-theme="dark"] [class*="navigation"] {
      background:#111b25 !important;
      color:#edf3f8 !important;
      border-color:#2d3a47 !important;
    }

    html[data-theme="dark"] section,
    html[data-theme="dark"] article,
    html[data-theme="dark"] .card,
    html[data-theme="dark"] [class*="card"],
    html[data-theme="dark"] [class*="panel"],
    html[data-theme="dark"] [class*="lesson"],
    html[data-theme="dark"] [class*="module"],
    html[data-theme="dark"] [class*="section"],
    html[data-theme="dark"] [class*="progress"] {
      background-color:#17212c !important;
      color:#edf3f8 !important;
      border-color:#344352 !important;
    }

    html[data-theme="dark"] h1,
    html[data-theme="dark"] h2,
    html[data-theme="dark"] h3,
    html[data-theme="dark"] h4,
    html[data-theme="dark"] h5,
    html[data-theme="dark"] h6,
    html[data-theme="dark"] p,
    html[data-theme="dark"] li,
    html[data-theme="dark"] span,
    html[data-theme="dark"] label,
    html[data-theme="dark"] strong,
    html[data-theme="dark"] small,
    html[data-theme="dark"] a {
      color:#edf3f8;
    }

    html[data-theme="dark"] .muted,
    html[data-theme="dark"] [class*="muted"],
    html[data-theme="dark"] [class*="subtitle"],
    html[data-theme="dark"] [class*="description"] {
      color:#b7c3cf !important;
    }

    html[data-theme="dark"] button,
    html[data-theme="dark"] input,
    html[data-theme="dark"] textarea,
    html[data-theme="dark"] select {
      background:#111b25;
      color:#edf3f8;
      border-color:#455464;
    }

    html[data-theme="dark"] pre,
    html[data-theme="dark"] code,
    html[data-theme="dark"] .code-editor,
    html[data-theme="dark"] [class*="code"] {
      background:#0b1118;
      color:#f4f7fa;
      border-color:#344352;
    }

    html[data-theme="dark"] table,
    html[data-theme="dark"] th,
    html[data-theme="dark"] td {
      background:#131d27;
      color:#edf3f8;
      border-color:#344352;
    }

    html[data-theme="dark"] hr { border-color:#2d3a47; }
    html[data-theme="dark"] svg { color:inherit; }
    html[data-theme="light"], html[data-theme="light"] body { color-scheme: light; }
  `;
  document.head.appendChild(themeStyles);

  const savedTheme = localStorage.getItem(THEME_KEY) || localStorage.getItem('theme') || 'light';
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => applyTheme(savedTheme));
  else applyTheme(savedTheme);

  window.CSAIMasteryPracticeFolder = { currentTrack: detectTrack, routePath };
  window.CSAIMasteryTheme = { apply: applyTheme, current: currentTheme };
})();
