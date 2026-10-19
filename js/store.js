// Store: products, stock, prices, the shopping cart and checkout.
// Stock and cart live in this browser's localStorage; orders are sent to the shop on WhatsApp.
"use strict";

const SHOP = {
  brand: "SUN&PALM",
  whatsapp: "201000000000",
  currency: "EGP",
  trackingSheetCsv: "",
};

const COUPONS = { SUN5: 5 };

const PRODUCTS = [
  { id: "m1", category: "men", shape: "round", material: "metal", polarized: true, img: "images/pexels-asim-razan-343717.jpg", price: 950, was: 1200, stock: 9 },
  { id: "m2", category: "men", shape: "aviator", material: "metal", polarized: true, img: "images/pexels-bymuratisikofficial-31906962.jpg", price: 1350, stock: 6 },
  { id: "m3", category: "men", shape: "square", material: "acetate", polarized: true, img: "images/pexels-kazys-photography-2151238955-31882325.jpg", price: 1100, was: 1450, stock: 4 },
  { id: "m4", category: "men", shape: "wayfarer", material: "acetate", polarized: false, img: "images/pexels-ratul-pal-421897581-31900370.jpg", price: 850, stock: 14 },
  { id: "m5", category: "men", shape: "round", material: "acetate", polarized: false, img: "images/pexels-umutsrln-31896870.jpg", price: 780, was: 990, stock: 11 },
  { id: "w1", category: "women", shape: "heart", material: "acetate", polarized: false, img: "images/pexels-guillermo-berlin-1524368912-31836776.jpg", price: 690, was: 890, stock: 8 },
  { id: "w2", category: "women", shape: "cateye", material: "acetate", polarized: true, img: "images/pexels-bymuratisikofficial-31906924.jpg", price: 1050, stock: 5 },
  { id: "w3", category: "women", shape: "square", material: "acetate", polarized: true, img: "images/pexels-abdoo-31907404.jpg", price: 920, stock: 10 },
  { id: "w4", category: "women", shape: "round", material: "metal", polarized: false, img: "images/pexels-joao-vitor-heinrichs-862489-8223469.jpg", price: 880, was: 1100, stock: 3 },
  { id: "k1", category: "kids", shape: "round", material: "tr90", polarized: false, img: "images/pexels-bertellifotografia-30464387.jpg", price: 420, stock: 15 },
  { id: "k2", category: "kids", shape: "aviator", material: "tr90", polarized: true, img: "images/pexels-crisstianpantoja-838879.jpg", price: 450, was: 520, stock: 7 },
  { id: "k3", category: "kids", shape: "round", material: "tr90", polarized: false, img: "images/pexels-olcayertem06-10508388.jpg", price: 390, stock: 12 },
  { id: "k4", category: "kids", shape: "wayfarer", material: "tr90", polarized: false, img: "images/pexels-rndiid-27309328.jpg", price: 380, stock: 2 },
  { id: "b1", category: "bundles", shape: "round", material: "metal", polarized: false, img: "images/pexels-gerardo-jaasiel-rubio-lobato-537697707-18105549.jpg", price: 1490, was: 1800, stock: 4 },
  { id: "b2", category: "bundles", shape: "round", material: "acetate", polarized: true, img: "images/pexels-apex-31902633.jpg", price: 1690, was: 2000, stock: 3 },
  { id: "b3", category: "bundles", shape: "round", material: "tr90", polarized: false, img: "images/pexels-mika-photogenius-641920605-30467584.jpg", price: 790, was: 950, stock: 6 },
  { id: "b4", category: "bundles", shape: "wayfarer", material: "acetate", polarized: true, img: "images/pexels-glassesshop-gs-1317359316-27353347.jpg", price: 1990, was: 2600, stock: 5 },
  { id: "b5", category: "bundles", shape: "cateye", material: "acetate", polarized: false, img: "images/pexels-arkhod-85162625-8944696.jpg", price: 1590, was: 1900, stock: 4 },
];
const CATEGORIES = ["men", "women", "kids", "bundles"];
const SHAPES = ["aviator", "round", "wayfarer", "cateye", "square", "heart"];
const LOW_STOCK = 5;

// Which frame shapes flatter each face shape (used by the face-shape finder and the designer).
const FACE_FIT = {
  oval: ["aviator", "round", "wayfarer", "cateye", "square", "heart"],
  round: ["square", "wayfarer", "cateye"],
  square: ["round", "aviator", "cateye", "heart"],
  heart: ["aviator", "round", "wayfarer"],
  oblong: ["aviator", "square", "wayfarer"],
};

const STORAGE = {
  cart: "sunpalm-cart",
  stock: "sunpalm-stock",
  customs: "sunpalm-custom-pairs",
  parts: "sunpalm-parts",
  coupon: "sunpalm-coupon",
  lastOrder: "sunpalm-last-order",
  sets: "sunpalm-family-sets",
};

const DESIGN_OPTIONS = {
  shape: [
    { id: "aviator", price: 900, stock: 12 },
    { id: "round", price: 800, stock: 15 },
    { id: "wayfarer", price: 850, stock: 10 },
    { id: "cateye", price: 900, stock: 6 },
    { id: "square", price: 850, stock: 8 },
    { id: "heart", price: 750, stock: 3 },
  ],
  size: [
    { id: "kids", price: -250 },
    { id: "medium", price: 0 },
    { id: "large", price: 50 },
  ],
  frame: [
    { id: "black", color: "#1b1d22", price: 0, stock: 25 },
    { id: "tortoise", color: "#6b3d17", pattern: true, price: 80, stock: 9 },
    { id: "gold", color: "#c9a24a", metal: true, price: 150, stock: 7 },
    { id: "silver", color: "#a9b1bb", metal: true, price: 120, stock: 6 },
    { id: "rose", color: "#e2a093", price: 60, stock: 4 },
    { id: "white", color: "#f4f4f2", price: 40, stock: 8 },
    { id: "teal", color: "#0f9292", price: 60, stock: 0 },
  ],
  lens: [
    { id: "smoke", stops: [[0, "#1d2229", 0.95], [1, "#3c4450", 0.85]], price: 0, stock: 30 },
    { id: "brown", stops: [[0, "#4a2f1a", 0.95], [1, "#8a5a33", 0.8]], price: 0, stock: 18 },
    { id: "green", stops: [[0, "#2a3f2b", 0.95], [1, "#4f6b4d", 0.85]], price: 50, stock: 10 },
    { id: "bluemirror", stops: [[0, "#1450a3", 1], [0.5, "#3aa0e8", 0.95], [1, "#9be3ff", 0.9]], price: 150, stock: 6 },
    { id: "goldmirror", stops: [[0, "#8a5a0b", 1], [0.5, "#e0a526", 0.95], [1, "#ffe39a", 0.9]], price: 150, stock: 3 },
    { id: "rosegradient", stops: [[0, "#b8325e", 0.9], [1, "#f6a5bd", 0.25]], price: 80, stock: 7 },
    { id: "yellow", stops: [[0, "#e0b51a", 0.75], [1, "#f6dc6a", 0.55]], price: 60, stock: 5 },
  ],
  case: [
    { id: "classic", icon: "🕶️", price: 0, stock: 40 },
    { id: "leather", icon: "👜", price: 150, stock: 5 },
    { id: "eco", icon: "🌿", price: 100, stock: 9 },
  ],
};
const DESIGN_PARTS = ["shape", "frame", "lens", "case"];
const POLARIZED_PRICE = 250;
const ENGRAVE_PRICE = 80;
const ENGRAVE_MAX = 14;
const RX_PRICE = 600;
const FAMILY_DISCOUNT = 10;
const FAMILY_ROLES = { dad: "men", mom: "women", kid: "kids" };

function designOption(group, id) {
  return DESIGN_OPTIONS[group].find((o) => o.id === id) || DESIGN_OPTIONS[group][0];
}

function designPrice(cfg) {
  const parts = ["shape", "size", "frame", "lens", "case"].reduce((sum, group) => sum + designOption(group, cfg[group]).price, 0);
  return parts + (cfg.polarized ? POLARIZED_PRICE : 0) + (cfg.engrave ? ENGRAVE_PRICE : 0) + (cfg.rx ? RX_PRICE : 0);
}

function familyFullPrice(set) {
  return Object.values(set.items).reduce((sum, id) => sum + PRODUCTS.find((p) => p.id === id).price, 0);
}

function familyPrice(set) {
  return Math.round((familyFullPrice(set) * (100 - FAMILY_DISCOUNT)) / 100);
}

function designUsage(cfg) {
  return Object.fromEntries(DESIGN_PARTS.map((group) => [`${group}:${cfg[group]}`, 1]));
}

function formatPrice(amount) {
  const locale = (typeof LANGUAGES !== "undefined" && LANGUAGES[getLang()].locale) || "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency: SHOP.currency, maximumFractionDigits: 0 }).format(amount);
}

function salePercent(product) {
  return product.was ? Math.round((1 - product.price / product.was) * 100) : 0;
}

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value && typeof value === "object" ? value : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
  }
}

function readSetting(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (error) {
    return fallback;
  }
}

function saveSetting(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (error) {
  }
}

const store = {
  cart: readJson(STORAGE.cart, {}),
  stock: readJson(STORAGE.stock, {}),
  customs: Array.isArray(readJson(STORAGE.customs, [])) ? readJson(STORAGE.customs, []) : [],
  parts: readJson(STORAGE.parts, {}),
  sets: Array.isArray(readJson(STORAGE.sets, [])) ? readJson(STORAGE.sets, []) : [],
  coupon: COUPONS[readSetting(STORAGE.coupon, "")] ? readSetting(STORAGE.coupon, "") : "",

  partStock(key) {
    const saved = this.parts[key];
    if (Number.isInteger(saved)) return saved;
    const [group, id] = key.split(":");
    const option = DESIGN_OPTIONS[group] && DESIGN_OPTIONS[group].find((o) => o.id === id);
    return option ? option.stock : 0;
  },
  partAvailable(key) {
    const reserved = this.customs.reduce((sum, pair) => sum + (designUsage(pair.cfg)[key] || 0), 0);
    return Math.max(0, this.partStock(key) - reserved);
  },
  canBuild(cfg) {
    return Object.keys(designUsage(cfg)).every((key) => this.partAvailable(key) >= 1);
  },
  addCustom(cfg) {
    this.customs.push({ id: `c${Date.now()}`, cfg });
    writeJson(STORAGE.customs, this.customs);
  },
  removeCustom(id) {
    this.customs = this.customs.filter((pair) => pair.id !== id);
    writeJson(STORAGE.customs, this.customs);
  },

  product(id) {
    return PRODUCTS.find((p) => p.id === id);
  },
  stockOf(id) {
    const saved = this.stock[id];
    return Number.isInteger(saved) ? saved : this.product(id).stock;
  },
  inCart(id) {
    return this.cart[id] || 0;
  },
  // How many family sets in the cart include this product.
  inSets(id) {
    return this.sets.filter((set) => Object.values(set.items).includes(id)).length;
  },
  available(id) {
    return Math.max(0, this.stockOf(id) - this.inCart(id) - this.inSets(id));
  },
  addSet(items) {
    this.sets.push({ id: `f${Date.now()}`, items });
    writeJson(STORAGE.sets, this.sets);
  },
  removeSet(id) {
    this.sets = this.sets.filter((set) => set.id !== id);
    writeJson(STORAGE.sets, this.sets);
  },
  availableByCategory(category) {
    return PRODUCTS.filter((p) => p.category === category).reduce((sum, p) => sum + this.available(p.id), 0);
  },
  subtotal() {
    const products = Object.entries(this.cart).reduce((sum, [id, qty]) => sum + (this.product(id) ? this.product(id).price * qty : 0), 0);
    return products + this.customs.reduce((sum, pair) => sum + designPrice(pair.cfg), 0) + this.sets.reduce((sum, set) => sum + familyPrice(set), 0);
  },
  discount() {
    return this.coupon ? Math.round((this.subtotal() * COUPONS[this.coupon]) / 100) : 0;
  },
  total() {
    return this.subtotal() - this.discount();
  },
  count() {
    return Object.values(this.cart).reduce((sum, qty) => sum + qty, 0) + this.customs.length + this.sets.length * 3;
  },
  setQty(id, qty) {
    const clamped = Math.max(0, Math.min(qty, this.stockOf(id) - this.inSets(id)));
    if (clamped === 0) delete this.cart[id];
    else this.cart[id] = clamped;
    writeJson(STORAGE.cart, this.cart);
  },
  setCoupon(code) {
    this.coupon = code;
    saveSetting(STORAGE.coupon, code || null);
  },
  checkout() {
    Object.entries(this.cart).forEach(([id, qty]) => {
      this.stock[id] = Math.max(0, this.stockOf(id) - qty);
    });
    this.sets.forEach((set) => {
      Object.values(set.items).forEach((id) => {
        this.stock[id] = Math.max(0, this.stockOf(id) - 1);
      });
    });
    this.customs.forEach((pair) => {
      Object.keys(designUsage(pair.cfg)).forEach((key) => {
        this.parts[key] = Math.max(0, this.partStock(key) - 1);
      });
    });
    this.cart = {};
    this.customs = [];
    this.sets = [];
    writeJson(STORAGE.sets, this.sets);
    this.setCoupon("");
    writeJson(STORAGE.stock, this.stock);
    writeJson(STORAGE.cart, this.cart);
    writeJson(STORAGE.customs, this.customs);
    writeJson(STORAGE.parts, this.parts);
  },
};

function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
}

function productName(id, lang) {
  return t(`prod.${id}`, lang);
}

// e.g. "Gold aviator · Blue mirror lenses · Polarized"
function designSummary(cfg) {
  const parts = [
    `${t(`frame.${cfg.frame}`)} ${t(`shape.${cfg.shape}`)} · ${t(`size.${cfg.size}`)}`,
    `${t(`lens.${cfg.lens}`)}${cfg.polarized ? ` · ${t("design.polarized")}` : ""}`,
    `${designOption("case", cfg.case).icon} ${t(`case.${cfg.case}`)}`,
  ];
  if (cfg.engrave) parts.push(`✍️ “${cfg.engrave}”`);
  if (cfg.rx) parts.push(`👓 ${t("rx.title")}: ${rxSummary(cfg.rx)}`);
  return parts;
}

// ---------- UI ----------

function cartDrawerTemplate() {
  return `
  <div class="offcanvas offcanvas-end cart-drawer" tabindex="-1" id="cartDrawer" aria-labelledby="cartTitle">
    <div class="offcanvas-header cart-head">
      <h5 class="offcanvas-title" id="cartTitle"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i> <span data-i18n="cart.title"></span></h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" data-i18n-aria="modal.close"></button>
    </div>
    <div class="offcanvas-body">
      <a class="track-link" href="track.html"><i class="fa-solid fa-truck-fast" aria-hidden="true"></i> <span data-i18n="track.cta"></span> <i class="fa-solid fa-chevron-right flip-rtl ms-auto" aria-hidden="true"></i></a>
      <div id="cartItems" class="cart-items"></div>
      <div id="cartEmpty" class="cart-empty">
        <span class="cart-empty-ic"><i class="fa-solid fa-glasses" aria-hidden="true"></i></span>
        <p data-i18n="cart.empty"></p>
        <a class="btn-sun btn-sm-sun" href="shop.html" data-i18n="cart.browse"></a>
      </div>
      <button type="button" class="reorder-btn" id="reorderBtn" hidden>
        <span class="reorder-ic"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i></span>
        <span><strong data-i18n="reorder.title"></strong><small id="reorderInfo"></small></span>
      </button>
    </div>
    <div class="cart-foot" id="cartFoot">
      <form class="promo-form" id="promoForm">
        <i class="fa-solid fa-ticket" aria-hidden="true"></i>
        <input type="text" id="promoInput" dir="ltr" maxlength="12" autocomplete="off" data-i18n-placeholder="promo.placeholder" data-i18n-aria="promo.placeholder">
        <button type="submit" data-i18n="promo.apply"></button>
      </form>
      <div class="cart-total"><span data-i18n="cart.items"></span><strong id="cartCount">0</strong></div>
      <div class="cart-total cart-discount" id="cartDiscountRow" hidden><span><i class="fa-solid fa-tag" aria-hidden="true"></i> <span id="cartDiscountLabel"></span> <button type="button" class="link-btn" id="promoRemove" data-i18n="cart.remove"></button></span><strong id="cartDiscount"></strong></div>
      <div class="cart-total cart-grand"><span data-i18n="cart.total"></span><strong id="cartPrice">0</strong></div>
      <p class="free-ship"><i class="fa-solid fa-truck" aria-hidden="true"></i> <span data-i18n="cart.freeShip"></span></p>
      <button type="button" class="btn-sun w-100 justify-content-center" id="cartCheckout"><span data-i18n="cart.checkout"></span> <i class="fa-solid fa-check" aria-hidden="true"></i></button>
      <button type="button" class="link-btn mt-2" id="cartClear" data-i18n="cart.clear"></button>
    </div>
  </div>`;
}

function renderCart() {
  const list = document.getElementById("cartItems");
  if (!list) return;

  const ids = Object.keys(store.cart).filter((id) => store.product(id));
  list.innerHTML = ids
    .map((id) => {
      const product = store.product(id);
      const left = store.available(id);
      const low = left <= LOW_STOCK;
      return `
      <div class="cart-line" data-line="${id}">
        <img src="${product.img}" alt="">
        <div class="cart-line-info">
          <h6>${productName(id)} <span class="line-price">${formatPrice(product.price * store.inCart(id))}</span></h6>
          <p class="cart-meta">${t(`shape.${product.shape}`)} · ${t(`cat.${product.category}`)}</p>
          <p class="cart-stock${left === 0 ? " out" : low ? " low" : ""}">
            <i class="fa-solid fa-box" aria-hidden="true"></i>
            ${left === 0 ? t("cart.out") : fill(t("cart.left"), { n: left })}
          </p>
          <div class="qty">
            <button type="button" data-qty="-1" aria-label="-"><i class="fa-solid fa-minus" aria-hidden="true"></i></button>
            <span>${store.inCart(id)}</span>
            <button type="button" data-qty="1" aria-label="+" ${left === 0 ? "disabled" : ""}><i class="fa-solid fa-plus" aria-hidden="true"></i></button>
          </div>
        </div>
        <button type="button" class="cart-remove" data-remove aria-label="${t("cart.remove")}"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>
      </div>`;
    })
    .join("") + store.sets.map(familyLineHtml).join("") + store.customs.map(customLineHtml).join("");

  const count = store.count();
  document.getElementById("cartEmpty").hidden = count > 0;
  document.getElementById("cartFoot").hidden = count === 0;
  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartPrice").textContent = formatPrice(store.total());
  const discountRow = document.getElementById("cartDiscountRow");
  discountRow.hidden = !store.coupon;
  if (store.coupon) {
    document.getElementById("cartDiscountLabel").textContent = fill(t("promo.label"), { code: store.coupon, p: COUPONS[store.coupon] });
    document.getElementById("cartDiscount").textContent = `−${formatPrice(store.discount())}`;
  }
  document.getElementById("promoForm").hidden = Boolean(store.coupon);

  const last = readJson(STORAGE.lastOrder, null);
  const reorder = document.getElementById("reorderBtn");
  const lastCount = last ? Object.values(last.cart || {}).reduce((a, b) => a + b, 0) + (last.customs || []).length + (last.sets || []).length * 3 : 0;
  reorder.hidden = !lastCount;
  if (lastCount) document.getElementById("reorderInfo").textContent = fill(t("reorder.info"), { n: lastCount });

  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.textContent = count;
    badge.hidden = count === 0;
  });
}

function rxSummary(rx) {
  if (rx.mode === "photo") return t("rx.photoNote");
  const eye = (side, e) => `${side}: SPH ${e.sph} · CYL ${e.cyl}${Number(e.cyl) ? ` · AX ${e.axis}°` : ""}`;
  return `${eye("R", rx.od)} | ${eye("L", rx.os)} | PD ${rx.pd}`;
}

function familyLineHtml(set) {
  const thumbs = Object.values(set.items).map((id) => `<img src="${store.product(id).img}" alt="">`).join("");
  const names = Object.entries(set.items).map(([role, id]) => `<p class="custom-detail">${t(`family.${role}`)}: ${productName(id)}</p>`).join("");
  return `
    <div class="cart-line family-line" data-set="${set.id}">
      <span class="family-thumbs">${thumbs}</span>
      <div class="cart-line-info">
        <h6>${t("family.title")} <span class="family-off">−${FAMILY_DISCOUNT}%</span> <span class="line-price">${formatPrice(familyPrice(set))}</span></h6>
        ${names}
      </div>
      <button type="button" class="cart-remove" data-remove-set aria-label="${t("cart.remove")}"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>
    </div>`;
}

function customLineHtml(pair) {
  return `
    <div class="cart-line custom-line" data-custom="${pair.id}">
      <span class="custom-thumb">${glassesSvg(pair.cfg)}</span>
      <div class="cart-line-info">
        <h6>${t("design.customPair")} <span class="line-price">${formatPrice(designPrice(pair.cfg))}</span></h6>
        ${designSummary(pair.cfg).map((line) => `<p class="custom-detail">${escapeHtml(line)}</p>`).join("")}
      </div>
      <button type="button" class="cart-remove" data-remove-custom aria-label="${t("cart.remove")}"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>
    </div>`;
}

function renderStockBadges() {
  document.querySelectorAll("[data-product]").forEach((el) => {
    const id = el.dataset.product;
    const product = store.product(id);
    if (!product) return;
    const left = store.available(id);

    el.querySelectorAll("[data-price]").forEach((price) => {
      price.textContent = formatPrice(product.price);
    });
    el.querySelectorAll("[data-was]").forEach((was) => {
      was.hidden = !product.was;
      was.textContent = product.was ? formatPrice(product.was) : "";
    });

    const badge = el.querySelector("[data-stock-badge]");
    if (badge) {
      badge.className = `stock-badge${left === 0 ? " out" : left <= LOW_STOCK ? " low" : ""}${badge.classList.contains("static") ? " static" : ""}`;
      badge.textContent =
        left === 0 ? t("cart.out") : left <= LOW_STOCK ? fill(t("cart.onlyLeft"), { n: left }) : fill(t("cart.inStock"), { n: left });
    }
    el.querySelectorAll("[data-add-to-cart]").forEach((button) => {
      button.disabled = left === 0;
      button.hidden = left === 0 && Boolean(el.querySelector("[data-notify]"));
    });
    el.querySelectorAll("[data-notify]").forEach((button) => {
      button.hidden = left > 0;
    });
  });
}

function refreshStore() {
  renderCart();
  renderStockBadges();
  document.dispatchEvent(new CustomEvent("sun:storechange"));
}

function flyToCart(sourceEl) {
  const target = document.querySelector(".cart-btn");
  if (!sourceEl || !target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const from = sourceEl.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const flyer = sourceEl.cloneNode(true);
  flyer.classList.add("cart-flyer");
  flyer.removeAttribute("id");
  Object.assign(flyer.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
  document.body.appendChild(flyer);

  requestAnimationFrame(() => {
    Object.assign(flyer.style, {
      left: `${to.left + to.width / 2 - 20}px`,
      top: `${to.top + to.height / 2 - 20}px`,
      width: "40px",
      height: "40px",
      opacity: "0.3",
    });
  });
  flyer.addEventListener("transitionend", () => flyer.remove(), { once: true });
  window.setTimeout(() => flyer.remove(), 1200);
}

function bumpCartIcon() {
  const button = document.querySelector(".cart-btn");
  if (!button) return;
  button.classList.remove("bump");
  void button.offsetWidth; // restart the animation
  button.classList.add("bump");
}

function addToCart(id, sourceImg) {
  if (store.available(id) === 0) {
    showToast(fill(t("cart.maxReached"), { name: productName(id) }));
    return;
  }
  store.setQty(id, store.inCart(id) + 1);
  flyToCart(sourceImg);
  window.setTimeout(bumpCartIcon, 650);
  refreshStore();
  showToast(fill(t("cart.added"), { name: productName(id), n: store.available(id) }));
}

function initStore() {
  document.body.insertAdjacentHTML("beforeend", cartDrawerTemplate());

  document.addEventListener("click", (event) => {
    const notifyButton = event.target.closest("[data-notify]");
    if (notifyButton) {
      const id = notifyButton.closest("[data-product]").dataset.product;
      const text = fill(t("notify.msg"), { name: productName(id) });
      window.open(`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
      showToast(t("notify.done"));
      return;
    }

    const addButton = event.target.closest("[data-add-to-cart]");
    if (addButton) {
      const holder = addButton.closest("[data-product]");
      if (holder) addToCart(holder.dataset.product, holder.querySelector("img"));
      return;
    }

    const setLine = event.target.closest("[data-set]");
    if (setLine && event.target.closest("[data-remove-set]")) {
      store.removeSet(setLine.dataset.set);
      refreshStore();
      return;
    }

    const customLine = event.target.closest("[data-custom]");
    if (customLine && event.target.closest("[data-remove-custom]")) {
      store.removeCustom(customLine.dataset.custom);
      refreshStore();
      return;
    }

    const line = event.target.closest("[data-line]");
    if (!line) return;
    const id = line.dataset.line;
    const qtyButton = event.target.closest("[data-qty]");
    if (qtyButton) {
      store.setQty(id, store.inCart(id) + Number(qtyButton.dataset.qty));
      refreshStore();
    } else if (event.target.closest("[data-remove]")) {
      store.setQty(id, 0);
      refreshStore();
    }
  });

  document.getElementById("cartClear").addEventListener("click", () => {
    Object.keys(store.cart).forEach((id) => store.setQty(id, 0));
    [...store.customs].forEach((pair) => store.removeCustom(pair.id));
    [...store.sets].forEach((set) => store.removeSet(set.id));
    refreshStore();
  });

  document.getElementById("promoForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("promoInput");
    const code = input.value.trim().toUpperCase();
    if (!COUPONS[code]) {
      showToast(t("promo.invalid"));
      return;
    }
    store.setCoupon(code);
    input.value = "";
    refreshStore();
    showToast(fill(t("promo.applied"), { p: COUPONS[code] }));
  });
  document.getElementById("promoRemove").addEventListener("click", () => {
    store.setCoupon("");
    refreshStore();
  });

  initCheckout();

  // Put the previous order back in the cart, as far as stock allows.
  document.getElementById("reorderBtn").addEventListener("click", () => {
    const last = readJson(STORAGE.lastOrder, null);
    if (!last) return;
    let skipped = 0;
    Object.entries(last.cart || {}).forEach(([id, qty]) => {
      if (!store.product(id)) return;
      const add = Math.min(qty, store.available(id));
      skipped += qty - add;
      if (add) store.setQty(id, store.inCart(id) + add);
    });
    (last.sets || []).forEach((items) => {
      if (Object.values(items).every((id) => store.product(id) && store.available(id) > 0)) store.addSet(items);
      else skipped += 1;
    });
    (last.customs || []).forEach((cfg) => {
      if (store.canBuild(cfg)) store.addCustom(cfg);
      else skipped += 1;
    });
    refreshStore();
    showToast(t(skipped ? "reorder.partial" : "reorder.done"));
  });

  window.addEventListener("storage", (event) => {
    if (Object.values(STORAGE).includes(event.key)) {
      store.cart = readJson(STORAGE.cart, {});
      store.stock = readJson(STORAGE.stock, {});
      store.customs = readJson(STORAGE.customs, []);
      store.parts = readJson(STORAGE.parts, {});
      store.sets = readJson(STORAGE.sets, []);
      store.coupon = COUPONS[readSetting(STORAGE.coupon, "")] ? readSetting(STORAGE.coupon, "") : "";
      refreshStore();
    }
  });

  document.addEventListener("sun:languagechange", refreshStore);
  refreshStore();
}

// ---------- Checkout: collect delivery details, then send the order on WhatsApp ----------

function checkoutTemplate() {
  const payments = ["cash", "vodafone", "instapay"]
    .map((id, i) => `<input type="radio" class="btn-check" name="payment" id="pay-${id}" value="${id}" ${i === 0 ? "checked" : ""}><label class="pill-choice" for="pay-${id}" data-i18n="co.pay.${id}"></label>`)
    .join("");
  return `
  <div class="modal fade" id="checkoutModal" tabindex="-1" aria-labelledby="checkoutTitle" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
      <div class="modal-content sun-modal">
        <div class="modal-head checkout-head">
          <h5 class="modal-title" id="checkoutTitle"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i> <span data-i18n="co.title"></span></h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" data-i18n-aria="modal.close"></button>
        </div>
        <div class="modal-body">
          <form id="checkoutForm">
            <div class="row g-4">
              <div class="col-md-7">
                <div class="row g-3">
                  <div class="col-sm-6">
                    <label class="form-label" for="coName"><span data-i18n="form.name"></span> <span class="req">*</span></label>
                    <input class="form-control sun-input" id="coName" name="name" autocomplete="name" required>
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label" for="coPhone"><span data-i18n="form.phone"></span> <span class="req">*</span></label>
                    <input class="form-control sun-input" id="coPhone" name="phone" type="tel" dir="ltr" autocomplete="tel" pattern="[0-9+ ]{8,}" required>
                  </div>
                  <div class="col-12">
                    <span class="form-label d-block" data-i18n="co.method"></span>
                    <div class="pill-group">
                      <input type="radio" class="btn-check" name="method" id="m-delivery" value="delivery" checked><label class="pill-choice" for="m-delivery"><i class="fa-solid fa-truck" aria-hidden="true"></i> <span data-i18n="co.delivery"></span></label>
                      <input type="radio" class="btn-check" name="method" id="m-pickup" value="pickup"><label class="pill-choice" for="m-pickup"><i class="fa-solid fa-store" aria-hidden="true"></i> <span data-i18n="co.pickup"></span></label>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="form-check form-switch gift-switch">
                      <input class="form-check-input" type="checkbox" id="coGift" name="gift">
                      <label class="form-check-label" for="coGift">🎁 <strong data-i18n="gift.toggle"></strong> <small data-i18n="gift.hint"></small></label>
                    </div>
                  </div>
                  <div class="col-12 gift-box" id="coGiftBox" hidden>
                    <div class="row g-3">
                      <div class="col-sm-6">
                        <label class="form-label" for="coGiftName"><span data-i18n="gift.name"></span> <span class="req">*</span></label>
                        <input class="form-control sun-input" id="coGiftName" name="giftName">
                      </div>
                      <div class="col-sm-6">
                        <label class="form-label" for="coGiftPhone"><span data-i18n="gift.phone"></span> <span class="req">*</span></label>
                        <input class="form-control sun-input" id="coGiftPhone" name="giftPhone" type="tel" dir="ltr" pattern="[0-9+ ]{8,}">
                      </div>
                      <div class="col-12">
                        <label class="form-label" for="coGiftCard" data-i18n="gift.card"></label>
                        <textarea class="form-control sun-input gift-card-input" id="coGiftCard" name="giftCard" rows="2" maxlength="160" data-i18n-placeholder="gift.cardPh"></textarea>
                      </div>
                    </div>
                  </div>
                  <div class="col-12" id="coAddressWrap">
                    <label class="form-label" for="coAddress"><span data-i18n="co.address"></span> <span class="req">*</span></label>
                    <input class="form-control sun-input" id="coAddress" name="address" autocomplete="street-address" required>
                  </div>
                  <div class="col-12">
                    <span class="form-label d-block" data-i18n="co.payment"></span>
                    <div class="pill-group">${payments}</div>
                  </div>
                  <div class="col-12">
                    <label class="form-label" for="coNotes" data-i18n="co.notes"></label>
                    <textarea class="form-control sun-input" id="coNotes" name="notes" rows="2"></textarea>
                  </div>
                </div>
              </div>
              <div class="col-md-5">
                <div class="co-summary">
                  <p class="side-label" data-i18n="co.summary"></p>
                  <ul id="coItems"></ul>
                  <div class="co-discount" id="coDiscountRow" hidden><span id="coDiscountLabel"></span><strong id="coDiscount"></strong></div>
                  <div class="co-total"><span data-i18n="cart.total"></span><strong id="coTotal"></strong></div>
                  <p class="co-hint" id="coHint"></p>
                  <button type="submit" class="btn-whatsapp w-100"><i class="fab fa-whatsapp" aria-hidden="true"></i> <span data-i18n="co.send"></span></button>
                  <p class="co-note" data-i18n="co.note"></p>
                </div>
              </div>
            </div>
          </form>

          <div class="contact-success" id="coSuccess" hidden>
            <span class="success-icon"><i class="fa-solid fa-check" aria-hidden="true"></i></span>
            <h2 data-i18n="co.doneTitle"></h2>
            <p><span data-i18n="co.orderNo"></span> <strong id="coOrderNo"></strong></p>
            <p data-i18n="co.doneText"></p>
            <div class="co-done-actions">
              <a class="btn-whatsapp" id="coReopen" href="#" target="_blank" rel="noopener"><i class="fab fa-whatsapp" aria-hidden="true"></i> <span data-i18n="co.reopen"></span></a>
              <a class="btn-outline-sun" id="coTrack" href="track.html"><i class="fa-solid fa-truck-fast" aria-hidden="true"></i> <span data-i18n="track.cta"></span></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function orderLines() {
  const lines = Object.entries(store.cart)
    .filter(([id]) => store.product(id))
    .map(([id, qty]) => ({ text: `${qty} × ${productName(id)}`, price: store.product(id).price * qty }));
  store.sets.forEach((set) => {
    const names = Object.entries(set.items).map(([role, id]) => `${t(`family.${role}`)}: ${productName(id)}`).join(" · ");
    lines.push({ text: `${t("family.title")} (−${FAMILY_DISCOUNT}%): ${names}`, price: familyPrice(set) });
  });
  store.customs.forEach((pair) => {
    lines.push({ text: `${t("design.customPair")}: ${designSummary(pair.cfg).join(" · ")}`, price: designPrice(pair.cfg) });
  });
  return lines;
}

function buildWhatsAppMessage(form, orderNo) {
  const data = new FormData(form);
  const delivery = data.get("method") === "delivery";
  const rows = [
    `🕶️ *${t("co.waTitle")}* — ${orderNo}`,
    "",
    `👤 ${t("form.name")}: ${data.get("name")}`,
    `📞 ${t("form.phone")}: ${data.get("phone")}`,
    `${delivery ? "🚚" : "🏪"} ${t(delivery ? "co.delivery" : "co.pickup")}${delivery ? `: ${data.get("address")}` : ""}`,
    ...(data.get("gift")
      ? [
          `🎁 *${t("gift.toggle")}*`,
          `   ${t("gift.name")}: ${data.get("giftName")} — ${data.get("giftPhone")}`,
          ...(data.get("giftCard").trim() ? [`   💌 ${t("gift.card")}: “${data.get("giftCard").trim()}”`] : []),
        ]
      : []),
    `💳 ${t("co.payment")}: ${t(`co.pay.${data.get("payment")}`)}`,
    "",
    ...orderLines().map((line) => `• ${line.text} — ${formatPrice(line.price)}`),
    "",
    ...(store.coupon ? [`🏷️ ${fill(t("promo.label"), { code: store.coupon, p: COUPONS[store.coupon] })}: −${formatPrice(store.discount())}`] : []),
    `*${t("cart.total")}: ${formatPrice(store.total())}*`,
    "",
    `📦 ${t("track.waLine")} ${trackUrl(orderNo)}`,
  ];
  if (data.get("notes").trim()) rows.push("", `📝 ${t("co.notes")}: ${data.get("notes").trim()}`);
  return rows.join("\n");
}

function initCheckout() {
  document.body.insertAdjacentHTML("beforeend", checkoutTemplate());
  const modalEl = document.getElementById("checkoutModal");
  const form = document.getElementById("checkoutForm");
  const success = document.getElementById("coSuccess");
  const addressWrap = document.getElementById("coAddressWrap");
  const address = document.getElementById("coAddress");

  function fillSummary() {
    document.getElementById("coItems").innerHTML = orderLines()
      .map((line) => `<li><span>${escapeHtml(line.text)}</span><strong>${formatPrice(line.price)}</strong></li>`)
      .join("");
    const discountRow = document.getElementById("coDiscountRow");
    discountRow.hidden = !store.coupon;
    if (store.coupon) {
      document.getElementById("coDiscountLabel").textContent = fill(t("promo.label"), { code: store.coupon, p: COUPONS[store.coupon] });
      document.getElementById("coDiscount").textContent = `−${formatPrice(store.discount())}`;
    }
    document.getElementById("coTotal").textContent = formatPrice(store.total());
    const rxPhoto = store.customs.some((pair) => pair.cfg.rx && pair.cfg.rx.mode === "photo");
    document.getElementById("coHint").textContent = `${t(store.customs.length ? "co.hintCustom" : "co.hint")}${rxPhoto ? ` ${t("rx.sendPhoto")}` : ""}`;
  }

  function setGift(gift) {
    document.getElementById("coGiftBox").hidden = !gift;
    document.getElementById("coGiftName").required = gift;
    document.getElementById("coGiftPhone").required = gift;
    // A gift is always delivered to the recipient.
    if (gift) {
      document.getElementById("m-delivery").checked = true;
      addressWrap.hidden = false;
      address.required = true;
    }
    document.getElementById("m-pickup").disabled = gift;
  }

  form.addEventListener("change", (event) => {
    if (event.target.name === "gift") setGift(event.target.checked);
    if (event.target.name === "method") {
      const delivery = event.target.value === "delivery";
      addressWrap.hidden = !delivery;
      address.required = delivery;
    }
  });

  document.getElementById("cartCheckout").addEventListener("click", () => {
    if (!store.count()) return;
    form.hidden = false;
    success.hidden = true;
    fillSummary();
    const drawer = bootstrap.Offcanvas.getInstance(document.getElementById("cartDrawer"));
    if (drawer) drawer.hide();
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const orderNo = `SP-${Date.now().toString(36).slice(-5).toUpperCase()}`;
    const url = `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(buildWhatsAppMessage(form, orderNo))}`;
    window.open(url, "_blank", "noopener");

    writeJson(STORAGE.lastOrder, { cart: { ...store.cart }, customs: store.customs.map((pair) => pair.cfg), sets: store.sets.map((set) => set.items) });
    rememberMyOrder(orderNo, store.total());
    store.checkout();
    refreshStore();
    document.getElementById("coOrderNo").textContent = orderNo;
    document.getElementById("coReopen").href = url;
    document.getElementById("coTrack").href = `track.html?order=${encodeURIComponent(orderNo)}`;
    form.hidden = true;
    success.hidden = false;
    form.reset();
    addressWrap.hidden = false;
    address.required = true;
    setGift(false);
  });

  document.addEventListener("sun:languagechange", () => {
    if (modalEl.classList.contains("show") && !form.hidden) fillSummary();
  });
}
