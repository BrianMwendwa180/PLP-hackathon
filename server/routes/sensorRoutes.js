import express from 'express';
import {
  registerSensor,
  getSensorsByParcel,
  getSensorById,
  updateSensor,
  deleteSensor,
  getAllSensors
} from '../controllers/sensorController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   POST /api/sensors
// @desc    Register a new IoT sensor
// @access  Private
router.post('/', registerSensor);

// @route   GET /api/sensors/parcel/:parcelId
// @desc    Get sensors by parcel ID
// @access  Private
router.get('/parcel/:parcelId', getSensorsByParcel);

// @route   GET /api/sensors
// @desc    Get all sensors (Admin only)
// @access  Private
router.get('/', getAllSensors);

// @route   GET /api/sensors/:id
// @desc    Get sensor by ID
// @access  Private
router.get('/:id', getSensorById);

// @route   PUT /api/sensors/:id
// @desc    Update sensor
// @access  Private
router.put('/:id', updateSensor);

// @route   DELETE /api/sensors/:id
// @desc    Delete sensor
// @access  Private
router.delete('/:id', deleteSensor);

export default router;
