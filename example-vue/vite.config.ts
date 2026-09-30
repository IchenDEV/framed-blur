import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const resolveFrom = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: resolveFrom('.'),
  resolve: {
    alias: {
      'framed-blur/vue': resolveFrom('../src/vue.ts'),
      'framed-blur/core': resolveFrom('../src/core.ts'),
      'framed-blur': resolveFrom('../src/index.ts'),
    },
  },
  server: { port: 5179, open: false },
});
