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

export const generateAgricultureRecommendations = async (req, res) => {
  try {
    const { parcelId } = req.params;

    // Verify the land parcel exists and belongs to the user
    const landParcel = await LandParcel.findById(parcelId);
    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to generate recommendations for this parcel' });
    }

    // Get latest soil health record
    const latestRecord = await require('../models/SoilHealthRecord.js').findOne({ parcelId })
      .sort({ recordedAt: -1 });

    if (!latestRecord) {
      return res.json({ recommendations: [] });
    }

    // Generate agriculture-specific recommendations based on soil data
    const recommendations = generateAgricultureRecommendationsFromSoil(latestRecord, parcelId, req.user.userId);

    // Save generated recommendations
    const savedRecommendations = [];
    for (const rec of recommendations) {
      const recommendation = new Recommendation({
        parcelId,
        userId: req.user.userId,
        ...rec,
        aiGenerated: true
      });
      await recommendation.save();
      savedRecommendations.push(recommendation);
    }

    res.json({ message: 'Agriculture recommendations generated successfully', recommendations: savedRecommendations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to generate agriculture recommendations
function generateAgricultureRecommendationsFromSoil(soilRecord, parcelId, userId) {
  const recommendations = [];

  // pH-based recommendations
  if (soilRecord.phLevel !== null) {
    if (soilRecord.phLevel < 5.5) {
      recommendations.push({
        recommendationType: 'liming',
        title: 'Apply Lime to Correct Soil Acidity',
        description: 'Your soil pH is too low for optimal plant growth. Apply agricultural lime to raise pH to 6.0-7.0 range.',
        priority: 'high',
        estimatedCost: 500,
        estimatedTimeDays: 7
      });
    } else if (soilRecord.phLevel > 7.5) {
      recommendations.push({
        recommendationType: 'soil_amendment',
        title: 'Address Soil Alkalinity',
        description: 'Consider sulfur amendments or acidifying fertilizers to lower pH for better nutrient availability.',
        priority: 'medium',
        estimatedCost: 300,
        estimatedTimeDays: 14
      });
    }
  }

  // Moisture-based recommendations
  if (soilRecord.moistureLevel !== null) {
    if (soilRecord.moistureLevel < 20) {
      recommendations.push({
        recommendationType: 'irrigation',
        title: 'Implement Irrigation System',
        description: 'Soil moisture is critically low. Install drip irrigation or sprinkler system for consistent water supply.',
        priority: 'high',
        estimatedCost: 2000,
        estimatedTimeDays: 30
      });
      recommendations.push({
        recommendationType: 'cover_cropping',
        title: 'Plant Cover Crops',
        description: 'Use drought-tolerant cover crops like clover or rye to improve water retention.',
        priority: 'medium',
        estimatedCost: 150,
        estimatedTimeDays: 45
      });
    } else if (soilRecord.moistureLevel > 80) {
      recommendations.push({
        recommendationType: 'drainage',
        title: 'Improve Soil Drainage',
        description: 'Excessive moisture detected. Install drainage tiles or raised beds to prevent waterlogging.',
        priority: 'high',
        estimatedCost: 1500,
        estimatedTimeDays: 21
      });
    }
  }

  // NPK-based recommendations
  if (soilRecord.nitrogenLevel !== null && soilRecord.nitrogenLevel < 20) {
    recommendations.push({
      recommendationType: 'fertilization',
      title: 'Nitrogen Fertilizer Application',
      description: 'Nitrogen levels are low. Apply nitrogen-rich fertilizer or plant nitrogen-fixing legumes.',
      priority: 'high',
      estimatedCost: 200,
      estimatedTimeDays: 3
    });
  }

  if (soilRecord.phosphorusLevel !== null && soilRecord.phosphorusLevel < 15) {
    recommendations.push({
      recommendationType: 'fertilization',
      title: 'Phosphorus Fertilizer Application',
      description: 'Phosphorus deficiency detected. Apply rock phosphate or superphosphate fertilizer.',
      priority: 'high',
      estimatedCost: 180,
      estimatedTimeDays: 3
    });
  }

  if (soilRecord.potassiumLevel !== null && soilRecord.potassiumLevel < 20) {
    recommendations.push({
      recommendationType: 'fertilization',
      title: 'Potassium Fertilizer Application',
      description: 'Potassium levels are low. Apply potash fertilizer to support plant health and disease resistance.',
      priority: 'high',
      estimatedCost: 160,
      estimatedTimeDays: 3
    });
  }

  // Organic matter recommendations
  if (soilRecord.organicMatter !== null && soilRecord.organicMatter < 2) {
    recommendations.push({
      recommendationType: 'organic_matter_addition',
      title: 'Increase Organic Matter Content',
      description: 'Low organic matter detected. Add compost, manure, or plant cover crops to improve soil structure.',
      priority: 'medium',
      estimatedCost: 400,
      estimatedTimeDays: 60
    });
  }

  // Crop rotation recommendations based on soil vitality
  if (soilRecord.vitalityScore !== null) {
    if (soilRecord.vitalityScore > 70) {
      recommendations.push({
        recommendationType: 'crop_rotation',
        title: 'High-Value Crop Rotation',
        description: 'Soil conditions are excellent for high-demand crops. Consider maize, wheat, or vegetable rotation.',
        priority: 'low',
        estimatedCost: 0,
        estimatedTimeDays: 0
      });
    } else if (soilRecord.vitalityScore > 40) {
      recommendations.push({
        recommendationType: 'crop_rotation',
        title: 'Soil-Building Crop Rotation',
        description: 'Implement legume-cereal rotation to improve soil fertility naturally.',
        priority: 'medium',
        estimatedCost: 100,
        estimatedTimeDays: 90
      });
    } else {
      recommendations.push({
        recommendationType: 'cover_cropping',
        title: 'Extended Cover Cropping',
        description: 'Soil needs significant improvement. Focus on multi-year cover cropping before cash crops.',
        priority: 'high',
        estimatedCost: 300,
        estimatedTimeDays: 180
      });
    }
  }

  return recommendations;
}
