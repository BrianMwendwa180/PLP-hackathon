import express from 'express';
import {
  createSoilHealthRecord,
  getSoilHealthRecordsByParcel,
  getAllSoilHealthRecords,
  getSoilHealthRecordById,
  updateSoilHealthRecord,
  deleteSoilHealthRecord
} from '../controllers/soilHealthController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

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

export default router;
