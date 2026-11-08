import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

// 3D radiation pattern: sphere grid (theta, phi in degrees) -> surface, radius = gain (dB) mapped
// linearly over [max - range, max], color = same scale (blue -> red). z up = zenith.

const colormap = u => {
  // u 0..1: blue -> cyan -> green -> yellow -> red
  const c = new THREE.Color();
  c.setHSL((1 - u) * 0.66, 0.85, 0.5);
  return c;
};

export const kinds = ['rhcp', 'lhcp', 'total'];
export const ranges = [20, 30, 40];

export const createPatternView = el => {
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  el.appendChild(renderer.domElement);
  const legend = document.createElement('div');
  legend.className = 'legend';
  el.appendChild(legend);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  camera.up.set(0, 0, 1);
  camera.position.set(2.4, -3.2, 1.6);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 2.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(1, -2, 3);
  scene.add(sun);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0.1);

  // reference: horizon ring, 30 / 60 deg elevation rings (unit radius), zenith axis
  const ref = new THREE.Group();
  const lineMat = new THREE.LineBasicMaterial({color: 0x888888, transparent: true, opacity: 0.6});
  const ring = (elev, r = 1) => {
    const pts = [];
    for (let i = 0; i <= 96; i++) {
      const a = 2 * Math.PI * i / 96, e = elev * Math.PI / 180;
      pts.push(new THREE.Vector3(r * Math.cos(e) * Math.cos(a), r * Math.cos(e) * Math.sin(a), r * Math.sin(e)));
    }
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
  };
  [0, 30, 60].forEach(e => ref.add(ring(e)));
  const axis = (a, b) => new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]), lineMat);
  ref.add(axis([0, 0, -1.1], [0, 0, 1.2]), axis([-1.1, 0, 0], [1.2, 0, 0]), axis([0, -1.1, 0], [0, 1.2, 0]));
  scene.add(ref);

  let mesh = null;

  const resize = () => {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(el);

  // points: [{theta, phi, rhcp, lhcp, total}] on regular grid; opts {kind, range}
  const update = (points, opts) => {
    if (mesh) {
      scene.remove(mesh);
      mesh.traverse(o => { if (o.geometry) { o.geometry.dispose(); } });
      mesh = null;
    }
    if (!points || !points.length) { legend.textContent = ''; return null; }
    const thetas = [...new Set(points.map(p => p.theta))].sort((a, b) => a - b);
    const phis = [...new Set(points.map(p => p.phi))].sort((a, b) => a - b);
    const nT = thetas.length, nP = phis.length;
    const val = new Map(points.map(p => [p.theta + '/' + p.phi, p[opts.kind]]));
    const gmax = Math.max(...points.map(p => p[opts.kind]));
    const at = (it, ip) => {
      const g = val.get(thetas[it] + '/' + phis[ip % nP]);
      return Math.min(1, Math.max(0, ((g === undefined ? -999 : g) - gmax + opts.range) / opts.range));
    };
    const pos = [], col = [], idx = [];
    for (let it = 0; it < nT; it++) {
      for (let ip = 0; ip <= nP; ip++) { // wrap: column nP = phi 360
        const u = at(it, ip);
        const th = thetas[it] * Math.PI / 180;
        const ph = (ip < nP ? phis[ip] : phis[0] + 360) * Math.PI / 180;
        pos.push(u * Math.sin(th) * Math.cos(ph), u * Math.sin(th) * Math.sin(ph), u * Math.cos(th));
        const c = colormap(u);
        col.push(c.r, c.g, c.b);
      }
    }
    const W = nP + 1;
    for (let it = 0; it < nT - 1; it++) {
      for (let ip = 0; ip < nP; ip++) {
        const a = it * W + ip, b = a + 1, c = a + W, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    mesh = new THREE.Group();
    mesh.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.92})));
    mesh.add(new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({color: 0x000000, transparent: true, opacity: 0.08})));
    scene.add(mesh);
    return {gmax};
  };

  const setLegend = html => { legend.innerHTML = html; };

  const loop = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  resize();
  loop();
  return {update, setLegend};
};
