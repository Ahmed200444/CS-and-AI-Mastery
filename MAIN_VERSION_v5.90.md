# Main Version v5.90.0

Build date: 2026-11-12

## A Projects section on every course

Baseline: v5.89.0. Still 63 course routes and 808 lessons; no course, lesson, id or stored progress key was changed.

### Added
- `assets/course-projects-v1.js`, loaded on all 63 course pages by `scripts/inject-course-projects.cjs` (a new step in the Netlify build).
- "Course contents" gains a **Practice** group below the lessons with two links: *Exercises and checks* and *Projects* with the project count. Each opens its section and scrolls to it. On phones the links sit inside the same collapsed "Course contents" panel.
- Each project is shown as an overview card, in the style of the Projects page of AI Engineer Study: project number and level (Starter, Intermediate, Advanced or Capstone), title, description, what the workspace includes, and a status.
- Status is read from data the platform already stores: *Not started*, *Draft saved* (a saved editor draft exists) or *Published* (the project was published to GitHub). A line above the cards counts published projects and saved drafts.
- `tests/course-projects-v1-contract.test.cjs`, added to `npm test`.

### Not changed
- The project workspace itself (editor, four check levels, README and GitHub publishing) and every project's content.
- Lessons, exercises and knowledge checks stay in their own sections.

### Known limitations
- The cards do not list project-specific skills, because the course data has no skills field per project; they list what every project workspace includes instead.
- The level label is fetched from the course data file when the Projects section is opened; offline without a cached copy the card shows the project number only.
