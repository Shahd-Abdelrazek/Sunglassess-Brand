
"use strict";

const LOGO = "images/logo.png";
const WISHLIST_KEY = "sunpalm-wishlist";
const FACE_KEY = "sunpalm-face";
const THEME_KEY = "sunpalm-theme";

const NAV_PAGES = [
  { page: "home", href: "index.html", key: "nav.home", icon: "fa-house" },
  { page: "shop", href: "shop.html", key: "nav.shop", icon: "fa-glasses", dropdown: true },
  { page: "designer", href: "designer.html", key: "nav.designer", icon: "fa-wand-magic-sparkles", highlight: true },
  { page: "about", group: "about", href: "about.html", key: "nav.about", icon: "fa-sun" },
  { page: "news", group: "about", href: "news.html", key: "nav.news", icon: "fa-newspaper" },
  { page: "reviews", href: "reviews.html", key: "nav.reviews", icon: "fa-star" },
  { page: "contact", href: "contact.html", key: "nav.contact", icon: "fa-envelope" },
];

// ---------- Wishlist (saved in this browser) ----------

function wishlist() {
  try {
    const list = JSON.parse(readSetting(WISHLIST_KEY, "[]"));
    return Array.isArray(list) ? list.filter((id) => store.product(id)) : [];
  } catch (error) {
    return [];
  }
}

function toggleWish(id) {
  const list = wishlist();
  const adding = !list.includes(id);
  saveSetting(WISHLIST_KEY, JSON.stringify(adding ? [...list, id] : list.filter((w) => w !== id)));
  document.dispatchEvent(new CustomEvent("sun:wishlistchange"));
  return adding;
}

function renderWishButtons() {
  const list = wishlist();
  document.querySelectorAll("[data-wish]").forEach((button) => {
    const on = list.includes(button.closest("[data-product]").dataset.product);
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", String(on));
    button.dataset.i18nAria = on ? "wish.remove" : "wish.add";
    button.setAttribute("aria-label", t(button.dataset.i18nAria));
  });
  document.querySelectorAll("[data-wish-count]").forEach((badge) => {
    badge.textContent = list.length;
    badge.hidden = list.length === 0;
  });
}

// ---------- Templates ----------

function headerTemplate(currentPage) {
  const aboutPages = NAV_PAGES.filter((item) => item.group === "about");
  const links = NAV_PAGES.map((item) => {
    // The lens lab lives under the Shop menu.
    const active = item.page === currentPage || (item.dropdown && currentPage === "lenses") ? " active" : "";
    const current = item.page === currentPage ? ' aria-current="page"' : "";
    // About and News share one dropdown, rendered where the first of them sits.
    if (item.group === "about") {
      if (item !== aboutPages[0]) return "";
      const inAbout = aboutPages.some((p) => p.page === currentPage);
      const aboutLinks = aboutPages
        .map((p) => `<li><a class="dropdown-item${p.page === currentPage ? " active" : ""}" href="${p.href}"><i class="fa-solid ${p.icon} me-2" aria-hidden="true"></i><span data-i18n="${p.key}"></span></a></li>`)
        .join("");
      return `
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle${inAbout ? " active" : ""}" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"><span data-i18n="nav.aboutGroup"></span></a>
        <ul class="dropdown-menu sun-dropdown">${aboutLinks}
          <li><a class="dropdown-item" href="about.html#careers"><i class="fa-solid fa-briefcase me-2" aria-hidden="true"></i><span data-i18n="nav.careers"></span></a></li>
        </ul>
      </li>`;
    }
    if (!item.dropdown) {
      const highlight = item.highlight ? " nav-cta" : "";
      const icon = item.highlight ? `<i class="fa-solid ${item.icon}" aria-hidden="true"></i> ` : "";
      return `<li class="nav-item"><a class="nav-link${active}${highlight}" href="${item.href}"${current}>${icon}<span data-i18n="${item.key}"></span></a></li>`;
    }
    const categoryLinks = CATEGORIES.map((cat) => `<li><a class="dropdown-item" href="shop.html#${cat}" data-i18n="cat.${cat}"></a></li>`).join("");
    return `
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle${active}" href="${item.href}" role="button" data-bs-toggle="dropdown" aria-expanded="false"${current}><span data-i18n="${item.key}"></span></a>
        <ul class="dropdown-menu sun-dropdown">
          ${categoryLinks}
          <li><hr class="dropdown-divider"></li>
          <li><button type="button" class="dropdown-item accent-link" data-quiz-open><i class="fa-solid fa-wand-sparkles me-2" aria-hidden="true"></i><span data-i18n="quiz.title"></span></button></li>
          <li><a class="dropdown-item accent-link" href="shop.html?finder=1"><i class="fa-solid fa-face-smile me-2" aria-hidden="true"></i><span data-i18n="finder.title"></span></a></li>
          <li><a class="dropdown-item accent-link" href="lenses.html"><i class="fa-solid fa-circle-half-stroke me-2" aria-hidden="true"></i><span data-i18n="lab.nav"></span></a></li>
          <li><a class="dropdown-item accent-link" href="shop.html#family"><i class="fa-solid fa-people-roof me-2" aria-hidden="true"></i><span data-i18n="family.title"></span></a></li>
          <li><a class="dropdown-item sale-link" href="shop.html?sale=1"><i class="fa-solid fa-tags me-2" aria-hidden="true"></i><span data-i18n="shop.onSale"></span></a></li>
          <li><a class="dropdown-item fw-bold" href="shop.html" data-i18n="nav.allProducts"></a></li>
        </ul>
      </li>`;
  }).join("");

  const languageItems = Object.entries(LANGUAGES)
    .map(([code, info]) => `<li><button class="dropdown-item lang-option" type="button" data-set-lang="${code}" lang="${code}"><span class="lang-code">${code.toUpperCase()}</span>${info.label}</button></li>`)
    .join("");

  return `
  <nav class="navbar navbar-expand-xl sun-nav" id="mainNav">
    <div class="promo-bar" id="promoBar">
      <p><i class="fa-solid fa-bolt" aria-hidden="true"></i> <span data-i18n="promo.bar"></span> <a href="shop.html?sale=1" data-i18n="promo.shopNow"></a></p>
    </div>
    <div class="container">
      <a class="navbar-brand brand" href="index.html">
        <img src="${LOGO}" alt="" class="brand-logo">
        <span class="brand-name">${SHOP.brand}</span>
      </a>

      <div class="d-flex align-items-center gap-2 order-xl-3">
        <div class="dropdown">
          <button class="icon-btn lang-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-i18n-aria="nav.language">
            <i class="fa-solid fa-globe" aria-hidden="true"></i>
            <span class="lang-current" data-lang-current></span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end sun-dropdown lang-menu">${languageItems}</ul>
        </div>
        <button class="icon-btn theme-btn d-none d-sm-inline-flex" type="button" data-theme-toggle data-i18n-aria="theme.toggle">
          <i class="fa-solid fa-moon" aria-hidden="true"></i><i class="fa-solid fa-sun" aria-hidden="true"></i>
        </button>
        <button class="icon-btn" type="button" data-bs-toggle="collapse" data-bs-target="#searchPanel" aria-expanded="false" aria-controls="searchPanel" data-i18n-aria="nav.search">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        </button>
        <a class="icon-btn wish-btn d-none d-sm-inline-flex" href="shop.html?wishlist=1" data-i18n-aria="wish.mine">
          <i class="fa-regular fa-heart" aria-hidden="true"></i>
          <span class="cart-badge" data-wish-count hidden>0</span>
        </a>
        <button class="icon-btn cart-btn" type="button" data-bs-toggle="offcanvas" data-bs-target="#cartDrawer" aria-controls="cartDrawer" data-i18n-aria="cart.open">
          <i class="fa-solid fa-bag-shopping" aria-hidden="true"></i>
          <span class="cart-badge" data-cart-count hidden>0</span>
        </button>
        <button class="icon-btn d-none d-sm-inline-flex" type="button" data-bs-toggle="modal" data-bs-target="#loginModal" data-i18n-aria="nav.login">
          <i class="fa-regular fa-user" aria-hidden="true"></i>
        </button>
        <button class="navbar-toggler icon-btn" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain" aria-controls="navbarMain" aria-expanded="false" data-i18n-aria="nav.menu">
          <i class="fa-solid fa-bars" aria-hidden="true"></i>
        </button>
      </div>

      <div class="collapse navbar-collapse order-xl-2" id="navbarMain">
        <ul class="navbar-nav mx-xl-auto mb-0">${links}
          <li class="nav-item d-sm-none"><a class="nav-link" href="shop.html?wishlist=1"><i class="fa-regular fa-heart me-2" aria-hidden="true"></i><span data-i18n="wish.mine"></span></a></li>
          <li class="nav-item d-sm-none"><a class="nav-link theme-btn" href="#" data-theme-toggle><i class="fa-solid fa-moon me-2" aria-hidden="true"></i><i class="fa-solid fa-sun me-2" aria-hidden="true"></i><span data-i18n="theme.toggle"></span></a></li>
          <li class="nav-item d-sm-none"><a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#loginModal"><i class="fa-regular fa-user me-2" aria-hidden="true"></i><span data-i18n="nav.login"></span></a></li>
        </ul>
      </div>
    </div>
    <div class="collapse search-panel" id="searchPanel">
      <div class="container">
        <form class="sun-search" id="searchForm" role="search" action="shop.html">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input type="search" name="q" id="siteSearch" data-i18n-placeholder="nav.searchPh" data-i18n-aria="nav.search">
          <button type="submit" class="btn-sun btn-sm-sun" data-i18n="nav.search"></button>
        </form>
      </div>
    </div>
  </nav>

  <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content sun-modal">
        <div class="modal-head">
          <img src="${LOGO}" alt="" class="login-logo">
          <h5 class="modal-title" id="loginModalLabel" data-i18n="nav.login"></h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" data-i18n-aria="modal.close"></button>
        </div>
        <div class="modal-body">
          <form id="loginForm">
            <div class="mb-3">
              <label for="emailInput" class="form-label" data-i18n="form.email"></label>
              <input type="email" class="form-control sun-input" id="emailInput" required>
              <div class="form-text" data-i18n="login.never"></div>
            </div>
            <div class="mb-3">
              <label for="passwordInput" class="form-label" data-i18n="login.password"></label>
              <input type="password" class="form-control sun-input" id="passwordInput" required>
            </div>
            <div class="form-check form-switch mb-4">
              <input class="form-check-input" type="checkbox" id="rememberMe">
              <label class="form-check-label" for="rememberMe" data-i18n="login.remember"></label>
            </div>
            <button type="submit" class="btn-sun w-100 justify-content-center" data-i18n="nav.login"></button>
          </form>
        </div>
      </div>
    </div>
  </div>

  <div class="sun-toast" id="sunToast" role="status" aria-live="polite"></div>`;
}

function quickViewTemplate() {
  return `
  <div class="modal fade" id="quickView" tabindex="-1" aria-labelledby="quickViewTitle" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content sun-modal item-modal">
        <button type="button" class="btn-close item-modal-close" data-bs-dismiss="modal" data-i18n-aria="modal.close"></button>
        <div class="row g-0 item-modal-content" data-product="">
          <div class="col-md-5 position-relative"><img class="item-modal-img" src="${PRODUCTS[0].img}" alt=""><span class="sale-badge" data-sale hidden></span></div>
          <div class="col-md-7 item-modal-text">
            <p class="kicker" data-qv-cat></p>
            <h3 id="quickViewTitle" data-qv-name></h3>
            <div class="price-row start"><p class="price-tag big" data-price></p><del class="was-price" data-was></del></div>
            <ul class="spec-list" data-qv-specs></ul>
            <p class="fit-line" data-qv-fit></p>
            <p class="qv-desc" data-qv-desc></p>
            <span class="stock-badge static" data-stock-badge></span>
            <div class="product-actions mt-3">
              <button type="button" class="btn-sun" data-add-to-cart><i class="fa-solid fa-cart-plus" aria-hidden="true"></i> <span data-i18n="cart.add"></span></button>
              <button type="button" class="btn-notify" data-notify hidden><i class="fa-regular fa-bell" aria-hidden="true"></i> <span data-i18n="notify.button"></span></button>
              <a class="btn-outline-sun" data-qv-tryon href="designer.html#tryon"><i class="fa-solid fa-camera" aria-hidden="true"></i> <span data-i18n="tryon.cta"></span></a>
              <a class="btn-outline-sun" data-qv-3d href="designer.html?view=3d"><i class="fa-solid fa-cube" aria-hidden="true"></i> <span data-i18n="view3d.cta"></span></a>
              <button type="button" class="icon-round" data-wish aria-pressed="false" data-i18n-aria="wish.add"><i class="fa-regular fa-heart" aria-hidden="true"></i><i class="fa-solid fa-heart" aria-hidden="true"></i></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function footerTemplate() {
  const pageLinks = NAV_PAGES.map((item) => `<li><a href="${item.href}"><i class="fa-solid ${item.icon}" aria-hidden="true"></i><span data-i18n="${item.key}"></span></a></li>`).join("");
  const shopLinks = CATEGORIES.map((cat) => `<li><a href="shop.html#${cat}"><i class="fa-solid fa-chevron-right flip-rtl" aria-hidden="true"></i><span data-i18n="cat.${cat}"></span></a></li>`).join("");

  return `
  <div class="footer-news">
    <div class="container">
      <div class="newsletter">
        <div>
          <h2 data-i18n="news.letterTitle"></h2>
          <p data-i18n="news.letterText"></p>
        </div>
        <form class="newsletter-form" id="newsletterForm">
          <input type="email" required autocomplete="email" data-i18n-placeholder="news.letterPh" data-i18n-aria="news.letterPh">
          <button type="submit" class="btn-sun"><span data-i18n="news.subscribe"></span> <i class="fa-solid fa-paper-plane flip-rtl" aria-hidden="true"></i></button>
        </form>
        <p class="newsletter-done" id="newsletterDone" hidden></p>
      </div>
    </div>
  </div>
  <div class="footer-body">
    <div class="container">
      <div class="row g-4 gy-5">
        <div class="col-lg-4">
          <a class="brand footer-brand" href="index.html">
            <img src="${LOGO}" alt="" class="brand-logo">
            <span class="brand-name">${SHOP.brand}</span>
          </a>
          <p class="footer-tagline" data-i18n="footer.tagline"></p>
          <div class="social-row">
            <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f" aria-hidden="true"></i></a>
            <a href="#" aria-label="Instagram"><i class="fab fa-instagram" aria-hidden="true"></i></a>
            <a href="#" aria-label="TikTok"><i class="fab fa-tiktok" aria-hidden="true"></i></a>
            <a href="#" data-wa-link target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp" aria-hidden="true"></i></a>
            <a href="#" aria-label="YouTube"><i class="fab fa-youtube" aria-hidden="true"></i></a>
          </div>
        </div>
        <div class="col-6 col-lg-2">
          <h6 class="footer-title" data-i18n="footer.shop"></h6>
          <ul class="footer-list">${shopLinks}</ul>
        </div>
        <div class="col-6 col-lg-3">
          <h6 class="footer-title" data-i18n="footer.pages"></h6>
          <ul class="footer-list">${pageLinks}
            <li><a href="track.html"><i class="fa-solid fa-truck-fast" aria-hidden="true"></i><span data-i18n="track.cta"></span></a></li>
          </ul>
        </div>
        <div class="col-lg-3">
          <h6 class="footer-title" data-i18n="footer.help"></h6>
          <ul class="footer-list">
            <li><a href="contact.html#faq"><i class="fa-solid fa-circle-question" aria-hidden="true"></i><span data-i18n="faq.title"></span></a></li>
            <li><a href="about.html#privacy"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i><span data-i18n="about.privacyTitle"></span></a></li>
            <li><i class="fa-solid fa-phone" aria-hidden="true"></i><bdi>+20 100 000 0000</bdi></li>
            <li><i class="fa-solid fa-envelope" aria-hidden="true"></i><bdi>hello@sunpalm.example</bdi></li>
          </ul>
          <img src="images/badge-quality.png" alt="" class="footer-badge" loading="lazy">
        </div>
      </div>
    </div>
  </div>
  <div class="footer-bottom"><p>© <span data-year></span> ${SHOP.brand} · <span data-i18n="footer.rights"></span></p></div>`;
}

function showToast(message) {
  const toast = document.getElementById("sunToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

// A "try it on" link that opens the designer with a pair close to this product.
function tryOnHref(product) {
  const frame = { metal: "gold", acetate: "black", tr90: "rose" }[product.material] || "black";
  const lens = product.polarized ? "green" : "smoke";
  const size = product.category === "kids" ? "kids" : "medium";
  return `designer.html?shape=${product.shape}&frame=${frame}&lens=${lens}&size=${size}#tryon`;
}

// One product card (shop grid and home page rows).
function productCardHtml(product) {
  const sale = salePercent(product);
  return `
    <article class="product-card" data-product="${product.id}" data-category="${product.category}">
      <div class="product-img">
        <img src="${product.img}" alt="${escapeHtml(productName(product.id, "en"))}" loading="lazy">
        ${sale ? `<span class="sale-badge">−${sale}%</span>` : ""}
        <span class="fit-ribbon" data-fit hidden><i class="fa-solid fa-check" aria-hidden="true"></i> <span data-i18n="finder.suits"></span></span>
        <span class="stock-badge" data-stock-badge></span>
        <div class="product-tools">
          <button type="button" class="icon-round" data-wish aria-pressed="false" data-i18n-aria="wish.add"><i class="fa-regular fa-heart" aria-hidden="true"></i><i class="fa-solid fa-heart" aria-hidden="true"></i></button>
          <button type="button" class="icon-round" data-bs-toggle="modal" data-bs-target="#quickView" data-i18n-aria="shop.quickView"><i class="fa-solid fa-magnifying-glass-plus" aria-hidden="true"></i></button>
          <a class="icon-round" href="${tryOnHref(product)}" data-i18n-aria="tryon.cta"><i class="fa-solid fa-camera" aria-hidden="true"></i></a>
          <button type="button" class="icon-round" data-compare aria-pressed="false" data-i18n-aria="compare.add"><i class="fa-solid fa-scale-balanced" aria-hidden="true"></i></button>
        </div>
      </div>
      <div class="product-body">
        <p class="product-meta"><span data-i18n="cat.${product.category}"></span> · <span data-i18n="shape.${product.shape}"></span>${product.polarized ? ' · <span class="pol-tag" data-i18n="spec.polarizedShort"></span>' : ""}</p>
        <h3 data-i18n="prod.${product.id}"></h3>
        <div class="price-row"><p class="price-tag" data-price></p><del class="was-price" data-was></del></div>
        <button type="button" class="btn-sun btn-sm-sun w-100 justify-content-center" data-add-to-cart><i class="fa-solid fa-cart-plus" aria-hidden="true"></i> <span data-i18n="cart.add"></span></button>
        <button type="button" class="btn-notify w-100" data-notify hidden><i class="fa-regular fa-bell" aria-hidden="true"></i> <span data-i18n="notify.button"></span></button>
      </div>
    </article>`;
}

// ---------- Start ----------

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page || "home";

  const header = document.getElementById("site-header");
  if (header) header.innerHTML = headerTemplate(page);
  const footer = document.getElementById("site-footer");
  if (footer) footer.innerHTML = footerTemplate();
  document.body.insertAdjacentHTML("beforeend", quickViewTemplate());
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  document.querySelectorAll("[data-wa-link]").forEach((el) => { el.href = `https://wa.me/${SHOP.whatsapp}`; });

  initStore();
  initChatbot();
  initCompare();
  initQuiz();
  applyLanguage(getLang());

  // Light / dark mode: follows the device until the visitor picks one, then remembers it.
  function setTheme(theme, remember) {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0d1a1d" : "#0f9292");
    if (remember) saveSetting(THEME_KEY, theme);
  }
  setTheme(document.documentElement.getAttribute("data-theme") || "light", false);
  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-theme-toggle]")) return;
    event.preventDefault();
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    setTheme(next, true);
    showToast(t(next === "dark" ? "theme.dark" : "theme.light"));
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
    if (!readSetting(THEME_KEY, "")) setTheme(event.matches ? "dark" : "light", false);
  });

  // Language switcher
  document.addEventListener("click", (event) => {
    const option = event.target.closest("[data-set-lang]");
    if (option) applyLanguage(option.dataset.setLang);
  });

  // Navbar gets a solid background (and hides the promo strip) once the page is scrolled.
  const nav = document.getElementById("mainNav");
  const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 30);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Fade sections in as they enter the screen.
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("visible"));
  }

  // Demo login validation. This does not authenticate against a real server.
  const loginForm = document.getElementById("loginForm");
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;
    showToast(t("login.success"));
    bootstrap.Modal.getOrCreateInstance(document.getElementById("loginModal")).hide();
    loginForm.reset();
  });

  // Search goes to the shop page, which filters the products.
  document.getElementById("searchPanel").addEventListener("shown.bs.collapse", () => document.getElementById("siteSearch").focus());
  document.getElementById("searchForm").addEventListener("submit", (event) => {
    if (!document.getElementById("siteSearch").value.trim()) {
      event.preventDefault();
      showToast(t("search.empty"));
    }
  });

  initWishlist();
  initQuickView();
  initNewsletter();

  if (page === "home") initHome();
  if (page === "shop") initShopPage();
  if (page === "lenses") initLensLab();
  if (page === "contact") initContactPage();
  if (page === "designer") initDesigner();
  if (page === "track") initTrackPage();
  if (document.getElementById("reviewList")) initReviews(page === "reviews");

  // Installable app (PWA): runs only on the published site, not while developing locally,
  // so edits always show up straight away instead of a cached copy.
  const isLocal = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
  if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol) && !isLocal) {
    navigator.serviceWorker.register("sw.js").catch((error) => console.warn("Service worker not registered:", error));
  }
});

function initWishlist() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-wish]");
    if (!button) return;
    const id = button.closest("[data-product]").dataset.product;
    const adding = toggleWish(id);
    button.classList.remove("pop");
    void button.offsetWidth; // restart the heart animation
    if (adding) button.classList.add("pop");
    showToast(t(adding ? "wish.added" : "wish.removed"));
  });
  document.addEventListener("sun:wishlistchange", renderWishButtons);
  document.addEventListener("sun:languagechange", renderWishButtons);
  window.addEventListener("storage", (event) => {
    if (event.key === WISHLIST_KEY) document.dispatchEvent(new CustomEvent("sun:wishlistchange"));
  });
  renderWishButtons();
}

// The magnifier on a card opens the quick view for that product.
function initQuickView() {
  const modal = document.getElementById("quickView");
  modal.addEventListener("show.bs.modal", (event) => {
    const card = event.relatedTarget && event.relatedTarget.closest("[data-product]");
    if (!card) return;
    const product = store.product(card.dataset.product);
    const content = modal.querySelector(".item-modal-content");
    content.dataset.product = product.id;
    const image = modal.querySelector(".item-modal-img");
    image.src = product.img;
    image.alt = productName(product.id, "en");
    const sale = modal.querySelector("[data-sale]");
    sale.hidden = !product.was;
    sale.textContent = product.was ? `−${salePercent(product)}%` : "";
    modal.querySelector("[data-qv-tryon]").href = tryOnHref(product);
    modal.querySelector("[data-qv-3d]").href = tryOnHref(product).replace("#tryon", "&view=3d");
    fillQuickView(product);
    renderStockBadges();
    renderWishButtons();
  });
  document.addEventListener("sun:languagechange", () => {
    const id = modal.querySelector(".item-modal-content").dataset.product;
    if (id) fillQuickView(store.product(id));
  });
}

function fillQuickView(product) {
  const modal = document.getElementById("quickView");
  modal.querySelector("[data-qv-cat]").textContent = t(`cat.${product.category}`);
  modal.querySelector("[data-qv-name]").textContent = productName(product.id);
  modal.querySelector("[data-qv-desc]").textContent = t(`desc.${product.category}`);
  const specs = [
    ["fa-glasses", t("spec.shape"), t(`shape.${product.shape}`)],
    ["fa-layer-group", t("spec.material"), t(`material.${product.material}`)],
    ["fa-sun", t("spec.lens"), product.polarized ? t("spec.polarized") : t("spec.uv400")],
  ];
  modal.querySelector("[data-qv-specs]").innerHTML = specs
    .map(([icon, label, value]) => `<li><i class="fa-solid ${icon}" aria-hidden="true"></i><span>${label}</span><strong>${value}</strong></li>`)
    .join("");
  const faces = Object.keys(FACE_FIT).filter((face) => FACE_FIT[face].includes(product.shape) && face !== "oval");
  modal.querySelector("[data-qv-fit]").innerHTML = `<i class="fa-solid fa-face-smile" aria-hidden="true"></i> ${fill(t("finder.fitLine"), {
    faces: ["oval", ...faces].map((face) => t(`face.${face}`)).join(getLang() === "ar" ? "، " : ", "),
  })}`;
}

// Newsletter: no mailing service yet, so the email is kept in this browser and the visitor gets the code.
function initNewsletter() {
  const form = document.getElementById("newsletterForm");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    saveSetting("sunpalm-newsletter", form.querySelector("input").value.trim());
    form.hidden = true;
    const done = document.getElementById("newsletterDone");
    done.hidden = false;
    done.innerHTML = fill(t("news.letterDone"), { code: '<strong class="promo-code">SUN5</strong>' });
  });
}

// ---------- Home page ----------

function initHome() {
  const grid = document.getElementById("trendingGrid");
  const tabs = Array.from(document.querySelectorAll("[data-trend]"));
  let current = "all";

  function render() {
    const picks = PRODUCTS.filter((p) => p.category !== "bundles" && (current === "all" || p.category === current)).slice(0, 8);
    grid.innerHTML = picks.map(productCardHtml).join("");
    tabs.forEach((tab) => {
      const on = tab.dataset.trend === current;
      tab.classList.toggle("active", on);
      tab.setAttribute("aria-pressed", String(on));
    });
    applyLanguage(getLang());
    renderStockBadges();
    renderWishButtons();
  }
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    current = tab.dataset.trend;
    render();
  }));
  render();

  const deals = document.getElementById("dealsGrid");
  deals.innerHTML = PRODUCTS.filter((p) => p.category === "bundles").map(productCardHtml).join("");
  applyLanguage(getLang());
  renderStockBadges();
  renderWishButtons();

  initUvWidget();
  initCta3d();
}

// The home banner shows a slowly turning 3D pair once it scrolls into view (the drawing stays as a fallback).
function initCta3d() {
  const art = document.querySelector(".cta-art");
  if (!art || typeof mountGlasses3D !== "function" || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    observer.disconnect();
    const holder = document.createElement("div");
    holder.className = "cta-3d";
    art.appendChild(holder);
    mountGlasses3D(holder, { shape: "aviator", size: "medium", frame: "gold", lens: "goldmirror", case: "classic" }, { interactive: false })
      .then(() => art.classList.add("has-3d"))
      .catch(() => holder.remove());
  }, { rootMargin: "200px" });
  observer.observe(art);
}

// ---------- Shop page ----------

function initShopPage() {
  const grid = document.getElementById("shopGrid");
  grid.innerHTML = PRODUCTS.map(productCardHtml).join("");
  const items = Array.from(grid.querySelectorAll(".product-card"));
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const shapeBox = document.getElementById("shapeBar");
  const faceButtons = Array.from(document.querySelectorAll("[data-face]"));
  const finder = document.getElementById("finderPanel");
  const finderToggle = document.getElementById("finderToggle");
  const matchOnly = document.getElementById("matchOnly");
  const polarOnly = document.getElementById("polarOnly");
  const saleOnly = document.getElementById("saleOnly");
  const wishFilter = document.getElementById("wishFilter");
  const sortOptions = Array.from(document.querySelectorAll("[data-sort]"));
  const emptyState = document.getElementById("shopEmpty");

  // Shape chips show a tiny drawing of each frame.
  shapeBox.insertAdjacentHTML(
    "beforeend",
    SHAPES.map((shape) => `<button type="button" class="shape-chip" data-shape="${shape}" aria-pressed="false">${glassesSvg({ shape, frame: "black", lens: "smoke", size: "medium" })}<span data-i18n="shape.${shape}"></span></button>`).join("")
  );
  const shapeButtons = Array.from(document.querySelectorAll("[data-shape]"));

  const params = new URLSearchParams(window.location.search);
  let category = CATEGORIES.includes(window.location.hash.slice(1)) ? window.location.hash.slice(1) : "all";
  let shape = "all";
  let query = params.get("q") || "";
  let face = FACE_FIT[readSetting(FACE_KEY, "")] ? readSetting(FACE_KEY, "") : "";
  let wishOnly = params.get("wishlist") === "1";
  let sortValue = "default";
  saleOnly.checked = params.get("sale") === "1";
  polarOnly.checked = params.get("polarized") === "1";
  finder.hidden = !(params.get("finder") === "1" || face);
  if (params.get("finder") === "1") finder.scrollIntoView({ block: "center" });

  function applySort() {
    const price = (el) => store.product(el.dataset.product).price;
    const sorters = {
      priceAsc: (a, b) => price(a) - price(b),
      priceDesc: (a, b) => price(b) - price(a),
      discount: (a, b) => salePercent(store.product(b.dataset.product)) - salePercent(store.product(a.dataset.product)),
    };
    (sorters[sortValue] ? [...items].sort(sorters[sortValue]) : items).forEach((item) => grid.appendChild(item));
    sortOptions.forEach((option) => {
      const on = option.dataset.sort === sortValue;
      option.classList.toggle("active", on);
      option.setAttribute("aria-checked", String(on));
    });
    const label = document.getElementById("sortCurrent");
    label.dataset.i18n = `sort.${sortValue}`;
    label.textContent = t(label.dataset.i18n);
  }

  function render() {
    const needle = query.trim().toLowerCase();
    const wishes = wishlist();
    let visible = 0;

    items.forEach((item) => {
      const product = store.product(item.dataset.product);
      // Match the search against names, categories and shapes in every language.
      const words = Object.keys(LANGUAGES)
        .flatMap((lang) => [productName(product.id, lang), t(`cat.${product.category}`, lang), t(`shape.${product.shape}`, lang)])
        .map((w) => w.toLowerCase());
      const fits = face && FACE_FIT[face].includes(product.shape);
      const show =
        (wishOnly ? wishes.includes(product.id) : true) &&
        (category === "all" || product.category === category) &&
        (shape === "all" || product.shape === shape) &&
        (!needle || words.some((w) => w.includes(needle))) &&
        (!polarOnly.checked || product.polarized) &&
        (!saleOnly.checked || product.was) &&
        (!matchOnly.checked || !face || fits);
      item.hidden = !show;
      item.querySelector("[data-fit]").hidden = !fits;
      if (show) visible += 1;
    });

    filterButtons.forEach((b) => {
      b.classList.toggle("active", b.dataset.filter === category);
      b.setAttribute("aria-pressed", String(b.dataset.filter === category));
    });
    shapeButtons.forEach((b) => {
      b.classList.toggle("active", b.dataset.shape === shape);
      b.setAttribute("aria-pressed", String(b.dataset.shape === shape));
    });
    faceButtons.forEach((b) => {
      b.classList.toggle("active", b.dataset.face === face);
      b.setAttribute("aria-pressed", String(b.dataset.face === face));
    });
    const tip = document.getElementById("finderTip");
    tip.hidden = !face;
    if (face) {
      tip.textContent = fill(t("finder.tip"), {
        face: t(`face.${face}`),
        shapes: FACE_FIT[face].map((s) => t(`shape.${s}`)).join(getLang() === "ar" ? "، " : ", "),
      });
    }
    matchOnly.disabled = !face;
    finderToggle.setAttribute("aria-expanded", String(!finder.hidden));

    wishFilter.classList.toggle("active", wishOnly);
    wishFilter.setAttribute("aria-pressed", String(wishOnly));
    document.getElementById("wishCount").textContent = wishes.length;

    document.getElementById("resultCount").textContent = fill(t("shop.count"), { n: visible });
    emptyState.hidden = visible > 0;
    const emptyText = emptyState.querySelector("[data-i18n]");
    emptyText.dataset.i18n = wishOnly && !wishes.length ? "wish.empty" : "shop.empty";
    emptyText.textContent = t(emptyText.dataset.i18n);

    const info = document.getElementById("searchInfo");
    info.hidden = !needle;
    document.getElementById("searchTerm").textContent = `“${query}”`;
    if (needle) document.getElementById("siteSearch").value = query;
  }

  filterButtons.forEach((button) => button.addEventListener("click", () => {
    category = button.dataset.filter;
    history.replaceState(null, "", category === "all" ? window.location.pathname + window.location.search : `#${category}`);
    render();
  }));
  shapeButtons.forEach((button) => button.addEventListener("click", () => {
    shape = button.dataset.shape;
    render();
  }));
  faceButtons.forEach((button) => button.addEventListener("click", () => {
    face = face === button.dataset.face ? "" : button.dataset.face;
    saveSetting(FACE_KEY, face || null);
    if (!face) matchOnly.checked = false;
    render();
  }));
  finderToggle.addEventListener("click", () => {
    finder.hidden = !finder.hidden;
    render();
  });
  [matchOnly, polarOnly, saleOnly].forEach((box) => box.addEventListener("change", render));
  wishFilter.addEventListener("click", () => {
    wishOnly = !wishOnly;
    render();
  });
  sortOptions.forEach((option) => option.addEventListener("click", () => {
    sortValue = option.dataset.sort;
    applySort();
  }));
  document.getElementById("clearSearch").addEventListener("click", () => {
    query = "";
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    history.replaceState(null, "", url);
    document.getElementById("siteSearch").value = "";
    render();
  });

  window.addEventListener("hashchange", () => {
    const next = window.location.hash.slice(1);
    category = CATEGORIES.includes(next) ? next : "all";
    render();
  });
  document.addEventListener("sun:wishlistchange", render);
  document.addEventListener("sun:languagechange", () => {
    render();
    applySort();
  });

  applySort();
  applyLanguage(getLang());
  renderStockBadges();
  renderWishButtons();
  render();
  initFamily();
}

// ---------- Contact page ----------

function initContactPage() {
  const form = document.getElementById("contactForm");
  const success = document.getElementById("contactSuccess");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    // Demo only: there is no backend yet, so we just show the thank-you panel.
    form.hidden = true;
    success.hidden = false;
    form.reset();
  });

  document.getElementById("contactAgain").addEventListener("click", () => {
    success.hidden = true;
    form.hidden = false;
    form.querySelector("input").focus();
  });
}

// ---------- Customer reviews (home slider + reviews page) ----------

const REVIEWS = [
  { id: "r1", category: "men", stars: 5, date: "2026-09-12" },
  { id: "r2", category: "women", stars: 5, date: "2026-08-30" },
  { id: "r3", category: "kids", stars: 5, date: "2026-09-26" },
  { id: "r4", category: "bundles", stars: 4, date: "2026-07-21" },
  { id: "r5", category: "women", stars: 5, date: "2026-06-05" },
  { id: "r6", category: "men", stars: 4, date: "2026-05-18" },
];
const REVIEWS_STORAGE_KEY = "sunpalm-reviews";

function loadSavedReviews() {
  try {
    const saved = JSON.parse(localStorage.getItem(REVIEWS_STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function starsHtml(count) {
  let html = "";
  for (let i = 1; i <= 5; i += 1) {
    html += `<i class="${i <= count ? "fa-solid" : "fa-regular"} fa-star" aria-hidden="true"></i>`;
  }
  return `<span class="stars" role="img" aria-label="${count}/5">${html}</span>`;
}

function reviewCardHtml(review, index) {
  // Built-in reviews are translated; reviews typed by a visitor are shown as written.
  const name = review.name ? `<h4>${escapeHtml(review.name)}</h4>` : `<h4 data-i18n="review.${review.id}.name"></h4>`;
  const text = review.text ? `<p class="review-text">${escapeHtml(review.text)}</p>` : `<p class="review-text" data-i18n="review.${review.id}.text"></p>`;
  const initial = review.name ? escapeHtml(review.name.trim().charAt(0).toUpperCase()) : t(`review.${review.id}.name`, "en").charAt(0);
  const badge = review.name ? '<span class="review-new" data-i18n="fb.new"></span>' : "";

  return `
    <article class="review-card" style="--i:${index % 6}">
      <i class="fa-solid fa-quote-left review-quote" aria-hidden="true"></i>
      <div class="review-top">${starsHtml(review.stars)}${badge}</div>
      ${text}
      <div class="review-author">
        <span class="review-avatar">${initial}</span>
        <div>
          ${name}
          <p class="review-meta"><span data-i18n="cat.${review.category}"></span> · <time datetime="${review.date}"></time></p>
        </div>
      </div>
    </article>`;
}

function initReviews(isReviewsPage) {
  const list = document.getElementById("reviewList");

  function render() {
    const all = [...loadSavedReviews(), ...REVIEWS];
    list.innerHTML = all.map(reviewCardHtml).join("");

    const summary = document.getElementById("ratingSummary");
    if (summary) {
      const average = all.reduce((sum, r) => sum + r.stars, 0) / all.length;
      summary.querySelector("[data-avg]").textContent = average.toFixed(1);
      summary.querySelector("[data-avg-stars]").innerHTML = starsHtml(Math.round(average));
      summary.querySelector("[data-count]").textContent = all.length;
      summary.querySelectorAll("[data-bar]").forEach((bar) => {
        const count = all.filter((r) => r.stars === Number(bar.dataset.bar)).length;
        bar.querySelector(".bar-fill").style.width = `${(count / all.length) * 100}%`;
        bar.querySelector(".bar-count").textContent = count;
      });
    }
    applyLanguage(getLang());
  }

  render();
  if (document.getElementById("reviewSlider")) initReviewSlider();
  if (!isReviewsPage) return;

  const form = document.getElementById("feedbackForm");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const rating = form.querySelector('input[name="rating"]:checked');
    if (!rating) {
      showToast(t("fb.needRating"));
      return;
    }
    if (!form.reportValidity()) return;

    const review = {
      id: `u${Date.now()}`,
      name: form.elements.reviewName.value.trim(),
      text: form.elements.reviewText.value.trim(),
      category: form.elements.reviewItem.value,
      stars: Number(rating.value),
      date: new Date().toISOString().slice(0, 10),
    };
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify([review, ...loadSavedReviews()]));
    } catch (error) {
      console.warn("Could not save the review:", error);
    }
    form.reset();
    render();
    showToast(t("fb.thanks"));
    list.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

// ---------- Home page review slider ----------

function initReviewSlider() {
  const slider = document.getElementById("reviewSlider");
  const viewport = slider.querySelector(".slider-viewport");
  const track = document.getElementById("reviewList");
  const dotsBox = document.getElementById("reviewDots");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const AUTOPLAY_MS = 5000;
  let index = 0;
  let timer = null;
  let paused = false;

  const cards = () => Array.from(track.children);
  const perView = () => (window.innerWidth >= 992 ? 3 : window.innerWidth >= 640 ? 2 : 1);
  const lastIndex = () => Math.max(0, cards().length - perView());

  function update() {
    const list = cards();
    if (!list.length) return;
    index = Math.min(index, lastIndex());
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = list[0].getBoundingClientRect().width + gap;
    // In Arabic the cards flow right-to-left, so the track moves the other way.
    const dir = document.documentElement.dir === "rtl" ? 1 : -1;
    track.style.transform = `translateX(${dir * index * step}px)`;

    list.forEach((card, i) => {
      const visible = i >= index && i < index + perView();
      card.classList.toggle("is-visible", visible);
      card.setAttribute("aria-hidden", String(!visible));
    });

    const pages = lastIndex() + 1;
    if (dotsBox.children.length !== pages) {
      dotsBox.innerHTML = Array.from({ length: pages }, (_, i) => `<button type="button" data-dot="${i}" aria-label="${i + 1} / ${pages}"></button>`).join("");
    }
    Array.from(dotsBox.children).forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
      dot.setAttribute("aria-current", String(i === index));
    });
  }

  function go(next) {
    const max = lastIndex();
    index = next > max ? 0 : next < 0 ? max : next; // wrap around at both ends
    update();
  }

  function restart() {
    window.clearInterval(timer);
    if (reduceMotion) return;
    timer = window.setInterval(() => {
      if (!paused && !document.hidden) go(index + 1);
    }, AUTOPLAY_MS);
  }

  slider.addEventListener("click", (event) => {
    const arrow = event.target.closest("[data-slide]");
    if (!arrow) return;
    go(index + Number(arrow.dataset.slide));
    restart();
  });
  dotsBox.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-dot]");
    if (!dot) return;
    go(Number(dot.dataset.dot));
    restart();
  });

  // Pause while the visitor is reading or using the keyboard.
  slider.addEventListener("mouseenter", () => { paused = true; });
  slider.addEventListener("mouseleave", () => { paused = false; });
  slider.addEventListener("focusin", () => { paused = true; });
  slider.addEventListener("focusout", () => { paused = false; });

  // Swipe on touch screens.
  let startX = null;
  viewport.addEventListener("pointerdown", (event) => { startX = event.clientX; });
  viewport.addEventListener("pointerup", (event) => {
    if (startX === null) return;
    const delta = event.clientX - startX;
    startX = null;
    if (Math.abs(delta) < 40) return;
    const forward = document.documentElement.dir === "rtl" ? delta > 0 : delta < 0;
    go(index + (forward ? 1 : -1));
    restart();
  });

  window.addEventListener("resize", update);
  document.addEventListener("sun:languagechange", () => requestAnimationFrame(update));
  update();
  restart();
}
