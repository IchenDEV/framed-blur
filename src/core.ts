/**
 * framed-blur — framework-agnostic core.
 *
 * Pure, DOM-free math that turns a handful of options into the declarative
 * description of a progressive blur: a stack of `backdrop-filter` layers whose
 * strength doubles layer by layer and whose visibility is limited by a
 * vertical `mask-image` gradient, capped with a surface tint.
 *
 * This file has no runtime dependencies and never touches `window`/`document`,
 * so it is safe to import from SSR, workers or build tooling.
 */

/** Which edge the blur fades in from. */
export type ProgressiveBlurDirection = 'top' | 'bottom';

export interface ProgressiveBlurOptions {
  /**
   * Number of stacked blur layers. More layers = smoother ramp at the cost of
   * more GPU work. Clamped to `1..12`. Default `4` (matches the reference
   * implementation).
   */
  levels?: number;
  /**
   * Blur radius, in px, of the strongest layer. Weaker layers are derived by
   * halving (`blur`, `blur/2`, `blur/4`, …). Default `4`.
   */
  blur?: number;
  /** Container size along the fade axis, in px. Default `96`. */
  height?: number;
  /** Edge the blur fades in from. Default `'top'`. */
  direction?: ProgressiveBlurDirection;
  /**
   * Tint painted on top of the blur so it blends into the surface behind it.
   * Any CSS color, or `false` to disable. Default `'#ffffff'`.
   */
  tint?: string | false;
  /** Opacity of the tint at the strong edge, `0..1`. Default `0.6`. */
  tintOpacity?: number;
  /**
   * Fraction of the container used by the mask ramp, `0.05..1`. `1` reaches the
   * full height. Default `1`.
   */
  spread?: number;
}

export interface ProgressiveBlurBlurLayer {
  readonly kind: 'blur';
  /** Blur radius in px. */
  readonly blur: number;
  /** `mask-image` value that limits where this layer is visible. */
  readonly maskImage: string;
}

export interface ProgressiveBlurTintLayer {
  readonly kind: 'tint';
  /** `background` value (a gradient from the tint to transparent). */
  readonly backgroundImage: string;
}

export type ProgressiveBlurLayer = ProgressiveBlurBlurLayer | ProgressiveBlurTintLayer;

export interface ProgressiveBlurModel {
  readonly direction: ProgressiveBlurDirection;
  readonly height: number;
  /** Blur layers (weakest → strongest) followed by the optional tint layer. */
  readonly layers: readonly ProgressiveBlurLayer[];
}

/** A single `[css-property, value]` pair, always in kebab-case. */
export type CSSDeclaration = readonly [property: string, value: string];

/** Media query used to detect when blur should be replaced by a solid tint. */
export const REDUCED_TRANSPARENCY_QUERY =
  '(prefers-reduced-transparency: reduce), (forced-colors: active)';

export const DEFAULT_OPTIONS = Object.freeze({
  levels: 4,
  blur: 4,
  height: 96,
  direction: 'top',
  tint: '#ffffff',
  tintOpacity: 0.6,
  spread: 1,
} satisfies Required<ProgressiveBlurOptions>);

const MAX_LEVELS = 12;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals = 3): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function percent(ratio: number): string {
  return `${round(ratio * 100, 4)}%`;
}

/**
 * Applies an alpha channel to a CSS color.
 *
 * Handles `#rgb` / `#rgba` / `#rrggbb` / `#rrggbbaa` and `rgb()` / `rgba()`.
 * Anything else (e.g. `var(--x)`, `oklch()`, named colors) falls back to
 * `color-mix()`, which is the same strategy the reference implementation uses.
 */
export function withAlpha(color: string, alpha: number): string {
  const a = round(clamp(alpha, 0, 1), 4);
  const input = color.trim();

  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(input);
  if (hex) {
    let digits = hex[1]!;
    if (digits.length === 3 || digits.length === 4) {
      digits = digits
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const r = parseInt(digits.slice(0, 2), 16);
    const g = parseInt(digits.slice(2, 4), 16);
    const b = parseInt(digits.slice(4, 6), 16);
    const base = digits.length === 8 ? parseInt(digits.slice(6, 8), 16) / 255 : 1;
    return `rgba(${r}, ${g}, ${b}, ${round(a * base, 4)})`;
  }

  const rgb = /^rgba?\(\s*([^)]+?)\s*\)$/i.exec(input);
  if (rgb) {
    const parts = rgb[1]!.split(/[\s,/]+/).filter(Boolean);
    const [r, g, b] = parts;
    if (r && g && b) return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  return `color-mix(in srgb, ${input} ${round(a * 100, 3)}%, transparent)`;
}

/** Normalizes and validates raw options. */
export function resolveOptions(options: ProgressiveBlurOptions = {}): Required<ProgressiveBlurOptions> {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  // `??` (not the spread alone) so callers can pass explicit `undefined`
  // without wiping out the defaults — e.g. React props that were not set.
  return {
    levels: clamp(Math.round(merged.levels ?? DEFAULT_OPTIONS.levels), 1, MAX_LEVELS),
    blur: Math.max(0, merged.blur ?? DEFAULT_OPTIONS.blur),
    height: Math.max(0, merged.height ?? DEFAULT_OPTIONS.height),
    direction: (merged.direction ?? DEFAULT_OPTIONS.direction) === 'bottom' ? 'bottom' : 'top',
    tint: merged.tint ?? DEFAULT_OPTIONS.tint,
    tintOpacity: clamp(merged.tintOpacity ?? DEFAULT_OPTIONS.tintOpacity, 0, 1),
    spread: clamp(merged.spread ?? DEFAULT_OPTIONS.spread, 0.05, 1),
  };
}

function gradientDirection(direction: ProgressiveBlurDirection): string {
  return direction === 'top' ? 'to bottom' : 'to top';
}

/** Builds just the tint layer (or `null` when tinting is disabled). */
export function computeTintLayer(options: ProgressiveBlurOptions = {}): ProgressiveBlurTintLayer | null {
  const { tint, tintOpacity, direction } = resolveOptions(options);
  if (tint === false) return null;
  const color = withAlpha(tint || '#ffffff', tintOpacity);
  return {
    kind: 'tint',
    backgroundImage: `linear-gradient(${gradientDirection(direction)}, ${color}, transparent)`,
  };
}

/**
 * Computes the full framed-blur model.
 *
 * The ramp is fully parametric. For `N` layers:
 *   - layer `i` (0 = weakest) has `blur = maxBlur / 2^(N-1-i)`
 *   - each mask spans `spread/N` of the height and is staggered by half that,
 *     so stronger layers reach a shorter distance from the edge.
 *
 * With the defaults (`levels: 4, blur: 4`) this reproduces the reference
 * design exactly: blurs `0.5 / 1 / 2 / 4px` with mask stops
 * `75% / 62.5% / 50% / 37.5%`.
 */
export function computeProgressiveBlur(options: ProgressiveBlurOptions = {}): ProgressiveBlurModel {
  const resolved = resolveOptions(options);
  const { levels, blur, height, direction, spread } = resolved;

  const gradient = gradientDirection(direction);
  const span = spread / levels;
  const shift = span / 2;

  const layers: ProgressiveBlurLayer[] = [];
  for (let i = 0; i < levels; i++) {
    const layerBlur = blur / 2 ** (levels - 1 - i);
    const from = clamp(1 - span - i * shift, 0, 1);
    const to = clamp(1 - i * shift, 0, 1);
    layers.push({
      kind: 'blur',
      blur: round(layerBlur),
      maskImage: `linear-gradient(${gradient}, #000 ${percent(from)}, transparent ${percent(to)})`,
    });
  }

  const tint = computeTintLayer(resolved);
  if (tint) layers.push(tint);

  return { direction, height, layers };
}

/**
 * Solid-tint-only model used when the user prefers reduced transparency or the
 * browser is in forced-colors mode. Blur layers are dropped entirely.
 */
export function computeReducedTransparencyFallback(
  options: ProgressiveBlurOptions = {},
): ProgressiveBlurModel {
  const resolved = resolveOptions(options);
  const tint = computeTintLayer({ ...resolved, tintOpacity: 1 }) ?? {
    kind: 'tint' as const,
    backgroundImage: `linear-gradient(${gradientDirection(resolved.direction)}, ${resolved.tint || '#ffffff'}, transparent)`,
  };
  return { direction: resolved.direction, height: resolved.height, layers: [tint] };
}

/** CSS declarations for a single layer, in kebab-case. */
export function layerDeclarations(layer: ProgressiveBlurLayer): CSSDeclaration[] {
  const base: CSSDeclaration[] = [
    ['position', 'absolute'],
    ['inset', '0'],
    ['pointer-events', 'none'],
  ];
  if (layer.kind === 'blur') {
    const blurValue = `blur(${layer.blur}px)`;
    return [
      ...base,
      ['-webkit-backdrop-filter', blurValue],
      ['backdrop-filter', blurValue],
      ['-webkit-mask-image', layer.maskImage],
      ['mask-image', layer.maskImage],
    ];
  }
  return [...base, ['background', layer.backgroundImage]];
}

export interface ContainerOptions {
  /** CSS `position`. Default `'absolute'`. */
  position?: 'absolute' | 'fixed' | 'relative' | 'sticky';
  /** Stacking order. Default `20`. */
  zIndex?: number;
  /** Optional opacity, e.g. driven by scroll. Default omitted (1). */
  opacity?: number;
}

/** CSS declarations for the container, in kebab-case. */
export function containerDeclarations(
  model: ProgressiveBlurModel,
  options: ContainerOptions = {},
): CSSDeclaration[] {
  const edge = model.direction === 'top' ? 'top' : 'bottom';
  const declarations: CSSDeclaration[] = [
    ['position', options.position ?? 'absolute'],
    ['left', '0'],
    ['right', '0'],
    [edge, '0'],
    ['height', `${model.height}px`],
    ['pointer-events', 'none'],
    ['z-index', String(options.zIndex ?? 20)],
  ];
  if (options.opacity != null) declarations.push(['opacity', String(options.opacity)]);
  return declarations;
}

/** Converts a declaration list to a style object with camelCase keys (React-friendly). */
export function declarationsToStyle(
  declarations: readonly CSSDeclaration[],
): Record<string, string> {
  const style: Record<string, string> = {};
  for (const [property, value] of declarations) {
    if (property.startsWith('--')) {
      style[property] = value;
      continue;
    }
    style[property.replace(/-([a-z])/g, (_match, char: string) => char.toUpperCase())] = value;
  }
  return style;
}

/** Whether the current environment can render `backdrop-filter`. */
export function supportsBackdropFilter(): boolean {
  if (typeof window === 'undefined') return false;
  const value = '-webkit-backdrop-filter';
  return (
    window.CSS?.supports?.('backdrop-filter', 'blur(1px)') ||
    window.CSS?.supports?.(value, 'blur(1px)') ||
    typeof (window as unknown as { WebKitCSSMatrix?: unknown }).WebKitCSSMatrix !== 'undefined'
  );
}

/** Whether the user currently asks for reduced transparency / forced colors. */
export function prefersReducedTransparency(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(REDUCED_TRANSPARENCY_QUERY).matches;
}

export interface ProgressiveBlurRenderState {
  /** The full model (blur layers + tint) — use this for container placement. */
  readonly model: ProgressiveBlurModel;
  /**
   * The layers to actually render: the model's layers, or a single solid tint
   * when reduced transparency is requested and respected.
   */
  readonly layers: readonly ProgressiveBlurLayer[];
}

/**
 * Shared bridge between the core and the renderers (React / Vue / vanilla /
 * Web Component): it picks the effective layer set for the current environment.
 */
export function createRenderState(
  options: ProgressiveBlurOptions = {},
  reduced = false,
  respectReducedTransparency = true,
): ProgressiveBlurRenderState {
  const model = computeProgressiveBlur(options);
  const layers =
    respectReducedTransparency && reduced
      ? computeReducedTransparencyFallback(options).layers
      : model.layers;
  return { model, layers };
}

export interface ProgressiveBlurStyles {
  container: Record<string, string>;
  layers: Array<Record<string, string>>;
}

/** Convenience: full inline-style bundle for a model (used by the vanilla/React renderers). */
export function toStyles(
  model: ProgressiveBlurModel,
  options: ContainerOptions = {},
): ProgressiveBlurStyles {
  return {
    container: declarationsToStyle(containerDeclarations(model, options)),
    layers: model.layers.map((layer) => declarationsToStyle(layerDeclarations(layer))),
  };
}
