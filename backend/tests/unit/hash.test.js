// backend/tests/unit/hash.test.js
const { hash } = require('../../src/hash');

describe('hash()', () => {
  test('is deterministic and lowercases/trim-normalizes input', () => {
    const a = hash(' User@Example.com ');
    const b = hash('user@example.com');
    expect(a).toBe(b);
  });

  test('returns a 64-char hex string', () => {
    const h = hash('user@example.com');
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  test('handles empty/undefined safely', () => {
    const a = hash('');
    const b = hash(undefined);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(b).toMatch(/^[a-f0-9]{64}$/);
  });
});
