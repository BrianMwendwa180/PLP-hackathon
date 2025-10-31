import express from 'express';
import {
  createRecommendation,
  getRecommendationsByParcel,
  getAllRecommendations,
  getRecommendationById,
  updateRecommendation,
  deleteRecommendation,
  generateAgricultureRecommendations,
  chatWithRestorationAI
} from '../controllers/recommendationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/recommendations
// @desc    Create a new recommendation
// @access  Private
router.post('/', authenticateToken, createRecommendation);

// @route   GET /api/recommendations/parcel/:parcelId
// @desc    Get recommendations by parcel ID
// @access  Private
router.get('/parcel/:parcelId', authenticateToken, getRecommendationsByParcel);

// @route   GET /api/recommendations
// @desc    Get all recommendations
// @access  Private (Admin only)
router.get('/', authenticateToken, getAllRecommendations);

// @route   GET /api/recommendations/:id
// @desc    Get recommendation by ID
// @access  Private
router.get('/:id', authenticateToken, getRecommendationById);

// @route   PUT /api/recommendations/:id
// @desc    Update recommendation
// @access  Private
router.put('/:id', authenticateToken, updateRecommendation);

// @route   DELETE /api/recommendations/:id
// @desc    Delete recommendation
// @access  Private
router.delete('/:id', authenticateToken, deleteRecommendation);

// @route   POST /api/recommendations/parcel/:parcelId/agriculture
// @desc    Generate agriculture recommendations for a parcel
// @access  Private
router.post('/parcel/:parcelId/agriculture', authenticateToken, generateAgricultureRecommendations);

// @route   POST /api/recommendations/parcel/:parcelId/chat
// @desc    Chat with AI about restoration practices
// @access  Private
router.post('/parcel/:parcelId/chat', authenticateToken, chatWithRestorationAI);

export default router;
