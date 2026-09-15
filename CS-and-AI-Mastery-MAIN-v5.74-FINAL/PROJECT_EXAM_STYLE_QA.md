# Project Exam-Style Brief QA — v5.40

This release changes project guidance from implementation milestones to professor/exam-style requirement briefs.

## Required behavior
- Every project still has guidance coverage.
- Project guidance is phrased as what the finished program/submission must do.
- Project requirements render as unnumbered bullets, not numbered build steps.
- Relevant course concepts remain visible as guidance, but no finished solution code is provided.
- The Python Expense Tracker explicitly states its stored fields, menu behavior, user inputs, validation, viewing, totals, category search, persistence, and exit behavior.
- The same exam-style requirements format now also applies to courses, lessons, examples, exercises, and knowledge checks.

## Verification
Run `npm test`. The guided-practice contract checks all 62 courses and all 271 projects, including the Expense Tracker regression assertions.

No GitHub commit, push, PR, merge, or publish is performed by this local package.
