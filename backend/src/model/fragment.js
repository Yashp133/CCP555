'use strict';

const { v4: uuidv4 } = require('uuid');
const data = require('./data');

// Support at least text/plain for A1, plus the types your routes already handle
const SUPPORTED = new Set([
  'text/plain',
  'text/markdown',
  'text/html',
  'application/json',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

class Fragment {
  constructor({
    ownerId,
    type,
    id = uuidv4(),
    created = new Date().toISOString(),
    updated = created,
    size = 0,
  }) {
    if (!ownerId) throw new Error('ownerId is required');
    if (!type || !Fragment.isSupportedType(type)) throw new Error('unsupported fragment type');

    this.id = id;
    this.ownerId = ownerId;
    this.type = type;       // keep original header (may include charset)
    this.created = created;
    this.updated = updated;
    this.size = size;
  }

  static isSupportedType(type) {
    const base = (type || '').split(';')[0].trim().toLowerCase();
    return SUPPORTED.has(base);
  }

  toJSON() {
    const { id, ownerId, type, created, updated, size } = this;
    return { id, ownerId, type, created, updated, size };
  }

  async save() {
    this.updated = new Date().toISOString();
    await data.writeFragment(this.toJSON());
    return this;
  }

  async setData(buffer) {
    if (!Buffer.isBuffer(buffer)) throw new Error('data must be a Buffer');
    this.size = buffer.length;
    await data.writeFragmentData(this.ownerId, this.id, buffer);
    await this.save();
  }

  async getData() {
    return data.readFragmentData(this.ownerId, this.id);
  }

  // ---- static helpers ----
  static async byId(ownerId, id) {
    const meta = await data.readFragment(ownerId, id);
    return meta ? new Fragment(meta) : null;
  }

  static async listIds(ownerId) {
    return data.listFragments(ownerId);
  }

  static async delete(ownerId, id) {
    return data.deleteFragment(ownerId, id);
  }
}

module.exports = Fragment;
