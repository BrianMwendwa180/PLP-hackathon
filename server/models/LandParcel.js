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
    enum: ['agriculture', 'forest', 'pasture', 'urban', 'other', 'grassland', 'wetland'],
    default: 'agriculture'
  },
  soilType: {
    type: String,
    enum: ['sandy', 'clay', 'loam', 'silt', 'peat', 'chalk', 'other'],
    required: false
  },
  vegetationType: {
    type: String,
    enum: ['grassland', 'forest', 'cropland', 'shrubland', 'wetland', 'barren', 'other'],
    required: false
  },
  irrigationType: {
    type: String,
    enum: ['rainfed', 'irrigated', 'drip', 'sprinkler', 'flood', 'none'],
    required: false
  },
  climateZone: {
    type: String,
    enum: ['tropical', 'subtropical', 'temperate', 'continental', 'polar', 'arid', 'semiarid', 'other'],
    required: false
  }
}, {
  timestamps: true
});

export default mongoose.model('LandParcel', landParcelSchema);
