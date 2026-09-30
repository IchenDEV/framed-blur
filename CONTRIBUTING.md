# Contributing

Thanks for helping improve framed-blur!

## Setup

```bash
pnpm install
pnpm dev        # React playground (example/) — http://localhost:5178
pnpm dev:vue    # Vue playground (example-vue/) — http://localhost:5179
```

## Before opening a PR

Run the full verification pipeline — it is exactly what CI runs:

```bash
pnpm verify
```

That is: `typecheck` → `test` (vitest + jsdom) → `build` (tsup) → `publint` →
`@arethetypeswrong/cli`. All five must pass.

## Structure

- `src/core.ts` — pure, framework-agnostic math and CSS declaration helpers. **No DOM access.**
- `src/react.tsx`, `src/vue.ts`, `src/vanilla.ts`, `src/element.ts` — thin renderers over the core.
- `styles.css` — the zero-JS drop-in.
- `example/`, `example-vue/` — playgrounds.

## Guidelines

- Keep the core dependency-free and DOM-free; new behavior goes there first.
- Add or update tests in `src/*.test.ts(x)` for any behavior change.
- Match the existing code style; do not add comments unless they explain *why*.
- Keep options identical across React, Vue, vanilla and the Web Component.

## Releasing (maintainers)

```bash
# 1. bump version in package.json (SemVer) and update CHANGELOG.md
pnpm verify
npm publish         # publishConfig sets access:public + provenance
git tag vX.Y.Z && git push --tags
```

Publishing with provenance requires running from CI with `id-token: write`, or
locally with a logged-in npm account that has 2FA.
