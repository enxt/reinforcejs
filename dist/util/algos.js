'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.samplei = exports.maxi = exports.sig = exports.softmax = undefined;

var _matrix = require('./matrix');

var _matrix2 = _interopRequireDefault(_matrix);

var _randoms = require('../util/randoms');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function sig(x) {
  // helper function for computing sigmoid
  return 1.0 / (1 + Math.exp(-x));
}

function maxi(w) {
  // argmax of array w
  var maxv = w[0];
  var maxix = 0;
  for (var i = 1, n = w.length; i < n; i++) {
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
  var r = (0, _randoms.randf)(0, 1);
  var x = 0.0;
  var i = 0;
  var loop = true;
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
  var out = new _matrix2.default(m.n, m.d); // probability volume
  var maxval = -999999;
  var i = 0;
  var n = m.w.length;
  var s = 0.0;

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

exports.softmax = softmax;
exports.sig = sig;
exports.maxi = maxi;
exports.samplei = samplei;