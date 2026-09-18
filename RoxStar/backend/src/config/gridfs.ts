import { GridFSBucket, MongoClient } from 'mongodb';

let bucket: GridFSBucket | null = null;
let client: MongoClient | null = null;

export const getGridFSBucket = async (): Promise<GridFSBucket> => {
  if (bucket) return bucket;

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/roxstar';
  client = new MongoClient(uri);
  await client.connect();

  const db = client.db();
  bucket = new GridFSBucket(db, { bucketName: 'audio' });
  return bucket;
};

export const closeGridFSConnection = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    bucket = null;
  }
};
