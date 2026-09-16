# CS & AI Mastery v5.52 — AUD EECE 355 Practical UML Alignment

Status: **PASS**

## Why this update exists

The public AUD description for EECE 355 Software Engineering explicitly emphasizes software-engineering methods, lifecycle/design work, and UML modeling. CS & AI Mastery's `Software Engineering in Practice` already covered the lifecycle, requirements, design docs/ADRs, reviews, testing, releases, observability, incidents, and team delivery. The clear practical gap was explicit UML/modeling.

This update adds only the job-useful part: choosing a lightweight diagram when it helps engineers understand or review a real system. It does **not** add notation memorization or a theory-heavy UML module.

## Updated lesson

`software-engineering-practice / sep-04`

**Design docs, ADRs & practical UML** now covers:

- UML as a communication tool, not documentation for its own sake
- class diagrams for stable domain structure/relationships
- sequence diagrams for interactions over time
- component diagrams for system boundaries/dependencies
- activity diagrams for branching workflows
- state diagrams for lifecycle states/transitions
- choosing the diagram from the engineering question and audience
- keeping diagrams small, current, and tied to implementation/review needs

## Company-style practice added

- Checkout interaction + order-state worked example
- Targeted exercise that asks the learner to choose diagram types from two different company questions
- Knowledge check that tests when a sequence diagram is the right artifact
- Feature-delivery project requirement for one lightweight UML/engineering diagram chosen for a real communication need
- UML-specific professional concept examples and success checks
- UML-specific purpose-first company tickets, first move, question, and definition of done

## Verification

- 62 courses
- 800 lessons
- 895 native examples
- 794 exercises
- 271 projects/capstones
- 1,585 knowledge checks
- 3,386 normalized key ideas
- 5,003 concept/integration/edge-case example slots
- Full `npm test`: PASS
- Deep study-ready QA: PASS
- Static lesson-example audit: PASS
- Production-integrity audit: PASS
- Purpose-first post-update audit: PASS
- Company-problem-solving post-update audit: PASS
- KHDA benchmark preservation audit: PASS
- Dedicated AUD EECE 355 practical UML regression contract: PASS
