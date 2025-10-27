import express from 'express';
import {
  createSoilHealthRecord,
  getSoilHealthRecordsByParcel,
  getAllSoilHealthRecords,
  getSoilHealthRecordById,
  updateSoilHealthRecord,
  deleteSoilHealthRecord,
  getSoilHealthTrends,
  getAgricultureInsights,
  getClimateResilienceAlerts,
  ingestSensorData
} from '../controllers/soilHealthController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import SoilHealthRecord from '../models/SoilHealthRecord.js';

const router = express.Router();

// @route   POST /api/soil-health
// @desc    Create a new soil health record
// @access  Private
router.post('/', authenticateToken, createSoilHealthRecord);

// @route   GET /api/soil-health/parcel/:parcelId
// @desc    Get soil health records by parcel ID
// @access  Private
router.get('/parcel/:parcelId', authenticateToken, getSoilHealthRecordsByParcel);

// @route   GET /api/soil-health
// @desc    Get all soil health records
// @access  Private (Admin only)
router.get('/', authenticateToken, getAllSoilHealthRecords);

// @route   GET /api/soil-health/:id
// @desc    Get soil health record by ID
// @access  Private
router.get('/:id', authenticateToken, getSoilHealthRecordById);

// @route   PUT /api/soil-health/:id
// @desc    Update soil health record
// @access  Private
router.put('/:id', authenticateToken, updateSoilHealthRecord);

// @route   DELETE /api/soil-health/:id
// @desc    Delete soil health record
// @access  Private
router.delete('/:id', authenticateToken, deleteSoilHealthRecord);

// @route   GET /api/soil-health/parcel/:parcelId/trends
// @desc    Get soil health trends for a parcel
// @access  Private
router.get('/parcel/:parcelId/trends', authenticateToken, getSoilHealthTrends);

// @route   GET /api/soil-health/parcel/:parcelId/agriculture-insights
// @desc    Get agriculture insights for a parcel
// @access  Private
router.get('/parcel/:parcelId/agriculture-insights', authenticateToken, getAgricultureInsights);

// @route   GET /api/soil-health/parcel/:parcelId/climate-alerts
// @desc    Get climate resilience alerts for a parcel
// @access  Private
router.get('/parcel/:parcelId/climate-alerts', authenticateToken, getClimateResilienceAlerts);

// @route   GET /api/soil-health/analytics/trends/:parcelId
// @desc    Get soil health trends analytics for a parcel
// @access  Private
router.get('/analytics/trends/:parcelId', authenticateToken, async (req, res) => {
  try {
    const { parcelId } = req.params;
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const records = await SoilHealthRecord.find({
      parcelId,
      recordedAt: { $gte: startDate }
    }).sort({ recordedAt: 1 });

    const trends = {
      parcelId,
      period: `${period} days`,
      records: records.map(r => ({
        date: r.recordedAt,
        vitalityScore: r.vitalityScore,
        phLevel: r.phLevel,
        moistureLevel: r.moistureLevel,
        temperature: r.temperature
      })),
      summary: {
        averageVitality: records.length > 0 ? records.reduce((sum, r) => sum + r.vitalityScore, 0) / records.length : 0,
        totalRecords: records.length,
        trend: records.length >= 2 ? (records[records.length - 1].vitalityScore - records[0].vitalityScore) : 0
      }
    };

    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/soil-health/analytics/summary
// @desc    Get soil health analytics summary
// @access  Private
router.get('/analytics/summary', authenticateToken, async (req, res) => {
  try {
    const totalRecords = await SoilHealthRecord.countDocuments();
    const averageVitality = await SoilHealthRecord.aggregate([
      { $group: { _id: null, avg: { $avg: '$vitalityScore' } } }
    ]);

    const parcelsWithRecords = await SoilHealthRecord.distinct('parcelId');
    const totalParcels = parcelsWithRecords.length;

    res.json({
      totalRecords,
      totalParcels,
      averageVitality: averageVitality[0]?.avg || 0,
      lastUpdated: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/soil-health/analytics/fertility/:parcelId
// @desc    Get fertility index for a parcel
// @access  Private
router.get('/analytics/fertility/:parcelId', authenticateToken, async (req, res) => {
  try {
    const { parcelId } = req.params;

    const latestRecord = await SoilHealthRecord.findOne({ parcelId })
      .sort({ recordedAt: -1 });

    if (!latestRecord) {
      return res.status(404).json({ message: 'No soil records found for this parcel' });
    }

    // Calculate fertility index based on key nutrients and pH
    const fertilityIndex = calculateFertilityIndex(latestRecord);

    res.json({
      parcelId,
      fertilityIndex,
      factors: {
        phLevel: latestRecord.phLevel,
        nitrogenLevel: latestRecord.nitrogenLevel,
        phosphorusLevel: latestRecord.phosphorusLevel,
        potassiumLevel: latestRecord.potassiumLevel,
        organicMatter: latestRecord.organicMatter
      },
      lastUpdated: latestRecord.recordedAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/soil-health/ingest
// @desc    Ingest sensor data from IoT devices
// @access  Public (API key authentication)
router.post('/ingest', ingestSensorData);

function calculateFertilityIndex(record) {
  let score = 0;
  let maxScore = 0;

  // pH factor (optimal 6.0-7.0)
  if (record.phLevel) {
    maxScore += 20;
    if (record.phLevel >= 6.0 && record.phLevel <= 7.0) {
      score += 20;
    } else if (record.phLevel >= 5.5 && record.phLevel <= 7.5) {
      score += 15;
    } else {
      score += 5;
    }
  }

  // Nitrogen (optimal > 0.15%)
  if (record.nitrogenLevel) {
    maxScore += 25;
    if (record.nitrogenLevel > 0.15) score += 25;
    else if (record.nitrogenLevel > 0.10) score += 20;
    else if (record.nitrogenLevel > 0.05) score += 15;
    else score += 5;
  }

  // Phosphorus (optimal > 20 ppm)
  if (record.phosphorusLevel) {
    maxScore += 25;
    if (record.phosphorusLevel > 20) score += 25;
    else if (record.phosphorusLevel > 15) score += 20;
    else if (record.phosphorusLevel > 10) score += 15;
    else score += 5;
  }

  // Potassium (optimal > 150 ppm)
  if (record.potassiumLevel) {
    maxScore += 20;
    if (record.potassiumLevel > 150) score += 20;
    else if (record.potassiumLevel > 100) score += 15;
    else if (record.potassiumLevel > 50) score += 10;
    else score += 5;
  }

  // Organic matter (optimal > 3%)
  if (record.organicMatter) {
    maxScore += 10;
    if (record.organicMatter > 3) score += 10;
    else if (record.organicMatter > 2) score += 7;
    else if (record.organicMatter > 1) score += 5;
    else score += 2;
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

export default router;
