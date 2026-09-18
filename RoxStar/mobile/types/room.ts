export type Room = {
  _id: string;
  code: string;
  name: string;
  ownerId: string;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
};
