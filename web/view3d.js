import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

// three.js model of QFH: loops (tubes, cable OD), PVC boom + crossarms, metal mast. mm, z up.

const COLORS = {big: 0xe8590c, small: 0x1c7ed6, pvc: 0xe9ecef, metal: 0x868e96, feed: 0xfab005};

export const createView = el => {
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  el.appendChild(renderer.domElement);
  const legend = document.createElement('div');
  legend.className = 'legend';
  legend.innerHTML = '<span style="color:#e8590c">■ big loop</span> <span style="color:#1c7ed6">■ small loop</span> ■ PVC · drag to rotate';
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
    const mat = new THREE.MeshStandardMaterial({color, roughness: 0.8, transparent: opacity < 1, opacity});
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(va.clone().add(vb).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    return m;
  };

  const update = res => {
    if (group) {
      scene.remove(group);
      group.traverse(o => { if (o.geometry) { o.geometry.dispose(); } });
    }
    group = new THREE.Group();
    const p = res.input, g = res.geometry;
    const rCable = p.conductor.od / 2;
    const arm = p.frame.arm / 2, mast = p.frame.mast / 2;

    const zTop = Math.max(...g.loops.map(l => l.zTop));
    const zBot = Math.min(...g.loops.map(l => l.zBottom));
    // PVC boom (antenna) + extension 0.5 m down to metal mast
    const pvcBottom = zBot - (p.env.mast?.pvc || 500);
    group.add(rod([0, 0, pvcBottom], [0, 0, zTop + 3 * arm], mast, COLORS.pvc, 0.55));
    const metal = p.env.mast?.metal || 1000;
    group.add(rod([0, 0, pvcBottom - metal], [0, 0, pvcBottom], 20, COLORS.metal));

    for (const l of g.loops) {
      const color = COLORS[l.name];
      group.add(tube(l.points, rCable, color, false));
      // crossarms (PVC) at top and bottom, along loop plane
      const c = Math.cos(l.phi0), s = Math.sin(l.phi0);
      const r = res.dims[l.name].D / 2 + 2 * rCable;
      group.add(rod([-r * c, -r * s, l.zTop], [r * c, r * s, l.zTop], arm, COLORS.pvc, 0.55));
      const tw = l.phi0 + g.twist * 2 * Math.PI * p.turns;
      group.add(rod([-r * Math.cos(tw), -r * Math.sin(tw), l.zBottom], [r * Math.cos(tw), r * Math.sin(tw), l.zBottom], arm, COLORS.pvc, 0.55));
    }
    // feed point
    const feed = new THREE.Mesh(new THREE.SphereGeometry(rCable * 2.2, 16, 12), new THREE.MeshStandardMaterial({color: COLORS.feed}));
    feed.position.set(0, 0, zTop);
    group.add(feed);

    scene.add(group);
    // frame the antenna (mast continues below)
    const H = zTop - zBot;
    const zc = (zTop + zBot) / 2;
    const key = p.freq + '/' + p.turns + '/' + p.ratioDH;
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
  return {update};
};
