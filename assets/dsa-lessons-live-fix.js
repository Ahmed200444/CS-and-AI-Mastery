(() => {
  'use strict';

  const isDsa = () => {
    if (window.CSAIMasteryPracticeFolder?.currentTrack?.() === 'dsa') return true;
    const text = `${location.hash} ${document.title} ${document.body?.innerText || ''}`.toLowerCase();
    return text.includes('dsa algorithm lab') || text.includes('data structures & algorithms');
  };

  function findLabRoot() {
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,strong')];
    const heading = headings.find(node => /dsa\s*algorithm\s*lab/i.test(node.textContent || ''));
    if (!heading) return null;

    let root = heading.parentElement;
    while (root && root !== document.body) {
      const text = root.innerText || '';
      if (/Problems/i.test(text) && /Two Sum/i.test(text) && root.querySelector('button')) return root;
      root = root.parentElement;
    }
    return heading.parentElement;
  }

  function install() {
    if (!document.body || !isDsa()) return;
    if (document.querySelector('[data-dsa-complete="true"]')) return;

    const lab = findLabRoot();
    if (!lab) return;

    let placeholder = document.getElementById('full-study-track');
    if (!placeholder) {
      placeholder = document.createElement('section');
      placeholder.id = 'full-study-track';
      placeholder.dataset.track = 'dsa';
      placeholder.className = 'dsa-lessons-placeholder';
      lab.parentElement.insertBefore(placeholder, lab);
    }

    if (!lab.dataset.dsaPracticeLab) {
      lab.dataset.dsaPracticeLab = 'true';
      const label = document.createElement('div');
      label.className = 'dsa-practice-label';
      label.innerHTML = '<span>EXERCISES & PRACTICE</span><h2>DSA Algorithm Lab</h2><p>Use this lab after studying the lessons above.</p>';
      lab.insertBefore(label, lab.firstChild);
    }
  }

  const style = document.createElement('style');
  style.textContent = `
    .dsa-lessons-placeholder{min-height:120px;margin:0 0 24px}
    .dsa-practice-label{margin:28px 0 16px;padding:18px 20px;border-left:4px solid #0f8a72;background:#eef8f6;border-radius:0 12px 12px 0}
    .dsa-practice-label span{font-size:.78rem;font-weight:800;letter-spacing:.08em;color:#087664}
    .dsa-practice-label h2{margin:5px 0 4px}
    .dsa-practice-label p{margin:0}
    html[data-theme="dark"] .dsa-practice-label{background:#132925!important;color:#e2f5ef!important}
    @media(max-width:700px){.dsa-practice-label{padding:14px 16px}}
  `;
  document.head.appendChild(style);

  const start = () => {
    install();
    new MutationObserver(() => setTimeout(install, 20)).observe(document.body, {childList:true, subtree:true});
    window.addEventListener('hashchange', () => setTimeout(install, 80));
  };

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();