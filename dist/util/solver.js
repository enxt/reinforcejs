'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _matrix = require('./matrix');

var _matrix2 = _interopRequireDefault(_matrix);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Solver = function () {
  function Solver() {
    _classCallCheck(this, Solver);

    this.decayRate = 0.999;
    this.smoothEps = 1e-8;
    this.stepCache = {};
  }

  _createClass(Solver, [{
    key: 'step',
    value: function step(model, stepSize, regc, clipval) {
      // perform parameter update
      var solverStats = {};
      var numClipped = 0.0;
      var numTotal = 0.0;
      for (var k in model) {
        if (Object.prototype.hasOwnProperty.call(model, k)) {
          var m = model[k]; // mat ref
          if (!(k in this.stepCache)) {
            this.stepCache[k] = new _matrix2.default(m.n, m.d);
          }
          var s = this.stepCache[k];
          for (var i = 0, n = m.w.length; i < n; i++) {
            // rmsprop adaptive learning rate
            var mdwi = m.dw[i];
            s.w[i] = s.w[i] * this.decayRate + (1.0 - this.decayRate) * mdwi * mdwi;

            // gradient clip
            if (mdwi > clipval) {
              mdwi = clipval;
              numClipped++;
            }
            if (mdwi < -clipval) {
              mdwi = -clipval;
              numClipped++;
            }
            numTotal++;

            // update (and regularize)
            m.w[i] += -stepSize * mdwi / Math.sqrt(s.w[i] + this.smoothEps) - regc * m.w[i];
            m.dw[i] = 0; // reset gradients for next iteration
          }
        }
      }
      solverStats.ratioClipped = numClipped / numTotal;
      return solverStats;
    }
  }]);

  return Solver;
}();

exports.default = Solver;