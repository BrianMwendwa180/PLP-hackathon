import { backgroundProcessingService } from '../services/backgroundProcessingService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

// Add comprehensive AI analysis job to queue
export const queueComprehensiveAIAnalysis = async (req, res) => {
  try {
    const { parcelId, forceRefresh = false } = req.body;

    if (!parcelId) {
      return res.status(400).json({ message: 'Parcel ID is required' });
    }

    // Verify user owns the parcel
    const LandParcel = (await import('../models/LandParcel.js')).default;
    const parcel = await LandParcel.findById(parcelId);

    if (!parcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (parcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to analyze this parcel' });
    }

    const jobId = await backgroundProcessingService.addJob(
      'comprehensive_ai_analysis',
      { parcelId, userId: req.user.userId, forceRefresh },
      'normal'
    );

    res.json({
      message: 'AI analysis job queued successfully',
      jobId,
      estimatedTime: '2-5 minutes'
    });
  } catch (error) {
    console.error('Queue AI analysis error:', error);
    res.status(500).json({
      message: 'Failed to queue AI analysis',
      error: error.message
    });
  }
};

// Add predictive analytics job to queue
export const queuePredictiveAnalytics = async (req, res) => {
  try {
    const { parcelId, predictionHorizon = 90 } = req.body;

    if (!parcelId) {
      return res.status(400).json({ message: 'Parcel ID is required' });
    }

    // Verify user owns the parcel
    const LandParcel = (await import('../models/LandParcel.js')).default;
    const parcel = await LandParcel.findById(parcelId);

    if (!parcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (parcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to analyze this parcel' });
    }

    const jobId = await backgroundProcessingService.addJob(
      'predictive_analytics',
      { parcelId, predictionHorizon },
      'normal'
    );

    res.json({
      message: 'Predictive analytics job queued successfully',
      jobId,
      predictionHorizon: `${predictionHorizon} days`,
      estimatedTime: '1-3 minutes'
    });
  } catch (error) {
    console.error('Queue predictive analytics error:', error);
    res.status(500).json({
      message: 'Failed to queue predictive analytics',
      error: error.message
    });
  }
};

// Add sustainability scoring job to queue
export const queueSustainabilityScoring = async (req, res) => {
  try {
    const { parcelId } = req.body;

    if (!parcelId) {
      return res.status(400).json({ message: 'Parcel ID is required' });
    }

    // Verify user owns the parcel
    const LandParcel = (await import('../models/LandParcel.js')).default;
    const parcel = await LandParcel.findById(parcelId);

    if (!parcel) {
      return res.status(404).json({ message: 'Land parcel not found' });
    }

    if (parcel.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to analyze this parcel' });
    }

    const jobId = await backgroundProcessingService.addJob(
      'sustainability_scoring',
      { parcelId },
      'low'
    );

    res.json({
      message: 'Sustainability scoring job queued successfully',
      jobId,
      estimatedTime: '30-60 seconds'
    });
  } catch (error) {
    console.error('Queue sustainability scoring error:', error);
    res.status(500).json({
      message: 'Failed to queue sustainability scoring',
      error: error.message
    });
  }
};

// Get background processing queue status
export const getQueueStatus = async (req, res) => {
  try {
    const status = backgroundProcessingService.getQueueStatus();

    res.json({
      message: 'Queue status retrieved successfully',
      status
    });
  } catch (error) {
    console.error('Get queue status error:', error);
    res.status(500).json({
      message: 'Failed to get queue status',
      error: error.message
    });
  }
};

// Clear completed jobs from queue
export const clearCompletedJobs = async (req, res) => {
  try {
    backgroundProcessingService.clearCompletedJobs();

    res.json({
      message: 'Completed jobs cleared from queue'
    });
  } catch (error) {
    console.error('Clear completed jobs error:', error);
    res.status(500).json({
      message: 'Failed to clear completed jobs',
      error: error.message
    });
  }
};

// Emergency stop all background processing
export const stopBackgroundProcessing = async (req, res) => {
  try {
    backgroundProcessingService.stopProcessing();

    res.json({
      message: 'Background processing stopped'
    });
  } catch (error) {
    console.error('Stop background processing error:', error);
    res.status(500).json({
      message: 'Failed to stop background processing',
      error: error.message
    });
  }
};

// Get user's active background jobs
export const getUserJobs = async (req, res) => {
  try {
    // This would typically query a jobs database
    // For now, return queue status filtered by user
    const status = backgroundProcessingService.getQueueStatus();

    // In a real implementation, you'd filter jobs by userId
    // For now, return all jobs (assuming single-user system or proper filtering)

    res.json({
      message: 'User jobs retrieved successfully',
      jobs: status.queuedJobs,
      activeCount: status.activeJobs
    });
  } catch (error) {
    console.error('Get user jobs error:', error);
    res.status(500).json({
      message: 'Failed to get user jobs',
      error: error.message
    });
  }
};

// Batch queue multiple jobs for a user
export const batchQueueJobs = async (req, res) => {
  try {
    const { jobs } = req.body;

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({ message: 'Jobs array is required' });
    }

    const jobIds = [];

    for (const jobData of jobs) {
      const { type, data, priority = 'normal' } = jobData;

      // Verify parcel ownership for parcel-related jobs
      if (data.parcelId) {
        const LandParcel = (await import('../models/LandParcel.js')).default;
        const parcel = await LandParcel.findById(data.parcelId);

        if (!parcel) {
          continue; // Skip invalid parcels
        }

        if (parcel.ownerId.toString() !== req.user.userId) {
          continue; // Skip unauthorized parcels
        }
      }

      const jobId = await backgroundProcessingService.addJob(type, data, priority);
      jobIds.push(jobId);
    }

    res.json({
      message: `${jobIds.length} jobs queued successfully`,
      jobIds,
      estimatedTime: 'Varies by job type'
    });
  } catch (error) {
    console.error('Batch queue jobs error:', error);
    res.status(500).json({
      message: 'Failed to queue batch jobs',
      error: error.message
    });
  }
};
