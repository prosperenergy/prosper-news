import { build } from 'esbuild';
await build({ entryPoints: ['content/knowledge/battery-viewer.mjs'], bundle: true,
  format: 'esm', target: ['es2020'], minify: true, legalComments: 'eof',
  outfile: 'site/assets/kb-batteries-20260924.mjs' });
console.log('Built self-hosted 360-degree battery viewer.');
