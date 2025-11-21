import RestorationActivity from '../models/RestorationActivity.js';
import LandParcel from '../models/LandParcel.js';
import UserModuleInteraction from '../models/UserModuleInteraction.js';

export const createRestorationActivity = async (req, res) => {
  try {
    const { parcelId, activityType, description, quantity, unit, carbonOffsetKg, accessedModule } = req.body;

    // Verify the land parcel exists and belongs to the user
    const landParcel = await LandParcel.findById(parcelId);
    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to add activities to this parcel' });
    }

    const restorationActivity = new RestorationActivity({
      parcelId,
      activityType,
      description,
      quantity,
      unit,
      performedBy: req.user.userId,
      carbonOffsetKg,
      accessedModule
    });

    await restorationActivity.save();

    // Track module interaction if accessedModule is provided
    if (accessedModule) {
      await UserModuleInteraction.findOneAndUpdate(
        { userId: req.user.userId, moduleName: accessedModule },
        {
          $inc: { accessCount: 1 },
          $set: { lastAccessed: new Date() }
        },
        { upsert: true, new: true }
      );
    }

    await restorationActivity.populate([
      { path: 'parcelId', select: 'name location' },
      { path: 'performedBy', select: 'fullName email' }
    ]);

    res.status(201).json({ message: 'Restoration activity created successfully', restorationActivity });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getRestorationActivitiesByParcel = async (req, res) => {
  try {
    const { parcelId } = req.params;

    // Verify the land parcel exists and belongs to the user
    const landParcel = await LandParcel.findById(parcelId);
    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to view activities for this parcel' });
    }

    const activities = await RestorationActivity.find({ parcelId })
      .populate([
        { path: 'parcelId', select: 'name location' },
        { path: 'performedBy', select: 'fullName email' }
      ])
      .sort({ performedAt: -1 });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllRestorationActivities = async (req, res) => {
  try {
    const activities = await RestorationActivity.find({ performedBy: req.user.userId })
      .populate([
        { path: 'parcelId', select: 'name location' },
        { path: 'performedBy', select: 'fullName email' }
      ])
      .sort({ performedAt: -1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getRestorationActivityById = async (req, res) => {
  try {
    const activity = await RestorationActivity.findById(req.params.id)
      .populate([
        { path: 'parcelId', select: 'name location' },
        { path: 'performedBy', select: 'fullName email' }
      ]);

    if (!activity) {
      return res.status(404).json({ message: 'Restoration activity not found' });
    }

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateRestorationActivity = async (req, res) => {
  try {
    const { activityType, description, quantity, unit, carbonOffsetKg, verificationStatus, accessedModule } = req.body;

    const activity = await RestorationActivity.findByIdAndUpdate(
      req.params.id,
      { activityType, description, quantity, unit, carbonOffsetKg, verificationStatus, accessedModule },
      { new: true, runValidators: true }
    ).populate([
      { path: 'parcelId', select: 'name location' },
      { path: 'performedBy', select: 'fullName email' }
    ]);

    if (!activity) {
      return res.status(404).json({ message: 'Restoration activity not found' });
    }

    // Track module interaction if accessedModule is provided and changed
    if (accessedModule) {
      await UserModuleInteraction.findOneAndUpdate(
        { userId: req.user.userId, moduleName: accessedModule },
        {
          $inc: { accessCount: 1 },
          $set: { lastAccessed: new Date() }
        },
        { upsert: true, new: true }
      );
    }

    res.json({ message: 'Restoration activity updated successfully', activity });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteRestorationActivity = async (req, res) => {
  try {
    const activity = await RestorationActivity.findByIdAndDelete(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Restoration activity not found' });
    }

    res.json({ message: 'Restoration activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getRestorationProgress = async (req, res) => {
  try {
    const { parcelId } = req.params;

    // Verify the land parcel exists and belongs to the user
    const landParcel = await LandParcel.findById(parcelId);
    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to view progress for this parcel' });
    }

    // Get all restoration activities for the parcel
    const activities = await RestorationActivity.find({ parcelId })
      .sort({ performedAt: 1 });

    // Get soil health records to track improvement
    const soilRecords = await require('../models/SoilHealthRecord.js').find({ parcelId })
      .sort({ recordedAt: 1 })
      .select('vitalityScore recordedAt');

    // Calculate progress metrics
    const totalActivities = activities.length;
    const verifiedActivities = activities.filter(a => a.verificationStatus === 'verified').length;
    const totalCarbonOffset = activities.reduce((sum, a) => sum + a.carbonOffsetKg, 0);

    // Calculate soil improvement over time
    let soilImprovement = 0;
    if (soilRecords.length >= 2) {
      const firstScore = soilRecords[0].vitalityScore;
      const lastScore = soilRecords[soilRecords.length - 1].vitalityScore;
      if (firstScore && lastScore) {
        soilImprovement = lastScore - firstScore;
      }
    }

    // Group activities by type for progress tracking
    const activityTypes = {};
    activities.forEach(activity => {
      if (!activityTypes[activity.activityType]) {
        activityTypes[activity.activityType] = {
          count: 0,
          totalQuantity: 0,
          unit: activity.unit,
          carbonOffset: 0
        };
      }
      activityTypes[activity.activityType].count++;
      activityTypes[activity.activityType].totalQuantity += activity.quantity;
      activityTypes[activity.activityType].carbonOffset += activity.carbonOffsetKg;
    });

    // Calculate rehabilitation percentage (simplified metric)
    const rehabilitationProgress = Math.min(totalActivities * 5, 100); // 20 activities = 100%

    const progress = {
      totalActivities,
      verifiedActivities,
      totalCarbonOffset,
      soilImprovement,
      rehabilitationProgress,
      activityTypes,
      soilRecords: soilRecords.slice(-5), // Last 5 records for trend
      activities: activities.slice(-10) // Last 10 activities
    };

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
