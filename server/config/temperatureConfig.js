/**
 * Temperature Configuration for LLM Optimization
 *
 * This module provides configurable temperature settings for different AI tasks,
 * allowing systematic optimization of LLM performance across various use cases.
 *
 * Temperature ranges:
 * - 0.0-0.5: Low creativity, high determinism (factual, analytical tasks)
 * - 0.5-1.0: Balanced creativity and consistency (general recommendations)
 * - 1.0-2.0: High creativity, more randomness (creative, brainstorming tasks)
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Task type definitions with recommended temperature ranges
 */
const TASK_TYPES = {
  // Factual, analytical tasks requiring high consistency
  FACTUAL: 'factual',
  ANALYTICAL: 'analytical',
  PREDICTION: 'prediction',

  // Balanced tasks needing some creativity but maintaining reliability
  RECOMMENDATION: 'recommendation',
  CLASSIFICATION: 'classification',

  // Creative tasks benefiting from diversity
  CREATIVE: 'creative',
  CHAT: 'chat',
  BRAINSTORMING: 'brainstorming'
};

/**
 * Default temperature settings for different task types
 * These represent the "Goldilocks zone" based on empirical testing
 */
const DEFAULT_TEMPERATURES = {
  [TASK_TYPES.FACTUAL]: 0.1,        // Very deterministic for factual responses
  [TASK_TYPES.ANALYTICAL]: 0.2,     // Low creativity for analysis
  [TASK_TYPES.PREDICTION]: 0.3,     // Slightly more flexibility for predictions
  [TASK_TYPES.RECOMMENDATION]: 0.4, // Balanced for practical recommendations
  [TASK_TYPES.CLASSIFICATION]: 0.2, // Consistent classification results
  [TASK_TYPES.CREATIVE]: 0.8,       // Higher creativity for innovative suggestions
  [TASK_TYPES.CHAT]: 0.7,           // Conversational balance
  [TASK_TYPES.BRAINSTORMING]: 1.0   // Maximum creativity for ideation
};

/**
 * Provider-specific temperature limits
 */
const PROVIDER_LIMITS = {
  openai: { min: 0.0, max: 2.0 },
  anthropic: { min: 0.0, max: 1.0 }, // Claude limit
  google: { min: 0.0, max: 2.0 },
  default: { min: 0.0, max: 2.0 }
};

/**
 * Environment variable mappings for temperature overrides
 */
const ENV_MAPPINGS = {
  [TASK_TYPES.FACTUAL]: 'AI_TEMPERATURE_FACTUAL',
  [TASK_TYPES.ANALYTICAL]: 'AI_TEMPERATURE_ANALYTICAL',
  [TASK_TYPES.PREDICTION]: 'AI_TEMPERATURE_PREDICTION',
  [TASK_TYPES.RECOMMENDATION]: 'AI_TEMPERATURE_RECOMMENDATION',
  [TASK_TYPES.CLASSIFICATION]: 'AI_TEMPERATURE_CLASSIFICATION',
  [TASK_TYPES.CREATIVE]: 'AI_TEMPERATURE_CREATIVE',
  [TASK_TYPES.CHAT]: 'AI_TEMPERATURE_CHAT',
  [TASK_TYPES.BRAINSTORMING]: 'AI_TEMPERATURE_BRAINSTORMING'
};

/**
 * Validates temperature value against provider limits
 * @param {number} temperature - Temperature value to validate
 * @param {string} provider - AI provider name (default: 'openai')
 * @returns {boolean} - True if valid
 */
function validateTemperature(temperature, provider = 'openai') {
  const limits = PROVIDER_LIMITS[provider] || PROVIDER_LIMITS.default;
  return temperature >= limits.min && temperature <= limits.max;
}

/**
 * Gets temperature for a specific task type, with environment override support
 * @param {string} taskType - Task type from TASK_TYPES
 * @param {string} provider - AI provider name (default: 'openai')
 * @returns {number} - Validated temperature value
 */
function getTemperature(taskType, provider = 'openai') {
  // Check for environment variable override
  const envVar = ENV_MAPPINGS[taskType];
  const envValue = process.env[envVar];

  let temperature = DEFAULT_TEMPERATURES[taskType];

  if (envValue !== undefined) {
    const parsed = parseFloat(envValue);
    if (!isNaN(parsed) && validateTemperature(parsed, provider)) {
      temperature = parsed;
    } else {
      console.warn(`Invalid temperature value for ${taskType}: ${envValue}. Using default: ${temperature}`);
    }
  }

  // Final validation
  if (!validateTemperature(temperature, provider)) {
    console.error(`Temperature ${temperature} invalid for provider ${provider}. Using provider minimum.`);
    temperature = PROVIDER_LIMITS[provider]?.min || 0.0;
  }

  return temperature;
}

/**
 * Gets all current temperature settings
 * @param {string} provider - AI provider name
 * @returns {object} - Object with all task types and their temperatures
 */
function getAllTemperatures(provider = 'openai') {
  const temperatures = {};
  Object.values(TASK_TYPES).forEach(taskType => {
    temperatures[taskType] = getTemperature(taskType, provider);
  });
  return temperatures;
}

/**
 * Applies user preferences to temperature settings
 * @param {object} defaultTemperatures - Default temperatures object
 * @param {Map} userPreferences - User-specific preferences (Map of taskType -> temperature)
 * @param {string} provider - AI provider name
 * @returns {object} - Temperatures with user overrides applied
 */
function applyUserPreferences(defaultTemperatures, userPreferences, provider = 'openai') {
  const temperatures = { ...defaultTemperatures };

  if (userPreferences && typeof userPreferences === 'object') {
    Object.values(TASK_TYPES).forEach(taskType => {
      const userTemp = userPreferences.get ? userPreferences.get(taskType) : userPreferences[taskType];
      if (userTemp !== undefined && validateTemperature(userTemp, provider)) {
        temperatures[taskType] = userTemp;
      }
    });
  }

  return temperatures;
}

/**
 * Logs current temperature configuration for debugging
 */
function logTemperatureConfig(provider = 'openai') {
  console.log('=== LLM Temperature Configuration ===');
  console.log(`Provider: ${provider}`);
  console.log(`Limits: ${JSON.stringify(PROVIDER_LIMITS[provider] || PROVIDER_LIMITS.default)}`);
  console.log('Current Settings:');

  Object.values(TASK_TYPES).forEach(taskType => {
    const temp = getTemperature(taskType, provider);
    const envVar = ENV_MAPPINGS[taskType];
    const envValue = process.env[envVar];
    const source = envValue !== undefined ? `env(${envValue})` : 'default';
    console.log(`  ${taskType}: ${temp} (${source})`);
  });
  console.log('=====================================');
}

export {
  TASK_TYPES,
  DEFAULT_TEMPERATURES,
  PROVIDER_LIMITS,
  getTemperature,
  getAllTemperatures,
  validateTemperature,
  applyUserPreferences,
  logTemperatureConfig
};
