# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-09-30

### Added

- Framework-agnostic core (`framed-blur/core`): `computeProgressiveBlur`,
  `computeReducedTransparencyFallback`, `createRenderState`, `withAlpha`,
  declaration/style helpers.
- React component (`framed-blur/react`): `<ProgressiveBlur>` + `useReducedTransparency`.
- Vue 3 component (`framed-blur/vue`): `<ProgressiveBlur>` + `useReducedTransparency`.
- Vanilla API (`framed-blur`): `createProgressiveBlur`, `renderProgressiveBlur`.
- Web Component (`framed-blur/element`): `<framed-blur>` + `defineProgressiveBlur`.
- Zero-JS CSS drop-in: `framed-blur/styles.css`.
- Reduced-transparency / forced-colors fallback to a solid tint.
- ESM + CJS + `.d.ts` builds; `publint` and `@arethetypeswrong/cli` clean.
- Playgrounds for React (`example/`) and Vue (`example-vue/`).
