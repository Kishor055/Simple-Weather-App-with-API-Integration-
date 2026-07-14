import { fetchWeatherData, fetchWeatherDataByCoords } from './api.js';
import { renderCurrentWeather, renderHourlyForecast, render8DayForecast, renderAQI, updateAIInsights, updateBackground, handleError } from './ui.js';
import { setLocalStorage, getLocalStorage } from './storage.js';

const API_KEY = 'YOUR_API_KEY'; // Replace with your OpenWeatherMap API key
const UNIT_KEY = 'weather_unit';
const LAST_CITY_KEY = 'weather_last_city';
let UNIT = getLocalStorage(UNIT_KEY) || 'metric';

const elements = {
  loader: document.getElementById('loader'),
  searchInput: document.getElementById('searchInput'),
  searchBtn: document.getElementById('searchBtn'),
  voiceBtn: document.getElementById('voiceBtn'),
  geoBtn: document.getElementById('geoBtn'),
};

const showLoader = () => elements.loader.classList.add('visible');
const hideLoader = () => elements.loader.classList.remove('visible');

async function fetchAndDisplayWeather(city) {
  showLoader();
  try {
    const data = await fetchWeatherData(city, API_KEY, UNIT);
    renderAll(data);
    setLocalStorage(LAST_CITY_KEY, city);
  } catch (error) {
    handleError(error.message);
  } finally {
    hideLoader();
  }
}

async function fetchAndDisplayWeatherByCoords(lat, lon) {
  showLoader();
  try {
    const data = await fetchWeatherDataByCoords(lat, lon, API_KEY, UNIT);
    renderAll(data);
  } catch (error) {
    handleError(error.message);
  } finally {
    hideLoader();
  }
}

function renderAll(data) {
  renderCurrentWeather(data.currentWeather, data.onecallData);
  renderHourlyForecast(data.onecallData.hourly);
  render8DayForecast(data.onecallData.daily);
  renderAQI(data.aqiData);
  updateAIInsights(data.currentWeather);
  updateBackground(data.currentWeather);
  document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden'));
}

// Event Listeners
elements.searchBtn.addEventListener('click', () => {
  const city = elements.searchInput.value;
  if (city) fetchAndDisplayWeather(city);
});

elements.searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const city = elements.searchInput.value;
    if (city) fetchAndDisplayWeather(city);
  }
});

elements.geoBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    handleError("Geolocation is not supported by your browser.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      fetchAndDisplayWeatherByCoords(position.coords.latitude, position.coords.longitude);
    },
    () => {
      handleError("Unable to retrieve your location. Please enable location services.");
    }
  );
});

// Voice Search
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
if (recognition) {
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  elements.voiceBtn.addEventListener('click', () => {
    recognition.start();
  });

  recognition.addEventListener('speechstart', () => {
    console.log('Speech has been detected.');
  });

  recognition.addEventListener('result', (e) => {
    const transcript = e.results[0][0].transcript;
    elements.searchInput.value = transcript;
    fetchAndDisplayWeather(transcript);
  });

  recognition.addEventListener('speechend', () => {
    recognition.stop();
  });

  recognition.addEventListener('error', (e) => {
    console.error('Error occurred in recognition: ' + e.error);
    handleError("Voice search failed. Please try again.");
  });
}

// Initial Load
window.addEventListener('load', () => {
  const lastCity = getLocalStorage(LAST_CITY_KEY);
  if (lastCity) {
    fetchAndDisplayWeather(lastCity);
  } else {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchAndDisplayWeatherByCoords(position.coords.latitude, position.coords.longitude);
      },
      () => {
        fetchAndDisplayWeather("New York"); // Default city
      }
    );
  }
});
