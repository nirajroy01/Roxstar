import { Server, Socket } from 'socket.io';

export default function spinSocket(io: Server, socket: Socket) {
  socket.on('spin_started', (payload) => {
    io.to(payload.roomCode).emit('spin_started', payload);
  });

  socket.on('user_eliminated', (payload) => {
    io.to(payload.roomCode).emit('user_eliminated', payload);
  });

  socket.on('winner_announced', (payload) => {
    io.to(payload.roomCode).emit('winner_announced', payload);
  });
}
