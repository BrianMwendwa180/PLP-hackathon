import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  trackModuleInteraction,
  getUserModulePreferences,
  getAllUsers,
  getUserById,
  deleteUser
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', authenticateToken, updateUserProfile);

// @route   POST /api/users/module-interaction
// @desc    Track user module interaction
// @access  Private
router.post('/module-interaction', authenticateToken, trackModuleInteraction);

// @route   GET /api/users/module-preferences
// @desc    Get user module preferences
// @access  Private
router.get('/module-preferences', authenticateToken, getUserModulePreferences);

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', authenticateToken, getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authenticateToken, getUserById);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, deleteUser);

export default router;
