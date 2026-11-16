import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    include: ['packages/domain/**/*.test.ts', 'src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@domain': fileURLToPath(new URL('./packages/domain/src', import.meta.url)),
    },
  },
});
