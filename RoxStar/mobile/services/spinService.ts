import { request } from './apiService';

export type SpinState = {
  spin: { _id: string; status: 'RUNNING' | 'COMPLETED' | 'ABORTED'; winnerId?: string };
  participants: Array<{ userId: string; status: string }>;
};

export const startSpin = (roomId: string) =>
  request<SpinState['spin']>('/spins/start', {
    method: 'POST',
    body: JSON.stringify({ roomId }),
  });

export const getSpinState = (roomId: string) => request<SpinState | null>(`/spins/room/${roomId}`);
