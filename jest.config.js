module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
  // The conversion flow spawns yt-dlp; integration tests only hit the API layer
  // (jobs are accepted but processing is allowed to fail in the test env), so a
  // modest timeout is plenty.
  testTimeout: 15000,
};
