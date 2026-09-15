
  // Single canonical source of truth for the current platform version.
  // Every current-state version display (backup/export, Developer Mode,
  // diagnostics, footer) must read window.PLATFORM_META.version rather than
  // maintaining its own separate constant -- this is what Phase 0 of the
  // v5.4.1 audit fixed (previously v4.0.0 / 3.8.0 / 3.10.0-dev all disagreed).
  window.PLATFORM_META = { version: "5.19.1" };
