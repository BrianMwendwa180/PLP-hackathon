import { backgroundProcessingService } from '../services/backgroundProcessingService.js';

describe('Background Processing Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset service state
    backgroundProcessingService.processingQueue = [];
    backgroundProcessingService.isProcessing = false;
    backgroundProcessingService.activeJobs = 0;
  });

  describe('addJob', () => {
    it('should add job to queue', async () => {
      const jobId = await backgroundProcessingService.addJob(
        'test_job',
        { data: 'test' },
        'normal'
      );

      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');
      expect(backgroundProcessingService.processingQueue).toHaveLength(1);
    });

    it('should prioritize high priority jobs', async () => {
      await backgroundProcessingService.addJob('normal_job', {}, 'normal');
      await backgroundProcessingService.addJob('high_job', {}, 'high');

      expect(backgroundProcessingService.processingQueue[0].priority).toBe('high');
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status', () => {
      const status = backgroundProcessingService.getQueueStatus();

      expect(status).toHaveProperty('queueLength');
      expect(status).toHaveProperty('activeJobs');
      expect(status).toHaveProperty('isProcessing');
      expect(status).toHaveProperty('queuedJobs');
    });
  });

  describe('clearCompletedJobs', () => {
    it('should clear completed jobs from queue', () => {
      backgroundProcessingService.processingQueue = [
        { status: 'completed' },
        { status: 'processing' },
        { status: 'failed' }
      ];

      backgroundProcessingService.clearCompletedJobs();

      expect(backgroundProcessingService.processingQueue).toHaveLength(2);
      expect(backgroundProcessingService.processingQueue.every(job =>
        job.status !== 'completed'
      )).toBe(true);
    });
  });

  describe('stopProcessing', () => {
    it('should stop background processing', () => {
      backgroundProcessingService.isProcessing = true;
      backgroundProcessingService.processingQueue = [{}, {}];
      backgroundProcessingService.activeJobs = 2;

      backgroundProcessingService.stopProcessing();

      expect(backgroundProcessingService.isProcessing).toBe(false);
      expect(backgroundProcessingService.processingQueue).toHaveLength(0);
      expect(backgroundProcessingService.activeJobs).toBe(0);
    });
  });
});
