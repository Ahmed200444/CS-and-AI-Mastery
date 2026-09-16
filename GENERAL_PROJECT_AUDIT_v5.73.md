# CS & AI Mastery — General Project Audit v5.73

## Scope

This audit rechecked the current platform against the requirements accumulated across the project while respecting later decisions that intentionally replaced earlier ones. The current canonical build remains focused and uncluttered rather than restoring old verbose coaching panels.

Canonical scope verified:

- 62 generated course pages
- 800 lessons
- 3,427 key concepts
- 5,040 concept/integration/edge example slots
- 895 native/reference course examples
- 4,641 native example source lines after the reviewed Big-O correction
- 794 exercises
- 271 declared projects in the learning-question layer

## Current requirements verified

- Example descriptions explain only what the actual program does.
- Line-by-line explanations stay grounded in code that is really present.
- Relevant syntax is explained with what it does, its pattern, how the current example uses it, and why it is used there.
- Concept definitions are concept-specific and can be longer when the idea needs more explanation; generic filler is not used as the fallback.
- Practical-use text is concept-aware rather than reusing one scenario for unrelated concepts.
- Examples intentionally vary practical use instead of only changing literal values.
- Every learning item that needs one has a visible question/problem statement; it is not optional and does not carry a `Required` badge.
- Coding/exam prompts explain the input, task, correct behavior, and expected result without revealing the algorithm.
- The separate blank **Try it yourself** editor/runner remains available without modifying the original example.
- C++ teaching code uses readable classroom formatting and `using namespace std;`; compact syntax is reserved for cases where the compact construct itself is the lesson.
- Python, C++, SQL, JavaScript and other supported runners retain their existing wiring.
- Progress/resume, course continue behavior, navigation and GitHub publishing/repository selection remain intact.
- Scroll-performance safeguards and the lazy/collapsed heavy-content architecture remain intact.
- The Windows installer uses `%LOCALAPPDATA%\CS-and-AI-Mastery` and does not depend on a version-specific extracted folder after installation.

## Verified fixes found during this audit

1. **Big-O example clarity** — the O(n) portion now counts four operations and prints `4`; the nested pass counts and prints `16`, instead of printing the input values and obscuring the lesson.
2. **Generic concept-definition fallback** — replaced remaining filler/restatement behavior with concept- and lesson-aware definitions.
3. **Short-name concept matching** — guarded terms such as `BST` and `REST` from accidentally matching unrelated words.
4. **Thin explanations** — strengthened specific lessons that were below the current useful-explanation standard while keeping them concise.
5. **GAN instability explanation** — clarified instability versus mode collapse while remaining within the current concise lesson limit.
6. **C++ revealed solutions** — normalized hidden/revealed exercise solutions to the same readable style as visible C++ teaching code.
7. **Stack-trace collision** — `stack trace` and `call stack` now get debugging/call-specific practical uses instead of inheriting DSA stack scenarios such as undo/bracket matching.
8. **Release/install consistency** — package/launcher/server/service-worker and modified learning-asset cache tags are aligned with v5.73; stale install-folder wording was corrected.

## Historical requirements intentionally superseded

Some old tests still require features the user later explicitly removed. They are not regressions and are not restored:

- `Company-style ticket` / company-scenario framing on ordinary examples
- `Definition of done` and large success/requirements panels
- forced minimum explanation lengths such as 70+ words
- separate verbose plain-English/guided-practice panels that duplicate the current concise explanation/question UI
- old `Question to answer`/`Required` workflow wording

The older baseline structural audit, professional-track breadth audit, and visible-concept coverage checks still pass. Obsolete scenario/panel contracts are retained only as historical files and are not part of the canonical `npm test` command.

## Final verification gates

The v5.73 canonical suite includes the accumulated current contracts plus `general-project-audit-v573-contract.test.js`. A release is accepted only after:

1. the complete suite passes in the working build;
2. native C++ single-file teaching examples are syntax-checked (53 directly compilable programs pass; the remaining example intentionally demonstrates a multi-file `math.hpp` / `math.cpp` / `main.cpp` project and is not a single translation unit);
3. the final ZIP is created;
4. that exact ZIP is extracted into a clean directory;
5. the complete suite passes again from the extracted copy.
