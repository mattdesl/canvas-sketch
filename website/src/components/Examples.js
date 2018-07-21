/** @jsx h */
const classnames = require('classnames');
const { route } = require('preact-router');
const { h, Component } = require('preact');
const { Link } = require('preact-router/match');

const { examples } = require('../data');

const cachedSource = {};

const getSource = (name) => {
  const url = `/examples/${name}.js`;
  if (url in cachedSource) return cachedSource[url];
  const p = window.fetch(url).then(resp => resp.text());
  cachedSource[url] = p;
  return p;
};

const ExampleItem = (props) => {
  const baseUrl = '/examples';
  const url = `${baseUrl}/${props.name}`;
  return <li>
    <Link activeClassName='active' href={url}>{props.title}</Link>
  </li>;
};

class View extends Component {
  constructor (props) {
    super(props);
    this.state = {
      loading: false,
      code: ''
    };
  }

  loadSketch (props) {
    const name = props.name;
    // If we have a name, start loading
    const loading = Boolean(name);
    this.setState({ loading, code: '' });
    getSource(name).then(code => {
      this.setState({ loading: false, code });
    });
  }

  componentWillReceiveProps (props, state) {
    this.loadSketch(props);
  }

  componentDidMount () {
    this.loadSketch(this.props);
  }

  componentDidUpdate () {
    if (this.element && window.hljs && this.state.code && this.element.parentElement) {
      this.element.innerHTML = this.state.code;
      window.hljs.highlightBlock(this.element.parentElement);
    }
  }

  render (props) {
    const name = props.name;

    // User selected an example
    if (name) {
      if (name in examples.map) {
        // Sketch exists!
        const code = this.state.code;
        if (code) {
          const sketch = examples.map[name];
          const classes = classnames('code', { loading: !code });
          return <div className='sketch-view'>
            <iframe className='sketch' src={`examples/build/${sketch.name}.html`} width='100%' height='100%' />
            <div className={classes}>
              <pre>
                <code className='js' ref={c => { this.element = c; }} />
              </pre>
            </div>
          </div>;
        } else {
          return <div className='sketch-view no-sketch'><p>loading</p></div>;
        }
      } else {
        // Sketch doesn't exist
        console.warn(`Could not find example by id ${name}`);
        return <div className='sketch-view no-sketch'><p>No sketch found by the name <strong>{name}</strong>,</p><p>try choosing a different one from the list</p></div>;
      }
    }

    return <div className='sketch-view no-sketch'>
      <p>Choose a sketch from the list to begin.</p>
      {/* It's a bit awkward since the user has to click the iframe to gain focus first... :\ */}
      {/* <p className='hotkey-tip'>While viewing a sketch, push <code className='hotkey'>Ctrl + S</code> or <code className='hotkey'>Cmd + S</code> to download the artwork.</p> */}
    </div>;
  }
}

module.exports = (props, context) => {
  const sections = examples.data.map(section => {
    if (!section.name) throw new Error('Missing "name" field in section from examples-data.json');
    const itemData = section.items || [];
    const items = itemData.filter(d => d.visible !== false).map(data => {
      return <ExampleItem {...data} name={data.name} />;
    });
    if (items.length === 0) return null;
    return <ul className='examples'>
      <div className='list-section-header'>{section.title}</div>
      {items}
    </ul>;
  }).filter(Boolean);

  let name = props.matches.name || '';
  const view = <View name={name} />;
  return <main className='split-view'>
    <div className='list-view'>
      <div className='list-view-scroll'>{sections}</div>
    </div>
    {view}
  </main>;
};
