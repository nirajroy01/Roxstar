export type SpinStatus = 'WAITING' | 'RUNNING' | 'COMPLETED' | 'ABORTED';

export type Spin = {
  _id: string;
  roomId: string;
  startedBy: string;
  status: SpinStatus;
  winnerId?: string;
  startedAt: string;
  completedAt?: string;
};
