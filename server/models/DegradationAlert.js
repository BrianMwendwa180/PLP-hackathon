import mongoose from 'mongoose';

const degradationAlertSchema = new mongoose.Schema({
  parcelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandParcel',
    required: true
  },
  alertType: {
    type: String,
    enum: ['soil_degradation', 'erosion', 'contamination', 'drought', 'flood', 'pest_infestation', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  detectedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date,
  status: {
    type: String,
    enum: ['active', 'resolved', 'dismissed'],
    default: 'active'
  },
  aiDetected: {
    type: Boolean,
    default: false
  },
  recommendedActions: [{
    action: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('DegradationAlert', degradationAlertSchema);
