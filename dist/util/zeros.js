'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = zeros;
// helper function returns array of zeros of length n
// and uses typed arrays if available
function zeros(n) {
  if (typeof n === 'undefined' || isNaN(n)) {
    return [];
  }
  if (typeof ArrayBuffer === 'undefined') {
    // lacking browser support
    var arr = new Array(n);
    for (var i = 0; i < n; i++) {
      arr[i] = 0;
    }
    return arr;
  }
  return new Float64Array(n);
}