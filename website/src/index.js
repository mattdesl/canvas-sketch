/** @jsx h */
const Router = require('preact-router');

const { h, render } = require('preact');
const { Link } = require('preact-router/match');
const Canvas = require('./components/Canvas');
const Examples = require('./components/Examples');

const gitHubUrl = 'https://github.com/mattdesl/canvas-sketch';
const gitHubUrlDocs = 'https://github.com/mattdesl/canvas-sketch/blob/master/docs/README.md';

const Navbar = () => {
  return <div className='top-nav'>
    <header>
      <Link href='/' className='title'>canvas-sketch</Link>
      <nav>
        <Link activeClassName='active' href='/examples'>examples</Link>
        <a target='_blank' href={gitHubUrlDocs} className='external'>docs</a>
        <a target='_blank' href={gitHubUrl} className='external'>code</a>
      </nav>
    </header>
  </div>;
};

const Footer = () => {
  return <footer>
    <div className='rotated-brief'>a toolkit for generative art</div>
    <hr className='right' />
  </footer>;
};

const Home = () => {
  return <main className='landing'>
    <p><strong>canvas-sketch</strong> is a loose collection of tools, modules, and resources for creating generative art in JavaScript and the browser.</p>
    <p>It can be used to render high-quality PNG images for Giclée prints, create real-time web graphics (such as this page's background), export image sequences for GIF and MP4 loops, generate SVG files for pen plotters (like AxiDraw), automatically git hash your artworks for long-term archiving, and more.</p>
    <p>To get started, check out the <a target='_blank' href={gitHubUrlDocs}>documentation</a>,
    or browse through <Link href='/examples'>some examples</Link>,
    or view the <a target='_blank' href={gitHubUrl}>source code</a> on GitHub.</p>
  </main>;
};

const Docs = () => {
  return <main>Docs...</main>;
};

class Content extends Router {
  render (props, state) {
    const isHome = state.url === '/';
    return <div className='content-layer'>
      <Canvas active={isHome} />
      <Navbar />
      { super.render(props, state) }
      { isHome && <Footer /> }
    </div>;
  }
}

const App = (props, context) => {
  return <div className='app'>
    <Content>
      <Home path='/' />
      <Examples path='/examples/:name?' />
    </Content>
  </div>;
};

render(<App />, document.body);
