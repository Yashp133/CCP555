'use strict';

/**
 * In-memory data strategy.
 * Stores BOTH fragment metadata and raw bytes.
 *
 * Required async functions:
 *  - readFragment(ownerId, id)
 *  - writeFragment(meta)
 *  - readFragmentData(ownerId, id)
 *  - writeFragmentData(ownerId, id, data)
 * (We also add:)
 *  - listFragments(ownerId)
 *  - deleteFragment(ownerId, id)
 *  - _clearAll()  // test helper
 */

// Internal stores
const metas = new Map(); // key -> { id, ownerId, type, size, created, updated }
const datas = new Map(); // key -> Buffer

const key = (ownerId, id) => `${ownerId}:${id}`;

// --- Metadata ---
async function readFragment(ownerId, id) {
  const v = metas.get(key(ownerId, id));
  return v ? { ...v } : null;
}

async function writeFragment(meta) {
  // expect: { id, ownerId, type, size, created, updated }
  if (!meta || !meta.id || !meta.ownerId) {
    throw new Error('writeFragment(meta) requires id and ownerId');
  }
  metas.set(key(meta.ownerId, meta.id), { ...meta });
  return { ...meta };
}

// --- Raw Data ---
async function readFragmentData(ownerId, id) {
  const v = datas.get(key(ownerId, id));
  return v ? Buffer.from(v) : null;
}

async function writeFragmentData(ownerId, id, data) {
  if (!Buffer.isBuffer(data)) {
    throw new Error('writeFragmentData requires a Buffer');
  }
  datas.set(key(ownerId, id), Buffer.from(data));
}

// --- Helpers for routes/tests ---
async function listFragments(ownerId) {
  const ids = [];
  const prefix = `${ownerId}:`;
  for (const k of metas.keys()) {
    if (k.startsWith(prefix)) {
      ids.push(k.slice(prefix.length));
    }
  }
  return ids;
}

async function deleteFragment(ownerId, id) {
  const k = key(ownerId, id);
  const a = metas.delete(k);
  const b = datas.delete(k);
  return a || b;
}

// test helper
function _clearAll() {
  metas.clear();
  datas.clear();
}

module.exports = {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
  _clearAll,
};
