import Mat from './matrix';
import {
  gradFillConst
} from './randoms';

function netToJSON(net) {
  const j = {};
  for (const p in net) {
    if (Object.prototype.hasOwnProperty.call(net, p)) {
      j[p] = net[p].toJSON();
    }
  }
  return j;
}
function netFromJSON(j) {
  const net = {};
  for (const p in j) {
    if (Object.prototype.hasOwnProperty.call(j, p)) {
      net[p] = new Mat(1, 1); // not proud of this
      net[p].fromJSON(j[p]);
    }
  }
  return net;
}
function netZeroGrads(net) {
  for (const p in net) {
    if (Object.prototype.hasOwnProperty.call(net, p)) {
      const mat = net[p];
      gradFillConst(mat, 0);
    }
  }
}
function netFlattenGrads(net) {
  let n = 0;
  for (const p in net) {
    if (Object.prototype.hasOwnProperty.call(net, p)) {
      const mat = net[p]; n += mat.dw.length;
    }
  }
  const g = new Mat(n, 1);
  let ix = 0;
  for (const p in net) {
    if (Object.prototype.hasOwnProperty.call(net, p)) {
      const mat = net[p];
      for (let i = 0, m = mat.dw.length; i < m; i++) {
        g.w[ix] = mat.dw[i];
        ix++;
      }
    }
  }
  return g;
}

export {
  netToJSON,
  netFromJSON,
  netZeroGrads,
  netFlattenGrads
};
