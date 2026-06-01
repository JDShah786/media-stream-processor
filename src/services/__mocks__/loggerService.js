// Manual mock used by tests (jest.mock('.../loggerService')) so the real winston
// logger never writes to disk or floods the test output.
module.exports = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};
