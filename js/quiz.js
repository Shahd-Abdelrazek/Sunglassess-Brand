// Style quiz: five quick questions, then the three pairs that fit best — with the reasons why.
"use strict";

const QUIZ_STEPS = [
  { id: "who", options: [["men", "👨"], ["women", "👩"], ["kids", "🧒"]] },
  { id: "use", options: [["driving", "🚗"], ["beach", "🏖️"], ["everyday", "🏙️"]] },
  { id: "style", options: [["classic", "🎩"], ["bold", "💃"], ["minimal", "⚪"]] },
  { id: "budget", options: [["low", "💵"], ["mid", "💰"], ["any", "💎"]] },
  { id: "face", options: [["oval", "🥚"], ["round", "🟠"], ["square", "🟧"], ["heart", "💛"], ["oblong", "📏"], ["unsure", "🤷"]] },
];
const QUIZ_STYLE_SHAPES = {
  classic: ["aviator", "wayfarer", "round"],
  bold: ["cateye", "heart", "square"],
  minimal: ["round", "square", "wayfarer"],
};
const QUIZ_BUDGET = { low: 800, mid: 1200, any: Infinity };

function quizTemplate() {
  return `
  <div class="modal fade" id="quizModal" tabindex="-1" aria-labelledby="quizTitle" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content sun-modal quiz-modal">
        <div class="modal-head quiz-head">
          <h5 class="modal-title" id="quizTitle"><i class="fa-solid fa-wand-sparkles" aria-hidden="true"></i> <span data-i18n="quiz.title"></span></h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" data-i18n-aria="modal.close"></button>
          <div class="quiz-progress" aria-hidden="true"><span id="quizBar"></span></div>
        </div>
        <div class="modal-body" id="quizBody" aria-live="polite"></div>
      </div>
    </div>
  </div>`;
}

// Scores every pair in the chosen collection and keeps the reasons for the top three.
function quizPicks(answers) {
  const budget = QUIZ_BUDGET[answers.budget];
  const faceFit = FACE_FIT[answers.face];
  return PRODUCTS.filter((p) => p.category === answers.who)
    .map((product) => {
      let score = 0;
      const why = [];
      if (QUIZ_STYLE_SHAPES[answers.style].includes(product.shape)) {
        score += 3;
        why.push(t(`quiz.why.style.${answers.style}`));
      }
      if (answers.use !== "everyday" && product.polarized) {
        score += 3;
        why.push(t(`quiz.why.polarized.${answers.use}`));
      }
      if (faceFit && faceFit.includes(product.shape)) {
        score += 2;
        why.push(fill(t("quiz.why.face"), { face: t(`face.${answers.face}`) }));
      }
      if (product.price <= budget) {
        score += 2;
        if (budget !== Infinity) why.push(t("quiz.why.budget"));
      } else {
        score -= 4;
      }
      if (product.was) {
        score += 1;
        why.push(fill(t("quiz.why.sale"), { p: salePercent(product) }));
      }
      if (store.available(product.id) === 0) score -= 10;
      return { product, score, why };
    })
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price)
    .slice(0, 3);
}

function quizCardHtml({ product, why }, index) {
  return `
    <article class="quiz-pick" data-product="${product.id}" style="--i:${index}">
      <span class="quiz-rank">${index + 1}</span>
      <img src="${product.img}" alt="">
      <div class="quiz-pick-body">
        <h4>${productName(product.id)}</h4>
        <div class="price-row"><p class="price-tag" data-price></p><del class="was-price" data-was></del></div>
        <ul class="quiz-why">${why.map((reason) => `<li><i class="fa-solid fa-check" aria-hidden="true"></i>${reason}</li>`).join("")}</ul>
        <div class="quiz-pick-actions">
          <button type="button" class="btn-sun btn-sm-sun" data-add-to-cart><i class="fa-solid fa-cart-plus" aria-hidden="true"></i> ${t("cart.add")}</button>
          <button type="button" class="btn-notify" data-notify hidden><i class="fa-regular fa-bell" aria-hidden="true"></i> ${t("notify.button")}</button>
          <a class="icon-round" href="${tryOnHref(product)}" aria-label="${t("tryon.cta")}"><i class="fa-solid fa-camera" aria-hidden="true"></i></a>
          <button type="button" class="icon-round" data-wish aria-pressed="false" aria-label="${t("wish.add")}"><i class="fa-regular fa-heart" aria-hidden="true"></i><i class="fa-solid fa-heart" aria-hidden="true"></i></button>
        </div>
      </div>
    </article>`;
}

function initQuiz() {
  document.body.insertAdjacentHTML("beforeend", quizTemplate());
  const modalEl = document.getElementById("quizModal");
  const body = document.getElementById("quizBody");
  const bar = document.getElementById("quizBar");
  let step = 0;
  let answers = {};

  function renderStep() {
    const current = QUIZ_STEPS[step];
    bar.style.width = `${(step / QUIZ_STEPS.length) * 100}%`;
    body.innerHTML = `
      <p class="quiz-count">${fill(t("quiz.step"), { n: step + 1, total: QUIZ_STEPS.length })}</p>
      <h3 class="quiz-q">${t(`quiz.q.${current.id}`)}</h3>
      <div class="quiz-options${current.options.length > 3 ? " six" : ""}">
        ${current.options
          .map(([value, icon]) => `
          <button type="button" class="quiz-opt${answers[current.id] === value ? " active" : ""}" data-answer="${value}">
            <span class="quiz-emoji">${icon}</span>
            <strong>${t(`quiz.a.${current.id}.${value}`)}</strong>
          </button>`)
          .join("")}
      </div>
      ${step > 0 ? `<button type="button" class="link-btn quiz-back" data-quiz-back><i class="fa-solid fa-arrow-left flip-rtl" aria-hidden="true"></i> ${t("quiz.back")}</button>` : ""}`;
  }

  function renderResult() {
    bar.style.width = "100%";
    const picks = quizPicks(answers);
    const lens = answers.use === "driving" ? "green" : answers.use === "beach" ? "bluemirror" : "smoke";
    const designer = `designer.html?shape=${QUIZ_STYLE_SHAPES[answers.style][0]}&lens=${lens}&size=${answers.who === "kids" ? "kids" : "medium"}${answers.use === "everyday" ? "" : "&pol=1"}`;
    body.innerHTML = `
      <div class="quiz-result-head">
        <span class="quiz-badge">✨</span>
        <div><h3 class="quiz-q">${t("quiz.resultTitle")}</h3><p>${t("quiz.resultText")}</p></div>
      </div>
      <div class="quiz-picks">${picks.map(quizCardHtml).join("")}</div>
      <div class="quiz-end">
        <a class="btn-outline-sun" href="${designer}"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> ${t("quiz.design")}</a>
        <button type="button" class="link-btn" data-quiz-restart><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> ${t("quiz.restart")}</button>
      </div>`;
    renderStockBadges();
    renderWishButtons();
  }

  function open() {
    step = 0;
    answers = {};
    const savedFace = readSetting(FACE_KEY, "");
    if (FACE_FIT[savedFace]) answers.face = savedFace;
    renderStep();
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  body.addEventListener("click", (event) => {
    const option = event.target.closest("[data-answer]");
    if (option) {
      answers[QUIZ_STEPS[step].id] = option.dataset.answer;
      if (QUIZ_STEPS[step].id === "face" && FACE_FIT[option.dataset.answer]) saveSetting(FACE_KEY, option.dataset.answer);
      step += 1;
      if (step < QUIZ_STEPS.length) renderStep();
      else renderResult();
      return;
    }
    if (event.target.closest("[data-quiz-back]")) {
      step -= 1;
      renderStep();
    }
    if (event.target.closest("[data-quiz-restart]")) {
      step = 0;
      answers = {};
      renderStep();
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-quiz-open]")) return;
    event.preventDefault();
    open();
  });

  document.addEventListener("sun:languagechange", () => {
    if (!modalEl.classList.contains("show")) return;
    if (step < QUIZ_STEPS.length) renderStep();
    else renderResult();
  });

  if (new URLSearchParams(window.location.search).get("quiz") === "1") open();
}
