const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Set a dummy API key for the test environment
process.env.WEATHER_API_KEY = 'test_key';

describe('Weather CLI', () => {
  it('should fetch and display current weather in Celsius by default', async () => {
    const { stdout } = await execAsync('node bin/weather.js --city London');
    expect(stdout).toContain('Current Weather in London');
    expect(stdout).toContain('CELSIUS');
  }, 10000);

  it('should fetch and display current weather in Fahrenheit', async () => {
    const { stdout } = await execAsync('node bin/weather.js --city London --format fahrenheit');
    expect(stdout).toContain('Current Weather in London');
    expect(stdout).toContain('FAHRENHEIT');
  }, 10000);

  it('should fetch and display 3-day forecast', async () => {
    const { stdout } = await execAsync('node bin/weather.js --city London --forecast');
    expect(stdout).toContain('3-Day Forecast for London');
  }, 10000);

  const axios = require('axios');
const {
  displayCurrentWeather,
  displayForecast,
  handleApiError,
} = require('../bin/weather');

jest.mock('axios');

const mockWeatherData = {
  location: { name: 'London', country: 'United Kingdom' },
  current: {
    temp_c: 15,
    temp_f: 59,
    feelslike_c: 14,
    feelslike_f: 57,
    condition: { text: 'Sunny' },
    humidity: 50,
    wind_kph: 10,
    pressure_mb: 1012,
    uv: 5,
  },
};

const mockForecastData = {
  location: { name: 'London', country: 'United Kingdom' },
  forecast: {
    forecastday: [
      {
        date: '2026-02-13',
        day: {
          maxtemp_c: 16,
          maxtemp_f: 61,
          mintemp_c: 10,
          mintemp_f: 50,
          condition: { text: 'Partly cloudy' },
        },
      },
    ],
  },
};

describe('Weather CLI', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('should display current weather correctly', () => {
    displayCurrentWeather(mockWeatherData, 'celsius');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Current Weather in London'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Temperature: 15° CELSIUS'));
  });

  it('should display forecast correctly', () => {
    displayForecast(mockForecastData, 'celsius');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('3-Day Forecast for London'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Max 16°, Min 10° - Partly cloudy'));
  });

  it('should handle 400 error correctly', () => {
    const error = { response: { status: 400 } };
    handleApiError(error, 'UnknownCity');
    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ City "UnknownCity" not found. Please check the spelling and try again.');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle 403 error correctly', () => {
    const error = { response: { status: 403 } };
    handleApiError(error, 'London');
    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Invalid API key. Please set your WeatherAPI key in the WEATHER_API_KEY environment variable.');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});

  it('should show a warning if no API key is provided', async () => {
    const originalApiKey = process.env.WEATHER_API_KEY;
    delete process.env.WEATHER_API_KEY;
    try {
      const { stdout, stderr } = await execAsync('node bin/weather.js --city London');
      // In this case, the script should exit with a warning.
      // Depending on how the script is written, the warning might go to stdout or stderr.
      const output = stdout + stderr;
      expect(output).toContain('Warning: No API key found');
    } finally {
      process.env.WEATHER_API_KEY = originalApiKey;
    }
  }, 10000);
});