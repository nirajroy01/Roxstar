import { request } from './apiService';

export const startSpin = (roomId: string) =>
  request('/spins/start', {
    method: 'POST',
    body: JSON.stringify({ roomId }),
  });

export const getSpinState = (roomId: string) => request(`/spins/room/${roomId}`);
