// src/routes/api/index.js
const express = require('express');
const router = express.Router();

// all /v1 routes go here
router.use(require('./fragments'));

module.exports = router;
