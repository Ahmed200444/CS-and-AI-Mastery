# Main Version v5.88.0

Build date: 2026-11-12

## Removed-course progress fix and home page polish

Baseline: v5.87.0. Still 62 course routes; no course, lesson, id or stored progress key was changed.

### Fixed
- `assets/progress-resume.js`: the home "Continue studying" card no longer links to a course that was removed from the catalog (ARM Assembly, MATLAB Engineering, Microprocessors ARM). Those links returned "Page not found".
- `assets/progress-resume.js`, `assets/adaptive-v4-live.js`: lessons completed in removed courses are no longer counted in "lessons complete", "Your progress" or "courses started". The saved data itself is left in the browser untouched.
- `assets/adaptive-v4-live.js`: the home course tiles show the catalog's real lesson and exercise counts instead of fixed numbers.

- `assets/optional-services.js`, `netlify/functions/tutor.mjs`: the Tutor button is hidden when the site has no AI provider key, because it could only answer with a "not configured" notice. It returns by itself once a key is set in Netlify.

### Changed (home page only)
- `assets/pro-polish-v6.css`: course and feature card buttons line up along the bottom edge; path cards lose their empty space; the three feature cards sit in one row on wide screens; the top bar is opaque so scrolled content no longer shows through it.
- `assets/adaptive-v4-live.js`: an eighth "Browse all courses" tile completes the course grid and opens the catalog.
- `assets/progress-resume.js`: the Continue card sits below the hero description instead of between the headline and the description.

### Not changed
- Course pages, lessons, exercises, quizzes, projects, routes and progress keys.
- The catalog still lists 61 courses: Object-Oriented Programming is the 62nd route and is taught inside Python by design.
