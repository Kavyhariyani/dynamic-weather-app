// We are using Open-Meteo API which is 100% FREE and requires NO API KEY!
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const locationBtn = document.getElementById('locationBtn');

// UI States
const weatherInfo = document.getElementById('weatherInfo');
const initialState = document.getElementById('initialState');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');

// Weather Data Elements
const temperature = document.getElementById('temperature');
const cityName = document.getElementById('cityName');
const weatherCondition = document.getElementById('weatherCondition');
const weatherIcon = document.getElementById('weatherIcon');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');

// Event Listeners for User Input
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim() !== '') {
        fetchWeatherByCity(searchInput.value.trim());
    }
});

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        showState('loading');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeatherByLocation(position.coords.latitude, position.coords.longitude, "Your Location");
            },
            (error) => {
                showError("Location access denied. Please search a city manually.");
            }
        );
    } else {
        showError("Geolocation is not supported by your browser.");
    }
});

// Fetch weather by searching a city name
async function fetchWeatherByCity(city) {
    showState('loading');
    try {
        // 1. Get Coordinates from City Name (Geocoding API)
        const geoResponse = await fetch(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found');
        }

        const location = geoData.results[0];

        // 2. Fetch Weather using Coordinates
        await fetchWeatherByLocation(location.latitude, location.longitude, `${location.name}, ${location.country_code || ''}`);
    } catch (error) {
        showError(error.message);
    }
}

// Fetch weather by exact coordinates
async function fetchWeatherByLocation(lat, lon, locationName = "Your Location") {
    showState('loading');
    try {
        const response = await fetch(`${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,weather_code&wind_speed_unit=kmh`);
        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }
        const data = await response.json();
        updateUI(data.current, locationName);
    } catch (error) {
        showError(error.message);
    }
}

// Update DOM with fetched data
function updateUI(currentData, locationName) {
    const temp = Math.round(currentData.temperature_2m);
    const codeInfo = interpretWeatherCode(currentData.weather_code);

    // Update Text Elements
    temperature.textContent = `${temp}°C`;
    cityName.textContent = locationName.replace(/, $/, ''); // Clean up trailing comma
    weatherCondition.textContent = codeInfo.description;
    humidity.textContent = `${currentData.relative_humidity_2m}%`;
    windSpeed.textContent = `${currentData.wind_speed_10m} km/h`;
    pressure.textContent = `${currentData.surface_pressure} hPa`;

    // Set Icon (Using public high-res icons)
    weatherIcon.src = `https://openweathermap.org/img/wn/${codeInfo.icon}@4x.png`;

    // Change Background based on condition
    changeBackground(codeInfo.main);

    showState('weather');
}

// Map WMO Weather Codes to text, background states, and icons
function interpretWeatherCode(code) {
    const weatherMap = {
        0: ['Clear sky', 'clear', '01d'],
        1: ['Mainly clear', 'clear', '02d'],
        2: ['Partly cloudy', 'clouds', '03d'],
        3: ['Overcast', 'clouds', '04d'],
        45: ['Fog', 'clouds', '50d'],
        48: ['Depositing rime fog', 'clouds', '50d'],
        51: ['Light drizzle', 'rain', '09d'],
        53: ['Moderate drizzle', 'rain', '09d'],
        55: ['Dense drizzle', 'rain', '09d'],
        56: ['Light freezing drizzle', 'rain', '09d'],
        57: ['Dense freezing drizzle', 'rain', '09d'],
        61: ['Slight rain', 'rain', '10d'],
        63: ['Moderate rain', 'rain', '10d'],
        65: ['Heavy rain', 'rain', '10d'],
        66: ['Light freezing rain', 'rain', '13d'],
        67: ['Heavy freezing rain', 'rain', '13d'],
        71: ['Slight snow fall', 'snow', '13d'],
        73: ['Moderate snow fall', 'snow', '13d'],
        75: ['Heavy snow fall', 'snow', '13d'],
        77: ['Snow grains', 'snow', '13d'],
        80: ['Slight rain showers', 'rain', '09d'],
        81: ['Moderate rain showers', 'rain', '09d'],
        82: ['Violent rain showers', 'rain', '09d'],
        85: ['Slight snow showers', 'snow', '13d'],
        86: ['Heavy snow showers', 'snow', '13d'],
        95: ['Thunderstorm', 'thunderstorm', '11d'],
        96: ['Thunderstorm with slight hail', 'thunderstorm', '11d'],
        99: ['Thunderstorm with heavy hail', 'thunderstorm', '11d'],
    };

    const mapped = weatherMap[code] || ['Unknown', 'default', '03d'];
    return {
        description: mapped[0],
        main: mapped[1],
        icon: mapped[2]
    };
}

function changeBackground(condition) {
    document.body.className = '';
    const conditionMap = {
        'clear': 'weather-clear',
        'clouds': 'weather-clouds',
        'rain': 'weather-rain',
        'thunderstorm': 'weather-thunderstorm',
        'snow': 'weather-snow',
    };

    const backgroundClass = conditionMap[condition] || 'weather-default';
    document.body.classList.add(backgroundClass);
}

function showState(state) {
    weatherInfo.classList.add('hidden');
    initialState.classList.add('hidden');
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');

    if (state === 'weather') weatherInfo.classList.remove('hidden');
    if (state === 'initial') initialState.classList.remove('hidden');
    if (state === 'loading') loadingState.classList.remove('hidden');
    if (state === 'error') errorState.classList.remove('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    showState('error');
    document.body.className = 'weather-default';
}

showState('initial');
