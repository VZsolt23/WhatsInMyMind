import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Vitest stubs CSS by default; the contrast test needs the real token file.
    css: { include: [/tokens\.css/] },
    coverage: {
      provider: 'v8',
      include: ['src/game/**', 'src/features/**', 'src/storage/**', 'src/lib/**', 'src/puzzles/**'],
      exclude: ['**/*.test.*', '**/*.json'],
    },
  },
});
