'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assert = require('../util/assert');

var _assert2 = _interopRequireDefault(_assert);

var _randoms = require('../util/randoms');

var _zeros = require('../util/zeros');

var _zeros2 = _interopRequireDefault(_zeros);

var _matrix = require('../util/matrix');

var _matrix2 = _interopRequireDefault(_matrix);

var _graph = require('../util/graph');

var _graph2 = _interopRequireDefault(_graph);

var _solver = require('../util/solver');

var _solver2 = _interopRequireDefault(_solver);

var _algos = require('../util/algos');

var _lstm = require('../util/lstm');

var _net = require('../util/net');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Recurrent = {
  // various utils
  assert: _assert2.default,
  zeros: _zeros2.default,
  maxi: _algos.maxi,
  samplei: _algos.samplei,
  sig: _algos.sig,
  randi: _randoms.randi,
  randf: _randoms.randf,
  randn: _randoms.randn,
  softmax: _algos.softmax,
  // classes
  Mat: _matrix2.default,
  RandMat: _randoms.RandMat,
  forwardLSTM: _lstm.forwardLSTM,
  initLSTM: _lstm.initLSTM,
  // more utils
  gradFillConst: _randoms.gradFillConst,
  gaussRandom: _randoms.gaussRandom,
  fillRandn: _randoms.fillRandn,
  fillRand: _randoms.fillRand,
  updateMat: _matrix.updateMat,
  updateNet: _matrix.updateNet,
  copyMat: _matrix.copyMat,
  copyNet: _matrix.copyNet,
  netToJSON: _net.netToJSON,
  netFromJSON: _net.netFromJSON,
  netZeroGrads: _net.netZeroGrads,
  netFlattenGrads: _net.netFlattenGrads,
  // optimization
  Solver: _solver2.default,
  Graph: _graph2.default
}; // the Recurrent library

exports.default = Recurrent;