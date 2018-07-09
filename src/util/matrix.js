import assert from './assert';
import zeros from './zeros';

// Mat holds a matrix
class Mat {
  constructor(n, d) {
    // n is number of rows d is number of columns
    this.n = n;
    this.d = d;
    this.w = zeros(n * d);
    this.dw = zeros(n * d);
  }

  get(row, col) {
    // slow but careful accessor function
    // we want row-major order
    const ix = (this.d * row) + col;
    assert(ix >= 0 && ix < this.w.length);
    return this.w[ix];
  }
  set(row, col, v) {
    // slow but careful accessor function
    const ix = (this.d * row) + col;
    assert(ix >= 0 && ix < this.w.length);
    this.w[ix] = v;
  }
  setFrom(arr) {
    for (let i = 0, n = arr.length; i < n; i++) {
      this.w[i] = arr[i];
    }
  }
  setColumn(m, i) {
    for (let q = 0, n = m.w.length; q < n; q++) {
      this.w[(this.d * q) + i] = m.w[q];
    }
  }
  toJSON() {
    const json = {};
    json.n = this.n;
    json.d = this.d;
    json.w = this.w;
    return json;
  }
  fromJSON(json) {
    this.n = json.n;
    this.d = json.d;
    this.w = zeros(this.n * this.d);
    this.dw = zeros(this.n * this.d);
    for (let i = 0, n = this.n * this.d; i < n; i++) {
      this.w[i] = json.w[i];  // copy over weights
    }
  }
}


function copyMat(b) {
  const a = new Mat(b.n, b.d);
  a.setFrom(b.w);
  return a;
}

function copyNet(net) {
  // nets are (k,v) pairs with k = string key, v = Mat()
  const newNet = {};
  for (const p in net) {
    if (Object.prototype.hasOwnProperty.call(net, p)) {
      newNet[p] = copyMat(net[p]);
    }
  }
  return newNet;
}

function updateMat(m, alpha) {
  // updates in place
  for (let i = 0, n = m.n * m.d; i < n; i++) {
    if (m.dw[i] !== 0) {
      m.w[i] += -alpha * m.dw[i];
      m.dw[i] = 0;
    }
  }
}

function updateNet(net, alpha) {
  for (const p in net) {
    if (Object.prototype.hasOwnProperty.call(net, p)) {
      updateMat(net[p], alpha);
    }
  }
}


export default Mat;

export {
  copyMat,
  copyNet,
  updateMat,
  updateNet
};
