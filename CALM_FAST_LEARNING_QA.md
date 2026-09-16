# Calm + Fast Learning QA — v5.25.0

## Learning experience

- 62 generated course pages, 800 lessons.
- Quick explanation capped at 90 words.
- Measured default visible teaching text: median 90 words, average 92.9 words, maximum 129 words across all 800 lessons.
- Deep material is preserved under **Learn deeper** and collapsed by default.
- One example is visible first; the second is under **Next example**; remaining examples are optional extra practice.
- 5–8 study examples remain available per lesson.
- Line-by-line explanations remain available; syntax detail stays collapsible.

## Runtime performance architecture

- One shared Python worker for examples, exercises, tests, and projects.
- Python/SQL/C++ runtime files are served from the local runtime cache after preparation.
- Python/SQL/C++ pages include early runtime hints in the HTML head.
- Current + next lesson Python sources are prepared, not the whole course.
- Later lesson study examples are lazy-rendered.
- Python edit-time import preparation is debounced to avoid unnecessary worker messages.
- JavaScript uses a persistent worker.
- Versioned assets use immutable browser caching.

## Final verification targets

The release is accepted only after the npm contract suite, secondary QA scripts, JS/CJS syntax checks, JSON parsing, local route crawl, ZIP integrity test, and a fresh-extraction retest all pass.
