import DegradationAlert from '../models/DegradationAlert.js';
import LandParcel from '../models/LandParcel.js';

export const createDegradationAlert = async (req, res) => {
  try {
    const { parcelId, alertType, severity, title, description, recommendedActions, aiDetected } = req.body;

    // Verify the land parcel exists and belongs to the user
    const landParcel = await LandParcel.findById(parcelId);
    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to add alerts to this parcel' });
    }

    const alert = new DegradationAlert({
      parcelId,
      alertType,
      severity,
      title,
      description,
      recommendedActions,
      aiDetected
    });

    await alert.save();
    await alert.populate('parcelId', 'name location');

    res.status(201).json({ message: 'Degradation alert created successfully', alert });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAlertsByParcel = async (req, res) => {
  try {
    const { parcelId } = req.params;

    // Verify the land parcel exists and belongs to the user
    const landParcel = await LandParcel.findById(parcelId);
    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to view alerts for this parcel' });
    }

    const alerts = await DegradationAlert.find({ parcelId })
      .populate('parcelId', 'name location')
      .sort({ detectedAt: -1 });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllAlerts = async (req, res) => {
  try {
    const alerts = await DegradationAlert.find()
      .populate('parcelId', 'name location')
      .sort({ detectedAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAlertById = async (req, res) => {
  try {
    const alert = await DegradationAlert.findById(req.params.id)
      .populate('parcelId', 'name location');

    if (!alert) {
      return res.status(404).json({ message: 'Degradation alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateAlert = async (req, res) => {
  try {
    const { alertType, severity, title, description, status, recommendedActions } = req.body;

    const alert = await DegradationAlert.findByIdAndUpdate(
      req.params.id,
      { alertType, severity, title, description, status, recommendedActions },
      { new: true, runValidators: true }
    ).populate('parcelId', 'name location');

    if (!alert) {
      return res.status(404).json({ message: 'Degradation alert not found' });
    }

    res.json({ message: 'Degradation alert updated successfully', alert });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteAlert = async (req, res) => {
  try {
    const alert = await DegradationAlert.findByIdAndDelete(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: 'Degradation alert not found' });
    }

    res.json({ message: 'Degradation alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
