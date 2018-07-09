import zeros from '../util/zeros';
import {
  getopt,
  sampleWeighted
} from '../util/general';

// DPAgent performs Value Iteration
// - can also be used for Policy Iteration if you really wanted to
// - requires model of the environment :(
// - does not learn from experience :(
// - assumes finite MDP :(
class DPAgent {
  constructor(env, opt) {
    this.V = null;  // state value function
    this.P = null;  // policy distribution \pi(s, a)
    this.env = env;  // store pointer to environment
    this.gamma = getopt(opt, 'gamma', 0.75);  // future reward discount factor
    this.reset();
  }
  reset() {
    // reset the agent's policy and value function
    this.ns = this.env.getNumStates();
    this.na = this.env.getMaxNumActions();
    this.V = zeros(this.ns);
    this.P = zeros(this.ns * this.na);
    // initialize uniform random policy
    for (let s = 0; s < this.ns; s++) {
      const poss = this.env.allowedActions(s);
      for (let i = 0, n = poss.length; i < n; i++) {
        this.P[poss[i] * this.ns + s] = 1.0 / poss.length;
      }
    }
  }
  act(s) {
    // behave according to the learned policy
    const poss = this.env.allowedActions(s);
    const ps = [];
    for (let i = 0, n = poss.length; i < n; i++) {
      const a = poss[i];
      const prob = this.P[a * this.ns + s];
      ps.push(prob);
    }
    const maxi = sampleWeighted(ps);
    return poss[maxi];
  }
  learn() {
    // perform a single round of value iteration
    self.evaluatePolicy();  // writes this.V
    self.updatePolicy();  // writes this.P
  }
  evaluatePolicy() {
    // perform a synchronous update of the value function
    const Vnew = zeros(this.ns);
    for (let s = 0; s < this.ns; s++) {
      // integrate over actions in a stochastic policy
      // note that we assume that policy probability mass over allowed actions sums to one
      let v = 0.0;
      const poss = this.env.allowedActions(s);
      for (let i = 0, n = poss.length; i < n; i++) {
        const a = poss[i];
        const prob = this.P[a * this.ns + s];  // probability of taking action under policy
        if (prob === 0) { continue; } // no contribution, skip for speed
        const ns = this.env.nextStateDistribution(s, a);
        const rs = this.env.reward(s, a, ns);  // reward for s->a->ns transition
        v += prob * (rs + this.gamma * this.V[ns]);
      }
      Vnew[s] = v;
    }
    this.V = Vnew;  // swap
  }
  updatePolicy() {
    // update policy to be greedy w.r.t. learned Value function
    for (let s = 0; s < this.ns; s++) {
      const poss = this.env.allowedActions(s);
      // compute value of taking each allowed action
      let vmax;
      let nmax;
      const vs = [];
      for (let i = 0, n = poss.length; i < n; i++) {
        const a = poss[i];
        const ns = this.env.nextStateDistribution(s, a);
        const rs = this.env.reward(s, a, ns);
        const v = rs + this.gamma * this.V[ns];
        vs.push(v);
        if (i === 0 || v > vmax) {
          vmax = v;
          nmax = 1;
        } else if (v === vmax) {
          nmax += 1;
        }
      }
      // update policy smoothly across all argmaxy actions
      for (let ii = 0, n = poss.length; ii < n; ii++) {
        const a = poss[ii];
        this.P[a * this.ns + s] = (vs[ii] === vmax) ? 1.0 / nmax : 0.0;
      }
    }
  }
}

export default DPAgent;
