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

export const generateClimateAlerts = async (req, res) => {
  try {
    const { parcelId } = req.params;

    // Verify the land parcel exists and belongs to the user
    const landParcel = await LandParcel.findById(parcelId);
    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to generate alerts for this parcel' });
    }

    // Get recent soil records for analysis
    const soilRecords = await require('../models/SoilHealthRecord.js').find({ parcelId })
      .sort({ recordedAt: -1 })
      .limit(10)
      .select('vitalityScore phLevel moistureLevel temperature recordedAt');

    if (soilRecords.length < 2) {
      return res.json({ alerts: [] });
    }

    // Generate alerts based on soil trends
    const alerts = generateAlertsFromSoilData(soilRecords, parcelId, req.user.userId);

    // Save generated alerts
    const savedAlerts = [];
    for (const alertData of alerts) {
      const alert = new DegradationAlert({
        parcelId,
        ...alertData,
        aiDetected: true
      });
      await alert.save();
      savedAlerts.push(alert);
    }

    res.json({ message: 'Climate alerts generated successfully', alerts: savedAlerts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to generate climate resilience alerts
function generateAlertsFromSoilData(records, parcelId, userId) {
  const alerts = [];

  if (records.length < 2) return alerts;

  const latest = records[0];
  const previous = records[1];

  // Drought risk alert
  if (latest.moistureLevel !== null && previous.moistureLevel !== null) {
    const moistureDrop = previous.moistureLevel - latest.moistureLevel;
    if (moistureDrop > 15) {
      alerts.push({
        alertType: 'drought_risk',
        severity: 'high',
        title: 'Drought Risk Alert',
        description: `Soil moisture has dropped ${moistureDrop.toFixed(1)}% in recent measurements. This indicates potential drought stress that could impact crop yields.`,
        recommendedActions: [
          'Implement immediate irrigation measures',
          'Consider drought-resistant crop varieties',
          'Apply mulch to reduce evaporation',
          'Monitor soil moisture closely for the next 7 days'
        ],
        status: 'active'
      });
    }
  }

  // Temperature stress alert
  if (latest.temperature !== null && (latest.temperature > 35 || latest.temperature < 5)) {
    const severity = latest.temperature > 35 ? 'high' : 'medium';
    const tempType = latest.temperature > 35 ? 'heat' : 'cold';

    alerts.push({
      alertType: 'temperature_stress',
      severity,
      title: `${tempType.charAt(0).toUpperCase() + tempType.slice(1)} Stress Alert`,
      description: `Soil temperature is ${latest.temperature}°C, which may cause ${tempType} stress to plants and soil microorganisms.`,
      recommendedActions: [
        `Implement ${tempType} protection measures (shade cloth for heat, row covers for cold)`,
        'Consider timing-sensitive planting',
        'Monitor plant health indicators',
        'Adjust irrigation frequency based on temperature'
      ],
      status: 'active'
    });
  }

  // Soil degradation alert
  if (latest.vitalityScore !== null && previous.vitalityScore !== null) {
    const vitalityDrop = previous.vitalityScore - latest.vitalityScore;
    if (vitalityDrop > 10) {
      alerts.push({
        alertType: 'degradation_risk',
        severity: 'high',
        title: 'Soil Degradation Alert',
        description: `Soil vitality score has decreased by ${vitalityDrop.toFixed(1)} points, indicating potential soil health decline.`,
        recommendedActions: [
          'Conduct detailed soil analysis',
          'Implement soil conservation practices',
          'Increase organic matter inputs',
          'Review land management practices',
          'Consider cover cropping or no-till methods'
        ],
        status: 'active'
      });
    }
  }

  // pH drift alert
  if (latest.phLevel !== null && previous.phLevel !== null) {
    const phChange = Math.abs(latest.phLevel - previous.phLevel);
    if (phChange > 0.5) {
      const direction = latest.phLevel > previous.phLevel ? 'increased' : 'decreased';
      alerts.push({
        alertType: 'ph_drift',
        severity: 'medium',
        title: 'Soil pH Drift Alert',
        description: `Soil pH has ${direction} by ${phChange.toFixed(1)} units, which may affect nutrient availability.`,
        recommendedActions: [
          'Test soil pH more frequently',
          'Apply appropriate amendments (lime for acidity, sulfur for alkalinity)',
          'Monitor crop nutrient uptake',
          'Adjust fertilization program based on pH'
        ],
        status: 'active'
      });
    }
  }

  // Extreme weather vulnerability
  const recentRecords = records.slice(0, 5);
  const avgMoisture = recentRecords.reduce((sum, r) => sum + (r.moistureLevel || 0), 0) / recentRecords.length;
  const avgTemp = recentRecords.reduce((sum, r) => sum + (r.temperature || 0), 0) / recentRecords.length;

  if (avgMoisture < 25 && avgTemp > 30) {
    alerts.push({
      alertType: 'extreme_weather_risk',
      severity: 'critical',
      title: 'Extreme Weather Vulnerability Alert',
      description: 'Current conditions (low moisture + high temperature) indicate high vulnerability to extreme weather events.',
      recommendedActions: [
        'Implement emergency irrigation protocols',
        'Prepare heat stress mitigation strategies',
        'Monitor weather forecasts closely',
        'Have contingency plans for extreme weather events',
        'Consider crop insurance options'
      ],
      status: 'active'
    });
  }

  return alerts;
}
