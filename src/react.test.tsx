import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { ProgressiveBlur } from './react';

function queryLayers(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-progressive-blur-layer]'));
}

describe('<ProgressiveBlur />', () => {
  it('renders four blur layers plus a tint layer by default', () => {
    const { container } = render(<ProgressiveBlur />);
    const root = container.querySelector<HTMLElement>('[data-progressive-blur]')!;

    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(queryLayers(container)).toHaveLength(5);

    const first = queryLayers(container)[0]!;
    expect(first.style.backdropFilter).toBe('blur(0.5px)');
    const mask = first.style.getPropertyValue('mask-image');
    expect(mask).toContain('linear-gradient');
    expect(mask).toContain('75%');
    expect(mask).toContain('transparent 100%');
    // the -webkit- alias must mirror the standard one
    expect(first.style.getPropertyValue('-webkit-mask-image')).toBe(mask);
  });

  it('applies container placement from props', () => {
    const { container } = render(
      <ProgressiveBlur direction="bottom" height={48} zIndex={42} opacity={0.5} />,
    );
    const root = container.querySelector<HTMLElement>('[data-progressive-blur]')!;

    expect(root.style.height).toBe('48px');
    expect(root.style.bottom).toBe('0px');
    expect(root.style.zIndex).toBe('42');
    expect(root.style.opacity).toBe('0.5');
    expect(root.style.top).toBe('');
  });

  it('omits the tint layer when tint is false', () => {
    const { container } = render(<ProgressiveBlur tint={false} />);
    expect(queryLayers(container)).toHaveLength(4);
  });

  it('forwards a ref and merges a custom style/className', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <ProgressiveBlur ref={ref} className="overlay" style={{ borderRadius: 12 }} />,
    );
    const root = container.querySelector<HTMLElement>('[data-progressive-blur]')!;

    expect(ref.current).toBe(root);
    expect(root).toHaveClass('overlay');
    expect(root.style.borderRadius).toBe('12px');
  });

  it('does not leak blur options to the DOM element', () => {
    const { container } = render(<ProgressiveBlur levels={6} blur={8} />);
    const root = container.querySelector<HTMLElement>('[data-progressive-blur]')!;
    expect(root.getAttribute('levels')).toBeNull();
    expect(root.getAttribute('blur')).toBeNull();
  });

  it('supports a custom element type via `as`', () => {
    const { container } = render(<ProgressiveBlur as="section" />);
    expect(container.firstElementChild!.tagName).toBe('SECTION');
    expect(queryLayers(container)).toHaveLength(5);
  });
});
