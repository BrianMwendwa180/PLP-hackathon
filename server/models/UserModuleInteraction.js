import mongoose from 'mongoose';

const userModuleInteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moduleName: {
    type: String,
    required: true,
    enum: [
      'Dashboard',
      'RestorationTracker',
      'SoilHealthMonitor',
      'Recommendations',
      'ImpactMetrics',
      'IoTSensorDashboard',
      'LandMap',
      'Resilience',
      'LandingPage',
      'AuthModal'
    ] // Add more as needed for app modules/pages
  },
  accessCount: {
    type: Number,
    default: 1
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries by user and module
userModuleInteractionSchema.index({ userId: 1, moduleName: 1 });

export default mongoose.model('UserModuleInteraction', userModuleInteractionSchema);
