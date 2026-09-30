import {
  containerDeclarations,
  createRenderState,
  layerDeclarations,
  prefersReducedTransparency,
  REDUCED_TRANSPARENCY_QUERY,
  type ContainerOptions,
  type ProgressiveBlurDirection,
  type ProgressiveBlurLayer,
  type ProgressiveBlurModel,
  type ProgressiveBlurOptions,
} from './core';

const OBSERVED_ATTRIBUTES = [
  'levels',
  'blur',
  'height',
  'direction',
  'tint',
  'tint-opacity',
  'spread',
  'z-index',
  'position',
  'respect-reduced-transparency',
] as const;

function numberAttribute(element: Element, name: string): number | undefined {
  const raw = element.getAttribute(name);
  if (raw == null || raw === '') return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

/**
 * `<framed-blur>` custom element.
 *
 * ```html
 * <framed-blur height="96" levels="4" blur="4" tint="#fff" position="fixed"></framed-blur>
 * ```
 *
 * Attributes mirror `ProgressiveBlurOptions`; `position` and `z-index` control
 * placement. Importing `framed-blur/element` auto-registers the tag.
 */
export class ProgressiveBlurElement extends HTMLElement {
  static get observedAttributes(): readonly string[] {
    return OBSERVED_ATTRIBUTES;
  }

  private media: MediaQueryList | null = null;
  private readonly handleMediaChange = (): void => this.render();

  connectedCallback(): void {
    if (!this.media && typeof window !== 'undefined' && window.matchMedia) {
      this.media = window.matchMedia(REDUCED_TRANSPARENCY_QUERY);
      this.media.addEventListener('change', this.handleMediaChange);
    }
    this.render();
  }

  disconnectedCallback(): void {
    this.media?.removeEventListener('change', this.handleMediaChange);
    this.media = null;
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.render();
  }

  private options(): ProgressiveBlurOptions & ContainerOptions {
    const tintAttribute = this.getAttribute('tint');
    const direction = this.getAttribute('direction') as ProgressiveBlurDirection | null;
    const position = this.getAttribute('position') as ContainerOptions['position'] | null;

    return {
      levels: numberAttribute(this, 'levels'),
      blur: numberAttribute(this, 'blur'),
      height: numberAttribute(this, 'height'),
      spread: numberAttribute(this, 'spread'),
      tintOpacity: numberAttribute(this, 'tint-opacity'),
      direction: direction ?? undefined,
      tint: tintAttribute == null ? undefined : tintAttribute === 'false' ? false : tintAttribute,
      zIndex: numberAttribute(this, 'z-index'),
      position: position ?? 'absolute',
    };
  }

  private renderState(
    options: ProgressiveBlurOptions,
  ): { model: ProgressiveBlurModel; layers: readonly ProgressiveBlurLayer[] } {
    const respect = this.getAttribute('respect-reduced-transparency') !== 'false';
    return createRenderState(options, prefersReducedTransparency(), respect);
  }

  /** Re-renders the layer children from the current attributes. */
  render(): void {
    if (typeof document === 'undefined') return;
    const options = this.options();
    const { model, layers } = this.renderState(options);

    for (const [property, value] of containerDeclarations(model, options)) {
      this.style.setProperty(property, value);
    }
    this.setAttribute('data-framed-blur', '');
    this.setAttribute('aria-hidden', 'true');
    this.replaceChildren();

    for (const layer of layers) {
      const node = document.createElement('div');
      node.setAttribute('data-framed-blur-layer', layer.kind);
      for (const [property, value] of layerDeclarations(layer)) {
        node.style.setProperty(property, value);
      }
      this.appendChild(node);
    }
  }
}

/** Registers the `<framed-blur>` element (idempotent). */
export function defineProgressiveBlur(tag = 'framed-blur'): void {
  if (typeof customElements === 'undefined' || customElements.get(tag)) return;
  customElements.define(tag, ProgressiveBlurElement);
}

defineProgressiveBlur();

declare global {
  interface HTMLElementTagNameMap {
    'framed-blur': ProgressiveBlurElement;
  }
}
