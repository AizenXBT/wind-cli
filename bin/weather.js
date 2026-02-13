#!/usr/bin/env node

const axios = require('axios');

const API_KEY = process.env.WEATHER_API_KEY || 'YOUR_API_KEY_HERE';
const BASE_URL = 'http://api.weatherapi.com/v1';

function showAsciiArt() {
  const asciiArt = `
    ██╗   ██╗███████╗ █████╗ ██████╗ 
    ██║   ██║██╔════╝██╔══██╗██╔══██╗
    ██║   ██║█████╗  ███████║██║  ██║
    ╚██╗ ██╔╝██╔══╝  ██╔══██║██║  ██║
     ╚████╔╝ ███████╗██║  ██║██████╔╝
      ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝ 
             CLI Weather App
  `;
  console.log(asciiArt);
}

function handleApiError(error, city) {
  if (error.response) {
    switch (error.response.status) {
      case 400:
        console.error(`❌ City "${city}" not found. Please check the spelling and try again.`);
        break;
      case 403:
        console.error('❌ Invalid API key. Please set your WeatherAPI key in the WEATHER_API_KEY environment variable.');
        break;
      default:
        console.error(`❌ Error fetching weather data: ${error.message}`);
    }
  } else {
    console.error('❌ Error fetching weather data:', error.message);
  }
  process.exit(1);
}

async function getWeatherData(endpoint, params) {
  try {
    return await axios.get(`${BASE_URL}/${endpoint}`, { params });
  } catch (error) {
    handleApiError(error, params.q);
  }
}

function displayCurrentWeather(weather, format) {
  const temp = format === 'fahrenheit' ? weather.current.temp_f : weather.current.temp_c;
  const feelsLike = format === 'fahrenheit' ? weather.current.feelslike_f : weather.current.feelslike_c;

  console.log(`
🌤️  Current Weather in ${weather.location.name}, ${weather.location.country}:`);
  console.log(`Temperature: ${temp}° ${format.toUpperCase()}`);
  console.log(`Feels Like: ${feelsLike}° ${format.toUpperCase()}`);
  console.log(`Description: ${weather.current.condition.text}`);
  console.log(`Humidity: ${weather.current.humidity}%`);
  console.log(`Wind Speed: ${weather.current.wind_kph} km/h`);
  console.log(`Pressure: ${weather.current.pressure_mb} mb`);
  console.log(`UV Index: ${weather.current.uv}`);
}

function displayForecast(forecastData, format) {
  console.log(`
📅 3-Day Forecast for ${forecastData.location.name}, ${forecastData.location.country}:`);
  console.log('--------------------------------------------------');

  forecastData.forecast.forecastday.forEach((day) => {
    const date = new Date(day.date).toLocaleDateString();
    const maxTemp = format === 'fahrenheit' ? day.day.maxtemp_f : day.day.maxtemp_c;
    const minTemp = format === 'fahrenheit' ? day.day.mintemp_f : day.day.mintemp_c;
    const condition = day.day.condition.text;

    console.log(`${date}: Max ${maxTemp}°, Min ${minTemp}° - ${condition}`);
  });
}

function parseArgs(args) {
  const options = {
    city: null,
    format: 'celsius',
    forecast: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--city' || arg === '-c') {
      options.city = args[++i];
    } else if (arg === '--format' || arg === '-f') {
      options.format = args[++i];
    } else if (arg === '--forecast' || arg === '-F') {
      options.forecast = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

async function main() {
  showAsciiArt();

  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('⚠️  Warning: No API key found. Please sign up at https://www.weatherapi.com/ and set your API key.');
    console.log('Sign up for a free account at: https://www.weatherapi.com/my/');
    console.log('Then set the environment variable: export WEATHER_API_KEY="your_api_key"');
    console.log('');
    process.exit(1);
  }

  const argv = parseArgs(process.argv.slice(2));

  if (argv.help) {
    console.log('Usage: weather [options]');
    console.log('Options:');
    console.log('  -c, --city <city>      City name to get weather for');
    console.log('  -f, --format <format>  Output format (celsius, fahrenheit)');
    console.log('  -F, --forecast         Get 3-day weather forecast');
    console.log('  -h, --help             Display this help message');
    process.exit(0);
  }

  if (!argv.city) {
    console.error('City is required. Use --city or -c to specify a city name.');
    process.exit(1);
  }

  const commonParams = { key: API_KEY, q: argv.city, aqi: 'no' };

  if (argv.forecast) {
    const response = await getWeatherData('forecast.json', { ...commonParams, days: 3 });
    if (response) displayForecast(response.data, argv.format);
  } else {
    const response = await getWeatherData('current.json', commonParams);
    if (response) displayCurrentWeather(response.data, argv.format);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('An unexpected error occurred:', error.message);
    process.exit(1);
  });
}

module.exports = {
  handleApiError,
  getWeatherData,
  displayCurrentWeather,
  displayForecast,
  main,
  parseArgs,
};