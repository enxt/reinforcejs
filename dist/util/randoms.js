'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.gradFillConst = exports.fillRand = exports.fillRandn = exports.RandMat = exports.randi = exports.randn = exports.randf = exports.gaussRandom = undefined;

var _matrix = require('./matrix.js');

var _matrix2 = _interopRequireDefault(_matrix);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Random numbers utils
var returnValue = false;
var variableVal = 0.0;

function gaussRandom() {
  if (returnValue) {
    returnValue = false;
    return variableVal;
  }
  var u = 2 * Math.random() - 1;
  var v = 2 * Math.random() - 1;
  var r = u * u + v * v;
  if (r === 0 || r > 1) {
    return gaussRandom();
  }
  var c = Math.sqrt(-2 * Math.log(r) / r);
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
  for (var i = 0, n = m.w.length; i < n; i++) {
    m.w[i] = randn(mu, std);
  }
}
function fillRand(m, lo, hi) {
  for (var i = 0, n = m.w.length; i < n; i++) {
    m.w[i] = randf(lo, hi);
  }
}
function gradFillConst(m, c) {
  for (var i = 0, n = m.dw.length; i < n; i++) {
    m.dw[i] = c;
  }
}

// return Mat but filled with random numbers from gaussian
function RandMat(n, d, mu, std) {
  var m = new _matrix2.default(n, d);
  fillRandn(m, mu, std);
  // fillRand(m,-std,std); // kind of :P
  return m;
}

exports.gaussRandom = gaussRandom;
exports.randf = randf;
exports.randn = randn;
exports.randi = randi;
exports.RandMat = RandMat;
exports.fillRandn = fillRandn;
exports.fillRand = fillRand;
exports.gradFillConst = gradFillConst;