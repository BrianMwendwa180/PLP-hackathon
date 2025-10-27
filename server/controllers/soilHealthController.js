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

export const getSoilHealthTrends = async (req, res) => {
  try {
    const { parcelId } = req.params;

    // Verify the land parcel exists and belongs to the user
    const landParcel = await LandParcel.findById(parcelId);
    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to view trends for this parcel' });
    }

    const records = await SoilHealthRecord.find({ parcelId })
      .sort({ recordedAt: 1 })
      .select('vitalityScore phLevel moistureLevel nitrogenLevel phosphorusLevel potassiumLevel organicMatter temperature recordedAt');

    // Calculate trends (simple moving averages and changes)
    const trends = {
      vitalityScore: calculateTrend(records.map(r => ({ value: r.vitalityScore, date: r.recordedAt }))),
      phLevel: calculateTrend(records.map(r => ({ value: r.phLevel, date: r.recordedAt }))),
      moistureLevel: calculateTrend(records.map(r => ({ value: r.moistureLevel, date: r.recordedAt }))),
      npkLevels: {
        nitrogen: calculateTrend(records.map(r => ({ value: r.nitrogenLevel, date: r.recordedAt }))),
        phosphorus: calculateTrend(records.map(r => ({ value: r.phosphorusLevel, date: r.recordedAt }))),
        potassium: calculateTrend(records.map(r => ({ value: r.potassiumLevel, date: r.recordedAt }))),
      },
      organicMatter: calculateTrend(records.map(r => ({ value: r.organicMatter, date: r.recordedAt }))),
      temperature: calculateTrend(records.map(r => ({ value: r.temperature, date: r.recordedAt }))),
    };

    res.json({ trends, records });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAgricultureInsights = async (req, res) => {
  try {
    const { parcelId } = req.params;

    // Verify the land parcel exists and belongs to the user
    const landParcel = await LandParcel.findById(parcelId);
    if (!landParcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (landParcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to view insights for this parcel' });
    }

    const latestRecord = await SoilHealthRecord.findOne({ parcelId })
      .sort({ recordedAt: -1 })
      .select('vitalityScore phLevel moistureLevel nitrogenLevel phosphorusLevel potassiumLevel organicMatter temperature');

    if (!latestRecord) {
      return res.json({ insights: [], fertilityIndex: 0 });
    }

    // Calculate fertility index (weighted average of key factors)
    const fertilityIndex = calculateFertilityIndex(latestRecord);

    // Generate agriculture insights based on soil metrics
    const insights = generateAgricultureInsights(latestRecord, fertilityIndex);

    res.json({ insights, fertilityIndex, latestRecord });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getClimateResilienceAlerts = async (req, res) => {
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

    const records = await SoilHealthRecord.find({ parcelId })
      .sort({ recordedAt: -1 })
      .limit(10)
      .select('vitalityScore phLevel moistureLevel temperature recordedAt');

    // Generate predictive alerts based on trends
    const alerts = generateClimateAlerts(records);

    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const ingestSensorData = async (req, res) => {
  try {
    const { sensorId, apiKey, data } = req.body;

    // Verify sensor exists and API key matches
    const IoTSensor = (await import('../models/IoTSensor.js')).default;
    const sensor = await IoTSensor.findOne({ sensorId, apiKey });
    if (!sensor) {
      return res.status(401).json({ message: 'Invalid sensor ID or API key' });
    }

    if (sensor.status !== 'active') {
      return res.status(403).json({ message: 'Sensor is not active' });
    }

    // Verify parcel ownership
    const landParcel = await LandParcel.findById(sensor.parcelId);
    if (!landParcel) {
      return res.status(404).json({ message: 'Associated land parcel not found' });
    }

    // Map sensor data to soil health record fields
    const recordData = {
      parcelId: sensor.parcelId,
      dataSource: 'iot_sensor',
      recordedAt: new Date()
    };

    // Map based on sensor type
    switch (sensor.sensorType) {
      case 'soil_moisture':
        recordData.moistureLevel = data.value;
        break;
      case 'ph':
        recordData.phLevel = data.value;
        break;
      case 'temperature':
        recordData.temperature = data.value;
        break;
      case 'rainfall':
        recordData.rainfall = data.value;
        break;
      case 'erosion':
        recordData.erosionRate = data.value;
        break;
      case 'npk':
        if (data.nitrogen !== undefined) recordData.nitrogenLevel = data.nitrogen;
        if (data.phosphorus !== undefined) recordData.phosphorusLevel = data.phosphorus;
        if (data.potassium !== undefined) recordData.potassiumLevel = data.potassium;
        break;
      case 'organic_matter':
        recordData.organicMatter = data.value;
        break;
    }

    // Calculate vitality score if enough data
    if (recordData.moistureLevel !== undefined && recordData.phLevel !== undefined) {
      recordData.vitalityScore = calculateVitalityScore(recordData);
    }

    const soilHealthRecord = new SoilHealthRecord(recordData);
    await soilHealthRecord.save();
    await soilHealthRecord.populate('parcelId', 'name location');

    // Update sensor last seen
    sensor.lastSeen = new Date();
    await sensor.save();

    // Check for alerts and create if needed
    const alerts = await checkSensorAlerts(sensor, recordData, landParcel);

    // Emit real-time update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`parcel_${sensor.parcelId}`).emit('sensorUpdate', {
        sensorId: sensor.sensorId,
        sensorType: sensor.sensorType,
        data: recordData,
        alerts: alerts
      });
    }

    res.status(201).json({
      message: 'Sensor data ingested successfully',
      record: soilHealthRecord,
      alerts: alerts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper functions
function calculateTrend(dataPoints) {
  if (dataPoints.length < 2) return { trend: 'insufficient_data', change: 0, average: dataPoints[0]?.value || 0 };

  const validPoints = dataPoints.filter(p => p.value !== null && p.value !== undefined);
  if (validPoints.length < 2) return { trend: 'insufficient_data', change: 0, average: validPoints[0]?.value || 0 };

  const first = validPoints[0].value;
  const last = validPoints[validPoints.length - 1].value;
  const change = last - first;
  const average = validPoints.reduce((sum, p) => sum + p.value, 0) / validPoints.length;

  let trend = 'stable';
  if (change > 5) trend = 'improving';
  else if (change < -5) trend = 'declining';

  return { trend, change, average };
}

function calculateVitalityScore(recordData) {
  let score = 50; // Base score

  // Moisture contribution (optimal 40-60%)
  if (recordData.moistureLevel !== undefined) {
    if (recordData.moistureLevel >= 40 && recordData.moistureLevel <= 60) {
      score += 20;
    } else if (recordData.moistureLevel >= 30 && recordData.moistureLevel <= 70) {
      score += 10;
    } else {
      score -= 10;
    }
  }

  // pH contribution (optimal 6.0-7.5)
  if (recordData.phLevel !== undefined) {
    if (recordData.phLevel >= 6.0 && recordData.phLevel <= 7.5) {
      score += 15;
    } else if (recordData.phLevel >= 5.5 && recordData.phLevel <= 8.0) {
      score += 5;
    } else {
      score -= 15;
    }
  }

  // Temperature contribution (optimal 15-25°C)
  if (recordData.temperature !== undefined) {
    if (recordData.temperature >= 15 && recordData.temperature <= 25) {
      score += 10;
    } else if (recordData.temperature >= 10 && recordData.temperature <= 30) {
      score += 5;
    } else {
      score -= 10;
    }
  }

  // Organic matter contribution
  if (recordData.organicMatter !== undefined) {
    if (recordData.organicMatter >= 3) {
      score += 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}

async function checkSensorAlerts(sensor, recordData, landParcel) {
  const DegradationAlert = (await import('../models/DegradationAlert.js')).default;
  const alerts = [];

  // Moisture alerts
  if (sensor.sensorType === 'soil_moisture' && recordData.moistureLevel !== undefined) {
    if (recordData.moistureLevel < 20) {
      const alert = new DegradationAlert({
        parcelId: sensor.parcelId,
        alertType: 'iot_sensor',
        severity: 'high',
        message: `Soil moisture critically low (${recordData.moistureLevel}%) in ${sensor.location}—irrigation needed.`,
        recommendedAction: 'Initiate irrigation system or schedule manual watering within 24 hours.',
        isResolved: false
      });
      await alert.save();
      alerts.push(alert);
    } else if (recordData.moistureLevel < 30) {
      const alert = new DegradationAlert({
        parcelId: sensor.parcelId,
        alertType: 'iot_sensor',
        severity: 'medium',
        message: `Soil moisture low (${recordData.moistureLevel}%) in ${sensor.location}.`,
        recommendedAction: 'Monitor closely and prepare irrigation if levels continue to drop.',
        isResolved: false
      });
      await alert.save();
      alerts.push(alert);
    }
  }

  // Erosion alerts
  if (sensor.sensorType === 'erosion' && recordData.erosionRate !== undefined) {
    if (recordData.erosionRate > 10) {
      const alert = new DegradationAlert({
        parcelId: sensor.parcelId,
        alertType: 'iot_sensor',
        severity: 'high',
        message: `High erosion detected (${recordData.erosionRate} tons/ha/year) in ${sensor.location}.`,
        recommendedAction: 'Implement erosion control measures such as terracing or vegetation cover.',
        isResolved: false
      });
      await alert.save();
      alerts.push(alert);
    }
  }

  // Temperature alerts
  if (sensor.sensorType === 'temperature' && recordData.temperature !== undefined) {
    if (recordData.temperature > 35) {
      const alert = new DegradationAlert({
        parcelId: sensor.parcelId,
        alertType: 'iot_sensor',
        severity: 'high',
        message: `Extreme temperature (${recordData.temperature}°C) detected in ${sensor.location}—risk of heat stress.`,
        recommendedAction: 'Implement cooling measures or provide shade for crops.',
        isResolved: false
      });
      await alert.save();
      alerts.push(alert);
    } else if (recordData.temperature < 5) {
      const alert = new DegradationAlert({
        parcelId: sensor.parcelId,
        alertType: 'iot_sensor',
        severity: 'medium',
        message: `Low temperature (${recordData.temperature}°C) detected in ${sensor.location}—frost risk.`,
        recommendedAction: 'Monitor for frost damage and prepare protective measures.',
        isResolved: false
      });
      await alert.save();
      alerts.push(alert);
    }
  }

  return alerts;
}

function calculateFertilityIndex(record) {
  let score = 0;
  let factors = 0;

  if (record.vitalityScore !== null) {
    score += record.vitalityScore;
    factors++;
  }
  if (record.organicMatter !== null) {
    score += record.organicMatter;
    factors++;
  }
  if (record.nitrogenLevel !== null) {
    score += Math.min(record.nitrogenLevel / 50, 100); // Normalize NPK to 0-100
    factors++;
  }
  if (record.phosphorusLevel !== null) {
    score += Math.min(record.phosphorusLevel / 50, 100);
    factors++;
  }
  if (record.potassiumLevel !== null) {
    score += Math.min(record.potassiumLevel / 50, 100);
    factors++;
  }

  return factors > 0 ? score / factors : 0;
}

function generateAgricultureInsights(record, fertilityIndex) {
  const insights = [];

  // pH-based recommendations
  if (record.phLevel !== null) {
    if (record.phLevel < 5.5) {
      insights.push({
        type: 'liming',
        title: 'Soil Acidity Management',
        description: 'Consider applying lime to raise pH for better nutrient availability.',
        priority: 'high'
      });
    } else if (record.phLevel > 7.5) {
      insights.push({
        type: 'acidification',
        title: 'Soil Alkalinity Management',
        description: 'Consider sulfur amendments to lower pH if needed for specific crops.',
        priority: 'medium'
      });
    }
  }

  // Moisture-based recommendations
  if (record.moistureLevel !== null) {
    if (record.moistureLevel < 20) {
      insights.push({
        type: 'irrigation',
        title: 'Drought Stress Prevention',
        description: 'Implement irrigation or drought-resistant crop varieties.',
        priority: 'high'
      });
    } else if (record.moistureLevel > 80) {
      insights.push({
        type: 'drainage',
        title: 'Waterlogging Prevention',
        description: 'Improve drainage or select water-tolerant crops.',
        priority: 'medium'
      });
    }
  }

  // NPK-based recommendations
  if (record.nitrogenLevel !== null && record.nitrogenLevel < 20) {
    insights.push({
      type: 'fertilization',
      title: 'Nitrogen Deficiency',
      description: 'Apply nitrogen-rich fertilizers or use nitrogen-fixing crops.',
      priority: 'high'
    });
  }

  if (record.phosphorusLevel !== null && record.phosphorusLevel < 15) {
    insights.push({
      type: 'fertilization',
      title: 'Phosphorus Deficiency',
      description: 'Apply phosphorus fertilizers or use rock phosphate.',
      priority: 'high'
    });
  }

  if (record.potassiumLevel !== null && record.potassiumLevel < 20) {
    insights.push({
      type: 'fertilization',
      title: 'Potassium Deficiency',
      description: 'Apply potash fertilizers or use potassium-rich amendments.',
      priority: 'high'
    });
  }

  // Fertility-based crop suggestions
  if (fertilityIndex > 70) {
    insights.push({
      type: 'crop_suggestion',
      title: 'High Fertility Crops',
      description: 'Suitable for high-demand crops like maize, wheat, or vegetables.',
      priority: 'low'
    });
  } else if (fertilityIndex > 40) {
    insights.push({
      type: 'crop_suggestion',
      title: 'Moderate Fertility Crops',
      description: 'Consider legumes or cover crops to build soil health.',
      priority: 'medium'
    });
  } else {
    insights.push({
      type: 'soil_building',
      title: 'Soil Building Required',
      description: 'Focus on organic matter addition and green manures before planting.',
      priority: 'high'
    });
  }

  return insights;
}

function generateClimateAlerts(records) {
  const alerts = [];

  if (records.length < 2) return alerts;

  const latest = records[0];
  const previous = records[1];

  // Drought risk
  if (latest.moistureLevel !== null && previous.moistureLevel !== null) {
    const moistureDrop = previous.moistureLevel - latest.moistureLevel;
    if (moistureDrop > 15) {
      alerts.push({
        type: 'drought_risk',
        title: 'Drought Risk Alert',
        description: `Moisture levels dropped ${moistureDrop.toFixed(1)}% - prepare irrigation or drought-resistant measures.`,
        severity: 'high',
        triggeredAt: new Date()
      });
    }
  }

  // Temperature stress
  if (latest.temperature !== null && (latest.temperature > 35 || latest.temperature < 5)) {
    alerts.push({
      type: 'temperature_stress',
      title: 'Temperature Stress Alert',
      description: `Temperature at ${latest.temperature}°C may stress crops - consider protective measures.`,
      severity: 'medium',
      triggeredAt: new Date()
    });
  }

  // Soil degradation risk
  if (latest.vitalityScore !== null && previous.vitalityScore !== null) {
    const vitalityDrop = previous.vitalityScore - latest.vitalityScore;
    if (vitalityDrop > 10) {
      alerts.push({
        type: 'degradation_risk',
        title: 'Soil Degradation Alert',
        description: `Vitality score dropped ${vitalityDrop.toFixed(1)} points - review land management practices.`,
        severity: 'high',
        triggeredAt: new Date()
      });
    }
  }

  return alerts;
}
