/**
 * Vitest-only config (kept separate from `vite.config.ts` so `tsc -b` for the
 * app build does not depend on Vitest’s nested Vite type definitions).
 */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
})
