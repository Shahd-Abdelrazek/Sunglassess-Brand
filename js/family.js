
"use strict";

function initFamily() {
  const box = document.getElementById("familyBuilder");
  if (!box) return;
  const choice = { dad: null, mom: null, kid: null };

  function render() {
    box.querySelectorAll("[data-role]").forEach((row) => {
      const role = row.dataset.role;
      const options = PRODUCTS.filter((p) => p.category === FAMILY_ROLES[role]);
      // Forget a choice that has just sold out.
      if (choice[role] && store.available(choice[role]) === 0) choice[role] = null;
      row.querySelector(".family-options").innerHTML = options
        .map((p) => {
          const out = store.available(p.id) === 0;
          const on = choice[role] === p.id;
          return `
          <button type="button" class="family-opt${on ? " active" : ""}" data-pick="${p.id}" aria-pressed="${on}" ${out ? "disabled" : ""}>
            <img src="${p.img}" alt="" loading="lazy">
            <span class="family-opt-name">${productName(p.id)}</span>
            <span class="family-opt-price">${out ? t("cart.out") : formatPrice(p.price)}</span>
            <span class="opt-check"><i class="fa-solid fa-check" aria-hidden="true"></i></span>
          </button>`;
        })
        .join("");
    });

    const picked = Object.values(choice).filter(Boolean);
    const complete = picked.length === 3;
    const set = { items: { ...choice } };
    const full = picked.reduce((sum, id) => sum + store.product(id).price, 0);
    document.getElementById("familyThumbs").innerHTML = Object.entries(choice)
      .map(([role, id]) => (id ? `<img src="${store.product(id).img}" alt="${t(`family.${role}`)}">` : `<span class="family-empty">${t(`family.${role}`)}</span>`))
      .join("");
    document.getElementById("familyFull").textContent = full ? formatPrice(full) : "—";
    document.getElementById("familyPrice").textContent = complete ? formatPrice(familyPrice(set)) : "—";
    document.getElementById("familySave").textContent = complete ? fill(t("family.save"), { amount: formatPrice(full - familyPrice(set)) }) : fill(t("family.pickMore"), { n: 3 - picked.length });
    document.getElementById("familyAdd").disabled = !complete;
  }

  box.addEventListener("click", (event) => {
    const option = event.target.closest("[data-pick]");
    if (!option || option.disabled) return;
    const role = option.closest("[data-role]").dataset.role;
    choice[role] = choice[role] === option.dataset.pick ? null : option.dataset.pick;
    render();
  });

  document.getElementById("familyAdd").addEventListener("click", () => {
    if (!Object.values(choice).every((id) => id && store.available(id) > 0)) return;
    store.addSet({ ...choice });
    flyToCart(document.getElementById("familyThumbs").querySelector("img"));
    window.setTimeout(bumpCartIcon, 650);
    refreshStore();
    showToast(t("family.added"));
    Object.keys(choice).forEach((role) => { choice[role] = null; });
    render();
  });

  document.addEventListener("sun:storechange", render);
  document.addEventListener("sun:languagechange", render);
  render();
}
