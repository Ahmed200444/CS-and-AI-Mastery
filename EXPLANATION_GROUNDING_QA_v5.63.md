# Explanation Grounding QA — v5.63

## Scope

Validated the explanation system across all 62 course pages and 800 lessons.

## Required behavior

- Explain only syntax, methods, operations, modules, and behavior present in the shown code.
- Do not infer I/O from `print()` alone.
- Do not label `io` or `sys` as modules unless the code actually imports or uses those modules.
- Explain relevant methods such as `.strip()` and `.join()` on the lines where they appear.
- Keep the default lesson explanation concise and beginner-friendly.

## Automated verification

The v5.63 regression suite validates:

- 62 course pages use the v5.63 explanation assets.
- Big-O examples containing `print()` but no stream/module code do not receive I/O or `io` glossary entries.
- `.strip()`, `.lower()`, `.endswith()`, and `.join()` receive specific code-grounded explanations.
- Generated example summaries are based on the actual code rather than lesson/company framing.
- Quick lesson explanations are capped at 55 words and the simpler explanation at 28 words.
- Existing curriculum, runner, progress, GitHub, assessment, project, navigation, and performance contracts remain passing.
