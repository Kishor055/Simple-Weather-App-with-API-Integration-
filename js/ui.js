import { getAIWeatherSuggestion } from './weather.js';

const elements = {
  cityEl: document.getElementById('city'),
  dateEl: document.getElementById('date'),
  iconEl: document.getElementById('icon'),
  tempVal: document.getElementById('tempVal'),
  descEl: document.getElementById('desc'),
  humidityEl: document.getElementById('humidity'),
  windEl: document.getElementById('wind'),
  pressureEl: document.getElementById('pressure'),
  sunriseEl: document.getElementById('sunrise'),
  sunsetEl: document.getElementById('sunset'),
  feelsLikeEl: document.getElementById('feels_like'),
  uvIndexEl: document.getElementById('uv-index'),
  hourlyForecast: document.getElementById('hourlyForecast'),
  forecastList: document.getElementById('forecastList'),
  aiMessage: document.getElementById('ai-message'),
  aqiValueEl: document.getElementById('aqi-value'),
  aqiStatusEl: document.getElementById('aqi-status'),
  aqiInfoEl: document.getElementById('aqi-info'),
  backgroundVideo: document.getElementById('background-video'),
};

function renderCurrentWeather(data, onecallData) {
  elements.cityEl.textContent = `${data.name}, ${data.sys.country}`;
  elements.dateEl.textContent = new Date(data.dt * 1000).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  elements.iconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
  elements.tempVal.textContent = `${Math.round(data.main.temp)}°`;
  elements.descEl.textContent = data.weather[0].description;
  elements.humidityEl.textContent = `${data.main.humidity}%`;
  elements.windEl.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
  elements.pressureEl.textContent = `${data.main.pressure} hPa`;
  elements.sunriseEl.textContent = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  elements.sunsetEl.textContent = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  elements.feelsLikeEl.textContent = `${Math.round(data.main.feels_like)}°`;
  elements.uvIndexEl.textContent = Math.round(onecallData.current.uvi);
}

function renderHourlyForecast(hourlyData) {
  elements.hourlyForecast.innerHTML = '';
  hourlyData.slice(0, 24).forEach(item => {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', hour12: true });
    const temp = `${Math.round(item.temp)}°`;
    card.innerHTML = `<p>${time}</p><img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}"><p>${temp}</p>`;
    elements.hourlyForecast.appendChild(card);
  });
}

function render8DayForecast(dailyData) {
  elements.forecastList.innerHTML = '';
  dailyData.slice(0, 8).forEach(day => {
    const maxTemp = Math.round(day.temp.max);
    const minTemp = Math.round(day.temp.min);
    const dayName = new Date(day.dt * 1000).toLocaleDateString([], { weekday: 'long' });

    const listItem = document.createElement('div');
    listItem.className = 'forecast-list-item';
    listItem.innerHTML = `
      <div class="day-main">
          <span class="forecast-day">${dayName}</span>
          <div class="forecast-icon-temp">
              <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="weather icon"/>
              <span class="forecast-temps">${maxTemp}° / ${minTemp}°</span>
          </div>
      </div>
    `;
    elements.forecastList.appendChild(listItem);
  });
}

function renderAQI(data) {
  const aqi = data.list[0].main.aqi;
  let status, info, color;
  switch (aqi) {
    case 1: status = 'Good'; info = 'Air quality is excellent.'; color = '#87e878'; break;
    case 2: status = 'Fair'; info = 'Air quality is acceptable.'; color = '#f9d750'; break;
    case 3: status = 'Moderate'; info = 'Some may experience irritation.'; color = '#f9a350'; break;
    case 4: status = 'Poor'; info = 'Everyone may feel effects.'; color = '#f95050'; break;
    case 5: status = 'Very Poor'; info = 'Health alert: serious risk.'; color = '#a350f9'; break;
    default: status = 'Unknown'; info = '--'; color = '#fff';
  }
  elements.aqiValueEl.textContent = aqi;
  elements.aqiStatusEl.textContent = status;
  elements.aqiInfoEl.textContent = info;
  elements.aqiValueEl.style.color = color;
  elements.aqiStatusEl.style.color = color;
}

function updateAIInsights(weather) {
  const suggestion = getAIWeatherSuggestion(weather);
  elements.aiMessage.textContent = suggestion;
}

function updateBackground(weather) {
  const condition = weather.weather[0].main.toLowerCase();
  let videoSrc = 'assets/videos/default.mp4'; // A default video

  if (condition.includes('clear')) {
    videoSrc = 'assets/videos/sunny.mp4';
  } else if (condition.includes('clouds')) {
    videoSrc = 'assets/videos/cloudy.mp4';
  } else if (condition.includes('rain') || condition.includes('drizzle')) {
    videoSrc = 'assets/videos/rainy.mp4';
  } else if (condition.includes('storm')) {
    videoSrc = 'assets/videos/stormy.mp4';
  } else if (condition.includes('snow')) {
    videoSrc = 'assets/videos/snowy.mp4';
  }
  elements.backgroundVideo.src = videoSrc;
}

function handleError(message) {
  console.error(message);
  elements.cityEl.textContent = "Location not found";
  // You can also show a toast notification here
}

export { renderCurrentWeather, renderHourlyForecast, render8DayForecast, renderAQI, updateAIInsights, updateBackground, handleError };
