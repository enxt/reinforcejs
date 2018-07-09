'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('./assert');

var _assert2 = _interopRequireDefault(_assert);

var _algos = require('./algos');

var _matrix = require('./matrix');

var _matrix2 = _interopRequireDefault(_matrix);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Transformer definitions
var Graph = function () {
  function Graph() {
    var needsBackprop = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    _classCallCheck(this, Graph);

    this.needsBackprop = needsBackprop;

    // this will store a list of functions that perform backprop,
    // in their forward pass order. So in backprop we will go
    // backwards and evoke each one
    this.backprop = [];
  }

  _createClass(Graph, [{
    key: 'backward',
    value: function backward() {
      for (var i = this.backprop.length - 1; i >= 0; i--) {
        this.backprop[i](); // tick!
      }
    }
  }, {
    key: 'rowPluck',
    value: function rowPluck(m, ix) {
      // pluck a row of m with index ix and return it as col vector
      (0, _assert2.default)(ix >= 0 && ix < m.n);
      var d = m.d;
      var out = new _matrix2.default(d, 1);
      for (var i = 0, n = d; i < n; i++) {
        out.w[i] = m.w[d * ix + i];
      } // copy over the data

      if (this.needsBackprop) {
        var backward = function backward() {
          for (var _i = 0, _n = d; _i < _n; _i++) {
            m.dw[d * ix + _i] += out.dw[_i];
          }
        };
        this.backprop.push(backward);
      }
      return out;
    }
  }, {
    key: 'tanh',
    value: function tanh(m) {
      // tanh nonlinearity
      var out = new _matrix2.default(m.n, m.d);
      var n = m.w.length;
      for (var i = 0; i < n; i++) {
        out.w[i] = Math.tanh(m.w[i]);
      }

      if (this.needsBackprop) {
        var backward = function backward() {
          for (var _i2 = 0; _i2 < n; _i2++) {
            // grad for z = tanh(x) is (1 - z^2)
            var mwi = out.w[_i2];
            m.dw[_i2] += (1.0 - mwi * mwi) * out.dw[_i2];
          }
        };
        this.backprop.push(backward);
      }
      return out;
    }
  }, {
    key: 'sigmoid',
    value: function sigmoid(m) {
      // sigmoid nonlinearity
      var out = new _matrix2.default(m.n, m.d);
      var n = m.w.length;
      for (var i = 0; i < n; i++) {
        out.w[i] = (0, _algos.sig)(m.w[i]);
      }

      if (this.needsBackprop) {
        var backward = function backward() {
          for (var _i3 = 0; _i3 < n; _i3++) {
            // grad for z = tanh(x) is (1 - z^2)
            var mwi = out.w[_i3];
            m.dw[_i3] += mwi * (1.0 - mwi) * out.dw[_i3];
          }
        };
        this.backprop.push(backward);
      }
      return out;
    }
  }, {
    key: 'relu',
    value: function relu(m) {
      var out = new _matrix2.default(m.n, m.d);
      var n = m.w.length;
      for (var i = 0; i < n; i++) {
        out.w[i] = Math.max(0, m.w[i]); // relu
      }
      if (this.needsBackprop) {
        var backward = function backward() {
          for (var _i4 = 0; _i4 < n; _i4++) {
            m.dw[_i4] += m.w[_i4] > 0 ? out.dw[_i4] : 0.0;
          }
        };
        this.backprop.push(backward);
      }
      return out;
    }
  }, {
    key: 'mul',
    value: function mul(m1, m2) {
      // multiply matrices m1 * m2
      (0, _assert2.default)(m1.d === m2.n, 'matmul dimensions misaligned');

      var n = m1.n;
      var d = m2.d;
      var out = new _matrix2.default(n, d);
      for (var i = 0; i < m1.n; i++) {
        // loop over rows of m1
        for (var j = 0; j < m2.d; j++) {
          // loop over cols of m2
          var dot = 0.0;
          for (var k = 0; k < m1.d; k++) {
            // dot product loop
            dot += m1.w[m1.d * i + k] * m2.w[m2.d * k + j];
          }
          out.w[d * i + j] = dot;
        }
      }

      if (this.needsBackprop) {
        var backward = function backward() {
          for (var _i5 = 0; _i5 < m1.n; _i5++) {
            // loop over rows of m1
            for (var _j = 0; _j < m2.d; _j++) {
              // loop over cols of m2
              for (var _k = 0; _k < m1.d; _k++) {
                // dot product loop
                var b = out.dw[d * _i5 + _j];
                m1.dw[m1.d * _i5 + _k] += m2.w[m2.d * _k + _j] * b;
                m2.dw[m2.d * _k + _j] += m1.w[m1.d * _i5 + _k] * b;
              }
            }
          }
        };
        this.backprop.push(backward);
      }
      return out;
    }
  }, {
    key: 'add',
    value: function add(m1, m2) {
      (0, _assert2.default)(m1.w.length === m2.w.length);

      var out = new _matrix2.default(m1.n, m1.d);
      for (var i = 0, n = m1.w.length; i < n; i++) {
        out.w[i] = m1.w[i] + m2.w[i];
      }
      if (this.needsBackprop) {
        var backward = function backward() {
          for (var _i6 = 0, _n2 = m1.w.length; _i6 < _n2; _i6++) {
            m1.dw[_i6] += out.dw[_i6];
            m2.dw[_i6] += out.dw[_i6];
          }
        };
        this.backprop.push(backward);
      }
      return out;
    }
  }, {
    key: 'dot',
    value: function dot(m1, m2) {
      // m1 m2 are both column vectors
      (0, _assert2.default)(m1.w.length === m2.w.length);
      var out = new _matrix2.default(1, 1);
      var dot = 0.0;
      for (var i = 0, n = m1.w.length; i < n; i++) {
        dot += m1.w[i] * m2.w[i];
      }
      out.w[0] = dot;
      if (this.needsBackprop) {
        var backward = function backward() {
          for (var _i7 = 0, _n3 = m1.w.length; _i7 < _n3; _i7++) {
            m1.dw[_i7] += m2.w[_i7] * out.dw[0];
            m2.dw[_i7] += m1.w[_i7] * out.dw[0];
          }
        };
        this.backprop.push(backward);
      }
      return out;
    }
  }, {
    key: 'eltmul',
    value: function eltmul(m1, m2) {
      (0, _assert2.default)(m1.w.length === m2.w.length);

      var out = new _matrix2.default(m1.n, m1.d);
      for (var i = 0, n = m1.w.length; i < n; i++) {
        out.w[i] = m1.w[i] * m2.w[i];
      }
      if (this.needsBackprop) {
        var backward = function backward() {
          for (var _i8 = 0, _n4 = m1.w.length; _i8 < _n4; _i8++) {
            m1.dw[_i8] += m2.w[_i8] * out.dw[_i8];
            m2.dw[_i8] += m1.w[_i8] * out.dw[_i8];
          }
        };
        this.backprop.push(backward);
      }
      return out;
    }
  }]);

  return Graph;
}();

exports.default = Graph;