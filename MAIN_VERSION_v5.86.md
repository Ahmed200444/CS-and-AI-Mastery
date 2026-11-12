# Main Version v5.86.0

Build date: 2026-11-11

## Lesson videos v1 — a companion video in every lesson

Baseline: v5.85.0. No course, route, id, lesson text or stored progress key was changed.

### Added
- `assets/course-videos.json`: 193 curated YouTube links (164 different videos) across all 62 courses, 2 to 6 per course. Every link came from a YouTube search result on 2026-11-11; none was typed from memory.
- `assets/lesson-videos-v1.js` (the same list embedded), loaded on every course page by `scripts/inject-unified-learning-design.cjs`.
- Each lesson shows one video card when opened: the course video whose title best fits the lesson, plus a "More videos on this topic" link that searches YouTube for that exact lesson.
- Each course header has a collapsed "Course videos" list with all of that course's picks.
- "Play here" appears only in browsers that support credentialless iframes (Chrome and Edge); every browser gets "Watch on YouTube".
- Contract checks for the video list were added to `tests/pro-polish-v6-contract.test.cjs`.

### Honest scope
- Of 822 lesson cards, 103 are matched to the specific lesson by title; the other 719 show the course's main video. The per-lesson search link is there for exactly that gap.
- The videos were chosen from titles, descriptions and search ranking. They were not watched end to end, and embedding permission is set by each uploader.
- Videos belong to their YouTube channels and can be removed or changed by their owners at any time.
