import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
  parcelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandParcel',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recommendationType: {
    type: String,
    enum: ['soil_amendment', 'crop_rotation', 'water_management', 'erosion_control', 'reforestation', 'fertilization', 'liming', 'drainage', 'irrigation', 'cover_cropping', 'organic_matter_addition', 'climate_adaptation', 'other'],
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
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  estimatedTimeDays: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  predictionTimeframe: {
    type: String,
    enum: ['immediate', 'short_term', 'medium_term', 'long_term'],
    default: null
  },
  predictionType: {
    type: String,
    enum: ['degradation_prediction', 'crop_recommendation', 'restoration_suggestion', 'fertilizer_optimization', 'water_management'],
    default: null
  },
  // Enhanced AI fields
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: null
  },
  sustainabilityImpact: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: null
  },
  expectedROI: {
    type: Number,
    default: null
  },
  environmentalImpact: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: null
  },
  biodiversityBenefit: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: null
  },
  implementationSteps: [{
    type: String
  }],
  monitoringMetrics: [{
    type: String
  }],
  expectedYield: {
    type: Number,
    default: null
  },
  marketValue: {
    type: Number,
    default: null
  },
  roi: {
    type: Number,
    default: null
  },
  sustainabilityScore: {
    type: Number,
    min: 1,
    max: 10,
    default: null
  },
  climateResilience: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: null
  },
  fertilizerType: {
    type: String,
    enum: ['organic', 'synthetic', 'blended', 'balanced'],
    default: null
  },
  applicationMethod: {
    type: String,
    enum: ['broadcast', 'fertigation', 'foliar', 'banded'],
    default: null
  },
  efficiency: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  monitoringProtocol: [{
    type: String
  }],
  waterSavings: {
    type: Number,
    default: null
  },
  automationLevel: {
    type: String,
    enum: ['manual', 'semi_automated', 'fully_automated'],
    default: null
  },
  mitigationStrategy: {
    type: String,
    default: null
  },
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

export default mongoose.model('Recommendation', recommendationSchema);
