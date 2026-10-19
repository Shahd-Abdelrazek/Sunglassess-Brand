// live weather from Open-Meteo (free, no API key):
// UV now and through the day, temperature, sky, sunrise/sunset, the hours you need sunglasses,
"use strict";

const UV_CITIES = {
  cairo: { lat: 30.04, lon: 31.24 },
  alexandria: { lat: 31.2, lon: 29.92 },
  hurghada: { lat: 27.26, lon: 33.81 },
  sharm: { lat: 27.92, lon: 34.33 },
  luxor: { lat: 25.69, lon: 32.64 },
  aswan: { lat: 24.09, lon: 32.9 },
  matrouh: { lat: 31.35, lon: 27.24 },
};
const UV_CITY_KEY = "sunpalm-uv-city";
const UV_PROTECT = 3;

// Open-Meteo weather codes grouped into a few sky types.
function weatherKind(code) {
  if (code === 0) return "clear";
  if (code <= 2) return "partly";
  if (code === 3) return "cloudy";
  if (code <= 48) return "fog";
  if (code <= 57) return "drizzle";
  if (code <= 67 || (code >= 80 && code <= 82)) return "rain";
  if (code <= 77 || code === 85 || code === 86) return "snow";
  return "storm";
}
const WEATHER_ICONS = { clear: "fa-sun", partly: "fa-cloud-sun", cloudy: "fa-cloud", fog: "fa-smog", drizzle: "fa-cloud-rain", rain: "fa-cloud-showers-heavy", snow: "fa-snowflake", storm: "fa-cloud-bolt" };

function uvLevel(uv) {
  if (uv < 3) return "low";
  if (uv < 6) return "moderate";
  if (uv < 8) return "high";
  if (uv < 11) return "veryhigh";
  return "extreme";
}

function lensForToday(peak, kind) {
  if (peak < UV_PROTECT) return ["fog", "cloudy", "drizzle", "rain", "storm"].includes(kind) ? "yellow" : "rosegradient";
  if (peak < 6) return "green";
  if (peak < 8) return "brown";
  return peak < 11 ? "bluemirror" : "goldmirror";
}

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}` +
    "&current=temperature_2m,uv_index,cloud_cover,weather_code" +
    "&hourly=uv_index&daily=uv_index_max,sunrise,sunset,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1";
  const response = await fetch(url);
  if (!response.ok) throw new Error("uv-fetch");
  const data = await response.json();
  return {
    now: data.current.uv_index,
    max: data.daily.uv_index_max[0],
    temp: data.current.temperature_2m,
    tempMax: data.daily.temperature_2m_max[0],
    tempMin: data.daily.temperature_2m_min[0],
    clouds: data.current.cloud_cover,
    kind: weatherKind(data.current.weather_code),
    sunrise: data.daily.sunrise[0],
    sunset: data.daily.sunset[0],
    hours: data.hourly.time.map((time, i) => ({ hour: Number(time.slice(11, 13)), uv: data.hourly.uv_index[i] })),
    fetched: new Date(),
  };
}

// "10:00" style clock text in the visitor's language; Open-Meteo times are already local to the city.
function clockText(hour, minute = 0) {
  const date = new Date(2000, 0, 1, hour, minute);
  return new Intl.DateTimeFormat(LANGUAGES[getLang()].locale, { hour: "numeric", minute: "2-digit" }).format(date);
}

function uvPicksHtml(peak) {
  const best = (category) =>
    PRODUCTS.filter((p) => p.category === category && store.available(p.id) > 0)
      .map((p) => ({ p, score: (peak >= 6 && p.polarized ? 3 : 0) + (p.was ? 1 : 0) + (peak < 3 && !p.polarized ? 1 : 0) }))
      .sort((a, b) => b.score - a.score || a.p.price - b.p.price)[0];
  const picks = [best("men"), best("women")].filter(Boolean);
  return picks
    .map(({ p }) => `
      <div class="uv-pick" data-product="${p.id}">
        <img src="${p.img}" alt="">
        <div>
          <strong>${productName(p.id)}</strong>
          <span><span data-price></span>${p.polarized ? ` · ${t("spec.polarizedShort")}` : ""}</span>
        </div>
        <button type="button" class="icon-round" data-add-to-cart aria-label="${t("cart.add")}"><i class="fa-solid fa-cart-plus" aria-hidden="true"></i></button>
      </div>`)
    .join("");
}

function initUvWidget() {
  const box = document.getElementById("uvWidget");
  if (!box) return;
  const result = document.getElementById("uvResult");
  const locate = document.getElementById("uvLocate");
  const select = document.getElementById("uvCity");
  let city = UV_CITIES[readSetting(UV_CITY_KEY, "")] ? readSetting(UV_CITY_KEY, "") : "cairo";
  let coords = UV_CITIES[city];
  let last = null;

  select.innerHTML = Object.keys(UV_CITIES).map((id) => `<option value="${id}">${t(`uv.city.${id}`)}</option>`).join("") +
    `<option value="here">📍 ${t("uv.here")}</option>`;
  select.value = city;

  function render() {
    if (!last) return;
    const peak = Math.round(Math.max(last.now, last.max));
    const level = uvLevel(peak);
    const angle = (Math.min(peak, 12) / 12) * 180 - 90;
    box.dataset.level = level;

    // The hours you need sunglasses: the first and last hour with UV ≥ 3.
    const daytime = last.hours.filter((h) => h.hour >= 6 && h.hour <= 19);
    const strong = daytime.filter((h) => h.uv >= UV_PROTECT);
    const windowText = strong.length
      ? fill(t("uv.window"), { from: clockText(strong[0].hour), to: clockText(strong[strong.length - 1].hour + 1) })
      : t("uv.noWindow");
    const top = Math.max(UV_PROTECT + 1, ...daytime.map((h) => h.uv));
    const nowHour = new Date(last.fetched).getHours();
    const bars = daytime
      .map((h) => {
        const lvl = uvLevel(h.uv);
        return `<span class="uv-bar uv-${lvl}${h.hour === nowHour && city !== "here" ? " now" : ""}" style="--h:${Math.max(4, (h.uv / top) * 100)}%" title="${clockText(h.hour)} · UV ${h.uv.toFixed(1)}"><i></i><small>${h.hour}</small></span>`;
      })
      .join("");

    const lens = lensForToday(peak, last.kind);
    const sunrise = last.sunrise.slice(11, 16).split(":").map(Number);
    const sunset = last.sunset.slice(11, 16).split(":").map(Number);
    const place = city === "here" ? t("uv.here") : t(`uv.city.${city}`);

    result.innerHTML = `
      <div class="uv-top">
        <div class="uv-gauge" aria-hidden="true"><span class="uv-needle" style="transform: rotate(${angle}deg)"></span></div>
        <div class="uv-read">
          <p class="uv-place"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${place} <span class="uv-live"><span></span>${fill(t("uv.live"), { time: clockText(last.fetched.getHours(), last.fetched.getMinutes()) })}</span></p>
          <p class="uv-value"><strong>${peak}</strong> <span>${t(`uv.level.${level}`)}</span></p>
          <p class="uv-now">${fill(t("uv.nowMax"), { now: Math.round(last.now), max: Math.round(last.max) })}</p>
        </div>
        <div class="uv-weather">
          <i class="fa-solid ${WEATHER_ICONS[last.kind]}" aria-hidden="true"></i>
          <strong>${Math.round(last.temp)}°</strong>
          <span>${t(`wx.${last.kind}`)}</span>
          <small>${fill(t("uv.tempRange"), { min: Math.round(last.tempMin), max: Math.round(last.tempMax) })}</small>
        </div>
      </div>
      <p class="uv-advice">${t(`uv.advice.${level}`)}</p>
      <div class="uv-chart-box">
        <p class="uv-window"><i class="fa-solid fa-glasses" aria-hidden="true"></i> ${windowText}</p>
        <div class="uv-chart" role="img" aria-label="${t("uv.chart")}">${bars}</div>
        <p class="uv-sun"><span><i class="fa-solid fa-sun" aria-hidden="true"></i> ${t("uv.sunrise")} ${clockText(sunrise[0], sunrise[1])}</span><span><i class="fa-solid fa-moon" aria-hidden="true"></i> ${t("uv.sunset")} ${clockText(sunset[0], sunset[1])}</span></p>
      </div>
      <div class="uv-reco">
        <a class="uv-lens" href="lenses.html?lens=${lens}">
          <span class="swatch lens-swatch" style="--g:linear-gradient(160deg, ${designOption("lens", lens).stops.map(([o, c]) => `${c} ${o * 100}%`).join(", ")})"></span>
          <span><small>${t("uv.lensPick")}</small><strong>${t(`lens.${lens}`)}${peak >= 6 ? ` · ${t("design.polarized")}` : ""}</strong></span>
          <i class="fa-solid fa-arrow-right flip-rtl" aria-hidden="true"></i>
        </a>
        <p class="side-label mb-2">${t("uv.picks")}</p>
        <div class="uv-picks">${uvPicksHtml(peak)}</div>
      </div>`;
    renderStockBadges();
  }

  async function load(lat, lon) {
    result.innerHTML = `<p class="uv-loading"><span class="spinner-border spinner-border-sm" role="status"></span> ${t("uv.loading")}</p>`;
    try {
      last = await fetchWeather(lat, lon);
      render();
    } catch (error) {
      result.innerHTML = `<p class="uv-loading">📡 ${t("uv.error")}</p>`;
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      showToast(t("uv.noLocation"));
      select.value = city === "here" ? "cairo" : city;
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        city = "here";
        select.value = "here";
        coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        load(coords.lat, coords.lon);
      },
      () => {
        showToast(t("uv.noLocation"));
        select.value = city === "here" ? "cairo" : city;
      },
      { timeout: 10000, maximumAge: 600000 }
    );
  }

  locate.addEventListener("click", useMyLocation);
  select.addEventListener("change", () => {
    if (select.value === "here") {
      useMyLocation();
      return;
    }
    city = select.value;
    coords = UV_CITIES[city];
    saveSetting(UV_CITY_KEY, city);
    load(coords.lat, coords.lon);
  });

  // Fetch only when the widget scrolls into view, then refresh every 30 minutes.
  const start = () => {
    load(coords.lat, coords.lon);
    window.setInterval(() => {
      if (!document.hidden) load(coords.lat, coords.lon);
    }, 30 * 60 * 1000);
  };
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        start();
      }
    });
    observer.observe(box);
  } else {
    start();
  }
  document.addEventListener("sun:languagechange", () => {
    Array.from(select.options).forEach((option) => {
      option.textContent = option.value === "here" ? `📍 ${t("uv.here")}` : t(`uv.city.${option.value}`);
    });
    render();
  });
}
