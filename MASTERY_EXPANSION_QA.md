# Mastery expansion QA — requested items 3–7

Date: 2026-08-14

## Added curriculum

- Software Engineering in Practice — 20 lessons, 20 exercises, 20 quiz items, 3 projects.
- Classical AI: Search, Reasoning & Planning — 20 lessons, 20 exercises, 20 quiz items, 3 projects.
- Reinforcement Learning & Modern LLM Post-Training — 26 lessons, 26 exercises, 26 quiz items, 3 projects.
- Large-Scale AI Training & Inference — 22 lessons, 22 exercises, 22 quiz items, 3 projects.
- AI Agents — expanded with a 12-lesson MCP module and 2 MCP-specific projects; AI Agents now has 21 lessons and 5 projects total.

## Learning-quality contract

- Full/deep explanation appears before examples on every generated lesson page.
- Shared study-example system enforces 5–8 examples per lesson.
- Course-native examples are preserved; examples that differ only by literal values do not count as separate examples.
- New course pages include exercises, quizzes, projects and capstone-style work.
- New projects use the shared Run/Check, Publish to GitHub and Smart README layers.
- Local GitHub publishing uses the repository explicitly selected by the learner on the GitHub page through GitHub CLI authentication on that learner's computer.

## Path integration

- Software Engineering in Practice is included in the AI Engineer foundation phase and the Full-Stack path.
- Classical AI is placed before the core ML progression in the AI Engineer path.
- Reinforcement Learning & Modern LLM Post-Training is placed in the modern AI phase.
- Large-Scale AI Training & Inference is placed in the production AI phase.
- MCP remains inside AI Agents rather than becoming a duplicate standalone course.

## Curriculum size

- 61 visible courses (including the new C++ Programming & DSA course).
- 791 visible lessons.
- 62 generated course pages / 800 lesson blocks including the hidden legacy OOP compatibility page.
- 4,809 adaptive study-example slots, 5–8 per lesson.
- 794 exercises, 1,513 checkpoint/quiz items and 229 projects across the generated verification set.

## Final verification

PASS:
- npm test (GitHub, local GitHub, final quality, navigation/performance, Python runner, interactive input, lesson depth/examples, course-native examples)
- production integrity audit
- static lesson-example audit
- final quality layer verification
- OA assessment verification
- production augmentation verification
- Python-only platform verification
- runner-performance verification
- Smart project README verification
- study-example verification
- unified-learning-design verification
- deep-study-ready QA
- learning-quality report
- 340 JavaScript files syntax-checked with Node
- 71 JSON files parsed successfully
- exact duplicate normalized lesson titles across 61 visible courses: 0
- high-similarity cross-course lesson-title pairs at Jaccard >= 0.75: 0
- local server returned HTTP 200 for the homepage, all four new course pages and AI Agents
- COOP/COEP headers present for interactive Python execution

## Browser note

Automated and server-level verification is complete. A final visual click-through on the user's Windows browser is still the definitive check for local display details because the build/test container does not provide the same Windows browser environment.
