import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

// generic three.js view, mm, z up. Antenna adapters draw via build(res, h) -> THREE.Group.

export const COLORS = {
  big: 0xe8590c, small: 0x1c7ed6, pvc: 0xe9ecef, metal: 0x868e96, feed: 0xfab005,
  alu: 0xc0c6cc, sleeve: 0x9aa3ab, parasitic: 0xe8590c, print: 0xf1e9d2, coax: 0x222222
};

// shared mesh helpers
const tube = (points, radius, color, closed) => {
  const path = new THREE.CurvePath();
  for (let i = 1; i < points.length; i++) {
    path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i - 1]), new THREE.Vector3(...points[i])));
  }
  const geo = new THREE.TubeGeometry(path, points.length * 4, radius, 12, closed);
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color, roughness: 0.5, metalness: 0.2}));
};

const rod = (a, b, radius, color, opacity = 1) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const geo = new THREE.CylinderGeometry(radius, radius, len, 24);
  const mat = new THREE.MeshStandardMaterial({color, roughness: 0.6, metalness: 0.3, transparent: opacity < 1, opacity});
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(va.clone().add(vb).multiplyScalar(0.5));
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return m;
};

const sphere = (p, radius, color) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), new THREE.MeshStandardMaterial({color}));
  m.position.set(...p);
  return m;
};

export const helpers = {THREE, COLORS, tube, rod, sphere};

export const createView = el => {
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  el.appendChild(renderer.domElement);
  const legend = document.createElement('div');
  legend.className = 'legend';
  el.appendChild(legend);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 1, 100000);
  camera.up.set(0, 0, 1);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(1, -2, 3);
  scene.add(sun);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  let group = null;

  const resize = () => {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(el);

  // build(res, helpers) -> {group, frame: {zTop, zBot, key}}
  const update = (res, build) => {
    if (group) {
      scene.remove(group);
      group.traverse(o => { if (o.geometry) { o.geometry.dispose(); } });
    }
    const out = build(res, helpers);
    group = out.group;
    scene.add(group);
    // frame the antenna once per design key (mast continues below)
    const {zTop, zBot, key} = out.frame;
    const H = zTop - zBot;
    const zc = (zTop + zBot) / 2;
    if (update.framed !== key) {
      camera.position.set(H * 1.6, -H * 2.4, zc + H * 0.9);
      controls.target.set(0, 0, zc - H * 0.1);
      update.framed = key;
    }
  };

  const loop = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  resize();
  loop();
  const setLegend = html => { legend.innerHTML = html; };
  return {update, setLegend};
};
