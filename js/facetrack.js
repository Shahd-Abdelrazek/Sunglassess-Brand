
"use strict";

const FACE_LIB = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const FACE_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const LENS_GAP = 116 / 300;

const faceTrack = { enabled: true, landmarker: null, loading: null, mode: null, raf: 0, lastTime: -1 };

function setFaceStatus(key, state) {
  const el = document.getElementById("faceStatus");
  if (!el) return;
  el.dataset.state = state;
  el.dataset.key = key;
  el.textContent = key ? t(key) : "";
}

function loadFaceLandmarker() {
  if (faceTrack.landmarker) return Promise.resolve(faceTrack.landmarker);
  if (!faceTrack.loading) {
    faceTrack.loading = (async () => {
      const vision = await import(`${FACE_LIB}/vision_bundle.mjs`);
      const files = await vision.FilesetResolver.forVisionTasks(`${FACE_LIB}/wasm`);
      const create = (delegate) =>
        vision.FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: FACE_MODEL, delegate }, runningMode: "IMAGE", numFaces: 1 });
      try {
        faceTrack.landmarker = await create("GPU");
      } catch (error) {
        faceTrack.landmarker = await create("CPU");
      }
      faceTrack.mode = "IMAGE";
      return faceTrack.landmarker;
    })().catch((error) => {
      faceTrack.loading = null;
      throw error;
    });
  }
  return faceTrack.loading;
}

async function useFaceMode(mode) {
  if (faceTrack.mode === mode) return;
  await faceTrack.landmarker.setOptions({ runningMode: mode });
  faceTrack.mode = mode;
}

// Landmarks are relative to the source picture, which is shown with object-fit: cover (and mirrored for the camera).
function fitGlassesToFace(landmarks, sourceWidth, sourceHeight, mirror, smooth) {
  const rect = document.getElementById("tryStage").getBoundingClientRect();
  const scale = Math.max(rect.width / sourceWidth, rect.height / sourceHeight);
  const offsetX = (rect.width - sourceWidth * scale) / 2;
  const offsetY = (rect.height - sourceHeight * scale) / 2;
  const toStage = (point) => {
    const x = point.x * sourceWidth * scale + offsetX;
    return { x: mirror ? rect.width - x : x, y: point.y * sourceHeight * scale + offsetY };
  };
  // 468 and 473 are the centres of the irises; 33 and 263 the eye corners as a fallback.
  const a = toStage(landmarks[468] || landmarks[33]);
  const b = toStage(landmarks[473] || landmarks[263]);
  const [left, right] = a.x < b.x ? [a, b] : [b, a];
  const gap = Math.hypot(right.x - left.x, right.y - left.y);
  const target = {
    x: ((left.x + right.x) / 2 / rect.width) * 100,
    y: ((left.y + right.y) / 2 / rect.height) * 100,
    width: (gap / (LENS_GAP * (SIZE_SCALE[design.size] || 1)) / rect.width) * 100,
    angle: (Math.atan2(right.y - left.y, right.x - left.x) * 180) / Math.PI,
  };
  // Smooth the camera so the glasses don't jitter.
  const k = smooth ? 0.45 : 1;
  ["x", "y", "width", "angle"].forEach((key) => {
    tryOn[key] += (target[key] - tryOn[key]) * k;
  });
  document.getElementById("trySize").value = Math.round(tryOn.width);
  document.getElementById("tryAngle").value = Math.round(tryOn.angle);
  updateTryOnGlasses();
}

async function trackPhoto() {
  if (!faceTrack.enabled || tryOn.mode !== "photo") return;
  const photo = document.getElementById("tryPhoto");
  if (!photo.complete || !photo.naturalWidth) await new Promise((resolve) => photo.addEventListener("load", resolve, { once: true }));
  setFaceStatus("tracking.loading", "busy");
  try {
    await loadFaceLandmarker();
    await useFaceMode("IMAGE");
    const result = faceTrack.landmarker.detect(photo);
    if (result.faceLandmarks.length) {
      fitGlassesToFace(result.faceLandmarks[0], photo.naturalWidth, photo.naturalHeight, false, false);
      setFaceStatus("tracking.found", "ok");
    } else {
      setFaceStatus("tracking.none", "warn");
    }
  } catch (error) {
    setFaceStatus("tracking.failed", "warn");
  }
}

async function trackVideo() {
  cancelAnimationFrame(faceTrack.raf);
  if (!faceTrack.enabled || tryOn.mode !== "camera") return;
  setFaceStatus("tracking.loading", "busy");
  try {
    await loadFaceLandmarker();
    await useFaceMode("VIDEO");
  } catch (error) {
    setFaceStatus("tracking.failed", "warn");
    return;
  }
  setFaceStatus("tracking.live", "ok");
  const video = document.getElementById("tryVideo");
  let missed = 0;
  const loop = () => {
    if (!faceTrack.enabled || tryOn.mode !== "camera") return;
    if (video.readyState >= 2 && video.currentTime !== faceTrack.lastTime) {
      faceTrack.lastTime = video.currentTime;
      const result = faceTrack.landmarker.detectForVideo(video, performance.now());
      if (result.faceLandmarks.length) {
        fitGlassesToFace(result.faceLandmarks[0], video.videoWidth, video.videoHeight, true, true);
        if (missed >= 15) setFaceStatus("tracking.live", "ok");
        missed = 0;
      } else {
        missed += 1;
        if (missed === 15) setFaceStatus("tracking.none", "warn");
      }
    }
    faceTrack.raf = requestAnimationFrame(loop);
  };
  loop();
}

// Called by the try-on whenever the picture source changes.
function onTrySourceChange() {
  cancelAnimationFrame(faceTrack.raf);
  if (tryOn.mode === "model") setFaceStatus(faceTrack.enabled ? "tracking.ready" : "", "idle");
  if (tryOn.mode === "photo") trackPhoto();
  if (tryOn.mode === "camera") trackVideo();
}

// Dragging by hand switches auto-fit off so the two don't fight.
function onManualMove() {
  if (!faceTrack.enabled || tryOn.mode === "model") return;
  setAutoFit(false);
}

function setAutoFit(on) {
  faceTrack.enabled = on;
  document.getElementById("tryAuto").checked = on;
  if (on) onTrySourceChange();
  else {
    cancelAnimationFrame(faceTrack.raf);
    setFaceStatus("tracking.manual", "idle");
  }
}

function initFaceTrack() {
  const toggle = document.getElementById("tryAuto");
  if (!toggle) return;
  toggle.addEventListener("change", () => setAutoFit(toggle.checked));
  document.addEventListener("sun:languagechange", () => {
    const el = document.getElementById("faceStatus");
    if (el.dataset.key) el.textContent = t(el.dataset.key);
  });
  setFaceStatus("tracking.ready", "idle");
}
