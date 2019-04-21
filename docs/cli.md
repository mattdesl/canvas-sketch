#### <sup>:closed_book: [canvas-sketch](../README.md) → [Documentation](./README.md) → CLI Docs</sup>

---

### `canvas-sketch-cli` — CLI Docs

Below are the docs for the `canvas-sketch-cli` command-line interface (CLI). This tool requires you to have Node.js v8+ and npm v5+ already installed.

> :bulb: If you are just getting started, you may want to look at some of the guides first, such as the [Installation](./installation.md) guide, or [A "Hello, World" Sketch](./hello-world.md).

## Contents

- [Usage](#usage)
- [Creating Sketches](#creating-sketches)
- [Running Sketches](#running-sketches)
- [Building to a Website](#building-to-a-website)

## Usage

```
canvas-sketch [file] [opts] -- [browserifyArgs]

Examples:
  canvas-sketch my-file.js
  canvas-sketch --build --dir public/
  canvas-sketch --new --template=three --open
  canvas-sketch src/sketch.js --new

Options:
  --version, -v      Display version
  --new, -n          Stub out a new sketch
  --template, -t     Set the template to use with --new,
                     e.g. --template=three or --template=penplot
  --open, -o         Open browser on run
  --hot              Enable Hot Reloading during development
  --output           Set output folder for exported sketch files
  --dir, -d          Set output directory, defaults to '.'
  --port, -p         Server port, defaults to 9966
  --no-install       Disable auto-installation on run
  --force, -f        Forces overwrite with --new flag
  --pushstate, -P    Enable SPA/Pushstate file serving
  --quiet            Do not log to stderr
  --build            Build the sketch into HTML and JS files
  --no-compress      Disable compression/minification during build
  --inline           When building, inline all JS into a single HTML
  --name             The name of the JS file, defaults to input file name
  --js               The served JS src string, defaults to name
  --html             The HTML input file, defaults to a basic template
```

## Creating a Sketch

You can use the `--new` and `--template` flags to create a new sketch. You can also pipe source code directly into the command.

```sh
# Make a new sketch file called 'my-sketch.js' and run it
canvas-sketch my-sketch.js --new

# Create a sketch and open the browser on start
canvas-sketch src/sketch.js --new --open

# Write & launch a sketch from clipboard
pbpaste | canvas-sketch --new --open
```

Once running, you can open the browser to [http://localhost:9966/](http://localhost:9966/) to start editing.

### Templates

Currently the following `--template` types are supported:

- [`default`](https://github.com/mattdesl/canvas-sketch-cli/blob/master/src/templates/default.js)
- [`three`](https://github.com/mattdesl/canvas-sketch-cli/blob/master/src/templates/three.js)
- [`regl`](https://github.com/mattdesl/canvas-sketch-cli/blob/master/src/templates/regl.js)
- [`penplot`](https://github.com/mattdesl/canvas-sketch-cli/blob/master/src/templates/penplot.js)

For example, to start a new ThreeJS sketch:

```
canvas-sketch sketch.js --new --template=three --open
```

You can also specify your own template file using an absolute or relative path (starting with `.` or a path separator).

```sh
canvas-sketch sketch.js --template=./mytemplate.js
```

## Running Sketches

When you create a sketch, it will also start the development server. You can omit the `--new` flag to run an existing sketch:

```sh
canvas-sketch mysketch.js
```

You can include the `--hot` flag if you wish to enable [Hot Reloading](./hot-reloading.md):

```sh
canvas-sketch mysketch.js --hot
```

If you are building your website into a `public/`, `app/` or other sub-directory, you may need to specify this directory for assets to load with correct paths:

```sh
canvas-sketch mysketch.js --dir public
```

You can also specify browserify transforms after a full `--` stop:

```sh
canvas-sketch mysketch.js -- -t bubleify
```

## Building to a Website

You can use the `--build` command to generate static HTML and JS files from your sketch input. These files can be placed into your favourite web hosting solution to share your sketches online.

Other examples:

```sh
# Render website to 'public/' without minification
canvas-sketch mysketch.js --dir public --build --no-compress

# Render website to a single standalone file called 'index.html'
canvas-sketch mysketch.js --name index --build --inline

# Render a website using a different HTML file and custom JS src
canvas-sketch src/index.js --html=src/page.html --js=bundle.js
```

The HTML file can include `{{entry}}` which will get replaced by the `<script>` tag definition used by the build tool. Example:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, shrink-to-fit=0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
  <title>canvas-sketch</title>
  <link rel="stylesheet" href="main.css">
</head>
<body>
  {{entry}}
</body>
</html>
```

Note that `main.css` is relative to the directory being served, which defaults to the working directory, but can be set differently during development and build with the `--dir` flag.

##

#### <sup>[← Back to Documentation](./README.md)