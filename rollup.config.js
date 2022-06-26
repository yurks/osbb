import 'dotenv/config';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import html from '@rollup/plugin-html';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import ejs from 'rollup-plugin-ejs';
import { minify } from 'html-minifier';
import { extname } from 'path';
import postcss from 'rollup-plugin-postcss';
import postcssImport from 'postcss-import';
import pkg from './package.json';

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

const replaceOptions = {
  preventAssignment: true,
  values: Object.entries(process.env).reduce(
    (o, [key, value]) => {
      o[`process.env.${key}`] = JSON.stringify(value);
      return o;
    },
    {
      'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
      'process.env.APP_CONFIG.receipts.htmlFile': JSON.stringify(pkg.config.receipts.htmlFile)
    }
  )
};

export default [
  {
    input: 'src/app.js',
    output: {
      dir: 'deploy/lib',
      format: 'cjs', // immediately-invoked function expression — suitable for <script> tags
      sourcemap: false
    },
    plugins: [
      replace(replaceOptions),
      resolve(), // tells Rollup how to find date-fns in node_modules
      commonjs(), // converts date-fns to ES modules
      production && terser({ mangle: { toplevel: false } })
    ]
  },
  {
    input: 'src/receipts-app/index.js',
    output: {
      dir: 'deploy',
      format: 'iife',
      sourcemap: false
    },
    plugins: [
      replace(replaceOptions),
      resolve(), // tells Rollup how to find date-fns in node_modules
      commonjs(), // converts date-fns to ES modules

      postcss({
        // extract: true,
        minimize: !!production,
        plugins: [postcssImport()]
      }),
      {
        name: 'ejs-min',
        transform: function transform(code, tplFilePath) {
          if (extname(tplFilePath) === '.html') {
            code = minify(code, { collapseWhitespace: true, removeComments: true, trimCustomFragments: false });
            return {
              code,
              map: { mappings: '' }
            };
          }
        }
      },

      ejs({
        include: '**/*.html'
      }),

      (function () {
        const htmlPlugin = html({
          fileName: pkg.config.receipts.htmlFile,
          attributes: { html: { lang: 'uk' } },
          title: pkg.name,
          template: async ({ attributes, files, meta, title }) => {
            const makeHtmlAttributes = (attributes) => {
              if (!attributes) {
                return '';
              }
              const keys = Object.keys(attributes);
              return keys.reduce((result, key) => `${result} ${key}="${attributes[key]}"`, '');
            };

            const scripts = (files.js || [])
              .map(({ code, source }) => (code || source) && `<script>${code || source}</script>`)
              .filter((html) => !!html)
              .join('');

            const css = (files.css || [])
              .map(({ code, source }) => (code || source) && `<style>${code || source}</style>`)
              .filter((html) => !!html)
              .join('');

            const metas = meta
              .map((input) => {
                const attrs = makeHtmlAttributes(input);
                return `<meta${attrs}>`;
              })
              .join('');

            return `<!doctype html><html${makeHtmlAttributes(
              attributes.html
            )}><head>${metas}<title>${title}</title>${css}</head><body>${scripts}</body></html>`;
          }
        });
        const _generateBundle = htmlPlugin.generateBundle;

        htmlPlugin.generateBundle = async function (output, bundle) {
          await _generateBundle.call(this, output, bundle);
          Object.keys(bundle)
            .filter((fileName) => fileName !== pkg.config.receipts.htmlFile)
            .forEach((fileName) => delete bundle[fileName]);
        };
        return htmlPlugin;
      })(),

      production && terser()
    ]
  }
];
