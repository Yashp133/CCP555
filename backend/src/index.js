require('dotenv').config();
const app = require('./app');
const logger = require('./logger');

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started');
});