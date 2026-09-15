# Behavior-First Guidance QA — v5.45

## Goal
Make every required guidance block explain the behavior a learner must understand or produce without telling them the exact variable names, loop keywords, condition keywords, helper names, query clauses, or other syntax to copy.

The code can still appear below the guidance. The guidance should translate the code into ordinary behavior first.

## Coverage
- 62/62 courses
- 800/800 lessons
- 895/895 native lesson examples
- 794/794 exercises
- 271/271 projects and capstones
- 1,513/1,513 knowledge checks

Every guidance object contains a non-empty `plainEnglish` section and a non-empty behavior-first `focus` section. Raw implementation metadata may remain internally for matching/quality checks, but the UI does not render it as a syntax hint.

## Required Python regression
For the reviewed loop example, the visible explanation must say the behavior without naming the original variable or keyword:
- the first repeated section runs 5 times, moving through 0 to 4;
- when the current value reaches 3, the repetition stops, while the rest of the program may keep running;
- when the current value is 1, the rest of that turn is skipped and the next turn begins;
- the second repeated section walks through the collection while tracking both each item's position and value.

The regression test explicitly rejects the original variable names and the original loop-control/position-tracking keywords in these explanations.

## Presentation
- Guidance is static, mandatory, and non-clickable.
- Course guidance appears after the course hero.
- Lesson guidance appears first inside the lesson.
- Example guidance appears immediately above the example.
- Exercise/project/knowledge-check guidance appears before the answer/workspace.
- The old raw “Relevant / expected concepts” chips are not rendered. They are replaced by “What to think about” behavior phrases.

## Validation
`tests/plain-english-guidance-contract.test.js` verifies all 62 courses / 800 lessons / every example, exercise, project, and knowledge check. Full `npm test` must pass before release packaging.
