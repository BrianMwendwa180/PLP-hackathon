import { imageAnalysisService } from '../services/imageAnalysisService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Analyze crop disease from uploaded image
export const analyzeCropDisease = [
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const { cropType } = req.body;
      const imagePath = req.file.path;

      const analysis = await imageAnalysisService.analyzeCropDisease(imagePath, cropType);

      // Clean up uploaded file after analysis
      fs.unlinkSync(imagePath);

      res.json({
        message: 'Crop disease analysis completed',
        analysis: analysis
      });
    } catch (error) {
      // Clean up file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error('Crop disease analysis error:', error);
      res.status(500).json({
        message: 'Analysis failed',
        error: error.message
      });
    }
  }
];

// Analyze soil structure from uploaded image
export const analyzeSoilStructure = [
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const imagePath = req.file.path;

      const analysis = await imageAnalysisService.analyzeSoilStructure(imagePath);

      // Clean up uploaded file
      fs.unlinkSync(imagePath);

      res.json({
        message: 'Soil structure analysis completed',
        analysis: analysis
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error('Soil structure analysis error:', error);
      res.status(500).json({
        message: 'Analysis failed',
        error: error.message
      });
    }
  }
];

// Analyze irrigation system from uploaded image
export const analyzeIrrigationSystem = [
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const imagePath = req.file.path;

      const analysis = await imageAnalysisService.analyzeIrrigationSystem(imagePath);

      fs.unlinkSync(imagePath);

      res.json({
        message: 'Irrigation system analysis completed',
        analysis: analysis
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error('Irrigation system analysis error:', error);
      res.status(500).json({
        message: 'Analysis failed',
        error: error.message
      });
    }
  }
];

// Analyze land degradation from uploaded image
export const analyzeLandDegradation = [
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const { location } = req.body;
      const imagePath = req.file.path;

      const analysis = await imageAnalysisService.analyzeLandDegradation(imagePath, location);

      fs.unlinkSync(imagePath);

      res.json({
        message: 'Land degradation analysis completed',
        analysis: analysis
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error('Land degradation analysis error:', error);
      res.status(500).json({
        message: 'Analysis failed',
        error: error.message
      });
    }
  }
];

// Batch analyze multiple images
export const batchAnalyzeImages = [
  upload.array('images', 10), // Allow up to 10 images
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No image files provided' });
      }

      const { analysisType, cropTypes, locations } = req.body;

      // Prepare image data for batch analysis
      const images = req.files.map((file, index) => ({
        id: `image_${index}`,
        path: file.path,
        cropType: cropTypes ? cropTypes[index] : undefined,
        location: locations ? locations[index] : undefined
      }));

      const results = await imageAnalysisService.batchAnalyze(images, analysisType);

      // Clean up all uploaded files
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });

      res.json({
        message: 'Batch analysis completed',
        results: results,
        totalProcessed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });
    } catch (error) {
      // Clean up files on error
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }

      console.error('Batch analysis error:', error);
      res.status(500).json({
        message: 'Batch analysis failed',
        error: error.message
      });
    }
  }
];

// Get analysis history (placeholder for future implementation)
export const getAnalysisHistory = async (req, res) => {
  try {
    // This would typically fetch from a database
    // For now, return empty array
    res.json({
      message: 'Analysis history retrieved',
      history: []
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve analysis history',
      error: error.message
    });
  }
};

// Delete uploaded image (utility function)
export const deleteUploadedImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join('uploads/images', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ message: 'Image not found' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete image',
      error: error.message
    });
  }
};
