import express from 'express';
import {
  createDegradationAlert,
  getAlertsByParcel,
  getAllAlerts,
  getAlertById,
  updateAlert,
  deleteAlert
} from '../controllers/alertController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

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

export default router;
