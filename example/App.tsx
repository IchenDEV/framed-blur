import { createElement, useMemo, useState } from 'react';
import { ProgressiveBlur, type ProgressiveBlurProps } from 'framed-blur/react';
import { defineProgressiveBlur } from 'framed-blur/element';

// Register the <framed-blur> custom element (also auto-registers on import).
defineProgressiveBlur();

const ROWS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  title: [
    'Progressive blur is a stack of backdrop-filter layers',
    'Each layer doubles the blur radius',
    'A mask gradient limits how far each layer reaches',
    'A surface tint blends the band into the background',
    'This is the technique behind frosted sticky headers',
  ][i % 5]!,
  body: `Row ${String(i + 1).padStart(2, '0')} — Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
}));

type Options = Required<Pick<ProgressiveBlurProps, 'levels' | 'blur' | 'height' | 'direction'>> & {
  tint: string;
  tintOpacity: number;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
      <span style={{ opacity: 0.6 }}>{label}</span>
      {children}
    </label>
  );
}

export function App() {
  const [options, setOptions] = useState<Options>({
    levels: 4,
    blur: 4,
    height: 96,
    direction: 'top',
    tint: '#ffffff',
    tintOpacity: 0.6,
  });
  const [showHeader, setShowHeader] = useState(true);

  const set = <K extends keyof Options>(key: K, value: Options[K]): void =>
    setOptions((prev) => ({ ...prev, [key]: value }));

  const containerStyle = useMemo<React.CSSProperties>(() => ({
    position: 'relative',
    height: 420,
    overflowY: 'auto',
    borderRadius: 16,
    border: '1px solid var(--border)',
    background: 'var(--surface-2)',
  }), []);

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 96px', display: 'grid', gap: 24 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>framed-blur</h1>
        <p style={{ margin: 0, opacity: 0.65, maxWidth: 720 }}>
          A stack of <code>backdrop-filter</code> layers masked by gradients — the technique behind
          frosted sticky headers. Drag the sliders; the overlay re-renders live.
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 280px',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <div style={containerStyle} data-demo="react">
          <ProgressiveBlur
            levels={options.levels}
            blur={options.blur}
            height={options.height}
            direction={options.direction}
            tint={options.tint}
            tintOpacity={options.tintOpacity}
          />

          {showHeader ? (
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                fontWeight: 600,
              }}
            >
              <span>Inbox</span>
              <span style={{ opacity: 0.5, fontSize: 12 }}>sticky header</span>
            </div>
          ) : null}

          <ul style={{ margin: 0, padding: '8px 20px 20px', listStyle: 'none', display: 'grid', gap: 14 }}>
            {ROWS.map((row) => (
              <li
                key={row.id}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <strong style={{ display: 'block', marginBottom: 4 }}>{row.title}</strong>
                <span style={{ opacity: 0.65, fontSize: 13 }}>{row.body}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside
          style={{
            display: 'grid',
            gap: 14,
            padding: 18,
            borderRadius: 16,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
          }}
        >
          <Field label={`levels — ${options.levels}`}>
            <input
              type="range"
              min={1}
              max={8}
              value={options.levels}
              onChange={(e) => set('levels', Number(e.target.value))}
            />
          </Field>
          <Field label={`blur — ${options.blur}px`}>
            <input
              type="range"
              min={1}
              max={24}
              value={options.blur}
              onChange={(e) => set('blur', Number(e.target.value))}
            />
          </Field>
          <Field label={`height — ${options.height}px`}>
            <input
              type="range"
              min={24}
              max={220}
              value={options.height}
              onChange={(e) => set('height', Number(e.target.value))}
            />
          </Field>
          <Field label={`tint opacity — ${options.tintOpacity.toFixed(2)}`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={options.tintOpacity}
              onChange={(e) => set('tintOpacity', Number(e.target.value))}
            />
          </Field>
          <Field label="direction">
            <select
              value={options.direction}
              onChange={(e) => set('direction', e.target.value as Options['direction'])}
            >
              <option value="top">top</option>
              <option value="bottom">bottom</option>
            </select>
          </Field>
          <Field label="tint color">
            <input type="color" value={options.tint} onChange={(e) => set('tint', e.target.value)} />
          </Field>
          <Field label="sticky header">
            <input type="checkbox" checked={showHeader} onChange={(e) => setShowHeader(e.target.checked)} />
          </Field>

          <details>
            <summary style={{ cursor: 'pointer', fontSize: 12, opacity: 0.7 }}>Web component</summary>
            <div
              style={{
                position: 'relative',
                height: 160,
                marginTop: 10,
                overflowY: 'auto',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                fontSize: 12,
              }}
            >
              {createElement('framed-blur' as unknown as React.ElementType, {
                height: options.height,
                levels: options.levels,
                blur: options.blur,
                direction: options.direction,
                tint: options.tint,
                'tint-opacity': options.tintOpacity,
              })}
              <div style={{ padding: 14, display: 'grid', gap: 10 }}>
                {ROWS.slice(0, 12).map((row) => (
                  <div key={row.id} style={{ opacity: 0.7 }}>
                    {row.title}
                  </div>
                ))}
              </div>
            </div>
          </details>
        </aside>
      </section>
    </main>
  );
}
