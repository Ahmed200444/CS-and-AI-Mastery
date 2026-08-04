(() => {
  'use strict';

  const PROJECTS = {
    python: ['Automation & Data Toolkit', 'Build a reusable Python toolkit that processes files, validates inputs, logs failures, and includes tests.'],
    sql: ['E-commerce Analytics', 'Design analytical SQL queries using joins, CTEs, window functions, and clear business metrics.'],
    git: ['Collaborative Release Workflow', 'Practice branches, pull requests, conflict resolution, tags, and release notes in a realistic workflow.'],
    dsa: ['Algorithm Toolkit', 'Implement and explain reusable solutions for arrays, strings, hashing, stacks, queues, trees, graphs, and common patterns.'],
    oop: ['Extensible Management System', 'Build a maintainable application using composition, interfaces, inheritance only where appropriate, and tests.'],
    linux: ['Server Automation Toolkit', 'Create shell scripts for setup, permissions, processes, logs, SSH tasks, and environment checks.'],
    debugging: ['Bug Investigation Lab', 'Reproduce, isolate, fix, and regression-test a collection of realistic software defects.'],
    testing: ['Tested Python Service', 'Create unit and integration tests, fixtures, edge cases, mocks, and a coverage report.'],
    api: ['Production REST API', 'Build a documented REST API with validation, useful errors, authentication, tests, and versioned endpoints.'],
    web: ['Portfolio Web Application', 'Build an accessible responsive web app with state, forms, API integration, and polished documentation.'],
    backend: ['Task Manager API', 'Create a layered backend with authentication, database persistence, validation, tests, and deployment notes.'],
    database: ['Application Data Layer', 'Design a normalized schema, indexes, transactions, migrations, and performance-aware queries.'],
    network: ['Network Diagnostic Toolkit', 'Build tools and notes that demonstrate HTTP, DNS, TCP/IP, latency, and troubleshooting concepts.'],
    machinelearning: ['Customer Churn Predictor', 'Prepare data, train multiple models, evaluate fairly, explain results, and expose inference.'],
    deeplearning: ['PyTorch Classifier', 'Build a full PyTorch pipeline with datasets, training loops, regularization, metrics, and saved inference.'],
    transformer: ['Transformer Exploration Lab', 'Demonstrate tokenization, embeddings, attention, masking, and transformer inference with clear experiments.'],
    huggingface: ['Fine-tuned Transformer', 'Fine-tune a pretrained model, track experiments, evaluate it, and document limitations.'],
    generativeai: ['VAE or GAN Studio', 'Train and evaluate a small generative model and explain architecture, stability, and output quality.'],
    llm: ['Evaluated LLM Application', 'Build an LLM app with structured outputs, prompt tests, safety checks, and measurable evaluation.'],
    rag: ['Knowledge Base Assistant', 'Implement ingestion, chunking, embeddings, retrieval, reranking, citations, and retrieval evaluation.'],
    agent: ['Multi-tool Business Assistant', 'Create a guarded agent that calls tools, manages state, handles failures, and is evaluated on tasks.'],
    deployment: ['Deployed ML Service', 'Serve a model through an API with health checks, versioning, monitoring notes, and reproducible deployment.'],
    docker: ['Containerized AI Application', 'Package an AI service with a secure Dockerfile, environment configuration, health checks, and documentation.'],
    cloud: ['Cloud-deployed AI Service', 'Deploy an AI application with secrets handling, observability, scaling notes, and cost awareness.'],
    systemdesign: ['GenAI Solution Architecture', 'Turn business requirements into an architecture diagram covering models, data, APIs, security, scale, cost, and trade-offs.']
  };

  const NORMALIZE = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const TRACK_ALIASES = [
    ['machinelearning', ['machinelearning', 'ml']], ['deeplearning', ['deeplearning']],
    ['generativeai', ['generativeai', 'genai']], ['systemdesign', ['systemdesign']],
    ['huggingface', ['huggingface']], ['transformer', ['transformers', 'transformer']],
    ['deployment', ['modeldeployment', 'deployment']], ['database', ['databases', 'database']],
    ['network', ['computernetworks', 'networking', 'networks']], ['backend', ['backenddevelopment', 'backend']],
    ['web', ['webdevelopment', 'frontend', 'webdev']], ['api', ['apis', 'api']],
    ['agent', ['aiagents', 'agents', 'agent']], ['llm', ['llms', 'largelanguagemodels', 'llm']],
    ['rag', ['rag', 'retrievalaugmentedgeneration']], ['docker', ['docker']], ['cloud', ['cloud']],
    ['python', ['python']], ['sql', ['sql']], ['git', ['gitgithub', 'github', 'git']], ['dsa', ['datastructuresalgorithms', 'dsa']],
    ['oop', ['objectorientedprogramming', 'oop']], ['linux', ['linux']], ['debugging', ['debugging']], ['testing', ['testing']]
  ];

  function detectTrack() {
    const candidates = [
      document.querySelector('[data-course-title]')?.getAttribute('data-course-title'),
      document.querySelector('[data-track]')?.getAttribute('data-track'),
      document.querySelector('main h1')?.textContent,
      document.querySelector('main h2')?.textContent,
      document.title,
      location.hash,
      location.pathname
    ].filter(Boolean).map(NORMALIZE);
    for (const [key, aliases] of TRACK_ALIASES) {
      if (candidates.some(value => aliases.some(alias => value.includes(alias)))) return key;
    }
    return null;
  }

  function findHost() {
    return document.querySelector('main .course-content, main .lesson-content, main .content, main, [role="main"]') || document.body;
  }

  function injectStyles() {
    if (document.getElementById('portfolio-projects-styles')) return;
    const style = document.createElement('style');
    style.id = 'portfolio-projects-styles';
    style.textContent = `
      .portfolio-projects-panel{margin:32px 0 16px;padding:24px;border:1px solid rgba(127,127,127,.28);border-radius:18px;background:linear-gradient(145deg,rgba(99,102,241,.10),rgba(14,165,233,.06));box-shadow:0 10px 30px rgba(0,0,0,.08)}
      .portfolio-projects-panel h2{margin:0 0 8px;font-size:clamp(1.35rem,2vw,1.8rem)}
      .portfolio-projects-panel p{line-height:1.65}.portfolio-projects-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin:18px 0}
      .portfolio-project-card{padding:18px;border:1px solid rgba(127,127,127,.22);border-radius:14px;background:rgba(255,255,255,.04)}
      .portfolio-project-card h3{margin:0 0 8px;font-size:1.05rem}.portfolio-project-card ul{margin:10px 0 0;padding-left:20px;line-height:1.6}
      .portfolio-project-path{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.88rem;padding:10px 12px;border-radius:10px;background:rgba(0,0,0,.18);overflow-wrap:anywhere}
      .portfolio-project-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.portfolio-project-actions a{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;padding:10px 14px;border-radius:10px;border:1px solid currentColor;font-weight:650}
      .portfolio-project-badge{display:inline-block;padding:5px 9px;border-radius:999px;font-size:.78rem;font-weight:700;background:rgba(99,102,241,.14);margin-bottom:10px}
    `;
    document.head.appendChild(style);
  }

  function render() {
    const track = detectTrack();
    if (!track || !PROJECTS[track]) return;
    const existing = document.getElementById('portfolio-projects-panel');
    if (existing?.dataset.track === track) return;
    existing?.remove();
    injectStyles();
    const [name, description] = PROJECTS[track];
    const slug = track.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    const section = document.createElement('section');
    section.id = 'portfolio-projects-panel';
    section.className = 'portfolio-projects-panel';
    section.dataset.track = track;
    section.innerHTML = `
      <span class="portfolio-project-badge">Final track project</span>
      <h2>Build it for your GitHub portfolio</h2>
      <p>Finish this after the track. It is designed to prove the skills in a real project rather than only showing course completion.</p>
      <div class="portfolio-projects-grid">
        <article class="portfolio-project-card"><h3>Guided project</h3><p>${description}</p><ul><li>Start with a working minimum version</li><li>Complete milestones one by one</li><li>Add tests or evaluation</li></ul></article>
        <article class="portfolio-project-card"><h3>Portfolio project: ${name}</h3><ul><li>Write a professional README</li><li>Explain architecture and trade-offs</li><li>Include setup and demo evidence</li><li>Prepare to explain it in an interview</li></ul></article>
      </div>
      <p><strong>GitHub destination</strong></p>
      <div class="portfolio-project-path">portfolio/${slug}/${NORMALIZE(name).replace(/[^a-z0-9]+/g,'-') || 'project'}/</div>
      <div class="portfolio-project-actions"><a href="portfolio/README.md" target="_blank" rel="noopener">View project roadmap</a><a href="portfolio/PROJECT_TEMPLATE.md" target="_blank" rel="noopener">Open project template</a></div>
    `;
    findHost().appendChild(section);
  }

  let timer;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(render, 180); };
  document.addEventListener('DOMContentLoaded', schedule, { once: true });
  window.addEventListener('hashchange', schedule);
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  schedule();
})();
