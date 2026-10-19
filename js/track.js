
"use strict";

const TRACK_STEPS = ["confirmed", "preparing", "ready", "out", "delivered"];
const TRACK_ICONS = {
  confirmed: "fa-clipboard-check",
  preparing: "fa-screwdriver-wrench",
  ready: "fa-box-open",
  out: "fa-truck-fast",
  delivered: "fa-face-smile-beam",
};
const MY_ORDERS_KEY = "sunpalm-my-orders";
const TRACK_REFRESH_MS = 60000;

// Words the shop can type in the sheet's status column (any of the 4 languages).
const STATUS_WORDS = {
  confirmed: ["confirmed", "confirm", "تم التأكيد", "اتأكد", "مؤكد", "تأكيد", "bestätigt", "confermato"],
  preparing: ["preparing", "in progress", "processing", "packing", "قيد التحضير", "بيتجهز", "تجهيز", "تحضير", "بنجهزه", "in vorbereitung", "in bearbeitung", "in preparazione"],
  ready: ["ready", "جاهز", "fertig", "pronto"],
  out: ["out", "out for delivery", "on the way", "خرج للتوصيل", "في الطريق", "مع المندوب", "unterwegs", "in consegna"],
  delivered: ["delivered", "done", "picked up", "complete", "تم التسليم", "اتسلم", "وصل", "تم", "geliefert", "consegnato"],
  cancelled: ["cancelled", "canceled", "ملغي", "اتلغى", "إلغاء", "storniert", "annullato"],
};

function normalizeStatus(value) {
  const text = String(value || "").trim().toLowerCase();
  return Object.keys(STATUS_WORDS).find((status) => STATUS_WORDS[status].includes(text)) || null;
}

function normalizeOrderNo(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

// Minimal CSV parser (handles quoted cells with commas and line breaks).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// A built-in sample so the page can be previewed before the sheet is connected.
const DEMO_ORDER = { order: "SP-DEMO", status: "preparing", note: "", updated: "" };

async function findOrder(orderNo) {
  if (orderNo === DEMO_ORDER.order) return { ...DEMO_ORDER, note: t("track.demoNote") };
  if (!SHOP.trackingSheetCsv) throw new Error("not-configured");

  const url = `${SHOP.trackingSheetCsv}${SHOP.trackingSheetCsv.includes("?") ? "&" : "?"}t=${Date.now()}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("fetch-failed");
  const [header, ...rows] = parseCsv(await response.text());
  const col = (name) => header.findIndex((h) => h.trim().toLowerCase() === name);
  const iOrder = col("order");
  const iStatus = col("status");
  const iNote = col("note");
  const iUpdated = col("updated");
  if (iOrder < 0 || iStatus < 0) throw new Error("bad-sheet");

  // If the same order appears twice, the last row wins.
  const match = rows.filter((r) => normalizeOrderNo(r[iOrder]) === orderNo).pop();
  if (!match) return null;
  return {
    order: orderNo,
    status: match[iStatus],
    note: iNote >= 0 ? (match[iNote] || "").trim() : "",
    updated: iUpdated >= 0 ? (match[iUpdated] || "").trim() : "",
  };
}

function rememberMyOrder(orderNo, total) {
  try {
    const list = JSON.parse(localStorage.getItem(MY_ORDERS_KEY) || "[]").filter((o) => o.order !== orderNo);
    list.unshift({ order: orderNo, total, date: new Date().toISOString().slice(0, 10) });
    localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(list.slice(0, 5)));
  } catch (error) {
    // Not critical: the customer still has the number in WhatsApp.
  }
}

function myOrders() {
  try {
    const list = JSON.parse(localStorage.getItem(MY_ORDERS_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch (error) {
    return [];
  }
}

function trackUrl(orderNo) {
  return new URL(`track.html?order=${encodeURIComponent(orderNo)}`, window.location.href).href;
}

// ---------- Page ----------

function initTrackPage() {
  const form = document.getElementById("trackForm");
  const input = document.getElementById("trackInput");
  const result = document.getElementById("trackResult");
  let current = "";
  let timer = null;

  function renderRecent() {
    const box = document.getElementById("recentOrders");
    const list = myOrders();
    box.hidden = !list.length;
    document.getElementById("recentList").innerHTML = list
      .map(
        (o) => `<button type="button" class="recent-chip" data-order="${escapeHtml(o.order)}">
          <i class="fa-solid fa-receipt" aria-hidden="true"></i> <strong>${escapeHtml(o.order)}</strong>
          <small>${escapeHtml(o.date)}${o.total ? ` · ${formatPrice(o.total)}` : ""}</small></button>`
      )
      .join("");
  }

  function showMessage(icon, key, extraClass = "") {
    result.innerHTML = `<div class="track-message ${extraClass}"><span>${icon}</span><p>${t(key)}</p></div>`;
  }

  function renderOrder(order) {
    const status = normalizeStatus(order.status);
    if (!status) {
      showMessage("🤔", "track.unknownStatus");
      return;
    }
    const time = new Intl.DateTimeFormat(LANGUAGES[getLang()].locale, { hour: "numeric", minute: "2-digit" }).format(new Date());

    if (status === "cancelled") {
      result.innerHTML = `
        <div class="track-card cancelled">
          <div class="track-head"><span class="track-no"></span><span class="track-badge cancelled">${t("track.status.cancelled")}</span></div>
          <p class="track-lead">${t("track.cancelledText")}</p>
          <a class="btn-sun" href="contact.html">${t("nav.contact")}</a>
        </div>`;
    } else {
      const reached = TRACK_STEPS.indexOf(status);
      const steps = TRACK_STEPS.map((step, i) => {
        const state = i < reached ? "done" : i === reached ? "current" : "todo";
        return `
          <li class="track-step ${state}">
            <span class="step-dot"><i class="fa-solid ${state === "done" ? "fa-check" : TRACK_ICONS[step]}" aria-hidden="true"></i></span>
            <div><strong>${t(`track.status.${step}`)}</strong><small>${t(`track.desc.${step}`)}</small></div>
          </li>`;
      }).join("");
      const progress = (reached / (TRACK_STEPS.length - 1)) * 100;
      result.innerHTML = `
        <div class="track-card">
          <div class="track-head">
            <span class="track-no"></span>
            <span class="track-badge">${t(`track.status.${status}`)}</span>
          </div>
          <p class="track-lead">${t(`track.lead.${status}`)}</p>
          <div class="track-bar" role="progressbar" aria-valuenow="${Math.round(progress)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${progress}%"></span></div>
          <ol class="track-steps">${steps}</ol>
          <p class="track-note" hidden><i class="fa-solid fa-message" aria-hidden="true"></i> <span></span></p>
          <p class="track-updated"><i class="fa-solid fa-rotate" aria-hidden="true"></i> ${fill(t("track.checked"), { time })}${order.updated ? ` · ${t("track.updated")} <span class="track-updated-val"></span>` : ""}</p>
        </div>`;
    }
    // Values from the sheet are shown as text only.
    result.querySelector(".track-no").textContent = order.order;
    const note = result.querySelector(".track-note");
    if (note && order.note) {
      note.hidden = false;
      note.querySelector("span").textContent = order.note;
    }
    const updated = result.querySelector(".track-updated-val");
    if (updated) updated.textContent = order.updated;
  }

  async function track(orderNo, { quiet = false } = {}) {
    current = orderNo;
    window.clearInterval(timer);
    history.replaceState(null, "", `?order=${encodeURIComponent(orderNo)}`);
    if (!quiet) showMessage('<span class="spinner-border" role="status"></span>', "track.loading");

    try {
      const order = await findOrder(orderNo);
      if (current !== orderNo) return;
      if (order) {
        renderOrder(order);
        // Keep the page fresh while the customer waits.
        timer = window.setInterval(() => track(orderNo, { quiet: true }), TRACK_REFRESH_MS);
      } else {
        showMessage("🔎", "track.notFound");
      }
    } catch (error) {
      if (current !== orderNo) return;
      if (error.message === "not-configured") showMessage("🛠️", "track.notConfigured");
      else if (error.message === "bad-sheet") showMessage("📋", "track.badSheet");
      else showMessage("📡", "track.offline");
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const orderNo = normalizeOrderNo(input.value);
    if (!orderNo) {
      showToast(t("track.enter"));
      return;
    }
    input.value = orderNo;
    track(orderNo);
  });

  document.getElementById("recentList").addEventListener("click", (event) => {
    const chip = event.target.closest("[data-order]");
    if (!chip) return;
    input.value = chip.dataset.order;
    track(chip.dataset.order);
  });

  document.addEventListener("sun:languagechange", () => {
    renderRecent();
    if (current) track(current, { quiet: true });
  });

  renderRecent();
  const fromLink = normalizeOrderNo(new URLSearchParams(window.location.search).get("order"));
  if (fromLink) {
    input.value = fromLink;
    track(fromLink);
  }
}
