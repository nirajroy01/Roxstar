import { Server, Socket } from 'socket.io';

export default function roomSocket(io: Server, socket: Socket) {
  socket.on('join_room', (roomCode: string) => {
    socket.join(roomCode);
    const roomMembers = io.sockets.adapter.rooms.get(roomCode);
    io.to(roomCode).emit('user_joined', { userId: socket.id, roomCode });
    io.to(socket.id).emit('room_state', {
      roomCode,
      members: roomMembers ? Array.from(roomMembers) : [],
    });
  });

  socket.on('leave_room', (roomCode: string) => {
    socket.leave(roomCode);
    io.to(roomCode).emit('user_left', { userId: socket.id, roomCode });
  });

  socket.on('draft_shared', (payload) => {
    io.to(payload.roomCode).emit('draft_shared', payload);
  });
}
