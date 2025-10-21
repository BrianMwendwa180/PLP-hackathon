import Recommendation from '../models/Recommendation.js';
import LandParcel from '../models/LandParcel.js';

export const createRecommendation = async (req, res) => {
  try {
    const { parcelId, recommendationType, title, description, priority, estimatedCost, estimatedTimeDays, aiGenerated } = req.body;

    // Verify the land parcel exists and belongs to the user
    const landParcel = await LandParcel.findById(parcelId);
    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to add recommendations to this parcel' });
    }

    const recommendation = new Recommendation({
      parcelId,
      userId: req.user.userId,
      recommendationType,
      title,
      description,
      priority,
      estimatedCost,
      estimatedTimeDays,
      aiGenerated
    });

    await recommendation.save();
    await recommendation.populate([
      { path: 'parcelId', select: 'name location' },
      { path: 'userId', select: 'fullName email' }
    ]);

    res.status(201).json({ message: 'Recommendation created successfully', recommendation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getRecommendationsByParcel = async (req, res) => {
  try {
    const { parcelId } = req.params;

    // Verify the land parcel exists and belongs to the user
    const landParcel = await LandParcel.findById(parcelId);
    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to view recommendations for this parcel' });
    }

    const recommendations = await Recommendation.find({ parcelId })
      .populate([
        { path: 'parcelId', select: 'name location' },
        { path: 'userId', select: 'fullName email' }
      ])
      .sort({ createdAt: -1 });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllRecommendations = async (req, res) => {
  try {
    const recommendations = await Recommendation.find()
      .populate([
        { path: 'parcelId', select: 'name location' },
        { path: 'userId', select: 'fullName email' }
      ])
      .sort({ createdAt: -1 });
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getRecommendationById = async (req, res) => {
  try {
    const recommendation = await Recommendation.findById(req.params.id)
      .populate([
        { path: 'parcelId', select: 'name location' },
        { path: 'userId', select: 'fullName email' }
      ]);

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateRecommendation = async (req, res) => {
  try {
    const { recommendationType, title, description, priority, estimatedCost, estimatedTimeDays, status } = req.body;

    const recommendation = await Recommendation.findByIdAndUpdate(
      req.params.id,
      { recommendationType, title, description, priority, estimatedCost, estimatedTimeDays, status },
      { new: true, runValidators: true }
    ).populate([
      { path: 'parcelId', select: 'name location' },
      { path: 'userId', select: 'fullName email' }
    ]);

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    res.json({ message: 'Recommendation updated successfully', recommendation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteRecommendation = async (req, res) => {
  try {
    const recommendation = await Recommendation.findByIdAndDelete(req.params.id);

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    res.json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
