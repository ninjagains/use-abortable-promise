import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

import pkg from './package.json';

const external = [...Object.keys(pkg.peerDependencies || {})];

const bundle = (config) => ({
  input: './src/index.ts',
  external,
  ...config,
});

export default [
  bundle({
    plugins: [
      esbuild({
        minify: true,
        target: 'es2015',
        define: {
          'process.env.NODE_ENV': JSON.stringify('production'),
        },
      }),
    ],
    output: [
      {
        file: pkg.main,
        format: 'cjs',
      },
      {
        file: pkg.module,
        format: 'es',
      },
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: pkg.types,
      format: 'es',
    },
  }),
];
