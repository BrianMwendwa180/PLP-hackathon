import express from 'express';
import {
  createRestorationActivity,
  getRestorationActivitiesByParcel,
  getAllRestorationActivities,
  getRestorationActivityById,
  updateRestorationActivity,
  deleteRestorationActivity
} from '../controllers/restorationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/restoration
// @desc    Create a new restoration activity
// @access  Private
router.post('/', authenticateToken, createRestorationActivity);

// @route   GET /api/restoration/parcel/:parcelId
// @desc    Get restoration activities by parcel ID
// @access  Private
router.get('/parcel/:parcelId', authenticateToken, getRestorationActivitiesByParcel);

// @route   GET /api/restoration
// @desc    Get all restoration activities
// @access  Private (Admin only)
router.get('/', authenticateToken, getAllRestorationActivities);

// @route   GET /api/restoration/:id
// @desc    Get restoration activity by ID
// @access  Private
router.get('/:id', authenticateToken, getRestorationActivityById);

// @route   PUT /api/restoration/:id
// @desc    Update restoration activity
// @access  Private
router.put('/:id', authenticateToken, updateRestorationActivity);

// @route   DELETE /api/restoration/:id
// @desc    Delete restoration activity
// @access  Private
router.delete('/:id', authenticateToken, deleteRestorationActivity);

export default router;
