
const API_KEY = 'ecbfeb6a79825fdfe9839b9cf485df9f';
const UNIT_KEY = 'weather_unit';
const LAST_CITY_KEY = 'weather_last_city';
let UNIT = localStorage.getItem(UNIT_KEY) || 'metric';

const elements = {
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    geoBtn: document.getElementById('geoBtn'),
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
    hourlyForecast: document.getElementById('hourlyForecast'),
    forecastList: document.getElementById('forecastList'),
    aiMessage: document.getElementById('ai-message'),
    sidebarNav: document.querySelector('.sidebar-nav'),
    aqiCard: document.getElementById('aqi-card'),
    aqiValueEl: document.getElementById('aqi-value'),
    aqiStatusEl: document.getElementById('aqi-status'),
    aqiInfoEl: document.getElementById('aqi-info'),
    uvIndexEl: document.getElementById('uv-index')
};

async function fetchAndRender(weatherUrl, city) {
    try {
        const [weatherRes, forecastRes] = await Promise.all([
            fetch(weatherUrl),
            fetch(weatherUrl.replace('/weather', '/forecast'))
        ]);

        if (!weatherRes.ok) throw new Error(`City not found: ${weatherRes.statusText}`);
        
        const currentWeather = await weatherRes.json();
        const forecast = await forecastRes.json();

        const [uviRes, aqiRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${currentWeather.coord.lat}&lon=${currentWeather.coord.lon}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}`),
            fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${currentWeather.coord.lat}&lon=${currentWeather.coord.lon}&appid=${API_KEY}`)
        ]);

        const uviData = await uviRes.json();
        const aqiData = await aqiRes.json();

        renderCurrentWeather(currentWeather, uviData);
        renderHourlyForecast(forecast.list);
        render7DayForecast(forecast.list);
        renderAQI(aqiData);
        updateAIInsights(currentWeather);
        updateBackground(currentWeather);

        document.querySelectorAll('.hidden').forEach(el => el.classList.remove('hidden'));
        if (city) localStorage.setItem(LAST_CITY_KEY, city);

    } catch (error) {
        console.error("Failed to fetch weather data:", error);
        handleError(error.message);
    }
}

function renderCurrentWeather(data, uviData) {
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
    elements.uvIndexEl.textContent = Math.round(uviData.current.uvi);
}

function renderAQI(data) {
    const aqi = data.list[0].main.aqi;
    elements.aqiValueEl.textContent = aqi;
    let status, info, color;
    switch (aqi) {
        case 1: status = 'Good'; info = 'Air quality is excellent.'; color = '#87e878'; break;
        case 2: status = 'Fair'; info = 'Air quality is acceptable.'; color = '#f9d750'; break;
        case 3: status = 'Moderate'; info = 'Some may experience irritation.'; color = '#f9a350'; break;
        case 4: status = 'Poor'; info = 'Everyone may feel effects.'; color = '#f95050'; break;
        case 5: status = 'Very Poor'; info = 'Health alert: serious risk.'; color = '#a350f9'; break;
        default: status = 'Unknown'; info = '--'; color = '#fff';
    }
    elements.aqiStatusEl.textContent = status;
    elements.aqiInfoEl.textContent = info;
    elements.aqiValueEl.style.color = color;
    elements.aqiStatusEl.style.color = color;
}

function render7DayForecast(forecastData) {
    elements.forecastList.innerHTML = '';
    const dailyData = {};

    forecastData.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyData[date]) {
            dailyData[date] = { temps_max: [], temps_min: [], icons: [], pops: [], winds: [] };
        }
        dailyData[date].temps_max.push(item.main.temp_max);
        dailyData[date].temps_min.push(item.main.temp_min);
        dailyData[date].icons.push(item.weather[0].icon);
        dailyData[date].pops.push(item.pop); // Probability of precipitation
        dailyData[date].winds.push(item.wind.speed);
    });

    Object.keys(dailyData).slice(1, 8).forEach(date => {
        const day = dailyData[date];
        const maxTemp = Math.round(Math.max(...day.temps_max));
        const minTemp = Math.round(Math.min(...day.temps_min));
        const avgPop = (day.pops.reduce((a, b) => a + b) / day.pops.length) * 100;
        const maxWind = ((Math.max(...day.winds)) * 3.6).toFixed(1);
        const icon = day.icons[Math.floor(day.icons.length / 2)];
        const dayName = new Date(date).toLocaleDateString([], { weekday: 'long' });

        const listItem = document.createElement('div');
        listItem.className = 'forecast-list-item';
        listItem.innerHTML = `
            <div class="day-main">
                <span class="forecast-day">${dayName}</span>
                <div class="forecast-icon-temp">
                    <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="weather icon"/>
                    <span class="forecast-temps">${maxTemp}° / ${minTemp}°</span>
                </div>
            </div>
            <div class="day-details">
                <div><span>Precipitation</span><span>${Math.round(avgPop)}%</span></div>
                <div><span>Wind</span><span>${maxWind} km/h</span></div>
            </div>
        `;
        listItem.addEventListener('click', () => {
            listItem.classList.toggle('expanded');
        });
        elements.forecastList.appendChild(listItem);
    });
}

// Keep other functions like getAIWeatherSuggestion, fetchWeatherData, fetchWeatherDataByCoords, handleError, updateBackground, renderHourlyForecast, updateAIInsights, and event listeners as they were, but ensure fetchAndRender is called correctly.

// --- [The rest of the original script.js content remains here, with modifications to use the new fetchAndRender] ---

function getAIWeatherSuggestion(weather) {
    const temp = weather.main.temp;
    const condition = weather.weather[0].main.toLowerCase();
    const windSpeed = weather.wind.speed;

    if (condition.includes('rain')) {
        return "Moderate rain expected. Carry an umbrella today.";
    }
    if (condition.includes('thunderstorm')) {
        return "A storm is approaching. It is best to stay indoors.";
    }
    if (temp > 30) {
        return "High temperatures expected. Stay hydrated and avoid direct sun.";
    }
    if (temp < 10) {
        return "It's quite chilly. A warm jacket is recommended.";
    }
    if (windSpeed > 15) {
        return "It's a windy day. Be cautious of loose objects outdoors.";
    }
    if (condition.includes('clear')) {
        return "Beautiful clear skies! A perfect day for outdoor activities.";
    }
    if (condition.includes('clouds')) {
        return "A bit cloudy today, but still very pleasant.";
    }
    return "Enjoy your day! Check the detailed forecast for more information.";
}

async function fetchWeatherData(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${UNIT}`;
    await fetchAndRender(url, city);
}

async function fetchWeatherDataByCoords(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${UNIT}`;
    await fetchAndRender(url);
}

function handleError(message) {
    console.warn(message);
    elements.cityEl.textContent = "Location not found";
}

function updateBackground(weather) {
    const body = document.body;
    body.className = ''; // Clear existing classes
    const condition = weather.weather[0].main.toLowerCase();
    const sunset = weather.sys.sunset * 1000;
    const sunrise = weather.sys.sunrise * 1000;
    const now = Date.now();

    if (now > sunset || now < sunrise) {
        body.classList.add('night');
        return;
    }

    const weatherConditions = ['sunny', 'rainy', 'cloudy', 'stormy', 'snowy'];
    let matchedCondition = 'cloudy'; // default
    for (const c of weatherConditions) {
        if (condition.includes(c)) {
            matchedCondition = c;
            break;
        }
    }
    if (condition.includes('clear')) matchedCondition = 'sunny';
    body.classList.add(matchedCondition);
}

function renderHourlyForecast(hourlyData) {
    elements.hourlyForecast.innerHTML = '';
    const next8Hours = hourlyData.slice(0, 8);

    next8Hours.forEach(item => {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', hour12: true });
        const temp = `${Math.round(item.main.temp)}°`;
        const icon = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;

        card.innerHTML = `<p>${time}</p><img src="${icon}" alt="${item.weather[0].description}"><p>${temp}</p>`;
        elements.hourlyForecast.appendChild(card);
    });
}

function updateAIInsights(weather) {
    const suggestion = getAIWeatherSuggestion(weather);
    elements.aiMessage.textContent = suggestion;
}

// Event Listeners
elements.searchBtn.addEventListener('click', () => {
    const city = elements.searchInput.value;
    if (city) fetchWeatherData(city);
});

elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') elements.searchBtn.click();
});

elements.geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        handleError("Geolocation is not supported by your browser.");
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => {
            fetchWeatherDataByCoords(position.coords.latitude, position.coords.longitude);
        },
        () => {
            handleError("Unable to retrieve your location. Please enable location services.");
        }
    );
});

if (elements.sidebarNav) {
    elements.sidebarNav.addEventListener('click', (e) => {
        const target = e.target.closest('li');
        if (!target) return;
        e.preventDefault();
        const currentlyActive = elements.sidebarNav.querySelector('.active');
        if (currentlyActive) currentlyActive.classList.remove('active');
        target.classList.add('active');
    });
}

window.addEventListener('load', () => {
    const lastCity = localStorage.getItem(LAST_CITY_KEY);
    if (lastCity) {
        fetchWeatherData(lastCity);
    } else {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeatherDataByCoords(position.coords.latitude, position.coords.longitude);
            },
            () => {
                fetchWeatherData("New Delhi"); // Default city
            }
        );
    }
});