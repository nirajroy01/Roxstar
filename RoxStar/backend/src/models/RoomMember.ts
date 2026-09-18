import mongoose, { Schema, Document, Model } from 'mongoose';

export type RoomRole = 'OWNER' | 'MEMBER';

export interface IRoomMember extends Document {
  roomId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: RoomRole;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
}

const roomMemberSchema = new Schema<IRoomMember>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['OWNER', 'MEMBER'], default: 'MEMBER' },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
    isActive: { type: Boolean, default: true },
  }
);

roomMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true });

const RoomMember: Model<IRoomMember> =
  mongoose.models.RoomMember || mongoose.model<IRoomMember>('RoomMember', roomMemberSchema);

export default RoomMember;
