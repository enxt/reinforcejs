import assert from './assert';

// syntactic sugar function for getting default parameter values
function getopt(opt, fieldName, defaultValue) {
  if (!opt || !fieldName || !Object.prototype.hasOwnProperty.call(opt, fieldName)) {
    return defaultValue;
  }
  return opt[fieldName];
}

function setConst(arr, c) {
  for (let i = 0, n = arr.length; i < n; i++) {
    arr[i] = c;
  }
}

function sampleWeighted(p) {
  const r = Math.random();
  let c = 0.0;
  for (let i = 0, n = p.length; i < n; i++) {
    c += p[i];
    if (c >= r) { return i; }
  }
  assert(false, 'wtf');
}


export {
  getopt,
  setConst,
  sampleWeighted
};
