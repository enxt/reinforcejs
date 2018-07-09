import assert from '../util/assert';

import {
  gaussRandom,
  randf,
  randn,
  randi,
  RandMat,
  fillRandn,
  fillRand,
  gradFillConst
} from '../util/randoms';

import zeros from '../util/zeros';

import Mat, {
  copyMat,
  copyNet,
  updateMat,
  updateNet
} from '../util/matrix';

import Graph from '../util/graph';
import Solver from '../util/solver';
import {
  softmax,
  sig,
  maxi,
  samplei
} from '../util/algos';
import {
  initLSTM,
  forwardLSTM
} from '../util/lstm';
import {
  netToJSON,
  netFromJSON,
  netZeroGrads,
  netFlattenGrads
} from '../util/net';


const Recurrent = {
  // various utils
  assert,
  zeros,
  maxi,
  samplei,
  sig,
  randi,
  randf,
  randn,
  softmax,
  // classes
  Mat,
  RandMat,
  forwardLSTM,
  initLSTM,
  // more utils
  gradFillConst,
  gaussRandom,
  fillRandn,
  fillRand,
  updateMat,
  updateNet,
  copyMat,
  copyNet,
  netToJSON,
  netFromJSON,
  netZeroGrads,
  netFlattenGrads,
  // optimization
  Solver,
  Graph
}; // the Recurrent library

export default Recurrent;
