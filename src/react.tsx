import * as React from 'react';
import {
  containerDeclarations,
  createRenderState,
  declarationsToStyle,
  layerDeclarations,
  REDUCED_TRANSPARENCY_QUERY,
  type ContainerOptions,
  type ProgressiveBlurOptions,
} from './core';

export interface ProgressiveBlurProps extends ProgressiveBlurOptions, ContainerOptions {
  /** Element type for the container. Default `'div'`. */
  as?: React.ElementType;
  className?: string;
  /** Merged onto the container after the placement styles. */
  style?: React.CSSProperties;
  /**
   * When `true` (default), swaps to a solid tint if the user prefers reduced
   * transparency or the browser is in forced-colors mode.
   */
  respectReducedTransparency?: boolean;
}

/**
 * Returns `true` when the user asks for reduced transparency / forced colors.
 * SSR-safe (renders `false` on the server, reconciles on mount).
 */
export function useReducedTransparency(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(REDUCED_TRANSPARENCY_QUERY);
    const update = (): void => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
}

/**
 * The progressive-blur overlay as a React component.
 *
 * Place it inside a positioned surface (a `position: relative` scroll area),
 * anchored to the edge you are fading from.
 *
 * ```tsx
 * <div className="relative h-96 overflow-y-auto">
 *   <ProgressiveBlur height={96} levels={4} blur={4} tint="var(--surface)" tintOpacity={0.6} />
 *   ...content...
 * </div>
 * ```
 */
export const ProgressiveBlur = React.forwardRef<HTMLElement, ProgressiveBlurProps>(
  function ProgressiveBlur(props, ref) {
    const {
      as: Component = 'div',
      className,
      style,
      zIndex,
      opacity,
      position,
      respectReducedTransparency = true,
      ...options
    } = props;

    const { levels, blur, height, direction, tint, tintOpacity, spread } = options;

    const reduced = useReducedTransparency();

    const { model, layers } = React.useMemo(
      () =>
        createRenderState(
          { levels, blur, height, direction, tint, tintOpacity, spread },
          reduced,
          respectReducedTransparency,
        ),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [levels, blur, height, direction, tint, tintOpacity, spread, reduced, respectReducedTransparency],
    );

    const containerStyle = React.useMemo(
      () => declarationsToStyle(containerDeclarations(model, { zIndex, opacity, position })),
      [model, zIndex, opacity, position],
    );

    return React.createElement(
      Component,
      {
        ref,
        className,
        'data-progressive-blur': '',
        'data-progressive-blur-reduced': reduced ? '' : undefined,
        'aria-hidden': 'true',
        style: { ...containerStyle, ...style },
      },
      layers.map((layer, index) =>
        React.createElement('div', {
          key: index,
          'data-progressive-blur-layer': layer.kind,
          style: declarationsToStyle(layerDeclarations(layer)),
        }),
      ),
    );
  },
);
