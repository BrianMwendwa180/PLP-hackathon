import OpenAI from 'openai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class ImageAnalysisService {
  constructor() {
    this.supportedFormats = ['jpg', 'jpeg', 'png', 'webp'];
    this.maxFileSize = 20 * 1024 * 1024; // 20MB
  }

  // Analyze crop disease from image
  async analyzeCropDisease(imagePath, cropType = 'unknown') {
    try {
      // Validate image
      if (!this.validateImage(imagePath)) {
        throw new Error('Invalid image file');
      }

      // Read image as base64
      const base64Image = await this.imageToBase64(imagePath);

      const prompt = `Analyze this crop image for diseases, pests, and health indicators. The crop type is: ${cropType}.

Please provide:
1. Disease identification with confidence level
2. Severity assessment (mild/moderate/severe)
3. Affected plant parts
4. Recommended treatment options
5. Prevention strategies
6. Expected yield impact
7. Timeline for intervention

Respond in JSON format with analysis results.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      });

      const content = response.choices[0].message.content;
      const analysis = JSON.parse(content);

      return {
        diseaseDetected: analysis.diseaseDetected || false,
        diseaseName: analysis.diseaseName || null,
        confidence: analysis.confidence || 0,
        severity: analysis.severity || 'unknown',
        affectedParts: analysis.affectedParts || [],
        treatment: analysis.treatment || [],
        prevention: analysis.prevention || [],
        yieldImpact: analysis.yieldImpact || 0,
        interventionTimeline: analysis.interventionTimeline || 'immediate',
        recommendations: analysis.recommendations || []
      };
    } catch (error) {
      console.error('Crop disease analysis error:', error);
      throw error;
    }
  }

  // Analyze soil structure from image
  async analyzeSoilStructure(imagePath) {
    try {
      if (!this.validateImage(imagePath)) {
        throw new Error('Invalid image file');
      }

      const base64Image = await this.imageToBase64(imagePath);

      const prompt = `Analyze this soil sample image for structure, texture, and health indicators.

Please assess:
1. Soil texture (sand/silt/clay composition)
2. Soil structure (crumbly, blocky, platy, etc.)
3. Signs of compaction
4. Organic matter content indicators
5. Drainage capacity
6. Root penetration potential
7. Amendments needed

Respond in JSON format with detailed analysis.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 800,
        temperature: 0.1
      });

      const content = response.choices[0].message.content;
      const analysis = JSON.parse(content);

      return {
        texture: analysis.texture || 'unknown',
        structure: analysis.structure || 'unknown',
        compactionLevel: analysis.compactionLevel || 'low',
        organicMatter: analysis.organicMatter || 'medium',
        drainage: analysis.drainage || 'moderate',
        rootPenetration: analysis.rootPenetration || 'good',
        amendments: analysis.amendments || [],
        recommendations: analysis.recommendations || []
      };
    } catch (error) {
      console.error('Soil structure analysis error:', error);
      throw error;
    }
  }

  // Analyze irrigation system from image
  async analyzeIrrigationSystem(imagePath) {
    try {
      if (!this.validateImage(imagePath)) {
        throw new Error('Invalid image file');
      }

      const base64Image = await this.imageToBase64(imagePath);

      const prompt = `Analyze this irrigation system image for efficiency, coverage, and potential issues.

Please evaluate:
1. Irrigation type (drip, sprinkler, flood, etc.)
2. Coverage uniformity
3. Signs of clogging or damage
4. Water distribution efficiency
5. Maintenance needs
6. Upgrade recommendations
7. Water conservation potential

Respond in JSON format with analysis results.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 800,
        temperature: 0.1
      });

      const content = response.choices[0].message.content;
      const analysis = JSON.parse(content);

      return {
        systemType: analysis.systemType || 'unknown',
        coverage: analysis.coverage || 'poor',
        uniformity: analysis.uniformity || 0,
        efficiency: analysis.efficiency || 0,
        issues: analysis.issues || [],
        maintenance: analysis.maintenance || [],
        upgrades: analysis.upgrades || [],
        waterSavings: analysis.waterSavings || 0
      };
    } catch (error) {
      console.error('Irrigation system analysis error:', error);
      throw error;
    }
  }

  // Analyze land degradation from aerial/drone images
  async analyzeLandDegradation(imagePath, location = null) {
    try {
      if (!this.validateImage(imagePath)) {
        throw new Error('Invalid image file');
      }

      const base64Image = await this.imageToBase64(imagePath);

      const locationContext = location ? `Location context: ${location}. ` : '';

      const prompt = `${locationContext}Analyze this land image for degradation indicators and restoration potential.

Please assess:
1. Erosion patterns and severity
2. Vegetation cover percentage
3. Soil exposure and bare patches
4. Water runoff indicators
5. Restoration priority areas
6. Recommended interventions
7. Timeline and cost estimates
8. Expected recovery time

Respond in JSON format with comprehensive analysis.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      });

      const content = response.choices[0].message.content;
      const analysis = JSON.parse(content);

      return {
        erosionSeverity: analysis.erosionSeverity || 'low',
        vegetationCover: analysis.vegetationCover || 0,
        soilExposure: analysis.soilExposure || 0,
        degradationHotspots: analysis.degradationHotspots || [],
        restorationPriority: analysis.restorationPriority || 'low',
        interventions: analysis.interventions || [],
        estimatedCost: analysis.estimatedCost || 0,
        recoveryTime: analysis.recoveryTime || 0,
        successProbability: analysis.successProbability || 0
      };
    } catch (error) {
      console.error('Land degradation analysis error:', error);
      throw error;
    }
  }

  // Validate image file
  validateImage(filePath) {
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > this.maxFileSize) {
        return false;
      }

      const ext = path.extname(filePath).toLowerCase().slice(1);
      return this.supportedFormats.includes(ext);
    } catch (error) {
      return false;
    }
  }

  // Convert image to base64
  async imageToBase64(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) reject(err);
        else resolve(data.toString('base64'));
      });
    });
  }

  // Batch analyze multiple images
  async batchAnalyze(images, analysisType = 'crop_disease') {
    const results = [];

    for (const image of images) {
      try {
        let result;
        switch (analysisType) {
          case 'crop_disease':
            result = await this.analyzeCropDisease(image.path, image.cropType);
            break;
          case 'soil_structure':
            result = await this.analyzeSoilStructure(image.path);
            break;
          case 'irrigation':
            result = await this.analyzeIrrigationSystem(image.path);
            break;
          case 'degradation':
            result = await this.analyzeLandDegradation(image.path, image.location);
            break;
          default:
            throw new Error(`Unknown analysis type: ${analysisType}`);
        }

        results.push({
          imageId: image.id,
          analysis: result,
          success: true
        });
      } catch (error) {
        results.push({
          imageId: image.id,
          error: error.message,
          success: false
        });
      }
    }

    return results;
  }
}

export const imageAnalysisService = new ImageAnalysisService();
export default imageAnalysisService;
