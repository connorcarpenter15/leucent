import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    globals: true,
    // jose's WebCrypto path expects the host Uint8Array. jsdom installs its
    // own Uint8Array, which crashes with "payload must be an instance of
    // Uint8Array". Lib helpers run in plain Node so they hit the right one.
    environmentMatchGlobs: [['test/lib/**', 'node']],
  },
});
