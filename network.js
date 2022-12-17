// network stuff
const makeNetwork = () => {
    return {
      brain: [],
      init(...Ls) {
        this.brain.length = 0;
        let layers = [...Ls, []];
        for (let l = 0; l < layers.length-1; l++) {
          let layer = [];
          for (let n = 0; n < layers[l]; n++) {
            const node = makeNode(layers[l+1]);
            layer.push(node);
          }
          this.brain.push(layer);
        }
      },
      compute(...inputs) {
        for (let i in inputs) this.brain[0][i].value = inputs[i];
        for (let l in this.brain)
        for (let n in this.brain[l]) {
          if (l == 0) continue;
          let value = this.brain[l][n].bias;
          for (let N = 0; N < this.brain[l-1].length; N++)
            value += this.brain[l-1][N].value * this.brain[l-1][N].weights[n];
          this.brain[l][n].value = this.brain[l][n].acfunc(value);
        }
        return this.brain[this.brain.length-1].map(e => e.value);
      }
    };
  };
  
  const makeNode = (num_weights) => {
    return {
      weights: [...Array(num_weights)].map(e => 2*Math.random()-1),
      bias: 2*Math.random()-1,
      value: 0,
      acfunc: activators[0|(Math.random()*activators.length)]
    }
  }
  
  let activators = [sin];
  
  let activator_options = {
    clamp, sigmoid, fold, sin, tan, invSin,
    valleys, splitHalf, steps, tanh, wrap,
    value_noise, smooth_value_noise, fractal_sin,
    fractal_fold, fractal_value_noise,
    fractal_smooth_value_noise
  }
  
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x }
  function sigmoid(n) { return 1 / (1 + Math.exp(-n * 8)) }
  
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
  