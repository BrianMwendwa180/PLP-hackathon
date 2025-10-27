import IoTSensor from '../models/IoTSensor.js';
import LandParcel from '../models/LandParcel.js';
import crypto from 'crypto';

export const registerSensor = async (req, res) => {
  try {
    const { parcelId, sensorType, sensorId, name, location, thresholds, units } = req.body;

    // Verify the land parcel exists and belongs to the user
    const landParcel = await LandParcel.findById(parcelId);
    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to register sensors for this parcel' });
    }

    // Generate unique API key
    const apiKey = crypto.randomBytes(32).toString('hex');

    const sensor = new IoTSensor({
      parcelId,
      sensorType,
      sensorId,
      name,
      location,
      thresholds,
      units,
      apiKey,
      status: 'active'
    });

    await sensor.save();
    await sensor.populate('parcelId', 'name location');

    res.status(201).json({
      message: 'Sensor registered successfully',
      sensor: {
        ...sensor.toObject(),
        apiKey // Include API key in response (only shown once)
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Sensor ID already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSensorsByParcel = async (req, res) => {
  try {
    const { parcelId } = req.params;

    // Verify the land parcel exists and belongs to the user
    const landParcel = await LandParcel.findById(parcelId);
    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to view sensors for this parcel' });
    }

    const sensors = await IoTSensor.find({ parcelId })
      .populate('parcelId', 'name location')
      .sort({ createdAt: -1 });

    // Remove API keys from response for security
    const sensorsWithoutKeys = sensors.map(sensor => {
      const sensorObj = sensor.toObject();
      delete sensorObj.apiKey;
      return sensorObj;
    });

    res.json(sensorsWithoutKeys);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSensorById = async (req, res) => {
  try {
    const sensor = await IoTSensor.findById(req.params.id)
      .populate('parcelId', 'name location');

    if (!sensor) {
      return res.status(404).json({ message: 'Sensor not found' });
    }

    // Verify ownership
    const landParcel = await LandParcel.findById(sensor.parcelId);
    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to view this sensor' });
    }

    // Remove API key from response
    const sensorObj = sensor.toObject();
    delete sensorObj.apiKey;

    res.json(sensorObj);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateSensor = async (req, res) => {
  try {
    const { name, location, status, thresholds, units } = req.body;

    const sensor = await IoTSensor.findById(req.params.id);
    if (!sensor) {
      return res.status(404).json({ message: 'Sensor not found' });
    }

    // Verify ownership
    const landParcel = await LandParcel.findById(sensor.parcelId);
    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to update this sensor' });
    }

    const updatedSensor = await IoTSensor.findByIdAndUpdate(
      req.params.id,
      { name, location, status, thresholds, units },
      { new: true, runValidators: true }
    ).populate('parcelId', 'name location');

    // Remove API key from response
    const sensorObj = updatedSensor.toObject();
    delete sensorObj.apiKey;

    res.json({
      message: 'Sensor updated successfully',
      sensor: sensorObj
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteSensor = async (req, res) => {
  try {
    const sensor = await IoTSensor.findById(req.params.id);
    if (!sensor) {
      return res.status(404).json({ message: 'Sensor not found' });
    }

    // Verify ownership
    const landParcel = await LandParcel.findById(sensor.parcelId);
    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this sensor' });
    }

    await IoTSensor.findByIdAndDelete(req.params.id);

    res.json({ message: 'Sensor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllSensors = async (req, res) => {
  try {
    const sensors = await IoTSensor.find()
      .populate('parcelId', 'name location')
      .sort({ createdAt: -1 });

    // Remove API keys from response
    const sensorsWithoutKeys = sensors.map(sensor => {
      const sensorObj = sensor.toObject();
      delete sensorObj.apiKey;
      return sensorObj;
    });

    res.json(sensorsWithoutKeys);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
