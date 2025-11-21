import OpenAI from 'openai';
import dotenv from 'dotenv';
import { getTemperature, TASK_TYPES } from '../config/temperatureConfig.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Schema validation functions
const validateDegradationPredictions = (data) => {
  if (!Array.isArray(data)) return false;
  return data.every(item =>
    item.title && item.description && item.priority &&
    ['low', 'medium', 'high', 'critical'].includes(item.priority) &&
    typeof item.estimatedCost === 'number' &&
    typeof item.estimatedTimeDays === 'number' &&
    typeof item.aiConfidence === 'number'
  );
};

const validateRecommendations = (data) => {
  if (!Array.isArray(data)) return false;
  return data.every(item =>
    item.title && item.description && item.priority &&
    ['low', 'medium', 'high', 'critical'].includes(item.priority) &&
    typeof item.estimatedCost === 'number' &&
    typeof item.estimatedTimeDays === 'number' &&
    typeof item.aiConfidence === 'number'
  );
};

// Response sanitization: Extract JSON from potentially malformed responses
const sanitizeAndParseJSON = (content) => {
  try {
    // First try direct parsing
    return JSON.parse(content);
  } catch {
    // Try to extract JSON from markdown code blocks or text
    const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*```/) ||
                      content.match(/(\[[\s\S]*?\]|\{[\s\S]*?\})/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // If still fails, try to fix common issues
        let fixed = jsonMatch[1]
          .replace(/,\s*}/g, '}')  // Remove trailing commas
          .replace(/,\s*]/g, ']')
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":'); // Quote unquoted keys
        return JSON.parse(fixed);
      }
    }
    throw new Error('Unable to parse JSON from response');
  }
};

// Retry logic with improved prompts
const callOpenAIWithRetry = async (messages, options, retryCount = 0) => {
  const maxRetries = 2;
  try {
    const response = await openai.chat.completions.create({
      ...options,
      messages,
      response_format: { type: "json_object" } // Enable JSON Mode
    });
    const content = response.choices[0].message.content;
    return sanitizeAndParseJSON(content);
  } catch (error) {
    if (retryCount < maxRetries) {
      console.warn(`OpenAI call failed, retrying (${retryCount + 1}/${maxRetries}):`, error.message);
      // Improve prompt for retry
      const improvedMessages = messages.map(msg =>
        msg.role === 'user' ? {
          ...msg,
          content: msg.content + '\n\nIMPORTANT: Respond ONLY with valid JSON. No additional text, explanations, or formatting.'
        } : msg
      );
      return callOpenAIWithRetry(improvedMessages, options, retryCount + 1);
    }
    throw error;
  }
};

export const generateDegradationPredictions = async (soilRecord, sensorData) => {
  try {
    const prompt = `You are an expert soil scientist analyzing land degradation risks. Your task is to predict degradation threats and provide specific, actionable recommendations based on comprehensive soil data.

SOIL HEALTH DATA:
- Vitality Score: ${soilRecord.vitalityScore || 'N/A'}/100
- pH Level: ${soilRecord.phLevel || 'N/A'}
- Moisture Level: ${soilRecord.moistureLevel || 'N/A'}%
- Nitrogen: ${soilRecord.nitrogenLevel || 'N/A'} mg/kg
- Phosphorus: ${soilRecord.phosphorusLevel || 'N/A'} mg/kg
- Potassium: ${soilRecord.potassiumLevel || 'N/A'} mg/kg
- Organic Matter: ${soilRecord.organicMatter || 'N/A'}%
- Temperature: ${soilRecord.temperature || 'N/A'}°C
- Rainfall: ${soilRecord.rainfall || 'N/A'} mm
- Erosion Rate: ${soilRecord.erosionRate || 'N/A'} tons/ha/year

IoT SENSOR DATA:
${sensorData.map(sensor => `- ${sensor.sensorType}: ${sensor.name} (${sensor.status}) - Last seen: ${sensor.lastSeen}`).join('\n')}

TRAINING EXAMPLES:
Example 1 - High Erosion Risk:
Input: erosion rate 8 tons/ha/year, rainfall 120mm, moisture 60%
Output: [{"title":"Implement Contour Farming","description":"High erosion risk detected. Create contour lines and plant vetiver grass strips every 10 meters to reduce soil loss by 70%.","priority":"critical","estimatedCost":800,"estimatedTimeDays":21,"aiConfidence":0.92,"predictionTimeframe":"short_term"}]

Example 2 - Soil Fertility Decline:
Input: nitrogen 15 mg/kg, vitality 45/100, organic matter 1.2%
Output: [{"title":"Organic Matter Addition","description":"Critical nitrogen deficiency and low organic matter. Apply 5 tons/ha of compost and plant cover crops to rebuild soil fertility.","priority":"high","estimatedCost":600,"estimatedTimeDays":45,"aiConfidence":0.88,"predictionTimeframe":"medium_term"}]

Example 3 - Moisture Stress:
Input: moisture 25%, rainfall 30mm, temperature 32°C
Output: [{"title":"Drought Mitigation Strategy","description":"Severe moisture deficiency detected. Install subsurface drip irrigation and apply mulch to conserve soil moisture.","priority":"critical","estimatedCost":1200,"estimatedTimeDays":14,"aiConfidence":0.95,"predictionTimeframe":"immediate"}]

ANALYZE the data and PREDICT 1-2 most critical degradation risks within the next 3 months. Focus on:
1. Erosion risks (soil loss, runoff)
2. Fertility decline (nutrient depletion, organic matter loss)
3. Structural degradation (compaction, poor drainage)
4. Moisture-related issues (drought, waterlogging)

For each prediction, provide:
- title: Specific, actionable recommendation title
- description: Detailed explanation with expected outcomes and monitoring advice
- priority: (low|medium|high|critical) based on severity and urgency
- estimatedCost: Realistic cost in USD per hectare
- estimatedTimeDays: Implementation timeline
- aiConfidence: 0.0-1.0 based on data quality and risk certainty
- predictionTimeframe: (immediate|short_term|medium_term|long_term)

Respond ONLY with valid JSON array. No additional text or explanations.`;

    const predictions = await callOpenAIWithRetry(
      [{ role: 'user', content: prompt }],
      {
        model: 'gpt-4',
        temperature: getTemperature(TASK_TYPES.PREDICTION),
        max_tokens: 1000,
      }
    );

    // Validate the response structure
    if (!validateDegradationPredictions(predictions)) {
      console.warn('Invalid degradation predictions structure, using fallback');
      return fallbackDegradationPredictions(soilRecord, sensorData);
    }

    return predictions.map(pred => ({
      recommendationType: pred.recommendationType || 'erosion_control',
      title: pred.title,
      description: pred.description,
      priority: pred.priority || 'medium',
      estimatedCost: pred.estimatedCost || 0,
      estimatedTimeDays: pred.estimatedTimeDays || 0,
      aiConfidence: pred.aiConfidence || 0.8,
      predictionTimeframe: pred.predictionTimeframe || 'short_term',
      predictionType: 'degradation_prediction'
    }));
  } catch (error) {
    console.error('OpenAI degradation prediction error:', error);
    // Fallback to rule-based logic
    return fallbackDegradationPredictions(soilRecord, sensorData);
  }
};

export const generateCropRecommendations = async (soilRecord, landParcel) => {
  try {
    const prompt = `Based on the following soil health data and land parcel information, recommend the most suitable crops for optimal yield and soil health improvement:

Soil Health Data:
- Vitality Score: ${soilRecord.vitalityScore || 'N/A'}
- pH Level: ${soilRecord.phLevel || 'N/A'}
- Moisture Level: ${soilRecord.moistureLevel || 'N/A'}%
- Nitrogen Level: ${soilRecord.nitrogenLevel || 'N/A'} mg/kg
- Phosphorus Level: ${soilRecord.phosphorusLevel || 'N/A'} mg/kg
- Potassium Level: ${soilRecord.potassiumLevel || 'N/A'} mg/kg
- Organic Matter: ${soilRecord.organicMatter || 'N/A'}%
- Temperature: ${soilRecord.temperature || 'N/A'}°C
- Rainfall: ${soilRecord.rainfall || 'N/A'} mm

Land Parcel Info:
- Location: ${landParcel.location || 'N/A'}
- Size: ${landParcel.size || 'N/A'} hectares

Provide 1-2 crop recommendations that would:
1. Maximize yield potential
2. Improve soil health over time
3. Be suitable for the current conditions
4. Consider climate adaptation

Include confidence level, estimated costs, and implementation timeline.

Respond in JSON format with an array of recommendation objects.`;

    const recommendations = await callOpenAIWithRetry(
      [{ role: 'user', content: prompt }],
      {
        model: 'gpt-4',
        temperature: getTemperature(TASK_TYPES.RECOMMENDATION),
        max_tokens: 800,
      }
    );

    // Validate the response structure
    if (!validateRecommendations(recommendations)) {
      console.warn('Invalid crop recommendations structure, using fallback');
      return fallbackCropRecommendations(soilRecord, landParcel);
    }

    return recommendations.map(rec => ({
      recommendationType: 'crop_rotation',
      title: rec.title,
      description: rec.description,
      priority: rec.priority || 'medium',
      estimatedCost: rec.estimatedCost || 0,
      estimatedTimeDays: rec.estimatedTimeDays || 90,
      aiConfidence: rec.aiConfidence || 0.85,
      predictionTimeframe: 'immediate',
      predictionType: 'crop_recommendation'
    }));
  } catch (error) {
    console.error('OpenAI crop recommendation error:', error);
    return fallbackCropRecommendations(soilRecord, landParcel);
  }
};

export const generateRestorationSuggestions = async (soilRecord, sensorData) => {
  try {
    const prompt = `Analyze soil degradation indicators and suggest restoration techniques:

Soil Health Data:
- Vitality Score: ${soilRecord.vitalityScore || 'N/A'}
- Erosion Rate: ${soilRecord.erosionRate || 'N/A'} tons/ha/year
- Organic Matter: ${soilRecord.organicMatter || 'N/A'}%
- Moisture Level: ${soilRecord.moistureLevel || 'N/A'}%

IoT Sensors: ${sensorData.length} active sensors monitoring soil conditions.

Recommend 1-2 restoration techniques such as:
- Terracing
- Grass strips
- Reforestation
- Cover cropping
- Water harvesting

Consider the severity of degradation and provide practical, cost-effective solutions with implementation details.

Respond in JSON format with an array of recommendation objects.`;

    const suggestions = await callOpenAIWithRetry(
      [{ role: 'user', content: prompt }],
      {
        model: 'gpt-4',
        temperature: getTemperature(TASK_TYPES.RECOMMENDATION),
        max_tokens: 800,
      }
    );

    // Validate the response structure
    if (!validateRecommendations(suggestions)) {
      console.warn('Invalid restoration suggestions structure, using fallback');
      return fallbackRestorationSuggestions(soilRecord, sensorData);
    }

    return suggestions.map(sugg => ({
      recommendationType: sugg.recommendationType || 'erosion_control',
      title: sugg.title,
      description: sugg.description,
      priority: sugg.priority || 'high',
      estimatedCost: sugg.estimatedCost || 0,
      estimatedTimeDays: sugg.estimatedTimeDays || 30,
      aiConfidence: sugg.aiConfidence || 0.8,
      predictionTimeframe: 'short_term',
      predictionType: 'restoration_suggestion'
    }));
  } catch (error) {
    console.error('OpenAI restoration suggestion error:', error);
    return fallbackRestorationSuggestions(soilRecord, sensorData);
  }
};

export const generateFertilizerOptimizations = async (soilRecord) => {
  try {
    const prompt = `Optimize fertilizer application based on soil nutrient levels:

Current Soil Nutrients:
- Nitrogen: ${soilRecord.nitrogenLevel || 'N/A'} mg/kg
- Phosphorus: ${soilRecord.phosphorusLevel || 'N/A'} mg/kg
- Potassium: ${soilRecord.potassiumLevel || 'N/A'} mg/kg
- pH: ${soilRecord.phLevel || 'N/A'}
- Organic Matter: ${soilRecord.organicMatter || 'N/A'}%

Provide specific fertilizer recommendations including:
1. Nutrient deficiencies identified
2. Recommended fertilizer types and amounts
3. Application timing and methods
4. Expected impact on soil health

Consider environmental impact and sustainable practices.

Respond in JSON format with an array of recommendation objects.`;

    const optimizations = await callOpenAIWithRetry(
      [{ role: 'user', content: prompt }],
      {
        model: 'gpt-4',
        temperature: getTemperature(TASK_TYPES.ANALYTICAL),
        max_tokens: 800,
      }
    );

    // Validate the response structure
    if (!validateRecommendations(optimizations)) {
      console.warn('Invalid fertilizer optimizations structure, using fallback');
      return fallbackFertilizerOptimizations(soilRecord);
    }

    return optimizations.map(opt => ({
      recommendationType: 'fertilization',
      title: opt.title,
      description: opt.description,
      priority: opt.priority || 'high',
      estimatedCost: opt.estimatedCost || 0,
      estimatedTimeDays: opt.estimatedTimeDays || 7,
      aiConfidence: opt.aiConfidence || 0.9,
      predictionTimeframe: 'immediate',
      predictionType: 'fertilizer_optimization'
    }));
  } catch (error) {
    console.error('OpenAI fertilizer optimization error:', error);
    return fallbackFertilizerOptimizations(soilRecord);
  }
};

export const generateWaterManagement = async (soilRecord, sensorData) => {
  try {
    const prompt = `Analyze soil moisture data and provide water management recommendations:

Soil Moisture Data:
- Current Moisture: ${soilRecord.moistureLevel || 'N/A'}%
- Rainfall: ${soilRecord.rainfall || 'N/A'} mm
- Temperature: ${soilRecord.temperature || 'N/A'}°C

IoT Sensors: ${sensorData.filter(s => s.sensorType === 'soil_moisture').length} moisture sensors active.

Provide irrigation and water conservation recommendations considering:
1. Current moisture status
2. Weather patterns
3. Crop water requirements
4. Water efficiency

Include specific actions, timing, and expected outcomes.

Respond in JSON format with an array of recommendation objects.`;

    const recommendations = await callOpenAIWithRetry(
      [{ role: 'user', content: prompt }],
      {
        model: 'gpt-4',
        temperature: getTemperature(TASK_TYPES.RECOMMENDATION),
        max_tokens: 800,
      }
    );

    // Validate the response structure
    if (!validateRecommendations(recommendations)) {
      console.warn('Invalid water management recommendations structure, using fallback');
      return fallbackWaterManagement(soilRecord, sensorData);
    }

    return recommendations.map(rec => ({
      recommendationType: rec.recommendationType || 'irrigation',
      title: rec.title,
      description: rec.description,
      priority: rec.priority || 'high',
      estimatedCost: rec.estimatedCost || 0,
      estimatedTimeDays: rec.estimatedTimeDays || 1,
      aiConfidence: rec.aiConfidence || 0.85,
      predictionTimeframe: 'immediate',
      predictionType: 'water_management'
    }));
  } catch (error) {
    console.error('OpenAI water management error:', error);
    return fallbackWaterManagement(soilRecord, sensorData);
  }
};

// Fallback functions for when OpenAI fails
function fallbackDegradationPredictions(soilRecord, sensorData) {
  const predictions = [];
  if (soilRecord.rainfall > 100 && soilRecord.erosionRate > 5) {
    predictions.push({
      recommendationType: 'erosion_control',
      title: 'Erosion Risk Alert: High Rainfall Expected',
      description: `Potential erosion due to rainfall (${soilRecord.rainfall}mm) and erosion rate (${soilRecord.erosionRate} tons/ha/year). Immediate action recommended.`,
      priority: 'critical',
      estimatedCost: 800,
      estimatedTimeDays: 14,
      aiConfidence: 0.85,
      predictionTimeframe: 'short_term',
      predictionType: 'degradation_prediction'
    });
  }
  return predictions;
}

function fallbackCropRecommendations(soilRecord, landParcel) {
  const recommendations = [];
  if (soilRecord.phLevel >= 6.0 && soilRecord.phLevel <= 7.0 && soilRecord.moistureLevel >= 40) {
    recommendations.push({
      recommendationType: 'crop_rotation',
      title: 'Optimal Crop Selection: High-Value Vegetables',
      description: 'Current soil conditions suitable for tomatoes, peppers, or leafy greens.',
      priority: 'medium',
      estimatedCost: 300,
      estimatedTimeDays: 90,
      aiConfidence: 0.92,
      predictionTimeframe: 'immediate',
      predictionType: 'crop_recommendation'
    });
  }
  return recommendations;
}

function fallbackRestorationSuggestions(soilRecord, sensorData) {
  const suggestions = [];
  if (soilRecord.erosionRate > 3) {
    suggestions.push({
      recommendationType: 'erosion_control',
      title: 'Install Grass Strips for Erosion Control',
      description: 'Plant native grass strips along contours to reduce erosion.',
      priority: 'high',
      estimatedCost: 450,
      estimatedTimeDays: 30,
      aiConfidence: 0.81,
      predictionTimeframe: 'immediate',
      predictionType: 'restoration_suggestion'
    });
  }
  return suggestions;
}

function fallbackFertilizerOptimizations(soilRecord) {
  const optimizations = [];
  if (soilRecord.nitrogenLevel < 25) {
    const recommendedAmount = Math.max(0, 50 - soilRecord.nitrogenLevel);
    optimizations.push({
      recommendationType: 'fertilization',
      title: 'Optimized Nitrogen Fertilizer Application',
      description: `Apply ${recommendedAmount}kg/ha of nitrogen fertilizer.`,
      priority: 'high',
      estimatedCost: Math.round(recommendedAmount * 2.5),
      estimatedTimeDays: 7,
      aiConfidence: 0.89,
      predictionTimeframe: 'immediate',
      predictionType: 'fertilizer_optimization'
    });
  }
  return optimizations;
}

function fallbackWaterManagement(soilRecord, sensorData) {
  const recommendations = [];
  if (soilRecord.moistureLevel < 35) {
    const waterDeficit = 35 - soilRecord.moistureLevel;
    const irrigationAmount = waterDeficit * 10;
    recommendations.push({
      recommendationType: 'irrigation',
      title: 'Precise Irrigation Scheduling',
      description: `Apply ${irrigationAmount.toFixed(0)}mm of water immediately.`,
      priority: 'high',
      estimatedCost: Math.round(irrigationAmount * 0.5),
      estimatedTimeDays: 1,
      aiConfidence: 0.91,
      predictionTimeframe: 'immediate',
      predictionType: 'water_management'
    });
  }
  return recommendations;
}
