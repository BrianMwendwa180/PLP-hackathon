import SoilHealthRecord from '../models/SoilHealthRecord.js';
import LandParcel from '../models/LandParcel.js';

export const createSoilHealthRecord = async (req, res) => {
  try {
    const { parcelId, vitalityScore, phLevel, moistureLevel, nitrogenLevel, phosphorusLevel, potassiumLevel, organicMatter, temperature, dataSource } = req.body;

    // Verify the land parcel exists and belongs to the user
    const landParcel = await LandParcel.findById(parcelId);
    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to add records to this parcel' });
    }

    const soilHealthRecord = new SoilHealthRecord({
      parcelId,
      vitalityScore,
      phLevel,
      moistureLevel,
      nitrogenLevel,
      phosphorusLevel,
      potassiumLevel,
      organicMatter,
      temperature,
      dataSource
    });

    await soilHealthRecord.save();
    await soilHealthRecord.populate('parcelId', 'name location');

    res.status(201).json({ message: 'Soil health record created successfully', soilHealthRecord });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSoilHealthRecordsByParcel = async (req, res) => {
  try {
    const { parcelId } = req.params;

    // Verify the land parcel exists and belongs to the user
    const landParcel = await LandParcel.findById(parcelId);
    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to view records for this parcel' });
    }

    const records = await SoilHealthRecord.find({ parcelId })
      .populate('parcelId', 'name location')
      .sort({ recordedAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllSoilHealthRecords = async (req, res) => {
  try {
    const records = await SoilHealthRecord.find()
      .populate('parcelId', 'name location')
      .sort({ recordedAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSoilHealthRecordById = async (req, res) => {
  try {
    const record = await SoilHealthRecord.findById(req.params.id)
      .populate('parcelId', 'name location');

    if (!record) {
      return res.status(404).json({ message: 'Soil health record not found' });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateSoilHealthRecord = async (req, res) => {
  try {
    const { vitalityScore, phLevel, moistureLevel, nitrogenLevel, phosphorusLevel, potassiumLevel, organicMatter, temperature, dataSource } = req.body;

    const record = await SoilHealthRecord.findByIdAndUpdate(
      req.params.id,
      { vitalityScore, phLevel, moistureLevel, nitrogenLevel, phosphorusLevel, potassiumLevel, organicMatter, temperature, dataSource },
      { new: true, runValidators: true }
    ).populate('parcelId', 'name location');

    if (!record) {
      return res.status(404).json({ message: 'Soil health record not found' });
    }

    res.json({ message: 'Soil health record updated successfully', record });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteSoilHealthRecord = async (req, res) => {
  try {
    const record = await SoilHealthRecord.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Soil health record not found' });
    }

    res.json({ message: 'Soil health record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
