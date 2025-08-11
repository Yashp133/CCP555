// src/routes/api/fragments.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { parse } = require('content-type');
const sharp = require('sharp');

const router = express.Router();

// In-memory store { "<ownerId>:<id>": { data: Buffer, type: string } }
const store = new Map();

const SUPPORTED = new Set([
  'text/plain',
  'text/markdown',
  'text/html',
  'application/json',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

function normalizeType(headerValue) {
  return parse(headerValue).type; // strips parameters like "; charset=utf-8"
}

function toBufferLoose(body) {
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (body && body.buffer instanceof ArrayBuffer) return Buffer.from(body.buffer);
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  if (body && body.type === 'Buffer' && Array.isArray(body.data)) return Buffer.from(body.data);
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const vals = Object.values(body);
    if (vals.length && vals.every((v) => Number.isInteger(v) && v >= 0 && v <= 255)) {
      return Buffer.from(vals);
    }
  }
  if (typeof body === 'string') return Buffer.from(body, 'binary');
  return null;
}

// ---------- CREATE ----------
router.post('/', (req, res) => {
  const ctHeader = req.get('Content-Type');
  if (!ctHeader) return res.status(400).json({ status: 'error', error: 'Missing Content-Type' });

  let mime;
  try { mime = normalizeType(ctHeader); }
  catch { return res.status(400).json({ status: 'error', error: 'Invalid Content-Type' }); }

  if (!SUPPORTED.has(mime)) return res.sendStatus(415);

  let data;
  if (mime.startsWith('image/')) {
    const buf = toBufferLoose(req.body);
    if (!buf) return res.status(400).json({ status: 'error', error: 'Image body not received as binary' });
    data = buf;
  } else if (mime === 'application/json') {
    data = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
  } else {
    data = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '', 'utf8');
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  const ownerId = req.user;

  store.set(`${ownerId}:${id}`, { data, type: ctHeader });

  const fragment = { id, created: now, updated: now, ownerId, type: ctHeader, size: data.length };
  const location = `${req.protocol}://${req.get('host')}/v1/fragments/${id}`;
  return res.status(201).location(location).json({ status: 'ok', fragment });
});

// ---------- LIST ----------
router.get('/', (req, res) => {
  const fragments = [];
  for (const [key] of store.entries()) {
    if (key.startsWith(`${req.user}:`)) fragments.push(key.split(':')[1]);
  }
  res.json({ status: 'ok', fragments });
});

// ---------- GET (with conversion via .ext) ----------
const EXT_TO_TYPE = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const TYPE_TO_SHARP = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};

router.get('/:id.:ext', async (req, res) => {
  const key = `${req.user}:${req.params.id}`;
  if (!store.has(key)) return res.sendStatus(404);

  const targetType = EXT_TO_TYPE[req.params.ext?.toLowerCase()];
  if (!targetType) return res.status(415).json({ status: 'error', error: 'Unsupported target extension' });

  const { data, type } = store.get(key);
  const srcType = normalizeType(type);

  // Only allow image↔image here
  if (!srcType.startsWith('image/') || !targetType.startsWith('image/')) {
    return res.status(415).json({ status: 'error', error: 'Only image conversions supported here' });
  }

  // No conversion needed
  if (srcType === targetType) {
    res.set('Content-Type', targetType);
    return res.send(data);
  }

  const format = TYPE_TO_SHARP[targetType];
  if (!format) return res.status(415).json({ status: 'error', error: 'Target format not supported' });

  try {
    const out = await sharp(data)[format]().toBuffer();
    res.set('Content-Type', targetType);
    return res.send(out);
  } catch (e) {
    return res.status(500).json({ status: 'error', error: `Conversion failed: ${e.message}` });
  }
});

// ---------- GET (raw, no conversion) ----------
router.get('/:id', (req, res) => {
  const key = `${req.user}:${req.params.id}`;
  if (!store.has(key)) return res.sendStatus(404);
  const { data, type } = store.get(key);
  res.set('Content-Type', type);
  res.send(data);
});

// ---------- DELETE ----------
router.delete('/:id', (req, res) => {
  const key = `${req.user}:${req.params.id}`;
  if (!store.has(key)) return res.sendStatus(404);
  store.delete(key);
  res.json({ status: 'ok' });
});

module.exports = router;
