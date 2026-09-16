# Syntax-used QA — v5.67

- Universal syntax summary implemented in `assets/line-by-line-explanations.js`.
- Scope: examples, lesson code, exercises, assessment editors, and project editors covered by the universal explainer.
- Each entry includes: What it does / Syntax / Used here / Why here.
- Regression case verified: `[expression for item in iterable]` is identified as a list comprehension, not a generator expression.
- Generator expression regression verified separately with `sum(expression for item in iterable)`.
- `.join()` and `.strip()` are only explained when present.
- Full existing platform test suite passes across 62 generated course pages / 800 lessons.
