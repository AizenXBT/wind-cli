const { parseArgs, main } = require('../bin/weather');
const axios = require('axios');

jest.mock('axios');

const mockWeatherData = {
  data: {
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
  },
};

const mockForecastData = {
  data: {
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
  },
};

describe('Argument Parser', () => {
  it('should parse city and format arguments', () => {
    const args = ['--city', 'London', '--format', 'fahrenheit'];
    const options = parseArgs(args);
    expect(options.city).toBe('London');
    expect(options.format).toBe('fahrenheit');
  });

  it('should handle forecast argument', () => {
    const args = ['--forecast'];
    const options = parseArgs(args);
    expect(options.forecast).toBe(true);
  });

  it('should handle help argument', () => {
    const args = ['--help'];
    const options = parseArgs(args);
    expect(options.help).toBe(true);
  });

  it('should handle short arguments', () => {
    const args = ['-c', 'New York', '-f', 'celsius', '-F'];
    const options = parseArgs(args);
    expect(options.city).toBe('New York');
    expect(options.format).toBe('celsius');
    expect(options.forecast).toBe(true);
  });
});

describe('Weather CLI', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    process.env.WEATHER_API_KEY = 'test_key';
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    jest.clearAllMocks();
    delete process.env.WEATHER_API_KEY;
  });

  it('should fetch and display current weather', async () => {
    process.argv = ['node', 'weather.js', '--city', 'London'];
    axios.get.mockResolvedValue(mockWeatherData);
    await main();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Current Weather in London'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Temperature: 15° CELSIUS'));
  });

  it('should fetch and display forecast', async () => {
    process.argv = ['node', 'weather.js', '--city', 'London', '--forecast'];
    axios.get.mockResolvedValue(mockForecastData);
    await main();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('3-Day Forecast for London'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Max 16°, Min 10° - Partly cloudy'));
  });

  it('should show a warning if no API key is provided', async () => {
    delete process.env.WEATHER_API_KEY;
    process.argv = ['node', 'weather.js', '--city', 'London'];
    axios.get.mockResolvedValue(mockWeatherData); // Mock the API call
    await main();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Warning: No API key found'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});