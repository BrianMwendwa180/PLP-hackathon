import { useEffect, useState } from 'react';
import { Activity, Droplet, Wind, Thermometer } from 'lucide-react';
import { soilHealthAPI } from '../lib/api';
import type { SoilHealthRecord as APISoilHealthRecord } from '../lib/api';

export default function SoilHealthMonitor() {
  const [records, setRecords] = useState<APISoilHealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSoilHealth();
  }, []);

  const loadSoilHealth = async () => {
    try {
      const response = await soilHealthAPI.getAllRecords();
      const apiRecords = Array.isArray(response.data) ? response.data : [];

      setRecords(apiRecords.slice(0, 5)); // Limit to 5 most recent
    } catch (error) {
      console.error('Error loading soil health:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const getVitalityColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getVitalityStatus = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">AI-Driven Soil Health Scoring</h2>
        <p className="text-emerald-50">
          Real-time monitoring and predictive analysis of land vitality
        </p>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Soil Health Data Yet</h3>
          <p className="text-gray-600">Start monitoring your land to see health metrics here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-lg font-bold text-2xl ${getVitalityColor(record.vitalityScore)}`}>
                      {record.vitalityScore}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Land Vitality Score</p>
                      <p className="font-semibold text-gray-900">
                        {getVitalityStatus(record.vitalityScore)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Data Source</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {record.dataSource.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {record.moistureLevel !== null && (
                  <div className="flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Moisture</p>
                      <p className="text-sm font-semibold text-gray-900">{record.moistureLevel}%</p>
                    </div>
                  </div>
                )}

                {record.phLevel !== null && (
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-xs text-gray-500">pH Level</p>
                      <p className="text-sm font-semibold text-gray-900">{record.phLevel!.toFixed(1)}</p>
                    </div>
                  </div>
                )}

                {record.temperature !== null && (
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">Temperature</p>
                      <p className="text-sm font-semibold text-gray-900">{record.temperature}°C</p>
                    </div>
                  </div>
                )}

                {record.organicMatter !== null && (
                  <div className="flex items-center gap-2">
                    <Wind className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-xs text-gray-500">Organic Matter</p>
                      <p className="text-sm font-semibold text-gray-900">{record.organicMatter}%</p>
                    </div>
                  </div>
                )}
              </div>

              {(record.nitrogenLevel !== null || record.phosphorusLevel !== null || record.potassiumLevel !== null) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">NPK Levels (ppm)</p>
                  <div className="flex gap-4">
                    {record.nitrogenLevel !== null && (
                      <div>
                        <p className="text-xs text-gray-500">N</p>
                        <p className="text-sm font-semibold text-gray-900">{record.nitrogenLevel}</p>
                      </div>
                    )}
                    {record.phosphorusLevel !== null && (
                      <div>
                        <p className="text-xs text-gray-500">P</p>
                        <p className="text-sm font-semibold text-gray-900">{record.phosphorusLevel}</p>
                      </div>
                    )}
                    {record.potassiumLevel !== null && (
                      <div>
                        <p className="text-xs text-gray-500">K</p>
                        <p className="text-sm font-semibold text-gray-900">{record.potassiumLevel}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 text-xs text-gray-500">
                Recorded: {new Date(record.recordedAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
