import express from 'express';
import {
  analyzeCropDisease,
  analyzeSoilStructure,
  analyzeIrrigationSystem,
  analyzeLandDegradation,
  batchAnalyzeImages,
  getAnalysisHistory,
  deleteUploadedImage
} from '../controllers/imageAnalysisController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Image analysis routes
router.post('/crop-disease', analyzeCropDisease);
router.post('/soil-structure', analyzeSoilStructure);
router.post('/irrigation-system', analyzeIrrigationSystem);
router.post('/land-degradation', analyzeLandDegradation);
router.post('/batch-analyze', batchAnalyzeImages);

// Utility routes
router.get('/history', getAnalysisHistory);
router.delete('/images/:filename', deleteUploadedImage);

export default router;
