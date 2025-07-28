const fragments = {}; // { ownerId: { fragmentId: Buffer } }

function writeFragmentData(ownerId, id, data) {
  if (!fragments[ownerId]) fragments[ownerId] = {};
  fragments[ownerId][id] = data;
  return Promise.resolve();
}

function readFragmentData(ownerId, id) {
  if (fragments[ownerId] && fragments[ownerId][id]) {
    return Promise.resolve(fragments[ownerId][id]);
  } else {
    return Promise.reject(new Error('Fragment not found'));
  }
}

function deleteFragmentData(ownerId, id) {
  if (fragments[ownerId] && fragments[ownerId][id]) {
    delete fragments[ownerId][id];
    return Promise.resolve();
  } else {
    return Promise.reject(new Error('Fragment not found'));
  }
}

module.exports = {
  writeFragmentData,
  readFragmentData,
  deleteFragmentData,
};
