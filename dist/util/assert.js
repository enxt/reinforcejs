'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = assert;
// Utility fun
function assert(condition) {
  var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Assertion failed';

  // from http://stackoverflow.com/questions/15313418/javascript-assert
  if (!condition) {
    if (typeof Error !== 'undefined') {
      throw new Error(message);
    }
    throw message; // Fallback
  }
}