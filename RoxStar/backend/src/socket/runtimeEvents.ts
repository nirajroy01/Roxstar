import { EventEmitter } from 'node:events';

export type RuntimeEvent = {
  roomId: string;
  type: 'spin_started' | 'user_eliminated' | 'winner_announced';
  payload: Record<string, unknown>;
};

export const runtimeEvents = new EventEmitter();
