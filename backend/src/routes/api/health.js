const express = require('express');
const router = express.Router();

// GET /v1/health
router.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;
