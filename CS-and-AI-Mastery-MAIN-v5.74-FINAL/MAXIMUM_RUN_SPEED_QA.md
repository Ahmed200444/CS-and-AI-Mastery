# Maximum Run Speed QA

This build minimizes Run/Check startup delay without running lesson code natively on the host computer.

- Python (Pyodide) core is downloaded once during installation and served from the local app thereafter.
- SQL.js is downloaded once during installation and served locally.
- JSCPP lightweight C++ runtime is downloaded once and used before the heavier C++ compiler fallback.
- Common Pyodide packages are pre-cached at installation when internet access is available.
- Any missing Pyodide package is proxied by the local server once, cached on disk, and reused later.
- The Python worker is prewarmed immediately and visible Python sources are pre-scanned in the background.
- SQL is prewarmed automatically on SQL/database pages.
- JavaScript uses one persistent Web Worker per page rather than creating a new Worker per run.
- C++ lightweight runtime is prewarmed automatically; the full compiler warms later in the background when C++ examples are present.
- The browser remains sandboxed for Python/JS execution; user code is not executed natively by the local Node server.
