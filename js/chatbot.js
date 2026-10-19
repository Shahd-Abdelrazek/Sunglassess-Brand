"use strict";

const BOT_INTENTS = {
  track: ["track", "status", "where is my order", "my order", "تتبع", "تتبّع", "طلبي", "الأوردر بتاعي", "اوردري", "أوردري", "حالة الطلب", "وصل فين", "sendung", "verfolg", "tracci", "stato", "il mio ordine"],
  rx: ["prescription", "medical", "myopia", "طبية", "طبيه", "مقاس نظر", "نظر ضعيف", "قصر نظر", "rezept", "korrektur", "sehstärke", "graduat", "da vista", "miopia"],
  family: ["family", "matching", "عيلة", "عائلة", "العيلة", "الأسرة", "familie", "famiglia"],
  quiz: ["quiz", "recommend", "suggest", "which one", "رشح", "رشحلي", "اقترح", "انصح", "أنسب", "اختبار", "empfehl", "consigli"],
  lab: ["lens colo", "tint", "lens lab", "لون العدس", "ألوان العدس", "الوان العدس", "glasfarbe", "tönung", "colore lent", "colori lent"],
  compare: ["compare", "difference between", "قارن", "مقارنة", "الفرق بين", "vergleich", "confront"],
  face: ["face shape", "face", "وشي", "شكل الوش", "شكل وجهي", "وجه", "gesicht", "viso"],
  tryon: ["try on", "try", "camera", "جرب", "أجرب", "اجرب", "تجربة", "كاميرا", "anprobieren", "kamera", "provare", "fotocamera"],
  designer: ["design", "custom", "own pair", "engrav", "صمم", "تصميم", "اصمم", "أصمم", "حفر", "اسمي", "gestalt", "gravur", "eigene", "personalizz", "incis"],
  uv: ["polariz", "uv", "protect", "glare", "بولار", "استقطاب", "حماية", "وهج", "أشعة", "اشعة", "polarisiert", "schutz", "blend", "polarizzat", "protezione", "riflessi"],
  returns: ["return", "refund", "exchange", "warranty", "guarantee", "استرجاع", "ترجيع", "استبدال", "ضمان", "رجوع", "rückgabe", "garantie", "umtausch", "reso", "garanzia", "rimborso", "cambio"],
  delivery: ["delivery", "deliver", "shipping", "ship", "توصيل", "شحن", "دليفري", "lieferung", "versand", "consegna", "spedizione"],
  sale: ["sale", "discount", "offer", "coupon", "promo", "code", "خصم", "عرض", "عروض", "تخفيض", "كود", "كوبون", "rabatt", "angebot", "gutschein", "sconto", "offerta", "codice"],
  price: ["price", "cost", "how much", "سعر", "اسعار", "أسعار", "بكام", "تكلفة", "preis", "kosten", "prezz", "costo", "quanto"],
  order: ["order", "buy", "cart", "purchase", "اطلب", "طلب", "شراء", "اشتري", "سلة", "اوردر", "أوردر", "bestell", "kaufen", "warenkorb", "ordin", "compr", "carrello"],
  stock: ["stock", "left", "available", "availab", "ستوك", "مخزون", "متاح", "متوفر", "فاضل", "باقي", "lager", "verfügbar", "vorrat", "scort", "disponibil", "magazzino", "rimast"],
  contact: ["contact", "phone", "call", "address", "where", "location", "تواصل", "رقم", "تليفون", "هاتف", "عنوان", "فين", "مكان", "kontakt", "telefon", "adresse", "contatt", "telefono", "indirizzo", "dove"],
  shop: ["shop", "products", "collection", "glasses", "المتجر", "منتجات", "نظارات", "نضارات", "كوليكشن", "brillen", "kollektion", "occhiali", "collezione", "negozio"],
  thanks: ["thank", "thx", "شكرا", "شكرًا", "متشكر", "تسلم", "danke", "grazie"],
  greet: ["hi", "hello", "hey", "السلام", "اهلا", "أهلا", "مرحبا", "hallo", "ciao", "salve", "buongiorno", "guten tag"],
};

const BOT_CATEGORY_WORDS = {
  men: ["men", "man", "gentleman", "رجالي", "رجال", "راجل", "herren", "männer", "uomo", "uomini"],
  women: ["women", "woman", "female", "lady", "ladies", "نسائي", "حريمي", "ستات", "بنات", "damen", "frauen", "donna", "donne"],
  kids: ["kids", "kid", "child", "baby", "أطفال", "اطفال", "طفل", "بيبي", "عيال", "kinder", "baby", "bambin"],
  bundles: ["bundle", "set", "pack", "باقة", "طقم", "مجموعة", "paket", "set", "confezion"],
};

function matchesAny(text, words) {
  return words.some((word) => {
    // Short Latin words like "hi" or "uv" must be whole words, so "this" doesn't count as a greeting.
    if (/^[a-z]{1,3}$/.test(word)) return new RegExp(`\\b${word}\\b`).test(text);
    return text.includes(word);
  });
}

function listJoin(items) {
  return items.join(getLang() === "ar" ? "، " : ", ");
}

function botReply(message) {
  const text = message.toLowerCase().replace(/[ً-ْ]/g, "");
  const category = Object.keys(BOT_CATEGORY_WORDS).find((cat) => matchesAny(text, BOT_CATEGORY_WORDS[cat]));
  const has = (intent) => matchesAny(text, BOT_INTENTS[intent]);

  if (has("track")) return { html: t("bot.track") };
  if (has("rx")) return { html: fill(t("bot.rx"), { price: formatPrice(RX_PRICE) }) };
  if (has("family")) return { html: fill(t("bot.family"), { p: FAMILY_DISCOUNT }) };
  if (has("quiz")) return { html: t("bot.quiz") };
  if (has("lab")) return { html: t("bot.lab") };
  if (has("compare")) return { html: t("bot.compare") };
  if (has("face")) {
    const rows = Object.keys(FACE_FIT)
      .map((face) => `<li><span>${t(`face.${face}`)}</span><strong>${listJoin(FACE_FIT[face].slice(0, 3).map((s) => t(`shape.${s}`)))}</strong></li>`)
      .join("");
    return { html: `${t("bot.face")}<ul class="bot-list">${rows}</ul><a href="shop.html?finder=1">${t("finder.title")}</a>` };
  }
  if (has("tryon")) return { html: t("bot.tryon") };
  if (has("designer")) return { html: fill(t("bot.designer"), { from: formatPrice(Math.min(...DESIGN_OPTIONS.shape.map((o) => o.price)) + DESIGN_OPTIONS.size[0].price) }) };
  if (has("uv")) return { html: t("bot.uv") };
  if (has("returns")) return { html: t("bot.returns") };
  if (has("delivery")) return { html: t("bot.delivery") };
  if (has("sale")) {
    const best = Math.max(...PRODUCTS.map(salePercent));
    return { html: fill(t("bot.sale"), { p: best }) };
  }
  if (category) {
    const left = store.availableByCategory(category);
    const status = left === 0 ? t("cart.out") : fill(t("cart.left"), { n: left });
    const fromPrice = Math.min(...PRODUCTS.filter((p) => p.category === category).map((p) => p.price));
    return {
      html: `<strong>${t(`cat.${category}`)}</strong> — ${fill(t("bot.from"), { price: formatPrice(fromPrice) })} · ${status}.<br>${t(`desc.${category}`)}<br><a href="shop.html#${category}">${t("bot.see")}</a>`,
    };
  }
  if (has("price")) {
    const prices = PRODUCTS.map((p) => p.price);
    return { html: fill(t("bot.price"), { min: formatPrice(Math.min(...prices)), max: formatPrice(Math.max(...prices)) }) };
  }
  if (has("order")) return { html: t("bot.order") };
  if (has("stock")) {
    const rows = CATEGORIES.map((cat) => {
      const left = store.availableByCategory(cat);
      return `<li><span>${t(`cat.${cat}`)}</span><strong class="${left === 0 ? "out" : left <= LOW_STOCK ? "low" : ""}">${left}</strong></li>`;
    }).join("");
    return { html: `${t("bot.stockIntro")}<ul class="bot-list">${rows}</ul>` };
  }
  if (has("contact")) return { html: t("bot.contact") };
  if (has("shop")) return { html: fill(t("bot.shop"), { list: listJoin(CATEGORIES.map((cat) => t(`cat.${cat}`))) }) };
  if (has("thanks")) return { html: t("bot.thanks") };
  if (has("greet")) return { html: t("bot.greet"), chips: true };
  return { html: t("bot.fallback"), chips: true };
}

function chatbotTemplate() {
  return `
  <button type="button" class="chat-fab" id="chatFab" aria-controls="chatPanel" aria-expanded="false" data-i18n-aria="bot.open">
    <i class="fa-solid fa-comment-dots chat-fab-open" aria-hidden="true"></i>
    <i class="fa-solid fa-xmark chat-fab-close" aria-hidden="true"></i>
  </button>
  <section class="chat-panel" id="chatPanel" aria-labelledby="chatTitle" hidden>
    <header class="chat-head">
      <img src="${LOGO}" alt="">
      <div>
        <h5 id="chatTitle" data-i18n="bot.title"></h5>
        <p><span class="online-dot"></span><span data-i18n="bot.status"></span></p>
      </div>
      <button type="button" class="chat-close" id="chatClose" data-i18n-aria="modal.close"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>
    </header>
    <div class="chat-body" id="chatBody" aria-live="polite"></div>
    <form class="chat-input" id="chatForm">
      <input type="text" id="chatText" autocomplete="off" maxlength="200" data-i18n-placeholder="bot.placeholder" data-i18n-aria="bot.placeholder">
      <button type="submit" data-i18n-aria="bot.send"><i class="fa-solid fa-paper-plane flip-rtl" aria-hidden="true"></i></button>
    </form>
  </section>`;
}

function initChatbot() {
  document.body.insertAdjacentHTML("beforeend", chatbotTemplate());

  const fab = document.getElementById("chatFab");
  const panel = document.getElementById("chatPanel");
  const body = document.getElementById("chatBody");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatText");
  let greeted = false;

  function addMessage(html, from) {
    const row = document.createElement("div");
    row.className = `msg msg-${from}`;
    row.innerHTML = from === "bot" ? `<img src="${LOGO}" alt="" class="msg-avatar"><div class="bubble">${html}</div>` : `<div class="bubble"></div>`;
    if (from === "user") row.querySelector(".bubble").textContent = html;
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
    return row;
  }

  function addChips() {
    const chips = document.createElement("div");
    chips.className = "chips";
    [["quiz", "quiz.title"], ["shop", "nav.shop"], ["face", "finder.title"], ["designer", "nav.designer"], ["sale", "bot.chip.sale"], ["track", "track.cta"]].forEach(([intent, key]) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.textContent = t(key);
      chip.addEventListener("click", () => ask(t(key), intent));
      chips.appendChild(chip);
    });
    body.appendChild(chips);
    body.scrollTop = body.scrollHeight;
  }

  function ask(message, forcedIntent) {
    addMessage(message, "user");
    const typing = addMessage('<span class="typing"><i></i><i></i><i></i></span>', "bot");
    const reply = forcedIntent ? botReply(BOT_INTENTS[forcedIntent][0]) : botReply(message);
    window.setTimeout(() => {
      typing.remove();
      addMessage(reply.html, "bot");
      if (reply.chips) addChips();
    }, 650);
  }

  function setOpen(open) {
    panel.hidden = !open;
    fab.classList.toggle("open", open);
    fab.setAttribute("aria-expanded", String(open));
    if (open && !greeted) {
      greeted = true;
      addMessage(t("bot.greet"), "bot");
      addChips();
    }
    if (open) input.focus();
  }

  fab.addEventListener("click", () => setOpen(panel.hidden));
  document.getElementById("chatClose").addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    input.value = "";
    ask(message);
  });
}
