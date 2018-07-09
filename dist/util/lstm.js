'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.forwardLSTM = exports.initLSTM = undefined;

var _matrix = require('./matrix');

var _matrix2 = _interopRequireDefault(_matrix);

var _randoms = require('../util/randoms');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function initLSTM(inputLayerSize, hiddenLayerSizes, outputLayerSize) {
  // hidden size should be a list

  var model = {};
  for (var d = 0; d < hiddenLayerSizes.length; d++) {
    // loop over depths
    var prevSize = d === 0 ? inputLayerSize : hiddenLayerSizes[d - 1];
    var hiddenLayerSize = hiddenLayerSizes[d];

    // gates parameters
    model['Wix' + d] = new _randoms.RandMat(hiddenLayerSize, prevSize, 0, 0.08);
    model['Wih' + d] = new _randoms.RandMat(hiddenLayerSize, hiddenLayerSize, 0, 0.08);
    model['bi' + d] = new _matrix2.default(hiddenLayerSize, 1);
    model['Wfx' + d] = new _randoms.RandMat(hiddenLayerSize, prevSize, 0, 0.08);
    model['Wfh' + d] = new _randoms.RandMat(hiddenLayerSize, hiddenLayerSize, 0, 0.08);
    model['bf' + d] = new _matrix2.default(hiddenLayerSize, 1);
    model['Wox' + d] = new _randoms.RandMat(hiddenLayerSize, prevSize, 0, 0.08);
    model['Woh' + d] = new _randoms.RandMat(hiddenLayerSize, hiddenLayerSize, 0, 0.08);
    model['bo' + d] = new _matrix2.default(hiddenLayerSize, 1);
    // cell write params
    model['Wcx' + d] = new _randoms.RandMat(hiddenLayerSize, prevSize, 0, 0.08);
    model['Wch' + d] = new _randoms.RandMat(hiddenLayerSize, hiddenLayerSize, 0, 0.08);
    model['bc' + d] = new _matrix2.default(hiddenLayerSize, 1);
  }
  // decoder params
  // ??? hiddenLayerSizes.length ? hiddenLayerSize
  model.Whd = new _randoms.RandMat(outputLayerSize, hiddenLayerSizes.length, 0, 0.08);
  model.bd = new _matrix2.default(outputLayerSize, 1);
  return model;
}

function forwardLSTM(G, model, hiddenLayerSizes, x, prev) {
  // forward prop for a single tick of LSTM
  // G is graph to append ops to
  // model contains LSTM parameters
  // x is 1D column vector with observation
  // prev is a struct containing hidden and cell
  // from previous iteration
  var previousHiddenLayers = [];
  var previousCells = [];

  if (prev === null || typeof prev.h === 'undefined') {
    for (var d = 0; d < hiddenLayerSizes.length; d++) {
      previousHiddenLayers.push(new _matrix2.default(hiddenLayerSizes[d], 1));
      previousCells.push(new _matrix2.default(hiddenLayerSizes[d], 1));
    }
  } else {
    previousHiddenLayers = prev.h;
    previousCells = prev.c;
  }

  var hiddenLayers = [];
  var cells = [];
  for (var _d = 0; _d < hiddenLayerSizes.length; _d++) {
    var inputVector = _d === 0 ? x : hiddenLayers[_d - 1];
    var previousHidden = previousHiddenLayers[_d];
    var previousCell = previousCells[_d];

    // input gate
    var h0 = G.mul(model['Wix' + _d], inputVector);
    var h1 = G.mul(model['Wih' + _d], previousHidden);
    var inputGate = G.sigmoid(G.add(G.add(h0, h1), model['bi' + _d]));

    // forget gate
    var h2 = G.mul(model['Wfx' + _d], inputVector);
    var h3 = G.mul(model['Wfh' + _d], previousHidden);
    var forgetGate = G.sigmoid(G.add(G.add(h2, h3), model['bf' + _d]));

    // output gate
    var h4 = G.mul(model['Wox' + _d], inputVector);
    var h5 = G.mul(model['Woh' + _d], previousHidden);
    var outputGate = G.sigmoid(G.add(G.add(h4, h5), model['bo' + _d]));

    // write operation on cells
    var h6 = G.mul(model['Wcx' + _d], inputVector);
    var h7 = G.mul(model['Wch' + _d], previousHidden);
    var cellWrite = G.tanh(G.add(G.add(h6, h7), model['bc' + _d]));

    // compute new cell activation
    var retainToCell = G.eltmul(forgetGate, previousCell); // what do we keep from cell
    var writeToCell = G.eltmul(inputGate, cellWrite); // what do we write to cell
    var updatedCell = G.add(retainToCell, writeToCell); // new cell contents

    // compute hidden state as gated, saturated cell activations
    var hidden = G.eltmul(outputGate, G.tanh(updatedCell));

    hiddenLayers.push(hidden);
    cells.push(updatedCell);
  }

  // one decoder to outputs at end
  var output = G.add(G.mul(model.Whd, hiddenLayers[hiddenLayers.length - 1]), model.bd);

  // return cell memory, hidden representation and output
  return { h: hiddenLayers, c: cells, o: output };
}

exports.initLSTM = initLSTM;
exports.forwardLSTM = forwardLSTM;