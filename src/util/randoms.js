import Mat from './matrix.js';

// Random numbers utils
let returnValue = false;
let variableVal = 0.0;

function gaussRandom() {
  if (returnValue) {
    returnValue = false;
    return variableVal;
  }
  const u = 2 * Math.random() - 1;
  const v = 2 * Math.random() - 1;
  const r = u * u + v * v;
  if (r === 0 || r > 1) {
    return gaussRandom();
  }
  const c = Math.sqrt(-2 * Math.log(r) / r);
  variableVal = v * c; // cache this
  returnValue = true;
  return u * c;
}

function randf(a, b) {
  return Math.random() * (b - a) + a;
}
function randi(a, b) {
  return Math.floor(Math.random() * (b - a) + a);
}
function randn(mu, std) {
  return mu + gaussRandom() * std;
}

// Mat utils
// fill matrix with random gaussian numbers
function fillRandn(m, mu, std) {
  for (let i = 0, n = m.w.length; i < n; i++) {
    m.w[i] = randn(mu, std);
  }
}
function fillRand(m, lo, hi) {
  for (let i = 0, n = m.w.length; i < n; i++) {
    m.w[i] = randf(lo, hi);
  }
}
function gradFillConst(m, c) {
  for (let i = 0, n = m.dw.length; i < n; i++) {
    m.dw[i] = c;
  }
}

// return Mat but filled with random numbers from gaussian
function RandMat(n, d, mu, std) {
  const m = new Mat(n, d);
  fillRandn(m, mu, std);
  // fillRand(m,-std,std); // kind of :P
  return m;
}

export {
  gaussRandom,
  randf,
  randn,
  randi,
  RandMat,
  fillRandn,
  fillRand,
  gradFillConst
};
