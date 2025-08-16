'use strict';

// Simple in-memory KV store
const _db = new Map();

// Key helpers
const keyMeta = (ownerId, id) => `${ownerId}:${id}:meta`;
const keyData = (ownerId, id) => `${ownerId}:${id}:data`;

module.exports = {
  // metadata: { id, ownerId, type, size, created, updated }
  putFragmentMeta: async (ownerId, id, meta) => {
    _db.set(keyMeta(ownerId, id), { ...meta });
  },

  getFragmentMeta: async (ownerId, id) => {
    return _db.get(keyMeta(ownerId, id)) || null;
  },

  putFragmentData: async (ownerId, id, buf) => {
    _db.set(keyData(ownerId, id), Buffer.from(buf));
  },

  getFragmentData: async (ownerId, id) => {
    return _db.get(keyData(ownerId, id)) || null;
  },

  listIdsForOwner: async (ownerId) => {
    const ids = [];
    for (const k of _db.keys()) {
      if (k.startsWith(`${ownerId}:`) && k.endsWith(':meta')) {
        ids.push(k.split(':')[1]);
      }
    }
    return ids;
  },

  deleteFragment: async (ownerId, id) => {
    const a = _db.delete(keyMeta(ownerId, id));
    const b = _db.delete(keyData(ownerId, id));
    return a || b;
  },

  // for tests
  _clearAll: () => _db.clear(),
};
