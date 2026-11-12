# Main Version v5.91.0

Build date: 2026-11-12

## Unified study style

Baseline: v5.90.0. Still 63 course routes and 808 lessons; no course, lesson, id or stored progress key was changed.

### Changed
- `assets/pro-polish-v6.css`: the home page, the catalog, the three path pages and all 63 course pages now share the visual language of AI Engineer Study: neutral surfaces, one blue accent, flat cards, and no decorative gradients, glows or hover lifts.
- Light theme: page `#f7f7f5`, cards white, text `#1c1d1f`, accent `#3b5bdb`. Dark theme: page `#121316`, cards `#1a1b1f`, text `#e8e8ea`, accent `#8ea2ff`.
- The change is made by overriding the colour tokens the existing layers already use, plus flat backgrounds for the components that had hard-coded gradients. Layout, spacing, structure, fonts and every script are untouched.

### Not changed
- Course-specific icons, the code editor colours and the yellow note boxes.
- The left navigation column on desktop and the collapsed "Course contents" on mobile.

### Known limitations
- Some inner tools that are only visible after opening them (for example parts of the assessment and Mastery Lab panels) may still show older colours; they were not all reviewed.
- The Full-Stack path page still overflows by 12px at 320px wide (it existed before v5.89).
- Two theme toggles can appear on the path pages (the dock's and the older floating one); both work.
