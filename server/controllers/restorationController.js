import RestorationActivity from '../models/RestorationActivity.js';
import LandParcel from '../models/LandParcel.js';

export const createRestorationActivity = async (req, res) => {
  try {
    const { parcelId, activityType, description, quantity, unit, carbonOffsetKg } = req.body;

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
      carbonOffsetKg
    });

    await restorationActivity.save();
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
    const activities = await RestorationActivity.find()
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
    const { activityType, description, quantity, unit, carbonOffsetKg, verificationStatus } = req.body;

    const activity = await RestorationActivity.findByIdAndUpdate(
      req.params.id,
      { activityType, description, quantity, unit, carbonOffsetKg, verificationStatus },
      { new: true, runValidators: true }
    ).populate([
      { path: 'parcelId', select: 'name location' },
      { path: 'performedBy', select: 'fullName email' }
    ]);

    if (!activity) {
      return res.status(404).json({ message: 'Restoration activity not found' });
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
