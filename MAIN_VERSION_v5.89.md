# Main Version v5.89.0

Build date: 2026-11-12

## AI Engineer Path: missing content from AI Engineer Study

Baseline: v5.88.0. 63 course routes (was 62); 808 lessons (was 800). No existing course, lesson, id or stored progress key was changed.

### Gap analysis
AI Engineer Study has 11 phases. Ten of them cover topics that already have courses here (Python, DSA, testing, Git, SQL, data science, machine learning, deployment, deep learning, LLMs, RAG, agents, career preparation), so they were not copied. One phase had no matching course: Practical math for ML.

### Added
- New course `practical-math-ml` (Practical Math for ML): 8 lessons, 25 knowledge checks, 13 exercises, 3 projects and 9 interview questions, converted from AI Engineer Study phase 3 into this platform's course format. Every lesson example was run with Python and NumPy.
- Three curated lesson videos for the course; each YouTube id was checked against YouTube's public oEmbed endpoint.
- AI Engineer Path: Data Science (an existing course that the path did not include) and Practical Math for ML now open Phase 3, before Classical AI and AI / Machine Learning. The path lists 44 courses (was 42).

### Changed
- AI Engineer Path order: Reinforcement Learning & Post-Training moved to the end of Phase 4, after prompting, RAG, agents, evaluation and security, because it is the most advanced topic in that phase.
- `assets/pro-polish-v6.css`: the AI Engineer and Computer Engineer path pages were 60px wider than the screen on desktop and scrolled sideways. They now fit.
- Scripts and tests that hard-code the totals were updated to 63 courses / 808 lessons / 807 exercises / 274 projects.

### Known limitations
- The new lessons use this platform's short lesson format, so they are more compact than the originals in AI Engineer Study. The automatic exercise checker from AI Engineer Study was not ported; exercises use this platform's practice format.
- Topics that AI Engineer Study covers in more depth inside courses that already exist here (for example audio and multimodal models, OCR, LangGraph, agent-to-agent protocols) were not merged lesson by lesson.
- The Full-Stack path page still overflows by 12px at 320px wide. This existed before this release.
