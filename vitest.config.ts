import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./client/src/test/setup.ts', './client/src/test/setup-vitest.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
      },
      include: ['./client/src/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      // Add support for Jest DOM matchers
      deps: {
        inline: [/^(?!.*vitest).*$/],
      },
    },
  })
);