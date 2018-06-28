const path = require('path');
const { examples } = require('./src/data');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const { promisify } = require('util');
const fs = require('fs');

module.exports = function () {
  const mainEntry = path.resolve(__dirname, 'src/index.js');

  const baseDir = path.resolve(__dirname, '../');
  const exampleDirName = 'examples';
  const exampleBuildDirName = 'examples/build';

  const exampleDir = path.resolve(__dirname, baseDir, exampleDirName);
  const exampleBuildDir = path.resolve(__dirname, baseDir, exampleBuildDirName);

  // remove & re-create example directory
  rimraf.sync(exampleBuildDir);
  mkdirp.sync(exampleBuildDir);

  const commonBundleUrl = 'dist/website-common.js';
  const exampleFileNames = examples.list.filter(f => f.visible !== false).map(e => `${e.name}.js`);
  const exampleFiles = exampleFileNames.map(f => path.join(exampleDir, f));
  const exampleOutputs = exampleFileNames.map(f => path.join(exampleBuildDir, f));

  // Features for factor bundle
  const outputs = [
    path.resolve(__dirname, '../dist/website-app.js')
  ].concat(exampleOutputs);

  const entries = [
    mainEntry
  ].concat(exampleFiles);

  const html = (file) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <base href="/">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, shrink-to-fit=0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
    <title>canvas-sketch</title>
    <link rel="stylesheet" href="https://use.typekit.net/etw2igk.css">
    <link rel="stylesheet" href="website/src/style.css">
  </head>
  <body>
    <script src="${commonBundleUrl}"></script>
    <script src="${exampleBuildDirName}/${file}"></script>
  </body>
  </html>
  `.trim();

  const writeFile = promisify(fs.writeFile);

  return Promise.all(exampleFileNames.map(f => {
    const data = html(f);
    const htmlFile = `${path.basename(f, path.extname(f))}.html`;
    return writeFile(path.join(exampleBuildDir, htmlFile), data);
  })).then(() => {
    return {
      common: commonBundleUrl,
      entries,
      outputs,
      plugin: [ require('factor-bundle'), { outputs } ]
    };
  }).catch(err => {
    console.error(err);
    throw err;
  });
}