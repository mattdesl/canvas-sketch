const path = require('path');

const canvasSketchModule = require.resolve('../');
const basedir = path.dirname(canvasSketchModule);

module.exports = function (bundler, opt = {}) {
  // Get this module's package dir
  const resolver = bundler._bresolve;

  // Resolve canvas-sketch from here instead of using working directory
  bundler._bresolve = function (id, opts, cb) {
    if (/^canvas-sketch([\\/].*)?$/.test(id)) {
      id = canvasSketchModule;
      opts = Object.assign({}, opts, { basedir });
    }

    return resolver.call(bundler, id, opts, (err, result, pkg) => {
      // Improve error messaging since browserify sometimes gives you just a folder,
      // not the actual file it was required by. Could improve further by parsing
      // file and getting real syntax error message.
      if (err) {
        cb(new Error(`Cannot find module '${id}' from '${path.relative(path.dirname(process.cwd()), opts.filename)}'`));
      } else {
        cb(null, result, pkg);
      }
    });
  };
};
