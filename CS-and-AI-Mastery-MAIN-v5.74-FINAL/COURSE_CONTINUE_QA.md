# Course Continue QA — v5.34

The course-level progress header now exposes the next study action directly inside every course hero.

## Behavior

- Not started: `Start → Lesson 1: <title>`
- In progress: `Continue → Lesson N: <title>` where Lesson N is the first unfinished lesson.
- Complete: `✓ Course complete`
- Clicking Start/Continue opens the exact lesson, updates the URL hash, and scrolls to it.
- The control updates immediately when lesson completion changes.
- The homepage Resume card remains available as a separate global entry point.

## Repeated verification

The deterministic behavior test was run three consecutive times and passed each time:

- 62/62 generated course pages: fresh state targets Lesson 1.
- 61/61 multi-lesson course pages: after Lesson 1 is complete, the control targets Lesson 2.
- 62/62 generated course pages: fully completed state shows Course complete and no misleading Continue target.
- Exact Python scenario: 7 lessons complete -> Continue Lesson 8 -> click opens/scrolls Lesson 8.

The production contract additionally verifies all 61 visible catalog courses have a corresponding page and load the shared progress/resume asset.
