import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISpinEvent extends Document {
  spinId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  type: string;
  userId?: mongoose.Types.ObjectId;
  data?: Record<string, unknown>;
  createdAt: Date;
}

const spinEventSchema = new Schema<ISpinEvent>(
  {
    spinId: { type: Schema.Types.ObjectId, ref: 'Spin', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    type: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const SpinEvent: Model<ISpinEvent> =
  mongoose.models.SpinEvent || mongoose.model<ISpinEvent>('SpinEvent', spinEventSchema);

export default SpinEvent;
