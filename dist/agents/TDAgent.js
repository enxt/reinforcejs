'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _zeros = require('../util/zeros');

var _zeros2 = _interopRequireDefault(_zeros);

var _general = require('../util/general');

var _randoms = require('../util/randoms');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// QAgent uses TD (Q-Learning, SARSA)
// - does not require environment model :)
// - learns from experience :)
var TDAgent = function () {
  function TDAgent(env, opt) {
    _classCallCheck(this, TDAgent);

    this.update = (0, _general.getopt)(opt, 'update', 'qlearn'); // qlearn | sarsa
    this.gamma = (0, _general.getopt)(opt, 'gamma', 0.75); // future reward discount factor
    this.epsilon = (0, _general.getopt)(opt, 'epsilon', 0.1); // for epsilon-greedy policy
    this.alpha = (0, _general.getopt)(opt, 'alpha', 0.01); // value function learning rate

    // class allows non-deterministic policy, and smoothly regressing towards the optimal policy based on Q
    this.smooth_policy_update = (0, _general.getopt)(opt, 'smooth_policy_update', false);
    this.beta = (0, _general.getopt)(opt, 'beta', 0.01); // learning rate for policy, if smooth updates are on

    // eligibility traces
    this.lambda = (0, _general.getopt)(opt, 'lambda', 0); // eligibility trace decay. 0 = no eligibility traces used
    this.replacing_traces = (0, _general.getopt)(opt, 'replacing_traces', true);

    // optional optimistic initial values
    this.q_init_val = (0, _general.getopt)(opt, 'q_init_val', 0);

    this.planN = (0, _general.getopt)(opt, 'planN', 0); // number of planning steps per learning iteration (0 = no planning)

    this.Q = null; // state action value function
    this.P = null; // policy distribution \pi(s, a)
    this.e = null; // eligibility trace
    this.env_model_s = null; // environment model (s, a) -> (s', r)
    this.env_model_r = null; // environment model (s, a) -> (s', r)
    this.env = env; // store pointer to environment
    this.reset();
  }

  _createClass(TDAgent, [{
    key: 'reset',
    value: function reset() {
      // reset the agent's policy and value function
      this.ns = this.env.getNumStates();
      this.na = this.env.getMaxNumActions();
      this.Q = (0, _zeros2.default)(this.ns * this.na);
      if (this.q_init_val !== 0) {
        (0, _general.setConst)(this.Q, this.q_init_val);
      }
      this.P = (0, _zeros2.default)(this.ns * this.na);
      this.e = (0, _zeros2.default)(this.ns * this.na);

      // model/planning vars
      this.env_model_s = (0, _zeros2.default)(this.ns * this.na);
      (0, _general.setConst)(this.env_model_s, -1); // init to -1 so we can test if we saw the state before
      this.env_model_r = (0, _zeros2.default)(this.ns * this.na);
      this.sa_seen = [];
      this.pq = (0, _zeros2.default)(this.ns * this.na);

      // initialize uniform random policy
      for (var s = 0; s < this.ns; s++) {
        var poss = this.env.allowedActions(s);
        for (var i = 0, n = poss.length; i < n; i++) {
          this.P[poss[i] * this.ns + s] = 1.0 / poss.length;
        }
      }
      // agent memory, needed for streaming updates
      // (s0, a0, r0, s1, a1, r1, ...)
      this.r0 = null;
      this.s0 = null;
      this.s1 = null;
      this.a0 = null;
      this.a1 = null;
    }
  }, {
    key: 'resetEpisode',
    value: function resetEpisode() {
      // an episode finished
    }
  }, {
    key: 'act',
    value: function act(s) {
      // act according to epsilon greedy policy
      var poss = this.env.allowedActions(s);
      var probs = [];
      var a = void 0;
      for (var i = 0, n = poss.length; i < n; i++) {
        probs.push(this.P[poss[i] * this.ns + s]);
      }
      // epsilon greedy policy
      if (Math.random() < this.epsilon) {
        a = poss[(0, _randoms.randi)(0, poss.length)]; // random available action
        this.explored = true;
      } else {
        a = poss[(0, _general.sampleWeighted)(probs)];
        this.explored = false;
      }
      // shift state memory
      this.s0 = this.s1;
      this.a0 = this.a1;
      this.s1 = s;
      this.a1 = a;
      return a;
    }
  }, {
    key: 'learn',
    value: function learn(r1) {
      // takes reward for previous action, which came from a call to act()
      if (!(this.r0 === null)) {
        this.learnFromTuple(this.s0, this.a0, this.r0, this.s1, this.a1, this.lambda);
        if (this.planN > 0) {
          this.updateModel(this.s0, this.a0, this.r0, this.s1);
          this.plan();
        }
      }
      this.r0 = r1; // store this for next update
    }
  }, {
    key: 'updateModel',
    value: function updateModel(s0, a0, r0, s1) {
      // transition (s0, a0) -> (r0, s1) was observed. Update environment model
      var sa = a0 * this.ns + s0;
      if (this.env_model_s[sa] === -1) {
        // first time we see this state action
        this.sa_seen.push(a0 * this.ns + s0); // add as seen state
      }
      this.env_model_s[sa] = s1;
      this.env_model_r[sa] = r0;
    }
  }, {
    key: 'plan',
    value: function plan() {
      // order the states based on current priority queue information
      var spq = [];
      for (var i = 0, n = this.sa_seen.length; i < n; i++) {
        var sa = this.sa_seen[i];
        var sap = this.pq[sa];
        if (sap > 1e-5) {
          // gain a bit of efficiency
          spq.push({ sa: sa, p: sap });
        }
      }
      spq.sort(function (a, b) {
        return a.p < b.p ? 1 : -1;
      });

      // perform the updates
      var nsteps = Math.min(this.planN, spq.length);
      for (var k = 0; k < nsteps; k++) {
        // random exploration
        // const i = randi(0, this.sa_seen.length); // pick random prev seen state action
        // const s0a0 = this.sa_seen[i];
        var s0a0 = spq[k].sa;
        this.pq[s0a0] = 0; // erase priority, since we're backing up this state
        var s0 = s0a0 % this.ns;
        var a0 = Math.floor(s0a0 / this.ns);
        var r0 = this.env_model_r[s0a0];
        var s1 = this.env_model_s[s0a0];
        var a1 = -1; // not used for Q learning
        if (this.update === 'sarsa') {
          // generate random action?...
          var poss = this.env.allowedActions(s1);
          a1 = poss[(0, _randoms.randi)(0, poss.length)];
        }
        this.learnFromTuple(s0, a0, r0, s1, a1, 0); // note lambda = 0 - shouldnt use eligibility trace here
      }
    }
  }, {
    key: 'learnFromTuple',
    value: function learnFromTuple(s0, a0, r0, s1, a1, lambda) {
      var sa = a0 * this.ns + s0;

      // calculate the target for Q(s, a)
      var target = void 0;
      var qmax = 0;
      if (this.update === 'qlearn') {
        // Q learning target is Q(s0, a0) = r0 + gamma * max_a Q[s1, a]
        var poss = this.env.allowedActions(s1);
        for (var i = 0, n = poss.length; i < n; i++) {
          var s1a = poss[i] * this.ns + s1;
          var qval = this.Q[s1a];
          if (i === 0 || qval > qmax) {
            qmax = qval;
          }
        }
        target = r0 + this.gamma * qmax;
      } else if (this.update === 'sarsa') {
        // SARSA target is Q(s0, a0) = r0 + gamma * Q[s1, a1]
        var s1a1 = a1 * this.ns + s1;
        target = r0 + this.gamma * this.Q[s1a1];
      }

      if (lambda > 0) {
        // perform an eligibility trace update
        if (this.replacing_traces) {
          this.e[sa] = 1;
        } else {
          this.e[sa] += 1;
        }
        var edecay = lambda * this.gamma;
        var stateUpdate = (0, _zeros2.default)(this.ns);
        for (var s = 0; s < this.ns; s++) {
          var _poss = this.env.allowedActions(s);
          for (var _i = 0; _i < _poss.length; _i++) {
            var a = _poss[_i];
            var saloop = a * this.ns + s;
            var esa = this.e[saloop];
            var update = this.alpha * esa * (target - this.Q[saloop]);
            this.Q[saloop] += update;
            this.updatePriority(s, a, update);
            this.e[saloop] *= edecay;
            var u = Math.abs(update);
            if (u > stateUpdate[s]) {
              stateUpdate[s] = u;
            }
          }
        }
        for (var _s = 0; _s < this.ns; _s++) {
          if (stateUpdate[_s] > 1e-5) {
            // save efficiency here
            this.updatePolicy(_s);
          }
        }
        if (this.explored && this.update === 'qlearn') {
          // have to wipe the trace since q learning is off-policy :(
          this.e = (0, _zeros2.default)(this.ns * this.na);
        }
      } else {
        // simpler and faster update without eligibility trace
        // update Q[sa] towards it with some step size
        var _update = this.alpha * (target - this.Q[sa]);
        this.Q[sa] += _update;
        this.updatePriority(s0, a0, _update);
        // update the policy to reflect the change (if appropriate)
        this.updatePolicy(s0);
      }
    }
  }, {
    key: 'updatePriority',
    value: function updatePriority(s, a, uu) {
      // used in planning. Invoked when Q[sa] += update
      // we should find all states that lead to (s, a) and upgrade their priority
      // of being update in the next planning step
      var u = Math.abs(uu);
      if (u < 1e-5) {
        return;
      } // for efficiency skip small updates
      if (this.planN === 0) {
        return;
      } // there is no planning to be done, skip.
      for (var si = 0; si < this.ns; si++) {
        // note we are also iterating over impossible actions at all states,
        // but this should be okay because their env_model_s should simply be -1
        // as initialized, so they will never be predicted to point to any state
        // because they will never be observed, and hence never be added to the model
        for (var ai = 0; ai < this.na; ai++) {
          var siai = ai * this.ns + si;
          if (this.env_model_s[siai] === s) {
            // this state leads to s, add it to priority queue
            this.pq[siai] += u;
          }
        }
      }
    }
  }, {
    key: 'updatePolicy',
    value: function updatePolicy(s) {
      var poss = this.env.allowedActions(s);
      // set policy at s to be the action that achieves max_a Q(s, a)
      // first find the maxy Q values
      var qmax = void 0;
      var nmax = void 0;
      var qs = [];
      for (var i = 0, n = poss.length; i < n; i++) {
        var a = poss[i];
        var qval = this.Q[a * this.ns + s];
        qs.push(qval);
        if (i === 0 || qval > qmax) {
          qmax = qval;
          nmax = 1;
        } else if (qval === qmax) {
          nmax += 1;
        }
      }
      // now update the policy smoothly towards the argmaxy actions
      var psum = 0.0;
      for (var _i2 = 0, _n = poss.length; _i2 < _n; _i2++) {
        var _a = poss[_i2];
        var target = qs[_i2] === qmax ? 1.0 / nmax : 0.0;
        var ix = _a * this.ns + s;
        if (this.smooth_policy_update) {
          // slightly hacky :p
          this.P[ix] += this.beta * (target - this.P[ix]);
          psum += this.P[ix];
        } else {
          // set hard target
          this.P[ix] = target;
        }
      }
      if (this.smooth_policy_update) {
        // renomalize P if we're using smooth policy updates
        for (var _i3 = 0, _n2 = poss.length; _i3 < _n2; _i3++) {
          var _a2 = poss[_i3];
          this.P[_a2 * this.ns + s] /= psum;
        }
      }
    }
  }]);

  return TDAgent;
}();

exports.default = TDAgent;