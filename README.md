# Simple Weather App

A simple weather web app that displays current weather and a 5-day forecast using OpenWeatherMap. Built with HTML, CSS, and vanilla JavaScript. Includes an optional small Flask proxy to hide your OpenWeather API key for production.

## Features
- Search weather by city
- 5-day forecast (aggregated from 3-hour slices)
- Geolocation-based weather
- Unit toggle (°C / °F)
- Caching (localStorage + in-memory) with TTL
- Debounced search + abort previous requests + timeout handling

## How to run (static, local, quick)
1. Clone this repo.
2. Option A — local quick test (client-side API key):
   - Open `script.js` and replace `YOUR_API_KEY` with your OpenWeatherMap API key.
   - Open `index.html` in a browser (or serve using `python -m http.server`).
3. Option B — using the Flask proxy (recommended for deployment):
   - Create a virtual env: `python -m venv venv && source venv/bin/activate` (Windows use `venv\Scripts\activate`)
   - Install: `pip install -r requirements.txt`
   - Set environment variable: `export OPENWEATHER_API_KEY="your_key"` (Windows: `set OPENWEATHER_API_KEY=your_key`)
   - Start server: `python app.py` (or `gunicorn app:app` for production)
   - In `script.js` set `PROXY_ENABLED = true` and `PROXY_PREFIX = 'https://your-deployed-proxy.com'` or leave as `/api` for same-host.
   - Serve `index.html` from a static host (or from the same Flask app with `send_from_directory`) and point API calls to proxy.

## Deployment suggestions
- Static-only demo: GitHub Pages (not secure for API key).
- Secure demo (recommended): Deploy `app.py` to Render/Heroku/Railway and host frontend (or serve frontend from same service). This keeps your API key secret.

## Testing & Performance
- Test on latest Chrome/Firefox/Edge/Safari and mobile browsers.
- Use Chrome DevTools Lighthouse to check performance/accessibility.
- Network throttling & offline tests.
- Caching TTL is 10 minutes (adjustable in `script.js`).

## Notes
- The project uses OpenWeatherMap free tier endpoints (current weather & 5-day/3-hour forecast). Check their terms and rate limits.
- For production, keep your API key server-side and enable rate-limiting on proxy.

## License
MIT
