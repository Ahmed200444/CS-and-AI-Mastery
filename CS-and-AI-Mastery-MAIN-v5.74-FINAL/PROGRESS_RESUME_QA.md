# Progress & Resume QA — v5.34

- 62 generated course pages participate in progress/resume tracking.
- 800/800 lessons have completion controls.
- The shared resume layer persists lesson completion to `courses_progress_v1`, including special/custom course pages.
- The homepage Continue card reads the same canonical progress and links directly to the saved course/lesson anchor.
- `I understand — next lesson` completes the current lesson before advancing the saved resume target.
- Exercise pass and successful project publish activity remain tracked separately.
- The local server clears browser cache only on its first homepage request; localStorage study progress is preserved.
- Service-worker cache name bumped for v5.34 so offline fallback cannot keep an older v5.31 shell.
