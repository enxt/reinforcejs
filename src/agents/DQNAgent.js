import Recurrent from '../lib/Recurrent';

import {
  getopt
} from '../util/general';

import {
  randi
} from '../util/randoms';

class DQNAgent {
  constructor(env, opt) {
    this.gamma = getopt(opt, 'gamma', 0.75);  // future reward discount factor
    this.epsilon = getopt(opt, 'epsilon', 0.1);  // for epsilon-greedy policy
    this.alpha = getopt(opt, 'alpha', 0.01);  // value function learning rate

    this.experience_add_every = getopt(opt, 'experience_add_every', 25);  // number of time steps before we add another experience to replay memory
    this.experience_size = getopt(opt, 'experience_size', 5000);  // size of experience replay
    this.learning_steps_per_iteration = getopt(opt, 'learning_steps_per_iteration', 10);
    this.tderror_clamp = getopt(opt, 'tderror_clamp', 1.0);

    this.num_hidden_units =  getopt(opt, 'num_hidden_units', 100);

    this.env = env;
    this.reset();
  }
  reset() {
    this.nh = this.num_hidden_units;  // number of hidden units
    this.ns = this.env.getNumStates();
    this.na = this.env.getMaxNumActions();

    // nets are hardcoded for now as key (str) -> Mat
    // not proud of this. better solution is to have a whole Net object
    // on top of Mats, but for now sticking with this
    this.net = {};
    this.net.W1 = new Recurrent.RandMat(this.nh, this.ns, 0, 0.01);
    this.net.b1 = new Recurrent.Mat(this.nh, 1, 0, 0.01);
    this.net.W2 = new Recurrent.RandMat(this.na, this.nh, 0, 0.01);
    this.net.b2 = new Recurrent.Mat(this.na, 1, 0, 0.01);

    this.exp = [];  // experience
    this.expi = 0;  // where to insert

    this.t = 0;

    this.r0 = null;
    this.s0 = null;
    this.s1 = null;
    this.a0 = null;
    this.a1 = null;

    this.tderror = 0;  // for visualization only...
  }
  toJSON() {
    // save function
    const j = {};
    j.nh = this.nh;
    j.ns = this.ns;
    j.na = this.na;
    j.net = Recurrent.netToJSON(this.net);
    return j;
  }
  fromJSON(j) {
    // load function
    this.nh = j.nh;
    this.ns = j.ns;
    this.na = j.na;
    this.net = Recurrent.netFromJSON(j.net);
  }
  forwardQ(net, s, needsBackprop) {
    const G = new Recurrent.Graph(needsBackprop);
    const a1mat = G.add(G.mul(net.W1, s), net.b1);
    const h1mat = G.tanh(a1mat);
    const a2mat = G.add(G.mul(net.W2, h1mat), net.b2);
    this.lastG = G;  // back this up. Kind of hacky isn't it
    return a2mat;
  }
  act(slist) {
    // convert to a Mat column vector
    const s = new Recurrent.Mat(this.ns, 1);
    s.setFrom(slist);

    let a;
    // epsilon greedy policy
    if (Math.random() < this.epsilon) {
      a = randi(0, this.na);
    } else {
      // greedy wrt Q function
      const amat = this.forwardQ(this.net, s, false);
      a = Recurrent.maxi(amat.w);  // returns index of argmax action
    }

    // shift state memory
    this.s0 = this.s1;
    this.a0 = this.a1;
    this.s1 = s;
    this.a1 = a;

    return a;
  }
  learn(r1) {
    // perform an update on Q function
    if (!(this.r0 === null) && this.alpha > 0) {
      // learn from this tuple to get a sense of how "surprising" it is to the agent
      const tderror = this.learnFromTuple(this.s0, this.a0, this.r0, this.s1, this.a1);
      this.tderror = tderror;  // a measure of surprise

      // decide if we should keep this experience in the replay
      if (this.t % this.experience_add_every === 0) {
        this.exp[this.expi] = [this.s0, this.a0, this.r0, this.s1, this.a1];
        this.expi += 1;
        if (this.expi > this.experience_size) { this.expi = 0;  } // roll over when we run out
      }
      this.t += 1;

      // sample some additional experience from replay memory and learn from it
      for (let k = 0; k < this.learning_steps_per_iteration;  k++) {
        const ri = randi(0, this.exp.length);  // todo: priority sweeps?
        const e = this.exp[ri];
        this.learnFromTuple(e[0], e[1], e[2], e[3], e[4]);
      }
    }
    this.r0 = r1;  // store for next update
  }
  learnFromTuple(s0, a0, r0, s1/* , a1 */) {
    // a1 is not used. why?
    // want: Q(s,a) = r + gamma * max_a' Q(s',a')

    // compute the target Q value
    const tmat = this.forwardQ(this.net, s1, false);
    const qmax = r0 + this.gamma * tmat.w[Recurrent.maxi(tmat.w)];

    // now predict
    const pred = this.forwardQ(this.net, s0, true);

    let tderror = pred.w[a0] - qmax;
    const clamp = this.tderror_clamp;
    if (Math.abs(tderror) > clamp) {  // huber loss to robustify
      if (tderror > clamp) {
        tderror = clamp;
      }
      if (tderror < -clamp) {
        tderror = -clamp;
      }
    }
    pred.dw[a0] = tderror;
    this.lastG.backward();  // compute gradients on net params

    // update net
    Recurrent.updateNet(this.net, this.alpha);
    return tderror;
  }
}

export default DQNAgent;
