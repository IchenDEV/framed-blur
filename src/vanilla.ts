import {
  containerDeclarations,
  createRenderState,
  layerDeclarations,
  prefersReducedTransparency,
  REDUCED_TRANSPARENCY_QUERY,
  type ContainerOptions,
  type ProgressiveBlurModel,
  type ProgressiveBlurOptions,
} from './core';

export interface CreateProgressiveBlurOptions extends ProgressiveBlurOptions, ContainerOptions {
  /** Extra class name(s) for the container element. */
  className?: string;
  /** `id` for the container element. */
  id?: string;
  /**
   * When `true` (default) the component swaps to a solid tint if the user
   * prefers reduced transparency or the browser is in forced-colors mode.
   */
  respectReducedTransparency?: boolean;
}

function applyDeclarations(
  element: HTMLElement,
  declarations: ReturnType<typeof containerDeclarations>,
): void {
  for (const [property, value] of declarations) {
    element.style.setProperty(property, value);
  }
}

/**
 * Renders the framed-blur layers into an existing element.
 *
 * The element becomes the container: its position/height/z-index are set, and
 * one child `<div>` is created per blur (and tint) layer. Existing children are
 * removed. Returns the resolved model so callers can inspect/react to it.
 */
export function renderProgressiveBlur(
  container: HTMLElement,
  options: CreateProgressiveBlurOptions = {},
): ProgressiveBlurModel {
  const { model, layers } = createRenderState(
    options,
    prefersReducedTransparency(),
    options.respectReducedTransparency ?? true,
  );

  applyDeclarations(container, containerDeclarations(model, options));
  container.setAttribute('data-framed-blur', '');
  container.setAttribute('aria-hidden', 'true');
  container.replaceChildren();

  for (const layer of layers) {
    const node = container.ownerDocument.createElement('div');
    node.setAttribute('data-framed-blur-layer', layer.kind);
    applyDeclarations(node, layerDeclarations(layer));
    container.appendChild(node);
  }

  return model;
}

export interface ProgressiveBlurHandle {
  /** The container element. Append it to your (relatively positioned) surface. */
  readonly element: HTMLDivElement;
  /** Re-renders with merged options. */
  update(options?: Partial<CreateProgressiveBlurOptions>): void;
  /** Removes the element and any listeners. */
  destroy(): void;
}

/**
 * Imperatively creates a framed-blur overlay.
 *
 * ```ts
 * const blur = createProgressiveBlur({ height: 96, levels: 4, blur: 4 });
 * scrollArea.append(blur.element);
 * // later: blur.destroy();
 * ```
 */
export function createProgressiveBlur(options: CreateProgressiveBlurOptions = {}): ProgressiveBlurHandle {
  const current: CreateProgressiveBlurOptions = { ...options };
  const element = document.createElement('div');
  if (current.id) element.id = current.id;
  if (current.className) element.className = current.className;

  renderProgressiveBlur(element, current);

  let media: MediaQueryList | null = null;
  const onMediaChange = () => renderProgressiveBlur(element, current);

  if (current.respectReducedTransparency !== false && typeof window !== 'undefined' && window.matchMedia) {
    media = window.matchMedia(REDUCED_TRANSPARENCY_QUERY);
    media.addEventListener('change', onMediaChange);
  }

  return {
    element,
    update(next) {
      Object.assign(current, next);
      renderProgressiveBlur(element, current);
    },
    destroy() {
      media?.removeEventListener('change', onMediaChange);
      element.remove();
    },
  };
}
