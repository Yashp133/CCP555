// src/routes/api/fragments.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// in‑memory store { "<ownerId>:<id>": { data, type } }
const store = new Map();

//
// POST /v1/fragments
//
router.post('/fragments', (req, res) => {
  // full Content-Type (may include charset)
  const contentType = req.get('Content-Type') || '';
  // just the mime, without charset
  const mime = contentType.split(';')[0].trim();

  // only allow text/plain or application/json
  if (!['text/plain', 'application/json'].includes(mime)) {
    return res.sendStatus(415);
  }

  // body is either a string (text) or a JS object (json)
  let raw = req.body;
  // if JSON parser gave us an object, re‑stringify it
  const data = (mime === 'application/json' && typeof raw === 'object')
    ? JSON.stringify(raw)
    : raw;

  const id  = uuidv4();
  const now = new Date().toISOString();

  // metadata
  const fragment = {
    id,
    created: now,
    updated: now,
    ownerId: req.user,           // your authenticate() middleware must set req.user
    type: contentType,           // include charset if present
    size: Buffer.byteLength(data),
  };

  // save the raw data & type
  store.set(`${req.user}:${id}`, { data, type: contentType });

  // tell the client where to GET it
  const location = `${req.protocol}://${req.get('host')}/v1/fragments/${id}`;
  res
    .status(201)
    .location(location)
    .json({ status: 'ok', fragment });
});

//
// GET /v1/fragments/:id
//
router.get('/fragments/:id', (req, res) => {
  const key = `${req.user}:${req.params.id}`;
  if (!store.has(key)) {
    return res.sendStatus(404);
  }
  const { data, type } = store.get(key);
  res.set('Content-Type', type);
  res.send(data);
});

module.exports = router;
