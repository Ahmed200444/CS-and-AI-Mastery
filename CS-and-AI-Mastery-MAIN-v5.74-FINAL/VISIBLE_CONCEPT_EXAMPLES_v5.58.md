# CS & AI Mastery v5.59 — Visible Concept Examples Audit

Status: **PASS**

## Scope verified

- Course pages: **62**
- Lessons: **800**
- Normalized key ideas: **3,427**
- Base concept/integration/edge example slots: **5,040**
- Curated Big-O examples: **11**
- Generated-code paths: **432 / 432 execute**

## What v5.59 changes

The previous calm-study flow could hide later generated examples behind progressive disclosure. v5.59 removes that behavior for key-idea examples. When a lesson is opened, every key idea in that lesson gets its own visible example card. Integration and edge-case examples remain visible as well.

Big-O uses an explicit 11-example ladder covering time complexity, space complexity, growth rate, Big-O, best/average/worst case, O(1), O(log n), O(n), O(n log n), O(n²), and the time-space trade-off.

This rule applies to **every course**, not only DSA.

## Performance safeguards

- Only the **currently opened lesson** is generated initially; the next lesson is not pre-built.
- An unopened lesson is generated only when the learner opens it.
- Off-screen example cards use CSS `content-visibility: auto` with an intrinsic-size placeholder so the browser can skip unnecessary off-screen layout/paint work.
- Runtime prewarming is **idle-first** rather than an immediate startup cascade.
- Pointing at, focusing, or using a run control still wakes the relevant runtime immediately.
- Only a bounded sample of current-lesson Python sources is prewarmed.

The curriculum currently has a median of **4 key ideas per lesson** and a maximum of **14 key ideas in one lesson**. Even concept-heavy lessons therefore remain bounded, while every key-idea example stays visible.

## Regression protection

`tests/visible-concept-examples-v559-contract.test.js` permanently checks that all 62 course pages load the v5.59 behavior, that general lessons map every key concept one-for-one, that Big-O keeps the complete curated ladder, that examples are not hidden as optional practice, and that rendering remains current-lesson-only with off-screen paint deferral.
