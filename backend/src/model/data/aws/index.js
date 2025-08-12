const s3Client = require('./s3Client');
const ddbDocClient = require('./ddbDocClient');

// AWS SDK imports for S3
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

// AWS SDK imports for DynamoDB
const {
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');

// Convert stream to Buffer for reading from S3
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk)); // collect data
    stream.on('error', reject); // handle error
    stream.on('end', () => resolve(Buffer.concat(chunks))); // finish
  });

// Save fragment metadata to DynamoDB
function writeFragment(fragment) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Item: fragment,
  };
  return ddbDocClient.send(new PutCommand(params));
}

// Get fragment metadata from DynamoDB
async function readFragment(ownerId, id) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: { ownerId, id },
  };
  const data = await ddbDocClient.send(new GetCommand(params));
  return data?.Item;
}

// List all fragments for a user (IDs only or expanded)
async function listFragments(ownerId, expand = false) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    KeyConditionExpression: 'ownerId = :ownerId',
    ExpressionAttributeValues: { ':ownerId': ownerId },
  };

  if (!expand) {
    params.ProjectionExpression = 'id'; // return only IDs
  }

  const data = await ddbDocClient.send(new QueryCommand(params));
  return !expand ? data.Items.map((item) => item.id) : data.Items;
}

// Save fragment data to S3
async function writeFragmentData(ownerId, id, data) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
    Body: data,
  };
  await s3Client.send(new PutObjectCommand(params));
}

// Read fragment data from S3
async function readFragmentData(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };
  const data = await s3Client.send(new GetObjectCommand(params));
  return streamToBuffer(data.Body);
}

// Delete fragment metadata from DynamoDB and data from S3
async function deleteFragment(ownerId, id) {
  await ddbDocClient.send(
    new DeleteCommand({
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
      Key: { ownerId, id },
    })
  );

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${ownerId}/${id}`,
    })
  );
}

// Export functions for use in API
module.exports = {
  writeFragment,
  readFragment,
  listFragments,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
};
