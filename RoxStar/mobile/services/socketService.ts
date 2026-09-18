import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (token?: string) => {
  if (socket) return socket;

  socket = io('http://localhost:4000', {
    transports: ['websocket'],
    auth: token ? { token } : undefined,
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
