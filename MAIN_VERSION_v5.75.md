# Main Version v5.75.0

Build date: 2026-09-19

## Code with comments learning view

- The existing clean code/editor remains unchanged and runnable.
- Opening **Line-by-line explanation** now shows a **Code with comments** learning view first.
- Every nonblank source line receives its existing concise explanation as an inline comment.
- Python/shell/YAML/Dockerfile use `#`, SQL uses `--`, C++/Java/JavaScript/TypeScript use `//`, HTML uses `<!-- -->`, and CSS uses `/* */`.
- The commented copy is explicitly labeled as a learning view so it is not confused with the runnable editor.
- The feature is generated universally from the existing line explainer, so examples, exercises, assessments, projects, and supported specialist editors all receive the same behavior without duplicating course content.
- Netlify build output cache-busts the explainer asset so the deployed site picks up the change immediately.
