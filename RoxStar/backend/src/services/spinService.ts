import Spin from '../models/Spin.js';
import SpinParticipant from '../models/SpinParticipant.js';
import RoomMember from '../models/RoomMember.js';
import SpinEvent from '../models/SpinEvent.js';

const activeTimers = new Map<string, NodeJS.Timeout>();

const finalizeSpin = async (spinId: string, roomId: string) => {
  const spin = await Spin.findById(spinId);
  if (!spin || spin.status === 'COMPLETED') {
    return;
  }

  const activeParticipants = await SpinParticipant.find({ spinId, status: 'ACTIVE' }).sort({ joinedAt: 1 });
  const winner = activeParticipants[0];

  if (!winner) {
    spin.status = 'ABORTED';
    await spin.save();
    if (activeTimers.has(roomId)) {
      clearInterval(activeTimers.get(roomId)!);
      activeTimers.delete(roomId);
    }
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

  if (activeTimers.has(roomId)) {
    clearInterval(activeTimers.get(roomId)!);
    activeTimers.delete(roomId);
  }
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
  target.eliminationOrder = await SpinParticipant.countDocuments({ spinId, status: 'ELIMINATED' }) + 1;
  await target.save();

  await SpinEvent.create({
    spinId,
    roomId,
    type: 'user_eliminated',
    userId: target.userId,
    data: { eliminationOrder: target.eliminationOrder },
  });

  const remaining = await SpinParticipant.countDocuments({ spinId, status: 'ACTIVE' });
  if (remaining === 1) {
    await finalizeSpin(spinId, roomId);
  }
};

export const startSpin = async (userId: string, roomId: string) => {
  if (!roomId) {
    throw new Error('Room ID is required');
  }

  const roomMembers = await RoomMember.find({ roomId, isActive: true });
  if (roomMembers.length < 3 || roomMembers.length > 20) {
    throw new Error('Spin requires 3 to 20 participants');
  }

  const activeSpin = await Spin.findOne({ roomId, status: { $in: ['WAITING', 'RUNNING'] } });
  if (activeSpin) {
    throw new Error('An active spin already exists');
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

  if (activeTimers.has(roomId)) {
    clearInterval(activeTimers.get(roomId)!);
  }

  const timer = setInterval(() => {
    void eliminateOneParticipant(spin._id.toString(), roomId);
  }, 5000);

  activeTimers.set(roomId, timer);

  return spin;
};

export const getSpinState = async (roomId: string) => {
  const spin = await Spin.findOne({ roomId, status: { $in: ['RUNNING', 'COMPLETED'] } });
  if (!spin) {
    return null;
  }

  const participants = await SpinParticipant.find({ spinId: spin._id }).lean();
  return { spin, participants };
};
