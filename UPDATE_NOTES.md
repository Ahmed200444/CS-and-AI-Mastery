# v5.74 — conceptual examples + questions above programs + runnable teaching code

This release fixes three lesson-view regressions reported after the v5.73 general audit.

- **Conceptual examples are restored:** every opened lesson gets short, course-aware examples for its Key concepts. The layer is lightweight and current-lesson-only so the earlier scroll-performance fix remains intact.
- **Questions are above code:** lesson programs now receive one concise, tailored Question directly before the program. It is always visible, is not optional, and has no `Required` label.
- **Valid code stays runnable:** the DSA linked-list `1 -> 2 -> 3` example was incorrectly tagged as reference-only. It is now a runnable candidate and prints the three linked values so the result is observable.
- The new question layer also protects raw lesson code that is not inside the standard runner wrapper and avoids duplicating questions in lazy generated example cards.
- Homepage and all 62 course pages use the v5.74 learning assets/cache tag.

Verification: full current regression suite PASS; 62 courses / 800 lessons / 895 native examples; 362 runnable + 533 intentional reference examples; 53 directly compilable C++ examples pass `g++` syntax checking.
