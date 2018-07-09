// Utility fun
export default function assert(condition, message = 'Assertion failed') {
  // from http://stackoverflow.com/questions/15313418/javascript-assert
  if (!condition) {
    if (typeof Error !== 'undefined') {
      throw new Error(message);
    }
    throw message; // Fallback
  }
}
