// src/model/content-types.js
const { parse } = require('content-type');

// All content types your API will accept on POST
const SUPPORTED = new Set([
  'text/plain',
  'text/markdown',
  'text/html',
  'application/json',
  'image/png',
  'image/jpeg',
  'image/webp',
  // Add more only if you actually convert them via sharp:
  // 'image/avif',
]);

function normalize(headerValue) {
  // Strips any "; charset=..." etc.
  return parse(headerValue).type;
}

function isSupported(headerValue) {
  try {
    return SUPPORTED.has(normalize(headerValue));
  } catch {
    return false;
  }
}

function isImage(typeOrHeader) {
  const t = typeOrHeader.includes('/') ? normalize(typeOrHeader) : typeOrHeader;
  return t.startsWith('image/');
}

module.exports = { SUPPORTED, normalize, isSupported, isImage };
