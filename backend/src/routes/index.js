const express = require('express');
const router = express.Router();
const { version, author } = require('../../package.json');
const { createSuccessResponse } = require('../response');
const { authenticate } = require('../auth');

// Health route (no auth needed)
router.get('/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json(createSuccessResponse({
    version,
    author,
    githubUrl: 'https://github.com/Yashp133/CCP555'
  }));
});

router.use('/v1', authenticate(), require('./api'));

module.exports = router;
