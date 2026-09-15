# CS & AI Mastery v5.60 — Scroll Performance QA

## Regression reproduced
The v5.59 course UI used `content-visibility:auto` on study examples, assessment tasks, projects, and catalog/path cards. On a long DSA course page this deferred layout until blocks entered the viewport, moving expensive layout work directly into the scroll path.

## Fixes
- Course study examples, assessment tasks, project blocks, and other large learning blocks are pre-laid-out instead of being activated during scrolling.
- Catalog and learning-path cards are also pre-laid-out.
- VS Code-style diagnostics no longer initialize because an editor merely enters the viewport. They initialize on focus/input/run-error interaction instead.
- Closed-lesson line-by-line explanation UI no longer initializes because the lesson scrolls near the viewport. It still initializes when the learner opens the lesson.
- Decorative fixed full-screen gradients are disabled on the learning shell, course sidebars no longer use backdrop blur, and large course/editor shadows are removed from the scroll paint path.
- Asset query versions moved from `v559` to `v560` and the service-worker cache namespace was bumped.

## Chromium isolated-scroll benchmark
Viewport: 1440×900. Page: `courses/dsa.html`, with local assets inlined for deterministic browser measurement.

- Before: about 41 ms mean frame interval, ~168 ms p95, repeated frames above 33 ms.
- After: about 16.7 ms mean frame interval, 18.5 ms p95, 0 frames above 33 ms in the final measured run.

The benchmark is a local regression test rather than a guarantee for every PC/GPU, but it directly reproduced and removed the scroll-time layout spikes in v5.59.
