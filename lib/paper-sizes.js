const defaultUnits = 'mm';

const data = [
  // Common Paper Sizes
  // (Mostly North-American based)
  [ 'postcard', 101.6, 152.4 ],
  [ 'poster-small', 280, 430 ],
  [ 'poster', 460, 610 ],
  [ 'poster-large', 610, 910 ],
  [ 'business-card', 50.8, 88.9 ],

  // Photographic Print Paper Sizes
  [ '2r', 64, 89 ],
  [ '3r', 89, 127 ],
  [ '4r', 102, 152 ],
  [ '5r', 127, 178 ], // 5″x7″
  [ '6r', 152, 203 ], // 6″x8″
  [ '8r', 203, 254 ], // 8″x10″
  [ '10r', 254, 305 ], // 10″x12″
  [ '11r', 279, 356 ], // 11″x14″
  [ '12r', 305, 381 ],

  // Standard Paper Sizes
  [ 'a0', 841, 1189 ],
  [ 'a1', 594, 841 ],
  [ 'a2', 420, 594 ],
  [ 'a3', 297, 420 ],
  [ 'a4', 210, 297 ],
  [ 'a5', 148, 210 ],
  [ 'a6', 105, 148 ],
  [ 'a7', 74, 105 ],
  [ 'a8', 52, 74 ],
  [ 'a9', 37, 52 ],
  [ 'a10', 26, 37 ],
  [ '2a0', 1189, 1682 ],
  [ '4a0', 1682, 2378 ],
  [ 'b0', 1000, 1414 ],
  [ 'b1', 707, 1000 ],
  [ 'b1+', 720, 1020 ],
  [ 'b2', 500, 707 ],
  [ 'b2+', 520, 720 ],
  [ 'b3', 353, 500 ],
  [ 'b4', 250, 353 ],
  [ 'b5', 176, 250 ],
  [ 'b6', 125, 176 ],
  [ 'b7', 88, 125 ],
  [ 'b8', 62, 88 ],
  [ 'b9', 44, 62 ],
  [ 'b10', 31, 44 ],
  [ 'b11', 22, 32 ],
  [ 'b12', 16, 22 ],
  [ 'c0', 917, 1297 ],
  [ 'c1', 648, 917 ],
  [ 'c2', 458, 648 ],
  [ 'c3', 324, 458 ],
  [ 'c4', 229, 324 ],
  [ 'c5', 162, 229 ],
  [ 'c6', 114, 162 ],
  [ 'c7', 81, 114 ],
  [ 'c8', 57, 81 ],
  [ 'c9', 40, 57 ],
  [ 'c10', 28, 40 ],
  [ 'c11', 22, 32 ],
  [ 'c12', 16, 22 ],

  // Use inches for North American sizes,
  // as it produces less float precision errors
  [ 'half-letter', 5.5, 8.5, 'in' ],
  [ 'letter', 8.5, 11, 'in' ],
  [ 'legal', 8.5, 14, 'in' ],
  [ 'junior-legal', 5, 8, 'in' ],
  [ 'ledger', 11, 17, 'in' ],
  [ 'tabloid', 11, 17, 'in' ],
  [ 'ansi-a', 8.5, 11.0, 'in' ],
  [ 'ansi-b', 11.0, 17.0, 'in' ],
  [ 'ansi-c', 17.0, 22.0, 'in' ],
  [ 'ansi-d', 22.0, 34.0, 'in' ],
  [ 'ansi-e', 34.0, 44.0, 'in' ],
  [ 'arch-a', 9, 12, 'in' ],
  [ 'arch-b', 12, 18, 'in' ],
  [ 'arch-c', 18, 24, 'in' ],
  [ 'arch-d', 24, 36, 'in' ],
  [ 'arch-e', 36, 48, 'in' ],
  [ 'arch-e1', 30, 42, 'in' ],
  [ 'arch-e2', 26, 38, 'in' ],
  [ 'arch-e3', 27, 39, 'in' ]
];

export default data.reduce((dict, preset) => {
  const item = {
    units: preset[3] || defaultUnits,
    dimensions: [ preset[1], preset[2] ]
  };
  dict[preset[0]] = item;
  dict[preset[0].replace(/-/g, ' ')] = item;
  return dict;
}, {});
