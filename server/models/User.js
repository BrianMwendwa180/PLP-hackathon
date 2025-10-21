import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    default: ''
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['farmer', 'expert', 'researcher', 'authority', 'developer'],
    default: 'farmer'
  },
  organization: {
    type: String,
    default: ''
  },
  impactPoints: {
    type: Number,
    default: 0
  },
  badges: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);
