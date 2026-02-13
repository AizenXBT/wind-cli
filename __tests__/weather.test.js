const axios = require('axios');
const { main } = require('../bin/weather');

jest.mock('axios');
jest.mock('yargs/yargs', () => {
  const yargs = {
    usage: jest.fn().mockReturnThis(),
    option: jest.fn().mockReturnThis(),
    check: jest.fn().mockReturnThis(),
    help: jest.fn().mockReturnThis(),
    argv: {},
  };
  return jest.fn(() => yargs);
});

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
  let yargs;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    yargs = require('yargs/yargs');
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
    yargs.argv = { city: 'London', format: 'celsius' };
    axios.get.mockResolvedValue({ data: mockWeatherData });
    await main();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Current Weather in London'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Temperature: 15° CELSIUS'));
  });

  it('should fetch and display forecast', async () => {
    yargs.argv = { city: 'London', format: 'celsius', forecast: true };
    axios.get.mockResolvedValue({ data: mockForecastData });
    await main();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('3-Day Forecast for London'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Max 16°, Min 10° - Partly cloudy'));
  });

  it('should show a warning if no API key is provided', async () => {
    delete process.env.WEATHER_API_KEY;
    yargs.argv = { city: 'London' };
    await main();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Warning: No API key found'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});