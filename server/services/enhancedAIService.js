import OpenAI from 'openai';
import axios from 'axios';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import { getTemperature, TASK_TYPES, applyUserPreferences, getAllTemperatures } from '../config/temperatureConfig.js';
import User from '../models/User.js';
import { googleEarthEngineService } from './googleEarthEngineService.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const aiCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export class EnhancedAIService {
  constructor() {
    this.cache = aiCache;
    this.weatherCache = new NodeCache({ stdTTL: 1800 });
    this.userPrefsCache = new NodeCache({ stdTTL: 3600 }); // Cache user preferences for 1 hour
  }

  generateCacheKey(functionName, data) {
    return `${functionName}_${JSON.stringify(data).slice(0, 500)}`;
  }

  getCachedResponse(cacheKey) {
    return this.cache.get(cacheKey);
  }

  setCachedResponse(cacheKey, response) {
    this.cache.set(cacheKey, response);
  }

  async getUserPreferences(userId) {
    if (!userId) return null;

    const cacheKey = `user_prefs_${userId}`;
    const cached = this.userPrefsCache.get(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const user = await User.findById(userId).select('aiPreferences');
      const preferences = user?.aiPreferences || null;
      this.userPrefsCache.set(cacheKey, preferences);
      return preferences;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  async getUserModulePreferences(userId) {
    if (!userId) return null;

    const cacheKey = `user_module_prefs_${userId}`;
    const cached = this.userPrefsCache.get(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const UserModuleInteraction = (await import('../models/UserModuleInteraction.js')).default;
      const interactions = await UserModuleInteraction.find({ userId })
        .sort({ accessCount: -1, lastAccessed: -1 })
        .limit(5)
        .select('moduleName accessCount lastAccessed');

      const preferences = interactions.map(interaction => ({
        moduleName: interaction.moduleName,
        accessCount: interaction.accessCount,
        lastAccessed: interaction.lastAccessed
      }));

      this.userPrefsCache.set(cacheKey, preferences);
      return preferences;
    } catch (error) {
      console.error('Error fetching user module preferences:', error);
      return null;
    }
  }

  getTemperatureWithUserPrefs(taskType, userPreferences, provider = 'openai') {
    const defaultTemps = getAllTemperatures(provider);
    const userTemps = applyUserPreferences(defaultTemps, userPreferences, provider);
    return userTemps[taskType];
  }

  async getWeatherData(location, days = 7) {
    if (!WEATHER_API_KEY) return null;
    const cacheKey = `weather_${location}`;
    const cached = this.weatherCache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${WEATHER_BASE_URL}/forecast`, {
        params: { q: location, appid: WEATHER_API_KEY, units: 'metric', cnt: days * 8 },
      });

      const weatherData = {
        location,
        forecast: response.data.list.map(item => ({
          date: new Date(item.dt * 1000),
          temp: item.main.temp,
          humidity: item.main.humidity,
          rainfall: item.rain?.['3h'] || 0,
          description: item.weather[0].description,
        })),
      };

      this.weatherCache.set(cacheKey, weatherData);
      return weatherData;
    } catch (error) {
      console.error('Weather API error:', error.message);
      return null;
    }
  }

  calculateTrend(values) {
    const validValues = values.filter(v => v !== null && v !== undefined);
    if (validValues.length < 2) return 0;
    const n = validValues.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = validValues.reduce((a, b) => a + b, 0);
    const sumXY = validValues.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumY);
    return slope;
  }

  async analyzeHistoricalTrends(parcelId, soilRecords) {
    if (soilRecords.length < 3) return null;
    return {
      phTrend: this.calculateTrend(soilRecords.map(r => r.phLevel)),
      moistureTrend: this.calculateTrend(soilRecords.map(r => r.moistureLevel)),
      vitalityTrend: this.calculateTrend(soilRecords.map(r => r.vitalityScore)),
      erosionTrend: this.calculateTrend(soilRecords.map(r => r.erosionRate)),
    };
  }

  async generateDegradationPredictions(soilRecord, sensorData, landParcel, historicalRecords = [], userId = null) {
    const cacheKey = this.generateCacheKey('degradation', { soilRecord, sensorData, landParcel, userId });
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return cached;

    try {
      const weatherData = await this.getWeatherData(landParcel.location);
      const historicalTrends = await this.analyzeHistoricalTrends(landParcel._id, historicalRecords);
      const userPreferences = await this.getUserPreferences(userId);

      const prompt = `Analyze soil degradation risks with comprehensive data:
... [Prompt text truncated for brevity]`;

      // Use retry logic with JSON Mode
      const callWithRetry = async (messages, options, retryCount = 0) => {
        const maxRetries = 2;
        try {
          const response = await openai.chat.completions.create({
            ...options,
            messages,
            response_format: { type: "json_object" }
          });
          const content = response.choices[0].message.content;
          // Sanitize and parse JSON
          try {
            return JSON.parse(content);
          } catch {
            const jsonMatch = content.match(/(\[[\s\S]*?\]|\{[\s\S]*?\})/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[1]);
            }
            throw new Error('Unable to parse JSON');
          }
        } catch (error) {
          if (retryCount < maxRetries) {
            console.warn(`Enhanced AI call failed, retrying (${retryCount + 1}/${maxRetries}):`, error.message);
            const improvedMessages = messages.map(msg =>
              msg.role === 'user' ? {
                ...msg,
                content: msg.content + '\n\nIMPORTANT: Respond ONLY with valid JSON array. No additional text.'
              } : msg
            );
            return callWithRetry(improvedMessages, options, retryCount + 1);
          }
          throw error;
        }
      };

      const predictions = await callWithRetry(
        [{ role: 'user', content: prompt }],
        {
          model: 'gpt-4o-mini',
          temperature: this.getTemperatureWithUserPrefs(TASK_TYPES.PREDICTION, userPreferences),
          max_tokens: 1200,
        }
      );

      // Validate predictions structure
      if (!Array.isArray(predictions) || !predictions.every(p => p.title && p.description)) {
        console.warn('Invalid degradation predictions structure, using fallback');
        return this.fallbackDegradationPredictions(soilRecord, sensorData);
      }

      const enhancedPredictions = predictions.map(pred => ({
        title: pred.title || 'Unknown',
        description: pred.description || 'No description',
        aiConfidence: pred.aiConfidence || 0.8,
        severity: pred.severity || 'medium',
      }));

      this.setCachedResponse(cacheKey, enhancedPredictions);
      return enhancedPredictions;
    } catch (error) {
      console.error('Enhanced degradation prediction error:', error);
      return this.fallbackDegradationPredictions(soilRecord, sensorData);
    }
  }

  // Placeholder fallbacks to prevent runtime crashes
  fallbackDegradationPredictions() { return []; }
  fallbackCropRecommendations() { return []; }
  fallbackRestorationSuggestions() { return []; }
  fallbackFertilizerOptimizations() { return []; }
  fallbackWaterManagement() { return []; }

  async generateComprehensiveRecommendations(parcelId, userId) {
    const cacheKey = this.generateCacheKey('comprehensive', { parcelId, userId });
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return cached;

    try {
      // Fetch parcel and related data
      const LandParcel = (await import('../models/LandParcel.js')).default;
      const SoilHealthRecord = (await import('../models/SoilHealthRecord.js')).default;
      const IoTSensor = (await import('../models/IoTSensor.js')).default;

      const parcel = await LandParcel.findById(parcelId);
      if (!parcel) throw new Error('Parcel not found');

      const soilRecords = await SoilHealthRecord.find({ parcelId }).sort({ createdAt: -1 }).limit(10);
      const sensors = await IoTSensor.find({ parcelId });

      const latestSoilRecord = soilRecords[0] || {};
      const weatherData = await this.getWeatherData(parcel.location);
      const historicalTrends = await this.analyzeHistoricalTrends(parcelId, soilRecords);
      const userPreferences = await this.getUserPreferences(userId);

      // Get Earth Engine analysis if coordinates available
      let earthEngineData = null;
      if (parcel?.latitude && parcel?.longitude) {
        try {
          earthEngineData = await googleEarthEngineService.analyzeParcel(parcel);
        } catch (eeError) {
          console.warn('Earth Engine analysis failed for recommendations:', eeError.message);
        }
      }

      const prompt = `You are an expert agricultural AI assistant specializing in land restoration and soil health management. Your task is to provide comprehensive, actionable recommendations for land parcel management.

CONTEXT:
- Parcel Location: ${parcel.location || 'Unknown'}
- Parcel Size: ${parcel.size || 'Unknown'} hectares
- Current Soil Vitality: ${latestSoilRecord.vitalityScore || 'Unknown'}/100
- pH Level: ${latestSoilRecord.phLevel || 'Unknown'}
- Moisture: ${latestSoilRecord.moistureLevel || 'Unknown'}%
- Active Sensors: ${sensors.length}
- Satellite Data: ${earthEngineData ? `NDVI: ${earthEngineData.ndvi}, Land Cover: ${earthEngineData.landCover}, Precipitation: ${earthEngineData.precipitation}mm` : 'Not available'}

RECENT TRENDS:
- pH Trend: ${historicalTrends?.phTrend?.toFixed(2) || 'N/A'}
- Moisture Trend: ${historicalTrends?.moistureTrend?.toFixed(2) || 'N/A'}
- Vitality Trend: ${historicalTrends?.vitalityTrend?.toFixed(2) || 'N/A'}

TRAINING EXAMPLES:
Example 1 - Acidic Soil Issue:
Input: pH 5.2, moisture 45%, vitality 65
Output: [{"type":"liming","title":"Apply Agricultural Lime","description":"Soil pH is too low at 5.2. Apply 2 tons/ha of agricultural lime to raise pH to optimal range.","priority":"high","cost":800,"time":14}]

Example 2 - Moisture Deficiency:
Input: moisture 25%, rainfall low, vitality 70
Output: [{"type":"irrigation","title":"Install Drip Irrigation","description":"Critical moisture deficiency detected. Install drip irrigation system for efficient water delivery.","priority":"critical","cost":2500,"time":21}]

Example 3 - Erosion Risk:
Input: erosion rate 8 tons/ha/year, rainfall 120mm
Output: [{"type":"erosion_control","title":"Implement Contour Farming","description":"High erosion risk. Create contour lines and plant cover crops to prevent soil loss.","priority":"high","cost":600,"time":30}]

Example 4 - Satellite Monitoring:
Input: NDVI 0.35, land cover grassland, precipitation 45mm/month
Output: [{"type":"monitoring","title":"Implement Satellite-Based Monitoring","description":"Set up quarterly NDVI monitoring using satellite imagery to track vegetation health and detect early degradation signs.","priority":"medium","cost":150,"time":7}]

PROVIDE 3-5 SPECIFIC RECOMMENDATIONS covering:
1. Soil amendment needs (pH, nutrients, organic matter)
2. Water management solutions
3. Erosion control measures
4. Crop rotation suggestions
5. Long-term restoration strategies
6. Satellite-based monitoring recommendations (when data is available)

Each recommendation must include:
- type: (fertilization|irrigation|erosion_control|crop_rotation|soil_amendment)
- title: Clear, actionable title
- description: Detailed explanation with specific actions
- priority: (low|medium|high|critical)
- estimatedCost: Realistic cost in USD
- estimatedTimeDays: Implementation time
- aiConfidence: 0.0-1.0 based on data quality

Respond ONLY with valid JSON array of recommendation objects.`;

      // Use retry logic with JSON Mode for comprehensive recommendations
      const callWithRetry = async (messages, options, retryCount = 0) => {
        const maxRetries = 2;
        try {
          const response = await openai.chat.completions.create({
            ...options,
            messages,
            response_format: { type: "json_object" }
          });
          const content = response.choices[0].message.content;
          // Sanitize and parse JSON
          try {
            return JSON.parse(content);
          } catch {
            const jsonMatch = content.match(/(\[[\s\S]*?\]|\{[\s\S]*?\})/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[1]);
            }
            throw new Error('Unable to parse JSON');
          }
        } catch (error) {
          if (retryCount < maxRetries) {
            console.warn(`Comprehensive recommendations call failed, retrying (${retryCount + 1}/${maxRetries}):`, error.message);
            const improvedMessages = messages.map(msg =>
              msg.role === 'user' ? {
                ...msg,
                content: msg.content + '\n\nIMPORTANT: Respond ONLY with valid JSON array. No additional text.'
              } : msg
            );
            return callWithRetry(improvedMessages, options, retryCount + 1);
          }
          throw error;
        }
      };

      const recommendations = await callWithRetry(
        [{ role: 'user', content: prompt }],
        {
          model: 'gpt-4o-mini',
          temperature: this.getTemperatureWithUserPrefs(TASK_TYPES.RECOMMENDATION, userPreferences),
          max_tokens: 1500,
        }
      );

      // Validate recommendations structure
      if (!Array.isArray(recommendations) || !recommendations.every(r => r.title && r.description)) {
        console.warn('Invalid comprehensive recommendations structure, returning empty array');
        return { recommendations: [], parcelId, error: 'Unable to generate valid recommendations' };
      }

      const enhancedRecommendations = recommendations.map(rec => ({
        recommendationType: rec.type || 'general',
        title: rec.title || 'Recommendation',
        description: rec.description || 'No description provided',
        priority: rec.priority || 'medium',
        estimatedCost: rec.estimatedCost || 0,
        estimatedTimeDays: rec.estimatedTimeDays || 30,
        aiConfidence: rec.aiConfidence || 0.8,
        parcelId,
        userId
      }));

      this.setCachedResponse(cacheKey, { recommendations: enhancedRecommendations, parcelId });
      return { recommendations: enhancedRecommendations, parcelId };
    } catch (error) {
      console.error('Comprehensive recommendations error:', error);
      return { recommendations: [], parcelId, error: 'Unable to generate recommendations at this time' };
    }
  }

  async chatAboutRestoration(query, parcelId, userId, conversationHistory = []) {
    try {
      // Fetch parcel context
      const LandParcel = (await import('../models/LandParcel.js')).default;
      const SoilHealthRecord = (await import('../models/SoilHealthRecord.js')).default;

      const parcel = await LandParcel.findById(parcelId);
      const recentSoilRecords = await SoilHealthRecord.find({ parcelId }).sort({ createdAt: -1 }).limit(3);
      const userPreferences = await this.getUserPreferences(userId);
      const userModulePrefs = await this.getUserModulePreferences(userId);

      // Get Earth Engine analysis if parcel has coordinates
      let earthEngineData = null;
      if (parcel?.latitude && parcel?.longitude) {
        try {
          earthEngineData = await googleEarthEngineService.analyzeParcel(parcel);
        } catch (eeError) {
          console.warn('Earth Engine analysis failed:', eeError.message);
        }
      }

      const context = {
        parcel: {
          location: parcel?.location || 'Unknown',
          size: parcel?.size || 'Unknown',
          soilType: parcel?.soilType || 'Unknown',
          latitude: parcel?.latitude,
          longitude: parcel?.longitude
        },
        soilHealth: recentSoilRecords[0] || {},
        earthEngineData,
        history: conversationHistory.slice(-5) // Last 5 messages for context
      };

      const historyText = context.history.map(msg => `${msg.role}: ${msg.content}`).join('\n');

      // Determine most relevant Earth Engine data based on user module preferences
      const topModules = userModulePrefs ? userModulePrefs.map(p => p.moduleName) : [];
      const prioritizeSatelliteData = topModules.includes('SoilHealthMonitor') || topModules.includes('ImpactMetrics') || topModules.includes('LandMap');

      const prompt = `You are TerraLink AI, an expert agricultural consultant specializing in land restoration and sustainable farming practices. You help farmers make informed decisions about soil health, restoration techniques, and agricultural management.

CURRENT CONTEXT:
- Location: ${context.parcel.location}
- Parcel Size: ${context.parcel.size} hectares
- Soil Vitality: ${context.soilHealth.vitalityScore || 'Unknown'}/100
- pH: ${context.soilHealth.phLevel || 'Unknown'}
- Moisture: ${context.soilHealth.moistureLevel || 'Unknown'}%
- Recent Erosion: ${context.soilHealth.erosionRate || 'Unknown'} tons/ha/year
- User's Preferred Modules: ${topModules.slice(0, 3).join(', ') || 'General'}

${prioritizeSatelliteData ? `SATELLITE ANALYSIS (High Priority):
- NDVI: ${context.earthEngineData?.ndvi || 'Not available'} (Vegetation health indicator)
- Land Cover: ${context.earthEngineData?.landCover || 'Not available'}
- Precipitation: ${context.earthEngineData?.precipitation || 'Not available'} mm/month
- Temperature: ${context.earthEngineData?.temperature || 'Not available'}°C` : `SATELLITE ANALYSIS (Available):
- NDVI: ${context.earthEngineData?.ndvi || 'Not available'}
- Land Cover: ${context.earthEngineData?.landCover || 'Not available'}
- Precipitation: ${context.earthEngineData?.precipitation || 'Not available'} mm/month`}

CONVERSATION HISTORY:
${historyText}

USER QUERY: ${query}

TRAINING GUIDELINES:
1. Always provide specific, actionable advice based on soil data and satellite imagery
2. Include cost estimates when suggesting interventions
3. Mention implementation timelines
4. Reference local conditions, climate considerations, and satellite data
5. Suggest monitoring methods to track progress, including satellite-based monitoring
6. Be encouraging and supportive while being realistic
7. If data is insufficient, ask for clarification rather than guessing
8. Use simple, clear language avoiding jargon or explaining it
9. When available, incorporate satellite data (NDVI, land cover, precipitation) into recommendations
10. Tailor responses to user's preferred modules - if they frequently use SoilHealthMonitor, emphasize soil data; if ImpactMetrics, focus on environmental impact; if LandMap, include spatial considerations

EXAMPLE RESPONSES:
Q: "My soil is very acidic, what should I do?"
A: "Based on your pH of ${context.soilHealth.phLevel}, I recommend applying agricultural lime at 2-3 tons per hectare. This will gradually raise your pH to the optimal range of 6.0-7.0 over 3-6 months. Cost is approximately $400-600 per hectare. Test your soil again in 2 months to monitor progress."

Q: "How can I prevent erosion on my sloping land?"
A: "For erosion control on sloping terrain, consider these options: 1) Plant cover crops like clover or rye along contours ($150/ha), 2) Install grass strips every 10-15 meters ($300/ha), or 3) Create swales to capture runoff ($500/ha). Start with cover crops as they're the most cost-effective immediate solution."

Q: "What crops should I plant to improve soil health?"
A: "For soil improvement, focus on nitrogen-fixing legumes like clover, alfalfa, or beans. These will add organic matter and nitrogen naturally. Plant in fall for winter cover, expecting 20-30% soil health improvement by spring. Cost: $100-200/ha for seed."

Q: "Analyze the vegetation health in this area"
A: "Based on satellite data, your NDVI is ${context.earthEngineData?.ndvi || 'currently unavailable'}. This indicates ${context.earthEngineData?.ndvi > 0.6 ? 'healthy vegetation' : context.earthEngineData?.ndvi > 0.3 ? 'moderate vegetation stress' : 'significant vegetation decline'}. I recommend monitoring this with quarterly satellite assessments and implementing cover cropping if NDVI drops below 0.4."

Provide a helpful, specific response to the user's query using the available context. Keep your response under 300 words and focus on practical advice.`;

      const messages = [
        { role: 'system', content: 'You are a knowledgeable agricultural AI assistant. Provide specific, actionable advice based on soil data and farming best practices.' },
        { role: 'user', content: prompt }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: this.getTemperatureWithUserPrefs(TASK_TYPES.CHAT, userPreferences),
        max_tokens: 600,
      });

      const aiResponse = response.choices[0].message.content;

      return {
        response: aiResponse,
        parcelId,
        userId,
        confidence: 0.85,
        suggestions: this.extractSuggestionsFromResponse(aiResponse)
      };
    } catch (error) {
      console.error('AI chat error:', error);
      // Generate varied error response using AI with higher temperature for creativity
      const errorResponse = await this.generateErrorResponse(query, parcelId, userId, conversationHistory, error);
      return {
        response: errorResponse,
        parcelId,
        userId,
        error: true,
        confidence: 0
      };
    }
  }

  async generateErrorResponse(query, parcelId, userId, conversationHistory, originalError) {
    try {
      const userPreferences = await this.getUserPreferences(userId);

      // Use higher temperature for more creative/varied error responses
      const errorTemperature = Math.max(0.8, this.getTemperatureWithUserPrefs(TASK_TYPES.CHAT, userPreferences) + 0.2);

      const errorPrompt = `You are TerraLink AI assistant. The user asked: "${query}"

Unfortunately, I'm experiencing technical difficulties and cannot provide a full response right now. However, I want to be helpful and provide some guidance.

Please generate a friendly, encouraging error message that:
1. Acknowledges the technical issue politely
2. Offers alternative ways the user can get help
3. Suggests rephrasing their question or providing more context
4. Maintains a positive, supportive tone
5. Keeps the response under 100 words

Make each error message unique and varied - don't use the same phrasing twice.

Example variations:
- "I'm having a bit of trouble connecting right now, but I'd love to help with your restoration question. Could you try asking again in a moment?"
- "Technical hiccup! While I'm sorting this out, you might find helpful info in our restoration guides. What specific aspect interests you?"
- "Oops, something went wrong on my end. Let's try a different approach - could you tell me more about your land restoration goals?"

Generate a new, unique error message:`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: errorPrompt }],
        temperature: errorTemperature,
        max_tokens: 150,
      });

      return response.choices[0].message.content.trim();
    } catch (fallbackError) {
      console.error('Error generating fallback response:', fallbackError);
      // Ultimate fallback if even error response generation fails
      const fallbacks = [
        "I'm experiencing some technical difficulties right now. Please try your question again in a moment - I'd be happy to help with your restoration needs!",
        "Having a temporary connection issue, but I'm here to help! Could you rephrase your question about land restoration?",
        "Technical glitch detected! While I work on fixing this, feel free to ask me about soil health, erosion control, or restoration techniques.",
        "Oops, something went wrong on my end. Let's try again - what would you like to know about sustainable land management?",
        "I'm having trouble processing that right now, but I'm eager to assist with your agricultural questions. Please try again!"
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }

  extractSuggestionsFromResponse(response) {
    const suggestions = [];
    const lines = response.split('\n');
    for (const line of lines) {
      if ((/^\d+\./.test(line) || /^[•\-*]/.test(line)) && line.length > 20) {
        const clean = line.replace(/^\d+\.\s*/, '').replace(/^[•\-*]\s*/, '').trim();
        suggestions.push(clean);
      }
    }
    return suggestions;
  }
}

export const enhancedAIService = new EnhancedAIService();
