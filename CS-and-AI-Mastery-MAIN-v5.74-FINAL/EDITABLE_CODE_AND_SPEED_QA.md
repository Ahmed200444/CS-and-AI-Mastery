# Editable Code + Faster Run QA — v5.29

## Editable coverage
- All 62 generated course pages load `assets/universal-editable-code.js`.
- 895 native/reference lesson code blocks are made plain-text editable at runtime.
- Dynamic study examples, adaptive examples, assessment coding editors, exercise code editors, and project editors are covered by the same universal code-workspace inventory.
- Written/reflection textareas remain normal writing boxes and are not mislabeled as code.
- Static examples receive a subtle **Editable code** cue plus **Reset code**.
- Existing project/exercise editors keep their own normal controls instead of receiving duplicate toolbars.
- Line-by-line explanations refresh after edits.
- `lesson-example-runner.js` reads the current `pre.textContent` when Run is clicked, so edited examples run the edited source rather than the original page-load source.

## Speed changes
- Python source is precompiled into the existing shared Pyodide worker cache during debounced background prewarm.
- The same Python precompile cache serves lesson runs and assessment tests.
- JavaScript edited source is precompiled in the persistent JS worker before Run when idle typing time is available.
- C++ keeps the lightweight runner first, early full-compiler warmup, and compiled-binary cache.
- SQL keeps the prebuilt seed snapshot and local cached runtime.

## Verification
- `npm test`: PASS.
- Universal editable code contract: 62 pages / 895 native-reference code blocks + dynamic editors: PASS.
- Production integrity: 63 HTML files / 3,243 local asset references: PASS.
- JavaScript/CJS syntax: 418 files / 0 failures.
- JSON parse: 72 files / 0 failures.
- C++ native examples: 53 single-file examples compile under C++17; 1 intentional multi-file/CMake lesson excluded from single-file compilation.
- Local server: homepage + 62 course pages + editable asset = 64/64 HTTP 200.
- Python worker headers: COOP `same-origin`, COEP `require-corp`.
- Versioned editable asset cache: `public, max-age=31536000, immutable`.
