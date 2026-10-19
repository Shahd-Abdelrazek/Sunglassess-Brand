
"use strict";

const DESIGN_DEFAULTS = { shape: "aviator", size: "medium", frame: "black", lens: "smoke", case: "classic", polarized: false, engrave: "", rx: null };

let design = { ...DESIGN_DEFAULTS };

function designFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const cfg = { ...DESIGN_DEFAULTS };
  ["shape", "size", "frame", "lens", "case"].forEach((group) => {
    const value = params.get(group);
    if (value && DESIGN_OPTIONS[group].some((o) => o.id === value)) cfg[group] = value;
  });
  cfg.polarized = params.get("pol") === "1";
  cfg.engrave = (params.get("engrave") || "").slice(0, ENGRAVE_MAX);
  return cfg;
}

function designUrl(cfg) {
  const params = new URLSearchParams({ shape: cfg.shape, size: cfg.size, frame: cfg.frame, lens: cfg.lens, case: cfg.case });
  if (cfg.polarized) params.set("pol", "1");
  if (cfg.engrave) params.set("engrave", cfg.engrave);
  const url = new URL(window.location.href);
  url.search = params.toString();
  url.hash = "";
  return url.href;
}

function stockPill(key) {
  const left = store.partAvailable(key);
  if (left === 0) return `<span class="opt-stock out">${t("cart.out")}</span>`;
  return `<span class="opt-stock${left <= 3 ? " low" : ""}">${fill(t("design.left"), { n: left })}</span>`;
}

function priceDelta(price) {
  if (!price) return "";
  return `<span class="opt-price">${price > 0 ? "+" : "−"}${formatPrice(Math.abs(price))}</span>`;
}

function optionTile(group, option, visual, extra = "") {
  const key = `${group}:${option.id}`;
  const tracked = DESIGN_PARTS.includes(group);
  const out = tracked && store.partAvailable(key) === 0;
  const selected = design[group] === option.id;
  return `
    <button type="button" class="opt${selected ? " selected" : ""}${out ? " unavailable" : ""}" data-group="${group}" data-value="${option.id}" aria-pressed="${selected}" ${out && !selected ? "disabled" : ""}>
      <span class="opt-check"><i class="fa-solid fa-check" aria-hidden="true"></i></span>
      ${visual}
      <span class="opt-name">${t(`${group}.${option.id}`)}</span>
      ${group === "shape" ? "" : priceDelta(option.price)}
      ${extra}
      ${tracked ? stockPill(key) : ""}
    </button>`;
}

function renderSteps() {
  const face = readSetting(FACE_KEY, "");
  document.getElementById("optShape").innerHTML = DESIGN_OPTIONS.shape
    .map((o) => {
      const fits = FACE_FIT[face] && FACE_FIT[face].includes(o.id);
      return optionTile("shape", o, `<span class="opt-svg">${glassesSvg({ ...design, shape: o.id, size: "medium" })}</span>`,
        `<span class="opt-price">${formatPrice(o.price)}</span>${fits ? `<span class="fit-badge">✓ ${t("finder.suitsShort")}</span>` : ""}`);
    })
    .join("");
  document.getElementById("optSize").innerHTML = DESIGN_OPTIONS.size
    .map((o) => optionTile("size", o, `<span class="size-dot size-${o.id}" aria-hidden="true"></span>`))
    .join("");
  document.getElementById("optFrame").innerHTML = DESIGN_OPTIONS.frame
    .map((o) => optionTile("frame", o, `<span class="swatch${o.pattern ? " tortoise" : ""}${o.metal ? " metal" : ""}" style="--c:${o.color}"></span>`))
    .join("");
  document.getElementById("optLens").innerHTML = DESIGN_OPTIONS.lens
    .map((o) => {
      const stops = o.stops.map(([offset, color]) => `${color} ${offset * 100}%`).join(", ");
      return optionTile("lens", o, `<span class="swatch lens-swatch" style="--g:linear-gradient(160deg, ${stops})"></span>`);
    })
    .join("");
  document.getElementById("optCase").innerHTML = DESIGN_OPTIONS.case
    .map((o) => optionTile("case", o, `<span class="opt-emoji">${o.icon}</span>`))
    .join("");

  document.querySelectorAll("[data-face-pick]").forEach((button) => {
    const on = button.dataset.facePick === face;
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", String(on));
  });
  const hint = document.getElementById("faceHint");
  hint.hidden = !FACE_FIT[face];
  if (FACE_FIT[face]) hint.textContent = fill(t("finder.tip"), { face: t(`face.${face}`), shapes: FACE_FIT[face].map((s) => t(`shape.${s}`)).join(getLang() === "ar" ? "، " : ", ") });
}

function renderPreview() {
  const stage = document.getElementById("designStage");
  stage.innerHTML = glassesSvg(design, { className: "design-svg", title: t("design.customPair") });
  document.getElementById("engravePreview").hidden = !design.engrave || view3d.on;
  if (view3d.on && view3d.viewer) view3d.viewer.update(design);
  document.getElementById("engraveText").textContent = design.engrave;
  document.getElementById("polBadge").hidden = !design.polarized;

  document.getElementById("designPrice").textContent = formatPrice(designPrice(design));
  document.getElementById("designSummary").innerHTML = [
    ["design.stepShape", t(`shape.${design.shape}`)],
    ["design.stepSize", t(`size.${design.size}`)],
    ["design.stepFrame", t(`frame.${design.frame}`)],
    ["design.stepLens", `${t(`lens.${design.lens}`)}${design.polarized ? ` · ${t("design.polarized")}` : ""}`],
    ["design.stepCase", t(`case.${design.case}`)],
    ...(design.rx ? [["rx.title", design.rx.mode === "photo" ? t("rx.photoShort") : t("rx.manualShort")]] : []),
  ]
    .map(([key, value]) => `<li><span>${t(key)}</span><strong>${value}</strong></li>`)
    .join("");

  const missing = DESIGN_PARTS.filter((group) => store.partAvailable(`${group}:${design[group]}`) === 0);
  const warning = document.getElementById("designWarning");
  warning.hidden = !missing.length;
  warning.textContent = missing.length ? fill(t("design.missing"), { parts: missing.map((g) => t(`${g}.${design[g]}`)).join(getLang() === "ar" ? "، " : ", ") }) : "";
  document.getElementById("designAdd").disabled = missing.length > 0;

  history.replaceState(null, "", designUrl(design) + window.location.hash);
  updateTryOnGlasses();
}

function render() {
  document.getElementById("polPrice").textContent = formatPrice(POLARIZED_PRICE);
  document.getElementById("engravePrice").textContent = formatPrice(ENGRAVE_PRICE);
  renderSteps();
  renderPreview();
}

// ---------- 3D view ----------

const view3d = { on: false, viewer: null, loading: null };

async function setDesignView(mode) {
  const on = mode === "3d";
  view3d.on = on;
  document.querySelectorAll("[data-view]").forEach((button) => {
    const active = button.dataset.view === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelector(".view-toggle").classList.toggle("is-3d", on);
  document.getElementById("design3d").hidden = !on;
  document.getElementById("designStage").hidden = on;
  document.getElementById("engravePreview").hidden = !design.engrave || on;
  document.getElementById("view3dHint").hidden = !on;
  if (!on) return;
  if (view3d.viewer) {
    view3d.viewer.update(design);
    return;
  }
  const status = document.getElementById("view3dStatus");
  status.hidden = false;
  try {
    if (!view3d.loading) view3d.loading = mountGlasses3D(document.getElementById("design3d"), design);
    view3d.viewer = await view3d.loading;
    view3d.viewer.update(design);
    status.hidden = true;
  } catch (error) {
    view3d.loading = null;
    status.hidden = true;
    showToast(t("view3d.failed"));
    setDesignView("2d");
  }
}

// ---------- Share & download ----------

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
  return Promise.resolve();
}

function shareText() {
  return `${t("design.shareText")} ${designSummary(design).join(" · ")} — ${formatPrice(designPrice(design))}`;
}

async function shareDesign() {
  const url = designUrl(design);
  if (navigator.share) {
    try {
      await navigator.share({ title: SHOP.brand, text: shareText(), url });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  await copyText(url);
  showToast(t("design.copied"));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function saveCanvas(canvas, name) {
  const link = document.createElement("a");
  link.download = name;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// A shareable card: the glasses, what they are made of and the price.
async function downloadDesign() {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 760;
  const ctx = canvas.getContext("2d");
  const bg = ctx.createLinearGradient(0, 0, 1200, 760);
  bg.addColorStop(0, "#e6f7f6");
  bg.addColorStop(1, "#fff1e6");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 760);
  ctx.fillStyle = "rgba(249, 160, 63, 0.25)";
  ctx.beginPath();
  ctx.arc(1050, 120, 170, 0, Math.PI * 2);
  ctx.fill();

  const glasses = await loadImage(glassesDataUrl(design));
  ctx.drawImage(glasses, 150, 90, 900, 390);

  const rtl = getLang() === "ar";
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = "center";
  ctx.fillStyle = "#0b4f52";
  ctx.font = "700 46px 'Josefin Sans', 'Cairo', sans-serif";
  ctx.fillText(`${SHOP.brand} — ${t("design.customPair")}`, 600, 545);
  ctx.fillStyle = "#3d5a5c";
  ctx.font = "500 28px 'Josefin Sans', 'Cairo', sans-serif";
  ctx.fillText(designSummary(design).slice(0, 2).join(" · "), 600, 600);
  ctx.fillStyle = "#e8692f";
  ctx.font = "700 44px 'Josefin Sans', 'Cairo', sans-serif";
  ctx.fillText(formatPrice(designPrice(design)), 600, 675);
  saveCanvas(canvas, `${SHOP.brand.toLowerCase().replace(/[^a-z]/g, "")}-design.png`);
}

// ---------- Virtual try-on ----------

const tryOn = { x: 50, y: 48, width: 46, angle: 0, stream: null, mode: "model" };

function updateTryOnGlasses() {
  const img = document.getElementById("tryGlasses");
  if (!img) return;
  img.src = glassesDataUrl(design);
  Object.assign(img.style, {
    left: `${tryOn.x}%`,
    top: `${tryOn.y}%`,
    width: `${tryOn.width}%`,
    transform: `translate(-50%, -50%) rotate(${tryOn.angle}deg)`,
  });
}

function setTryMode(mode) {
  tryOn.mode = mode;
  const stage = document.getElementById("tryStage");
  stage.dataset.mode = mode;
  if (mode !== "camera" && tryOn.stream) {
    tryOn.stream.getTracks().forEach((track) => track.stop());
    tryOn.stream = null;
  }
}

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast(t("tryon.noCamera"));
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } }, audio: false });
    setTryMode("camera");
    tryOn.stream = stream;
    const video = document.getElementById("tryVideo");
    video.srcObject = stream;
    await video.play();
    onTrySourceChange();
  } catch (error) {
    showToast(t("tryon.noCamera"));
  }
}

function usePhoto(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const photo = document.getElementById("tryPhoto");
  if (photo.dataset.url) URL.revokeObjectURL(photo.dataset.url);
  const url = URL.createObjectURL(file);
  photo.dataset.url = url;
  photo.src = url;
  setTryMode("photo");
  onTrySourceChange();
}

// Draws `source` into the canvas like CSS object-fit: cover.
function drawCover(ctx, source, sw, sh, w, h, mirror) {
  const scale = Math.max(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.save();
  if (mirror) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, (w - dw) / 2, (h - dh) / 2, dw, dh);
  ctx.restore();
}

async function snapshot() {
  const stage = document.getElementById("tryStage");
  const rect = stage.getBoundingClientRect();
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  if (tryOn.mode === "camera") {
    const video = document.getElementById("tryVideo");
    drawCover(ctx, video, video.videoWidth, video.videoHeight, w, h, true);
  } else if (tryOn.mode === "photo") {
    const photo = document.getElementById("tryPhoto");
    drawCover(ctx, photo, photo.naturalWidth, photo.naturalHeight, w, h, false);
  } else {
    const model = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(document.getElementById("tryModel").outerHTML)}`);
    drawCover(ctx, model, 400, 300, w, h, false);
  }

  const glasses = await loadImage(glassesDataUrl(design));
  const gw = (tryOn.width / 100) * w;
  const gh = gw * (130 / 300);
  ctx.save();
  ctx.translate((tryOn.x / 100) * w, (tryOn.y / 100) * h);
  ctx.rotate((tryOn.angle * Math.PI) / 180);
  ctx.drawImage(glasses, -gw / 2, -gh / 2, gw, gh);
  ctx.restore();
  saveCanvas(canvas, "try-on.png");
}

function initTryOn() {
  const stage = document.getElementById("tryStage");
  const glasses = document.getElementById("tryGlasses");
  const sizeInput = document.getElementById("trySize");
  const angleInput = document.getElementById("tryAngle");

  // Drag the glasses into place (mouse or finger).
  let drag = null;
  glasses.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    glasses.setPointerCapture(event.pointerId);
    drag = { startX: event.clientX, startY: event.clientY, x: tryOn.x, y: tryOn.y };
    onManualMove();
  });
  glasses.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const rect = stage.getBoundingClientRect();
    tryOn.x = Math.max(0, Math.min(100, drag.x + ((event.clientX - drag.startX) / rect.width) * 100));
    tryOn.y = Math.max(0, Math.min(100, drag.y + ((event.clientY - drag.startY) / rect.height) * 100));
    updateTryOnGlasses();
  });
  const endDrag = () => { drag = null; };
  glasses.addEventListener("pointerup", endDrag);
  glasses.addEventListener("pointercancel", endDrag);

  // Arrow keys nudge the glasses for keyboard users.
  glasses.addEventListener("keydown", (event) => {
    const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!moves[event.key]) return;
    event.preventDefault();
    onManualMove();
    tryOn.x = Math.max(0, Math.min(100, tryOn.x + moves[event.key][0]));
    tryOn.y = Math.max(0, Math.min(100, tryOn.y + moves[event.key][1]));
    updateTryOnGlasses();
  });

  sizeInput.addEventListener("input", () => {
    onManualMove();
    tryOn.width = Number(sizeInput.value);
    updateTryOnGlasses();
  });
  angleInput.addEventListener("input", () => {
    onManualMove();
    tryOn.angle = Number(angleInput.value);
    updateTryOnGlasses();
  });

  document.getElementById("tryCamera").addEventListener("click", startCamera);
  document.getElementById("tryUpload").addEventListener("change", (event) => usePhoto(event.target.files[0]));
  document.getElementById("tryModelBtn").addEventListener("click", () => {
    setTryMode("model");
    Object.assign(tryOn, { x: 50, y: 48, width: 46, angle: 0 });
    sizeInput.value = 46;
    angleInput.value = 0;
    updateTryOnGlasses();
    onTrySourceChange();
  });
  document.getElementById("trySnap").addEventListener("click", () => snapshot().catch(() => showToast(t("tryon.snapFailed"))));
  window.addEventListener("pagehide", () => setTryMode("model"));
  initFaceTrack();
  updateTryOnGlasses();
}

// ---------- Prescription lenses ----------

function rxRange(from, to, step, signed) {
  const values = [];
  for (let v = from; v <= to + 1e-9; v += step) {
    const n = Math.round(v * 100) / 100;
    values.push(signed && n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2));
  }
  return values;
}

function initPrescription() {
  const box = document.getElementById("rxManual");
  const select = (name, values, selected) =>
    `<select class="form-select sun-input" name="${name}" data-rx>${values.map((v) => `<option${v === selected ? " selected" : ""}>${v}</option>`).join("")}</select>`;
  const sph = rxRange(-10, 8, 0.25, true);
  const cyl = rxRange(-4, 0, 0.25, false);
  const eyeRow = (eye) => `
    <div class="rx-row">
      <span class="rx-eye" data-i18n="rx.${eye}">${t(`rx.${eye}`)}</span>
      <label><small>SPH</small>${select(`${eye}Sph`, sph, "0.00")}</label>
      <label><small>CYL</small>${select(`${eye}Cyl`, cyl, "0.00")}</label>
      <label><small>AXIS</small><input type="number" class="form-control sun-input" name="${eye}Axis" min="0" max="180" step="1" value="0" data-rx></label>
    </div>`;
  box.innerHTML = `${eyeRow("od")}${eyeRow("os")}
    <div class="rx-row rx-pd"><span class="rx-eye">PD</span><label><small data-i18n="rx.pd">${t("rx.pd")}</small>${select("pd", rxRange(50, 76, 0.5, false).map((v) => v.replace(".00", "")), "63")}</label></div>`;

  function readRx() {
    const mode = document.querySelector('input[name="rxMode"]:checked').value;
    box.hidden = mode !== "manual";
    document.getElementById("rxPhotoNote").hidden = mode !== "photo";
    if (mode === "none") return null;
    if (mode === "photo") return { mode };
    const value = (name) => box.querySelector(`[name="${name}"]`).value;
    const axis = (name) => String(Math.max(0, Math.min(180, Math.round(Number(value(name)) || 0))));
    return {
      mode,
      od: { sph: value("odSph"), cyl: value("odCyl"), axis: axis("odAxis") },
      os: { sph: value("osSph"), cyl: value("osCyl"), axis: axis("osAxis") },
      pd: value("pd"),
    };
  }

  document.getElementById("rxStep").addEventListener("change", () => {
    design.rx = readRx();
    renderPreview();
  });
  document.getElementById("rxPrice").textContent = formatPrice(RX_PRICE);
  document.addEventListener("sun:languagechange", () => {
    document.getElementById("rxPrice").textContent = formatPrice(RX_PRICE);
  });
  readRx();
}

// ---------- Page ----------

function initDesigner() {
  design = designFromUrl();
  const engrave = document.getElementById("engraveInput");
  const polarized = document.getElementById("polInput");
  engrave.maxLength = ENGRAVE_MAX;
  engrave.value = design.engrave;
  polarized.checked = design.polarized;

  document.querySelector(".builder-steps").addEventListener("click", (event) => {
    const tile = event.target.closest("[data-group]");
    if (tile && !tile.disabled) {
      design[tile.dataset.group] = tile.dataset.value;
      render();
      return;
    }
    const facePick = event.target.closest("[data-face-pick]");
    if (facePick) {
      const current = readSetting(FACE_KEY, "");
      saveSetting(FACE_KEY, current === facePick.dataset.facePick ? null : facePick.dataset.facePick);
      renderSteps();
    }
  });

  engrave.addEventListener("input", () => {
    design.engrave = engrave.value.trim().slice(0, ENGRAVE_MAX);
    document.getElementById("engraveCount").textContent = `${engrave.value.length}/${ENGRAVE_MAX}`;
    renderPreview();
  });
  polarized.addEventListener("change", () => {
    design.polarized = polarized.checked;
    renderPreview();
  });

  document.getElementById("designAdd").addEventListener("click", () => {
    if (!store.canBuild(design)) {
      showToast(t("design.cantBuild"));
      return;
    }
    // Copy the prescription too, so later edits don't change the pair already in the cart.
    store.addCustom(JSON.parse(JSON.stringify(design)));
    flyToCart(document.querySelector("#designStage svg"));
    window.setTimeout(bumpCartIcon, 650);
    refreshStore();
    showToast(t("design.added"));
  });
  document.getElementById("designReset").addEventListener("click", () => {
    design = { ...DESIGN_DEFAULTS };
    engrave.value = "";
    polarized.checked = false;
    document.getElementById("rxNone").checked = true;
    document.getElementById("rxStep").dispatchEvent(new Event("change"));
    render();
  });
  document.getElementById("designShare").addEventListener("click", shareDesign);
  document.getElementById("designWhatsapp").addEventListener("click", () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText()}\n${designUrl(design)}`)}`, "_blank", "noopener");
  });
  document.getElementById("designDownload").addEventListener("click", () => downloadDesign().catch(() => showToast(t("tryon.snapFailed"))));

  // Stock or language changed: redraw tiles and prices.
  document.addEventListener("sun:storechange", render);
  document.addEventListener("sun:languagechange", render);

  document.querySelector(".view-toggle").addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (button) setDesignView(button.dataset.view);
  });
  document.getElementById("view3dReset").addEventListener("click", () => {
    if (view3d.viewer) view3d.viewer.resetView();
  });

  // Links like designer.html?…&view=3d open straight in 3D (read before render() rewrites the address).
  const open3d = new URLSearchParams(window.location.search).get("view") === "3d";
  initTryOn();
  initPrescription();
  render();
  if (open3d) setDesignView("3d");
}
