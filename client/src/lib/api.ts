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

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  organization: string;
  impactPoints: number;
  badges: string[];
}

export interface LandParcel {
  _id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  sizeHectares: number;
  ownerId: {
    _id: string;
    fullName: string;
    email: string;
  };
  landUseType: string;
  soilType?: string;
  vegetationType?: string;
  irrigationType?: string;
  climateZone?: string;
  createdAt: string;
}

export interface SoilHealthRecord {
  _id: string;
  parcelId: {
    _id: string;
    name: string;
    location: string;
  };
  vitalityScore: number;
  phLevel?: number;
  moistureLevel?: number;
  nitrogenLevel?: number;
  phosphorusLevel?: number;
  potassiumLevel?: number;
  organicMatter?: number;
  temperature?: number;
  rainfall?: number;
  erosionRate?: number;
  dataSource: string;
  recordedAt: string;
  createdAt: string;
}

export interface RestorationActivity {
  _id: string;
  parcelId: {
    _id: string;
    name: string;
    location: string;
  };
  activityType: string;
  description: string;
  quantity: number;
  unit: string;
  performedBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  blockchainHash?: string;
  verificationStatus: string;
  carbonOffsetKg: number;
  performedAt: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface Recommendation {
  _id: string;
  parcelId: {
    _id: string;
    name: string;
    location: string;
  };
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
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
  createdAt: string;
  implementedAt?: string;
}

export interface DegradationAlert {
  _id: string;
  parcelId: {
    _id: string;
    name: string;
    location: string;
  };
  alertType: string;
  severity: string;
  message: string;
  recommendedAction?: string;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export interface IoTSensor {
  _id: string;
  parcelId: {
    _id: string;
    name: string;
    location: string;
  };
  sensorType: string;
  sensorId: string;
  name: string;
  location: string;
  status: string;
  lastSeen: string;
  thresholds?: {
    min?: number;
    max?: number;
    criticalMin?: number;
    criticalMax?: number;
  };
  units?: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: string;
  organization: string;
}

// Auth API
export const authAPI = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data),
};

// Land Parcels API
export const landParcelsAPI = {
  getMyParcels: () => api.get<LandParcel[]>('/land-parcels/my'),
  getAllParcels: () => api.get<LandParcel[]>('/land-parcels'),
  getParcelById: (id: string) => api.get<LandParcel>(`/land-parcels/${id}`),
  createParcel: (data: Omit<LandParcel, '_id' | 'ownerId' | 'createdAt'>) =>
    api.post<{ message: string; landParcel: LandParcel }>('/land-parcels', data),
  updateParcel: (id: string, data: Partial<Omit<LandParcel, '_id' | 'ownerId' | 'createdAt'>>) =>
    api.put<{ message: string; landParcel: LandParcel }>(`/land-parcels/${id}`, data),
  deleteParcel: (id: string) => api.delete<{ message: string }>(`/land-parcels/${id}`),
};

// Soil Health API
export const soilHealthAPI = {
  getRecordsByParcel: (parcelId: string) => api.get<SoilHealthRecord[]>(`/soil-health/parcel/${parcelId}`),
  getAllRecords: () => api.get<SoilHealthRecord[]>('/soil-health'),
  getRecordById: (id: string) => api.get<SoilHealthRecord>(`/soil-health/${id}`),
  createRecord: (data: Omit<SoilHealthRecord, '_id' | 'parcelId' | 'createdAt'> & { parcelId: string }) =>
    api.post<{ message: string; soilHealthRecord: SoilHealthRecord }>('/soil-health', data),
  updateRecord: (id: string, data: Partial<SoilHealthRecord>) =>
    api.put<{ message: string; record: SoilHealthRecord }>(`/soil-health/${id}`, data),
  deleteRecord: (id: string) => api.delete<{ message: string }>(`/soil-health/${id}`),
};

// Restoration API
export const restorationAPI = {
  getActivitiesByParcel: (parcelId: string) => api.get<RestorationActivity[]>(`/restoration/parcel/${parcelId}`),
  getAllActivities: () => api.get<RestorationActivity[]>('/restoration'),
  getActivityById: (id: string) => api.get<RestorationActivity>(`/restoration/${id}`),
  createActivity: (data: Omit<RestorationActivity, '_id' | 'parcelId' | 'performedBy' | 'createdAt'> & { parcelId: string }) =>
    api.post<{ message: string; restorationActivity: RestorationActivity }>('/restoration', data),
  updateActivity: (id: string, data: Partial<RestorationActivity>) =>
    api.put<{ message: string; activity: RestorationActivity }>(`/restoration/${id}`, data),
  deleteActivity: (id: string) => api.delete<{ message: string }>(`/restoration/${id}`),
};

// Recommendations API
export const recommendationsAPI = {
  getRecommendationsByParcel: (parcelId: string) => api.get<Recommendation[]>(`/recommendations/parcel/${parcelId}`),
  getAllRecommendations: () => api.get<Recommendation[]>('/recommendations'),
  getRecommendationById: (id: string) => api.get<Recommendation>(`/recommendations/${id}`),
  createRecommendation: (data: Omit<Recommendation, '_id' | 'parcelId' | 'userId' | 'createdAt'> & { parcelId: string }) =>
    api.post<{ message: string; recommendation: Recommendation }>('/recommendations', data),
  updateRecommendation: (id: string, data: Partial<Recommendation>) =>
    api.put<{ message: string; recommendation: Recommendation }>(`/recommendations/${id}`, data),
  deleteRecommendation: (id: string) => api.delete<{ message: string }>(`/recommendations/${id}`),
};

// Alerts API
export const alertsAPI = {
  getAlertsByParcel: (parcelId: string) => api.get<DegradationAlert[]>(`/alerts/parcel/${parcelId}`),
  getAllAlerts: () => api.get<DegradationAlert[]>('/alerts'),
  getAlertById: (id: string) => api.get<DegradationAlert>(`/alerts/${id}`),
  createAlert: (data: Omit<DegradationAlert, '_id' | 'parcelId' | 'createdAt'> & { parcelId: string }) =>
    api.post<{ message: string; alert: DegradationAlert }>('/alerts', data),
  updateAlert: (id: string, data: Partial<DegradationAlert>) =>
    api.put<{ message: string; alert: DegradationAlert }>(`/alerts/${id}`, data),
  deleteAlert: (id: string) => api.delete<{ message: string }>(`/alerts/${id}`),
  resolveAlert: (id: string) => api.patch<{ message: string; alert: DegradationAlert }>(`/alerts/${id}/resolve`, {}),
  getPredictiveAlerts: () => api.get('/alerts/predictive'),
};

// Soil Health Analytics API
export const soilHealthAnalyticsAPI = {
  getTrendsByParcel: (parcelId: string, period?: string) =>
    api.get(`/soil-health/analytics/trends/${parcelId}${period ? `?period=${period}` : ''}`),
  getAnalyticsSummary: () => api.get('/soil-health/analytics/summary'),
  getFertilityIndex: (parcelId: string) => api.get(`/soil-health/analytics/fertility/${parcelId}`),
};

// Restoration Analytics API
export const restorationAnalyticsAPI = {
  getProgressByParcel: (parcelId: string) => api.get(`/restoration/analytics/progress/${parcelId}`),
  getCarbonOffsetSummary: () => api.get('/restoration/analytics/carbon-offset'),
};

// Recommendations Analytics API
export const recommendationsAnalyticsAPI = {
  getImplementationStats: () => api.get('/recommendations/analytics/implementation'),
  getAIGeneratedStats: () => api.get('/recommendations/analytics/ai-generated'),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get<User>('/users/profile'),
  updateProfile: (data: Partial<User>) => api.put<User>('/users/profile', data),
};

// Sensors API
export const sensorsAPI = {
  registerSensor: (data: Omit<IoTSensor, '_id' | 'parcelId' | 'createdAt' | 'lastSeen'> & { parcelId: string }) =>
    api.post<{ message: string; sensor: IoTSensor & { apiKey: string } }>('/sensors', data),
  getSensorsByParcel: (parcelId: string) => api.get<IoTSensor[]>(`/sensors/parcel/${parcelId}`),
  getAllSensors: () => api.get<IoTSensor[]>('/sensors'),
  getSensorById: (id: string) => api.get<IoTSensor>(`/sensors/${id}`),
  updateSensor: (id: string, data: Partial<IoTSensor>) =>
    api.put<{ message: string; sensor: IoTSensor }>(`/sensors/${id}`, data),
  deleteSensor: (id: string) => api.delete<{ message: string }>(`/sensors/${id}`),
};

// Soil Health Ingestion API (for sensor data)
export const soilHealthIngestionAPI = {
  ingestSensorData: (data: { sensorId: string; apiKey: string; data: any }) =>
    api.post('/soil-health/ingest', data),
};

// Export utilities
export { exportSoilHealthRecords, exportSensorData } from './csvExport';
export { exportSensorDataToPDF, exportSoilHealthToPDF } from './pdfExport';

export default api;
