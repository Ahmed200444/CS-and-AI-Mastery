# Mandatory Visible Requirements QA — v5.41

The exam-style requirement system is mandatory and visible by default.

## Layout contract

- Requirement UI is a static `<section>`, not `<details>`/`<summary>`.
- Requirement headers have no click/toggle behavior.
- Every requirement brief displays a `REQUIRED` badge.
- Course: after hero.
- Lesson: first content inside the lesson body.
- Example: immediately before each example code/command block.
- Exercise: before its answer/editor control.
- Project/capstone: after project heading, before workspace/content.
- Knowledge check: before answer controls.

## Coverage

- 62/62 courses
- 800/800 lessons
- 895/895 examples
- 794/794 exercises
- 271/271 projects + capstones
- 1,513/1,513 knowledge checks

Automated contract tests enforce both the coverage and the non-collapsible placement rules.
