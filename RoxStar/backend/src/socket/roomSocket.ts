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

    socket.join(roomCode);
    const roomMembers = io.sockets.adapter.rooms.get(roomCode);
    io.to(roomCode).emit('user_joined', { userId: socket.id, roomCode });
    io.to(socket.id).emit('room_state', {
      roomCode,
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

  socket.on('leave_room', (roomCode: string) => {
    socket.leave(roomCode);
    io.to(roomCode).emit('user_left', { userId: socket.id, roomCode });
  });

  socket.on('draft_shared', async (payload: { roomId?: string; roomCode?: string }) => {
    if (!payload?.roomId || !payload.roomCode || !(await isMember(payload.roomId, socket.data.userId))) {
      socket.emit('room_error', { message: 'You are not a member of this room' });
      return;
    }

    io.to(payload.roomCode).emit('draft_shared', payload);
  });
}
