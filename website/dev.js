const budo = require('budo');
const path = require('path');
const glslify = require('glslify');

const babelify = require('babelify').configure({
  presets: ['@babel/preset-env'],
  plugins: [
    [ '@babel/plugin-transform-react-jsx', { pragma: 'h' } ],
    '@babel/plugin-syntax-jsx'
  ]
});

budo(path.resolve(__dirname, 'src/index.js'), {
  serve: 'dist/website-bundle.js',
  stream: process.stdout,
  live: true,
  browserify: {
    plugin: require('./resolve.js'),
    transform: [ babelify, glslify ]
  }
});
