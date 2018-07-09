'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sampleWeighted = exports.setConst = exports.getopt = undefined;

var _assert = require('./assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// syntactic sugar function for getting default parameter values
function getopt(opt, fieldName, defaultValue) {
  if (!opt || !fieldName || !Object.prototype.hasOwnProperty.call(opt, fieldName)) {
    return defaultValue;
  }
  return opt[fieldName];
}

function setConst(arr, c) {
  for (var i = 0, n = arr.length; i < n; i++) {
    arr[i] = c;
  }
}

function sampleWeighted(p) {
  var r = Math.random();
  var c = 0.0;
  for (var i = 0, n = p.length; i < n; i++) {
    c += p[i];
    if (c >= r) {
      return i;
    }
  }
  (0, _assert2.default)(false, 'wtf');
}

exports.getopt = getopt;
exports.setConst = setConst;
exports.sampleWeighted = sampleWeighted;