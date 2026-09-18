// GRIDFS TEMPORARILY DISABLED — bucket.delete removed from deleteDraft.
// When GridFS is re-enabled, restore the getGridFSBucket import and
// the bucket.delete call inside deleteDraft.
import { ObjectId } from 'mongodb';
import Draft from '../models/Draft.js';
import RoomMember from '../models/RoomMember.js';

export const createDraft = async (
  userId: string,
  roomId: string | null,
  data: { name: string; duration: number; effect: string; audioFileId?: string },
) => {
  if (!data.name || !data.duration || !data.effect) {
    throw new Error('Draft name, duration, and effect are required');
  }

  if (roomId) {
    const isMember = await RoomMember.findOne({ roomId, userId, isActive: true });
    if (!isMember) {
      throw new Error('User is not a member of the room');
    }
  }

  const draft = await Draft.create({
    userId,
    roomId: roomId || undefined,
    name: data.name,
    duration: data.duration,
    effect: data.effect,
    // audioFileId preserved for future GridFS re-enable
    audioFileId: data.audioFileId ? new ObjectId(data.audioFileId) : undefined,
  });

  return draft;
};

export const listDrafts = async (userId: string) => {
  return Draft.find({ userId }).sort({ createdAt: -1 }).lean();
};

export const getDraft = async (draftId: string, userId: string) => {
  const draft = await Draft.findById(draftId);
  if (!draft) {
    throw new Error('Draft not found');
  }

  const isOwner = draft.userId.toString() === userId;
  const isRoomMember = draft.roomId
    ? !!(await RoomMember.exists({ roomId: draft.roomId, userId, isActive: true }))
    : false;
  if (!isOwner && !isRoomMember) {
    throw new Error('Unauthorized');
  }

  return draft;
};

export const deleteDraft = async (draftId: string, userId: string) => {
  const draft = await Draft.findOne({ _id: draftId, userId });
  if (!draft) {
    throw new Error('Draft not found');
  }

  // GRIDFS DISABLED: bucket.delete skipped during local-storage phase.
  // When GridFS is re-enabled, restore:
  //   const bucket = await getGridFSBucket();
  //   await bucket.delete(draft.audioFileId);
  if (draft.audioFileId) {
    console.warn('[GridFS disabled] Skipping audio file deletion for draft', draftId);
  }

  await Draft.deleteOne({ _id: draftId });
  return { success: true };
};
