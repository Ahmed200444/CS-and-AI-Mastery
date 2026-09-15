# Complete Exam-Style Guidance QA — v5.40

Date: 2026-08-19

## Goal
Make every learning item read like clear professor/exam instructions: state what the learner's work must do or what the learner must be able to demonstrate, while leaving the implementation and final answer to the learner.

## Exact coverage
- 62/62 courses — **Course requirements — what you must be able to do**
- 800/800 lessons — **Lesson requirements — what you must be able to do**
- 895/895 examples — **Example N requirements — what you must do**
- 794/794 exercises — **Exercise question — what your answer must do**
- 271/271 projects + capstones — **Project question — what your finished work must do**
- 1,513/1,513 knowledge checks — **Knowledge-check requirements — what you must determine**

## Format rules
- Requirement briefs are unnumbered bullets, not step-by-step implementation recipes.
- The original exercise/project behavior remains visible.
- Relevant/expected concepts are shown when useful (loops, JSON, SQL clauses, data structures, APIs, model evaluation, etc.).
- No generated guidance object contains a `solution` key.
- Knowledge-check guidance never includes the answer key.
- Examples require prediction/trace, explanation, a meaningful modification, and a new small transfer example.
- Exercises describe required outcomes and relevant concepts without telling the learner the exact code order.
- Projects describe finished-program behavior, user interaction, persistence/error handling, and other requirements when applicable.

## Expense Tracker regression
The Expense Tracker requires the learner's program to store amount/category/description/date, load/save JSON, repeatedly present a menu, validate positive numeric amounts, show all expenses, show total spending, show category totals, search categories case-insensitively, persist after reopening, and exit cleanly. Relevant concepts include list of dictionaries, while loop, functions, JSON, `datetime.date`, and `try / except`. No finished implementation is included.

## Verification
`tests/guided-practice-contract.test.js` checks exact global coverage, schema v2 requirement briefs, unnumbered UI rendering, non-empty relevant concepts, no solution leakage, representative false-positive regressions, and the Expense Tracker/FizzBuzz examples.

The full `npm test` suite must pass before packaging.

## GitHub
This package is local only. No GitHub commit, push, PR, merge, or publish is performed by the build.
