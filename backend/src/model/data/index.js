// Use AWS backend if AWS_REGION is set, otherwise use in-memory
module.exports = process.env.AWS_REGION ? require('./aws') : require('./memory');
