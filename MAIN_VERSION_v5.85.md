# Main Version v5.85.0

Build date: 2026-11-11

## Pro polish v6 — one professional look on laptop and phone

Baseline: the `fix-sellable-course-sanitization` branch (62 course routes, 800 lessons). No course, route, id or stored progress key was changed.

### Added
- `assets/pro-polish-v6.css` and `assets/pro-polish-v6.js`, loaded last on the home page and all 62 course pages by `scripts/inject-unified-learning-design.cjs`.
- Course pages now use the dashboard's indigo-to-blue brand for primary buttons, progress bars, active lesson and pills (green is kept for "done").
- Reading progress bar at the top of every course page.
- Lesson filter inside "Course contents" (press `/` on a keyboard, `Esc` to clear).
- "Complete" is a clear toggle with a proper touch target, and ticking it shows a short "Lesson complete — N of M" message. Progress is still saved only by the existing progress store.
- Hover, focus-ring and press feedback on cards, buttons and lesson rows; dashboard numbers count up once; cards below the fold fade in.
- Catalog hero, cards and "Open course" buttons match the same brand.
- `tests/pro-polish-v6-contract.test.cjs`, added to `npm test`.

### Fixed
- Phone (600px and below): home track cards were laid out in two clipped columns; they are now one readable column.
- Phone: the last button in a lesson run toolbar ("Add a README") could be cut off; toolbars now wrap.
- Catalog: after typing in the search box, the first click on "Open course" was lost because the list re-rendered on blur.

### Not changed in this release
- Lesson text, exercises, projects, quizzes, simulations and runners.
- Videos: none exist yet; they are planned as the next release.
