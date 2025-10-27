import mongoose from 'mongoose';

const soilHealthRecordSchema = new mongoose.Schema({
  parcelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandParcel',
    required: true
  },
  vitalityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  phLevel: Number,
  moistureLevel: Number,
  nitrogenLevel: Number,
  phosphorusLevel: Number,
  potassiumLevel: Number,
  organicMatter: Number,
  temperature: Number,
  rainfall: Number, // in mm
  erosionRate: Number, // in tons/ha/year
  dataSource: {
    type: String,
    enum: ['iot_sensor', 'satellite', 'manual', 'ai_prediction'],
    default: 'manual'
  },
  recordedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('SoilHealthRecord', soilHealthRecordSchema);
