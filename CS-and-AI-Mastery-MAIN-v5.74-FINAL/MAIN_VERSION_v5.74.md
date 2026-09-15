# CS & AI Mastery v5.74 — Concept examples, questions above code, and runnable teaching programs

v5.74 fixes the lesson-example regressions reported after v5.73 while preserving the audited curriculum and scroll-performance architecture.

## Fixed

- Restored a lightweight **Conceptual examples** section from each lesson's actual Key concepts. It is generated only for the lesson being opened, so conceptual teaching is visible without rebuilding every heavy example on the page.
- Kept the richer **Examples for every key idea** layer and exported its concept-use knowledge so the lightweight conceptual layer can reuse the same course-aware examples.
- Added an independent program-question layer so lesson programs receive a concise, tailored **Question** immediately above the code.
- Questions are always visible. They are not optional and do not use a `Required` label.
- The question layer covers normal runner cards, generated study examples, language variants, and raw native lesson code while avoiding duplicate questions after lazy-card hydration.
- Corrected the DSA linked-list `1 -> 2 -> 3` teaching program: it is valid Python, so it is no longer marked `Reference only`. It now runs and prints `1 2 3` to prove the links were built correctly.
- Updated the homepage and all 62 course pages to the v5.74 learning-asset cache tag.

## Preserved

- 62 courses / 800 lessons.
- Current concise, code-grounded explanations and Syntax used sections.
- Distinct practical examples for each key concept.
- Blank collapsed Try it yourself editors.
- Lazy/current-lesson-only rendering and scroll-performance safeguards.
- Progress/resume, GitHub publishing, runners, assessments, projects, and installer behavior.
- Beginner-readable C++ style.

## Verification

The current full regression suite passes, including the dedicated v5.74 contract. The build contains 895 native lesson examples: 362 runnable and 533 intentional reference examples. All 53 directly compilable C++ teaching programs pass `g++ -std=c++20 -fsyntax-only`; the remaining C++ lesson example intentionally demonstrates a multi-file project.
