// main stuff
// jshint esversion: 11
const c = $('canvas#render');
const ctx = c.getContext('2d');
c.width = c.height = 256;

let network = makeNetwork();

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
  network.init(2, 4, 4, 4, 4, 5);
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
$('#restart_render').on('click', e => restart_render = true);

;(async () => {
  let last = 0;
  let pixels, pixelCoords;
  let chunks, chunkCoords, chunk_size;
  
  let i = 0|rand(network.brain.length);
  let j = 0|rand(network.brain[i].length);
  let k = 0|rand(network.brain[i][j].weights.length);
  let d = rand() < 0.5 ? 1 : -1;
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
        let col = network.compute(X, Y);
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
})()


