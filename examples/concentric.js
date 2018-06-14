const createSketch = require('../');

const settings = {
  dimensions: [ 512, 512 ]
};

const sketch = async (props) => {
  console.log(props);
};

createSketch(sketch, settings);
