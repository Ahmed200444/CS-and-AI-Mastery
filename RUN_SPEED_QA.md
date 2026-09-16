# Automatic Run Speed QA

This build prewarms runtimes automatically so the first Run/Check click does not pay the full startup cost.

- Python worker starts automatically on Python-heavy courses.
- Pyodide is loaded in the background while the learner reads the lesson.
- The currently open Python source is pre-scanned for package imports.
- Repeated package-import preparation is cached inside the worker.
- SQL.js is prewarmed automatically on SQL/Databases pages and shared by lesson examples and projects.
- Runtime CDN connections are preconnected before execution.
- JavaScript/HTML/validation paths stay lightweight and require no heavy runtime preload.
- All 62 generated course pages load the shared acceleration guard. The v5.25.0 build uses the maximum local runtime-cache/prewarm path rather than the older `20260815-fast1` CDN-preconnect-only path.
