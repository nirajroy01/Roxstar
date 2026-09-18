// GRIDFS TEMPORARILY DISABLED — local audio storage phase.
// Re-enable when "enable GridFS" is requested.
//
// import { ObjectId } from 'mongodb';
// import { getGridFSBucket } from '../config/gridfs.js';
import Draft from '../models/Draft.js';
import RoomMember from '../models/RoomMember.js';

export const canAccessDraft = async (draftId: string, userId: string): Promise<boolean> => {
  const draft = await Draft.findById(draftId);
  if (!draft) return false;

  if (draft.userId.toString() === userId) return true;
  if (!draft.roomId) return false;

  return !!(await RoomMember.exists({ roomId: draft.roomId, userId, isActive: true }));
};

// DISABLED: uploadAudioToDraft — GridFS upload is off during local-storage phase.
// To re-enable, restore the original implementation that called getGridFSBucket().
export const uploadAudioToDraft = async (
  _draftId: string,
  _fileBuffer: Buffer,
  _mimetype: string,
): Promise<never> => {
  throw new Error('Audio upload is temporarily disabled — local audio storage phase');
};

// DISABLED: getDraftAudio — GridFS download is off during local-storage phase.
// To re-enable, restore the original implementation that called getGridFSBucket().
export const getDraftAudio = async (
  _draftId: string,
  _userId: string,
): Promise<never> => {
  throw new Error('Remote audio retrieval is temporarily disabled — local audio storage phase');
};
