const budo = require('budo');
const path = require('path');
const fs = require('fs');
const glslify = require('glslify');
const URL = require('url');
const browserify = require('browserify');

const getFactorPlugin = require('./factor');

const babelify = require('babelify').configure({
  presets: ['@babel/preset-env'],
  plugins: [
    require('@babel/plugin-proposal-object-rest-spread'),
    [ require('@babel/plugin-transform-runtime'), { helpers: false, polyfill: false } ],
    [ '@babel/plugin-transform-react-jsx', { pragma: 'h' } ],
    '@babel/plugin-syntax-jsx'
  ]
});

// 1. Set up files in data.json
// 2. Stop & re-run site:dev
// 3. 

// start();
bundle();

async function start () {
  const factor = await getFactorPlugin();
  const app = budo({
    serve: factor.common,
    stream: process.stdout,
    live: false,
    pushstate: true,
    dir: process.cwd(),
    browserify: {
      entries: factor.entries,
      plugin: [
        require('./plugin-resolve'),
        factor.plugin
      ],
      transform: [ babelify, glslify ]
    }
  }).live().watch().on('watch', (ev, file) => {
    app.reload(file);
  }).on('update', (str, changed) => {
    setTimeout(() => app.reload(), 100);
  });
}

async function bundle () {
  const factor = await getFactorPlugin();
  const app = browserify({
    entries: factor.entries,
    plugin: [
      require('./plugin-resolve'),
      factor.plugin
    ],
    output: factor.commonFile,
    transform: [ babelify, glslify ]
  }).bundle();
}
