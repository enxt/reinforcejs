'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateNet = exports.updateMat = exports.copyNet = exports.copyMat = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('./assert');

var _assert2 = _interopRequireDefault(_assert);

var _zeros = require('./zeros');

var _zeros2 = _interopRequireDefault(_zeros);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Mat holds a matrix
var Mat = function () {
  function Mat(n, d) {
    _classCallCheck(this, Mat);

    // n is number of rows d is number of columns
    this.n = n;
    this.d = d;
    this.w = (0, _zeros2.default)(n * d);
    this.dw = (0, _zeros2.default)(n * d);
  }

  _createClass(Mat, [{
    key: 'get',
    value: function get(row, col) {
      // slow but careful accessor function
      // we want row-major order
      var ix = this.d * row + col;
      (0, _assert2.default)(ix >= 0 && ix < this.w.length);
      return this.w[ix];
    }
  }, {
    key: 'set',
    value: function set(row, col, v) {
      // slow but careful accessor function
      var ix = this.d * row + col;
      (0, _assert2.default)(ix >= 0 && ix < this.w.length);
      this.w[ix] = v;
    }
  }, {
    key: 'setFrom',
    value: function setFrom(arr) {
      for (var i = 0, n = arr.length; i < n; i++) {
        this.w[i] = arr[i];
      }
    }
  }, {
    key: 'setColumn',
    value: function setColumn(m, i) {
      for (var q = 0, n = m.w.length; q < n; q++) {
        this.w[this.d * q + i] = m.w[q];
      }
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var json = {};
      json.n = this.n;
      json.d = this.d;
      json.w = this.w;
      return json;
    }
  }, {
    key: 'fromJSON',
    value: function fromJSON(json) {
      this.n = json.n;
      this.d = json.d;
      this.w = (0, _zeros2.default)(this.n * this.d);
      this.dw = (0, _zeros2.default)(this.n * this.d);
      for (var i = 0, n = this.n * this.d; i < n; i++) {
        this.w[i] = json.w[i]; // copy over weights
      }
    }
  }]);

  return Mat;
}();

function copyMat(b) {
  var a = new Mat(b.n, b.d);
  a.setFrom(b.w);
  return a;
}

function copyNet(net) {
  // nets are (k,v) pairs with k = string key, v = Mat()
  var newNet = {};
  for (var p in net) {
    if (Object.prototype.hasOwnProperty.call(net, p)) {
      newNet[p] = copyMat(net[p]);
    }
  }
  return newNet;
}

function updateMat(m, alpha) {
  // updates in place
  for (var i = 0, n = m.n * m.d; i < n; i++) {
    if (m.dw[i] !== 0) {
      m.w[i] += -alpha * m.dw[i];
      m.dw[i] = 0;
    }
  }
}

function updateNet(net, alpha) {
  for (var p in net) {
    if (Object.prototype.hasOwnProperty.call(net, p)) {
      updateMat(net[p], alpha);
    }
  }
}

exports.default = Mat;
exports.copyMat = copyMat;
exports.copyNet = copyNet;
exports.updateMat = updateMat;
exports.updateNet = updateNet;