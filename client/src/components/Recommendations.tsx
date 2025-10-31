import { useEffect, useState } from 'react';
import { Lightbulb, DollarSign, CheckCircle, XCircle, Filter, Download, Target, Star, Calendar, AlertTriangle } from 'lucide-react';
import { recommendationsAPI } from '../lib/api';
import type { Recommendation as APIRecommendation } from '../lib/api';
import { exportToCSV } from '../lib/csvExport';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<APIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const response = await recommendationsAPI.getAllRecommendations();
      const apiRecommendations = Array.isArray(response.data) ? response.data : [];

      setRecommendations(apiRecommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'implemented') {
        updates.implementedAt = new Date().toISOString();
      }

      const response = await recommendationsAPI.updateRecommendation(id, updates);
      const updatedRecommendation = response.data.recommendation;

      setRecommendations((prev) =>
        prev.map((rec) =>
          rec._id === id ? updatedRecommendation : rec
        )
      );
    } catch (error) {
      console.error('Error updating recommendation:', error);
    }
  };

  const handleExportCSV = () => {
    const csvData = filteredRecommendations.map(rec => ({
      Title: rec.title,
      Description: rec.description,
      Priority: rec.priority,
      Status: rec.status,
      'Estimated Cost': rec.estimatedCost,
      'AI Confidence': rec.aiConfidence ? `${(rec.aiConfidence * 100).toFixed(0)}%` : 'N/A',
      'Prediction Type': rec.predictionType || 'N/A',
      'Timeframe': rec.predictionTimeframe || 'N/A',
      'Created At': new Date(rec.createdAt).toLocaleDateString(),
      'Implemented At': rec.implementedAt ? new Date(rec.implementedAt).toLocaleDateString() : 'N/A'
    }));
    exportToCSV(csvData, 'recommendations');
    setShowExportMenu(false);
  };

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Recommendations Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

    let yPosition = 50;
    filteredRecommendations.slice(0, 20).forEach(rec => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text(rec.title, 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Priority: ${rec.priority.toUpperCase()} | Status: ${rec.status}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Cost: $${rec.estimatedCost.toLocaleString()}`, 20, yPosition);
      yPosition += 8;
      if (rec.aiConfidence) {
        doc.text(`AI Confidence: ${(rec.aiConfidence * 100).toFixed(0)}%`, 20, yPosition);
        yPosition += 8;
      }
      doc.text(rec.description.substring(0, 100) + '...', 20, yPosition);
      yPosition += 15;
    });

    doc.save(`recommendations-${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesPriority = filterPriority === 'all' || rec.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || rec.status === filterStatus;
    return matchesPriority && matchesStatus;
  });

  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => {
    // Sort by priority first (high > medium > low)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
    if (priorityDiff !== 0) return priorityDiff;

    // Then by AI confidence
    if (a.aiConfidence && b.aiConfidence) {
      return b.aiConfidence - a.aiConfidence;
    }

    // Finally by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented':
        return 'bg-emerald-100 text-emerald-700';
      case 'dismissed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const pendingRecs = recommendations.filter((r) => r.status === 'pending');
  const implementedRecs = recommendations.filter((r) => r.status === 'implemented');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Land Restoration Recommendations</h2>
            <p className="text-amber-50">
              AI-powered suggestions for improving soil health and land vitality
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="implemented">Implemented</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Showing {sortedRecommendations.length} recommendations</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Lightbulb className="w-6 h-6 text-amber-600" />
            <div>
              <p className="text-sm text-gray-500">Pending Actions</p>
              <p className="text-2xl font-bold text-gray-900">{pendingRecs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="text-sm text-gray-500">Implemented</p>
              <p className="text-2xl font-bold text-gray-900">{implementedRecs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
          <p className="text-gray-600">
            AI recommendations will appear here based on your land health data
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedRecommendations.map((rec) => (
            <div
              key={rec._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="bg-amber-50 p-2 rounded-lg flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium uppercase border ${getPriorityColor(
                            rec.priority
                          )}`}
                        >
                          {rec.priority}
                        </span>
                        {rec.aiConfidence && rec.aiConfidence > 0.8 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            <Star className="w-3 h-3" />
                            High Confidence
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rec.status)}`}>
                        {rec.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{rec.description}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 ml-11 mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Estimated Cost</p>
                    <p className="text-sm font-semibold text-gray-900">
                      ${rec.estimatedCost.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Expected Impact</p>
                    <p className="text-sm font-semibold text-gray-900">
                      High
                    </p>
                  </div>
                </div>

                {rec.aiConfidence !== null && rec.aiConfidence !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded flex-shrink-0"></div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">AI Confidence</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {(rec.aiConfidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                )}

                {rec.predictionTimeframe && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Timeframe</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {rec.predictionTimeframe.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                )}

                {rec.predictionType && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {rec.predictionType.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {rec.status === 'pending' && (
                <div className="flex flex-col sm:flex-row gap-2 ml-11 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleStatusUpdate(rec._id, 'implemented')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Implemented
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(rec._id, 'dismissed')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    Dismiss
                  </button>
                </div>
              )}

              {rec.implementedAt && (
                <div className="ml-11 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Implemented on {new Date(rec.implementedAt).toLocaleDateString()}
                  </div>
                </div>
              )}

              <div className="ml-11 pt-2 border-t border-gray-100 text-xs text-gray-500 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span>Created: {new Date(rec.createdAt).toLocaleDateString()}</span>
                {rec.status === 'pending' && (
                  <span className="text-amber-600 font-medium">Action Required</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
