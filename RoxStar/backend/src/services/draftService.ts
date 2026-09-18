import { ObjectId } from 'mongodb';
import Draft from '../models/Draft.js';
import RoomMember from '../models/RoomMember.js';
import { getGridFSBucket } from '../config/gridfs.js';

export const createDraft = async (userId: string, roomId: string | null, data: { name: string; duration: number; effect: string; audioFileId?: string }) => {
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

  if (draft.audioFileId) {
    const bucket = await getGridFSBucket();
    try {
      await bucket.delete(draft.audioFileId);
    } catch (error) {
      console.warn('GridFS delete skipped', error);
    }
  }

  await Draft.deleteOne({ _id: draftId });
  return { success: true };
};
