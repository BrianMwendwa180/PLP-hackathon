import mongoose from 'mongoose';

const ioTSensorSchema = new mongoose.Schema({
  parcelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandParcel',
    required: true
  },
  sensorType: {
    type: String,
    enum: ['soil_moisture', 'ph', 'temperature', 'rainfall', 'erosion', 'npk', 'organic_matter'],
    required: true
  },
  sensorId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String, // e.g., "Zone 1", "North Field"
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'offline'],
    default: 'active'
  },
  apiKey: {
    type: String,
    required: true,
    unique: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  thresholds: {
    min: Number,
    max: Number,
    criticalMin: Number,
    criticalMax: Number
  },
  units: {
    type: String,
    default: 'auto' // auto-detect based on sensorType
  }
}, {
  timestamps: true
});

// Index for efficient queries
ioTSensorSchema.index({ parcelId: 1, sensorType: 1 });
ioTSensorSchema.index({ sensorId: 1 });

export default mongoose.model('IoTSensor', ioTSensorSchema);
