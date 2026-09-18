export type Draft = {
  _id: string;
  userId: string;
  roomId?: string;
  name: string;
  duration: number;
  effect: string;
  audioFileId?: string;
  createdAt: string;
  updatedAt: string;
};
