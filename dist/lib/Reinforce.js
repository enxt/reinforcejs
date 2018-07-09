'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _DPAgent = require('../agents/DPAgent');

var _DPAgent2 = _interopRequireDefault(_DPAgent);

var _TDAgent = require('../agents/TDAgent');

var _TDAgent2 = _interopRequireDefault(_TDAgent);

var _DQNAgent = require('../agents/DQNAgent');

var _DQNAgent2 = _interopRequireDefault(_DQNAgent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import SimpleReinforceAgent from '../agents/SimpleReinforceAgent';
// import RecurrentReinforceAgent from '../agents/RecurrentReinforceAgent';
// import DeterministPG from '../agents/DeterministPG';

var RL = {
  DPAgent: _DPAgent2.default,
  TDAgent: _TDAgent2.default,
  DQNAgent: _DQNAgent2.default
  // SimpleReinforceAgent,
  // RecurrentReinforceAgent,
  // DeterministPG
};

exports.default = RL;