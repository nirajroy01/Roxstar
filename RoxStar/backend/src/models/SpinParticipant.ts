import mongoose, { Schema, Document, Model } from 'mongoose';

export type SpinParticipantStatus = 'ACTIVE' | 'ELIMINATED' | 'WINNER';

export interface ISpinParticipant extends Document {
  spinId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: SpinParticipantStatus;
  joinedAt: Date;
  eliminatedAt?: Date;
  eliminationOrder?: number;
}

const spinParticipantSchema = new Schema<ISpinParticipant>(
  {
    spinId: { type: Schema.Types.ObjectId, ref: 'Spin', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['ACTIVE', 'ELIMINATED', 'WINNER'], default: 'ACTIVE' },
    joinedAt: { type: Date, default: Date.now },
    eliminatedAt: { type: Date },
    eliminationOrder: { type: Number },
  }
);

spinParticipantSchema.index({ spinId: 1, userId: 1 }, { unique: true });

const SpinParticipant: Model<ISpinParticipant> =
  mongoose.models.SpinParticipant || mongoose.model<ISpinParticipant>('SpinParticipant', spinParticipantSchema);

export default SpinParticipant;
