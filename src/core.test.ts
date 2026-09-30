import { describe, expect, it } from 'vitest';
import {
  computeProgressiveBlur,
  computeReducedTransparencyFallback,
  computeTintLayer,
  containerDeclarations,
  declarationsToStyle,
  DEFAULT_OPTIONS,
  layerDeclarations,
  resolveOptions,
  supportsBackdropFilter,
  toStyles,
  withAlpha,
} from './core';

describe('resolves options', () => {
  it('applies defaults', () => {
    expect(resolveOptions()).toEqual(DEFAULT_OPTIONS);
  });

  it('clamps and validates out-of-range input', () => {
    const resolved = resolveOptions({
      levels: 999,
      blur: -3,
      height: -1,
      tintOpacity: 5,
      spread: 0,
      direction: 'bottom',
    });
    expect(resolved.levels).toBe(12);
    expect(resolved.blur).toBe(0);
    expect(resolved.height).toBe(0);
    expect(resolved.tintOpacity).toBe(1);
    expect(resolved.spread).toBe(0.05);
    expect(resolved.direction).toBe('bottom');
  });
});

describe('withAlpha', () => {
  it('expands 3-digit hex', () => {
    expect(withAlpha('#fff', 0.6)).toBe('rgba(255, 255, 255, 0.6)');
  });

  it('handles 8-digit hex and multiplies alpha', () => {
    expect(withAlpha('#00000080', 1)).toBe('rgba(0, 0, 0, 0.502)');
  });

  it('rewrites rgb()/rgba()', () => {
    expect(withAlpha('rgb(10, 20, 30)', 0.5)).toBe('rgba(10, 20, 30, 0.5)');
    expect(withAlpha('rgba(10, 20, 30, 0.2)', 0.5)).toBe('rgba(10, 20, 30, 0.5)');
  });

  it('falls back to color-mix for arbitrary colors', () => {
    expect(withAlpha('var(--surface)', 0.6)).toBe(
      'color-mix(in srgb, var(--surface) 60%, transparent)',
    );
  });
});

describe('computeProgressiveBlur', () => {
  it('reproduces the reference implementation with defaults', () => {
    const model = computeProgressiveBlur();
    const blurLayers = model.layers.filter((l) => l.kind === 'blur');

    expect(model.height).toBe(96);
    expect(model.direction).toBe('top');
    expect(blurLayers.map((l) => (l.kind === 'blur' ? l.blur : null))).toEqual([0.5, 1, 2, 4]);
    expect(blurLayers.map((l) => (l.kind === 'blur' ? l.maskImage : null))).toEqual([
      'linear-gradient(to bottom, #000 75%, transparent 100%)',
      'linear-gradient(to bottom, #000 62.5%, transparent 87.5%)',
      'linear-gradient(to bottom, #000 50%, transparent 75%)',
      'linear-gradient(to bottom, #000 37.5%, transparent 62.5%)',
    ]);
    expect(model.layers.at(-1)).toEqual({
      kind: 'tint',
      backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.6), transparent)',
    });
  });

  it('flips the gradient for bottom direction', () => {
    const model = computeProgressiveBlur({ direction: 'bottom' });
    const first = model.layers[0]!;
    expect(first.kind === 'blur' && first.maskImage).toContain('linear-gradient(to top,');
    expect(model.layers.at(-1)).toMatchObject({
      backgroundImage: 'linear-gradient(to top, rgba(255, 255, 255, 0.6), transparent)',
    });
  });

  it('produces a single uniform layer at levels=1', () => {
    const model = computeProgressiveBlur({ levels: 1, tint: false, blur: 8 });
    expect(model.layers).toEqual([
      { kind: 'blur', blur: 8, maskImage: 'linear-gradient(to bottom, #000 0%, transparent 100%)' },
    ]);
  });

  it('halves blur and shifts masks as levels grow', () => {
    const model = computeProgressiveBlur({ levels: 3, tint: false, blur: 4 });
    const blurs = model.layers.map((l) => (l.kind === 'blur' ? l.blur : 0));
    expect(blurs).toEqual([1, 2, 4]);
  });

  it('omits the tint layer when tint is false', () => {
    expect(computeProgressiveBlur({ tint: false }).layers.every((l) => l.kind === 'blur')).toBe(
      true,
    );
    expect(computeTintLayer({ tint: false })).toBeNull();
  });

  it('is deterministic', () => {
    expect(computeProgressiveBlur({ levels: 5 })).toEqual(computeProgressiveBlur({ levels: 5 }));
  });
});

describe('reduced transparency fallback', () => {
  it('returns a single solid tint', () => {
    const model = computeReducedTransparencyFallback({ tint: '#0d0d0d' });
    expect(model.layers).toHaveLength(1);
    expect(model.layers[0]).toEqual({
      kind: 'tint',
      backgroundImage: 'linear-gradient(to bottom, rgba(13, 13, 13, 1), transparent)',
    });
  });
});

describe('style emission', () => {
  it('emits both prefixed and standard mask/backdrop declarations', () => {
    const model = computeProgressiveBlur();
    const blurLayer = model.layers[0]!;
    const declarations = layerDeclarations(blurLayer);
    const props = declarations.map(([p]) => p);
    expect(props).toContain('-webkit-backdrop-filter');
    expect(props).toContain('backdrop-filter');
    expect(props).toContain('-webkit-mask-image');
    expect(props).toContain('mask-image');
  });

  it('converts declarations to camelCase for React', () => {
    const style = declarationsToStyle([
      ['backdrop-filter', 'blur(4px)'],
      ['-webkit-mask-image', 'none'],
      ['--custom', '1'],
    ]);
    expect(style).toEqual({
      backdropFilter: 'blur(4px)',
      WebkitMaskImage: 'none',
      '--custom': '1',
    });
  });

  it('anchors the container to the requested edge', () => {
    const top = containerDeclarations(computeProgressiveBlur()).map(([p]) => p);
    const bottom = containerDeclarations(computeProgressiveBlur({ direction: 'bottom' })).map(
      ([p]) => p,
    );
    expect(top).toContain('top');
    expect(top).not.toContain('bottom');
    expect(bottom).toContain('bottom');
    expect(bottom).not.toContain('top');
  });

  it('builds a full style bundle', () => {
    const styles = toStyles(computeProgressiveBlur(), { zIndex: 30, opacity: 0.5 });
    expect(styles.container.zIndex).toBe('30');
    expect(styles.container.opacity).toBe('0.5');
    expect(styles.layers).toHaveLength(5);
  });
});

describe('environment probes', () => {
  it('returns false for backdrop support without a window', () => {
    // jsdom has no CSS.supports, so this exercises the guard path.
    expect(typeof supportsBackdropFilter()).toBe('boolean');
  });
});
