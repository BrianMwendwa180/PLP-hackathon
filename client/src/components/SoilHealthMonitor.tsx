import { useEffect, useState } from 'react';
import { Activity, Droplet, Wind, Thermometer, CloudRain, Mountain, TrendingUp, TrendingDown, AlertTriangle, Download, BarChart3 } from 'lucide-react';
import { soilHealthAPI } from '../lib/api';
import type { SoilHealthRecord as APISoilHealthRecord } from '../lib/api';
import { useSocket } from '../contexts/SocketContext';
import { exportToCSV } from '../lib/csvExport';
import { moduleInteractionAPI } from '../lib/enhancedApi';

export default function SoilHealthMonitor() {
  const [records, setRecords] = useState<APISoilHealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    loadSoilHealth();
    // Track module access
    moduleInteractionAPI.trackModuleAccess('SoilHealthMonitor').catch(console.error);

    // Join parcel room for real-time updates (assuming we have a way to get current parcel)
    // For now, we'll listen to all sensor updates
    if (socket) {
      const handleSensorUpdate = (data: any) => {
        console.log('Real-time sensor update:', data);
        // Refresh data when sensor update is received
        loadSoilHealth();
      };

      socket.on('sensorUpdate', handleSensorUpdate);

      return () => {
        socket.off('sensorUpdate', handleSensorUpdate);
      };
    }
  }, [socket]);

  const loadSoilHealth = async () => {
    try {
      const response = await soilHealthAPI.getAllRecords();
      const apiRecords = Array.isArray(response.data) ? response.data : [];

      setRecords(apiRecords.slice(0, 10)); // Show more records for better analysis
    } catch (error) {
      console.error('Error loading soil health:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvData = records.map(record => ({
      Date: new Date(record.recordedAt).toLocaleDateString(),
      'Vitality Score': record.vitalityScore,
      'pH Level': record.phLevel,
      'Moisture Level': record.moistureLevel,
      'Nitrogen': record.nitrogenLevel,
      'Phosphorus': record.phosphorusLevel,
      'Potassium': record.potassiumLevel,
      'Organic Matter': record.organicMatter,
      'Temperature': record.temperature,
      'Rainfall': record.rainfall,
      'Erosion Rate': record.erosionRate,
      'Data Source': record.dataSource
    }));
    exportToCSV(csvData, 'soil-health-data');
    setShowExportMenu(false);
  };

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Soil Health Monitoring Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

    let yPosition = 50;
    records.slice(0, 10).forEach(record => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text(`Vitality Score: ${record.vitalityScore}`, 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`pH: ${record.phLevel?.toFixed(1) || 'N/A'} | Moisture: ${record.moistureLevel || 'N/A'}%`, 20, yPosition);
      yPosition += 8;
      doc.text(`Temperature: ${record.temperature || 'N/A'}°C | Rainfall: ${record.rainfall || 'N/A'} mm`, 20, yPosition);
      yPosition += 8;
      doc.text(`Date: ${new Date(record.recordedAt).toLocaleDateString()}`, 20, yPosition);
      yPosition += 15;
    });

    doc.save(`soil-health-report-${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  const getTrendIndicator = (current: number, previous?: number) => {
    if (!previous) return null;
    const change = current - previous;
    const percentChange = Math.abs(change / previous) * 100;

    if (Math.abs(change) < 1) return null; // No significant change

    return {
      direction: change > 0 ? 'up' : 'down',
      percent: percentChange.toFixed(1),
      icon: change > 0 ? TrendingUp : TrendingDown,
      color: change > 0 ? 'text-green-600' : 'text-red-600'
    };
  };

  const getAIAlerts = (record: APISoilHealthRecord) => {
    const alerts = [];

    if (record.vitalityScore < 40) {
      alerts.push({
        type: 'critical',
        message: 'Critical soil degradation detected',
        icon: AlertTriangle,
        color: 'text-red-600 bg-red-50'
      });
    } else if (record.vitalityScore < 60) {
      alerts.push({
        type: 'warning',
        message: 'Soil health declining - action recommended',
        icon: AlertTriangle,
        color: 'text-amber-600 bg-amber-50'
      });
    }

    if (record.erosionRate && record.erosionRate > 5) {
      alerts.push({
        type: 'erosion',
        message: 'High erosion risk detected',
        icon: Mountain,
        color: 'text-orange-600 bg-orange-50'
      });
    }

    return alerts;
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">AI-Driven Soil Health Scoring</h2>
            <p className="text-emerald-50">
              Real-time monitoring and predictive analysis of land vitality
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-t-lg transition-colors"
                >
                  Export as CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full text-left px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-b-lg transition-colors"
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Soil Health Data Yet</h3>
          <p className="text-gray-600">Start monitoring your land to see health metrics here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record, index) => {
            const previousRecord = records[index + 1];
            const trend = record.vitalityScore ? getTrendIndicator(record.vitalityScore, previousRecord?.vitalityScore) : null;
            const alerts = getAIAlerts(record);

            return (
              <div
                key={record._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 gap-4">
                  <div className="flex-1">
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
                      {trend && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trend.color} bg-opacity-20`}>
                          <trend.icon className="w-3 h-3" />
                          {trend.direction === 'up' ? '+' : ''}{trend.percent}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right lg:text-left">
                    <p className="text-sm text-gray-500">Data Source</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {record.dataSource.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {alerts.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {alerts.map((alert, alertIndex) => (
                      <div key={alertIndex} className={`flex items-center gap-2 p-3 rounded-lg ${alert.color} border-l-4 border-current`}>
                        <alert.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{alert.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                  {record.moistureLevel !== null && (
                    <div className="flex items-center gap-2">
                      <Droplet className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 truncate">Moisture</p>
                        <p className="text-sm font-semibold text-gray-900">{record.moistureLevel}%</p>
                      </div>
                    </div>
                  )}

                  {record.phLevel !== null && (
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 truncate">pH Level</p>
                        <p className="text-sm font-semibold text-gray-900">{record.phLevel!.toFixed(1)}</p>
                      </div>
                    </div>
                  )}

                  {record.temperature !== null && (
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 truncate">Temperature</p>
                        <p className="text-sm font-semibold text-gray-900">{record.temperature}°C</p>
                      </div>
                    </div>
                  )}

                  {record.organicMatter !== null && (
                    <div className="flex items-center gap-2">
                      <Wind className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 truncate">Organic Matter</p>
                        <p className="text-sm font-semibold text-gray-900">{record.organicMatter}%</p>
                      </div>
                    </div>
                  )}

                  {record.rainfall !== null && (
                    <div className="flex items-center gap-2">
                      <CloudRain className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 truncate">Rainfall</p>
                        <p className="text-sm font-semibold text-gray-900">{record.rainfall} mm</p>
                      </div>
                    </div>
                  )}

                  {record.erosionRate !== null && (
                    <div className="flex items-center gap-2">
                      <Mountain className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 truncate">Erosion Rate</p>
                        <p className="text-sm font-semibold text-gray-900">{record.erosionRate} tons/ha</p>
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

                <div className="mt-4 text-xs text-gray-500 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <span>Recorded: {new Date(record.recordedAt).toLocaleString()}</span>
                  {index === 0 && (
                    <div className="mt-2 sm:mt-0 flex items-center gap-2 text-emerald-600">
                      <BarChart3 className="w-3 h-3" />
                      <span className="font-medium">Most Recent</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
