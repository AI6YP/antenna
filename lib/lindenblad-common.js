'use strict';

// Shared Lindenblad element helpers (parasitic + classic variants). mm, degrees.
// Element at azimuth phi: local frame t = (-sin phi, cos phi, 0) (CCW tangent), r = radial, z up.
// direction d = cos(tilt) t + s sin(tilt) u, u = cos(lean) z + sin(lean) r (element plane rotated
// about t by lean; lean > 0: upper end outward). s = +-1 = tilt sense.

const rad = deg => deg * Math.PI / 180;

// element direction in local frame (t, r, z) of its center; q: {tilt, lean}
const localDir = (q, s) => {
  const t = rad(q.tilt), l = rad(q.lean);
  return {t: Math.cos(t), r: s * Math.sin(t) * Math.sin(l), z: s * Math.sin(t) * Math.cos(l)};
};

// min horizontal distance from z axis to element axis segment: |(r + x a) r^ + x b t^|, |x| <= L/2
const axisDist = (q, s) => {
  const d = localDir(q, s);
  const a = d.r, b = d.t, h = q.length / 2;
  const x = Math.max(-h, Math.min(h, a * a + b * b > 0 ? -q.radius * a / (a * a + b * b) : 0));
  return Math.hypot(q.radius + x * a, x * b);
};

module.exports = {rad, localDir, axisDist};
