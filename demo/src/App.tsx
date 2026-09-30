import {
  createElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ProgressiveBlur, type ProgressiveBlurProps } from 'framed-blur/react';
import { defineProgressiveBlur } from 'framed-blur/element';

defineProgressiveBlur();

type Direction = 'top' | 'bottom';

interface Options {
  levels: number;
  blur: number;
  height: number;
  direction: Direction;
  tintOpacity: number;
  tint: string;
}

const PRESETS: Array<{ name: string; options: Options }> = [
  { name: 'Default', options: { levels: 4, blur: 4, height: 96, direction: 'top', tintOpacity: 0.6, tint: '#ffffff' } },
  { name: 'Subtle', options: { levels: 6, blur: 3, height: 64, direction: 'top', tintOpacity: 0.35, tint: '#ffffff' } },
  { name: 'Heavy frost', options: { levels: 8, blur: 12, height: 140, direction: 'top', tintOpacity: 0.75, tint: '#ffffff' } },
  { name: 'Bottom dock', options: { levels: 4, blur: 6, height: 88, direction: 'bottom', tintOpacity: 0.5, tint: '#ffffff' } },
  { name: 'Soft veil', options: { levels: 5, blur: 24, height: 220, direction: 'top', tintOpacity: 0.2, tint: '#ffffff' } },
];

const ROWS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  title: [
    'Progressive blur is a stack of backdrop-filter layers',
    'Each layer doubles the blur radius',
    'A mask gradient limits how far each layer reaches',
    'A surface tint blends the band into the background',
    'The overlay never steals pointer events',
  ][i % 5]!,
  body: `Row ${String(i + 1).padStart(2, '0')} — Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
}));

type SnippetKey = 'react' | 'vue' | 'element' | 'vanilla' | 'css';

function snippet(options: Options, key: SnippetKey): string {
  const props = `levels: ${options.levels}, blur: ${options.blur}, height: ${options.height}, direction: '${options.direction}', tintOpacity: ${options.tintOpacity}`;
  switch (key) {
    case 'react':
      return `import { ProgressiveBlur } from 'framed-blur/react';

export function Inbox() {
  return (
    <div className="relative h-[440px] overflow-y-auto">
      <ProgressiveBlur ${props.replace(/(\w+):/g, '$1=').replace(/(\w+)=([^,]+)/g, (m, k, v) => {
        const camel = k;
        const val = v.trim().startsWith("'") ? v.trim() : `{${v.trim()}}`;
        return `${camel}=${val}`;
      })} />
      <StickyHeader />
      <Feed />
    </div>
  );
}`;
    case 'vue':
      return `<script setup lang="ts">
import { ProgressiveBlur } from 'framed-blur/vue';
</script>

<template>
  <div class="relative h-[440px] overflow-y-auto">
    <ProgressiveBlur
      :levels="${options.levels}"
      :blur="${options.blur}"
      :height="${options.height}"
      direction="${options.direction}"
      :tint-opacity="${options.tintOpacity}"
    />
    <StickyHeader />
    <Feed />
  </div>
</template>`;
    case 'element':
      return `import 'framed-blur/element'; // registers <framed-blur>

<div style="position: relative; height: 440px; overflow-y: auto">
  <framed-blur
    height="${options.height}"
    levels="${options.levels}"
    blur="${options.blur}"
    direction="${options.direction}"
    tint-opacity="${options.tintOpacity}"
  ></framed-blur>
  <!-- sticky header + scrollable content -->
</div>`;
    case 'vanilla':
      return `import { createProgressiveBlur } from 'framed-blur';

const blur = createProgressiveBlur({
  levels: ${options.levels},
  blur: ${options.blur},
  height: ${options.height},
  direction: '${options.direction}',
  tintOpacity: ${options.tintOpacity},
});

scrollArea.append(blur.element);
// later
blur.destroy();`;
    case 'css':
      return `<link rel="stylesheet" href="framed-blur/styles.css" />

<div class="pb" data-pb-edge="${options.direction}" style="
  --pb-height: ${options.height}px;
  --pb-blur: ${options.blur}px;
  --pb-tint-opacity: ${Math.round(options.tintOpacity * 100)}%;
">
  <div></div><div></div><div></div><div></div><div></div>
</div>`;
  }
}

function highlight(code: string): string {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/(&#39;|')(.*?)\1/g, '<span class="tok-key">$1$2$1</span>')
    .replace(/\b(import|from|export|function|return|const|new|class|default)\b/g, '<span class="tok-key">$1</span>');
}

function DemoSurface({
  options,
  headerLabel,
  compact,
  children,
}: {
  options: Options;
  headerLabel: string;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = (): void => setScrolled(el.scrollTop > 4);
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const blurProps: ProgressiveBlurProps = {
    levels: options.levels,
    blur: options.blur,
    height: options.height,
    direction: options.direction,
    tint: options.tint,
    tintOpacity: options.tintOpacity,
    opacity: scrolled ? 1 : 0,
    style: { transition: 'opacity .18s ease' },
  };

  return (
    <div ref={scrollRef} className={`demo-scroll${compact ? ' compact' : ''}`}>
      <ProgressiveBlur {...blurProps} />
      <div className="sticky-bar">
        <span>{headerLabel}</span>
        <span className="bar-meta">{scrolled ? 'scrolled' : 'top'}</span>
      </div>
      {children ?? (
        <ul className="rows">
          {ROWS.map((row) => (
            <li key={row.id} className="row">
              <strong>{row.title}</strong>
              <span>{row.body}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function App() {
  const [options, setOptions] = useState<Options>(PRESETS[0]!.options);
  const [tab, setTab] = useState<SnippetKey>('react');

  const set = useCallback(<K extends keyof Options>(key: K, value: Options[K]): void => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  const code = useMemo(() => snippet(options, tab), [options, tab]);

  return (
    <div className="page">
      <header className="hero">
        <span className="eyebrow">framed-blur</span>
        <h1>Progressive blur for the web</h1>
        <p>
          A stack of <code>backdrop-filter</code> layers masked by gradients, capped with a surface
          tint — the technique behind frosted sticky headers. One API for React, Vue 3, vanilla DOM
          and a Web Component.
        </p>
        <div className="actions">
          <a className="btn btn-primary" href="https://www.npmjs.com/package/framed-blur">
            npm install framed-blur
          </a>
          <a className="btn" href="https://github.com/IchenDEV/framed-blur">
            GitHub
          </a>
        </div>
        <div className="pills">
          <span className="pill">zero-dependency core</span>
          <span className="pill">React</span>
          <span className="pill">Vue 3</span>
          <span className="pill">Web Component</span>
          <span className="pill">vanilla</span>
          <span className="pill">pure CSS</span>
          <span className="pill">reduced-transparency aware</span>
        </div>
      </header>

      <section className="section-head">
        <h2>Playground</h2>
        <p>Drag the controls — the overlay re-renders live. Scroll the panel to see the blur engaged.</p>
      </section>

      <div className="grid">
        <DemoSurface options={options} headerLabel="Inbox" />

        <div className="panel">
          <div className="controls">
            <div className="presets">
              {PRESETS.map((preset) => (
                <button key={preset.name} className="preset" onClick={() => setOptions(preset.options)}>
                  {preset.name}
                </button>
              ))}
            </div>

            <label className="control">
              <span className="label">
                levels <b>{options.levels}</b>
              </span>
              <input
                type="range"
                min={1}
                max={8}
                value={options.levels}
                onChange={(e) => set('levels', Number(e.target.value))}
              />
            </label>
            <label className="control">
              <span className="label">
                blur <b>{options.blur}px</b>
              </span>
              <input
                type="range"
                min={1}
                max={24}
                value={options.blur}
                onChange={(e) => set('blur', Number(e.target.value))}
              />
            </label>
            <label className="control">
              <span className="label">
                height <b>{options.height}px</b>
              </span>
              <input
                type="range"
                min={24}
                max={240}
                value={options.height}
                onChange={(e) => set('height', Number(e.target.value))}
              />
            </label>
            <label className="control">
              <span className="label">
                tint opacity <b>{options.tintOpacity.toFixed(2)}</b>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={options.tintOpacity}
                onChange={(e) => set('tintOpacity', Number(e.target.value))}
              />
            </label>
            <label className="control">
              <span className="label">
                direction <b>{options.direction}</b>
              </span>
              <select value={options.direction} onChange={(e) => set('direction', e.target.value as Direction)}>
                <option value="top">top</option>
                <option value="bottom">bottom</option>
              </select>
            </label>
            <label className="control">
              <span className="label">
                tint color <b>{options.tint}</b>
              </span>
              <input type="color" value={options.tint} onChange={(e) => set('tint', e.target.value)} />
            </label>
          </div>
        </div>
      </div>

      <section className="section-head">
        <h2>Use it anywhere</h2>
        <p>The same options across five entry points.</p>
      </section>

      <div className="code">
        <div className="code-tabs" role="tablist">
          {(['react', 'vue', 'element', 'vanilla', 'css'] as SnippetKey[]).map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              className="code-tab"
              onClick={() => setTab(key)}
            >
              {key}
            </button>
          ))}
        </div>
        <pre dangerouslySetInnerHTML={{ __html: highlight(code) }} />
      </div>

      <section className="section-head">
        <h2>Presets</h2>
        <p>Five recipes — click to apply the last one, or tune your own above.</p>
      </section>

      <div className="matrix">
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            className="mini"
            onClick={() => setOptions(preset.options)}
            title={`Apply "${preset.name}"`}
          >
            <div className="mini-head">
              <ProgressiveBlur
                levels={preset.options.levels}
                blur={preset.options.blur}
                height={preset.options.height}
                direction={preset.options.direction}
                tint={preset.options.tint}
                tintOpacity={preset.options.tintOpacity}
              />
              <ul className="rows" style={{ padding: '8px 12px' }}>
                {ROWS.slice(0, 10).map((row) => (
                  <li key={row.id} className="row" style={{ padding: '8px 10px' }}>
                    <strong style={{ fontSize: 12 }}>{row.title}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mini-body">
              <span>{preset.name}</span>
              <span>
                {preset.options.levels}× / {preset.options.blur}px
              </span>
            </div>
          </button>
        ))}
      </div>

      <section className="section-head">
        <h2>Web Component</h2>
        <p>
          The <code>&lt;framed-blur&gt;</code> element, registered from{' '}
          <code>framed-blur/element</code> — no framework required.
        </p>
      </section>

      <div className="panel">
        <div className="demo-scroll compact">
          {createElement('framed-blur' as unknown as React.ElementType, {
            height: options.height,
            levels: options.levels,
            blur: options.blur,
            direction: options.direction,
            tint: options.tint,
            'tint-opacity': options.tintOpacity,
          })}
          <div style={{ padding: '14px 20px', display: 'grid', gap: 12 }}>
            {ROWS.slice(0, 14).map((row) => (
              <div key={row.id} className="row">
                <strong>{row.title}</strong>
                <span>{row.body}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer>
        <span>
          MIT · <a href="https://github.com/IchenDEV/framed-blur">source</a> ·{' '}
          <a href="https://www.npmjs.com/package/framed-blur">npm</a>
        </span>
        <span>
          Technique studied from the ChatGPT desktop app&rsquo;s progressive-blur header.
        </span>
      </footer>
    </div>
  );
}
