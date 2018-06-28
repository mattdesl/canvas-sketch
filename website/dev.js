const budo = require('budo');
const path = require('path');
const glslify = require('glslify');
const { examples } = require('./src/data');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const { promisify } = require('util');
const fs = require('fs');

const getFactorPlugin = require('./factor');

const babelify = require('babelify').configure({
  presets: ['@babel/preset-env'],
  plugins: [
    [ '@babel/plugin-transform-react-jsx', { pragma: 'h' } ],
    '@babel/plugin-syntax-jsx'
  ]
});

start();

async function start () {
  const factorize = await getFactorPlugin();
  budo(factorize.entries, {
    serve: factorize.common,
    stream: process.stdout,
    live: true,
    pushstate: true,
    dir: process.cwd(),
    browserify: {
      plugin: [
        require('./resolve.js'),
        factorize.plugin
      ],
      transform: [ babelify, glslify ]
    }
  }).on('watch', file => {
    console.log('file changed', file);
  });
}
