# Main Version v5.77.0

Build date: 2026-09-19

## Explanation comments directly beside editable code

- The visible editable teaching code now includes a concise explanation comment on each supported source line.
- Python uses `# Explanation:`; C/C++/Java/JavaScript/TypeScript use `// Explanation:`; SQL, HTML, CSS, shell, and YAML use their valid comment syntax.
- The comments are generated from the same line-by-line explanation engine, so they stay consistent with the detailed explanation below.
- Generated explanation comments can be stripped back to the clean source internally, preventing recursive/double explanations.
- Reset Code restores the original lesson example with its explanation comments.
- JSON and other formats where inline comments would invalidate the source stay syntactically valid and keep their separate line-by-line explanation.
- Two-pointer examples now explicitly explain first/last pointer setup and pointer movement.
