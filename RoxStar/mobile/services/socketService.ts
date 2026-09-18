import { io, Socket } from 'socket.io-client';
import { BACKEND_BASE_URL, getAuthToken } from './apiService';

let socket: Socket | null = null;

export const connectSocket = async () => {
  if (socket) return socket;

  const token = await getAuthToken();
  socket = io(BACKEND_BASE_URL, {
    transports: ['websocket'],
    auth: token ? { token } : undefined,
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
