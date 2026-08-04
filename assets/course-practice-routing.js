(() => {
  'use strict';

  const TRACKS = [
    ['machine-learning', ['machine learning', 'machine-learning', 'machinelearning', 'ml']],
    ['deep-learning', ['deep learning', 'deep-learning', 'deeplearning']],
    ['generative-ai', ['generative ai', 'generative-ai', 'generativeai', 'genai']],
    ['ai-agents', ['ai agents', 'ai-agents', 'aiagents', 'agents']],
    ['model-deployment', ['model deployment', 'model-deployment', 'modeldeployment']],
    ['system-design', ['system design', 'system-design', 'systemdesign']],
    ['computer-networks', ['computer networks', 'computer-networks', 'networking', 'networks']],
    ['backend-development', ['backend development', 'backend-development', 'backenddevelopment', 'backend']],
    ['web-development', ['web development', 'web-development', 'webdevelopment', 'web dev', 'frontend']],
    ['problem-solving', ['problem solving', 'problem-solving', 'problemsolving']],
    ['software-engineering', ['software engineering', 'software-engineering', 'swe fundamentals', 'swe']],
    ['hugging-face', ['hugging face', 'hugging-face', 'huggingface']],
    ['transformers', ['transformers', 'transformer']],
    ['databases', ['databases', 'database']],
    ['debugging', ['debugging']],
    ['testing', ['testing']],
    ['docker', ['docker']],
    ['cloud', ['cloud']],
    ['llms', ['llms', 'large language models', 'large-language-models', 'llm']],
    ['rag', ['retrieval augmented generation', 'retrieval-augmented-generation', 'rag']],
    ['apis', ['apis', 'api development', 'rest api', 'rest-api']],
    ['linux', ['linux']],
    ['oop', ['object oriented programming', 'object-oriented-programming', 'oop']],
    ['dsa', ['data structures and algorithms', 'data-structures-and-algorithms', 'dsa']],
    ['git-github', ['git and github', 'git & github', 'git-github', 'github']],
    ['sql', ['sql']],
    ['python', ['python']]
  ];

  const clean = value => String(value || '')
    .toLowerCase()
    .replace(/[_/]+/g, ' ')
    .replace(/[^a-z0-9+#& -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  function activeCourseText() {
    const selectors = [
      '[data-course-id].active',
      '[data-course].active',
      '[data-track].active',
      '[aria-current="page"]',
      '.course-card.active',
      '.track-card.active',
      '.lesson-sidebar .active',
      '.course-title',
      'main h1',
      'main h2'
    ];

    const values = [location.hash, document.title];
    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach(node => {
        values.push(
          node.getAttribute('data-course-id'),
          node.getAttribute('data-course'),
          node.getAttribute('data-track'),
          node.textContent
        );
      });
    }
    return values.filter(Boolean).map(clean);
  }

  function detectTrack() {
    const candidates = activeCourseText();
    for (const [slug, aliases] of TRACKS) {
      if (candidates.some(candidate => aliases.some(alias => candidate.includes(clean(alias))))) {
        return slug;
      }
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
    if (parts.length < 4) return path;
    parts[2] = track;
    return parts.join('/');
  }

  function rewritePayload(value) {
    if (!value || typeof value !== 'object') return value;
    const copy = Array.isArray(value) ? [...value] : { ...value };
    for (const key of Object.keys(copy)) {
      if (['path', 'filePath', 'file_path', 'targetPath', 'target_path'].includes(key)) {
        copy[key] = routePath(copy[key]);
      } else if (copy[key] && typeof copy[key] === 'object') {
        copy[key] = rewritePayload(copy[key]);
      }
    }
    return copy;
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = function courseAwareFetch(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const nextInit = init ? { ...init } : {};

    if (/\/api\/github\/(?:file|sync)(?:[/?#]|$)/i.test(url) && typeof nextInit.body === 'string') {
      try {
        const parsed = JSON.parse(nextInit.body);
        nextInit.body = JSON.stringify(rewritePayload(parsed));
      } catch (_) {
        // Keep the original request when its body is not JSON.
      }
    }
    return originalFetch(input, nextInit);
  };

  window.CSAIMasteryPracticeFolder = {
    currentTrack: detectTrack,
    routePath
  };
})();
