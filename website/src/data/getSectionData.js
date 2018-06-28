module.exports = function (data) {
  const list = data.map(s => s.items).reduce((a, b) => a.concat(b), []);
  const map = list.reduce((dict, item) => {
    if (item.name in dict) throw new Error(`Multiple items with the same name: ${item.name}`);
    dict[item.name] = item;
    return dict;
  }, {});
  return {
    data,
    map,
    list
  };
};
