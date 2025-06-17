require('dotenv').config();
const app = require('./app');
const logger = require('./logger');

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  logger.info({ port: PORT }, 'Server started and listening on 0.0.0.0');
});
