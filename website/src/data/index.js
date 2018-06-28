const examplesData = require('./examples-data.json');
const examplesList = examplesData.map(m => m.items).reduce((a, b) => a.concat(b), []);
const examplesMap = examplesList.reduce((dict, item) => {
  if (item.name in dict) throw new Error(`Multiple items with the same name: ${item.name}`);
  dict[item.name] = item;
  return dict;
}, {});

module.exports.examples = {
  data: examplesData,
  list: examplesList,
  map: examplesMap
};
