import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { ProgressiveBlur } from './vue';

function layers(wrapper: ReturnType<typeof mount>): Element[] {
  return Array.from(wrapper.element.querySelectorAll('[data-progressive-blur-layer]'));
}

describe('<ProgressiveBlur /> (Vue)', () => {
  it('renders four blur layers plus a tint layer by default', () => {
    const wrapper = mount(ProgressiveBlur);
    const root = wrapper.element as HTMLElement;

    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(layers(wrapper)).toHaveLength(5);

    const first = layers(wrapper)[0] as HTMLElement;
    expect(first.style.backdropFilter).toBe('blur(0.5px)');
    expect(first.style.getPropertyValue('mask-image')).toContain('75%');
  });

  it('applies container placement from props', () => {
    const wrapper = mount(ProgressiveBlur, {
      props: { direction: 'bottom', height: 48, zIndex: 42, opacity: 0.5 },
    });
    const root = wrapper.element as HTMLElement;

    expect(root.style.height).toBe('48px');
    expect(root.style.bottom).toBe('0px');
    expect(root.style.zIndex).toBe('42');
    expect(root.style.opacity).toBe('0.5');
  });

  it('omits the tint layer when tint is false', () => {
    const wrapper = mount(ProgressiveBlur, { props: { tint: false } });
    expect(layers(wrapper)).toHaveLength(4);
  });

  it('supports a custom element type via `as`', () => {
    const wrapper = mount(ProgressiveBlur, { props: { as: 'section' } });
    expect((wrapper.element as HTMLElement).tagName).toBe('SECTION');
  });

  it('forwards extra attributes to the container', () => {
    const wrapper = mount(ProgressiveBlur, { attrs: { 'data-testid': 'blur' } });
    expect((wrapper.element as HTMLElement).getAttribute('data-testid')).toBe('blur');
  });
});
