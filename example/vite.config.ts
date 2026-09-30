import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const resolveFrom = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: resolveFrom('.'),
  plugins: [react()],
  resolve: {
    alias: {
      // Most specific first — Vite matches aliases in insertion order.
      'framed-blur/core': resolveFrom('../src/core.ts'),
      'framed-blur/react': resolveFrom('../src/react.tsx'),
      'framed-blur/element': resolveFrom('../src/element.ts'),
      'framed-blur/styles.css': resolveFrom('../styles.css'),
      'framed-blur': resolveFrom('../src/index.ts'),
    },
  },
  server: { port: 5178, open: false },
});
