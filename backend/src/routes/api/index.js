const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

// Body parser configuration
router.use(bodyParser.json());    // for application/json
router.use(bodyParser.text({     // for text/plain
  type: ['text/plain', 'text/markdown', 'text/html']
}));

// Raw body parser for binary data (images)
router.use(bodyParser.raw({
  type: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  limit: '10mb'  // Adjust based on your needs
}));

// Routes
router.use('/health', require('./health'));
router.use('/fragments', require('./fragments'));

module.exports = router;