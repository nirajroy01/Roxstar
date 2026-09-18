import mongoose, { Schema, Document, Model } from 'mongoose';

export type SpinStatus = 'WAITING' | 'RUNNING' | 'COMPLETED' | 'ABORTED';

export interface ISpin extends Document {
  roomId: mongoose.Types.ObjectId;
  startedBy: mongoose.Types.ObjectId;
  status: SpinStatus;
  winnerId?: mongoose.Types.ObjectId;
  startedAt: Date;
  completedAt?: Date;
}

const spinSchema = new Schema<ISpin>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    startedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['WAITING', 'RUNNING', 'COMPLETED', 'ABORTED'], default: 'WAITING' },
    winnerId: { type: Schema.Types.ObjectId, ref: 'User' },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  }
);

const Spin: Model<ISpin> = mongoose.models.Spin || mongoose.model<ISpin>('Spin', spinSchema);

export default Spin;
