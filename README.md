# progressive-blur

A production-grade **progressive blur**: stack of `backdrop-filter` layers masked by gradients, capped with a surface tint. It is the technique behind frosted sticky headers (ChatGPT, Figma, Linear, …) — the content under the bar blurs *more* the closer it gets to the edge.

- **Framework-agnostic core** — pure math, zero dependencies, SSR-safe.
- **React**, **Vue 3**, **vanilla DOM** and a **`<progressive-blur>` Web Component** — same options everywhere.
- **Zero-JS CSS drop-in** (`styles.css`) for anyone who just wants the effect.
- Accessible by default: respects `prefers-reduced-transparency` and `forced-colors`.
- Ships ESM + CJS + types (verified with `publint` and `@arethetypeswrong/cli`).

```
npm i progressive-blur
# or: pnpm add progressive-blur
```

## How it works

A single `backdrop-filter: blur()` is uniform. To get a *gradient of blur* you stack several layers, each with a bigger radius, and limit how far it reaches with a `mask-image` linear-gradient:

| layer | blur          | mask ramp                     |
| ----- | ------------- | ----------------------------- |
| 1     | `blur/8`      | `#000 75% → transparent 100%` |
| 2     | `blur/4`      | `#000 62.5% → transparent 87.5%` |
| 3     | `blur/2`      | `#000 50% → transparent 75%`  |
| 4     | `blur`        | `#000 37.5% → transparent 62.5%` |
| tint  | —             | `surface/60% → transparent`   |

With the defaults (`levels: 4`, `blur: 4`) that is `0.5 / 1 / 2 / 4px`. The ramp is fully parametric: for `N` layers the blur doubles per layer and the mask is staggered by `spread / (2N)`, so stronger layers reach a shorter distance.

The container is `pointer-events: none` and `aria-hidden`, so it never intercepts input or gets announced.

## React

```tsx
import { ProgressiveBlur } from 'progressive-blur/react';

export function Inbox() {
  return (
    <div className="relative h-[420px] overflow-y-auto">
      <ProgressiveBlur height={96} levels={4} blur={4} tint="var(--surface)" tintOpacity={0.6} />
      {/* sticky header + scrollable content */}
    </div>
  );
}
```

Drive it from scroll if you like — just animate `opacity`:

```tsx
<ProgressiveBlur opacity={scrollTop > 0 ? 1 : 0} style={{ transition: 'opacity .15s' }} />
```

## Vue 3

```vue
<script setup lang="ts">
import { ProgressiveBlur } from 'progressive-blur/vue';
</script>

<template>
  <div class="relative h-[420px] overflow-y-auto">
    <ProgressiveBlur :height="96" :levels="4" :blur="4" tint="var(--surface)" :tint-opacity="0.6" />
    <!-- content -->
  </div>
</template>
```

Props mirror the options below (kebab-case in templates). `useReducedTransparency()` is exported for custom logic. Extra attributes/`class`/`style` fall through to the container.

## Vanilla

```ts
import { createProgressiveBlur } from 'progressive-blur';

const blur = createProgressiveBlur({ direction: 'bottom', height: 72, tint: '#0d0d0d' });
scrollArea.append(blur.element);

blur.update({ blur: 8 }); // re-render with new options
blur.destroy();           // clean up + remove listeners
```

`renderProgressiveBlur(existingElement, options)` renders into an element you own.

## Web Component

```js
import 'progressive-blur/element'; // registers <progressive-blur>
```

```html
<div style="position: relative; overflow: auto; height: 420px">
  <progressive-blur height="96" levels="4" blur="4" tint="#fff" direction="top"></progressive-blur>
  <!-- content -->
</div>
```

Attributes mirror the options below; `position` and `z-index` control placement. The element re-renders when its attributes change.

## Pure CSS

```html
<link rel="stylesheet" href="progressive-blur/styles.css" />
<div class="pb" data-pb-edge="top">
  <div></div><div></div><div></div><div></div><div></div>
</div>
```

```css
.pb { --pb-height: 96px; --pb-blur: 4px; --pb-tint: #fff; --pb-tint-opacity: 60%; }
```

## API

### `ProgressiveBlurOptions`

| Option       | Type                  | Default     | Description                                                              |
| ------------ | --------------------- | ----------- | ------------------------------------------------------------------------ |
| `levels`     | `number`              | `4`         | Number of stacked blur layers (`1..12`).                                 |
| `blur`       | `number`              | `4`         | Blur radius (px) of the strongest layer.                                 |
| `height`     | `number`              | `96`        | Container size (px) along the fade axis.                                 |
| `direction`  | `'top' \| 'bottom'`   | `'top'`     | Edge the blur fades in from.                                             |
| `tint`       | `string \| false`     | `'#ffffff'` | Tint painted above the blur, or `false` to disable.                      |
| `tintOpacity`| `number`              | `0.6`       | Tint opacity at the strong edge (`0..1`).                                |
| `spread`     | `number`              | `1`         | Fraction of the container used by the mask ramp (`0.05..1`).             |

`ProgressiveBlurProps` additionally accepts `as`, `className`, `style`, `zIndex`, `opacity`, `position` and `respectReducedTransparency` (React) — the Vue component exposes the equivalent props.

### Exports

- `progressive-blur` — `computeProgressiveBlur`, `renderProgressiveBlur`, `createProgressiveBlur`, style/declaration helpers.
- `progressive-blur/core` — pure functions only (`computeProgressiveBlur`, `withAlpha`, `layerDeclarations`, `declarationsToStyle`, `toStyles`, …).
- `progressive-blur/react` — `<ProgressiveBlur>`, `useReducedTransparency`.
- `progressive-blur/vue` — `<ProgressiveBlur>` (Vue 3), `useReducedTransparency`.
- `progressive-blur/element` — `<progressive-blur>` custom element + `defineProgressiveBlur`.
- `progressive-blur/styles.css` — zero-JS drop-in.

### Key functions

```ts
computeProgressiveBlur(options): ProgressiveBlurModel
computeReducedTransparencyFallback(options): ProgressiveBlurModel
createProgressiveBlur(options): ProgressiveBlurHandle
renderProgressiveBlur(element, options): ProgressiveBlurModel
```

## Accessibility

Under `(prefers-reduced-transparency: reduce)` or `(forced-colors: active)` the blur layers are dropped and replaced by a single solid-to-transparent tint (set `respectReducedTransparency={false}` to opt out). The overlay is always `aria-hidden` and `pointer-events: none`.

## Performance

Each level is a compositor layer with a real `backdrop-filter`, which is not free. Prefer **4 levels** unless you truly need smoother ramps; keep the container at the actual bar height; and animate `opacity` (not `backdrop-filter`) when fading it in. On low-end devices consider lowering `levels` or switching to the solid-tint fallback.

## Browser support

Chromium, Safari and Firefox support `backdrop-filter` + `mask-image` (with `-webkit-` prefixes emitted automatically). Where `backdrop-filter` is unsupported the overlay degrades to the tint gradient. `backdrop-filter` requires the element to be composited over the content it blurs — put the overlay inside the scroll container.

## Development

```bash
pnpm install
pnpm dev          # React playground (./example)
pnpm dev:vue      # Vue playground (./example-vue)
pnpm test         # vitest
pnpm typecheck
pnpm build        # tsup → dist (ESM + CJS + d.ts)
pnpm verify       # typecheck + test + build + publint + attw
```

## License

MIT
