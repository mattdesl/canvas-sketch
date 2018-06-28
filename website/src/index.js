/** @jsx h */
const Router = require('preact-router');

// Until we publish on a proper host...
// const createHistory = require('history/createMemoryHistory').default;

const { h, render } = require('preact');
const { Link } = require('preact-router/match');
const Canvas = require('./components/Canvas');
const Examples = require('./components/Examples');

const gitHubUrl = 'https://github.com/mattdesl/canvas-sketch';
// const history = createHistory();

const Navbar = () => {
  return <div class='top-nav'>
    <header>
      <Link href='/' class='title'>canvas-sketch</Link>
      <nav>
        <Link activeClassName='active' href='/examples'>examples</Link>
        <Link activeClassName='active' href='/docs'>docs</Link>
        <a target='_blank' href={gitHubUrl} class='external'>code</a>
      </nav>
    </header>
  </div>;
};

const Footer = () => {
  return <footer>
    <div class='rotated-brief'>a toolkit for generative art</div>
    <hr class='right' />
  </footer>;
};

const Home = () => {
  return <main class='landing'>
    <p>This is a loose collection of tools, modules, and resources for creating generative artworks in JavaScript and the browser.</p>
    <p>This framework can be used to render high-quality PNG images for Giclée prints, export image sequences for GIF and MP4 loops, generate SVG files for pen plotters (like AxiDraw), automatically git hash your artworks for long-term archiving, and more.</p>
    <p>To get started, check out the <Link href='/docs'>documentation</Link>, or browse through <Link href='/examples'>some examples</Link>, or view the <a target='_blank' href={gitHubUrl}>source code</a> on GitHub.</p>
  </main>;
};

const Docs = () => {
  return <main>Docs...</main>;
};

class Content extends Router {
  render (props, state) {
    return <div class='content-layer'>
      <Navbar />
      { super.render(props, state) }
      { state.url === '/' && <Footer /> }
    </div>;
  }
}

const App = () => {
  return <div class='app'>
    <Canvas />
    <Content>
      <Home path='/' />
      <Examples path='/examples/:name?' />
      <Docs path='/docs' />
    </Content>
  </div>;
};

render(<App />, document.body);
