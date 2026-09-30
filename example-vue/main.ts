import { createApp, defineComponent, h, ref } from 'vue';
import { ProgressiveBlur } from 'progressive-blur/vue';

const TITLES = [
  'Progressive blur is a stack of backdrop-filter layers',
  'Each layer doubles the blur radius',
  'A mask gradient limits how far each layer reaches',
  'A surface tint blends the band into the background',
];

const ROWS = Array.from({ length: 40 }, (_, i) => `Row ${String(i + 1).padStart(2, '0')}`);

const App = defineComponent({
  name: 'App',
  setup() {
    const height = ref(96);
    const direction = ref<'top' | 'bottom'>('top');

    return () =>
      h('main', { style: 'max-width:900px;margin:0 auto;padding:40px 24px;display:grid;gap:20px' }, [
        h('h1', { style: 'margin:0;font-size:26px' }, 'progressive-blur · Vue'),
        h('div', { style: 'display:flex;gap:16px;align-items:center;font-size:13px' }, [
          h('label', { style: 'display:flex;gap:8px;align-items:center' }, [
            `height ${height.value}px`,
            h('input', {
              type: 'range',
              min: 24,
              max: 220,
              value: height.value,
              onInput: (e: Event) => (height.value = Number((e.target as HTMLInputElement).value)),
            }),
          ]),
          h(
            'select',
            {
              value: direction.value,
              onChange: (e: Event) =>
                (direction.value = (e.target as HTMLSelectElement).value as 'top' | 'bottom'),
            },
            [h('option', { value: 'top' }, 'top'), h('option', { value: 'bottom' }, 'bottom')],
          ),
        ]),
        h(
          'div',
          {
            style:
              'position:relative;height:420px;overflow-y:auto;border-radius:16px;border:1px solid var(--border);background:var(--surface-2)',
          },
          [
            h(ProgressiveBlur, {
              height: height.value,
              levels: 4,
              blur: 4,
              direction: direction.value,
              tint: 'var(--surface)',
              tintOpacity: 0.6,
            }),
            h(
              'div',
              {
                style:
                  'position:sticky;top:0;z-index:30;padding:16px 20px;font-weight:600',
              },
              'Inbox',
            ),
            h(
              'ul',
              { style: 'margin:0;padding:8px 20px 20px;list-style:none;display:grid;gap:14px' },
              ROWS.map((row, i) =>
                h(
                  'li',
                  {
                    key: row,
                    style:
                      'padding:14px;border-radius:12px;background:var(--surface);border:1px solid var(--border)',
                  },
                  [h('strong', { style: 'display:block;margin-bottom:4px' }, TITLES[i % TITLES.length]), h('span', { style: 'opacity:.65;font-size:13px' }, row)],
                ),
              ),
            ),
          ],
        ),
      ]);
  },
});

createApp(App).mount('#root');
