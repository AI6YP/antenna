'use strict';

// Shared helpers. Units: mm, MHz.

const C = 299792.458; // speed of light, mm * MHz

const lambda = freq => C / freq; // mm

const isObj = o => o !== null && typeof o === 'object' && !Array.isArray(o);

// deep merge of plain objects; arrays and scalars from b replace a
const merge = (a, b) => {
  const res = {...a};
  for (const key of Object.keys(b || {})) {
    res[key] = (isObj(a[key]) && isObj(b[key])) ? merge(a[key], b[key]) : b[key];
  }
  return res;
};

module.exports = {C, lambda, isObj, merge};
