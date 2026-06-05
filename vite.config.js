import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Inlines everything into one dist/index.html so Electron can load it
// from disk with no module-fetch issues. base './' keeps paths relative.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist', cssCodeSplit: false, assetsInlineLimit: 100000000 },
});
