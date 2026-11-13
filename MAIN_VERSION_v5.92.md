# Main Version v5.92.0

Build date: 2026-11-13

## Home views no longer sit under the sidebar

Baseline: v5.91.0. Still 63 course routes and 808 lessons; no course, lesson, id or stored progress key was changed.

### Fixed
- The left sidebar was declared 258px wide but used the browser's default content-box sizing, so it was really 291px wide and covered the left edge of every view. It is now exactly its declared width (258px, 226px on narrower screens).
- Only the dashboard, catalog and four path views were offset from the sidebar. Portfolio, My learning, Roadmap, the SQL, Python, DSA and APIs tracks and about fifty other in-page views started at the screen edge, so their left side was hidden. All of them now use the same offset and breakpoints as the sidebar.
- The Company Paths view was 60px wider than the screen; it now fits.
- The two Portfolio buttons (Add Project, Create Your First Project) had dark text on a dark background because they used a colour variable that no longer exists. They now use the accent colour.
- White text on the light accent colour in the older SQL, Python and APIs tracks, and dark text on a dark panel button, now use readable colours.

### Added
- The Projects section of every course now says how to publish: open a project, use Publish to GitHub, and connect GitHub first with the button at the bottom of the page. The line is hidden when GitHub publishing is not available.

- On phones, the older in-page SQL, Python and APIs tracks no longer widen the page as much (they overflowed by 291px, 54px and 120px; the worst now overflows by 44px).

### Known limitations
- On a 320px-wide phone the older in-page SQL, DSA, APIs, Full-Stack path and Company Paths views still overflow by 2 to 44px; the APIs track overflows by 44px up to 430px wide. These views are older than this release and were already overflowing.
- A few secondary buttons inside the older in-page SQL and Python tracks still have low contrast; they were not all reviewed.
