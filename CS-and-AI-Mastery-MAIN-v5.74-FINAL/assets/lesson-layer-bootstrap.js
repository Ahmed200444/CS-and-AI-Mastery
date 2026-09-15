(() => {
  'use strict';

  const supported = new Set([
    'apis','linux','dsa','backend-development','ai-agents','machine-learning','deep-learning','llms','rag',
    'git-github','software-engineering','testing','debugging','databases','computer-networks','docker','cloud',
    'system-design','web-development','transformers','hugging-face','generative-ai','model-deployment','problem-solving'
  ]);

  function activeSlug(){
    return window.CSAIMasteryPracticeFolder?.currentTrack?.() || null;
  }

  function firstMainContainer(){
    return document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
  }

  function findPracticeBlock(root){
    const selectors = [
      '.code-editor','.editor-shell','[class*="editor"]','[class*="terminal"]','[class*="lab"]',
      'textarea','pre','section','article'
    ];
    for (const selector of selectors) {
      const nodes = [...root.querySelectorAll(selector)];
      const match = nodes.find(node => {
        const text = (node.textContent || '').toLowerCase();
        return text.includes('run tests') || text.includes('run command') || text.includes('reveal solution') ||
          text.includes('saved locally') || text.includes('problems') || text.includes('tasks');
      });
      if (match) return match.closest('section,article,div') || match;
    }
    return null;
  }

  function ensureMount(){
    const slug = activeSlug();
    if (!slug || !supported.has(slug)) return;
    if (document.getElementById('full-study-track')) return;

    const main = firstMainContainer();
    const mount = document.createElement('section');
    mount.id = 'full-study-track';
    mount.dataset.track = slug;
    mount.setAttribute('aria-label', 'Course lessons');

    const practice = findPracticeBlock(main);
    if (practice && practice.parentNode) {
      practice.parentNode.insertBefore(mount, practice);
    } else {
      const heading = main.querySelector('h1,h2');
      if (heading?.parentNode) heading.parentNode.insertBefore(mount, heading.nextSibling);
      else main.prepend(mount);
    }
  }

  let queued = false;
  function schedule(){
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      ensureMount();
    });
  }

  function start(){
    ensureMount();
    new MutationObserver(schedule).observe(document.body, {childList:true, subtree:true});
    window.addEventListener('hashchange', () => setTimeout(ensureMount, 50));
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();