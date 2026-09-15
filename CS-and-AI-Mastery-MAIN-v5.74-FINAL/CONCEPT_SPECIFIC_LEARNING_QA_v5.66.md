# v5.66 — Concept-specific learning QA

## Problem fixed

Concept cards previously fell back to a lesson-wide sentence when the platform did not have a definition for the individual concept. This could give distinct concepts in one lesson the same definition.

## Global changes

- Concept labels are now evaluated before broad lesson-title keywords.
- Recognized concepts receive their own concise definitions.
- Concepts that can be demonstrated faithfully receive a small practical code/native example.
- Unknown-concept fallback text is tied to the named concept rather than copied from the lesson's main explanation.
- Hardware/cache examples are restricted to hardware-oriented courses.
- Code behavior descriptions remain grounded in the actual snippet.

## Representative DSA reference lesson

- **references** — explains that variables hold references to objects; example shows two names referring to the same list.
- **identity** — explains whether two names refer to the exact same object; example contrasts `==` and `is`.
- **aliasing** — explains multiple names referring to one mutable object; example mutates through an alias and observes the original.
- **mutation** — explains changing an existing mutable object; example uses `list.append()`.

## Audit scope

- 62 course pages
- 800 lessons
- 3,427 concept entries
- 5,040 base concept/integration/edge example slots

Full regression suite passed after the generator change.
