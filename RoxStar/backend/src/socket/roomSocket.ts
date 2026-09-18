import { Server, Socket } from 'socket.io';
import Room from '../models/Room.js';
import RoomMember from '../models/RoomMember.js';

const isMember = async (roomId: string, userId: string) => {
  return !!(await RoomMember.exists({ roomId, userId, isActive: true }));
};

export default function roomSocket(io: Server, socket: Socket) {
  socket.on('join_room', async (roomCode: string) => {
    const room = await Room.findOne({ code: roomCode?.trim().toUpperCase() }).lean();
    if (!room || !(await isMember(room._id.toString(), socket.data.userId))) {
      socket.emit('room_error', { message: 'You are not a member of this room' });
      return;
    }

    const normalizedCode = room.code;
    socket.join(normalizedCode);
    const roomMembers = io.sockets.adapter.rooms.get(normalizedCode);
    io.to(normalizedCode).emit('user_joined', { userId: socket.data.userId, roomCode: normalizedCode });
    io.to(socket.id).emit('room_state', {
      roomCode: normalizedCode,
      members: roomMembers ? Array.from(roomMembers) : [],
    });
  });

  socket.on('join_room_id', async (roomId: string) => {
    if (!(await isMember(roomId, socket.data.userId))) {
      socket.emit('room_error', { message: 'You are not a member of this room' });
      return;
    }

    socket.join(roomId);
  });

  socket.on('leave_room', async (roomCode: string) => {
    const room = await Room.findOne({ code: roomCode?.trim().toUpperCase() }).lean();
    if (!room || !(await isMember(room._id.toString(), socket.data.userId))) return;
    socket.leave(room.code);
    socket.leave(room._id.toString());
    io.to(room.code).emit('user_left', { userId: socket.data.userId, roomCode: room.code });
  });

  socket.on('draft_shared', async (payload: { roomId?: string; roomCode?: string }) => {
    const room = payload?.roomId ? await Room.findById(payload.roomId).lean() : null;
    if (!room || !payload.roomCode || room.code !== payload.roomCode.trim().toUpperCase() || !(await isMember(payload.roomId!, socket.data.userId))) {
      socket.emit('room_error', { message: 'You are not a member of this room' });
      return;
    }

    io.to(room.code).emit('draft_shared', { ...payload, roomCode: room.code });
  });
}
