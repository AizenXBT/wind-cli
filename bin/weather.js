#!/usr/bin/env node

const axios = require('axios');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// WeatherAPI configuration - users need to get their own API key
const API_KEY = process.env.WEATHER_API_KEY || 'YOUR_API_KEY_HERE';
const BASE_URL = 'http://api.weatherapi.com/v1';

// Configure yargs for command line interface
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .option('city', {
    alias: 'c',
    describe: 'City name to get weather for',
    type: 'string',
    demandOption: true
  })
  .option('format', {
    alias: 'f',
    describe: 'Output format (celsius, fahrenheit)',
    type: 'string',
    default: 'celsius'
  })
  .option('forecast', {
    alias: 'F',
    describe: 'Get 5-day weather forecast',
    type: 'boolean',
    default: false
  })
  .help()
  .argv;

// Function to get current weather
async function getCurrentWeather(city) {
  try {
    const response = await axios.get(`${BASE_URL}/current.json`, {
      params: {
        key: API_KEY,
        q: city,
        aqi: 'no'
      }
    });

    const weather = response.data;
    const temp = argv.format === 'fahrenheit' ? weather.current.temp_f : weather.current.temp_c;
    const feelsLike = argv.format === 'fahrenheit' ? weather.current.feelslike_f : weather.current.feelslike_c;
    
    console.log(`
🌤️  Current Weather in ${weather.location.name}, ${weather.location.country}:`);
    console.log(`Temperature: ${temp}° ${argv.format.toUpperCase()}`);
    console.log(`Feels Like: ${feelsLike}° ${argv.format.toUpperCase()}`);
    console.log(`Description: ${weather.current.condition.text}`);
    console.log(`Humidity: ${weather.current.humidity}%`);
    console.log(`Wind Speed: ${weather.current.wind_kph} km/h`);
    console.log(`Pressure: ${weather.current.pressure_mb} mb`);
    console.log(`UV Index: ${weather.current.uv}`);
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.error(`❌ City "${argv.city}" not found. Please check the spelling and try again.`);
    } else if (error.response && error.response.status === 403) {
      console.error('❌ Invalid API key. Please set your WeatherAPI key in the WEATHER_API_KEY environment variable.');
    } else {
      console.error('❌ Error fetching weather data:', error.message);
    }
    process.exit(1);
  }
}

// Function to get 3-day forecast (WeatherAPI free tier allows up to 3 days)
async function getForecast(city) {
  try {
    const response = await axios.get(`${BASE_URL}/forecast.json`, {
      params: {
        key: API_KEY,
        q: city,
        days: 3,
        aqi: 'no'
      }
    });

    const forecasts = response.data.forecast.forecastday;
    
    console.log(`
📅 3-Day Forecast for ${response.data.location.name}, ${response.data.location.country}:`);
    console.log('--------------------------------------------------');
    
    forecasts.forEach((day) => {
      const date = new Date(day.date).toLocaleDateString();
      const maxTemp = argv.format === 'fahrenheit' ? day.day.maxtemp_f : day.day.maxtemp_c;
      const minTemp = argv.format === 'fahrenheit' ? day.day.mintemp_f : day.day.mintemp_c;
      const condition = day.day.condition.text;
      
      console.log(`${date}: Max ${maxTemp}°, Min ${minTemp}° - ${condition}`);
    });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.error(`❌ City "${argv.city}" not found. Please check the spelling and try again.`);
    } else if (error.response && error.response.status === 403) {
      console.error('❌ Invalid API key. Please set your WeatherAPI key in the WEATHER_API_KEY environment variable.');
    } else {
      console.error('❌ Error fetching forecast data:', error.message);
    }
    process.exit(1);
  }
}

// Main execution
async function main() {
  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('⚠️  Warning: No API key found. Please sign up at https://www.weatherapi.com/ and set your API key.');
    console.log('Sign up for a free account at: https://www.weatherapi.com/my/');
    console.log('Then set the environment variable: export WEATHER_API_KEY="your_api_key"

');
  }

  if (argv.forecast) {
    await getForecast(argv.city);
  } else {
    await getCurrentWeather(argv.city);
  }
}

// Run the application
main();