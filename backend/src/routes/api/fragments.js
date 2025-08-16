// src/routes/api/fragments.js
'use strict';

const express = require('express');
const { parse } = require('content-type');
const sharp = require('sharp');
const Fragment = require('../../model/fragment');

const router = express.Router();

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
router.post('/', async (req, res) => {
  const ctHeader = req.get('Content-Type');
  if (!ctHeader) return res.status(400).json({ status: 'error', error: 'Missing Content-Type' });

  let mime;
  try {
    mime = normalizeType(ctHeader);
  } catch {
    return res.status(400).json({ status: 'error', error: 'Invalid Content-Type' });
  }

  // Use Fragment's supported types check (A1 requires text/plain at minimum)
  if (!Fragment.isSupportedType(mime)) return res.sendStatus(415);

  let data;
  if (mime.startsWith('image/')) {
    const buf = toBufferLoose(req.body);
    if (!buf) {
      return res
        .status(400)
        .json({ status: 'error', error: 'Image body not received as binary' });
    }
    data = buf;
  } else if (mime === 'application/json') {
    data = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
  } else {
    data = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '', 'utf8');
  }

  // Create + persist via model (store original header, so charset is preserved)
  const frag = new Fragment({ ownerId: req.user, type: ctHeader });
  await frag.setData(data);

  // Location header with API_URL support
  const base = process.env.API_URL
    ? process.env.API_URL.replace(/\/+$/, '')
    : `http://${req.get('host')}`;
  const location = `${base}/v1/fragments/${frag.id}`;

  return res.status(201).set('Location', location).json({ status: 'ok', fragment: frag.toJSON() });
});

// ---------- LIST ----------
router.get('/', async (req, res) => {
  const fragments = await Fragment.listIds(req.user);
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
  const frag = await Fragment.byId(req.user, req.params.id);
  if (!frag) return res.sendStatus(404);

  const targetType = EXT_TO_TYPE[req.params.ext?.toLowerCase()];
  if (!targetType) {
    return res.status(415).json({ status: 'error', error: 'Unsupported target extension' });
  }

  const srcType = normalizeType(frag.type);
  const data = await frag.getData();

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
router.get('/:id', async (req, res) => {
  const frag = await Fragment.byId(req.user, req.params.id);
  if (!frag) return res.sendStatus(404);
  const data = await frag.getData();
  res.set('Content-Type', frag.type);
  res.send(data);
});

// ---------- DELETE ----------
router.delete('/:id', async (req, res) => {
  const ok = await Fragment.delete(req.user, req.params.id);
  if (!ok) return res.sendStatus(404);
  res.json({ status: 'ok' });
});

module.exports = router;
