'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _zeros = require('../util/zeros');

var _zeros2 = _interopRequireDefault(_zeros);

var _general = require('../util/general');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// DPAgent performs Value Iteration
// - can also be used for Policy Iteration if you really wanted to
// - requires model of the environment :(
// - does not learn from experience :(
// - assumes finite MDP :(
var DPAgent = function () {
  function DPAgent(env, opt) {
    _classCallCheck(this, DPAgent);

    this.V = null; // state value function
    this.P = null; // policy distribution \pi(s, a)
    this.env = env; // store pointer to environment
    this.gamma = (0, _general.getopt)(opt, 'gamma', 0.75); // future reward discount factor
    this.reset();
  }

  _createClass(DPAgent, [{
    key: 'reset',
    value: function reset() {
      // reset the agent's policy and value function
      this.ns = this.env.getNumStates();
      this.na = this.env.getMaxNumActions();
      this.V = (0, _zeros2.default)(this.ns);
      this.P = (0, _zeros2.default)(this.ns * this.na);
      // initialize uniform random policy
      for (var s = 0; s < this.ns; s++) {
        var poss = this.env.allowedActions(s);
        for (var i = 0, n = poss.length; i < n; i++) {
          this.P[poss[i] * this.ns + s] = 1.0 / poss.length;
        }
      }
    }
  }, {
    key: 'act',
    value: function act(s) {
      // behave according to the learned policy
      var poss = this.env.allowedActions(s);
      var ps = [];
      for (var i = 0, n = poss.length; i < n; i++) {
        var a = poss[i];
        var prob = this.P[a * this.ns + s];
        ps.push(prob);
      }
      var maxi = (0, _general.sampleWeighted)(ps);
      return poss[maxi];
    }
  }, {
    key: 'learn',
    value: function learn() {
      // perform a single round of value iteration
      self.evaluatePolicy(); // writes this.V
      self.updatePolicy(); // writes this.P
    }
  }, {
    key: 'evaluatePolicy',
    value: function evaluatePolicy() {
      // perform a synchronous update of the value function
      var Vnew = (0, _zeros2.default)(this.ns);
      for (var s = 0; s < this.ns; s++) {
        // integrate over actions in a stochastic policy
        // note that we assume that policy probability mass over allowed actions sums to one
        var v = 0.0;
        var poss = this.env.allowedActions(s);
        for (var i = 0, n = poss.length; i < n; i++) {
          var a = poss[i];
          var prob = this.P[a * this.ns + s]; // probability of taking action under policy
          if (prob === 0) {
            continue;
          } // no contribution, skip for speed
          var ns = this.env.nextStateDistribution(s, a);
          var rs = this.env.reward(s, a, ns); // reward for s->a->ns transition
          v += prob * (rs + this.gamma * this.V[ns]);
        }
        Vnew[s] = v;
      }
      this.V = Vnew; // swap
    }
  }, {
    key: 'updatePolicy',
    value: function updatePolicy() {
      // update policy to be greedy w.r.t. learned Value function
      for (var s = 0; s < this.ns; s++) {
        var poss = this.env.allowedActions(s);
        // compute value of taking each allowed action
        var vmax = void 0;
        var nmax = void 0;
        var vs = [];
        for (var i = 0, n = poss.length; i < n; i++) {
          var a = poss[i];
          var ns = this.env.nextStateDistribution(s, a);
          var rs = this.env.reward(s, a, ns);
          var v = rs + this.gamma * this.V[ns];
          vs.push(v);
          if (i === 0 || v > vmax) {
            vmax = v;
            nmax = 1;
          } else if (v === vmax) {
            nmax += 1;
          }
        }
        // update policy smoothly across all argmaxy actions
        for (var ii = 0, _n = poss.length; ii < _n; ii++) {
          var _a = poss[ii];
          this.P[_a * this.ns + s] = vs[ii] === vmax ? 1.0 / nmax : 0.0;
        }
      }
    }
  }]);

  return DPAgent;
}();

exports.default = DPAgent;