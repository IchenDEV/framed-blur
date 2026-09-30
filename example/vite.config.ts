import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const resolveFrom = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: resolveFrom('.'),
  plugins: [react()],
  resolve: {
    alias: {
      'progressive-blur/core': resolveFrom('../src/core.ts'),
      'progressive-blur/react': resolveFrom('../src/react.tsx'),
      'progressive-blur/element': resolveFrom('../src/element.ts'),
      'progressive-blur/styles.css': resolveFrom('../styles.css'),
      'progressive-blur': resolveFrom('../src/index.ts'),
    },
  },
  server: { port: 5178, open: false },
});
