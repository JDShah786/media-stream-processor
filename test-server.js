const app = require('./src/app');
const logger = require('./src/services/loggerService');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`✅ Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = server;
