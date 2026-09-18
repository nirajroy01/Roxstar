import { request } from './apiService';

export const createRoom = (name: string) =>
  request('/rooms', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

export const joinRoom = (code: string) =>
  request(`/rooms/${code}/join`, {
    method: 'POST',
  });

export const leaveRoom = (roomId: string) =>
  request(`/rooms/${roomId}/leave`, {
    method: 'POST',
  });

export const getRoom = (roomId: string) => request(`/rooms/${roomId}`);
