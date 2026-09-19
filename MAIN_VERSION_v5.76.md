# Main Version v5.76.0

Build date: 2026-09-19

## StudyCore handoff

- One **Export to StudyCore** button lives on the CS & AI Mastery home page instead of adding export controls to every lesson.
- The export dialog chooses one course and any subset of its lessons, or the whole course.
- Exports are intentionally one course at a time so StudyCore flashcard source pools never mix unrelated courses by accident.
- The handoff contains only course/lesson identifiers plus the exact CS & AI Mastery source commit and version; StudyCore re-loads its pinned structured source instead of trusting editable URL content.
- The default target is grounded flashcards, with a materials-only option.
- A build-time manifest records the exact deployed source commit so StudyCore can reject stale/mismatched handoffs instead of silently importing the wrong lesson version.
