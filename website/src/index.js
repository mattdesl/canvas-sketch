/** @jsx h */
const Router = require('preact-router');
const { h, render } = require('preact');
const { Link } = require('preact-router/match');
const Canvas = require('./Canvas');

const gitHubUrl = 'https://github.com/mattdesl/canvas-sketch';

const Navbar = () => {
  return <div class='top-nav'>
    <header>
      <Link href='/' class='title'>canvas-sketch</Link>
      <nav>
        <Link activeClassName='active' href='/examples'>examples</Link>
        <Link activeClassName='active' href='/docs'>docs</Link>
        <a activeClassName='active' href={gitHubUrl} class='external'>code</a>
      </nav>
    </header>
  </div>;
};

const Home = () => {
  return <main>
    <p>This is a loose collection of tools, modules, and resources for creating generative artworks in JavaScript and the browser.</p>
    <p>This framework can be used to render high-quality PNG images for Giclée prints, export image sequences for GIF and MP4 loops, generate SVG files for pen plotters (like AxiDraw), automatically git hash your artworks for long-term archiving, and more.</p>
    <p>To get started, check out the <Link href='/docs'>documentation</Link>, or browse through <Link href='/examples'>some examples</Link>, or view the <a href={gitHubUrl}>source code</a> on GitHub.</p>
  </main>;
};

const Examples = () => {
  return <main>Examples...</main>;
};

const Docs = () => {
  return <main>Docs...</main>;
};

const Footer = () => {
  return <footer>
    <div class='rotated-brief'>a toolkit for generative art</div>
    <hr class='right' />
  </footer>;
};

const Content = () => {
  return <div class='content-layer'>
    <Navbar />
    <Router>
      <Home path='/' />
      <Examples path='/examples' />
      <Docs path='/docs' />
    </Router>
    <Footer />
  </div>;
};

const App = () => {
  return <div class='app'>
    <Canvas />
    <Content />
  </div>;
};

render(<App />, document.body);
