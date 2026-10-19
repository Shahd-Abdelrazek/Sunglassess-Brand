
"use strict";

let threeLibs = null;

function loadThree() {
  if (!threeLibs) {
    threeLibs = Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
      import("three/addons/loaders/SVGLoader.js"),
    ])
      .then(([THREE, controls, loader]) => ({
        THREE,
        OrbitControls: controls.OrbitControls,
        SVGLoader: loader.SVGLoader,
      }))
      .catch((error) => {
        threeLibs = null;
        throw error;
      });
  }
  return threeLibs;
}

// Lens outline as points (SVG y points down, so it is flipped here).
function lensOutline(L, shape) {
  const data = new L.SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${LENS_PATHS[shape] || LENS_PATHS.round}"/></svg>`);
  const points = L.SVGLoader.createShapes(data.paths[0])[0].getSpacedPoints(96);
  return points.map((p) => new L.THREE.Vector2(p.x, -p.y));
}

function tortoiseTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#6b3d17";
  ctx.fillRect(0, 0, 256, 256);
  const colors = ["#2f1a0b", "#a5672e", "#3d220f", "#c98b45", "#4a2a12"];
  for (let i = 0; i < 70; i += 1) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.55 + (i % 4) * 0.1;
    ctx.beginPath();
    ctx.ellipse((i * 97) % 256, (i * 53) % 256, 6 + (i % 5) * 4, 4 + (i % 3) * 4, i, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.03, 0.03);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function engravingTexture(THREE, text) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  // Shrink long names so they always fit on the band.
  let size = 120;
  do {
    ctx.font = `italic 700 ${size}px 'Dancing Script', 'Aref Ruqaa', serif`;
    size -= 6;
  } while (ctx.measureText(text).width > 960 && size > 40);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillText(text, 515, 88);
  ctx.fillStyle = "#f3dc9b";
  ctx.fillText(text, 512, 84);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function skyTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  // A warm, bright horizon keeps gold looking gold; blue only high in the sky.
  const sky = ctx.createLinearGradient(0, 0, 0, 256);
  sky.addColorStop(0, "#3d86c6");
  sky.addColorStop(0.45, "#a9d6f2");
  sky.addColorStop(0.8, "#fff1dc");
  sky.addColorStop(1, "#ffe2b8");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 256);
  const sea = ctx.createLinearGradient(0, 256, 0, 290);
  sea.addColorStop(0, "#2aa5a0");
  sea.addColorStop(1, "#4fb3a8");
  ctx.fillStyle = sea;
  ctx.fillRect(0, 256, 1024, 34);
  const sand = ctx.createLinearGradient(0, 290, 0, 512);
  sand.addColorStop(0, "#f7e2bd");
  sand.addColorStop(1, "#c99a66");
  ctx.fillStyle = sand;
  ctx.fillRect(0, 290, 1024, 222);
  // Clouds, the sun and its glitter on the water.
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  [[150, 120, 70], [420, 90, 50], [760, 140, 80], [930, 70, 40]].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  const sun = ctx.createRadialGradient(600, 150, 0, 600, 150, 90);
  sun.addColorStop(0, "#ffffff");
  sun.addColorStop(0.25, "#fff4c2");
  sun.addColorStop(1, "rgba(255, 220, 150, 0)");
  ctx.fillStyle = sun;
  ctx.fillRect(500, 50, 200, 200);
  ctx.fillStyle = "rgba(255, 250, 220, 0.8)";
  for (let i = 0; i < 30; i += 1) ctx.fillRect(560 + ((i * 37) % 80), 260 + ((i * 13) % 28), 14, 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function frameMaterial(THREE, frame) {
  if (frame.metal) return new THREE.MeshStandardMaterial({ color: frame.color, metalness: 0.85, roughness: 0.28, envMapIntensity: 1.6 });
  const material = new THREE.MeshPhysicalMaterial({ color: frame.pattern ? "#ffffff" : frame.color, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 });
  if (frame.pattern) material.map = tortoiseTexture(THREE);
  return material;
}

function lensMaterial(THREE, lens) {
  const mirror = lens.id.includes("mirror");
  // Tinted lenses use their darkest tone, mirrors their bright middle tone.
  const [, tone, opacity] = mirror ? lens.stops[Math.floor(lens.stops.length / 2)] : lens.stops[0];
  if (mirror) {
    // A real mirror: fully reflective, tinted by the coating colour, with a soft rainbow sheen.
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(tone).lerp(new THREE.Color("#ffffff"), 0.35),
      emissive: tone,
      emissiveIntensity: 0.32,
      metalness: 0.92,
      roughness: 0.04,
      envMapIntensity: 1.3,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      iridescence: 0.45,
      iridescenceIOR: 1.6,
      side: THREE.DoubleSide,
    });
  }
  // A little self-glow keeps the tint readable from every angle.
  return new THREE.MeshPhysicalMaterial({
    color: tone,
    emissive: tone,
    emissiveIntensity: mirror ? 0.22 : 0.08,
    transparent: true,
    opacity: mirror ? 0.95 : Math.min(0.92, opacity),
    metalness: mirror ? 0.55 : 0.05,
    roughness: 0.06,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: mirror ? 2.2 : 1.2,
    side: THREE.DoubleSide,
  });
}

// Builds the whole pair as one group, in the drawing's units (about 300 wide).
function buildGlasses(L, cfg) {
  const { THREE } = L;
  const frame = designOption("frame", cfg.frame);
  const lens = designOption("lens", cfg.lens);
  const group = new THREE.Group();
  const rimMat = frameMaterial(THREE, frame);
  const glassMat = lensMaterial(THREE, lens);
  const rimScale = frame.metal ? 1.07 : 1.16;
  const depth = frame.metal ? 3 : 6;
  const thick = frame.metal ? 1.6 : 2.8;

  const inner = lensOutline(L, cfg.shape);
  const maxX = Math.max(...inner.map((p) => Math.abs(p.x)));
  const topY = Math.max(...inner.map((p) => p.y));

  [-1, 1].forEach((side) => {
    // The left lens outline has the nose on +x; the right one is its mirror image.
    const pts = inner.map((p) => new THREE.Vector2(side < 0 ? p.x : -p.x, p.y));
    const centreX = side * 58;

    const rim = new THREE.Shape(pts.map((p) => p.clone().multiplyScalar(rimScale)));
    rim.holes.push(new THREE.Path(pts));
    const rimGeo = new THREE.ExtrudeGeometry(rim, { depth, bevelEnabled: true, bevelThickness: 1, bevelSize: 0.8, bevelSegments: 3, curveSegments: 4 });
    rimGeo.translate(centreX, 0, -depth / 2);
    group.add(new THREE.Mesh(rimGeo, rimMat));

    const glassGeo = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map((p) => p.clone().multiplyScalar(1.01))), { depth: 1.2, bevelEnabled: false });
    glassGeo.translate(centreX, 0, -0.6);
    group.add(new THREE.Mesh(glassGeo, glassMat));

    // Hinge, then the temple running back to the ear with a curved tip.
    const hingeX = centreX + side * maxX * rimScale;
    const hingeY = topY * 0.55;
    const hinge = new THREE.Mesh(new THREE.BoxGeometry(6, 7, 7), rimMat);
    hinge.position.set(hingeX + side * 1.5, hingeY, -3);
    group.add(hinge);

    const templePath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(hingeX + side * 3, hingeY, -5),
      new THREE.Vector3(hingeX + side * 9, hingeY + 1, -70),
      new THREE.Vector3(hingeX + side * 12, hingeY - 1, -140),
      new THREE.Vector3(hingeX + side * 12, hingeY - 14, -165),
      new THREE.Vector3(hingeX + side * 10, hingeY - 30, -175),
    ]);
    const temple = new THREE.Mesh(new THREE.TubeGeometry(templePath, 64, thick, 10, false), rimMat);
    temple.scale.set(1, frame.metal ? 1 : 1.6, 1);
    temple.position.y = frame.metal ? 0 : -hingeY * 0.6;
    group.add(temple);

    if (frame.metal) {
      // Dark acetate tips on metal temples, and nose pads.
      const tipPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(hingeX + side * 12, hingeY - 1, -140),
        new THREE.Vector3(hingeX + side * 12, hingeY - 14, -165),
        new THREE.Vector3(hingeX + side * 10, hingeY - 30, -175),
      ]);
      group.add(new THREE.Mesh(new THREE.TubeGeometry(tipPath, 24, 2.6, 10, false), new THREE.MeshPhysicalMaterial({ color: "#1b1d22", roughness: 0.3, clearcoat: 1 })));
      const pad = new THREE.Mesh(new THREE.SphereGeometry(3.5, 16, 12), new THREE.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: 0.55, roughness: 0.1 }));
      pad.scale.set(0.6, 1.2, 1);
      pad.position.set(side * 11, -6, -7);
      group.add(pad);
    }

    // Engraving: a flat band on the outside of the left temple, with the name in gold.
    if (cfg.engrave && side < 0) {
      const start = templePath.getPoint(0.04);
      const end = templePath.getPoint(0.4);
      const length = start.distanceTo(end);
      const width = thick * 2 + 2.4;
      const height = frame.metal ? 9 : thick * 3.2 + 1;
      const band = new THREE.Group();
      band.add(new THREE.Mesh(new THREE.BoxGeometry(width, height, length), rimMat));
      const text = new THREE.Mesh(
        new THREE.PlaneGeometry(length * 0.92, (length * 0.92) / 6.4),
        // Unlit gold so the name is always easy to read.
        new THREE.MeshBasicMaterial({ map: engravingTexture(THREE, cfg.engrave), transparent: true })
      );
      text.position.x = -width / 2 - 0.15;
      text.rotation.y = -Math.PI / 2;
      band.add(text);
      band.position.set((start.x + end.x) / 2, hingeY, (start.z + end.z) / 2);
      // Point the band's length forwards so its outer face (local −x) faces away from the head.
      band.rotation.y = Math.atan2(start.x - end.x, start.z - end.z);
      group.add(band);
    }
  });

  // Bridge over the nose.
  const bridgeCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-14, 16, 0), new THREE.Vector3(0, 30, 1), new THREE.Vector3(14, 16, 0));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(bridgeCurve, 24, frame.metal ? 2 : 3.6, 10, false), rimMat));

  const scale = SIZE_SCALE[cfg.size] || 1;
  group.scale.setScalar(scale);
  return group;
}

function disposeGroup(group) {
  group.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (object.material.map) object.material.map.dispose();
      object.material.dispose();
    }
  });
}

/**
 * Puts a 3D pair into `container`. Returns { update(cfg), resetView(), dispose() }.
 * opts.interactive: allow turning and zooming; opts.autoRotate: spin slowly when idle.
 */
async function mountGlasses3D(container, cfg, { interactive = true, autoRotate = true } = {}) {
  const probe = document.createElement("canvas");
  if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) throw new Error("no-webgl");
  const L = await loadThree();
  const { THREE } = L;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.className = "glasses-3d-canvas";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(skyTexture(THREE)).texture;
  const sun = new THREE.DirectionalLight("#fff4e0", 2.2);
  sun.position.set(200, 300, 250);
  const fillLight = new THREE.DirectionalLight("#bfeeea", 1);
  fillLight.position.set(-250, 80, 200);
  scene.add(sun, fillLight, new THREE.HemisphereLight("#ffffff", "#f3d9c0", 0.8));

  const camera = new THREE.PerspectiveCamera(32, 1, 1, 3000);
  const home = new THREE.Vector3(210, 70, 330);
  camera.position.copy(home);

  const controls = new L.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, -60);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 200;
  controls.maxDistance = 900;
  controls.autoRotate = autoRotate;
  controls.autoRotateSpeed = 2.2;
  controls.enabled = interactive;
  renderer.domElement.style.pointerEvents = interactive ? "auto" : "none";

  // Pause spinning while the visitor turns it; resume a few seconds later.
  let resumeTimer = 0;
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
    window.clearTimeout(resumeTimer);
  });
  controls.addEventListener("end", () => {
    resumeTimer = window.setTimeout(() => { controls.autoRotate = autoRotate; }, 4000);
  });

  let model = buildGlasses(L, cfg);
  scene.add(model);

  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  // Only draw while the view is on screen.
  let visible = true;
  const seen = new IntersectionObserver((entries) => { visible = entries.some((e) => e.isIntersecting); });
  seen.observe(container);
  let frameId = 0;
  const loop = () => {
    frameId = requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    controls.update();
    renderer.render(scene, camera);
  };
  loop();

  return {
    update(next) {
      scene.remove(model);
      disposeGroup(model);
      model = buildGlasses(L, next);
      scene.add(model);
    },
    resetView() {
      camera.position.copy(home);
      controls.target.set(0, 0, -60);
      controls.autoRotate = autoRotate;
    },
    dispose() {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      seen.disconnect();
      controls.dispose();
      disposeGroup(model);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
