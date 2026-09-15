# VS Code-style diagnostics QA

Version 5.26.0 adds a low-noise professional diagnostics layer for Python and C++ editors.

- Line-number gutter with red/yellow problem markers.
- Vertical scope/indent guides for Python indentation and C++ brace depth.
- Red/yellow wavy underlines on the exact line/column when a runtime/compiler diagnostic can be mapped.
- A Problems panel with the professional error message, source, line/column, and one short learning-oriented explanation.
- Conservative live Python checks for obvious undefined function/class calls, missing block colons, and unbalanced delimiters.
- Conservative live C++ delimiter checks; authoritative C++ diagnostics come from the real C++ compiler after Run/Check.
- Successful C++ examples keep the lightweight fast path. Only failed C++ runs fall through to the full compiler for better diagnostics.
- Editors are enhanced lazily near the viewport so the diagnostic UI does not slow initial course loading.
