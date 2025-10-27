import express from 'express';
import {
  createDegradationAlert,
  getAlertsByParcel,
  getAllAlerts,
  getAlertById,
  updateAlert,
  deleteAlert,
  generateClimateAlerts
} from '../controllers/alertController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import DegradationAlert from '../models/DegradationAlert.js';

const router = express.Router();

// @route   POST /api/alerts
// @desc    Create a new degradation alert
// @access  Private
router.post('/', authenticateToken, createDegradationAlert);

// @route   GET /api/alerts/parcel/:parcelId
// @desc    Get alerts by parcel ID
// @access  Private
router.get('/parcel/:parcelId', authenticateToken, getAlertsByParcel);

// @route   GET /api/alerts
// @desc    Get all alerts
// @access  Private (Admin only)
router.get('/', authenticateToken, getAllAlerts);

// @route   GET /api/alerts/:id
// @desc    Get alert by ID
// @access  Private
router.get('/:id', authenticateToken, getAlertById);

// @route   PUT /api/alerts/:id
// @desc    Update alert
// @access  Private
router.put('/:id', authenticateToken, updateAlert);

// @route   DELETE /api/alerts/:id
// @desc    Delete alert
// @access  Private
router.delete('/:id', authenticateToken, deleteAlert);

// @route   POST /api/alerts/parcel/:parcelId/generate
// @desc    Generate climate resilience alerts for a parcel
// @access  Private
router.post('/parcel/:parcelId/generate', authenticateToken, generateClimateAlerts);

// @route   PATCH /api/alerts/:id/resolve
// @desc    Resolve an alert
// @access  Private
router.patch('/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const alert = await DegradationAlert.findByIdAndUpdate(
      req.params.id,
      { isResolved: true, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.json({ message: 'Alert resolved successfully', alert });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/alerts/predictive
// @desc    Get predictive alerts based on trends
// @access  Private
router.get('/predictive', authenticateToken, async (req, res) => {
  try {
    // This would implement predictive logic based on soil trends
    // For now, return active alerts as predictive
    const alerts = await DegradationAlert.find({ isResolved: false })
      .populate('parcelId', 'name location')
      .sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
