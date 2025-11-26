import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { writeFileSync } from 'fs';
import { renderSync } from 'sass';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import postcss from 'postcss';

export default defineConfig({
  plugins: [
    dts({
      outDir: 'dist/types',
    }),
    {
      name: 'build-css',
      closeBundle: async () => {
        // Build CSS files
        const scss = renderSync({ file: './src/scss/build.scss' }).css.toString();

        // Unminified CSS
        const unminified = await postcss([autoprefixer()]).process(scss, { from: undefined });
        writeFileSync('./dist/iv-viewer-ts.css', unminified.css);

        // Minified CSS
        const minified = await postcss([autoprefixer(), cssnano()]).process(scss, {
          from: undefined,
        });
        writeFileSync('./dist/iv-viewer-ts.min.css', minified.css);
      },
    },
  ],
  resolve: {
    extensions: ['.ts'],
  },
  build: {
    target: 'es2015',
    lib: {
      entry: 'src/index.ts',
      name: 'ImageViewer',
      fileName: (format) => {
        if (format === 'es') return 'iv-viewer-ts.mjs';
        if (format === 'cjs') return 'iv-viewer-ts.js';
        if (format === 'umd') return 'iv-viewer-ts.umd.js';
        return `iv-viewer-ts.${format}.js`;
      },
      formats: ['es', 'cjs', 'umd'],
    },
    rollupOptions: {
      output: {
        exports: 'named',
        globals: {},
      },
    },
    outDir: 'dist',
    minify: 'terser',
    sourcemap: true,
  },
});
