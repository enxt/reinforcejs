import Mat from './matrix';
import {
  RandMat
} from '../util/randoms';


function initLSTM(inputLayerSize, hiddenLayerSizes, outputLayerSize) {
  // hidden size should be a list

  const model = {};
  for (let d = 0; d < hiddenLayerSizes.length; d++) { // loop over depths
    const prevSize = d === 0 ? inputLayerSize : hiddenLayerSizes[d - 1];
    const hiddenLayerSize = hiddenLayerSizes[d];

    // gates parameters
    model[`Wix${d}`] = new RandMat(hiddenLayerSize, prevSize, 0, 0.08);
    model[`Wih${d}`] = new RandMat(hiddenLayerSize, hiddenLayerSize, 0, 0.08);
    model[`bi${d}`] = new Mat(hiddenLayerSize, 1);
    model[`Wfx${d}`] = new RandMat(hiddenLayerSize, prevSize, 0, 0.08);
    model[`Wfh${d}`] = new RandMat(hiddenLayerSize, hiddenLayerSize, 0, 0.08);
    model[`bf${d}`] = new Mat(hiddenLayerSize, 1);
    model[`Wox${d}`] = new RandMat(hiddenLayerSize, prevSize, 0, 0.08);
    model[`Woh${d}`] = new RandMat(hiddenLayerSize, hiddenLayerSize, 0, 0.08);
    model[`bo${d}`] = new Mat(hiddenLayerSize, 1);
    // cell write params
    model[`Wcx${d}`] = new RandMat(hiddenLayerSize, prevSize, 0, 0.08);
    model[`Wch${d}`] = new RandMat(hiddenLayerSize, hiddenLayerSize, 0, 0.08);
    model[`bc${d}`] = new Mat(hiddenLayerSize, 1);
  }
  // decoder params
  // ??? hiddenLayerSizes.length ? hiddenLayerSize
  model.Whd = new RandMat(outputLayerSize, hiddenLayerSizes.length, 0, 0.08);
  model.bd = new Mat(outputLayerSize, 1);
  return model;
}

function forwardLSTM(G, model, hiddenLayerSizes, x, prev) {
  // forward prop for a single tick of LSTM
  // G is graph to append ops to
  // model contains LSTM parameters
  // x is 1D column vector with observation
  // prev is a struct containing hidden and cell
  // from previous iteration
  let previousHiddenLayers = [];
  let previousCells = [];

  if (prev === null || typeof prev.h === 'undefined') {
    for (let d = 0; d < hiddenLayerSizes.length; d++) {
      previousHiddenLayers.push(new Mat(hiddenLayerSizes[d], 1));
      previousCells.push(new Mat(hiddenLayerSizes[d], 1));
    }
  } else {
    previousHiddenLayers = prev.h;
    previousCells = prev.c;
  }

  const hiddenLayers = [];
  const cells = [];
  for (let d = 0; d < hiddenLayerSizes.length; d++) {
    const inputVector = d === 0 ? x : hiddenLayers[d - 1];
    const previousHidden = previousHiddenLayers[d];
    const previousCell = previousCells[d];

    // input gate
    const h0 = G.mul(model[`Wix${d}`], inputVector);
    const h1 = G.mul(model[`Wih${d}`], previousHidden);
    const inputGate = G.sigmoid(G.add(G.add(h0, h1), model[`bi${d}`]));

    // forget gate
    const h2 = G.mul(model[`Wfx${d}`], inputVector);
    const h3 = G.mul(model[`Wfh${d}`], previousHidden);
    const forgetGate = G.sigmoid(G.add(G.add(h2, h3), model[`bf${d}`]));

    // output gate
    const h4 = G.mul(model[`Wox${d}`], inputVector);
    const h5 = G.mul(model[`Woh${d}`], previousHidden);
    const outputGate = G.sigmoid(G.add(G.add(h4, h5), model[`bo${d}`]));

    // write operation on cells
    const h6 = G.mul(model[`Wcx${d}`], inputVector);
    const h7 = G.mul(model[`Wch${d}`], previousHidden);
    const cellWrite = G.tanh(G.add(G.add(h6, h7), model[`bc${d}`]));

    // compute new cell activation
    const retainToCell = G.eltmul(forgetGate, previousCell);  // what do we keep from cell
    const writeToCell = G.eltmul(inputGate, cellWrite);  // what do we write to cell
    const updatedCell = G.add(retainToCell, writeToCell);  // new cell contents

    // compute hidden state as gated, saturated cell activations
    const hidden = G.eltmul(outputGate, G.tanh(updatedCell));

    hiddenLayers.push(hidden);
    cells.push(updatedCell);
  }

  // one decoder to outputs at end
  const output = G.add(
    G.mul(
      model.Whd,
      hiddenLayers[hiddenLayers.length - 1]
    ),
    model.bd
  );

  // return cell memory, hidden representation and output
  return { h: hiddenLayers, c: cells, o: output };
}

export {
  initLSTM,
  forwardLSTM
};
