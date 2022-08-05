// jshint esversion: 10
const $ = query => document.querySelector(query);
const $$ = query => document.querySelectorAll(query);
EventTarget.prototype.on = function (...args) { return this.addEventListener(...args) };
EventTarget.prototype.trigger = function (event) { return this.dispatchEvent(new Event(event)) };


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
  tan, invSin, valleys, splitHalf, steps,
  tanh, wrap, value_noise,
  fractal_sin, fractal_fold, fractal_value_noise
}

let settings = {
  scale: 3,
  domain_warping: false,
  warping_amount: 2,
  noise_seed: Math.random()
};

let refresh_size = true;
function resize(size) {
  c.width = c.height = size;
  refresh_size = true;
}

c.on('click', e => {
  if (activators.length == 0) return;
  settings.noise_seed = Math.random();
  init(2, 4, 4, 4, 4, 5);
});
on('keydown', e => e.key=='Enter' && c.trigger('click'));
c.trigger('click');

$$('span[input="option"]').forEach(el => {
  el.on('click', e => {
    if (activators.includes(activator_options[el.id]))
      activators.splice(activators.indexOf(activator_options[el.id]), 1);
    else activators.push(activator_options[el.id]);
    el.classList.toggle('active');
  })
});
$$('span[input="boolean"]').forEach(el => {
  el.on('click', e => {
    settings[el.id] = !settings[el.id];
    el.classList.toggle('active');
    $$('[need]').forEach(n => {
      if (n.getAttribute('need') != el.id) return;
      if (!settings[el.id]) n.setAttribute('sad', '');
      else n.removeAttribute('sad');
    });
  });
});
$$('span[input="number"]').forEach(el => {
  let reader = document.createElement('span');
  reader.innerHTML = ' = 2.0';
  reader.classList.add('reader')
  let pp = document.createElement('span');
  pp.innerHTML = ' ++';
  pp.on('click', e => {
    if (!settings[el.getAttribute('need')]) return;
    settings[el.id] += 0.5;
    reader.innerHTML = ` = ${settings[el.id].toFixed(1)}`;
  });
  el.insertAdjacentElement('beforeend', pp);
  el.insertAdjacentElement('beforeend', reader);
  let mm = document.createElement('span');
  mm.innerHTML = '-- ';
  mm.on('click', e => {
    if (!settings[el.getAttribute('need')]) return;
    settings[el.id] -= 0.5;
    reader.innerHTML = ` = ${settings[el.id].toFixed(1)}`;
  });
  el.insertAdjacentElement('afterbegin', mm);
});

function init(...Ls) {
  network = [];
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
  let N = (n<0 ? -n : n)%2;
  if (N > 1) return 2 - N;
  return N;
}
function valleys(n) {
  let N = n+1;
  while (N < -1) N += 2;
  while (N > 1) N -= 2;
  N = (n<0 ? -n : n);
  return Math.pow(N, 2/3);
}

function value_noise(n) {
  let scale = 2.5;
  let N = scale*n - Math.floor(scale*n);
  let x1 = Math.sin(100*settings.noise_seed + Math.floor(scale*n)) * 43758.5453123;
  x1 = x1 - Math.floor(x1);
  let x2 = Math.sin(100*settings.noise_seed + Math.floor(scale*n+1)) * 43758.5453123;
  x2 = x2 - Math.floor(x2);
  return x1*(1-N) + x2*(N);
}
function fractal_func(func) {
  return function(n) {
    let sum = 0, a = 0.5;
    let falloff = 2.5;
    for (let i = 0; i <= 6; i++) {
      let p = Math.pow(falloff, i);
      sum += func(p * n) / p;
      a += 1 / p;
    }
    return 1.2 * sum / a;
  }
}
function fractal_sin(n) { return fractal_func(sin)(n) }
function fractal_fold(n) { return fractal_func(fold)(n) }
function fractal_value_noise(n) { return fractal_func(value_noise)(n) }

function sin(n) { return 0.5*(Math.sin(Math.PI*(n-0.5))+1); }
function tan(n) { return 0.5*(Math.tan(n*0.9)+1); }
function invSin(n) { return 1/Math.pow(sin(n), 0.2) - 1; }
function tanh(n) { return Math.tanh((n+2) % 2); }
function splitHalf(n) { return n < 0 ? 0 : 1; }
function steps(n) { return (0|(8*n))/7; }

function compute(...inputs) {
  // network[0][0].value = inputs[0];
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
  let pixels, coords;
  
  let i = 0|(Math.random()*network.length);
  let j = 0|(Math.random()*network[i].length);
  let k = 0|(Math.random()*network[i][j].weights.length);
  let d = Math.random() < 0.5 ? 1 : -1;
  do {
    if (refresh_size) {
      pixels = ctx.getImageData(0, 0, c.width, c.height);
      coords = [...Array(c.width * c.height)].map((e, i) => ({ x: i%c.width, y: 0|(i/c.width) }));
      shuffle(coords);
      refresh_size = false;
    }
    for (let {x, y} of coords) {
      if (refresh_size) break;
      let X = settings.scale*(x/(c.width-1)-0.5)
      let Y = settings.scale*(y/(c.height-1)-0.5)
      const t = performance.now()/6000;
      const rand = Math.random() * 0;
      let I = 4*(x + y*c.width);
      let col = compute(X, Y);
      if (settings.domain_warping) {
        X += settings.warping_amount*col[3];
        Y += settings.warping_amount*col[4];
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




