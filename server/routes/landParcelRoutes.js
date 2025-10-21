import express from 'express';
import {
  createLandParcel,
  getUserLandParcels,
  getAllLandParcels,
  getLandParcelById,
  updateLandParcel,
  deleteLandParcel
} from '../controllers/landParcelController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/land-parcels
// @desc    Create a new land parcel
// @access  Private
router.post('/', authenticateToken, createLandParcel);

// @route   GET /api/land-parcels/my
// @desc    Get current user's land parcels
// @access  Private
router.get('/my', authenticateToken, getUserLandParcels);

// @route   GET /api/land-parcels
// @desc    Get all land parcels
// @access  Private (Admin only)
router.get('/', authenticateToken, getAllLandParcels);

// @route   GET /api/land-parcels/:id
// @desc    Get land parcel by ID
// @access  Private
router.get('/:id', authenticateToken, getLandParcelById);

// @route   PUT /api/land-parcels/:id
// @desc    Update land parcel
// @access  Private
router.put('/:id', authenticateToken, updateLandParcel);

// @route   DELETE /api/land-parcels/:id
// @desc    Delete land parcel
// @access  Private
router.delete('/:id', authenticateToken, deleteLandParcel);

export default router;
