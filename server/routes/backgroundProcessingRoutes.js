import express from 'express';
import {
  queueComprehensiveAIAnalysis,
  queuePredictiveAnalytics,
  queueSustainabilityScoring,
  getQueueStatus,
  clearCompletedJobs,
  stopBackgroundProcessing,
  getUserJobs,
  batchQueueJobs
} from '../controllers/backgroundProcessingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Job queuing routes
router.post('/queue/ai-analysis', queueComprehensiveAIAnalysis);
router.post('/queue/predictive-analytics', queuePredictiveAnalytics);
router.post('/queue/sustainability-scoring', queueSustainabilityScoring);
router.post('/queue/batch', batchQueueJobs);

// Queue management routes
router.get('/queue/status', getQueueStatus);
router.delete('/queue/completed', clearCompletedJobs);
router.post('/queue/stop', stopBackgroundProcessing);

// User job routes
router.get('/jobs', getUserJobs);

export default router;
