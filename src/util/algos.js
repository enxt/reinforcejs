import Mat from './matrix';

import {
  randf
} from '../util/randoms';

function sig(x) {
  // helper function for computing sigmoid
  return 1.0 / (1 + Math.exp(-x));
}

function maxi(w) {
  // argmax of array w
  let maxv = w[0];
  let maxix = 0;
  for (let i = 1, n = w.length; i < n; i++) {
    if (w[i] > maxv) {
      maxix = i;
      maxv = w[i];
    }
  }
  return maxix;
}

function samplei(w) {
  // sample argmax from w, assuming w are
  // probabilities that sum to one
  const r = randf(0, 1);
  let x = 0.0;
  let i = 0;
  let loop = true;
  while (loop) {
    x += w[i];
    if (x > r) {
      loop = false;
      return i;
    }
    i++;
  }
  return w.length - 1; // pretty sure we should never get here?
}


function softmax(m) {
  const out = new Mat(m.n, m.d); // probability volume
  let maxval = -999999;
  let i = 0;
  const n = m.w.length;
  let s = 0.0;

  for (i = 0; i < n; i++) {
    if (m.w[i] > maxval) {
      maxval = m.w[i];
    }
  }

  for (i = 0; i < n; i++) {
    out.w[i] = Math.exp(m.w[i] - maxval);
    s += out.w[i];
  }
  for (i = 0; i < n; i++) {
    out.w[i] /= s;
  }

  // no backward pass here needed
  // since we will use the computed probabilities outside
  // to set gradients directly on m
  return out;
}

export {
  softmax,
  sig,
  maxi,
  samplei
};
