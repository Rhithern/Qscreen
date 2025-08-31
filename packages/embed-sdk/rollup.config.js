import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const version = process.env.npm_package_version || '1.0.0';

export default [
  // UMD build (for CDN and global usage)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/embed.js',
      format: 'umd',
      name: 'QscreenInterview',
      sourcemap: true,
      banner: `/* @qscreen/embed-sdk v${version} */`,
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
      }),
    ],
    external: ['react', 'react-dom'],
  },
  // Minified UMD build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/embed.min.js',
      format: 'umd',
      name: 'QscreenInterview',
      sourcemap: true,
      banner: `/* @qscreen/embed-sdk v${version} */`,
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
      }),
      terser(),
    ],
    external: ['react', 'react-dom'],
  },
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/embed.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
      }),
    ],
    external: ['react', 'react-dom'],
  },
];
