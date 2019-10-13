const Bundler = require("parcel-bundler");
const express = require("express");
const maxstache = require("maxstache");
const fs = require("fs");
const path = require("path");
const htmlTemplate = fs.readFileSync(
  path.resolve(__dirname, "index.html"),
  "utf8"
);
console.log(htmlTemplate);

async function createBundler() {}

(async () => {
  const file = process.argv[2]; // Pass an absolute path to the entrypoint here
  const options = {
    outDir: "./build/",
    outFile: "bundle.js"
  }; // See options section of api docs, for the possibilities

  // Initialize a new bundler using a file and options
  const bundler = new Bundler(file, options);

  const app = express();

  app.get("/", (req, res) => {
    res.send(
      maxstache(htmlTemplate, {
        entry: `<script src="bundle.js"></script>`,
        title: "canvas-sketch"
      })
    );
  });

  // Let express use the bundler middleware, this will let Parcel handle every request over your express server
  app.use(bundler.middleware());

  // Listen on port 8080
  app.listen(8080);
})();
