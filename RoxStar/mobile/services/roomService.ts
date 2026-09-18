import { request } from './apiService';

export type Room = {
  _id: string;
  code: string;
  name: string;
  ownerId: string;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED';
  members: Array<{ userId: { _id: string; name: string; email: string } | string }>;
};

export const createRoom = (name: string) =>
  request<Room>('/rooms', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

export const joinRoom = (code: string) =>
  request<Room>(`/rooms/${code}/join`, {
    method: 'POST',
  });

export const leaveRoom = (roomId: string) =>
  request(`/rooms/${roomId}/leave`, {
    method: 'POST',
  });

export const getRoom = (roomId: string) => request<Room>(`/rooms/${roomId}`);
