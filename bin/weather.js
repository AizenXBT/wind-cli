#!/usr/bin/env node

const axios = require('axios');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// OpenWeatherMap API configuration - users need to get their own API key
const API_KEY = process.env.OPENWEATHER_API_KEY || 'YOUR_API_KEY_HERE';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

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
    describe: 'Output format (celsius, fahrenheit, kelvin)',
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

// Function to convert temperature based on user preference
function convertTemp(kelvin, format) {
  switch(format.toLowerCase()) {
    case 'fahrenheit':
      return ((kelvin - 273.15) * 9/5 + 32).toFixed(1);
    case 'celsius':
      return (kelvin - 273.15).toFixed(1);
    case 'kelvin':
    default:
      return kelvin.toFixed(2);
  }
}

// Function to get current weather
async function getCurrentWeather(city) {
  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: city,
       appid: API_KEY
      }
    });

    const weather = response.data;
    const temp = convertTemp(weather.main.temp, argv.format);
    const feelsLike = convertTemp(weather.main.feels_like, argv.format);
    
    console.log(`\n🌤️  Current Weather in ${weather.name}, ${weather.sys.country}:`);
    console.log(`Temperature: ${temp}° ${argv.format.toUpperCase()}`);
    console.log(`Feels Like: ${feelsLike}° ${argv.format.toUpperCase()}`);
    console.log(`Description: ${weather.weather[0].main} - ${weather.weather[0].description}`);
    console.log(`Humidity: ${weather.main.humidity}%`);
    console.log(`Wind Speed: ${weather.wind.speed} m/s`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error(\`❌ City \"${argv.city}\" not found. Please check the spelling and try again.\`);
    } else if (error.response && error.response.status === 401) {
      console.error('❌ Invalid API key. Please set your OpenWeatherMap API key in the OPENWEATHER_API_KEY environment variable.');
    } else {
      console.error('❌ Error fetching weather data:', error.message);
    }
    process.exit(1);
  }
}

// Function to get 5-day forecast
async function getForecast(city) {
  try {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        q: city,
        appid: API_KEY
      }
    });

    const forecasts = response.data.list.slice(0, 5); // Get next 5 timestamps
    
    console.log(\`\n📅 5-Day Forecast for ${response.data.city.name}, ${response.data.city.country}:\`);
    console.log('--------------------------------------------------');
    
    forecasts.forEach((item, index) => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      const time = new Date(item.dt * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const temp = convertTemp(item.main.temp, argv.format);
      
      console.log(\`${date} ${time}: ${temp}° ${argv.format.toUpperCase()} - ${item.weather[0].main} (\${item.weather[0].description})\`);
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error(\`❌ City \"${argv.city}\" not found. Please check the spelling and try again.\`);
    } else if (error.response && error.response.status === 401) {
      console.error('❌ Invalid API key. Please set your OpenWeatherMap API key in the OPENWEATHER_API_KEY environment variable.');
    } else {
      console.error('❌ Error fetching forecast data:', error.message);
    }
    process.exit(1);
  }
}

// Main execution
async function main() {
  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('⚠️  Warning: No API key found. Please sign up at https://openweathermap.org/api and set your API key.');
    console.log('Set it as an environment variable: export OPENWEATHER_API_KEY=\"your_api_key\"\n');
  }

  if (argv.forecast) {
    await getForecast(argv.city);
  } else {
    await getCurrentWeather(argv.city);
  }
}

// Run the application
main();