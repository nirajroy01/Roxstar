// Draft as stored in MongoDB — fileUrl is null during local-storage phase.
// localFileUri is a device-only field, never sent to the server.
export type Draft = {
  _id: string;
  userId: string;
  roomId?: string;
  name: string;
  duration: number;
  effect: string;
  /** null during local-storage phase; populated when GridFS is enabled */
  fileUrl: string | null;
  /** Device-only local WAV URI — never sent to the server */
  localFileUri?: string;
  createdAt: string;
  updatedAt: string;
};
