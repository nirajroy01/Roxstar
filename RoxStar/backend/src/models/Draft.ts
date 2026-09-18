import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDraft extends Document {
  userId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  name: string;
  duration: number;
  effect: string;
  audioFileId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const draftSchema = new Schema<IDraft>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    name: { type: String, required: true },
    duration: { type: Number, required: true },
    effect: { type: String, required: true },
    audioFileId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

const Draft: Model<IDraft> = mongoose.models.Draft || mongoose.model<IDraft>('Draft', draftSchema);

export default Draft;
