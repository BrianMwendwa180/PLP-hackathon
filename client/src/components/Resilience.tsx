import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, TrendingDown, Thermometer, Droplets, Eye, Download } from 'lucide-react';
import { alertsAPI, soilHealthAPI } from '../lib/api';
import { exportAlerts } from '../lib/csvExport';
import type { DegradationAlert as APIDegradationAlert, SoilHealthRecord as APISoilHealthRecord } from '../lib/api';
import AlertModal from './AlertModal';

type PredictiveAlert = {
  parcelId: string;
  parcelName: string;
  riskType: string;
  probability: number;
  severity: 'low' | 'medium' | 'high';
  recommendedAction: string;
};

export default function Resilience() {
  const [alerts, setAlerts] = useState<APIDegradationAlert[]>([]);
  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<APIDegradationAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    loadResilienceData();
  }, []);

  const loadResilienceData = async () => {
    try {
      const [alertsRes, soilRes] = await Promise.all([
        alertsAPI.getAllAlerts(),
        soilHealthAPI.getAllRecords(),
      ]);

      const apiAlerts = alertsRes.data || [];
      const apiSoilRecords = soilRes.data || [];

      setAlerts(apiAlerts);

      // Generate predictive alerts based on soil trends
      const predictive = generatePredictiveAlerts(apiSoilRecords);
      setPredictiveAlerts(predictive);
    } catch (error) {
      console.error('Error loading resilience data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePredictiveAlerts = (soilRecords: APISoilHealthRecord[]): PredictiveAlert[] => {
    const parcelGroups = soilRecords.reduce((acc, record) => {
      const parcelId = record.parcelId._id;
      if (!acc[parcelId]) {
        acc[parcelId] = { name: record.parcelId.name, records: [] };
      }
      acc[parcelId].records.push(record);
      return acc;
    }, {} as Record<string, { name: string; records: APISoilHealthRecord[] }>);

    const predictive: PredictiveAlert[] = [];

    Object.entries(parcelGroups).forEach(([parcelId, { name, records }]) => {
      // Sort by date
      records.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

      if (records.length >= 3) {
        const recent = records.slice(-3);
        const avgVitality = recent.reduce((sum, r) => sum + r.vitalityScore, 0) / recent.length;
        const avgMoisture = recent.reduce((sum, r) => sum + (r.moistureLevel || 0), 0) / recent.length;
        const avgTemp = recent.reduce((sum, r) => sum + (r.temperature || 0), 0) / recent.length;

        // Drought risk
        if (avgMoisture < 20 && avgTemp > 30) {
          predictive.push({
            parcelId,
            parcelName: name,
            riskType: 'Drought Risk',
            probability: Math.min(90, 50 + (30 - avgMoisture) * 2),
            severity: avgMoisture < 15 ? 'high' : 'medium',
            recommendedAction: 'Implement irrigation systems and drought-resistant crops',
          });
        }

        // Soil degradation risk
        if (avgVitality < 40) {
          predictive.push({
            parcelId,
            parcelName: name,
            riskType: 'Soil Degradation',
            probability: Math.min(85, 60 - avgVitality),
            severity: avgVitality < 25 ? 'high' : 'medium',
            recommendedAction: 'Apply organic matter and implement crop rotation',
          });
        }

        // Erosion risk (based on declining vitality trend)
        const trend = recent[2].vitalityScore - recent[0].vitalityScore;
        if (trend < -10) {
          predictive.push({
            parcelId,
            parcelName: name,
            riskType: 'Erosion Risk',
            probability: Math.min(80, Math.abs(trend) * 2),
            severity: trend < -20 ? 'high' : 'medium',
            recommendedAction: 'Install erosion control measures and maintain ground cover',
          });
        }
      }
    });

    return predictive;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => !a.isResolved);
  const resolvedAlerts = alerts.filter(a => a.isResolved);

  return (
    <div className="space-y-6">
      <div className="relative mb-8">
        {!imageError ? (
          <img
            src="https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=1200&h=300&fit=crop&crop=center"
            alt="Climate resilience background"
            className="w-full h-48 object-cover rounded-xl"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <h2 className="text-3xl font-bold text-white text-center">Climate Resilience Hub</h2>
          </div>
        )}
        {!imageError && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/80 to-indigo-500/80 rounded-xl"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <h2 className="text-3xl font-bold text-white text-center">Climate Resilience Hub</h2>
            </div>
          </>
        )}
      </div>

      {/* Current Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Active Degradation Alerts</h3>
            </div>
            <button
              onClick={() => exportAlerts(activeAlerts)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          {activeAlerts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active alerts</p>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div key={alert._id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900">{alert.alertType}</h4>
                      <p className="text-sm text-red-700 mt-1">{alert.message}</p>
                      <p className="text-xs text-red-600 mt-2">{alert.parcelId.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                  {alert.recommendedAction && (
                    <p className="text-sm text-red-800 mt-3 font-medium">
                      Recommended: {alert.recommendedAction}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Predictive Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-50 p-2 rounded-lg">
              <TrendingDown className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Predictive Risk Analysis</h3>
          </div>
          {predictiveAlerts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No predictive risks detected</p>
          ) : (
            <div className="space-y-3">
              {predictiveAlerts.map((alert, index) => (
                <div key={index} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-amber-900">{alert.riskType}</h4>
                      <p className="text-sm text-amber-700 mt-1">{alert.parcelName}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-amber-600">Risk: {alert.probability}%</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-amber-800 mt-3 font-medium">
                    Recommended: {alert.recommendedAction}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resilience Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-50 p-2 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Resilience Metrics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Thermometer className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Temperature Monitoring</h4>
            <p className="text-sm text-gray-600 mt-1">
              Tracking soil temperature trends for heat stress prediction
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Droplets className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Moisture Analysis</h4>
            <p className="text-sm text-gray-600 mt-1">
              Predictive drought risk assessment based on moisture levels
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Adaptive Capacity</h4>
            <p className="text-sm text-gray-600 mt-1">
              Measuring land's ability to recover from environmental stress
            </p>
          </div>
        </div>
      </div>

      {/* Resolved Alerts History */}
      {resolvedAlerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-50 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Resolved Alerts History</h3>
          </div>
          <div className="space-y-3">
            {resolvedAlerts.slice(0, 5).map((alert) => (
              <div key={alert._id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900">{alert.alertType}</h4>
                    <p className="text-sm text-green-700 mt-1">{alert.message}</p>
                    <p className="text-xs text-green-600 mt-2">{alert.parcelId.name}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Resolved
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AlertModal
        alert={selectedAlert}
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
      />
    </div>
  );
}
