import User from '../models/User.js';
import RoomMember from '../models/RoomMember.js';
import SpinParticipant from '../models/SpinParticipant.js';
import Spin from '../models/Spin.js';
import Room from '../models/Room.js';

export const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new Error('User not found');
  }

  const { passwordHash, ...safeUser } = user as Record<string, unknown> & { passwordHash?: string };
  return safeUser;
};

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId).select('-passwordHash').lean();
  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export const getUserHistory = async (userId: string) => {
  const [memberships, participants] = await Promise.all([
    RoomMember.find({ userId }).sort({ joinedAt: -1 }).lean(),
    SpinParticipant.find({ userId }).sort({ joinedAt: -1 }).lean(),
  ]);
  const roomIds = memberships.map((membership) => membership.roomId);
  const spinIds = participants.map((participant) => participant.spinId);
  const [rooms, spins] = await Promise.all([
    Room.find({ _id: { $in: roomIds } }).lean(),
    Spin.find({ _id: { $in: spinIds } }).lean(),
  ]);
  const roomsById = new Map(rooms.map((room) => [room._id.toString(), room]));
  const spinsById = new Map(spins.map((spin) => [spin._id.toString(), spin]));
  const historyRooms = memberships.map((membership) => ({
    room: roomsById.get(membership.roomId.toString()), role: membership.role,
    joinedAt: membership.joinedAt, leftAt: membership.leftAt, isActive: membership.isActive,
  })).filter((entry) => entry.room);
  const historySpins = participants.map((participant) => {
    const spin = spinsById.get(participant.spinId.toString());
    return spin ? { spin, status: participant.status, eliminationOrder: participant.eliminationOrder, eliminatedAt: participant.eliminatedAt, won: spin.winnerId?.toString() === userId } : null;
  }).filter(Boolean);
  return {
    rooms: historyRooms,
    spins: historySpins,
    stats: {
      roomsJoined: memberships.length,
      spinsParticipated: participants.length,
      wins: participants.filter((participant) => participant.status === 'WINNER').length,
      eliminations: participants.filter((participant) => participant.status === 'ELIMINATED').length,
    },
  };
};
