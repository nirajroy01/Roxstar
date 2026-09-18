import { GridFSBucket, MongoClient } from 'mongodb';

let bucket: GridFSBucket | null = null;

export const getGridFSBucket = async (): Promise<GridFSBucket> => {
  if (bucket) return bucket;

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/roxstar';
  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db();
  bucket = new GridFSBucket(db, { bucketName: 'audio' });
  return bucket;
};
