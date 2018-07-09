'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.netFlattenGrads = exports.netZeroGrads = exports.netFromJSON = exports.netToJSON = undefined;

var _matrix = require('./matrix');

var _matrix2 = _interopRequireDefault(_matrix);

var _randoms = require('./randoms');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function netToJSON(net) {
  var j = {};
  for (var p in net) {
    if (Object.prototype.hasOwnProperty.call(net, p)) {
      j[p] = net[p].toJSON();
    }
  }
  return j;
}
function netFromJSON(j) {
  var net = {};
  for (var p in j) {
    if (Object.prototype.hasOwnProperty.call(j, p)) {
      net[p] = new _matrix2.default(1, 1); // not proud of this
      net[p].fromJSON(j[p]);
    }
  }
  return net;
}
function netZeroGrads(net) {
  for (var p in net) {
    if (Object.prototype.hasOwnProperty.call(net, p)) {
      var mat = net[p];
      (0, _randoms.gradFillConst)(mat, 0);
    }
  }
}
function netFlattenGrads(net) {
  var n = 0;
  for (var p in net) {
    if (Object.prototype.hasOwnProperty.call(net, p)) {
      var mat = net[p];n += mat.dw.length;
    }
  }
  var g = new _matrix2.default(n, 1);
  var ix = 0;
  for (var _p in net) {
    if (Object.prototype.hasOwnProperty.call(net, _p)) {
      var _mat = net[_p];
      for (var i = 0, m = _mat.dw.length; i < m; i++) {
        g.w[ix] = _mat.dw[i];
        ix++;
      }
    }
  }
  return g;
}

exports.netToJSON = netToJSON;
exports.netFromJSON = netFromJSON;
exports.netZeroGrads = netZeroGrads;
exports.netFlattenGrads = netFlattenGrads;