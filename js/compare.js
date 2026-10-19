
"use strict";

const COMPARE_KEY = "sunpalm-compare";
const COMPARE_MAX = 3;

function compareList() {
  try {
    const list = JSON.parse(readSetting(COMPARE_KEY, "[]"));
    return Array.isArray(list) ? list.filter((id) => store.product(id)).slice(0, COMPARE_MAX) : [];
  } catch (error) {
    return [];
  }
}

function saveCompare(list) {
  saveSetting(COMPARE_KEY, list.length ? JSON.stringify(list) : null);
}

function compareTemplate() {
  return `
  <div class="compare-bar" id="compareBar" hidden>
    <div class="compare-thumbs" id="compareThumbs"></div>
    <p class="compare-hint" id="compareHint"></p>
    <button type="button" class="btn-sun btn-sm-sun" id="compareOpen"><i class="fa-solid fa-scale-balanced" aria-hidden="true"></i> <span data-i18n="compare.open"></span></button>
    <button type="button" class="compare-clear" id="compareClear" data-i18n-aria="compare.clear"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
  </div>
  <div class="modal fade" id="compareModal" tabindex="-1" aria-labelledby="compareTitle" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
      <div class="modal-content sun-modal">
        <div class="modal-head checkout-head">
          <h5 class="modal-title" id="compareTitle"><i class="fa-solid fa-scale-balanced" aria-hidden="true"></i> <span data-i18n="compare.title"></span></h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" data-i18n-aria="modal.close"></button>
        </div>
        <div class="modal-body"><div class="compare-grid" id="compareGrid"></div></div>
      </div>
    </div>
  </div>`;
}

function compareColumnHtml(product, best) {
  const faces = Object.keys(FACE_FIT).filter((face) => FACE_FIT[face].includes(product.shape)).map((face) => t(`face.${face}`));
  const sale = salePercent(product);
  const rows = [
    ["spec.price", `<strong class="cmp-price">${formatPrice(product.price)}</strong>${product.was ? ` <del>${formatPrice(product.was)}</del>` : ""}${product.id === best ? ` <span class="cmp-best">${t("compare.best")}</span>` : ""}`],
    ["spec.discount", sale ? `<span class="cmp-sale">−${sale}%</span>` : "—"],
    ["spec.collection", t(`cat.${product.category}`)],
    ["spec.shape", t(`shape.${product.shape}`)],
    ["spec.material", t(`material.${product.material}`)],
    ["spec.lens", product.polarized ? `<span class="cmp-yes"><i class="fa-solid fa-check" aria-hidden="true"></i> ${t("spec.polarized")}</span>` : t("spec.uv400")],
    ["spec.suits", faces.join(getLang() === "ar" ? "، " : ", ")],
    ["spec.stock", '<span class="stock-badge static" data-stock-badge></span>'],
  ];
  return `
    <div class="compare-col" data-product="${product.id}">
      <button type="button" class="compare-remove" data-compare-remove aria-label="${t("cart.remove")}"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
      <img src="${product.img}" alt="" class="compare-img">
      <h3>${productName(product.id)}</h3>
      <dl>${rows.map(([key, value]) => `<div><dt>${t(key)}</dt><dd>${value}</dd></div>`).join("")}</dl>
      <button type="button" class="btn-sun btn-sm-sun w-100 justify-content-center" data-add-to-cart><i class="fa-solid fa-cart-plus" aria-hidden="true"></i> <span>${t("cart.add")}</span></button>
      <button type="button" class="btn-notify w-100" data-notify hidden><i class="fa-regular fa-bell" aria-hidden="true"></i> <span>${t("notify.button")}</span></button>
    </div>`;
}

function renderCompare() {
  const list = compareList();
  const bar = document.getElementById("compareBar");
  bar.hidden = list.length === 0;
  document.body.classList.toggle("has-compare", list.length > 0);
  document.getElementById("compareThumbs").innerHTML = list
    .map((id) => `<img src="${store.product(id).img}" alt="${productName(id)}" title="${productName(id)}">`)
    .join("") + Array.from({ length: COMPARE_MAX - list.length }, () => '<span class="compare-slot"><i class="fa-solid fa-plus" aria-hidden="true"></i></span>').join("");
  document.getElementById("compareHint").textContent = list.length < 2 ? t("compare.needTwo") : fill(t("compare.count"), { n: list.length, max: COMPARE_MAX });
  document.getElementById("compareOpen").disabled = list.length < 2;

  document.querySelectorAll("[data-compare]").forEach((button) => {
    const on = list.includes(button.closest("[data-product]").dataset.product);
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", String(on));
  });

  if (document.getElementById("compareModal").classList.contains("show")) fillCompareGrid();
}

function fillCompareGrid() {
  const list = compareList();
  const grid = document.getElementById("compareGrid");
  // The cheapest pair gets a "Best price" tag.
  const best = [...list].sort((a, b) => store.product(a).price - store.product(b).price)[0];
  grid.style.setProperty("--cols", list.length);
  grid.innerHTML = list.map((id) => compareColumnHtml(store.product(id), best)).join("");
  renderStockBadges();
  if (list.length < 2) bootstrap.Modal.getOrCreateInstance(document.getElementById("compareModal")).hide();
}

function initCompare() {
  document.body.insertAdjacentHTML("beforeend", compareTemplate());
  const modal = document.getElementById("compareModal");

  document.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-compare]");
    const remove = event.target.closest("[data-compare-remove]");
    if (!toggle && !remove) return;
    const id = (toggle || remove).closest("[data-product]").dataset.product;
    let list = compareList();
    if (list.includes(id)) {
      list = list.filter((c) => c !== id);
    } else if (list.length >= COMPARE_MAX) {
      showToast(fill(t("compare.full"), { max: COMPARE_MAX }));
      return;
    } else {
      list.push(id);
      showToast(t("compare.added"));
    }
    saveCompare(list);
    renderCompare();
  });

  document.getElementById("compareOpen").addEventListener("click", () => bootstrap.Modal.getOrCreateInstance(modal).show());
  document.getElementById("compareClear").addEventListener("click", () => {
    saveCompare([]);
    renderCompare();
  });
  modal.addEventListener("show.bs.modal", fillCompareGrid);
  document.addEventListener("sun:languagechange", renderCompare);
  document.addEventListener("sun:storechange", () => {
    if (modal.classList.contains("show")) renderCompare();
  });
  renderCompare();
}
