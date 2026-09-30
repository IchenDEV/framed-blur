import {
  computed,
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  type PropType,
  type StyleValue,
} from 'vue';
import {
  containerDeclarations,
  createRenderState,
  declarationsToStyle,
  layerDeclarations,
  REDUCED_TRANSPARENCY_QUERY,
  type ContainerOptions,
  type ProgressiveBlurDirection,
} from './core';

/**
 * Reactive `prefers-reduced-transparency` / `forced-colors` detector.
 * Returns `false` during SSR and on the first client render, then reconciles.
 */
export function useReducedTransparency() {
  const reduced = ref(false);
  let media: MediaQueryList | null = null;

  const update = (): void => {
    reduced.value = media?.matches ?? false;
  };

  onMounted(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    media = window.matchMedia(REDUCED_TRANSPARENCY_QUERY);
    update();
    media.addEventListener('change', update);
  });

  onUnmounted(() => {
    media?.removeEventListener('change', update);
    media = null;
  });

  return reduced;
}

/**
 * Progressive-blur overlay for Vue 3.
 *
 * ```vue
 * <script setup lang="ts">
 * import { ProgressiveBlur } from 'progressive-blur/vue';
 * </script>
 *
 * <template>
 *   <div class="relative overflow-y-auto h-[420px]">
 *     <ProgressiveBlur :height="96" :levels="4" :blur="4" tint="var(--surface)" :tint-opacity="0.6" />
 *     <!-- content -->
 *   </div>
 * </template>
 * ```
 */
export const ProgressiveBlur = defineComponent({
  name: 'ProgressiveBlur',
  inheritAttrs: false,
  props: {
    levels: { type: Number, default: undefined },
    blur: { type: Number, default: undefined },
    height: { type: Number, default: undefined },
    direction: { type: String as PropType<ProgressiveBlurDirection>, default: undefined },
    tint: { type: [String, Boolean] as PropType<string | false>, default: '#ffffff' },
    tintOpacity: { type: Number, default: undefined },
    spread: { type: Number, default: undefined },
    zIndex: { type: Number, default: undefined },
    opacity: { type: Number, default: undefined },
    position: { type: String as PropType<ContainerOptions['position']>, default: undefined },
    respectReducedTransparency: { type: Boolean, default: true },
    as: { type: String, default: 'div' },
  },
  setup(props, { attrs }) {
    const reduced = useReducedTransparency();

    const state = computed(() =>
      createRenderState(
        {
          levels: props.levels,
          blur: props.blur,
          height: props.height,
          direction: props.direction,
          tint: props.tint,
          tintOpacity: props.tintOpacity,
          spread: props.spread,
        },
        reduced.value,
        props.respectReducedTransparency,
      ),
    );

    const containerStyle = computed<Record<string, string>>(() =>
      declarationsToStyle(
        containerDeclarations(state.value.model, {
          zIndex: props.zIndex,
          opacity: props.opacity,
          position: props.position,
        }),
      ),
    );

    return () =>
      h(
        props.as,
        {
          ...attrs,
          'aria-hidden': 'true',
          'data-progressive-blur': '',
          'data-progressive-blur-reduced': reduced.value ? '' : undefined,
          style: [containerStyle.value, attrs.style] as StyleValue,
        },
        state.value.layers.map((layer, index) =>
          h('div', {
            key: index,
            'data-progressive-blur-layer': layer.kind,
            style: declarationsToStyle(layerDeclarations(layer)),
          }),
        ),
      );
  },
});
