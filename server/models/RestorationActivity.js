import mongoose from 'mongoose';

const restorationActivitySchema = new mongoose.Schema({
  parcelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandParcel',
    required: true
  },
  activityType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    default: 'units'
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  blockchainHash: String,
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  carbonOffsetKg: {
    type: Number,
    default: 0
  },
  performedAt: {
    type: Date,
    default: Date.now
  },
  verifiedAt: Date
}, {
  timestamps: true
});

export default mongoose.model('RestorationActivity', restorationActivitySchema);
