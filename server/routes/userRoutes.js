import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
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
