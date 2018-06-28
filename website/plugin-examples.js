const { PassThrough } = require('stream');
const concat = require('concat-stream');
const browserify = require('browserify');
const { promisify } = require('util');
const fs = require('fs');
const mkdirp = promisify(require('mkdirp'));
const uglify = require('uglify-es');
const deepEqual = require('deep-equal');
const duplexer = require('duplexer2');
const through = require('through2');
const path = require('path');
const getSectionData = require('./src/data/getSectionData');

module.exports = function (bundler, opt = {}) {
  // Get the cache from watchify for faster incremental builds
  const cache = bundler._options.cache;
  const packageCache = bundler._options.packageCache;

  const exampleDir = path.resolve(__dirname, '../examples');
  const currentExamples = [];

  const exampleDataFile = path.resolve(__dirname, 'src/data/examples-data.json');
  bundler.transform(transform);

  // when example/*.js file changes, see if
  // it is in the current bundle.js json list of visible files
  // if no, ignore entirely
  // if yes, invalidate & re-build the file
    // the invalidate triggers a budo.reload()
    // on rebuild, we bundle the example file to output js & write HTML
    // then we resolve.
    // meanwhile, the middleware req'ing anything in examples/ will first look
    // in the activeCache[fileName], if it's there will use a promise to suspend it
    // if bundle gets error, we output budo's error handler?

  function bundle (file) {
    const fileName = path.basename(file);
    const b = browserify({
      entries: [ file ],
      cache,
      packageCache
    });
    return new Promise((resolve, reject) => {
      b.bundle((err, src) => {
        if (err) reject(err);
        else resolve(src);
      });
    }).then(result => {
      console.log('Got result', result.slice(0, 10));
    }).catch(err => {
      console.error(err);
      return `
!(function () {
  console.error("There was a syntax error in the '${fileName}' example");
})();
`.trim();
    });
  }

  function reload () {
    console.log('should reload browser');
  }

  function onFileChange (file) {
    console.log('file changed', file);
  }

  // Here we figure out which example files the app is trying to render
  function transform (file) {
    if (file !== exampleDataFile) return new PassThrough();
    let str = '';
    return through((chunk, _, next) => {
      str += chunk.toString();
      next(null, chunk);
    }, function (next) {
      // Parse the new JSON data
      let data;
      try {
        data = JSON.parse(str);
      } catch (err) {
        console.error(err);
      }

      currentExamples.length = 0;
      if (data) {
        const items = getSectionData(data).list
          .filter(i => i.visible !== false)
          .map(f => path.resolve(exampleDir, `${f}.js`));
        items.forEach(f => currentExamples.push(f));
      }

      next(null);
    });
  }
};

// Transform specific examples-data.json file
// When we reach a file name, generate HTML for it
// When the bundle updates due to that file, rebuild its JS
// Then when it finishes, reload HTML