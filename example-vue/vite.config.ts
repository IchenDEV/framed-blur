import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const resolveFrom = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: resolveFrom('.'),
  resolve: {
    alias: {
      'progressive-blur/vue': resolveFrom('../src/vue.ts'),
      'progressive-blur/core': resolveFrom('../src/core.ts'),
      'progressive-blur': resolveFrom('../src/index.ts'),
    },
  },
  server: { port: 5179, open: false },
});
