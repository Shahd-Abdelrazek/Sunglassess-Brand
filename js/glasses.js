
"use strict";

const LENS_PATHS = {
  round: "M-40,0 a40,40 0 1,0 80,0 a40,40 0 1,0 -80,0Z",
  aviator: "M-48,-30 Q-50,-40 -36,-40 H34 Q48,-40 48,-26 Q48,10 26,34 Q10,48 -12,44 Q-44,36 -48,6 Z",
  wayfarer: "M-50,-34 H46 Q52,-34 50,-26 L42,22 Q38,38 22,38 H-24 Q-42,38 -46,22 L-54,-24 Q-56,-34 -50,-34Z",
  cateye: "M-58,-44 Q-20,-34 36,-32 Q50,-32 48,-16 Q44,24 18,34 Q-14,42 -36,26 Q-52,12 -52,-16 Q-54,-32 -58,-44Z",
  square: "M-36,-36 H36 Q46,-36 46,-26 V26 Q46,36 36,36 H-36 Q-46,36 -46,26 V-26 Q-46,-36 -36,-36Z",
  heart: "M0,38 C-40,10 -54,-14 -42,-30 C-30,-46 -8,-40 0,-24 C8,-40 30,-46 42,-30 C54,-14 40,10 0,38Z",
};

const SIZE_SCALE = { kids: 0.86, medium: 1, large: 1.08 };

let glassesUid = 0;

function lensGradient(id, lens) {
  const stops = lens.stops.map(([offset, color, opacity]) => `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`).join("");
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0.35" y2="1">${stops}</linearGradient>`;
}

function tortoisePattern(id) {
  return `<pattern id="${id}" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
    <rect width="18" height="18" fill="#6b3d17"/>
    <circle cx="4" cy="5" r="4" fill="#2f1a0b"/><circle cx="13" cy="12" r="5" fill="#a5672e"/>
    <circle cx="14" cy="3" r="2.5" fill="#3d220f"/><circle cx="5" cy="15" r="2" fill="#c98b45"/>
  </pattern>`;
}

/**
 * cfg: { shape, frame, lens, size }  — ids from DESIGN_OPTIONS.
 * Returns an SVG string (viewBox 300 × 130).
 */
function glassesSvg(cfg, { className = "", title = "" } = {}) {
  const uid = `g${(glassesUid += 1)}`;
  const frame = designOption("frame", cfg.frame);
  const lens = designOption("lens", cfg.lens);
  const path = LENS_PATHS[cfg.shape] || LENS_PATHS.round;
  const scale = SIZE_SCALE[cfg.size] || 1;
  const stroke = frame.pattern ? `url(#${uid}t)` : frame.color;
  const thin = frame.metal ? 4.5 : 7.5;
  const lensShape = (x, mirror) => `
    <g transform="translate(${x} 64) scale(${mirror ? -1 : 1} 1)">
      <path d="${path}" fill="url(#${uid}l)"/>
      <path d="${path}" fill="none" stroke="${stroke}" stroke-width="${thin}" stroke-linejoin="round"/>
      <ellipse cx="-14" cy="-16" rx="16" ry="7" fill="#fff" opacity="0.28" transform="rotate(-20 -14 -16)"/>
    </g>`;

  return `<svg class="${className}" viewBox="0 0 300 130" xmlns="http://www.w3.org/2000/svg" role="img"${title ? ` aria-label="${title}"` : ' aria-hidden="true"'}>
    <defs>${lensGradient(`${uid}l`, lens)}${frame.pattern ? tortoisePattern(`${uid}t`) : ""}</defs>
    <g transform="translate(150 64) scale(${scale}) translate(-150 -64)">
      <path d="M8,40 L40,34" stroke="${stroke}" stroke-width="${thin + 1}" stroke-linecap="round"/>
      <path d="M292,40 L260,34" stroke="${stroke}" stroke-width="${thin + 1}" stroke-linecap="round"/>
      ${lensShape(92, false)}
      ${lensShape(208, true)}
      <path d="M136,48 Q150,34 164,48" fill="none" stroke="${stroke}" stroke-width="${thin}" stroke-linecap="round"/>
      ${frame.metal ? `<path d="M128,62 l6,8 M172,62 l-6,8" stroke="${frame.color}" stroke-width="3" stroke-linecap="round"/>` : ""}
    </g>
  </svg>`;
}

function glassesDataUrl(cfg) {
  const svg = glassesSvg(cfg).replace("<svg ", '<svg width="600" height="260" ');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
