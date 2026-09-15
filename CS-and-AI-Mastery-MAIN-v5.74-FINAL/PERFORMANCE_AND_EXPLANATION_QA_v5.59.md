# CS & AI Mastery v5.59 — Performance + Explanation QA

## What changed

- Removed the dark-theme full-document style/class mutation feedback loop that repeatedly scanned large parts of the page and called computed-style checks while the page was changing.
- Changed multiple global MutationObserver handlers to process only newly added/changed subtrees instead of rescanning every lesson, exercise, project, editor, or assessment after unrelated DOM updates.
- Stopped home/path-only observers from running continuously on standalone course pages.
- Limited study-example regeneration checks to actual lesson insertions; lesson opening still builds the current lesson normally.
- Added browser `content-visibility` containment for large off-screen practice/project blocks and removed expensive backdrop blur from fixed shell surfaces.
- Kept code runners, GitHub controls, progress tracking, exercises, projects, and assessment behavior intact.

## Beginner explanation upgrade

- The universal line-by-line explainer now loads on both the main website and all generated course pages.
- Explanations are built only when the learner opens the explanation, reducing startup and scrolling work.
- Added a contextual “What the unfamiliar terms mean” glossary. It covers Python I/O, `io`, `sys`, `StringIO`, `sys.stdout`, `sys.stdin`, `exec`, `compile`, common collections/functions, async terms, plus common JavaScript, C++, SQL, HTML, and CSS terms when they actually appear.
- Added specific plain-English behavior explanations for `StringIO`, standard-input/output redirection, `.getvalue()`, `.seek()`, `.write()`, `.read()`, `exec()`, and `compile()`.
- On the legacy main shell, code explanations activate on interaction/opening instead of eagerly scanning every hidden course at startup.

## Regression coverage

The normal full test suite plus `tests/performance-explanation-v559-contract.test.js` checks that:

- all course pages keep their existing curriculum/runner/GitHub/progress contracts;
- the main site loads the universal explainer;
- I/O and `StringIO` receive beginner-readable definitions;
- line explanations remain collapsed/lazy until requested;
- the known whole-document observer patterns do not return;
- performance containment remains enabled.
