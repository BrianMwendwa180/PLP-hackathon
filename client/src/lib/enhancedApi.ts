import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login'; // Redirect to login if needed
    }
    return Promise.reject(error);
  }
);

// Enhanced AI Recommendations API
export const aiRecommendationsAPI = {
  generateComprehensiveRecommendations: (parcelId: string) =>
    api.post<{ message: string; recommendations: any[]; metadata: any }>(`/recommendations/ai/generate/${parcelId}`),
  getAIPredictions: (parcelId: string) =>
    api.get(`/recommendations/ai/predictions/${parcelId}`),
  getWeatherData: (parcelId: string) =>
    api.get(`/recommendations/ai/weather/${parcelId}`),
  getHistoricalTrends: (parcelId: string) =>
    api.get(`/recommendations/ai/trends/${parcelId}`),

  // Chat with AI about restoration
  chatWithRestorationAI: (parcelId: string, query: string, conversationHistory: any[] = []) =>
    api.post(`/recommendations/parcel/${parcelId}/chat`, { query, conversationHistory }),
};

// Image Analysis API
export const imageAnalysisAPI = {
  analyzeCropDisease: (data: { parcelId: string; images: File[] }) => {
    const formData = new FormData();
    formData.append('parcelId', data.parcelId);
    data.images.forEach((image) => {
      formData.append('images', image);
    });
    return api.post('/image-analysis/crop-disease', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  analyzeSoilStructure: (data: { parcelId: string; images: File[] }) => {
    const formData = new FormData();
    formData.append('parcelId', data.parcelId);
    data.images.forEach((image) => {
      formData.append('images', image);
    });
    return api.post('/image-analysis/soil-structure', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  analyzeIrrigationSystem: (data: { parcelId: string; images: File[] }) => {
    const formData = new FormData();
    formData.append('parcelId', data.parcelId);
    data.images.forEach((image) => {
      formData.append('images', image);
    });
    return api.post('/image-analysis/irrigation', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  analyzeLandDegradation: (data: { parcelId: string; images: File[] }) => {
    const formData = new FormData();
    formData.append('parcelId', data.parcelId);
    data.images.forEach((image) => {
      formData.append('images', image);
    });
    return api.post('/image-analysis/degradation', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  batchAnalyze: (data: { parcelId: string; images: File[]; analysisTypes: string[] }) => {
    const formData = new FormData();
    formData.append('parcelId', data.parcelId);
    formData.append('analysisTypes', JSON.stringify(data.analysisTypes));
    data.images.forEach((image) => {
      formData.append('images', image);
    });
    return api.post('/image-analysis/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Background Processing API
export const backgroundProcessingAPI = {
  addJob: (data: { type: string; data: any; priority?: string }) =>
    api.post<{ message: string; jobId: string }>('/background-processing/jobs', data),
  getQueueStatus: () =>
    api.get<{ activeJobs: number; queuedJobs: number; completedJobs: number; failedJobs: number }>(
      '/background-processing/queue/status'
    ),
  getJobStatus: (jobId: string) =>
    api.get(`/background-processing/jobs/${jobId}`),
  clearCompletedJobs: () =>
    api.delete('/background-processing/jobs/completed'),
  stopProcessing: () =>
    api.post('/background-processing/stop'),
};

// Sustainability API
export const sustainabilityAPI = {
  getParcelScore: (parcelId: string) =>
    api.get(`/sustainability/score/${parcelId}`),
  getCarbonFootprint: (parcelId: string) =>
    api.get(`/sustainability/carbon/${parcelId}`),
  getBiodiversityIndex: (parcelId: string) =>
    api.get(`/sustainability/biodiversity/${parcelId}`),
  getRecommendations: (parcelId: string) =>
    api.get(`/sustainability/recommendations/${parcelId}`),
};

// Enhanced Recommendation interfaces
export interface EnhancedRecommendation {
  _id: string;
  parcelId: string;
  userId: string;
  recommendationType: string;
  title: string;
  description: string;
  priority: string;
  estimatedCost: number;
  estimatedTimeDays?: number;
  aiGenerated?: boolean;
  status: string;
  aiConfidence?: number;
  predictionTimeframe?: string;
  predictionType?: string;
  severity?: string;
  sustainabilityImpact?: string;
  expectedROI?: number;
  environmentalImpact?: string;
  biodiversityBenefit?: string;
  implementationSteps?: string[];
  monitoringMetrics?: string[];
  expectedYield?: number;
  marketValue?: number;
  roi?: number;
  sustainabilityScore?: number;
  climateResilience?: string;
  fertilizerType?: string;
  applicationMethod?: string;
  efficiency?: number;
  monitoringProtocol?: string[];
  waterSavings?: number;
  automationLevel?: string;
  mitigationStrategy?: string;
  createdAt: string;
  implementedAt?: string;
}

// Image Analysis interfaces
export interface ImageAnalysisResult {
  analysisId: string;
  parcelId: string;
  analysisType: string;
  results: {
    confidence: number;
    findings: string[];
    recommendations: string[];
    severity?: string;
    affectedArea?: number;
  };
  images: {
    filename: string;
    url: string;
    analysis: any;
  }[];
  createdAt: string;
}

// Background Processing interfaces
export interface BackgroundJob {
  jobId: string;
  type: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  progress?: number;
  result?: any;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// Sustainability interfaces
export interface SustainabilityScore {
  parcelId: string;
  overallScore: number;
  grade: string;
  categories: {
    soilHealth: number;
    waterManagement: number;
    biodiversity: number;
    carbonSequestration: number;
    climateResilience: number;
  };
  lastUpdated: string;
}

export interface CarbonFootprint {
  parcelId: string;
  totalFootprint: number;
  breakdown: {
    soilManagement: number;
    cropProduction: number;
    waterUsage: number;
    machinery: number;
  };
  sequestration: number;
  netFootprint: number;
  lastCalculated: string;
}

export default api;
