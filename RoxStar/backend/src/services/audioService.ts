import { ObjectId } from 'mongodb';
import { getGridFSBucket } from '../config/gridfs.js';
import Draft from '../models/Draft.js';
import RoomMember from '../models/RoomMember.js';

export const uploadAudioToDraft = async (draftId: string, fileBuffer: Buffer, mimetype: string) => {
  const draft = await Draft.findById(draftId);
  if (!draft) {
    throw new Error('Draft not found');
  }

  const bucket = await getGridFSBucket();
  const uploadStream = bucket.openUploadStream(draft.name || 'draft-audio', {
    metadata: {
      draftId: draft._id.toString(),
      mimetype,
    },
  });

  await new Promise<void>((resolve, reject) => {
    uploadStream.on('error', reject);
    uploadStream.on('finish', resolve);
    uploadStream.end(fileBuffer);
  });

  draft.audioFileId = new ObjectId(uploadStream.id);
  await draft.save();

  return draft;
};

export const getDraftAudio = async (draftId: string, userId: string) => {
  const draft = await Draft.findById(draftId);
  if (!draft) {
    throw new Error('Draft not found');
  }

  if (draft.userId.toString() !== userId) {
    const member = await RoomMember.findOne({ roomId: draft.roomId, userId, isActive: true });
    if (!member) {
      throw new Error('Unauthorized');
    }
  }

  if (!draft.audioFileId) {
    throw new Error('Audio file not found');
  }

  const bucket = await getGridFSBucket();
  const files = await bucket.find({ _id: draft.audioFileId }).toArray();
  if (!files.length) {
    throw new Error('Audio file not found');
  }

  return { draft, file: files[0], bucket };
};
