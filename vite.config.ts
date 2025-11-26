// vite.config.js
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      outDir: 'dist/types', // 원하는 폴더로 변경하세요
    }),
  ],
  resolve: {
    extensions: ['.ts'],
  },
  build: {
    target: 'es2015', // ES2015 (ES6) for better compatibility
    lib: {
      entry: 'src/index.ts',
      name: 'ImageViewer',
      fileName: (format) => {
        if (format === 'es') return 'iv-viewer-ts.mjs';
        if (format === 'umd') return 'iv-viewer-ts.umd.js';
        return `iv-viewer-ts.${format}.js`;
      },
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: {
        exports: 'named',
        // Ensure globals are defined for UMD build
        globals: {},
      },
    },
    outDir: 'dist',
    minify: 'terser',
    sourcemap: true,
  },
});
