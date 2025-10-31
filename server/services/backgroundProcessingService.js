import { enhancedAIService } from './enhancedAIService.js';
import { imageAnalysisService } from './imageAnalysisService.js';
import Recommendation from '../models/Recommendation.js';
import LandParcel from '../models/LandParcel.js';
import SoilHealthRecord from '../models/SoilHealthRecord.js';
import IoTSensor from '../models/IoTSensor.js';

class BackgroundProcessingService {
  constructor() {
    this.processingQueue = [];
    this.isProcessing = false;
    this.maxConcurrentJobs = 3;
    this.activeJobs = 0;
  }

  // Add job to processing queue
  async addJob(jobType, data, priority = 'normal') {
    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: jobType,
      data: data,
      priority: priority,
      status: 'queued',
      createdAt: new Date(),
      retries: 0,
      maxRetries: 3
    };

    // Insert based on priority
    if (priority === 'high') {
      this.processingQueue.unshift(job);
    } else {
      this.processingQueue.push(job);
    }

    console.log(`Job ${job.id} added to queue. Queue length: ${this.processingQueue.length}`);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return job.id;
  }

  // Start background processing
  async startProcessing() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    console.log('Background processing started');

    while (this.processingQueue.length > 0 && this.activeJobs < this.maxConcurrentJobs) {
      const job = this.processingQueue.shift();
      if (!job) break;

      this.activeJobs++;
      this.processJob(job).finally(() => {
        this.activeJobs--;
      });
    }

    this.isProcessing = false;
  }

  // Process individual job
  async processJob(job) {
    try {
      job.status = 'processing';
      console.log(`Processing job ${job.id}: ${job.type}`);

      switch (job.type) {
        case 'comprehensive_ai_analysis':
          await this.processComprehensiveAIAnalysis(job.data);
          break;
        case 'batch_image_analysis':
          await this.processBatchImageAnalysis(job.data);
          break;
        case 'predictive_analytics':
          await this.processPredictiveAnalytics(job.data);
          break;
        case 'sustainability_scoring':
          await this.processSustainabilityScoring(job.data);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      job.status = 'completed';
      console.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);

      job.retries++;
      job.lastError = error.message;

      if (job.retries < job.maxRetries) {
        job.status = 'retrying';
        // Add back to queue with lower priority
        setTimeout(() => {
          this.processingQueue.push(job);
        }, Math.pow(2, job.retries) * 1000); // Exponential backoff
      } else {
        job.status = 'failed';
        console.error(`Job ${job.id} permanently failed after ${job.maxRetries} retries`);
      }
    }
  }

  // Process comprehensive AI analysis
  async processComprehensiveAIAnalysis(data) {
    const { parcelId, userId, forceRefresh = false } = data;

    // Check if recent analysis exists (unless force refresh)
    if (!forceRefresh) {
      const recentAnalysis = await Recommendation.findOne({
        parcelId,
        aiGenerated: true,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      if (recentAnalysis) {
        console.log(`Recent AI analysis exists for parcel ${parcelId}, skipping`);
        return;
      }
    }

    await enhancedAIService.generateComprehensiveRecommendations(parcelId, userId);
  }

  // Process batch image analysis
  async processBatchImageAnalysis(data) {
    const { images, analysisType, userId } = data;

    const results = await imageAnalysisService.batchAnalyze(images, analysisType);

    // Store results in database or notify user
    // This would typically save to an ImageAnalysis model
    console.log(`Batch analysis completed for ${results.length} images`);

    // Emit results via socket or save to user notifications
    // For now, just log completion
  }

  // Process predictive analytics
  async processPredictiveAnalytics(data) {
    const { parcelId, predictionHorizon = 90 } = data; // 90 days default

    const parcel = await LandParcel.findById(parcelId);
    if (!parcel) throw new Error('Land parcel not found');

    // Get historical data
    const historicalRecords = await SoilHealthRecord
      .find({ parcelId })
      .sort({ recordedAt: -1 })
      .limit(50);

    if (historicalRecords.length < 5) {
      console.log('Insufficient historical data for predictive analytics');
      return;
    }

    // Generate predictive recommendations
    const predictions = await this.generatePredictiveRecommendations(historicalRecords, parcel, predictionHorizon);

    // Save predictions as recommendations
    for (const prediction of predictions) {
      const recommendation = new Recommendation({
        parcelId,
        userId: parcel.ownerId,
        ...prediction,
        aiGenerated: true,
        predictionType: 'predictive_analytics'
      });
      await recommendation.save();
    }

    console.log(`Generated ${predictions.length} predictive recommendations for parcel ${parcelId}`);
  }

  // Process sustainability scoring
  async processSustainabilityScoring(data) {
    const { parcelId } = data;

    const parcel = await LandParcel.findById(parcelId);
    if (!parcel) throw new Error('Land parcel not found');

    const latestRecord = await SoilHealthRecord
      .findOne({ parcelId })
      .sort({ recordedAt: -1 });

    const recommendations = await Recommendation
      .find({ parcelId, aiGenerated: true })
      .sort({ createdAt: -1 })
      .limit(20);

    if (!latestRecord) {
      console.log('No soil health record found for sustainability scoring');
      return;
    }

    const sustainabilityScore = await this.calculateSustainabilityScore(latestRecord, recommendations, parcel);

    // Update parcel with sustainability score
    await LandParcel.findByIdAndUpdate(parcelId, {
      sustainabilityScore: sustainabilityScore.score,
      sustainabilityGrade: sustainabilityScore.grade,
      lastSustainabilityUpdate: new Date()
    });

    console.log(`Sustainability score updated for parcel ${parcelId}: ${sustainabilityScore.score} (${sustainabilityScore.grade})`);
  }

  // Generate predictive recommendations based on trends
  async generatePredictiveRecommendations(historicalRecords, parcel, horizon) {
    const predictions = [];

    // Analyze trends
    const trends = enhancedAIService.calculateTrend ?
      {
        phTrend: enhancedAIService.calculateTrend(historicalRecords.map(r => r.phLevel)),
        moistureTrend: enhancedAIService.calculateTrend(historicalRecords.map(r => r.moistureLevel)),
        vitalityTrend: enhancedAIService.calculateTrend(historicalRecords.map(r => r.vitalityScore))
      } : { phTrend: 0, moistureTrend: 0, vitalityTrend: 0 };

    // Predict future conditions
    const futurePh = historicalRecords[0].phLevel + (trends.phTrend * (horizon / 30));
    const futureMoisture = Math.max(0, Math.min(100, historicalRecords[0].moistureLevel + (trends.moistureTrend * (horizon / 30))));
    const futureVitality = Math.max(0, Math.min(100, historicalRecords[0].vitalityScore + (trends.vitalityTrend * (horizon / 30))));

    // Generate recommendations based on predicted conditions
    if (futurePh < 5.5) {
      predictions.push({
        recommendationType: 'soil_amendment',
        title: `Predicted Soil Acidity in ${horizon} Days`,
        description: `Based on current trends, soil pH may drop to ${futurePh.toFixed(1)}. Consider preventive liming.`,
        priority: 'medium',
        estimatedCost: 400,
        estimatedTimeDays: 30,
        aiConfidence: Math.max(0.6, Math.abs(trends.phTrend) * 10),
        predictionTimeframe: 'medium_term'
      });
    }

    if (futureMoisture < 30) {
      predictions.push({
        recommendationType: 'irrigation',
        title: `Predicted Drought Stress in ${horizon} Days`,
        description: `Soil moisture trending toward ${futureMoisture.toFixed(0)}%. Plan irrigation strategy.`,
        priority: 'high',
        estimatedCost: 1500,
        estimatedTimeDays: 14,
        aiConfidence: Math.max(0.7, Math.abs(trends.moistureTrend) * 10),
        predictionTimeframe: 'short_term'
      });
    }

    if (futureVitality < 50) {
      predictions.push({
        recommendationType: 'soil_health',
        title: `Predicted Soil Health Decline`,
        description: `Soil vitality may decrease to ${futureVitality.toFixed(0)} based on current trends.`,
        priority: 'high',
        estimatedCost: 800,
        estimatedTimeDays: 60,
        aiConfidence: Math.max(0.65, Math.abs(trends.vitalityTrend) * 10),
        predictionTimeframe: 'medium_term'
      });
    }

    return predictions;
  }

  // Calculate comprehensive sustainability score
  async calculateSustainabilityScore(soilRecord, recommendations, parcel) {
    let score = 50; // Base score

    // Soil health factors (40% weight)
    const soilHealthScore = (
      (soilRecord.vitalityScore || 0) * 0.3 +
      (soilRecord.organicMatter || 0) * 2 * 0.25 +
      (soilRecord.phLevel >= 6.0 && soilRecord.phLevel <= 7.5 ? 100 : 50) * 0.25 +
      (soilRecord.moistureLevel >= 40 && soilRecord.moistureLevel <= 80 ? 100 : 60) * 0.2
    );
    score += soilHealthScore * 0.4;

    // Management practices (30% weight)
    const practiceScore = recommendations.length > 0 ?
      Math.min(100, recommendations.filter(r => r.status === 'completed').length / recommendations.length * 100) : 30;
    score += practiceScore * 0.3;

    // Environmental impact (20% weight)
    const environmentalScore = recommendations
      .filter(r => r.environmentalImpact === 'positive')
      .length / Math.max(recommendations.length, 1) * 100;
    score += environmentalScore * 0.2;

    // Biodiversity and ecosystem factors (10% weight)
    const biodiversityScore = recommendations
      .filter(r => r.biodiversityBenefit && r.biodiversityBenefit !== 'low')
      .length > 0 ? 80 : 40;
    score += biodiversityScore * 0.1;

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine grade
    let grade;
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return {
      score: Math.round(score),
      grade,
      breakdown: {
        soilHealth: Math.round(soilHealthScore),
        practices: Math.round(practiceScore),
        environmental: Math.round(environmentalScore),
        biodiversity: Math.round(biodiversityScore)
      }
    };
  }

  // Get queue status
  getQueueStatus() {
    return {
      queueLength: this.processingQueue.length,
      activeJobs: this.activeJobs,
      isProcessing: this.isProcessing,
      queuedJobs: this.processingQueue.map(job => ({
        id: job.id,
        type: job.type,
        priority: job.priority,
        status: job.status,
        createdAt: job.createdAt
      }))
    };
  }

  // Clear completed jobs from queue
  clearCompletedJobs() {
    this.processingQueue = this.processingQueue.filter(job =>
      job.status !== 'completed' && job.status !== 'failed'
    );
  }

  // Emergency stop
  stopProcessing() {
    this.isProcessing = false;
    this.processingQueue = [];
    this.activeJobs = 0;
    console.log('Background processing stopped');
  }
}

// Export singleton instance
export const backgroundProcessingService = new BackgroundProcessingService();
export default backgroundProcessingService;
