import { enhancedAIService } from '../services/enhancedAIService.js';
import LandParcel from '../models/LandParcel.js';
import SoilHealthRecord from '../models/SoilHealthRecord.js';

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                recommendations: [{
                  type: 'fertilizer',
                  title: 'Nitrogen Application',
                  description: 'Apply nitrogen-rich fertilizer',
                  priority: 'high',
                  estimatedCost: 200,
                  estimatedTimeDays: 3
                }]
              })
            }
          }]
        })
      }
    }
  }));
});

// Mock axios for weather API
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({
    data: {
      main: { temp: 25, humidity: 60 },
      weather: [{ description: 'clear sky' }],
      wind: { speed: 5 }
    }
  })
}));

describe('Enhanced AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateComprehensiveRecommendations', () => {
    it('should generate recommendations for a parcel', async () => {
      const parcelId = 'test-parcel-id';
      const userId = 'test-user-id';

      const result = await enhancedAIService.generateComprehensiveRecommendations(parcelId, userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.parcelId).toBe(parcelId);
    });

    it('should handle errors gracefully', async () => {
      // Mock OpenAI to throw error
      const mockOpenAI = require('openai');
      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API Error'))
          }
        }
      }));

      const parcelId = 'test-parcel-id';
      const userId = 'test-user-id';

      await expect(
        enhancedAIService.generateComprehensiveRecommendations(parcelId, userId)
      ).rejects.toThrow('API Error');
    });
  });

  describe('getWeatherData', () => {
    it('should fetch weather data for coordinates', async () => {
      const lat = -1.2921;
      const lon = 36.8219;

      const weather = await enhancedAIService.getWeatherData(lat, lon);

      expect(weather).toBeDefined();
      expect(weather.temperature).toBeDefined();
      expect(weather.humidity).toBeDefined();
      expect(weather.description).toBeDefined();
    });

    it('should handle weather API errors', async () => {
      const axios = require('axios');
      axios.get.mockRejectedValueOnce(new Error('Weather API Error'));

      const lat = -1.2921;
      const lon = 36.8219;

      const weather = await enhancedAIService.getWeatherData(lat, lon);

      expect(weather).toBeNull();
    });
  });

  describe('calculateTrend', () => {
    it('should calculate positive trend', () => {
      const values = [10, 12, 15, 18, 20];
      const trend = enhancedAIService.calculateTrend(values);

      expect(trend).toBeGreaterThan(0);
    });

    it('should calculate negative trend', () => {
      const values = [20, 18, 15, 12, 10];
      const trend = enhancedAIService.calculateTrend(values);

      expect(trend).toBeLessThan(0);
    });

    it('should handle insufficient data', () => {
      const values = [10];
      const trend = enhancedAIService.calculateTrend(values);

      expect(trend).toBe(0);
    });
  });

  describe('generateDegradationPredictions', () => {
    it('should generate degradation predictions', async () => {
      const parcelData = {
        soilRecords: [{ phLevel: 6.5, moistureLevel: 40 }],
        weatherData: { temperature: 25, rainfall: 100 }
      };

      const predictions = await enhancedAIService.generateDegradationPredictions(parcelData);

      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
    });
  });

  describe('generateCropRecommendations', () => {
    it('should generate crop recommendations', async () => {
      const soilData = { phLevel: 6.5, nitrogenLevel: 25 };
      const weatherData = { temperature: 25, rainfall: 100 };

      const recommendations = await enhancedAIService.generateCropRecommendations(soilData, weatherData);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('generateRestorationSuggestions', () => {
    it('should generate restoration suggestions', async () => {
      const degradationData = { severity: 'moderate', affectedArea: 5 };

      const suggestions = await enhancedAIService.generateRestorationSuggestions(degradationData);

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('generateFertilizerOptimizations', () => {
    it('should generate fertilizer optimizations', async () => {
      const soilData = { nitrogenLevel: 15, phosphorusLevel: 10, potassiumLevel: 20 };
      const cropType = 'maize';

      const optimizations = await enhancedAIService.generateFertilizerOptimizations(soilData, cropType);

      expect(optimizations).toBeDefined();
      expect(Array.isArray(optimizations)).toBe(true);
    });
  });

  describe('generateWaterManagement', () => {
    it('should generate water management recommendations', async () => {
      const soilData = { moistureLevel: 30 };
      const weatherData = { rainfall: 50, temperature: 30 };

      const recommendations = await enhancedAIService.generateWaterManagement(soilData, weatherData);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });
});
