import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import roomSocket from './roomSocket.js';
import { runtimeEvents, RuntimeEvent } from './runtimeEvents.js';

export const initializeSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== 'string') {
      next(new Error('Authentication required'));
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    roomSocket(io, socket);
  });

  const emitRoomEvent = (event: RuntimeEvent) => {
    io.to(event.roomId).emit(event.type, { roomId: event.roomId, ...event.payload });
  };
  runtimeEvents.on('spin_event', emitRoomEvent);
  runtimeEvents.on('room_event', emitRoomEvent);

  return io;
};
