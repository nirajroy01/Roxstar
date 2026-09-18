import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './apiService';

let socket: Socket | null = null;

export const connectSocket = async () => {
  if (socket) return socket;

  const token = await getAuthToken();
  // 10.0.2.2 only works for the Android emulator. Use LAN IP for physical devices.
  const host = 'http://10.108.174.19:4000';
  socket = io(host, {
    transports: ['websocket'],
    auth: token ? { token } : undefined,
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
