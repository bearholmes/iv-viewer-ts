import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

const plugins = [
  resolve(),
  commonjs(),
  terser(),
  typescript(),
];

const tasks = [
  {
    input: 'src/index.ts',
    output: {
      name: 'iv-viewer',
      file: 'dist/iv-viewer-ts.js',
      sourcemap: true,
      format: 'cjs',
      exports: 'named',
    },
    plugins,
  },
];

export default tasks;
