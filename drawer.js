// jshint esversion: 10
const $ = query => document.querySelector(query);
const $$ = query => document.querySelectorAll(query);

const c = $('canvas#render');
const ctx = c.getContext('2d');
c.width = c.height = 256;

let network = [];

class Node {
  constructor(num_weights) {
    this.weights = [...Array(num_weights)].map(e => 2*Math.random()-1);
    this.bias = 2*Math.random()-1;
    this.value = 0;
    this.acfunc = activators[0|(Math.random()*activators.length)];
  }
}

let activators = [sin]

let activator_options = {
  clamp, sigmoid, fold, sin,
  tan, fold3, split, fold2,
  tanh, wrap,
}

c.addEventListener('click', e => {
  if (activators.length == 0) return;
  init(2, 4, 4, 4, 4, 5);
})
addEventListener('keydown', e => e.key=='Enter' && c.dispatchEvent(new Event("click")))
c.dispatchEvent(new Event("click"))
$$('span[option]').forEach(el => {
  el.addEventListener('click', e => {
    if (activators.includes(activator_options[el.id]))
      activators.splice(activators.indexOf(activator_options[el.id]), 1);
    else activators.push(activator_options[el.id]);
    el.classList.toggle('active');
  })
});
$$('span[boolean]').forEach(el => {
  el.addEventListener('click', e => {
    settings[el.id] = !settings[el.id];
    el.classList.toggle('active');
  })
});

let settings = {
  scale: 3,
  domain_warping: false
};

function init(...Ls) {
  network = []
  let layers = [...Ls, []];
  for (let l = 0; l < layers.length-1; l++) {
    let layer = [];
    for (let n = 0; n < layers[l]; n++) {
      const node = new Node(layers[l+1]);
      layer.push(node);
    }
    network.push(layer);
  }
}

function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x }
function sigmoid(n) { return 1 / (1 + Math.exp(-n * 8)); }

function wrap(x) {
  let X = x;
  while (X < 0) X++;
  while (X > 1) X--;
  return X;
}

function fold(n) {
  let N = ((n+2))%2;
  if (N > 1) return 2 - N;
  return N;
}
function fold2(n) {
  let N = n;
  if (N < 0)
    while (N < -1) N += 2;
  else
    while (N > 1) N -= 2;
  return Math.tanh(N);
}
function fold3(n) {
  let N = (n+2)%2;
  if (N > 1) return Math.tanh(2 - N);
  return Math.tanh(N);
}

function sin(n) { return 0.5*(Math.sin(Math.PI*(n-0.5))+1); }
function tan(n) { return 0.5*(Math.tan(n*0.9)+1); }
function tanh(n) { return Math.tanh((n+2) % 2); }
function split(n) { return n < 0 ? 0 : 1; }

function compute(...inputs) {
  for (let i in inputs)
    network[0][i].value = inputs[i];
  for (let l = 1; l < network.length; l++)
  for (let n = 0; n < network[l].length; n++) {
    let value = network[l][n].bias;
    for (let N = 0; N < network[l-1].length; N++)
      value += network[l-1][N].value * network[l-1][N].weights[n];
    network[l][n].value = network[l][n].acfunc(value);
  }
  return network[network.length-1].map(e => e.value);
}

function shuffle(a,b,c,d){//array,placeholder,placeholder,placeholder
  c=a.length;while(c)b=Math.random()*c--|0,d=a[c],a[c]=a[b],a[b]=d
}

( async () => {
  let last = 0;
  let pixels = ctx.getImageData(0, 0, c.width, c.height);
  let coords = [...Array(c.width * c.height)].map((e, i) => ({ x: i%c.width, y: 0|(i/c.width) }))
  
  shuffle(coords)
  let i = 0|(Math.random()*network.length);
  let j = 0|(Math.random()*network[i].length);
  let k = 0|(Math.random()*network[i][j].weights.length);
  let d = Math.random() < 0.5 ? 1 : -1;
  do {
    for (let {x, y} of coords) {
      let X = settings.scale*(x/(c.width-1)-0.5)
      let Y = settings.scale*(y/(c.height-1)-0.5)
      const t = performance.now()/6000;
      const rand = Math.random() * 0;
      let I = 4*(x + y*c.width);
      let col = compute(X, Y);
      if (settings.domain_warp) {
        X += 4*col[3];
        Y += 4*col[4];
        col = compute(X, Y);
      }
      const r = col[0];
      const g = col[1];
      const b = col[2];
      pixels.data[I + 0] = r * 255;
      pixels.data[I + 1] = g * 255;
      pixels.data[I + 2] = b * 255;
      pixels.data[I + 3] = 255;
      if (performance.now() - last > 1000/60) {
        ctx.putImageData(pixels, 0, 0);
        await new Promise(requestAnimationFrame);
        last = performance.now();
      }
      // network[i][j].weights[k] += d * 0.000002;
      // if (Math.random() < 0.00001) {
      //   i = 0|(Math.random()*network.length);
      //   j = 0|(Math.random()*network[i].length);
      //   k = 0|(Math.random()*network[i][j].weights.length);
      //   d = Math.random() < 0.5 ? 1 : -1;
      //   if (Math.random() < 0.75 || Math.abs(network[i][j].weights[k]) > 2) {
      //     d = -Math.sign(network[i][j].weights[k])
      //   }
      // }
    }
    
    // ctx.putImageData(pixels, 0, 0);
    // await new Promise(requestAnimationFrame);
  } while (true)
  ctx.putImageData(pixels, 0, 0);
} )()






