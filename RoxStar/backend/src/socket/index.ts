import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import roomSocket from './roomSocket.js';
import spinSocket from './spinSocket.js';

export const initializeSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    roomSocket(io, socket);
    spinSocket(io, socket);
  });

  return io;
};
