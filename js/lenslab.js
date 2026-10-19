
"use strict";

const LENS_LOOK = {
  smoke: { tint: "#3b4149", strength: 0.55, bright: 0.78, category: 3, best: ["driving", "everyday"] },
  brown: { tint: "#8a5226", strength: 0.5, bright: 0.82, category: 3, best: ["driving", "sport"] },
  green: { tint: "#3f6b45", strength: 0.5, bright: 0.8, category: 3, best: ["everyday", "driving"] },
  bluemirror: { tint: "#2a68b5", strength: 0.42, bright: 0.8, category: 3, best: ["beach", "snow"] },
  goldmirror: { tint: "#c18a1c", strength: 0.45, bright: 0.8, category: 3, best: ["beach", "sport"] },
  rosegradient: { tint: "#c2456e", strength: 0.4, bright: 0.9, category: 2, gradient: true, best: ["city", "everyday"] },
  yellow: { tint: "#e8c41c", strength: 0.35, bright: 1.04, category: 1, best: ["cloudy", "night"] },
};

// Where the bright reflections are in each photo.
const LAB_SCENES = {
  beach: { img: "images/scenes/beach.jpg", glare: [[62, 66, 26], [80, 74, 18], [30, 80, 14]] },
  water: { img: "images/scenes/water.jpg", glare: [[64, 66, 34], [62, 38, 14], [40, 82, 16]] },
  road: { img: "images/scenes/road.jpg", glare: [[73, 26, 20], [55, 78, 26], [38, 70, 14]] },
  snow: { img: "images/scenes/snow.jpg", glare: [[38, 52, 26], [58, 47, 22], [76, 60, 14]] },
};

function glareLayer(spots) {
  return spots
    .map(([x, y, r]) => `radial-gradient(ellipse ${r * 1.4}% ${r}% at ${x}% ${y}%, rgba(255,255,255,0.92), rgba(255,255,255,0.35) 45%, rgba(255,255,255,0) 100%)`)
    .concat("linear-gradient(rgba(255,255,255,0.14), rgba(255,255,255,0.14))")
    .join(", ");
}

function initLensLab() {
  const stage = document.getElementById("labStage");
  const split = document.getElementById("labSplit");
  const polarized = document.getElementById("labPolar");
  let scene = "water";
  let lens = new URLSearchParams(window.location.search).get("lens");
  if (!LENS_LOOK[lens]) lens = "smoke";

  document.querySelectorAll("[data-scene]").forEach((button) => {
    button.style.setProperty("--thumb", `url("${new URL(LAB_SCENES[button.dataset.scene].img, window.location.href).href}")`);
  });

  document.getElementById("labLenses").innerHTML = DESIGN_OPTIONS.lens
    .map((o) => {
      const stops = o.stops.map(([offset, color]) => `${color} ${offset * 100}%`).join(", ");
      return `<button type="button" class="lab-lens" data-lens="${o.id}" aria-pressed="false"><span class="swatch lens-swatch" style="--g:linear-gradient(160deg, ${stops})"></span><span data-i18n="lens.${o.id}"></span></button>`;
    })
    .join("");

  function render() {
    const look = LENS_LOOK[lens];
    const sceneInfo = LAB_SCENES[scene];
    // url() inside a CSS variable resolves against the stylesheet, so pass a full address.
    stage.style.setProperty("--scene", `url("${new URL(sceneInfo.img, window.location.href).href}")`);
    stage.style.setProperty("--glare", glareLayer(sceneInfo.glare));
    stage.style.setProperty("--lens-tint", look.tint);
    stage.style.setProperty("--strength", look.strength);
    stage.style.setProperty("--bright", look.bright);
    stage.classList.toggle("tint-gradient", Boolean(look.gradient));
    stage.classList.toggle("is-polarized", polarized.checked);
    stage.style.setProperty("--split", `${split.value}%`);

    document.querySelectorAll("[data-scene]").forEach((b) => {
      b.classList.toggle("active", b.dataset.scene === scene);
      b.setAttribute("aria-pressed", String(b.dataset.scene === scene));
    });
    document.querySelectorAll("[data-lens]").forEach((b) => {
      b.classList.toggle("active", b.dataset.lens === lens);
      b.setAttribute("aria-pressed", String(b.dataset.lens === lens));
    });

    document.getElementById("labLensName").textContent = t(`lens.${lens}`);
    document.getElementById("labLensText").textContent = t(`lab.lens.${lens}`);
    document.getElementById("labCategory").textContent = fill(t("lab.category"), { n: look.category });
    document.getElementById("labCategoryText").textContent = t(`lab.cat${look.category}`);
    document.getElementById("labBest").innerHTML = look.best.map((use) => `<span>${t(`lab.use.${use}`)}</span>`).join("");
    document.getElementById("labRightLabel").textContent = `${t(`lens.${lens}`)}${polarized.checked ? ` · ${t("design.polarized")}` : ""}`;
    document.getElementById("labDesign").href = `designer.html?lens=${lens}${polarized.checked ? "&pol=1" : ""}`;
  }

  document.querySelector(".lab-scenes").addEventListener("click", (event) => {
    const button = event.target.closest("[data-scene]");
    if (!button) return;
    scene = button.dataset.scene;
    render();
  });
  document.getElementById("labLenses").addEventListener("click", (event) => {
    const button = event.target.closest("[data-lens]");
    if (!button) return;
    lens = button.dataset.lens;
    render();
  });
  split.addEventListener("input", render);
  polarized.addEventListener("change", render);
  document.addEventListener("sun:languagechange", render);
  applyLanguage(getLang());
  render();
}
