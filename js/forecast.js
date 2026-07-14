function render8DayForecast(dailyData, forecastList) {
  forecastList.innerHTML = '';
  dailyData.slice(0, 8).forEach(day => {
    const maxTemp = Math.round(day.temp.max);
    const minTemp = Math.round(day.temp.min);
    const avgPop = day.pop * 100;
    const maxWind = (day.wind_speed * 3.6).toFixed(1);
    const icon = day.weather[0].icon;
    const dayName = new Date(day.dt * 1000).toLocaleDateString([], { weekday: 'long' });

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
    forecastList.appendChild(listItem);
  });
}

export { render8DayForecast };
