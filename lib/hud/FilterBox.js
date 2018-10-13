/** @jsx h */
import { h, Component } from 'preact';

export default (props) => {
  const onChange = ev => {
    props.onChange(ev.currentTarget.value.toLowerCase());
  };
  return <div class='canvas-sketch--hud-filter'>
    <input
      onInput={onChange}
      onChange={onChange}
      type='text'
      placeholder='Filter parameters...'
    />
  </div>;
};
