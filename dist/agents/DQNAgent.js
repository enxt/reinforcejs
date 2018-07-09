'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Recurrent = require('../lib/Recurrent');

var _Recurrent2 = _interopRequireDefault(_Recurrent);

var _general = require('../util/general');

var _randoms = require('../util/randoms');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DQNAgent = function () {
  function DQNAgent(env, opt) {
    _classCallCheck(this, DQNAgent);

    this.gamma = (0, _general.getopt)(opt, 'gamma', 0.75); // future reward discount factor
    this.epsilon = (0, _general.getopt)(opt, 'epsilon', 0.1); // for epsilon-greedy policy
    this.alpha = (0, _general.getopt)(opt, 'alpha', 0.01); // value function learning rate

    this.experience_add_every = (0, _general.getopt)(opt, 'experience_add_every', 25); // number of time steps before we add another experience to replay memory
    this.experience_size = (0, _general.getopt)(opt, 'experience_size', 5000); // size of experience replay
    this.learning_steps_per_iteration = (0, _general.getopt)(opt, 'learning_steps_per_iteration', 10);
    this.tderror_clamp = (0, _general.getopt)(opt, 'tderror_clamp', 1.0);

    this.num_hidden_units = (0, _general.getopt)(opt, 'num_hidden_units', 100);

    this.env = env;
    this.reset();
  }

  _createClass(DQNAgent, [{
    key: 'reset',
    value: function reset() {
      this.nh = this.num_hidden_units; // number of hidden units
      this.ns = this.env.getNumStates();
      this.na = this.env.getMaxNumActions();

      // nets are hardcoded for now as key (str) -> Mat
      // not proud of this. better solution is to have a whole Net object
      // on top of Mats, but for now sticking with this
      this.net = {};
      this.net.W1 = new _Recurrent2.default.RandMat(this.nh, this.ns, 0, 0.01);
      this.net.b1 = new _Recurrent2.default.Mat(this.nh, 1, 0, 0.01);
      this.net.W2 = new _Recurrent2.default.RandMat(this.na, this.nh, 0, 0.01);
      this.net.b2 = new _Recurrent2.default.Mat(this.na, 1, 0, 0.01);

      this.exp = []; // experience
      this.expi = 0; // where to insert

      this.t = 0;

      this.r0 = null;
      this.s0 = null;
      this.s1 = null;
      this.a0 = null;
      this.a1 = null;

      this.tderror = 0; // for visualization only...
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      // save function
      var j = {};
      j.nh = this.nh;
      j.ns = this.ns;
      j.na = this.na;
      j.net = _Recurrent2.default.netToJSON(this.net);
      return j;
    }
  }, {
    key: 'fromJSON',
    value: function fromJSON(j) {
      // load function
      this.nh = j.nh;
      this.ns = j.ns;
      this.na = j.na;
      this.net = _Recurrent2.default.netFromJSON(j.net);
    }
  }, {
    key: 'forwardQ',
    value: function forwardQ(net, s, needsBackprop) {
      var G = new _Recurrent2.default.Graph(needsBackprop);
      var a1mat = G.add(G.mul(net.W1, s), net.b1);
      var h1mat = G.tanh(a1mat);
      var a2mat = G.add(G.mul(net.W2, h1mat), net.b2);
      this.lastG = G; // back this up. Kind of hacky isn't it
      return a2mat;
    }
  }, {
    key: 'act',
    value: function act(slist) {
      // convert to a Mat column vector
      var s = new _Recurrent2.default.Mat(this.ns, 1);
      s.setFrom(slist);

      var a = void 0;
      // epsilon greedy policy
      if (Math.random() < this.epsilon) {
        a = (0, _randoms.randi)(0, this.na);
      } else {
        // greedy wrt Q function
        var amat = this.forwardQ(this.net, s, false);
        a = _Recurrent2.default.maxi(amat.w); // returns index of argmax action
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
      // perform an update on Q function
      if (!(this.r0 === null) && this.alpha > 0) {
        // learn from this tuple to get a sense of how "surprising" it is to the agent
        var tderror = this.learnFromTuple(this.s0, this.a0, this.r0, this.s1, this.a1);
        this.tderror = tderror; // a measure of surprise

        // decide if we should keep this experience in the replay
        if (this.t % this.experience_add_every === 0) {
          this.exp[this.expi] = [this.s0, this.a0, this.r0, this.s1, this.a1];
          this.expi += 1;
          if (this.expi > this.experience_size) {
            this.expi = 0;
          } // roll over when we run out
        }
        this.t += 1;

        // sample some additional experience from replay memory and learn from it
        for (var k = 0; k < this.learning_steps_per_iteration; k++) {
          var ri = (0, _randoms.randi)(0, this.exp.length); // todo: priority sweeps?
          var e = this.exp[ri];
          this.learnFromTuple(e[0], e[1], e[2], e[3], e[4]);
        }
      }
      this.r0 = r1; // store for next update
    }
  }, {
    key: 'learnFromTuple',
    value: function learnFromTuple(s0, a0, r0, s1 /* , a1 */) {
      // a1 is not used. why?
      // want: Q(s,a) = r + gamma * max_a' Q(s',a')

      // compute the target Q value
      var tmat = this.forwardQ(this.net, s1, false);
      var qmax = r0 + this.gamma * tmat.w[_Recurrent2.default.maxi(tmat.w)];

      // now predict
      var pred = this.forwardQ(this.net, s0, true);

      var tderror = pred.w[a0] - qmax;
      var clamp = this.tderror_clamp;
      if (Math.abs(tderror) > clamp) {
        // huber loss to robustify
        if (tderror > clamp) {
          tderror = clamp;
        }
        if (tderror < -clamp) {
          tderror = -clamp;
        }
      }
      pred.dw[a0] = tderror;
      this.lastG.backward(); // compute gradients on net params

      // update net
      _Recurrent2.default.updateNet(this.net, this.alpha);
      return tderror;
    }
  }]);

  return DQNAgent;
}();

exports.default = DQNAgent;