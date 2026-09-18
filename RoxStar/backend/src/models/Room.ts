import mongoose, { Schema, Document, Model } from 'mongoose';

export type RoomStatus = 'WAITING' | 'ACTIVE' | 'COMPLETED';

export interface IRoom extends Document {
  code: string;
  name: string;
  ownerId: mongoose.Types.ObjectId;
  status: RoomStatus;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['WAITING', 'ACTIVE', 'COMPLETED'], default: 'WAITING' },
  },
  { timestamps: true }
);

const Room: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>('Room', roomSchema);

export default Room;
