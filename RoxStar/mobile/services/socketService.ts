import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { getAuthToken } from './apiService';

let socket: Socket | null = null;

export const connectSocket = async () => {
  if (socket) return socket;

  const token = await getAuthToken();
  const host = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
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
