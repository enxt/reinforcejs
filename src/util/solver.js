import Mat from './matrix';

class Solver {
  constructor() {
    this.decayRate = 0.999;
    this.smoothEps = 1e-8;
    this.stepCache = {};
  }
  step(model, stepSize, regc, clipval) {
    // perform parameter update
    const solverStats = {};
    let numClipped = 0.0;
    let numTotal = 0.0;
    for (const k in model) {
      if (Object.prototype.hasOwnProperty.call(model, k)) {
        const m = model[k];  // mat ref
        if (!(k in this.stepCache)) {
          this.stepCache[k] = new Mat(m.n, m.d);
        }
        const s = this.stepCache[k];
        for (let i = 0, n = m.w.length; i < n; i++) {
          // rmsprop adaptive learning rate
          let mdwi = m.dw[i];
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
          m.dw[i] = 0;  // reset gradients for next iteration
        }
      }
    }
    solverStats.ratioClipped = numClipped / numTotal;
    return solverStats;
  }
}

export default Solver;
