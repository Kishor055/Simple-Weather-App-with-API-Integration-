function getAIWeatherSuggestion(weather) {
  const temp = weather.main.temp;
  const condition = weather.weather[0].main.toLowerCase();
  const windSpeed = weather.wind.speed;

  if (condition.includes('rain')) {
    return "It's raining. Don't forget your umbrella and a waterproof jacket. Be careful on the roads as they might be slippery.";
  }
  if (condition.includes('thunderstorm')) {
    return "A thunderstorm is active. It's best to stay indoors and avoid using electronic devices. Postpone any travel until the storm passes.";
  }
  if (temp > 30) {
    return "It's a hot day. Stay hydrated by drinking plenty of water. Wear light and loose-fitting clothing. Avoid strenuous activities during the hottest part of the day.";
  }
  if (temp < 10) {
    return "It's cold outside. Wear a warm coat, hat, and gloves. Be aware of the risk of hypothermia if you are exposed to the cold for a long time.";
  }
  if (windSpeed > 15) {
    return "It's a windy day. Secure any loose objects in your yard. Be careful when driving, especially high-sided vehicles.";
  }
  if (condition.includes('clear')) {
    return "It's a beautiful clear day. Perfect for outdoor activities. Don't forget to wear sunscreen to protect your skin from the sun's harmful rays.";
  }
  if (condition.includes('clouds')) {
    return "It's a cloudy day, but still pleasant. A good day for a walk or a bike ride.";
  }
  return "Enjoy your day! Check the detailed forecast for more information.";
}

export { getAIWeatherSuggestion };
