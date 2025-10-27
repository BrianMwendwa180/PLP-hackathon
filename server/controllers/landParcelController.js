import LandParcel from '../models/LandParcel.js';

export const createLandParcel = async (req, res) => {
  try {
    const { name, location, latitude, longitude, sizeHectares, landUseType, soilType, vegetationType, irrigationType, climateZone } = req.body;

    const landParcel = new LandParcel({
      name,
      location,
      latitude,
      longitude,
      sizeHectares,
      ownerId: req.user.userId,
      landUseType,
      soilType,
      vegetationType,
      irrigationType,
      climateZone
    });

    await landParcel.save();
    await landParcel.populate('ownerId', 'fullName email');

    res.status(201).json({ message: 'Land parcel created successfully', landParcel });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserLandParcels = async (req, res) => {
  try {
    const landParcels = await LandParcel.find({ ownerId: req.user.userId })
      .populate('ownerId', 'fullName email');
    res.json(landParcels);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllLandParcels = async (req, res) => {
  try {
    const landParcels = await LandParcel.find()
      .populate('ownerId', 'fullName email');
    res.json(landParcels);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getLandParcelById = async (req, res) => {
  try {
    const landParcel = await LandParcel.findById(req.params.id)
      .populate('ownerId', 'fullName email');

    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    res.json(landParcel);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateLandParcel = async (req, res) => {
  try {
    const { name, location, latitude, longitude, sizeHectares, landUseType, soilType, vegetationType, irrigationType, climateZone } = req.body;

    const landParcel = await LandParcel.findByIdAndUpdate(
      req.params.id,
      { name, location, latitude, longitude, sizeHectares, landUseType, soilType, vegetationType, irrigationType, climateZone },
      { new: true, runValidators: true }
    ).populate('ownerId', 'fullName email');

    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    res.json({ message: 'Land parcel updated successfully', landParcel });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteLandParcel = async (req, res) => {
  try {
    const landParcel = await LandParcel.findByIdAndDelete(req.params.id);

    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    res.json({ message: 'Land parcel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
