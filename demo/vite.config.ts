import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const resolveFrom = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

// Served from https://<user>.github.io/framed-blur/ in production.
const base = process.env.DEMO_BASE ?? '/framed-blur/';

export default defineConfig({
  base,
  root: resolveFrom('.'),
  plugins: [react()],
  resolve: {
    alias: {
      'framed-blur/core': resolveFrom('../src/core.ts'),
      'framed-blur/react': resolveFrom('../src/react.tsx'),
      'framed-blur/vue': resolveFrom('../src/vue.ts'),
      'framed-blur/element': resolveFrom('../src/element.ts'),
      'framed-blur/styles.css': resolveFrom('../styles.css'),
      'framed-blur': resolveFrom('../src/index.ts'),
    },
  },
  build: {
    outDir: resolveFrom('./dist'),
    emptyOutDir: true,
  },
  server: { port: 5182, open: false },
});
