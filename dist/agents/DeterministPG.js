'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Recurrent = require('../lib/Recurrent');

var _Recurrent2 = _interopRequireDefault(_Recurrent);

var _general = require('../util/general');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Currently buggy implementation, doesnt work
var DeterministPG = function DeterministPG(env, opt) {
  this.gamma = (0, _general.getopt)(opt, 'gamma', 0.5); // future reward discount factor
  this.epsilon = (0, _general.getopt)(opt, 'epsilon', 0.5); // for epsilon-greedy policy
  this.alpha = (0, _general.getopt)(opt, 'alpha', 0.001); // actor net learning rate
  this.beta = (0, _general.getopt)(opt, 'beta', 0.01); // baseline net learning rate
  this.env = env;
  this.reset();
};
DeterministPG.prototype = {
  reset: function reset() {
    this.ns = this.env.getNumStates();
    this.na = this.env.getMaxNumActions();
    this.nh = 100; // number of hidden units

    // actor
    this.actorNet = {};
    this.actorNet.W1 = new _Recurrent2.default.RandMat(this.nh, this.ns, 0, 0.01);
    this.actorNet.b1 = new _Recurrent2.default.Mat(this.nh, 1, 0, 0.01);
    this.actorNet.W2 = new _Recurrent2.default.RandMat(this.na, this.ns, 0, 0.1);
    this.actorNet.b2 = new _Recurrent2.default.Mat(this.na, 1, 0, 0.01);
    this.ntheta = this.na * this.ns + this.na; // number of params in actor

    // critic
    this.criticw = new _Recurrent2.default.RandMat(1, this.ntheta, 0, 0.01); // row vector

    this.r0 = null;
    this.s0 = null;
    this.s1 = null;
    this.a0 = null;
    this.a1 = null;
    this.t = 0;
  },
  forwardActor: function forwardActor(s, needs_backprop) {
    var net = this.actorNet;
    var G = new _Recurrent2.default.Graph(needs_backprop);
    var a1mat = G.add(G.mul(net.W1, s), net.b1);
    var h1mat = G.tanh(a1mat);
    var a2mat = G.add(G.mul(net.W2, h1mat), net.b2);
    return { 'a': a2mat, 'G': G };
  },
  act: function act(slist) {
    // convert to a Mat column vector
    var s = new _Recurrent2.default.Mat(this.ns, 1);
    s.setFrom(slist);

    // forward the actor to get action output
    var ans = this.forwardActor(s, false);
    var amat = ans.a;
    var ag = ans.G;

    // sample action from the stochastic gaussian policy
    var a = _Recurrent2.default.copyMat(amat);
    if (Math.random() < this.epsilon) {
      var gaussVar = 0.02;
      a.w[0] = _Recurrent2.default.randn(0, gaussVar);
      a.w[1] = _Recurrent2.default.randn(0, gaussVar);
    }
    var clamp = 0.25;
    if (a.w[0] > clamp) a.w[0] = clamp;
    if (a.w[0] < -clamp) a.w[0] = -clamp;
    if (a.w[1] > clamp) a.w[1] = clamp;
    if (a.w[1] < -clamp) a.w[1] = -clamp;

    // shift state memory
    this.s0 = this.s1;
    this.a0 = this.a1;
    this.s1 = s;
    this.a1 = a;

    return a;
  },
  utilJacobianAt: function utilJacobianAt(s) {
    var ujacobian = new _Recurrent2.default.Mat(this.ntheta, this.na);
    for (var a = 0; a < this.na; a++) {
      _Recurrent2.default.netZeroGrads(this.actorNet);
      var ag = this.forwardActor(this.s0, true);
      ag.a.dw[a] = 1.0;
      ag.G.backward();
      var gflat = _Recurrent2.default.netFlattenGrads(this.actorNet);
      ujacobian.setColumn(gflat, a);
    }
    return ujacobian;
  },
  learn: function learn(r1) {
    // perform an update on Q function
    //this.rewardHistory.push(r1);
    if (!(this.r0 == null)) {
      var Gtmp = new _Recurrent2.default.Graph(false);
      // dpg update:
      // first compute the features psi:
      // the jacobian matrix of the actor for s
      var ujacobian0 = this.utilJacobianAt(this.s0);
      // now form the features \psi(s,a)
      var psi_sa0 = Gtmp.mul(ujacobian0, this.a0); // should be [this.ntheta x 1] "feature" vector
      var qw0 = Gtmp.mul(this.criticw, psi_sa0); // 1x1
      // now do the same thing because we need \psi(s_{t+1}, \mu\_\theta(s\_t{t+1}))
      var ujacobian1 = this.utilJacobianAt(this.s1);
      var ag = this.forwardActor(this.s1, false);
      var psi_sa1 = Gtmp.mul(ujacobian1, ag.a);
      var qw1 = Gtmp.mul(this.criticw, psi_sa1); // 1x1
      // get the td error finally
      var tderror = this.r0 + this.gamma * qw1.w[0] - qw0.w[0]; // lol
      if (tderror > 0.5) tderror = 0.5; // clamp
      if (tderror < -0.5) tderror = -0.5;
      this.tderror = tderror;

      // update actor policy with natural gradient
      var net = this.actorNet;
      var ix = 0;
      for (var p in net) {
        var mat = net[p];
        if (net.hasOwnProperty(p)) {
          for (var i = 0, n = mat.w.length; i < n; i++) {
            mat.w[i] += this.alpha * this.criticw.w[ix]; // natural gradient update
            ix += 1;
          }
        }
      }
      // update the critic parameters too
      for (var i = 0; i < this.ntheta; i++) {
        var update = this.beta * tderror * psi_sa0.w[i];
        this.criticw.w[i] += update;
      }
    }
    this.r0 = r1; // store for next update
  }
};

exports.default = DeterministPG;