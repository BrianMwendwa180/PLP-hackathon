import { imageAnalysisService } from '../services/imageAnalysisService.js';

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                diseaseDetected: true,
                diseaseName: 'Leaf Blight',
                confidence: 0.85,
                severity: 'moderate'
              })
            }
          }]
        })
      }
    }
  }));
});

describe('Image Analysis Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateImage', () => {
    it('should validate correct image file', () => {
      const fs = require('fs');
      fs.statSync.mockReturnValue({ size: 1024 * 1024 }); // 1MB

      const isValid = imageAnalysisService.validateImage('test.jpg');
      expect(isValid).toBe(true);
    });

    it('should reject oversized files', () => {
      const fs = require('fs');
      fs.statSync.mockReturnValue({ size: 25 * 1024 * 1024 }); // 25MB

      const isValid = imageAnalysisService.validateImage('large.jpg');
      expect(isValid).toBe(false);
    });
  });

  describe('analyzeCropDisease', () => {
    it('should analyze crop disease from image', async () => {
      const analysis = await imageAnalysisService.analyzeCropDisease('crop.jpg', 'maize');

      expect(analysis).toBeDefined();
      expect(analysis.diseaseDetected).toBeDefined();
      expect(analysis.diseaseName).toBeDefined();
    });

    it('should handle invalid images', async () => {
      await expect(
        imageAnalysisService.analyzeCropDisease('invalid.pdf')
      ).rejects.toThrow('Invalid image file');
    });
  });

  describe('batchAnalyze', () => {
    it('should analyze multiple images', async () => {
      const images = [
        { id: 'img1', path: 'crop1.jpg', cropType: 'maize' },
        { id: 'img2', path: 'crop2.jpg', cropType: 'wheat' }
      ];

      const results = await imageAnalysisService.batchAnalyze(images, 'crop_disease');

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
    });
  });
});
