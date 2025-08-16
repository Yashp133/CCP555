const mem = require('../../src/model/data/memory');

describe('in-memory data strategy', () => {
  const ownerId = 'ownerA';
  const id = 'frag1';

  afterEach(() => mem._clearAll());

  test('write/read meta + data + list + delete', async () => {
    const meta = {
      id, ownerId, type: 'text/plain', size: 5,
      created: '2020-01-01T00:00:00.000Z', updated: '2020-01-01T00:00:00.000Z'
    };
    await mem.writeFragment(meta);
    await mem.writeFragmentData(ownerId, id, Buffer.from('hello'));

    const gotMeta = await mem.readFragment(ownerId, id);
    const gotData = await mem.readFragmentData(ownerId, id);
    const list = await mem.listFragments(ownerId);
    const del = await mem.deleteFragment(ownerId, id);

    expect(gotMeta).toMatchObject(meta);
    expect(Buffer.isBuffer(gotData)).toBe(true);
    expect(gotData.toString()).toBe('hello');
    expect(list).toContain(id);
    expect(del).toBe(true);
  });
});
