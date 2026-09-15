# Python Run Recovery & Input Validation QA

Version: **5.31**

This build prevents an abandoned `input()` call from locking every later Python Run/Check action.

Verified behavior:

- One shared Python worker is still used for examples, exercises, assessments, and projects.
- Clicking a new Run/Check while an older run waits for input automatically cancels the older run and starts the requested run.
- The terminal exposes a visible **Cancel** button and Escape cancellation.
- If cancellation does not release within 500 ms, the worker is reset so the UI cannot remain permanently busy.
- `int(input(...))` validates whole-number input before submission.
- `float(input(...))` validates numeric input before submission.
- Plain `input()` remains unrestricted text, matching Python behavior.
- Multiple input calls are validated in source order.
- Invalid integer/float runtime diagnostics explain the expected input type.

Contract: `tests/python-runner-recovery-validation-contract.test.js`.
