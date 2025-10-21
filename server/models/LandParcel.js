import mongoose from 'mongoose';

const landParcelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  sizeHectares: {
    type: Number,
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  landUseType: {
    type: String,
    enum: ['agriculture', 'forest', 'pasture', 'urban', 'other'],
    default: 'agriculture'
  }
}, {
  timestamps: true
});

export default mongoose.model('LandParcel', landParcelSchema);
