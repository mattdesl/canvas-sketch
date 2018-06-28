/** @jsx h */
const { route } = require('preact-router');
const { h, render } = require('preact');
const { Link } = require('preact-router/match');

const { examples } = require('../data');

const ExampleItem = (props) => {
  const baseUrl = '/examples';
  const url = `${baseUrl}/${props.name}`;
  return <li>
    <Link activeClassName='active' href={url}>{props.title}</Link>
  </li>;
};

module.exports = (props, context) => {
  const sections = examples.data.map(section => {
    if (!section.name) throw new Error('Missing "name" field in section from examples-data.json');
    const itemData = section.items || [];
    const items = itemData.filter(d => d.visible !== false).map(data => {
      return <ExampleItem {...data} name={data.name} />;
    });
    if (items.length === 0) return null;
    return <ul class='examples'>
      <div class='list-section-header'>{section.title}</div>
      {items}
    </ul>;
  }).filter(Boolean);

  let name = props.matches.name || '';
  let view = <div class='no-sketch'>Choose a sketch from the list to begin.</div>;
  if (name) {
    if (name in examples.map) {
      view = <iframe src={`examples/build/${examples.map[name].name}.html`} width='100%' height='100%' />;
    } else {
      console.warn(`Could not find example by id ${name}`);
      view = <div class='no-sketch'><p>No sketch found by the name <strong>/{name}</strong>.</p><p>Try choosing a different one from the list.</p></div>
      name = '';
    }
  }
  return <main class='split-view'>
    <div class='list-view'>
      {sections}
    </div>
    <div class='sketch-view'>
      {view}
    </div>
  </main>;
};
