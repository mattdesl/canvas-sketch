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

  let currentExamples = [];

  const exampleDataFile = path.resolve(__dirname, 'src/data/examples-data.json');
  bundler.transform(transform);

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

  async function emitFiles (fileNames) {
    console.log('Bundling examples...');
    const outputDir = path.resolve(__dirname, '../examples/build');
    await mkdirp(outputDir);

    const examplesDir = path.resolve(__dirname, '../examples');

    const outputs = fileNames.map(file => path.join(outputDir, `${file}.js`));
    const entries = fileNames.map(file => path.join(examplesDir, `${file}.js`));
    const b = browserify({
      entries,
      plugin: [ require('factor-bundle'), { outputs } ],
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
  console.error("Could not bundle examples.");
})();
`.trim();
    });
  }

  function transform (file) {
    if (file !== exampleDataFile) return new PassThrough();
    console.log('got file', file);
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

      let files = [];
      if (data) {
        const items = getSectionData(data).list.filter(i => i.visible !== false);
        files = items.map(f => path.join(f.name));
      }
      if (!deepEqual(currentExamples, files)) {
        currentExamples = files;
        emitFiles(files);
      }
      next(null);
    });
  }
};

// Transform specific examples-data.json file
// When we reach a file name, generate HTML for it
// When the bundle updates due to that file, rebuild its JS
// Then when it finishes, reload HTML