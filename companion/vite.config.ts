import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: ["tests/**"],
    globals: true,
    include: ["src/**/*.spec.ts", "src/**/*.spec.tsx", "src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: './src/test/setup.ts',
  },
})
