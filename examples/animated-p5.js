const canvasSketch = require('canvas-sketch');
const P5Constructor = require('p5');

// new P5(p => {
//   p.setup = () => {
//     p.createCanvas(100, 100);
//     console.log('setup', p.canvas)
//   };
//   process.nextTick(() => {
//     console.log(p.canvas)
//   })
// })

// // const wrapper = p5js => {
// //   const settings = 
// //   const canvasSketchResult = canvasSketch(sketch, settings);
// //   const result = new p5js(sketch);
// // };

// const p5Result = new p5js(p => {
//   p.setup = () => {
//     // No need to createCanvas
//   };

//   p.draw = () => {
//     p.background(0);
//     p.fill(255);
//     p.rect(20, 20, 50, 50);
//   }; 
// }, {
//   loop: false,
//   canvas: myCanvas
// });

// const settings = { p5 };
// canvasSketch(({ width, height, p5 }) => {
//   p5.mouseClicked = () => {
//     console.log('clicked!');
//   };
//   p5.setup = () => {
//     console.log('setup things! not really needed...');
//   };
//   return ({ width, height }) => {
//     p5.background(0);
//     p5.rect(10, 10, 25, 25);
//   };
// }, settings);



// canvasSketch(({ width, height, p5 }) => {
//   p5.mouseClicked = () => {
//     console.log('clicked!');
//   };
//   p5.setup = () => {
//     console.log('setup things! not really needed...');
//   };
//   return {
//     resize (props) {
//       p5.resize(props.width, props.height, props.pixelRatio);
//     },
//     render (props) {
//       p5.draw(props);
//     }
//   };
// }, settings);


// const result = new P5(p => {

// });
// result.createCanvas(250, 100, P5.WEBGL);

// const wrap = (fn, settings) => {
//   return p => {
//     canvasSketch(sketch => {
//       fn(p);

//       return {
//         resize ({ width, height, pixelRatio }) {
          
//           p.pixelDensity(pixelRatio);
//           p.resizeCanvas(width, height);
//         }
//       };
//     }, { canvas: p.canvas });
//   };
// };


const wrapper = (sketch, settings) => {
  let isP5Mode = false;
  if (settings.p5) {
    settings = Object.assign({}, settings, { canvas: false, context: false });
    isP5Mode = true;
  }
  const wrapWithWarning = (obj, name, msg) => {
    const fn = obj[name];
    obj[name] = function () {
      const args = Array.prototype.slice.call(arguments);
      console.warn(msg);
      return fn.apply(obj, args);
    };
  };
  if (isP5Mode) {
    const P5Constructor = settings.p5;
    const waitForP5 = props => {
      return new Promise((resolve) => {
        const p5Sketch = p5 => {
          p5.setup = () => {
            const renderer = props.settings.context === 'webgl' ? p5.WEBGL : p5.P2D;
            p5.noLoop();
            p5.pixelDensity(props.pixelRatio);
            p5.createCanvas(props.viewportWidth, props.viewportHeight, renderer);

            const newProps = props.update({ p5, canvas: p5.canvas, context: p5._renderer.drawingContext });
            wrapWithWarning(p5, 'createCanvas', '[canvas-sketch] p5.createCanvas() should generally not be called from within canvas-sketch');
            resolve(newProps);
          };
        };
        return new P5Constructor(p5Sketch);
      });
    };
    return canvasSketch((props) => {
      return waitForP5(props)
        .then((newProps) => sketch(newProps));
    }, settings);
  } else {
    return canvasSketch(sketch, settings);
  }
};

wrapper(({ context, width, height, p5 }) => {
  console.log('setup')
  return {
    render ({ width, height, scaleX, scaleY, playhead, pixelRatio }) {
      p5.background(0);
      p5.fill(255);
      p5.noStroke();
      p5.rect(playhead * width, 1, 1, 1);
    }
  };
}, {
  p5: P5Constructor,
  dimensions: [ 7, 11 ],
  animate: true,
  duration: 3,
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'in'
});


// canvasSketch(props => {
//   return ({ width, height, pixelRatio, styleWidth, styleHeight, settings, update }) => {
//     const result = new P5Constructor(p5 => {
//       p5.setup = () => {
//         console.log('SETUP!');
//         const renderer = settings.context === 'webgl' ? p5.WEBGL : p5.P2D;
//         p5.createCanvas(styleWidth, styleHeight, renderer);
//         console.log(p5._renderer.drawingContext.canvas === p5.canvas)
//         update({ canvas: p5.canvas, context: p5._renderer.drawingContext });
//       };
//     });
//   };
// }, { canvas: false, dimensions: [ 8, 10 ], units: 'in', context: 'webgl' });

// const canvasSketchWrap = (P5Constructor, sketch, settings) => {
//   // const p5Result = new P5Constructor(p5 => {
//   //   p5.setup = () => {
      
//   //   };
//   // });
  

//   canvasSketch((props) => {
        
//     // let ret = sketch(props);
//     // let p = Promise.resolve(ret);
//     // if (typeof ret.then === 'function') p = ret;
//     // return p.then(renderer => {
//     //   return new Promise((resolve) => {
        
//     //   });
//     // });
//   }, Object.assign({}, settings, { canvas: false }));
// };

// const sketch = ({ context, p5 }) => {
//   console.log('setup', context.canvas)
//   return ({ width, height }) => {
//     console.log(width, height);
//   };
// };

// const settings = {
//   dimensions: [ 25, 100 ]
// };
// canvasSketchWrap(P5Constructor, sketch, settings);

// const sketch = ({ p5 }) => {

//   return ({ width, height }) => {
//     p5.background(0);
//     p5.fill(255);
//     p5.rect(50, 50, 50, 50);
//   };
// };

// const result = new P5(sketch)

// const settings = {
//   p5: new P5()
// };

// console.log(settings);

// canvasSketch(({ p5 }) => {
//   createCanvas(100, 100);
//   return ({ width, height }) => {
//     background(0);
//     fill(255);
//     rect(50, 50, 50, 50);
//   };
// });

// const p5Sketch = (p5) => {
//   p5.setup = () => {
//     const result = sketch({ p5 });
    
    
//     p5.draw = () => {
      
//     };
//   };
// };
// new P5(p5Sketch);

// canvasSketch(() => {

//   // var boop = random(100);
  
//   // function setup() {
//     // console.log('setup')
//   //   // createCanvas(100, 100);
//   // }
  
//   // function draw() {
//   //     background(255, 0, boop);
//   // }
// });



function p5sketch (p) {
  let rotation = 0;

  p.setup = function () {
    p.createCanvas(600, 400);

    p.rect(81, 81, 63, 63);
  };

  // p.draw = function () {
  //   p.background(100);
  //   p.noStroke();
  //   p.rect(width / 2, height / 2, 10, 10);
  // };
};

// const canvasSketch = require('canvas-sketch');
// const p5 = require('p5');

// const settings = {
//   dimensions: [ 2048, 2048 ]
// };

// const sketch = () => {
//   return ({ context, width, height }) => {
//     context.fillStyle = 'white';
//     context.fillRect(0, 0, width, height);
//   };
// };

// canvasSketch(sketch, settings);
