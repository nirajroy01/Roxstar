import { isValidObjectId } from 'mongoose';
import Draft from '../models/Draft.js';
import RoomMember from '../models/RoomMember.js';
import { runtimeEvents } from '../socket/runtimeEvents.js';

export const createDraft = async (
  userId: string,
  roomId: string | null,
  data: { name: string; duration: number; effect: string },
) => {
  const name = data.name?.trim();
  if (!name || !Number.isFinite(data.duration) || data.duration <= 0 || !data.effect?.trim()) {
    throw new Error('Draft name, duration, and effect are required');
  }

  if (roomId) {
    if (!isValidObjectId(roomId)) {
      throw new Error('Invalid room ID');
    }
    const isMember = await RoomMember.findOne({ roomId, userId, isActive: true });
    if (!isMember) {
      throw new Error('User is not a member of the room');
    }
  }

  const draft = await Draft.create({
    userId,
    roomId: roomId || undefined,
    name,
    duration: data.duration,
    effect: data.effect.trim(),
    fileUrl: null,
  });

  return draft;
};

export const listDrafts = async (userId: string) => {
  return Draft.find({ userId }).sort({ createdAt: -1 }).lean();
};

export const getDraft = async (draftId: string, userId: string) => {
  if (!isValidObjectId(draftId)) {
    throw new Error('Invalid draft ID');
  }
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
  if (!isValidObjectId(draftId)) {
    throw new Error('Invalid draft ID');
  }
  const draft = await Draft.findOne({ _id: draftId, userId });
  if (!draft) {
    throw new Error('Draft not found');
  }

  await Draft.deleteOne({ _id: draftId });
  return { success: true };
};

export const shareDraftToRoom = async (draftId: string, roomId: string, userId: string) => {
  if (!isValidObjectId(draftId) || !isValidObjectId(roomId)) {
    throw new Error('Invalid draft or room ID');
  }
  const [draft, member] = await Promise.all([
    Draft.findOne({ _id: draftId, userId }),
    RoomMember.exists({ roomId, userId, isActive: true }),
  ]);
  if (!draft) throw new Error('Draft not found');
  if (!member) throw new Error('User is not a member of the room');

  draft.roomId = roomId as unknown as typeof draft.roomId;
  await draft.save();
  runtimeEvents.emit('room_event', {
    roomId,
    type: 'draft_shared',
    payload: { draft: draft.toJSON() },
  });
  return draft;
};
