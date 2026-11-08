'use strict';

// 3D vector + polyline helpers. Points: [x, y, z], mm.

const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: a => Math.hypot(a[0], a[1], a[2]),
  norm: a => v3.mul(a, 1 / v3.len(a))
};

// distance between points
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);

const polylineLength = pts => {
  let res = 0;
  for (let i = 1; i < pts.length; i++) { res += dist(pts[i - 1], pts[i]); }
  return res;
};

// 90 deg fillet at corner P: in along dIn, out along dOut (unit, dIn ⊥ dOut).
// returns n+1 points from P - R dIn to P + R dOut
const fillet = (P, dIn, dOut, R, n) => {
  const C = v3.add(v3.sub(P, v3.mul(dIn, R)), v3.mul(dOut, R));
  const res = [];
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI / 2) * i / n;
    res.push(v3.add(C, v3.add(v3.mul(dOut, -R * Math.cos(a)), v3.mul(dIn, R * Math.sin(a)))));
  }
  return res;
};

const translate = (p, d) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];

// min distance between segments [p1, q1] and [p2, q2] (closest points, clamped)
const segDist = (p1, q1, p2, q2) => {
  const d1 = v3.sub(q1, p1), d2 = v3.sub(q2, p2), r = v3.sub(p1, p2);
  const a = v3.dot(d1, d1), e = v3.dot(d2, d2), f = v3.dot(d2, r);
  const clamp = x => Math.max(0, Math.min(1, x));
  let s, t;
  if (a <= 1e-12 && e <= 1e-12) { return v3.len(r); }
  if (a <= 1e-12) {
    s = 0; t = clamp(f / e);
  } else {
    const c = v3.dot(d1, r);
    if (e <= 1e-12) {
      t = 0; s = clamp(-c / a);
    } else {
      const b = v3.dot(d1, d2), den = a * e - b * b;
      s = den > 1e-12 ? clamp((b * f - c * e) / den) : 0;
      t = (b * s + f) / e;
      if (t < 0) { t = 0; s = clamp(-c / a); } else if (t > 1) { t = 1; s = clamp((b - c) / a); }
    }
  }
  return v3.len(v3.sub(v3.add(p1, v3.mul(d1, s)), v3.add(p2, v3.mul(d2, t))));
};

module.exports = {v3, dist, polylineLength, fillet, translate, segDist};
