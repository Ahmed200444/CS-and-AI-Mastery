# Automatic Indentation QA — v5.30

The universal editable-code layer now performs automatic indentation across all generated course pages and dynamic code workspaces.

Coverage includes lesson examples, reference examples, adaptive examples, exercises, assessments, and projects.

Behavior verified by `tests/auto-indentation-contract.test.js`:
- Python `:` block indentation
- nested Python indentation
- C++ `{` block indentation
- nested C++ indentation
- paired `()`, `[]`, `{}` multiline indentation
- ordinary indentation preservation
- Python dedent-keyword support
- closing-delimiter dedent support
