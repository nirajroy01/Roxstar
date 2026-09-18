import { ObjectId } from 'mongodb';
import { getGridFSBucket } from '../config/gridfs.js';
import Draft from '../models/Draft.js';
import RoomMember from '../models/RoomMember.js';

export const canAccessDraft = async (draftId: string, userId: string): Promise<boolean> => {
  const draft = await Draft.findById(draftId);
  if (!draft) return false;

  if (draft.userId.toString() === userId) return true;
  if (!draft.roomId) return false;

  return !!(await RoomMember.exists({ roomId: draft.roomId, userId, isActive: true }));
};

export const uploadAudioToDraft = async (draftId: string, fileBuffer: Buffer, mimetype: string) => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('Audio payload is empty');
  }

  const draft = await Draft.findById(draftId);
  if (!draft) {
    throw new Error('Draft not found');
  }

  if (draft.audioFileId) {
    const bucket = await getGridFSBucket();
    try {
      await bucket.delete(draft.audioFileId);
    } catch {
      // ignore stale file cleanup if the old GridFS record is missing
    }
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

  const hasAccess = await canAccessDraft(draftId, userId);
  if (!hasAccess) {
    throw new Error('Unauthorized');
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
