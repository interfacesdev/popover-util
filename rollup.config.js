import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

import pkg from './package.json';

const babelConfig = {
  babelHelpers: 'runtime',
  exclude: ['node_modules/**'],
};

export default [
  {
    input: 'src/index.js',
    output: {
      file: pkg.main,
      format: 'umd',
      name: 'popoverUtil',
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      babel(babelConfig),
      terser(),
    ],
  },
  {
    input: 'src/index.js',
    output: {
      file: pkg.module,
      format: 'es',
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      babel(babelConfig),
      terser(),
    ],
  },
];
