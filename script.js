// script.js (optimized)
// Replace YOUR_API_KEY with your OpenWeatherMap key for local testing.
// For production use the Flask proxy (app.py) and set API key server-side.

const API_KEY = 'ecbfeb6a79825fdfe9839b9cf485df9f'; // <-- for local testing only
const PROXY_ENABLED = false; // set true to use server proxy endpoints (/api/weather, /api/forecast)
const PROXY_PREFIX = '/api'; // when using proxy; e.g. /api/weather?city=...
const UNIT_KEY = 'weather_unit';
const LAST_CITY_KEY = 'weather_last_city';
const CACHE_KEY = 'weather_cache_v1';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let UNIT = localStorage.getItem(UNIT_KEY) || 'metric';

const elements = {
  searchInput: document.getElementById('searchInput'),
  searchBtn: document.getElementById('searchBtn'),
  geoBtn: document.getElementById('geoBtn'),
  messages: document.getElementById('messages'),
  currentCard: document.getElementById('current'),
  cityEl: document.getElementById('city'),
  dateEl: document.getElementById('date'),
  iconEl: document.getElementById('icon'),
  tempVal: document.getElementById('tempVal'),
  descEl: document.getElementById('desc'),
  humidityEl: document.getElementById('humidity'),
  windEl: document.getElementById('wind'),
  pressureEl: document.getElementById('pressure'),
  forecastSection: document.getElementById('forecast'),
  forecastCards: document.getElementById('forecastCards'),
  unitToggle: document.getElementById('unitToggle'),
};

function showMessage(msg, isError = true, persist = false) {
  if (!elements.messages) return;
  elements.messages.textContent = msg || '';
  elements.messages.style.color = isError ? '#ffd6d6' : '#b7ffd6';
  if (!persist && msg) {
    clearTimeout(showMessage._t);
    showMessage._t = setTimeout(() => { elements.messages.textContent = ''; }, 6000);
  }
}

function formatDate(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleString(undefined, { weekday:'short', month:'short', day:'numeric' });
}
function getIconUrl(icon) {
  return icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : '';
}

async function safeFetch(url, { timeout = 12000, signal: outerSignal } = {}) {
  const controller = new AbortController();
  const signal = controller.signal;
  if (outerSignal) {
    if (outerSignal.aborted) controller.abort();
    outerSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const payload = await res.json().catch(()=> ({}));
      const message = payload.message || `${res.status} ${res.statusText}`;
      throw new Error(message);
    }
    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out');
    throw err;
  }
}

const memoryCache = new Map();
function loadCacheFromStorage() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) { return {}; }
}
function saveCacheToStorage(obj) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(obj)); } catch (e) {}
}
function getCached(url) {
  const mem = memoryCache.get(url);
  if (mem) {
    if (Date.now() - mem.ts < CACHE_TTL_MS) return mem.data;
    memoryCache.delete(url);
  }
  const storage = loadCacheFromStorage();
  const entry = storage[url];
  if (entry && (Date.now() - entry.ts < CACHE_TTL_MS)) {
    memoryCache.set(url, { ts: entry.ts, data: entry.data });
    return entry.data;
  }
  return null;
}
function setCached(url, data) {
  memoryCache.set(url, { ts: Date.now(), data });
  const storage = loadCacheFromStorage();
  storage[url] = { ts: Date.now(), data };
  saveCacheToStorage(storage);
}

async function apiFetchCurrentByCity(city, { bypassCache = false, signal } = {}) {
  if (PROXY_ENABLED) {
    const url = `${PROXY_PREFIX}/weather?city=${encodeURIComponent(city)}&units=${UNIT}`;
    return safeFetch(url, { signal });
  }
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${UNIT}&appid=${API_KEY}`;
  if (!bypassCache) {
    const c = getCached(url);
    if (c) return c;
  }
  const data = await safeFetch(url, { signal });
  setCached(url, data);
  return data;
}

async function apiFetchCurrentByCoords(lat, lon, { bypassCache = false, signal } = {}) {
  if (PROXY_ENABLED) {
    const url = `${PROXY_PREFIX}/weather?lat=${lat}&lon=${lon}&units=${UNIT}`;
    return safeFetch(url, { signal });
  }
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${UNIT}&appid=${API_KEY}`;
  if (!bypassCache) {
    const c = getCached(url);
    if (c) return c;
  }
  const data = await safeFetch(url, { signal });
  setCached(url, data);
  return data;
}

async function apiFetch5DayForecast(lat, lon, { bypassCache = false, signal } = {}) {
  if (PROXY_ENABLED) {
    const url = `${PROXY_PREFIX}/forecast?lat=${lat}&lon=${lon}&units=${UNIT}`;
    return safeFetch(url, { signal });
  }
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${UNIT}&appid=${API_KEY}`;
  if (!bypassCache) {
    const c = getCached(url);
    if (c) return c;
  }
  const data = await safeFetch(url, { signal });
  setCached(url, data);
  return data;
}

function renderCurrent(data) {
  if (!data) return;
  elements.currentCard.classList.remove('hidden');
  elements.cityEl.textContent = `${data.name}, ${data.sys?.country || ''}`;
  elements.dateEl.textContent = formatDate(data.dt);
  const icon = data.weather?.[0]?.icon || '';
  elements.iconEl.src = getIconUrl(icon);
  elements.iconEl.alt = data.weather?.[0]?.description || 'weather';
  elements.tempVal.textContent = `${Math.round(data.main.temp)}°${UNIT === 'metric' ? 'C' : 'F'}`;
  elements.descEl.textContent = data.weather?.[0]?.description || '';
  elements.humidityEl.textContent = data.main.humidity ?? '—';
  elements.windEl.textContent = data.wind?.speed ?? '—';
  elements.pressureEl.textContent = data.main.pressure ?? '—';
}

function aggregateForecastToDaily(forecastJson) {
  const map = new Map();
  (forecastJson.list || []).forEach(item => {
    const date = new Date(item.dt * 1000);
    const key = date.toISOString().split('T')[0];
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  const daily = [];
  for (const [key, arr] of map) {
    const temps = arr.map(a => a.main.temp);
    const avgTemp = temps.reduce((s,t)=>s+t,0)/temps.length;
    const midday = arr.reduce((best,cur) => {
      const curHour = new Date(cur.dt * 1000).getUTCHours();
      const bestHour = new Date(best.dt * 1000).getUTCHours();
      return Math.abs(curHour - 12) < Math.abs(bestHour - 12) ? cur : best;
    }, arr[0]);
    daily.push({
      dateKey: key,
      dt: midday.dt,
      temp: avgTemp,
      desc: midday.weather?.[0]?.description || '',
      icon: midday.weather?.[0]?.icon || ''
    });
    if (daily.length >= 5) break;
  }
  return daily;
}

function renderForecast(dailyArr) {
  if (!dailyArr) return;
  elements.forecastSection.classList.remove('hidden');
  const frag = document.createDocumentFragment();
  elements.forecastCards.innerHTML = '';
  dailyArr.forEach(day => {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div class="day">${new Date(day.dateKey).toLocaleString(undefined, { weekday:'short', month:'short', day:'numeric' })}</div>
      <img src="${getIconUrl(day.icon)}" alt="${day.desc}" />
      <div class="t">${Math.round(day.temp)}°${UNIT==='metric'?'C':'F'}</div>
      <div class="d" style="color:var(--muted);text-transform:capitalize">${day.desc}</div>
    `;
    frag.appendChild(card);
  });
  elements.forecastCards.appendChild(frag);
}

let lastController = null;
function disableUI(flag = true) {
  if (elements.searchBtn) elements.searchBtn.disabled = flag;
  if (elements.geoBtn) elements.geoBtn.disabled = flag;
  if (elements.searchInput) elements.searchInput.disabled = flag;
  if (elements.searchBtn) elements.searchBtn.textContent = flag ? 'Searching…' : 'Search';
}

async function showWeatherByCity(city) {
  if (!city) return showMessage('Please enter a city name.', true);
  if (lastController) lastController.abort();
  lastController = new AbortController();
  const signal = lastController.signal;

  disableUI(true);
  showMessage('', false);

  try {
    const current = await apiFetchCurrentByCity(city, { signal });
    renderCurrent(current);
    const forecastJson = await apiFetch5DayForecast(current.coord.lat, current.coord.lon, { signal });
    const daily = aggregateForecastToDaily(forecastJson);
    renderForecast(daily);
    localStorage.setItem(LAST_CITY_KEY, city);
  } catch (err) {
    showMessage(`Error: ${err.message}`, true);
  } finally {
    disableUI(false);
    lastController = null;
  }
}

async function showWeatherByCoords(lat, lon) {
  if (lastController) lastController.abort();
  lastController = new AbortController();
  const signal = lastController.signal;

  disableUI(true);
  showMessage('', false);

  try {
    const current = await apiFetchCurrentByCoords(lat, lon, { signal });
    renderCurrent(current);
    const forecastJson = await apiFetch5DayForecast(lat, lon, { signal });
    const daily = aggregateForecastToDaily(forecastJson);
    renderForecast(daily);
  } catch (err) {
    showMessage(`Error: ${err.message}`, true);
  } finally {
    disableUI(false);
    lastController = null;
  }
}

function debounce(fn, wait = 350) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    return new Promise((resolve) => {
      t = setTimeout(async () => {
        try {
          const r = await fn(...args);
          resolve(r);
        } catch (e) { resolve(null); }
      }, wait);
    });
  };
}

elements.searchBtn.addEventListener('click', () => {
  const q = elements.searchInput.value.trim();
  showWeatherByCity(q);
});

elements.searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') elements.searchBtn.click();
});

const debouncedPreview = debounce(async () => {
  const q = elements.searchInput.value.trim();
  if (!q) return;
  try {
    const controller = new AbortController();
    const data = await apiFetchCurrentByCity(q, { signal: controller.signal });
    showMessage(`${data.name}: ${Math.round(data.main.temp)}°${UNIT==='metric'?'C':'F'}`, false);
  } catch (e) { /* silent while typing */ }
}, 700);

elements.searchInput.addEventListener('input', () => debouncedPreview());

elements.geoBtn.addEventListener('click', () => {
  if (!navigator.geolocation) return showMessage('Geolocation not supported by this browser.', true);
  showMessage('Locating...', false);
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      showWeatherByCoords(lat, lon);
    },
    err => {
      showMessage('Unable to retrieve your location. Allow location and try again.', true);
    },
    { timeout: 10000 }
  );
});

if (elements.unitToggle) {
  elements.unitToggle.addEventListener('click', () => {
    UNIT = (UNIT === 'metric') ? 'imperial' : 'metric';
    localStorage.setItem(UNIT_KEY, UNIT);
    showMessage('Units toggled. Re-run search to update values.', false);
    const last = localStorage.getItem(LAST_CITY_KEY);
    if (last) showWeatherByCity(last);
  });
}

window.addEventListener('load', () => {
  const lastCity = localStorage.getItem(LAST_CITY_KEY);
  if (lastCity) elements.searchInput.value = lastCity;
});
