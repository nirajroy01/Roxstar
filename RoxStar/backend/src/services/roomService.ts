import Room from '../models/Room.js';
import RoomMember from '../models/RoomMember.js';
import User from '../models/User.js';

export const createRoom = async (ownerId: string, name: string) => {
  const cleanName = name?.trim();
  if (!cleanName) {
    throw new Error('Room name is required');
  }

  const owner = await User.findById(ownerId);
  if (!owner) {
    throw new Error('Owner not found');
  }

  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const room = await Room.create({
    name: cleanName,
    ownerId,
    code,
    status: 'WAITING',
  });

  await RoomMember.create({
    roomId: room._id,
    userId: ownerId,
    role: 'OWNER',
    isActive: true,
    joinedAt: new Date(),
  });

  return room;
};

export const joinRoom = async (userId: string, roomCode: string) => {
  const normalizedCode = roomCode?.trim().toUpperCase();
  const room = await Room.findOne({ code: normalizedCode });
  if (!room) {
    throw new Error('Room not found');
  }

  const activeMember = await RoomMember.findOne({ roomId: room._id, userId, isActive: true });
  if (activeMember) {
    return room;
  }

  await RoomMember.create({
    roomId: room._id,
    userId,
    role: 'MEMBER',
    isActive: true,
    joinedAt: new Date(),
  });

  return room;
};

export const leaveRoom = async (userId: string, roomId: string) => {
  const member = await RoomMember.findOne({ roomId, userId, isActive: true });
  if (!member) {
    throw new Error('Member not found in room');
  }

  member.isActive = false;
  member.leftAt = new Date();
  await member.save();

  return member;
};

export const getRoom = async (roomId: string) => {
  const room = await Room.findById(roomId).lean();
  if (!room) {
    throw new Error('Room not found');
  }

  const members = await RoomMember.find({ roomId, isActive: true }).populate('userId', 'name email').lean();
  return { ...room, members };
};
