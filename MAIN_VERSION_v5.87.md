# Main Version v5.87.0

Build date: 2026-11-12

## Selling features removed

Baseline: v5.86.0. Still 62 course routes; no course, lesson, id or stored progress key was changed.

### Removed
- `assets/product-footer.js`: the About / Terms / Privacy / Support footer and the one-time welcome card.
- `assets/product-config.js`: the owner name, support email and website settings.
- `scripts/build-customer-package.cjs`: the script that produced a customer copy.
- Their script tags on the home page and all 62 course pages (`scripts/augment-production-platform.cjs`).

### Kept
- The 62-course catalog, the v5.85 design layer and the v5.86 lesson videos.
- `assets/optional-services.js`, which only hides GitHub sync and the AI tutor when no server is available.
