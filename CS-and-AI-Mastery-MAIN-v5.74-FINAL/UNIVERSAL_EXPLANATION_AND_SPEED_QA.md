# Universal Explanation & Speed QA — v5.28.0

The universal concise line-by-line explainer is required for every code/command workspace, including lesson examples, assessments, exercises, projects, specialist workspaces, and revealed code solutions. Prose/reflection textareas are excluded on purpose.

Performance changes in this build:
- one shared Python worker;
- immediate Python worker prewarm on Python courses;
- Python compiled-source cache (bounded to 48 entries);
- Python import prewarm only for Python editors;
- SQL seed snapshot cloned per run;
- persistent JavaScript worker with a bounded compiled-function cache;
- earlier idle C++ full-compiler prewarm plus compiled-binary reuse for unchanged source;
- localized MutationObserver work for dynamically-added editors.

The automated suite includes `universal-code-explanation-coverage.test.js` and the existing runner, curriculum, C++, diagnostics, GitHub, installer, and lesson-quality contracts.

Coverage audit: all **895 native examples / 4,124 source lines** receive exactly one concise line record; 0 missing purpose lines, 0 missing optional syntax sections, and no default purpose exceeds 14 words (observed maximum: 11). The adaptive system remains **4,809 slots / 5–8 per lesson**.
