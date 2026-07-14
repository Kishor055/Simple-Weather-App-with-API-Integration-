import { API_BASE_URL } from './constants.js';

async function fetchWeatherData(city, apiKey, units) {
  const weatherUrl = `${API_BASE_URL}/weather?q=${city}&appid=${apiKey}&units=${units}`;
  const weatherRes = await fetch(weatherUrl);
  if (!weatherRes.ok) throw new Error(`City not found: ${weatherRes.statusText}`);
  const currentWeather = await weatherRes.json();

  return fetchAllData(currentWeather.coord.lat, currentWeather.coord.lon, apiKey, units, currentWeather);
}

async function fetchWeatherDataByCoords(lat, lon, apiKey, units) {
  const weatherUrl = `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
  const weatherRes = await fetch(weatherUrl);
  if (!weatherRes.ok) throw new Error(`Location not found: ${weatherRes.statusText}`);
  const currentWeather = await weatherRes.json();

  return fetchAllData(lat, lon, apiKey, units, currentWeather);
}

async function fetchAllData(lat, lon, apiKey, units, currentWeather) {
  const [onecallRes, aqiRes] = await Promise.all([
    fetch(`${API_BASE_URL}/onecall?lat=${lat}&lon=${lon}&exclude=minutely&appid=${apiKey}&units=${units}`),
    fetch(`${API_BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`)
  ]);

  const onecallData = await onecallRes.json();
  const aqiData = await aqiRes.json();

  return { currentWeather, onecallData, aqiData };
}

export { fetchWeatherData, fetchWeatherDataByCoords };
