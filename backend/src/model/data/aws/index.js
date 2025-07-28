const s3Client = require('./s3Client');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../../../logger');

// TEMP: Use memory backend for metadata until DynamoDB is added
const MemoryDB = require('../memory/index');

// Convert S3 stream to buffer
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

// Write fragment data to S3
async function writeFragmentData(ownerId, id, data) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
    Body: data,
  };
  try {
    await s3Client.send(new PutObjectCommand(params));
  } catch (err) {
    logger.error({ err, Bucket: params.Bucket, Key: params.Key }, 'S3 upload failed');
    throw new Error('S3 upload failed');
  }
}

// Read fragment data from S3
async function readFragmentData(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };
  try {
    const { Body } = await s3Client.send(new GetObjectCommand(params));
    return streamToBuffer(Body);
  } catch (err) {
    logger.error({ err, Bucket: params.Bucket, Key: params.Key }, 'S3 read failed');
    throw new Error('S3 read failed');
  }
}

// Delete fragment data from S3
async function deleteFragmentData(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };
  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (err) {
    logger.error({ err, Bucket: params.Bucket, Key: params.Key }, 'S3 delete failed');
    throw new Error('S3 delete failed');
  }
}

// Export all methods (S3 + memory metadata)
module.exports = {
  ...MemoryDB,
  writeFragmentData,
  readFragmentData,
  deleteFragmentData,
};
