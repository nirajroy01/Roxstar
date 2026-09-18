import Spin from '../models/Spin.js';
import SpinParticipant from '../models/SpinParticipant.js';
import RoomMember from '../models/RoomMember.js';
import SpinEvent from '../models/SpinEvent.js';
import { runtimeEvents } from '../socket/runtimeEvents.js';
import { isValidObjectId } from 'mongoose';
import { isRoomMember } from './roomService.js';

const activeTimers = new Map<string, NodeJS.Timeout>();

const stopTimer = (roomId: string) => {
  const timer = activeTimers.get(roomId);
  if (timer) {
    clearInterval(timer);
    activeTimers.delete(roomId);
  }
};

const finalizeSpin = async (spinId: string, roomId: string) => {
  const spin = await Spin.findById(spinId);
  if (!spin || spin.status === 'COMPLETED' || spin.status === 'ABORTED') {
    stopTimer(roomId);
    return;
  }

  const activeParticipants = await SpinParticipant.find({ spinId, status: 'ACTIVE' }).sort({ joinedAt: 1 });
  const winner = activeParticipants[0];

  if (!winner) {
    spin.status = 'ABORTED';
    await spin.save();
    stopTimer(roomId);
    return;
  }

  winner.status = 'WINNER';
  await winner.save();

  spin.status = 'COMPLETED';
  spin.winnerId = winner.userId;
  spin.completedAt = new Date();
  await spin.save();

  await SpinEvent.create({
    spinId,
    roomId,
    type: 'winner_announced',
    userId: winner.userId,
    data: { winnerUserId: winner.userId.toString() },
  });

  runtimeEvents.emit('spin_event', {
    roomId,
    type: 'winner_announced',
    payload: { winnerUserId: winner.userId.toString() },
  });

  stopTimer(roomId);
};

const eliminateOneParticipant = async (spinId: string, roomId: string) => {
  const spin = await Spin.findById(spinId);
  if (!spin || spin.status !== 'RUNNING') {
    return;
  }

  const activeParticipants = await SpinParticipant.find({ spinId, status: 'ACTIVE' }).sort({ joinedAt: 1 });
  if (activeParticipants.length <= 1) {
    await finalizeSpin(spinId, roomId);
    return;
  }

  const target = activeParticipants[0];
  target.status = 'ELIMINATED';
  target.eliminatedAt = new Date();
  target.eliminationOrder = (await SpinParticipant.countDocuments({ spinId, status: 'ELIMINATED' })) + 1;
  await target.save();

  await SpinEvent.create({
    spinId,
    roomId,
    type: 'user_eliminated',
    userId: target.userId,
    data: { eliminationOrder: target.eliminationOrder },
  });

  runtimeEvents.emit('spin_event', {
    roomId,
    type: 'user_eliminated',
    payload: { userId: target.userId.toString(), eliminationOrder: target.eliminationOrder },
  });

  const remaining = await SpinParticipant.countDocuments({ spinId, status: 'ACTIVE' });
  if (remaining === 1) {
    await finalizeSpin(spinId, roomId);
  }
};

export const startSpin = async (userId: string, roomId: string) => {
  if (!roomId || !isValidObjectId(roomId)) {
    throw new Error('Room ID is required');
  }

  const existingCompletedSpin = await Spin.findOne({ roomId, status: 'COMPLETED' }).sort({ completedAt: -1 });
  if (existingCompletedSpin) {
    throw new Error('This room already has a completed spin');
  }

  const activeSpin = await Spin.findOne({ roomId, status: 'RUNNING' });
  if (activeSpin) {
    throw new Error('An active spin already exists');
  }

  const roomMembers = await RoomMember.find({ roomId, isActive: true });
  if (roomMembers.length < 3 || roomMembers.length > 20) {
    throw new Error('Spin requires 3 to 20 participants');
  }

  const roomOwner = await RoomMember.findOne({ roomId, userId, role: 'OWNER', isActive: true });
  if (!roomOwner) {
    throw new Error('Unauthorized to start spin');
  }

  const spin = await Spin.create({
    roomId,
    startedBy: userId,
    status: 'RUNNING',
    startedAt: new Date(),
  });

  const participantRecords = roomMembers.map((member) => ({
    spinId: spin._id,
    userId: member.userId,
    status: 'ACTIVE',
    joinedAt: new Date(),
  }));

  await SpinParticipant.insertMany(participantRecords);

  await SpinEvent.create({
    spinId: spin._id,
    roomId,
    type: 'spin_started',
    data: { participantCount: participantRecords.length },
  });

  runtimeEvents.emit('spin_event', {
    roomId,
    type: 'spin_started',
    payload: { participantCount: participantRecords.length },
  });

  stopTimer(roomId);

  const timer = setInterval(() => {
    void eliminateOneParticipant(spin._id.toString(), roomId);
  }, 5000);

  activeTimers.set(roomId, timer);

  return spin;
};

export const getSpinState = async (roomId: string, requesterId: string) => {
  if (!isValidObjectId(roomId)) {
    throw new Error('Invalid room ID');
  }
  if (!(await isRoomMember(roomId, requesterId))) {
    throw new Error('You are not a member of this room');
  }
  const spin = await Spin.findOne({ roomId, status: { $in: ['RUNNING', 'COMPLETED'] } }).sort({ startedAt: -1 });
  if (!spin) {
    return null;
  }

  const participants = await SpinParticipant.find({ spinId: spin._id }).lean();
  return { spin, participants };
};

export const getSpinById = async (spinId: string, requesterId: string) => {
  if (!isValidObjectId(spinId)) throw new Error('Invalid spin ID');
  const spin = await Spin.findById(spinId).lean();
  if (!spin) throw new Error('Spin not found');
  return getSpinState(spin.roomId.toString(), requesterId);
};
