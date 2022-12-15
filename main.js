// main stuff
// jshint esversion: 11
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
  clamp, sigmoid, fold, sin, tan, invSin,
  valleys, splitHalf, steps, tanh, wrap,
  value_noise, smooth_value_noise, fractal_sin,
  fractal_fold, fractal_value_noise,
  fractal_smooth_value_noise
}

let settings = {
  scale: 3,
  res: 8,
  get resolution() { return this.res },
  set resolution(v) { this.res = v; resize(2**v); return v },
  domain_warping: false,
  warping_amount: 2,
  noise_seed: Math.random(),
  grain: true,
  chunk_size: 6
};

let needs_refresh = true;
function resize(size) {
  c.width = c.height = size;
  needs_refresh = true;
}

c.on('click', e => {
  if (activators.length == 0) return;
  settings.noise_seed = Math.random();
  init(2, 4, 4, 4, 4, 5);
  needs_refresh = true;
  $('[hint]').classList.add('hidden');
});
on('keydown', e => e.key=='Enter' && c.trigger('click'));
c.trigger('click');
$('[hint]').classList.remove('hidden');

$$('span[input="option"]').forEach(el => {
  el.on('click', e => {
    if (activators.includes(activator_options[el.id]))
      activators.splice(activators.indexOf(activator_options[el.id]), 1);
    else activators.push(activator_options[el.id]);
    el.classList.toggle('active');
    needs_refresh = true;
  })
});
$$('span[input="boolean"]').forEach(el => {
  if (settings[el.id]) el.classList.add('active');
  el.on('click', e => {
    settings[el.id] = !settings[el.id];
    el.classList.toggle('active');
    $$('[need]').forEach(n => {
      if (n.getAttribute('need') != el.id) return;
      if (!settings[el.id]) n.setAttribute('sad', 'sad');
      else n.removeAttribute('sad');
    });
    needs_refresh = true;
  });
});
$$('span[input="number"]').forEach(el => {
  const map = new Function('return ' + (el.getAttribute('map') ?? 'i => i.toFixed(1)'))();
  const crement = +(el.getAttribute('crement') ?? 0.5);
  const min = +(el.getAttribute('min') ?? -Infinity);
  const max = +(el.getAttribute('max') ?? Infinity);
                           
  let reader = document.createElement('span');
  reader.innerHTML = ' = ' + map(settings[el.id]);
  reader.classList.add('reader');
  let pp = document.createElement('span');
  pp.innerHTML = ' ++';
  pp.on('click', e => {
    if (el.getAttribute('need') && !settings[el.getAttribute('need')]) return;
    settings[el.id] += crement;
    settings[el.id] = Math.min(max, settings[el.id]);
    reader.innerHTML = ' = ' + map(settings[el.id]);
    needs_refresh = true;
  });
  let mm = document.createElement('span');
  mm.innerHTML = '-- ';
  mm.on('click', e => {
    if (el.getAttribute('need') && !settings[el.getAttribute('need')]) return;
    settings[el.id] -= crement;
    settings[el.id] = Math.max(min, settings[el.id]);
    reader.innerHTML = ' = ' + map(settings[el.id]);
    needs_refresh = true;
  });
  el.insertAdjacentElement('beforeend', pp);
  el.insertAdjacentElement('beforeend', reader);
  el.insertAdjacentElement('afterbegin', mm);
});

let num_saved = 0;
let dateObj = new Date();
let time = `${dateObj.getUTCFullYear()}${dateObj.getUTCMonth()+1}${dateObj.getUTCDate()}`;
$('#save').on('click', e => {
  let link = document.createElement('a');
  link.download = `graidient-${time}_${num_saved++}.png`;
  link.href = c.toDataURL()
  link.click();
});
let restart_render = false;
$('#restart_render').on('click', e => restart_render = true)

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
  const scale = 2;
  let N = scale*n - Math.floor(scale*n);
  let x1 = Math.sin(100*settings.noise_seed + Math.floor(scale*n)) * 43758.5453123;
  x1 = x1 - Math.floor(x1);
  let x2 = Math.sin(100*settings.noise_seed + Math.floor(scale*n+1)) * 43758.5453123;
  x2 = x2 - Math.floor(x2);
  return x1*(1-N) + x2*(N);
}
function smooth_value_noise(n) {
  const scale = 2;
  let N = scale*n - Math.floor(scale*n);
  let x1 = Math.sin(100*settings.noise_seed + Math.floor(scale*n)) * 43758.5453123;
  x1 = x1 - Math.floor(x1);
  let x2 = Math.sin(100*settings.noise_seed + Math.floor(scale*n+1)) * 43758.5453123;
  x2 = x2 - Math.floor(x2);
  const f = n => n*n*(3-2*n);
  return x1*f(1-N) + x2*f(N);
}

function fractal_func(func) {
  const falloff = 2;
  const shift = 437.585453123;
  const octaves = 5;
  return function(n) {
    let value = 0;
    let amplitude = 1/falloff;
    let x = n;
    for (let i = 0; i < octaves; ++i) {
      value += amplitude * func(x);
      x = falloff * x + shift;
      amplitude /= falloff;
    }
    return value;
  }
}
function fractal_sin(n) { return fractal_func(sin)(n) }
function fractal_fold(n) { return fractal_func(fold)(n) }
function fractal_value_noise(n) { return fractal_func(value_noise)(n*0.75)*1.75 }
function fractal_smooth_value_noise(n) { return fractal_func(smooth_value_noise)(n*0.75)*1.75 }

function sin(n) { return 0.5*(Math.sin(Math.PI*(n-0.5))+1); }
function tan(n) { return 0.5*(Math.tan(n*0.9)+1); }
function invSin(n) { return 1/Math.pow(sin(n), 0.2) - 1; }
function tanh(n) { return Math.tanh((n+4) % 2); }
function splitHalf(n) { return n < 0 ? 0 : 1; }
function steps(n) { return (0|(8*n))/7; }

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
  let pixels, pixelCoords;
  let chunks, chunkCoords, chunk_size;
  
  let i = 0|(Math.random()*network.length);
  let j = 0|(Math.random()*network[i].length);
  let k = 0|(Math.random()*network[i][j].weights.length);
  let d = Math.random() < 0.5 ? 1 : -1;
  do {
    needs_refresh = false;
    chunk_size = Math.min(c.width, 2**settings.chunk_size);
    
    chunkCoords = [...Array((c.width/chunk_size) ** 2)].map((e, i) => ({
      chunkX: i%(c.width/chunk_size),
      chunkY: 0|(i/(c.width/chunk_size))
    }));
    // shuffle(chunkCoords);
    render: for (let { chunkX, chunkY } of chunkCoords) {
      pixels = ctx.getImageData(chunkX*chunk_size, chunkY*chunk_size, chunk_size, chunk_size);
      pixelCoords = [...Array(chunk_size ** 2)].map((e, i) => ({ x: i%chunk_size, y: 0|(i/chunk_size) }));
      shuffle(pixelCoords);
      for (let { x, y } of pixelCoords) {
        if (restart_render) break render;
        let X = x + chunkX*chunk_size;
        let Y = y + chunkY*chunk_size;
        Y = settings.scale*(Y/(c.height-1) - 0.5);
        X = settings.scale*(X/(c.width-1) - 0.5);
        let I = 4*(x + y*chunk_size);
        let col = compute(X, Y);
        if (settings.domain_warping) {
          X += settings.warping_amount*col[3];
          Y += settings.warping_amount*col[4];
          col = compute(X, Y);
        }
        const [r, g, b] = col;
        pixels.data[I + 0] = r * 255;
        pixels.data[I + 1] = g * 255;
        pixels.data[I + 2] = b * 255;
        pixels.data[I + 3] = 255;
        if (settings.grain && performance.now() - last > 1000/70) {
          ctx.putImageData(pixels, chunkX*chunk_size, chunkY*chunk_size);
          await new Promise(requestAnimationFrame);
          last = performance.now();
        }
      }
      ctx.putImageData(pixels, chunkX*chunk_size, chunkY*chunk_size);
      await new Promise(requestAnimationFrame);
    }
    
    while (!needs_refresh) await new Promise(requestAnimationFrame);
    restart_render = false;
    
  } while (true);
} )()


